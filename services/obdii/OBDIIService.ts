import { EventEmitter } from 'events';
import BluetoothService from '../bluetooth/BluetoothService';
import WiFiService from '../wifi/WiFiService';
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
  private commService: typeof BluetoothService | typeof WiFiService | null = null;
  private subscribers: Set<SubscriberCallback> = new Set();
  private commandQueue: CommandQueueItem[] = [];
  private isProcessingQueue = false;
  private activePollingPIDs: Map<string, number> = new Map();
  private mockDataGenerator: typeof MockDataGenerator;
  private responseBuffer = '';
  private currentCommandResolver: ((value: string) => void) | null = null;
  private currentCommandRejecter: ((reason?: any) => void) | null = null;

  constructor() {
    super();
    this.connectionInfo = {
      status: 'disconnected',
      type: null,
    };
    this.setMaxListeners(20);
    this.mockDataGenerator = MockDataGenerator;
  }

  // --- Connection Management ---

  public async connect(device: any, type: 'bluetooth' | 'wifi'): Promise<boolean> {
    if (this.connectionInfo.status === 'connected' || this.connectionInfo.status === 'connecting') {
      console.warn('Already connected or connecting. Please disconnect first.');
      return false;
    }
    this.updateConnectionInfo('connecting', type, device);

    try {
      simulationService.stopSimulation();
      this.removeAllListeners('simulation_data');

      let isConnected = false;
      if (type === 'bluetooth') {
        this.commService = BluetoothService;
        await this.commService.initialize();
        isConnected = await this.commService.connectToDevice(device);
      } else if (type === 'wifi') {
        this.commService = WiFiService;
        // **FIXED**: Call the correct two-step connection method for Wi-Fi.
        isConnected = await this.commService.connectToNetwork(device.ssid, device.password);
      }

      if (isConnected && this.commService) {
        this.commService.on('dataReceived', this.handleDataReceived);
        this.commService.on('deviceDisconnected', this.handleDisconnection);
        
        // **FIXED**: Update status before sending commands to prevent race conditions.
        this.updateConnectionInfo('connected', type, device);
        
        await this.initializeAdapter();
        return true;
      } else {
        throw new Error('The communication service failed to connect.');
      }
    } catch (error: any) {
      this.updateConnectionInfo('error', type, device, error.message);
      this.commService = null;
      return false;
    }
  }

  public enableSimulation(): void {
    if (this.connectionInfo.status === 'connected') {
       console.warn('Already connected to a real device. Please disconnect first.');
       return;
    }
    this.updateConnectionInfo('connected', 'simulation');
    simulationService.startSimulation();
    simulationService.registerCallback(this.handleSimulationData);
  }

  public async disconnect(): Promise<void> {
    this.stopAllPolling();
    
    if (this.connectionInfo.type === 'simulation') {
      simulationService.stopSimulation();
      simulationService.unregisterCallback(this.handleSimulationData);
    } else if (this.commService) {
      this.commService.removeListener('dataReceived', this.handleDataReceived);
      this.commService.removeListener('deviceDisconnected', this.handleDisconnection);
      await this.commService.disconnect();
    }
    
    // Clean up internal state
    if (this.currentCommandRejecter) {
      this.currentCommandRejecter(new Error('Disconnected'));
    }
    this.commandQueue = [];
    this.isProcessingQueue = false;
    this.responseBuffer = '';
    this.currentCommandResolver = null;
    this.currentCommandRejecter = null;
    
    this.updateConnectionInfo('disconnected', null);
    this.commService = null;
  }

  private handleDisconnection = () => {
    this.disconnect();
    console.warn('Device disconnected unexpectedly.');
  };

  private updateConnectionInfo(status: ConnectionStatus, type: ConnectionType | null, device?: any, error?: string) {
    this.connectionInfo = { status, type, device, error };
    this.notifySubscribers('connectionStatus', this.connectionInfo);
  }

  public subscribe(callback: SubscriberCallback): () => void {
    this.subscribers.add(callback);
    callback('connectionStatus', this.connectionInfo);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(event: string, data: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  // --- Command & Data Processing ---

  public async initializeAdapter(): Promise<void> {
    try {
      await this.sendCommand('ATZ');
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for reset
      await this.sendCommand('ATE0'); // Echo off
      await this.sendCommand('ATL0'); // Line feeds off
      await this.sendCommand('ATSP0'); // Auto protocol
      console.log('OBD-II adapter initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize adapter:', error);
      throw error;
    }
  }

  public sendCommand(command: string): Promise<string> {
    if (this.connectionInfo.type === 'simulation') {
      // Handle simulation commands separately
      return new Promise(resolve => {
        const response = command.startsWith('AT') ? 'OK' : '4100BE1FA811'; // Generic simulated OK or PID data
        setTimeout(() => resolve(response), 50 + Math.random() * 50);
      });
    }

    return new Promise((resolve, reject) => {
      if (this.connectionInfo.status !== 'connected') {
        return reject(new Error('Not connected to a device.'));
      }
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
    const { command, resolve, reject } = this.commandQueue.shift()!;

    try {
      if (!this.commService) throw new Error('Communication service is not available.');

      this.currentCommandResolver = resolve;
      this.currentCommandRejecter = reject;

      // Timeout for the command
      const timeoutId = setTimeout(() => {
        if (this.currentCommandRejecter) {
          this.currentCommandRejecter(new Error(`Timeout: No response for command '${command}'`));
          this.currentCommandResolver = null;
          this.currentCommandRejecter = null;
          this.processQueue(); // Move to next command
        }
      }, 5000);

      this.currentCommandRejecter = (reason?: any) => {
          clearTimeout(timeoutId);
          reject(reason);
      }
      this.currentCommandResolver = (value: string) => {
          clearTimeout(timeoutId);
          resolve(value);
      }
      
      await this.commService.sendData(command + '\r');
    } catch (error) {
      reject(error);
      this.isProcessingQueue = false; // Stop queue on error
    }
  }

  private handleDataReceived = (data: string) => {
    this.responseBuffer += data;
    // Responses are terminated by a '>' character.
    const promptIndex = this.responseBuffer.indexOf('>');
    if (promptIndex !== -1) {
      const fullResponse = this.responseBuffer.substring(0, promptIndex).trim();
      this.responseBuffer = this.responseBuffer.substring(promptIndex + 1);

      if (this.currentCommandResolver) {
        this.currentCommandResolver(fullResponse);
        // Reset for the next command
        this.currentCommandResolver = null;
        this.currentCommandRejecter = null;
        // Process the next command in the queue
        this.processQueue();
      }
    }
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
    if (eventType === 'data_update' && this.connectionInfo.type === 'simulation') {
      this.notifySubscribers('dataUpdate', data);
    }
  };
}

export default new OBDIIService();