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
        //await this.discoverSupportedPIDs();
        
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
      //await this.sendCommand('ATE0');
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
      'FUEL_LEVEL',
      'INTAKE_AIR_TEMP',
      'MAF_RATE'
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

  // --- DTC Methods ---

  public async queryFreezeFrameData(dtcCode: string): Promise<any> {
    if (!this.isInitialized) {
      console.warn('OBD-II service not initialized');
      throw new Error('Service not initialized');
    }

    console.log(`Querying freeze frame data for DTC: ${dtcCode}`);

    if (this.connectionInfo.type === 'simulation') {
      // Return cached freeze frame data for this specific DTC
      const simulatedData = this.mockDataGenerator.getFreezeFrameForDTC(dtcCode);
      return simulatedData;
    }

    try {
      // Mode 02: Show freeze frame data
      // Query common PIDs for freeze frame: RPM, Speed, Coolant Temp, Engine Load
      const freezeFramePIDs = [
        { pid: '0C', name: 'ENGINE_RPM' },
        { pid: '0D', name: 'VEHICLE_SPEED' },
        { pid: '05', name: 'ENGINE_COOLANT_TEMP' },
        { pid: '04', name: 'ENGINE_LOAD' },
        { pid: '11', name: 'THROTTLE_POSITION' }
      ];

      const freezeFrameData: any = {
        timestamp: new Date()
      };

      // Query each PID for freeze frame data
      for (const pidInfo of freezeFramePIDs) {
        try {
          // Mode 02 command: 02 + PID + Frame Number (00 for first frame)
          const command = `02${pidInfo.pid}00`;
          const response = await this.sendCommand(command);
          
          if (response && !response.includes('NO DATA') && !response.includes('ERROR')) {
            const parsedValue = this.parseFreezeFrameResponse(response, pidInfo.pid);
            if (parsedValue !== null) {
              switch (pidInfo.name) {
                case 'ENGINE_RPM':
                  freezeFrameData.rpm = parsedValue;
                  break;
                case 'VEHICLE_SPEED':
                  freezeFrameData.speed = parsedValue;
                  break;
                case 'ENGINE_COOLANT_TEMP':
                  freezeFrameData.coolantTemp = parsedValue;
                  break;
                case 'ENGINE_LOAD':
                  freezeFrameData.engineLoad = parsedValue;
                  break;
                case 'THROTTLE_POSITION':
                  freezeFrameData.throttlePosition = parsedValue;
                  break;
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to get freeze frame data for PID ${pidInfo.pid}:`, error);
          // Continue with other PIDs even if one fails
        }
      }

      console.log('Freeze frame data retrieved:', freezeFrameData);
      return freezeFrameData;
    } catch (error) {
      console.error('Error querying freeze frame data:', error);
      throw error;
    }
  }

  private parseFreezeFrameResponse(response: string, pid: string): number | null {
    try {
      const cleanResponse = response.replace(/[\s>]/g, '').toUpperCase();
      
      // Check if response starts with 42 (Mode 02 response) + PID
      const expectedPrefix = `42${pid}`;
      if (!cleanResponse.startsWith(expectedPrefix)) {
        console.warn(`Invalid freeze frame response format for PID ${pid}:`, cleanResponse);
        return null;
      }

      // Extract data bytes (skip Mode, PID, and frame number)
      const dataStart = expectedPrefix.length + 2; // +2 for frame number
      const dataBytes = cleanResponse.substring(dataStart);
      
      if (dataBytes.length < 2) {
        console.warn(`Insufficient freeze frame data for PID ${pid}`);
        return null;
      }

      // Parse based on PID
      switch (pid) {
        case '0C': // ENGINE_RPM - 2 bytes, formula: ((A*256)+B)/4
          if (dataBytes.length >= 4) {
            const A = parseInt(dataBytes.substring(0, 2), 16);
            const B = parseInt(dataBytes.substring(2, 4), 16);
            return Math.round(((A * 256) + B) / 4);
          }
          break;
        case '0D': // VEHICLE_SPEED - 1 byte, formula: A
          return parseInt(dataBytes.substring(0, 2), 16);
        case '05': // ENGINE_COOLANT_TEMP - 1 byte, formula: A - 40
          return parseInt(dataBytes.substring(0, 2), 16) - 40;
        case '04': // ENGINE_LOAD - 1 byte, formula: A * 100/255
          return Math.round((parseInt(dataBytes.substring(0, 2), 16) * 100) / 255);
        case '11': // THROTTLE_POSITION - 1 byte, formula: A * 100/255
          return Math.round((parseInt(dataBytes.substring(0, 2), 16) * 100) / 255);
        default:
          console.warn(`Unknown PID for freeze frame parsing: ${pid}`);
          return null;
      }
    } catch (error) {
      console.error(`Error parsing freeze frame response for PID ${pid}:`, error);
      return null;
    }
    
    return null;
  }

  public async queryMILStatus(): Promise<{ milActive: boolean; dtcCount: number }> {
    if (!this.isInitialized) {
      console.warn('OBD-II service not initialized');
      throw new Error('Service not initialized');
    }

    console.log('Querying MIL status...');

    if (this.connectionInfo.type === 'simulation') {
      // Get MIL status from simulation service
      const milActive = simulationService.getMILStatus();
      const dtcs = simulationService.generateDTCs();
      const dtcCount = dtcs.filter(dtc => dtc.status === 'active').length;
      
      return { milActive, dtcCount };
    }

    try {
      // Mode 01, PID 01: Monitor status since DTCs cleared
      const response = await this.sendCommand('0101');
      console.log('MIL status response:', response);

      if (!response || response.includes('NO DATA') || response.includes('ERROR')) {
        console.warn('No MIL status data available');
        return { milActive: false, dtcCount: 0 };
      }

      // Parse MIL status response
      const milData = this.parseMILStatusResponse(response);
      console.log('Parsed MIL data:', milData);
      
      // Notify subscribers of MIL status
      this.notifySubscribers('milStatus', { active: milData.milActive });
      
      return milData;
    } catch (error) {
      console.error('Error querying MIL status:', error);
      throw error;
    }
  }

  private parseMILStatusResponse(response: string): { milActive: boolean; dtcCount: number } {
    try {
      // Clean the response
      const cleanResponse = response.replace(/[\s>]/g, '').toUpperCase();
      
      // Check if it starts with 41 01 (Mode 01, PID 01 response)
      if (!cleanResponse.startsWith('4101')) {
        console.warn('Invalid MIL status response format:', cleanResponse);
        return { milActive: false, dtcCount: 0 };
      }

      // Extract the status bytes (4 bytes after 4101)
      const statusData = cleanResponse.substring(4);
      
      if (statusData.length < 8) {
        console.warn('Incomplete MIL status data');
        return { milActive: false, dtcCount: 0 };
      }

      // First byte contains MIL status and DTC count
      const firstByte = parseInt(statusData.substring(0, 2), 16);
      
      // Bit 7 (MSB) indicates MIL status: 1 = ON, 0 = OFF
      const milActive = (firstByte & 0x80) !== 0;
      
      // Bits 0-6 contain DTC count (0-127)
      const dtcCount = firstByte & 0x7F;
      
      console.log(`MIL Status: ${milActive ? 'ON' : 'OFF'}, DTC Count: ${dtcCount}`);
      
      return { milActive, dtcCount };
    } catch (error) {
      console.error('Error parsing MIL status response:', error);
      return { milActive: false, dtcCount: 0 };
    }
  }

  public async scanDTC(): Promise<any[]> {
    if (!this.isInitialized) {
      console.warn('OBD-II service not initialized');
      throw new Error('Service not initialized');
    }

    console.log('Starting DTC scan...');

    if (this.connectionInfo.type === 'simulation') {
      // Simulate DTC scan with mock data
      const simulatedDTCs = this.mockDataGenerator.generateDTCs();
      console.log('Simulated DTC scan result:', simulatedDTCs);
      this.notifySubscribers('dtcScanComplete', simulatedDTCs);
      return simulatedDTCs;
    }

    try {
      // Mode 03: Request stored diagnostic trouble codes
      const response = await this.sendCommand('03');
      console.log('DTC scan response:', response);

      if (!response || response.includes('NO DATA') || response.includes('ERROR')) {
        console.log('No DTCs found');
        const noDTCs: any[] = [];
        this.notifySubscribers('dtcScanComplete', noDTCs);
        return noDTCs;
      }

      // Parse DTC response
      const dtcs = await this.parseDTCResponse(response);
      console.log('Parsed DTCs:', dtcs);
      
      this.notifySubscribers('dtcScanComplete', dtcs);
      return dtcs;
    } catch (error) {
      console.error('Error scanning DTCs:', error);
      throw error;
    }
  }

  public async clearDTC(): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('OBD-II service not initialized');
      throw new Error('Service not initialized');
    }

    console.log('Clearing DTCs...');

    if (this.connectionInfo.type === 'simulation') {
      // Simulate DTC clear with mock data through simulation service
      const success = simulationService.clearDTCs();
      console.log('Simulated DTC clear result:', success);
      
      if (success) {
        this.notifySubscribers('dtcCleared', { success: true });
        // Also trigger a MIL off event for dashboard
        this.notifySubscribers('milStatus', { active: false });
      }
      return success;
    }

    try {
      // Mode 04: Clear diagnostic trouble codes
      const response = await this.sendCommand('04');
      console.log('DTC clear response:', response);

      const success = Boolean(response && (response.includes('OK') || response === '44'));
      
      if (success) {
        console.log('DTCs cleared successfully');
        this.notifySubscribers('dtcCleared', { success: true });
        // Also trigger a MIL off event for dashboard
        this.notifySubscribers('milStatus', { active: false });
      } else {
        console.warn('Failed to clear DTCs');
        this.notifySubscribers('dtcCleared', { success: false });
      }
      
      return success;
    } catch (error) {
      console.error('Error clearing DTCs:', error);
      this.notifySubscribers('dtcCleared', { success: false });
      throw error;
    }
  }

  private async parseDTCResponse(response: string): Promise<any[]> {
    const dtcs: any[] = [];
    
    try {
      // Clean the response
      const cleanResponse = response.replace(/[\s>]/g, '').toUpperCase();
      
      // Check if it starts with 43 (Mode 03 response)
      if (!cleanResponse.startsWith('43')) {
        console.warn('Invalid DTC response format:', cleanResponse);
        return dtcs;
      }

      // Extract DTC count and data
      const dtcData = cleanResponse.substring(2);
      
      if (dtcData.length < 2) {
        console.log('No DTC data in response');
        return dtcs;
      }

      // Parse DTC codes (each DTC is 2 bytes = 4 hex characters)
      const dtcPromises: Promise<any>[] = [];
      
      for (let i = 0; i < dtcData.length; i += 4) {
        if (i + 3 < dtcData.length) {
          const dtcHex = dtcData.substring(i, i + 4);
          const dtcCode = this.convertHexToDTC(dtcHex);
          
          if (dtcCode && dtcCode !== 'P0000') {
            // Get DTC info from our database (now async)
            dtcPromises.push(this.getDTCFromDatabase(dtcCode));
          }
        }
      }
      
      // Wait for all DTC info to be retrieved
      const dtcInfos = await Promise.all(dtcPromises);
      dtcs.push(...dtcInfos);
    } catch (error) {
      console.error('Error parsing DTC response:', error);
    }

    return dtcs;
  }

  private convertHexToDTC(hex: string): string {
    try {
      const value = parseInt(hex, 16);
      
      // Extract system prefix
      const systemBits = (value & 0xC000) >> 14;
      const systemPrefixes = ['P', 'C', 'B', 'U'];
      const prefix = systemPrefixes[systemBits];
      
      // Extract remaining digits
      const firstDigit = (value & 0x3000) >> 12;
      const secondDigit = (value & 0x0F00) >> 8;
      const thirdDigit = (value & 0x00F0) >> 4;
      const fourthDigit = value & 0x000F;
      
      return `${prefix}${firstDigit}${secondDigit.toString(16).toUpperCase()}${thirdDigit.toString(16).toUpperCase()}${fourthDigit.toString(16).toUpperCase()}`;
    } catch (error) {
      console.error('Error converting hex to DTC:', error);
      return '';
    }
  }

  private async getDTCFromDatabase(code: string): Promise<any> {
    try {
      // Import DTCCodes class for real DTC lookup
      const { dtcCodes } = require('./DTCCodes');
      const dtcInfo = dtcCodes.getDTCInfo(code);
      
      // Get freeze frame data for this DTC
      let freezeFrameData = null;
      try {
        freezeFrameData = await this.queryFreezeFrameData(code);
      } catch (error) {
        console.warn(`Failed to get freeze frame data for ${code}:`, error);
        // Use default freeze frame data if query fails
        freezeFrameData = {
          rpm: 0,
          speed: 0,
          engineLoad: 0,
          coolantTemp: 0,
          timestamp: new Date(),
        };
      }
      
      return {
        code: dtcInfo.code,
        description: dtcInfo.description,
        severity: dtcInfo.severity,
        status: 'active',
        system: dtcInfo.system.toLowerCase(),
        freezeFrameData,
      };
    } catch (error) {
      console.error('Error getting DTC from database:', error);
      return {
        code,
        description: 'Unknown diagnostic trouble code',
        severity: 'medium',
        status: 'active',
        system: 'unknown',
        freezeFrameData: {
          rpm: 0,
          speed: 0,
          engineLoad: 0,
          coolantTemp: 0,
          timestamp: new Date(),
        },
      };
    }
  }
}

export default new OBDIIService();