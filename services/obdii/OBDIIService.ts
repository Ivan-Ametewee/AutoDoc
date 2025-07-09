import { EventEmitter } from 'events';
import BluetoothService from '../bluetooth/BluetoothService';
import WiFiManager from '../wifi/WiFiManager';
import { simulationService } from '../simulation/SimulationService';
import { OBDIIParser, ParsedPIDData } from './OBDIIParser';
import { PIDDefinition, PIDDefinitions } from './PIDDefinitions';
import MockDataGenerator from '../simulation/MockDataGenerator';

// --- Type Definitions ---
type ConnectionType = 'bluetooth' | 'wifi' | 'simulation';
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type SubscriberCallback = (event: string, data: any) => void;

interface ConnectionInfo {
  status: ConnectionStatus;
  type: ConnectionType | null;
  device?: any;
  error?: string;
}

interface CommandQueueItem {
  command: string;
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
  timestamp: number;
  retries?: number;
}

// --- Central OBD-II Service ---
class OBDIIService extends EventEmitter {
  private connectionInfo: ConnectionInfo;
  private commService: typeof BluetoothService | typeof WiFiManager | null = null;
  private subscribers: Set<SubscriberCallback> = new Set();
  private commandQueue: CommandQueueItem[] = [];
  private isProcessingQueue = false;
  private activePollingPIDs: Map<string, number> = new Map();
  private mockDataGenerator: typeof MockDataGenerator;
  private supportedPIDs: Set<string> = new Set();
  private isInitialized = false;

  // **IMPROVED**: Better response handling
  private responseBuffer = '';
  private currentCommand: CommandQueueItem | null = null;
  private commandTimeout = 5000; // 5 seconds
  private maxRetries = 3;

  constructor() {
    super();
    this.connectionInfo = {
      status: 'disconnected',
      type: null,
    };
    this.setMaxListeners(20);
    this.mockDataGenerator = MockDataGenerator;
  }

  // --- Connection & State Management ---

  public async connect(device: any, type: 'bluetooth' | 'wifi'): Promise<boolean> {
    if (this.connectionInfo.status === 'connected' || this.connectionInfo.status === 'connecting') {
      console.log('Already connected or connecting');
      return false;
    }
    
    this.updateConnectionInfo('connecting', type, device);

    try {
      simulationService.stopSimulation();
      let isConnected = false;
      
      if (type === 'bluetooth') {
        this.commService = BluetoothService;
        await this.commService.initialize();
        isConnected = await this.commService.connectToDevice(device);
      } else if (type === 'wifi') {
        this.commService = WiFiManager;
        isConnected = await this.commService.connectToOBDNetwork(device.ssid, device.password);
      }

      if (isConnected && this.commService) {
        this.commService.on('dataReceived', this.handleDataReceived);
        this.commService.on('deviceDisconnected', this.handleDisconnection);
        
        // **CRITICAL**: Initialize the adapter with proper error handling
        await this.initializeAdapter();
        await this.discoverSupportedPIDs();
        
        this.isInitialized = true;
        this.updateConnectionInfo('connected', type, device);
        console.log('OBD-II connection fully established and initialized');
        return true;
      } else {
        throw new Error(`Failed to establish ${type} connection`);
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      await this.disconnect();
      this.updateConnectionInfo('error', type, device, error.message);
      return false;
    }
  }

  public enableSimulation(): void {
    if (this.connectionInfo.status === 'connected') return;
    this.updateConnectionInfo('connected', 'simulation');
    simulationService.startSimulation();
    simulationService.registerCallback(this.handleSimulationData);
    this.isInitialized = true;
  }

  public async disconnect(): Promise<void> {
    console.log('Disconnecting OBD-II service...');
    
    this.stopAllPolling();
    this.isInitialized = false;
    
    if (this.connectionInfo.type === 'simulation') {
      simulationService.stopSimulation();
    } else if (this.commService) {
      await this.commService.disconnect();
      this.commService.removeListener('dataReceived', this.handleDataReceived);
      this.commService.removeListener('deviceDisconnected', this.handleDisconnection);
    }
    
    // Clear command queue
    if (this.currentCommand) {
      this.currentCommand.reject(new Error("Disconnected"));
    }
    this.commandQueue.forEach(cmd => cmd.reject(new Error("Disconnected")));
    this.commandQueue = [];
    this.currentCommand = null;
    this.isProcessingQueue = false;
    this.responseBuffer = '';
    
    this.updateConnectionInfo('disconnected', null);
    this.commService = null;
  }

  private handleDisconnection = () => {
    console.log('Connection lost, attempting to disconnect cleanly');
    this.disconnect();
  };

  private updateConnectionInfo(status: ConnectionStatus, type: ConnectionType | null, device?: any, error?: string) {
    this.connectionInfo = { status, type, device, error };
    this.notifySubscribers('connectionStatus', this.connectionInfo);
  }

  public subscribe(callback: SubscriberCallback): () => void {
    this.subscribers.add(callback);
    // Immediately send current connection status
    callback('connectionStatus', this.connectionInfo);
    return () => this.subscribers.delete(callback);
  }

  public getConnectionStatus(): ConnectionInfo {
    return this.connectionInfo;
  }

  private notifySubscribers(event: string, data: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  // --- Command & Data Processing ---

  public async initializeAdapter(): Promise<void> {
    console.log('Initializing OBD-II adapter...');
    
    try {
      // Reset the adapter first
      await this.sendCommand('ATZ');
      await this.delay(2000); // Wait for reset to complete

      // Turn off echo to avoid command/response confusion
      await this.sendCommand('ATE0');
      await this.delay(1000);

      // Set automatic protocol detection
      await this.sendCommand('ATSP0');
      await this.delay(1000);

      // Set line feeds off for cleaner responses
      await this.sendCommand('ATL0');
      await this.delay(1000);

      // Set headers off to get raw data only
      await this.sendCommand('ATH0');
      await this.delay(1000);

      // Set spaces off for more compact responses
      await this.sendCommand('ATS0');
      await this.delay(1000);

      // Additional WiFi-specific configuration
      if (this.connectionInfo.type === 'wifi') {
        // Set timeout for WiFi adapters
        await this.sendCommand('ATST32');
        await this.delay(1000);
      }

      console.log('OBD-II adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize adapter:', error);
      throw error;
    }
  }

  public async discoverSupportedPIDs(): Promise<void> {
    console.log('Discovering supported PIDs...');
    this.supportedPIDs.clear();

    try {
      // Query for PIDs 01-20 (Mode 01, PID 00)
      const response = await this.sendCommand('0100');
      console.log('PID support response:', response);
      
      if (response && response.length >= 12) { // Should be at least "4100XXXXXXXX"
        const cleanResponse = response.replace(/[\s>]/g, '');
        
        if (cleanResponse.startsWith('4100')) {
          const hexData = cleanResponse.substring(4);
          console.log('PID support hex data:', hexData);
          
          // Convert hex to binary to check which PIDs are supported
          const supportBits = this.hexToBinary(hexData);
          console.log('PID support bits:', supportBits);
          
          const allPIDs = PIDDefinitions.getAllPIDs();
          
          // Check each bit position
          for (let i = 0; i < Math.min(supportBits.length, 32); i++) {
            if (supportBits[i] === '1') {
              const pidNumber = (i + 1).toString(16).toUpperCase().padStart(2, '0');
              const pidDef = allPIDs.find(def => def.pid === pidNumber && def.mode === '01');
              
              if (pidDef) {
                this.supportedPIDs.add(pidDef.name);
                console.log(`Supported PID found: ${pidDef.name} (${pidNumber})`);
              }
            }
          }
        }
      }
      
      // Add some common PIDs that might not be reported but often work
      const commonPIDs = ['ENGINE_RPM', 'VEHICLE_SPEED', 'ENGINE_COOLANT_TEMP', 'ENGINE_LOAD'];
      commonPIDs.forEach(pid => {
        if (!this.supportedPIDs.has(pid)) {
          this.supportedPIDs.add(pid);
          console.log(`Added common PID: ${pid}`);
        }
      });

      console.log(`Discovered ${this.supportedPIDs.size} supported PIDs:`, Array.from(this.supportedPIDs));
      this.notifySubscribers('supportedPIDsDiscovered', Array.from(this.supportedPIDs));
    } catch (error) {
      console.error('Failed to discover supported PIDs:', error);
      // Add fallback PIDs if discovery fails
      const fallbackPIDs = ['ENGINE_RPM', 'VEHICLE_SPEED', 'ENGINE_COOLANT_TEMP', 'ENGINE_LOAD', 'THROTTLE_POSITION'];
      fallbackPIDs.forEach(pid => this.supportedPIDs.add(pid));
      console.log('Using fallback PIDs:', Array.from(this.supportedPIDs));
    }
  }

  private hexToBinary(hex: string): string {
    let binary = '';
    for (let i = 0; i < hex.length; i += 2) {
      const hexByte = hex.substring(i, i + 2);
      const byte = parseInt(hexByte, 16);
      binary += byte.toString(2).padStart(8, '0');
    }
    return binary;
  }

  public isPIDSupported(pidName: string): boolean {
    return this.supportedPIDs.has(pidName);
  }

  public sendCommand(command: string, retries: number = 3): Promise<string> {
    if (this.connectionInfo.type === 'simulation') {
      return new Promise(resolve => setTimeout(() => resolve('SIMULATED_OK'), 100));
    }

    return new Promise((resolve, reject) => {
      const commandItem: CommandQueueItem = {
        command,
        resolve,
        reject,
        timestamp: Date.now(),
        retries
      };
      
      this.commandQueue.push(commandItem);
      
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.commandQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.commandQueue.length > 0) {
      this.currentCommand = this.commandQueue.shift()!;
      
      try {
        if (!this.commService) {
          throw new Error('Communication service unavailable');
        }

        console.log(`Sending command: ${this.currentCommand.command}`);

        // Clear response buffer before sending command
        this.responseBuffer = '';

        // Set up timeout
        const timeoutId = setTimeout(() => {
          if (this.currentCommand) {
            console.log(`Command timeout: ${this.currentCommand.command}`);
            
            // Check if retries are available
            if (this.currentCommand.retries && this.currentCommand.retries > 0) {
              console.log(`Retrying command: ${this.currentCommand.command}, retries left: ${this.currentCommand.retries - 1}`);
              
              // Retry the command with decremented retry count
              const retryCommand = {
                ...this.currentCommand,
                retries: this.currentCommand.retries - 1,
                timestamp: Date.now()
              };
              
              this.commandQueue.unshift(retryCommand); // Add to front of queue
              this.currentCommand = null;
            } else {
              this.currentCommand.reject(new Error(`Command timeout: ${this.currentCommand.command}`));
              this.currentCommand = null;
            }
          }
        }, this.commandTimeout);

        // Send the command (don't add \r if already present)
        const commandToSend = this.currentCommand.command.endsWith('\r') ? 
          this.currentCommand.command : this.currentCommand.command + '\r';
        const success = await this.commService.sendData(commandToSend);
        
        if (!success) {
          clearTimeout(timeoutId);
          this.currentCommand.reject(new Error('Failed to send command'));
          this.currentCommand = null;
          continue;
        }

        // Wait for response (the response will be handled in handleDataReceived)
        // The timeout will handle cases where no response comes
        await new Promise<void>((resolve, reject) => {
          const originalResolve = this.currentCommand!.resolve;
          const originalReject = this.currentCommand!.reject;

          this.currentCommand!.resolve = (value: string) => {
            clearTimeout(timeoutId);
            originalResolve(value);
            resolve();
          };

          this.currentCommand!.reject = (reason: any) => {
            clearTimeout(timeoutId);
            originalReject(reason);
            reject(reason);
          };
        });

        this.currentCommand = null;
        
        // Small delay between commands
        await this.delay(50);

      } catch (error: any) {
        console.error('Error processing command:', error);
        if (this.currentCommand) {
          this.currentCommand.reject(error);
          this.currentCommand = null;
        }
        
        // Continue with next command even if this one failed
        continue;
      }
    }

    this.isProcessingQueue = false;
  }

  private handleDataReceived = (data: any) => {
    console.log('Raw data received:', JSON.stringify(data));
    
    // Extract the actual data string from the event object
    const dataString = typeof data === 'string' ? data : data.data || '';
    
    this.responseBuffer += dataString;

    // Split by common terminators, but also handle responses without line endings
    const responses = this.responseBuffer.split(/[\r\n]+/);
    
    // Keep the last incomplete response in buffer
    this.responseBuffer = responses.pop() || '';

    // Process all complete responses
    for (const response of responses) {
      const trimmedResponse = response.trim();
      
      if (trimmedResponse.length === 0) continue;

      console.log('Processing response:', trimmedResponse);

      // Handle command responses
      if (this.currentCommand && this.isCommandResponse(trimmedResponse, this.currentCommand.command)) {
        console.log(`Command response for ${this.currentCommand.command}:`, trimmedResponse);
        this.currentCommand.resolve(trimmedResponse);
        this.currentCommand = null; // Clear the current command
        continue;
      }

      // Try to parse as OBD data
      if (OBDIIParser.isValidOBDResponse(trimmedResponse)) {
        const parsedData = OBDIIParser.parse(trimmedResponse);
        if (parsedData) {
          console.log('Parsed OBD data:', parsedData);
          this.notifySubscribers('dataUpdate', parsedData);
        }
      }
    }

    // Check if buffer contains a complete response without line endings
    if (this.responseBuffer.length > 0 && this.currentCommand) {
      const trimmedBuffer = this.responseBuffer.trim();
      if (this.isCommandResponse(trimmedBuffer, this.currentCommand.command)) {
        console.log(`Command response for ${this.currentCommand.command}:`, trimmedBuffer);
        this.currentCommand.resolve(trimmedBuffer);
        this.currentCommand = null; // Clear the current command
        this.responseBuffer = ''; // Clear the buffer
      }
    }
  };

  private isCommandResponse(response: string, command: string): boolean {
    const cleanResponse = response.replace(/[\s>]/g, '').toUpperCase();
    const cleanCommand = command.replace(/[\s\r\n]/g, '').toUpperCase();

    // Check for direct command echo
    if (cleanResponse === cleanCommand) return false;

    // Check for OK response
    if (cleanResponse === 'OK') return true;

    // Check for error responses
    if (cleanResponse.includes('ERROR') || cleanResponse.includes('?')) return true;

    // Check for specific command responses
    if (cleanCommand.startsWith('AT')) {
      // Special handling for ATZ reset command - responds with ELM327 version OR just OK
      if (cleanCommand === 'ATZ' && (cleanResponse.includes('ELM327') || cleanResponse === 'OK')) {
        return true;
      }
      // Other AT commands typically return OK or error
      if (cleanResponse === 'OK' || cleanResponse.includes('ERROR')) {
        return true;
      }
      return false; // Don't assume all AT responses are complete
    }

    // Check for OBD response pattern (mode + 0x40)
    if (cleanCommand.length >= 4) {
      const commandMode = cleanCommand.substring(0, 2);
      const responseMode = (parseInt(commandMode, 16) + 0x40).toString(16).toUpperCase().padStart(2, '0');
      
      if (cleanResponse.startsWith(responseMode)) {
        return true;
      }
    }

    return false;
  }

  public async queryPID(pidName: string): Promise<ParsedPIDData | null> {
    if (!this.isInitialized) {
      console.warn('OBD-II service not initialized');
      return null;
    }

    const pid = PIDDefinitions.getPID(pidName);
    if (!pid) {
      console.error(`PID not found: ${pidName}`);
      return null;
    }

    if (this.connectionInfo.type === 'simulation') {
      const simulatedValue = this.mockDataGenerator.generatePIDData(pid.name);
      const parsedData: ParsedPIDData = {
        name: pid.name,
        value: simulatedValue,
        unit: pid.unit,
        timestamp: new Date(),
        raw: `simulated:${simulatedValue}`,
        mode: pid.mode,
        pid: pid.pid,
      };
      this.notifySubscribers('dataUpdate', parsedData);
      return parsedData;
    }

    try {
      const command = pid.mode + pid.pid;
      console.log(`Querying PID ${pidName} with command: ${command}`);
      
      const rawResponse = await this.sendCommand(command);
      console.log(`Response for ${pidName}:`, rawResponse);
      
      if (!rawResponse || rawResponse.includes('NO DATA') || rawResponse.includes('ERROR')) {
        console.warn(`No data or error for PID: ${pidName}`);
        return null;
      }

      const parsedData = OBDIIParser.parse(rawResponse);
      if (parsedData) {
        console.log(`Successfully parsed ${pidName}:`, parsedData);
        this.notifySubscribers('dataUpdate', parsedData);
      }
      
      return parsedData;
    } catch (error) {
      console.error(`Error querying PID ${pidName}:`, error);
      return null;
    }
  }

  // --- Polling Methods ---

  public startPollingPID(pidName: string, interval = 1000): void {
    if (this.activePollingPIDs.has(pidName)) {
      console.log(`Already polling ${pidName}`);
      return;
    }

    console.log(`Starting to poll ${pidName} every ${interval}ms`);

    const pollingId = setInterval(async () => {
      if (this.connectionInfo.status !== 'connected') {
        console.log(`Stopping poll for ${pidName} - not connected`);
        this.stopPollingPID(pidName);
        return;
      }

      try {
        await this.queryPID(pidName);
      } catch (error) {
        console.error(`Error during polling of ${pidName}:`, error);
        // Don't stop polling for single errors, just log them
      }
    }, interval);

    this.activePollingPIDs.set(pidName, pollingId as unknown as number);
  }

  public stopPollingPID(pidName: string): void {
    const pollingId = this.activePollingPIDs.get(pidName);
    if (pollingId) {
      clearInterval(pollingId);
      this.activePollingPIDs.delete(pidName);
      console.log(`Stopped polling ${pidName}`);
    }
  }

  public stopAllPolling(): void {
    console.log('Stopping all PID polling');
    this.activePollingPIDs.forEach((intervalId, pidName) => {
      clearInterval(intervalId);
      console.log(`Stopped polling ${pidName}`);
    });
    this.activePollingPIDs.clear();
  }

  private handleSimulationData = (eventType: string, data: any) => {
    if (eventType === 'data_update') {
      this.notifySubscribers('dataUpdate', data);
    }
  };

  public startLiveData(): void {
    if (this.connectionInfo.status !== 'connected') {
      console.warn('Cannot start live data - not connected');
      return;
    }

    console.log('Starting live data stream...');

    const dashboardPIDs = [
      'ENGINE_RPM',
      'VEHICLE_SPEED', 
      'ENGINE_COOLANT_TEMP',
      'ENGINE_LOAD',
      'THROTTLE_POSITION',
      'FUEL_LEVEL'
    ];

    // Start polling each supported PID
    dashboardPIDs.forEach(pidName => {
      const isSimulation = this.connectionInfo.type === 'simulation';
      const pidSupported = this.isPIDSupported(pidName);
      const noDiscoveredPIDs = this.supportedPIDs.size === 0;
      
      if (pidSupported || isSimulation) {
        this.startPollingPID(pidName, 1500); // Slightly longer interval to avoid overwhelming
      } else if (!isSimulation && noDiscoveredPIDs) {
        // If no PIDs discovered yet (discovery failed), try polling common PIDs anyway
        console.log(`PID discovery failed, attempting to poll common PID: ${pidName}`);
        this.startPollingPID(pidName, 1500);
      } else {
        console.log(`Skipping unsupported PID: ${pidName}`);
      }
    });

    console.log(`Started live data for ${this.activePollingPIDs.size} PIDs`);
  }

  public stopLiveData(): void {
    console.log("Stopping live data stream...");
    this.stopAllPolling();
  }

  // --- Utility Methods ---

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getActivePollingPIDs(): string[] {
    return Array.from(this.activePollingPIDs.keys());
  }

  public getSupportedPIDs(): string[] {
    return Array.from(this.supportedPIDs);
  }

  public isThisInitialized(): boolean {
    return this.isInitialized;
  }
}

export default new OBDIIService();