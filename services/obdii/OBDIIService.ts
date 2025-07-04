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

  // **REFACTORED**: Simplified state for handling command responses
  private responseBuffer = '';
  private currentCommand: CommandQueueItem | null = null;

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
        this.updateConnectionInfo('connected', type, device);
        await this.initializeAdapter();
        await this.discoverSupportedPIDs();
        return true;
      } else {
        throw new Error(`The ${type} service failed to establish a connection.`);
      }
    } catch (error: any) {
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
  }

  public async disconnect(): Promise<void> {
    this.stopAllPolling();
    if (this.connectionInfo.type === 'simulation') {
      simulationService.stopSimulation();
    } else if (this.commService) {
      await this.commService.disconnect();
      this.commService.removeListener('dataReceived', this.handleDataReceived);
      this.commService.removeListener('deviceDisconnected', this.handleDisconnection);
    }
    if (this.currentCommand) {
      this.currentCommand.reject(new Error("Disconnected"));
    }
    this.commandQueue = [];
    this.currentCommand = null;
    this.isProcessingQueue = false;
    this.responseBuffer = '';
    this.updateConnectionInfo('disconnected', null);
    this.commService = null;
  }

  private handleDisconnection = () => this.disconnect();

  private updateConnectionInfo(status: ConnectionStatus, type: ConnectionType | null, device?: any, error?: string) {
    this.connectionInfo = { status, type, device, error };
    this.notifySubscribers('connectionStatus', this.connectionInfo);
  }

  public subscribe(callback: SubscriberCallback): () => void {
    this.subscribers.add(callback);
    callback('connectionStatus', this.connectionInfo);
    return () => this.subscribers.delete(callback);
  }

  public getConnectionStatus(): ConnectionInfo {
    return this.connectionInfo;
  }

  private notifySubscribers(event: string, data: any): void {
    this.subscribers.forEach(callback => callback(event, data));
  }

  // --- Command & Data Processing ---

  public async initializeAdapter(): Promise<void> {
    try {
      await this.sendCommand('ATZ');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.sendCommand('ATE0');
      await this.sendCommand('ATSP0');
      console.log('OBD-II adapter initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize adapter:', error);
      throw error;
    }
  }

  public async discoverSupportedPIDs(): Promise<void> {
    console.log('Discovering supported PIDs...');
    this.supportedPIDs.clear();

    try {
        // Query for PIDs 01-20
        const response = await this.sendCommand('0100');
        if (response.startsWith('4100')) {
            const hexData = response.substring(4).replace(/\s/g, '');

            if (hexData.length < 8) {
            // Convert the 4 bytes of hex data to a 32-bit binary string
            const binaryData = parseInt(hexData.substring(0, 8), 16).toString(2).padStart(32, '0');
            const allPIDs = PIDDefinitions.getAllPIDs();

            for (let i = 0; i < binaryData.length; i++) {
              if (binaryData[i] === '1') {
                  const pidNumber = (i + 1).toString(16).toUpperCase().padStart(2, '0');
                  // Find the PID name from our definitions list
                  const pidDef = allPIDs.find(def => def.pid === pidNumber && def.mode === '01');
                  if (pidDef) {
                      this.supportedPIDs.add(pidDef.name);
                  }
              }
            }
          }
        }
        console.log(`Discovered ${this.supportedPIDs.size} supported PIDs.`);
        this.notifySubscribers('supportedPIDsDiscovered', Array.from(this.supportedPIDs));
    } catch (error) {
        console.error('Failed to discover supported PIDs:', error);
    }
  }

  public isPIDSupported(pidName: string): boolean {
    return this.supportedPIDs.has(pidName);
  }

  public sendCommand(command: string): Promise<string> {
    if (this.connectionInfo.type === 'simulation') {
      return new Promise(resolve => setTimeout(() => resolve('OK'), 100));
    }
    return new Promise((resolve, reject) => {
      this.commandQueue.push({ command, resolve, reject });
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.commandQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    this.isProcessingQueue = true;
    this.currentCommand = this.commandQueue.shift()!;
    try {
      if (!this.commService) throw new Error('Communication service unavailable.');

      const timeoutId = setTimeout(() => {
        if (this.currentCommand) {
          this.currentCommand.reject(new Error(`Timeout on command: ${this.currentCommand.command}`));
          this.currentCommand = null;
          this.processQueue();
        }
      }, 15000); // 15-second timeout

      this.currentCommand.reject = (reason) => {
          clearTimeout(timeoutId);
          this.commandQueue.unshift(this.currentCommand!);
          this.currentCommand = null;
      };
      
      this.currentCommand.resolve = (value) => {
          clearTimeout(timeoutId);
      };
      
      await this.commService.sendData(this.currentCommand.command + '\r');
    } catch (error: any) {
      if (this.currentCommand) this.currentCommand.reject(error);
      this.isProcessingQueue = false;
    }
  }
  
  private handleDataReceived = (data: string) => {
    this.responseBuffer += data;
    
    // Split by any common terminator: carriage return, newline, or the '>' prompt.
    const terminators = /[\r\n>]/;
    let responses = this.responseBuffer.split(terminators);
    
    // If the buffer doesn't end with a terminator, the last element is an incomplete message.
    if (!terminators.test(this.responseBuffer.slice(-1))) {
        this.responseBuffer = responses.pop() || '';
    } else {
        this.responseBuffer = '';
    }
    
    responses.forEach(response => {
        const cleanedResponse = response.trim();
        if (cleanedResponse.length === 0 || cleanedResponse === this.currentCommand?.command) {
            // Ignore empty lines or echoed commands
            return;
        }

        if (this.currentCommand) {
            this.currentCommand.resolve(cleanedResponse);
            this.currentCommand = null;
            this.isProcessingQueue = false;
            this.processQueue(); // Process the next command immediately
        }
    });
  };

  public async queryPID(pidName: string): Promise<ParsedPIDData | null> {
    const pid = PIDDefinitions.getPID(pidName);
    if (!pid) throw new Error(`PID not found: ${pidName}`);

    if (this.connectionInfo.type === 'simulation') {
      const simulatedValue = this.mockDataGenerator.generatePIDData(pid.name);
      const parsedData: ParsedPIDData = {
        name: pid.name, value: simulatedValue, unit: pid.unit, timestamp: new Date(),
        raw: `simulated:${simulatedValue}`, mode: pid.mode, pid: pid.pid,
      };
      this.notifySubscribers('dataUpdate', parsedData);
      return parsedData;
    }

    try {
      const rawResponse = await this.sendCommand(pid.mode + pid.pid);
      if (rawResponse.includes('NO DATA')) {
        console.warn(`ECU does not support PID: ${pidName}`);
        return null;
      }

      const parsedData = OBDIIParser.parse(rawResponse);
      if (parsedData) {
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
    if (this.activePollingPIDs.has(pidName)) return;
    const pollingId = setInterval(async () => {
      if (this.connectionInfo.status !== 'connected') {
        this.stopPollingPID(pidName);
        return;
      }
      try {
        await this.queryPID(pidName);
      } catch (error) {
        console.error(`Error during polling of ${pidName}:`, error);
      }
    }, interval);
    this.activePollingPIDs.set(pidName, pollingId as unknown as number);
  }

  public stopPollingPID(pidName: string): void {
    const pollingId = this.activePollingPIDs.get(pidName);
    if (pollingId) {
      clearInterval(pollingId);
      this.activePollingPIDs.delete(pidName);
    }
  }

  public stopAllPolling(): void {
    this.activePollingPIDs.forEach(intervalId => clearInterval(intervalId));
    this.activePollingPIDs.clear();
  }

  private handleSimulationData = (eventType: string, data: any) => {
    if (eventType === 'data_update') {
      this.notifySubscribers('dataUpdate', data);
    }
  };

  public startLiveData(): void {
    if (this.connectionInfo.status !== 'connected') return;
    
    const dashboardPIDs = [
      'ENGINE_RPM', 'VEHICLE_SPEED', 'ENGINE_COOLANT_TEMP',
      'FUEL_LEVEL', 'ENGINE_LOAD',
    ];

    // Filter the list to only include supported PIDs
    const pidsToPoll = dashboardPIDs.filter(pidName => this.isPIDSupported(pidName));
    
    console.log(`Starting live data stream for ${pidsToPoll.length} supported PIDs...`);

    pidsToPoll.forEach(pidName => {
      this.startPollingPID(pidName, 1000);
    });
  }

  /**
   * Stops all active PID polling.
   */
  public stopLiveData(): void {
    console.log("Stopping live data stream...");
    this.stopAllPolling();
  }
}

export default new OBDIIService();