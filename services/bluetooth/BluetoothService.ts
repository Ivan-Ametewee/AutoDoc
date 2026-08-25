import { EventEmitter } from 'events';
import { PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
  BluetoothEventSubscription,
} from 'react-native-bluetooth-classic';
import { filterOBDBluetoothDevices, enhanceOBDDevice } from '../../utils/deviceFilters';

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
  private readInterval: any = null;

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
        
        this.bluetoothEnabled = false;
        return false;
      }

      this.bluetoothEnabled = true;
      
      this.emit('initialized');
      return true;
    } catch (error: any) {
      
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
        
        this.permissionsGranted = true;
        return true;
      } else {
        
        this.permissionsGranted = false;
        return false;
      }
    } catch (error: any) {
      
      return false;
    }
  }

  public async checkBluetoothEnabled(): Promise<boolean> {
    try {
      this.bluetoothEnabled = await RNBluetoothClassic.isBluetoothEnabled();
      return this.bluetoothEnabled;
    } catch (error: any) {
      
      return false;
    }
  }
  
    public async startScan(filterOBDOnly: boolean = true): Promise<BluetoothDevice[]> {
    if (this.isScanning) {
        
        return [];
    }
    try {
        this.isScanning = true;
        this.emit('scanStarted');
        const allDevices = await RNBluetoothClassic.startDiscovery();
        
        if (filterOBDOnly) {
          const obdDevices = filterOBDBluetoothDevices(allDevices);
          
          return obdDevices.map(enhanceOBDDevice);
        }
        
        return allDevices;
    } catch (error: any) {
        
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
        
        return false;
    }
  }

  public async getBondedDevices(filterOBDOnly: boolean = true): Promise<BluetoothDevice[]> {
    try {
      if (!this.permissionsGranted) await this.requestPermissions();
      const allDevices = await RNBluetoothClassic.getBondedDevices();
      
      if (filterOBDOnly) {
        const obdDevices = filterOBDBluetoothDevices(allDevices);
        
        return obdDevices.map(enhanceOBDDevice);
      }
      
      return allDevices;
    } catch (error: any) {
      
      return [];
    }
  }

  /**
   * **REFACTORED**: This method provides a clean and reliable connection workflow.
   */
  public async connectToDevice(device: BluetoothDevice): Promise<boolean> {
    
    
    
    if (this.isConnecting) {
      
      return false;
    }

    this.isConnecting = true;
    
    this.emit('connecting', device);

    try {
      // **FIX**: If we are already connected to any device, disconnect first.
      if (this.connectedDevice) {
        
        await this.disconnect();
        // Add a small delay for stability after disconnecting
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      
      const connectionStartTime = Date.now();
      const isConnected = await device.connect();
      const connectionDuration = Date.now() - connectionStartTime;

      if (isConnected) {
        
        this.connectedDevice = device;
        
        // **CRITICAL**: Attach the data listener right after a successful connection.
        
        try {
          // Set up data reading with multiple approaches for better compatibility
          
          
          // Primary data listener
          this.readSubscription = this.connectedDevice.onDataReceived(data => {
            
            
            
            // Handle both string and object formats for compatibility
            const actualData = typeof data === 'object' ? data.data : data;
            
            
            
            this.emit('dataReceived', actualData);
          });
          
          // Also try setting up a continuous read loop (following Android pattern)
          this.startContinuousRead();
          
          
          
          // Log detailed connection info for debugging
          
        } catch (error) {
          
        }
        
        // Try to start reading if the device supports it
        // try {
        //   if (this.connectedDevice.startReading) {
        //     await this.connectedDevice.startReading();
        //     console.log('Started reading from device');
        //   }
        // } catch (error) {
        //   console.log('Device does not support startReading or already reading:', error);
        // }
        
        
        
        // Give ELM327 adapter time to stabilize after connection
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        
        // Test if adapter is responsive with different approaches
        
        try {
          // Try sending simple carriage returns to wake up some adapters
          await this.connectedDevice.write('\r\n');
          await new Promise(resolve => setTimeout(resolve, 200));
          await this.connectedDevice.write('\r\n');
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          
        }
        
        
        
        
        
        this.emit('deviceConnected', this.connectedDevice);
        return true;
      } else {
        
        throw new Error('Connection failed. The device may be out of range or unavailable.');
      }
    } catch (error: any) {
      
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
      
      
      
      // Remove the listener and read interval before disconnecting
      if (this.readSubscription) {
        this.readSubscription.remove();
        this.readSubscription = null;
      }
      
      // Clean up continuous read interval
      if (this.readInterval) {
        clearInterval(this.readInterval);
        this.readInterval = null;
        
      }
      
      await this.connectedDevice.disconnect();
      
      const disconnectedDevice = this.connectedDevice;
      this.connectedDevice = null;
      this.emit('deviceDisconnected', disconnectedDevice);
      return true;

    } catch (error: any) {
      
      // Force clear state even if native disconnect fails
      this.connectedDevice = null; 
      if (this.readSubscription) {
        this.readSubscription.remove();
        this.readSubscription = null;
      }
      if (this.readInterval) {
        clearInterval(this.readInterval);
        this.readInterval = null;
      }
      return false;
    }
  }

  public async sendData(data: string): Promise<boolean> {
    if (!this.connectedDevice) {
      
      return false;
    }
    
    try {
      // Ensure data is properly formatted for ELM327
      let formattedData = data.trim();
      
      // Add proper line ending if not present (ELM327 expects \r\n termination for better compatibility)
      if (!formattedData.endsWith('\r') && !formattedData.endsWith('\r\n')) {
        formattedData += '\r\n';
      } else if (formattedData.endsWith('\r') && !formattedData.endsWith('\r\n')) {
        // Convert single \r to \r\n for better compatibility
        formattedData = formattedData.slice(0, -1) + '\r\n';
      }
      
      
      await this.connectedDevice.write(formattedData);
      return true;
    } catch (error: any) {
      
      this.emit('error', error);
      return false;
    }
  }

  public isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  /**
   * Start continuous reading following Android Bluetooth Classic pattern
   */
  private startContinuousRead(): void {
    if (!this.connectedDevice) {
      
      return;
    }

    
    
    // Use an interval to continuously try reading data
    const readInterval = setInterval(async () => {
      if (!this.connectedDevice || !this.isConnected()) {
        
        clearInterval(readInterval);
        return;
      }

      try {
        // Try to read available data
        const data = await this.connectedDevice.read();
        if (data && data.length > 0) {
          
          this.emit('dataReceived', data);
        }
      } catch (error: any) {
        // Ignore read errors - they're expected when no data is available
        // Only log if it's not a "no data" error
        if (!error.message?.includes('timeout') && !error.message?.includes('no data')) {
          
        }
      }
    }, 100); // Check every 100ms

    // Store interval reference for cleanup (you may need to add this property to the class)
    this.readInterval = readInterval;
  }
}

export default new BluetoothService();