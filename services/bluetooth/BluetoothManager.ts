import BluetoothService from './BluetoothService';
import { EventEmitter } from 'events';
import { BluetoothDevice } from 'react-native-bluetooth-classic';

interface OBDDevice extends BluetoothDevice {
  bonded: boolean;
  discovered: boolean;
}

interface ConnectionState {
  state: 'disconnected' | 'connecting' | 'connected';
  device?: BluetoothDevice;
}

interface ScanState {
  state: 'idle' | 'scanning';
  devices?: BluetoothDevice[];
}

interface ScanResult {
  bonded: BluetoothDevice[];
  discovered: BluetoothDevice[];
}

class BluetoothManager extends EventEmitter {
  private bluetoothService: typeof BluetoothService;
  private discoveredDevices: Map<string, BluetoothDevice>;
  private connectionState: 'disconnected' | 'connecting' | 'connected';
  private scanState: 'idle' | 'scanning';
  private obdDevices: Map<string, OBDDevice>;

  constructor() {
    super();
    this.bluetoothService = BluetoothService;
    this.discoveredDevices = new Map();
    this.connectionState = 'disconnected';
    this.scanState = 'idle';
    this.obdDevices = new Map();
    
    this.setupServiceListeners();
  }

  private setupServiceListeners(): void {
    // Connection events
    this.bluetoothService.on('deviceConnected', (device: BluetoothDevice) => {
      this.connectionState = 'connected';
      this.emit('connectionStateChanged', {
        state: 'connected',
        device: device
      });
      this.emit('deviceConnected', device);
    });

    this.bluetoothService.on('deviceDisconnected', (device: BluetoothDevice) => {
      this.connectionState = 'disconnected';
      this.emit('connectionStateChanged', {
        state: 'disconnected',
        device: device
      });
      this.emit('deviceDisconnected', device);
    });

    this.bluetoothService.on('connecting', (device: BluetoothDevice) => {
      this.connectionState = 'connecting';
      this.emit('connectionStateChanged', {
        state: 'connecting',
        device: device
      });
    });

    // Scan events
    this.bluetoothService.on('scanStarted', () => {
      this.scanState = 'scanning';
      this.discoveredDevices.clear();
      this.emit('scanStateChanged', { state: 'scanning' });
    });

    this.bluetoothService.on('scanStopped', () => {
      this.scanState = 'idle';
      this.emit('scanStateChanged', { 
        state: 'idle',
        devices: Array.from(this.discoveredDevices.values())
      });
    });

    // Data events
    this.bluetoothService.on('dataReceived', (data: any) => {
      this.emit('dataReceived', data);
    });

    this.bluetoothService.on('dataSent', (data: string) => {
      this.emit('dataSent', data);
    });

    // Error and state events
    this.bluetoothService.on('error', (error: Error) => {
      this.emit('error', error);
    });

    this.bluetoothService.on('bluetoothEnabled', () => {
      this.emit('bluetoothStateChanged', { enabled: true });
    });

    this.bluetoothService.on('bluetoothDisabled', () => {
      this.emit('bluetoothStateChanged', { enabled: false });
    });

    // Reconnection events
    this.bluetoothService.on('reconnecting', (data: any) => {
      this.emit('reconnecting', data);
    });

    this.bluetoothService.on('reconnected', (device: BluetoothDevice) => {
      this.emit('reconnected', device);
    });

    this.bluetoothService.on('reconnectionFailed', (device: BluetoothDevice) => {
      this.emit('reconnectionFailed', device);
    });
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing Bluetooth Manager...');
      const hasPermissions = await this.bluetoothService.requestPermissions();
      
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }

      const isEnabled = await this.bluetoothService.checkBluetoothEnabled();
      
      if (!isEnabled) {
        const enabled = await this.bluetoothService.enableBluetooth();
        if (!enabled) {
          throw new Error('Bluetooth could not be enabled');
        }
      }

      console.log('Bluetooth Manager initialized successfully');
      this.emit('initialized');
      return true;

    } catch (error) {
      console.error('Failed to initialize Bluetooth Manager:', error);
      this.emit('error', error);
      return false;
    }
  }

  // KEY FIX: Simplified scanning logic similar to your working version
  async scanForDevices(duration: number = 10000): Promise<ScanResult> {
    try {
      console.log('Starting device scan...');
      
      // Get bonded devices first - this is the key approach from your working version
      const bondedDevices = await this.bluetoothService.getBondedDevices();
      this.processBondedDevices(bondedDevices);

      // Optionally start discovery for new devices (but bonded devices are usually sufficient)
      const discoveredDevices = await this.bluetoothService.startScan(duration);
      this.processDiscoveredDevices(discoveredDevices);

      return {
        bonded: bondedDevices,
        discovered: discoveredDevices
      };

    } catch (error) {
      console.error('Error scanning for devices:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private processBondedDevices(devices: BluetoothDevice[]): void {
    devices.forEach(device => {
      if (this.isLikelyOBDDevice(device)) {
        this.obdDevices.set(device.address, Object.assign(device, {
          bonded: true,
          discovered: false
        }) as OBDDevice);
        this.discoveredDevices.set(device.address, device);
        this.emit('obdDeviceFound', device);
      }
    });
  }

private processDiscoveredDevices(devices: BluetoothDevice[]): void {
  devices.forEach(device => {
    if (this.isLikelyOBDDevice(device)) {
      const existingDevice = this.obdDevices.get(device.address);

      const updatedDevice = Object.assign({}, device, {
        bonded: existingDevice?.bonded || false,
        discovered: true
      }) as OBDDevice;

      this.obdDevices.set(device.address, updatedDevice);
      this.discoveredDevices.set(device.address, device);
      this.emit('obdDeviceFound', updatedDevice);
    }
  });
}


  private isLikelyOBDDevice(device: BluetoothDevice): boolean {
    const obdKeywords = [
      'obd', 'elm327', 'elm', 'obdii', 'diagnostic', 'scan',
      'torque', 'bluetooth', 'adapter', 'can', 'ecu'
    ];

    const deviceName = (device.name || '').toLowerCase();

    // Check if device name contains OBD-related keywords
    const nameMatch = obdKeywords.some(keyword => 
      deviceName.includes(keyword)
    );

    // Check common OBD device name patterns
    const patternMatch = /^(obd|elm|scan|diag|torque|bluetooth)/i.test(device.name || '');

    // For unknown devices, include them but mark as potential
    const unknownDevice = !device.name || device.name.trim() === '';

    return nameMatch || patternMatch || unknownDevice;
  }

  // KEY FIX: Simplified connection logic using the device directly
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      // Find device by both address and id
      const device = this.discoveredDevices.get(deviceId) || 
                  Array.from(this.obdDevices.values()).find(d => 
                    d.address === deviceId || d.id === deviceId
                  );

      if (!device) {
        throw new Error('Device not found');
      }

      console.log('Connecting to device:', device.name || device.address);
      const success = await this.bluetoothService.connectToDevice(device);
      
      return success;
    } catch (error) {
      console.error('Error connecting to device:', error);
      this.emit('error', error);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      const success = await this.bluetoothService.disconnect();
      return success;
    } catch (error) {
      console.error('Error disconnecting:', error);
      this.emit('error', error);
      return false;
    }
  }

  async sendCommand(command: string): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        throw new Error('No device connected');
      }

      // Ensure command ends with carriage return
      const formattedCommand = command.endsWith('\r') ? command : command + '\r';
      
      const success = await this.bluetoothService.sendData(formattedCommand);
      
      if (success) {
        console.log('Command sent:', command);
      }
      
      return success;

    } catch (error) {
      console.error('Error sending command:', error);
      this.emit('error', error);
      return false;
    }
  }

  stopScan(): Promise<void> {
    return this.bluetoothService.stopScan();
  }

  isConnected(): boolean {
    return this.bluetoothService.isConnected();
  }

  getConnectedDevice(): BluetoothDevice | null {
    return this.bluetoothService.getConnectedDevice();
  }

  getConnectionState(): string {
    return this.connectionState;
  }

  getScanState(): string {
    return this.scanState;
  }

  getDiscoveredDevices(): BluetoothDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  getOBDDevices(): OBDDevice[] {
    return Array.from(this.obdDevices.values());
  }

  clearDeviceList(): void {
    this.discoveredDevices.clear();
    this.obdDevices.clear();
  }

  // Device management methods
  async pairDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.discoveredDevices.get(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      // Note: react-native-bluetooth-classic handles pairing automatically during connection
      console.log('Pairing with device:', device.name);
      
      const success = await this.connectToDevice(deviceId);
      
      if (success) {
        this.emit('devicePaired', device);
      }
      
      return success;

    } catch (error) {
      console.error('Error pairing device:', error);
      this.emit('error', error);
      return false;
    }
  }

  async unpairDevice(deviceId: string): Promise<boolean> {
    try {
      console.log('Unpairing device:', deviceId);
      
      // For now, just disconnect if connected
      const connectedDevice = this.getConnectedDevice();
      if (connectedDevice && connectedDevice.address === deviceId) {
        await this.disconnect();
      }

      this.emit('deviceUnpaired', deviceId);
      return true;

    } catch (error) {
      console.error('Error unpairing device:', error);
      this.emit('error', error);
      return false;
    }
  }

  // Utility methods
  getDeviceInfo(deviceId: string): BluetoothDevice | OBDDevice | undefined {
    return this.discoveredDevices.get(deviceId) || this.obdDevices.get(deviceId);
  }

  isDeviceBonded(deviceId: string): boolean {
    const device = this.obdDevices.get(deviceId);
    return device?.bonded || false;
  }

  getDeviceSignalStrength(deviceId: string): number | null {
    const device = this.discoveredDevices.get(deviceId) as any;
    return device?.rssi || null;
  }

  // Cleanup
  destroy(): void {
    console.log('Destroying Bluetooth Manager...');
    this.bluetoothService.destroy();
    this.discoveredDevices.clear();
    this.obdDevices.clear();
    this.removeAllListeners();
  }
}

export default new BluetoothManager();