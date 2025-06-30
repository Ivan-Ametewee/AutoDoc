import { EventEmitter } from 'events';
import { PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
  BluetoothEventSubscription,
} from 'react-native-bluetooth-classic';

// --- Type Definitions ---
interface ConnectionState {
  state: 'disconnected' | 'connecting' | 'connected';
  device?: BluetoothDevice;
}

class BluetoothService extends EventEmitter {
  private connectedDevice: BluetoothDevice | null = null;
  private isConnecting: boolean = false;
  private permissionsGranted: boolean = false;
  private bluetoothEnabled: boolean = false;
  private readSubscription: BluetoothEventSubscription | null = null;
  private isScanning: boolean = false;

  constructor() {
    super();
    this.initialize();
  }

  public async initialize(): Promise<boolean> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }

      const isEnabled = await this.checkBluetoothEnabled();
      if (!isEnabled) {
        // We can't force enable, but we can inform the state
        console.warn('Bluetooth is not enabled. Please enable it in system settings.');
        this.bluetoothEnabled = false;
        return false;
      }

      this.bluetoothEnabled = true;
      console.log('Bluetooth service is ready.');
      this.emit('initialized');
      return true;
    } catch (error: any) {
      console.error('Error initializing Bluetooth service:', error.message);
      this.emit('error', error);
      return false;
    }
  }

  public async requestPermissions(): Promise<boolean> {
    if (this.permissionsGranted) return true;
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

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const allGranted = Object.values(granted).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        console.log('All Bluetooth permissions granted');
        this.permissionsGranted = true;
        return true;
      } else {
        console.error('Some Bluetooth permissions were denied:', granted);
        this.permissionsGranted = false;
        return false;
      }
    } catch (error: any) {
      console.error('Permission request failed:', error.message);
      return false;
    }
  }

  public async checkBluetoothEnabled(): Promise<boolean> {
    try {
      this.bluetoothEnabled = await RNBluetoothClassic.isBluetoothEnabled();
      return this.bluetoothEnabled;
    } catch (error: any) {
      console.error('Error checking Bluetooth state:', error.message);
      return false;
    }
  }
  
    public async startScan(): Promise<BluetoothDevice[]> {
    if (this.isScanning) {
        console.warn("Scan is already in progress.");
        return [];
    }
    try {
        this.isScanning = true;
        this.emit('scanStarted');
        return await RNBluetoothClassic.startDiscovery();
    } catch (error: any) {
        console.error("Bluetooth scan failed:", error.message);
        this.emit('error', error);
        return [];
    } finally {
        this.isScanning = false;
        this.emit('scanStopped');
    }
  }

  public async stopScan(): Promise<boolean> {
    if (!this.isScanning) return true;
    try {
        await RNBluetoothClassic.cancelDiscovery();
        this.isScanning = false;
        this.emit('scanStopped');
        return true;
    } catch (error: any) {
        console.error("Failed to stop Bluetooth scan:", error.message);
        return false;
    }
  }

  public async getBondedDevices(): Promise<BluetoothDevice[]> {
    try {
      if (!this.permissionsGranted) await this.requestPermissions();
      return await RNBluetoothClassic.getBondedDevices();
    } catch (error: any) {
      console.error('Error getting bonded devices:', error.message);
      return [];
    }
  }

  /**
   * **REFACTORED**: This method provides a clean and reliable connection workflow.
   */
  public async connectToDevice(device: BluetoothDevice): Promise<boolean> {
    if (this.isConnecting) {
      console.warn('Connection attempt already in progress.');
      return false;
    }

    this.isConnecting = true;
    this.emit('connecting', device);

    try {
      // **FIX**: If we are already connected to any device, disconnect first.
      if (this.connectedDevice) {
        console.log(`A device (${this.connectedDevice.name}) is already connected. Disconnecting for a clean session.`);
        await this.disconnect();
        // Add a small delay for stability after disconnecting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('Attempting to connect to:', device.name || device.address);
      const isConnected = await device.connect();

      if (isConnected) {
        this.connectedDevice = device;
        // **CRITICAL**: Attach the data listener right after a successful connection.
        this.readSubscription = this.connectedDevice.onDataReceived(data => 
          this.emit('dataReceived', data.data)
        );
        
        console.log('Successfully connected to:', this.connectedDevice.name);
        this.emit('deviceConnected', this.connectedDevice);
        return true;
      } else {
        throw new Error('Connection failed. The device may be out of range.');
      }
    } catch (error: any) {
      console.error(`Error connecting to ${device.name}:`, error.message);
      this.emit('error', error);
      // Ensure state is clean after a failed attempt
      this.connectedDevice = null;
      if (this.readSubscription) {
        this.readSubscription.remove();
        this.readSubscription = null;
      }
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

   public getConnectedDevice(): BluetoothDevice | null {
    return this.connectedDevice;
  }

  /**
   * **REFACTORED**: This method provides a clean and reliable disconnection.
   */
  public async disconnect(): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        return true; // Already disconnected
      }
      
      console.log('Disconnecting from:', this.connectedDevice.name);
      
      // Remove the listener before disconnecting
      if (this.readSubscription) {
        this.readSubscription.remove();
        this.readSubscription = null;
      }
      
      await this.connectedDevice.disconnect();
      
      const disconnectedDevice = this.connectedDevice;
      this.connectedDevice = null;
      this.emit('deviceDisconnected', disconnectedDevice);
      return true;

    } catch (error: any) {
      console.error('Error during disconnection:', error.message);
      // Force clear state even if native disconnect fails
      this.connectedDevice = null; 
      if (this.readSubscription) {
        this.readSubscription.remove();
        this.readSubscription = null;
      }
      return false;
    }
  }

  public async sendData(data: string): Promise<boolean> {
    if (!this.connectedDevice) {
      console.error('Cannot send data. No device connected.');
      return false;
    }
    try {
      console.log('Sending data:', data);
      await this.connectedDevice.write(data);
      return true;
    } catch (error: any) {
      console.error('Failed to send data:', error.message);
      this.emit('error', error);
      return false;
    }
  }

  public isConnected(): boolean {
    return this.connectedDevice !== null;
  }
}

export default new BluetoothService();