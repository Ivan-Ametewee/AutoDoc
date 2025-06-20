import { EventEmitter } from 'events';
import { PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';

interface DeviceListeners {
  onConnected: (device: BluetoothDevice) => void;
  onDisconnected: (device: BluetoothDevice) => void;
  onRead: (data: any) => void;
}

interface ConnectionState {
  state: 'disconnected' | 'connecting' | 'connected';
  device?: BluetoothDevice;
}

interface ScanState {
  state: 'idle' | 'scanning';
  devices?: BluetoothDevice[];
}

class BluetoothService extends EventEmitter {
  private connectedDevice: BluetoothDevice | null = null;
  private isScanning: boolean = false;
  private isConnecting: boolean = false;
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private readBuffer: string = '';
  private permissionsGranted: boolean = false;
  private bluetoothEnabled: boolean = false;
  private deviceListeners: Map<string, DeviceListeners> = new Map();
  private bluetoothListenersSetup: boolean = false;

  constructor() {
    super();
    this.setupGlobalBluetoothListeners();
  }

  private setupGlobalBluetoothListeners(): void {
    if (this.bluetoothListenersSetup) {
      return;
    }

    try {
      RNBluetoothClassic.onBluetoothEnabled(() => {
        console.log('Bluetooth enabled');
        this.bluetoothEnabled = true;
        this.emit('bluetoothEnabled');
      });

      RNBluetoothClassic.onBluetoothDisabled(() => {
        console.log('Bluetooth disabled');
        this.bluetoothEnabled = false;
        this.emit('bluetoothDisabled');
        
        if (this.connectedDevice) {
          const device = this.connectedDevice;
          this.connectedDevice = null;
          this.emit('deviceDisconnected', device);
        }
      });

      this.bluetoothListenersSetup = true;
    } catch (error) {
      console.error('Error setting up Bluetooth listeners:', error);
    }
  }

  // The key fix: Simplified device listener setup similar to your working version
  private setupDeviceListeners(device: BluetoothDevice): boolean {
    if (!device || !device.address) {
      console.error('setupDeviceListeners: Device or address is required');
      return false;
    }

    // Clean up existing listeners first
    this.removeDeviceListeners(device);

    console.log('Setting up listeners for device:', device.name || device.address);

    try {
      // Store device address for cleanup
      this.deviceListeners.set(device.address, {
        onConnected: () => {},
        onDisconnected: () => {},
        onRead: () => {}
      });

      console.log('Device listeners set up for:', device.address);
      return true;

    } catch (error) {
      console.error('Error setting up device listeners:', error);
      this.removeDeviceListeners(device);
      return false;
    }
  }

  private removeDeviceListeners(device: BluetoothDevice): void {
    const deviceAddress = device.address || device.id;
    if (this.deviceListeners.has(deviceAddress)) {
      this.deviceListeners.delete(deviceAddress);
      console.log('Removed listeners for device:', deviceAddress);
    }
  }

  async checkAndRequestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      this.permissionsGranted = true;
      return true;
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      console.log('Requesting permissions:', permissions);
      const results = await PermissionsAndroid.requestMultiple(permissions);
      console.log('Permission results:', results);

      const allGranted = Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        console.log('All Bluetooth permissions granted');
        this.permissionsGranted = true;
        this.emit('permissionsGranted');
        return true;
      } else {
        console.error('Some permissions denied:', results);
        this.permissionsGranted = false;
        this.emit('permissionsDenied', results);
        return false;
      }

    } catch (error) {
      console.error('Permission request failed:', error);
      this.permissionsGranted = false;
      this.emit('error', error);
      return false;
    }
  }

  async checkBluetoothEnabled(): Promise<boolean> {
    try {
      const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
      console.log('Bluetooth enabled:', isEnabled);
      this.bluetoothEnabled = isEnabled;
      this.emit('bluetoothStatusChanged', isEnabled);
      return isEnabled;
    } catch (error) {
      console.error('Error checking Bluetooth state:', error);
      this.emit('error', error);
      return false;
    }
  }

  async enableBluetooth(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const enabled = await RNBluetoothClassic.requestBluetoothEnabled();
        this.bluetoothEnabled = enabled;
        return enabled;
      }
      return false;
    } catch (error) {
      console.error('Error enabling Bluetooth:', error);
      this.emit('error', error);
      return false;
    }
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing Bluetooth service...');

      const hasPermissions = await this.checkAndRequestPermissions();
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }

      const isEnabled = await this.checkBluetoothEnabled();
      if (!isEnabled) {
        console.log('Bluetooth is disabled, attempting to enable...');
        const enabled = await this.enableBluetooth();
        if (!enabled) {
          throw new Error('Bluetooth is not enabled');
        }
      }

      console.log('Bluetooth service initialized successfully');
      this.emit('initialized');
      return true;

    } catch (error) {
      console.error('Error initializing Bluetooth service:', error);
      this.emit('error', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    return this.checkAndRequestPermissions();
  }

  async startScan(duration: number = 10000): Promise<BluetoothDevice[]> {
    if (this.isScanning) {
      console.log('Already scanning');
      return [];
    }

    try {
      this.isScanning = true;
      this.emit('scanStarted');

      console.log('Starting device discovery...');
      
      // Clear any existing timeout
      if (this.scanTimeout) {
        clearTimeout(this.scanTimeout);
      }

      const devices = await RNBluetoothClassic.startDiscovery();
      console.log('Raw discovered devices:', devices.length);

      // Set timeout to stop scanning
      this.scanTimeout = setTimeout(() => {
        this.stopScan();
      }, duration);

      return devices;

    } catch (error) {
      console.error('Scan failed:', error);
      this.isScanning = false;
      this.emit('scanStopped');
      this.emit('error', error);
      return [];
    }
  }

  async stopScan(): Promise<void> {
    try {
      if (!this.isScanning) {
        return;
      }

      await RNBluetoothClassic.cancelDiscovery();
      this.isScanning = false;

      if (this.scanTimeout) {
        clearTimeout(this.scanTimeout);
        this.scanTimeout = null;
      }

      this.emit('scanStopped');
      console.log('Scan stopped');
    } catch (error) {
      console.error('Error stopping scan:', error);
      this.emit('error', error);
    }
  }

  async getBondedDevices(): Promise<BluetoothDevice[]> {
    try {
      if (!this.permissionsGranted) {
        await this.checkAndRequestPermissions();
      }

      const devices = await RNBluetoothClassic.getBondedDevices();
      console.log('Bonded devices:', devices.length);
      this.emit('bondedDevicesFound', devices);
      return devices;
    } catch (error) {
      console.error('Error getting bonded devices:', error);
      this.emit('error', error);
      return [];
    }
  }

  // KEY FIX: Simplified connection logic similar to your working version
  async connectToDevice(device: BluetoothDevice): Promise<boolean> {
    try {
      if (this.isConnecting) {
        console.log('Already connecting to a device');
        return false;
      }

      if (this.connectedDevice) {
        console.log('Already connected to a device');
        return true;
      }

      if (!this.permissionsGranted || !this.bluetoothEnabled) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Bluetooth');
        }
      }

      this.isConnecting = true;
      this.emit('connecting', device);

      console.log('Connecting to device:', device.name || device.address);

      // Use the device's connect method directly like your working version
      const isConnected = await device.connect();
      
      if (isConnected) {
        this.connectedDevice = device;
        this.reconnectAttempts = 0;
        console.log('Successfully connected to:', device.name || device.address);
        this.emit('deviceConnected', device);
        return true;
      } else {
        throw new Error('Failed to connect to device');
      }

    } catch (error) {
      console.error('Error connecting to device:', error);
      this.emit('error', error);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        console.log('No device connected');
        return true;
      }

      console.log('Disconnecting from:', this.connectedDevice.name || this.connectedDevice.address);
      
      // Use the device's disconnect method directly
      await this.connectedDevice.disconnect();

      const device = this.connectedDevice;
      this.removeDeviceListeners(device);
      this.connectedDevice = null;
      this.emit('deviceDisconnected', device);

      return true;
    } catch (error) {
      console.error('Error disconnecting:', error);
      this.emit('error', error);
      return false;
    }
  }

  async sendData(data: string): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }

      console.log('Sending data:', data);
      
      // Use the device's write method directly
      const success = await this.connectedDevice.write(data);

      if (success) {
        this.emit('dataSent', data);
        return true;
      } else {
        throw new Error('Failed to send data');
      }
    } catch (error) {
      console.error('Error sending data:', error);
      this.emit('error', error);
      return false;
    }
  }

  private handleIncomingData(data: any): void {
    console.log('Received data:', data.data);

    this.readBuffer += data.data;

    const messages = this.readBuffer.split(/[\r\n]+/);
    this.readBuffer = messages.pop() || '';

    messages.forEach(message => {
      if (message.trim()) {
        this.emit('dataReceived', {
          device: data.device,
          data: message.trim()
        });
      }
    });
  }

  private async attemptReconnection(device: BluetoothDevice): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.emit('reconnectionFailed', device);
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    this.emit('reconnecting', { device, attempt: this.reconnectAttempts });

    setTimeout(async () => {
      try {
        const success = await this.connectToDevice(device);
        if (success) {
          console.log('Reconnection successful');
          this.emit('reconnected', device);
        } else {
          this.attemptReconnection(device);
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.attemptReconnection(device);
      }
    }, 2000 * this.reconnectAttempts);
  }

  // Getter methods
  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  getConnectedDevice(): BluetoothDevice | null {
    return this.connectedDevice;
  }

  hasPermissions(): boolean {
    return this.permissionsGranted;
  }

  isBluetoothEnabled(): boolean {
    return this.bluetoothEnabled;
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  isCurrentlyConnecting(): boolean {
    return this.isConnecting;
  }

  clearBuffer(): void {
    this.readBuffer = '';
  }

  destroy(): void {
    this.deviceListeners.clear();
    this.stopScan();
    this.disconnect();
    this.removeAllListeners();
  }
}

export default new BluetoothService();