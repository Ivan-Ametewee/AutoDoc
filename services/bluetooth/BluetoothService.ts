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
  
    public async startScan(filterOBDOnly: boolean = true): Promise<BluetoothDevice[]> {
    if (this.isScanning) {
        console.warn("Scan is already in progress.");
        return [];
    }
    try {
        this.isScanning = true;
        this.emit('scanStarted');
        const allDevices = await RNBluetoothClassic.startDiscovery();
        
        if (filterOBDOnly) {
          const obdDevices = filterOBDBluetoothDevices(allDevices);
          console.log(`Discovered ${allDevices.length} devices, ${obdDevices.length} are OBD-II adapters`);
          return obdDevices.map(enhanceOBDDevice);
        }
        
        return allDevices;
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

  public async getBondedDevices(filterOBDOnly: boolean = true): Promise<BluetoothDevice[]> {
    try {
      if (!this.permissionsGranted) await this.requestPermissions();
      const allDevices = await RNBluetoothClassic.getBondedDevices();
      
      if (filterOBDOnly) {
        const obdDevices = filterOBDBluetoothDevices(allDevices);
        console.log(`Found ${allDevices.length} bonded devices, ${obdDevices.length} are OBD-II adapters`);
        return obdDevices.map(enhanceOBDDevice);
      }
      
      return allDevices;
    } catch (error: any) {
      console.error('Error getting bonded devices:', error.message);
      return [];
    }
  }

  /**
   * **REFACTORED**: This method provides a clean and reliable connection workflow.
   */
  public async connectToDevice(device: BluetoothDevice): Promise<boolean> {
    console.log(`🔗 [BT-INIT] Starting Bluetooth connection to device: ${device.name || device.address}`);
    console.log(`🔗 [BT-INIT] Device details: ${JSON.stringify({ name: device.name, address: device.address })}`);
    
    if (this.isConnecting) {
      console.warn('🔗 [BT-INIT] Connection attempt already in progress, aborting.');
      return false;
    }

    this.isConnecting = true;
    console.log(`🔗 [BT-INIT] Setting connection state to connecting...`);
    this.emit('connecting', device);

    try {
      // **FIX**: If we are already connected to any device, disconnect first.
      if (this.connectedDevice) {
        console.log(`🔗 [BT-INIT] Existing device connected (${this.connectedDevice.name}), disconnecting for clean session...`);
        await this.disconnect();
        // Add a small delay for stability after disconnecting
        console.log(`🔗 [BT-INIT] Waiting 500ms for clean disconnection...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`🔗 [BT-INIT] Initiating connection to: ${device.name || device.address}`);
      const connectionStartTime = Date.now();
      const isConnected = await device.connect();
      const connectionDuration = Date.now() - connectionStartTime;

      if (isConnected) {
        console.log(`✅ [BT-INIT] Bluetooth connection successful in ${connectionDuration}ms`);
        this.connectedDevice = device;
        
        // **CRITICAL**: Attach the data listener right after a successful connection.
        console.log(`🔗 [BT-INIT] Attaching data listener for incoming ELM327 data...`);
        try {
          // Set up data reading with multiple approaches for better compatibility
          console.log('🔍 [BT-INIT] Setting up data reading with enhanced monitoring...');
          
          // Primary data listener
          this.readSubscription = this.connectedDevice.onDataReceived(data => {
            console.log('📥 [BT-DATA] Bluetooth raw data received:', JSON.stringify(data));
            console.log('📥 [BT-DATA] Data type:', typeof data);
            
            // Handle both string and object formats for compatibility
            const actualData = typeof data === 'object' ? data.data : data;
            console.log('📥 [BT-DATA] Processed data being emitted:', JSON.stringify(actualData));
            console.log('📥 [BT-DATA] Processed data length:', actualData?.length || 0);
            
            this.emit('dataReceived', actualData);
          });
          
          // Also try setting up a continuous read loop (following Android pattern)
          this.startContinuousRead();
          
          console.log('✅ [BT-INIT] Data listener attached successfully');
          
          // Log detailed connection info for debugging
          console.log(`🔍 [BT-DEBUG] Connected device details:`, JSON.stringify({
            name: this.connectedDevice.name,
            address: this.connectedDevice.address,
            id: this.connectedDevice.id,
            bonded: this.connectedDevice.bonded,
            type: this.connectedDevice.type
          }));
        } catch (error) {
          console.error('❌ [BT-INIT] Error attaching data listener:', error);
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
        
        console.log(`🎉 [BT-INIT] Successfully connected to: ${this.connectedDevice.name}`);
        
        // Give ELM327 adapter time to stabilize after connection
        console.log(`🧪 [BT-INIT] Waiting for ELM327 adapter to stabilize...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        
        // Test if adapter is responsive with different approaches
        console.log(`🧪 [BT-INIT] Testing adapter responsiveness...`);
        try {
          // Try sending simple carriage returns to wake up some adapters
          await this.connectedDevice.write('\r\n');
          await new Promise(resolve => setTimeout(resolve, 200));
          await this.connectedDevice.write('\r\n');
          await new Promise(resolve => setTimeout(resolve, 200));
          console.log(`✅ [BT-INIT] Wake-up signals sent to adapter`);
        } catch (error) {
          console.warn(`⚠️ [BT-INIT] Could not send wake-up signals:`, error);
        }
        
        console.log(`✅ [BT-INIT] Bluetooth connection established - ready for OBD commands`);
        console.log(`🔗 [BT-INIT] All ELM327 commands will be handled by OBDIIService`);
        
        console.log(`🔗 [BT-INIT] Emitting deviceConnected event for: ${this.connectedDevice.name}`);
        this.emit('deviceConnected', this.connectedDevice);
        return true;
      } else {
        console.error(`❌ [BT-INIT] Connection failed to: ${device.name || device.address}`);
        throw new Error('Connection failed. The device may be out of range or unavailable.');
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
      
      // Remove the listener and read interval before disconnecting
      if (this.readSubscription) {
        this.readSubscription.remove();
        this.readSubscription = null;
      }
      
      // Clean up continuous read interval
      if (this.readInterval) {
        clearInterval(this.readInterval);
        this.readInterval = null;
        console.log('🔄 [BT-READ] Continuous read interval cleared');
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
      if (this.readInterval) {
        clearInterval(this.readInterval);
        this.readInterval = null;
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
      // Ensure data is properly formatted for ELM327
      let formattedData = data.trim();
      
      // Add proper line ending if not present (ELM327 expects \r\n termination for better compatibility)
      if (!formattedData.endsWith('\r') && !formattedData.endsWith('\r\n')) {
        formattedData += '\r\n';
      } else if (formattedData.endsWith('\r') && !formattedData.endsWith('\r\n')) {
        // Convert single \r to \r\n for better compatibility
        formattedData = formattedData.slice(0, -1) + '\r\n';
      }
      
      console.log('Sending data to ELM327:', JSON.stringify(formattedData));
      await this.connectedDevice.write(formattedData);
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

  /**
   * Start continuous reading following Android Bluetooth Classic pattern
   */
  private startContinuousRead(): void {
    if (!this.connectedDevice) {
      console.warn('🔍 [BT-READ] Cannot start continuous read - no connected device');
      return;
    }

    console.log('🔄 [BT-READ] Starting continuous read loop (Android pattern)...');
    
    // Use an interval to continuously try reading data
    const readInterval = setInterval(async () => {
      if (!this.connectedDevice || !this.isConnected()) {
        console.log('🔄 [BT-READ] Stopping continuous read - device disconnected');
        clearInterval(readInterval);
        return;
      }

      try {
        // Try to read available data
        const data = await this.connectedDevice.read();
        if (data && data.length > 0) {
          console.log('📥 [BT-READ] Continuous read got data:', JSON.stringify(data));
          this.emit('dataReceived', data);
        }
      } catch (error: any) {
        // Ignore read errors - they're expected when no data is available
        // Only log if it's not a "no data" error
        if (!error.message?.includes('timeout') && !error.message?.includes('no data')) {
          console.log('🔍 [BT-READ] Read attempt error:', error.message);
        }
      }
    }, 100); // Check every 100ms

    // Store interval reference for cleanup (you may need to add this property to the class)
    this.readInterval = readInterval;
  }
}

export default new BluetoothService();