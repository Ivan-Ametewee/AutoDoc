import { EventEmitter } from 'events';
import BluetoothService from '../bluetooth/BluetoothService';
import OdometerFraudDetectionService from '../fraud/OdometerFraudDetectionService';
import WiFiManager from '../wifi/WiFiManager';
import { simulationService } from '../simulation/SimulationService';
import { OBDIIParser, ParsedPIDData } from './OBDIIParser';
import { PIDDefinition, PIDDefinitions, ManufacturerOdometerConfig } from './PIDDefinitions';
import MockDataGenerator from '../simulation/MockDataGenerator';
import { ELM327Handler, ELM327Response, ELM327Command } from './ELM327Handler';

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

enum CommandPriority {
  HIGH = 0,    // Real-time critical data (RPM, speed, throttle)
  MEDIUM = 1,  // Dashboard data (coolant temp, fuel level)
  LOW = 2      // Diagnostic commands (DTC scans, Mode 22)
}

interface CommandQueueItem {
  command: string;
  resolve: (value: ELM327Response) => void;
  reject: (reason?: any) => void;
  timestamp: number;
  retries?: number;
  expectedResponseType?: 'OK' | 'DATA' | 'ANY';
  isMode22?: boolean; // Flag for Mode 22 commands
  priority: CommandPriority;
  pid?: string; // For deduplication
  category?: 'realtime' | 'dashboard' | 'diagnostic' | 'other';
}

interface VehicleInfo {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
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

  // Vehicle-specific configuration
  private currentVehicleInfo: VehicleInfo = {};
  private activeOdometerPID: string | null = null;
  private mode22Supported = false;

  // Fake odometer system (when real odometer PID not available)
  private fakeOdometerBaseReading: number | null = null;
  private fakeOdometerInitialized = false;
  private lastSpeedUpdateTime: number | null = null;
  private currentSpeed = 0; // km/h
  private accumulatedDistance = 0; // km


  // **IMPROVED**: Better response handling
  private responseBuffer = '';
  private currentCommand: CommandQueueItem | null = null;
  private commandTimeout = 5000; // 5 seconds
  private maxRetries = 3;
  
  // Improved queue management settings
  private readonly MAX_QUEUE_SIZE_HIGH = 30; // High priority commands
  private readonly MAX_QUEUE_SIZE_MEDIUM = 20; // Medium priority commands  
  private readonly MAX_QUEUE_SIZE_LOW = 10; // Low priority commands
  private readonly MAX_TOTAL_QUEUE_SIZE = 60; // Total queue limit
  
  // Connection-aware throttling delays
  private readonly THROTTLE_DELAYS = {
    bluetooth: 100, // ms
    wifi: 50,       // ms
    simulation: 10  // ms - minimal delay for simulation
  };
  
  private lastCommandTime = 0;
  
  // Command categorization for priority assignment
  private readonly HIGH_PRIORITY_PIDS = new Set([
    '0C', '0D', '11', '04', '05', '06', '07', '08', '09' // RPM, Speed, Throttle, Load, Coolant Temp, etc.
  ]);
  
  private readonly MEDIUM_PRIORITY_PIDS = new Set([
    '0A', '0F', '10', '1F', '21', '22', '23', '2F', '30', '33' // Fuel pressure, intake temp, etc.
  ]);
  
  // All other PIDs are LOW priority by default

  constructor() {
    super();
    this.connectionInfo = {
      status: 'disconnected',
      type: null,
    };
    this.setMaxListeners(20);
    this.mockDataGenerator = MockDataGenerator;

    // Initialize fraud detection integration
    this.initializeFraudDetectionIntegration();
  }

  /**
   * Initialize fraud detection integration with OBD service
   */
  private initializeFraudDetectionIntegration(): void {
    console.log('🔍 Initializing fraud detection integration with OBD service');

    // Initialize fraud detection service with this OBD service instance
    OdometerFraudDetectionService.initializeRealTimeMonitoring(this);

    // Listen for fraud detection results and re-emit for Redux middleware
    this.on('fraudDetectionResult', (data) => {
      try {
        console.log('🚨 Fraud detection result received:', data);
        console.log('🔄 Re-emitting as realtimeFraudAlert for Redux...');
        // Use notifySubscribers instead of emit to reach Redux subscription
        this.notifySubscribers('realtimeFraudAlert', data);
        console.log('✅ Notified subscribers of realtimeFraudAlert event');
      } catch (error) {
        console.error('❌ Error in fraudDetectionResult handler:', error);
      }
    });
  }

  // --- Vehicle Configuration Methods ---

  /**
   * Test if the vehicle supports Mode 22 commands
   */
  private async testMode22Support(): Promise<void> {
    try {
      // Try a simple Mode 22 command to test support
      const testCommand = '2200'; // Simple test command
      const response = await this.sendCommand(testCommand, 2000); // Shorter timeout for test

      if (response && !response.includes('NO DATA') && !response.includes('ERROR')) {
        this.mode22Supported = true;
        console.log('Mode 22 commands supported by vehicle');
      } else {
        this.mode22Supported = false;
        console.log('Mode 22 commands not supported by vehicle');
      }
    } catch (error) {
      this.mode22Supported = false;
      console.log('Mode 22 support test failed, assuming not supported');
    }
  }

  /**
   * Set vehicle information to determine appropriate odometer PID
   */
  public setVehicleInfo(vehicleInfo: VehicleInfo): void {
    this.currentVehicleInfo = { ...vehicleInfo };
    console.log('Vehicle info set:', this.currentVehicleInfo);

    // Determine and set the appropriate odometer PID
    this.selectOdometerPID();
  }

  /**
   * Automatically select the best odometer PID for the current vehicle
   */
  private selectOdometerPID(): void {
    if (!this.currentVehicleInfo.make) {
      console.warn('No vehicle make specified, cannot select odometer PID');
      return;
    }

    // Try to find manufacturer-specific odometer PID
    const manufacturerPID = PIDDefinitions.getOdometerPIDForManufacturer(this.currentVehicleInfo.make);

    if (manufacturerPID) {
      // Check if this specific config is compatible
      const configs = PIDDefinitions.getManufacturerOdometerConfigs();
      const compatibleConfig = configs.find(config =>
        PIDDefinitions.isOdometerConfigCompatible(
          config,
          this.currentVehicleInfo.make!,
          this.currentVehicleInfo.model,
          this.currentVehicleInfo.year
        )
      );

      if (compatibleConfig) {
        this.activeOdometerPID = compatibleConfig.pidName;
        console.log(`Selected odometer PID: ${this.activeOdometerPID} for ${this.currentVehicleInfo.make}`);
        return;
      }
    }

    // Fallback to standard odometer PID
    this.activeOdometerPID = 'ODOMETER_STANDARD';
    console.log('Using standard odometer PID as fallback');
  }

  /**
   * Generate fake base odometer reading from Mode 22 response
   * Uses the hex response (like 7F2211) converted to decimal as seed
   */
  private async generateFakeBaseOdometer(): Promise<number> {
    console.log('🚗 [FAKE-ODOMETER] Generating fake base odometer reading...');
    
    try {
      // Send a Mode 22 command that will likely fail (we want the error response)
      const testCommand = '2225AE'; // Toyota odometer PID (will likely return 7F2211)
      const response = await this.sendCommand(testCommand, 3000);
      
      console.log(`🚗 [FAKE-ODOMETER] Mode 22 response: "${response}"`);
      
      let seedValue = 0;
      
      if (response && response.includes('7F22')) {
        // Parse the hex response - typically "7F2211" 
        const hexMatch = response.match(/([0-9A-F]{6,8})/i);
        if (hexMatch) {
          const hexValue = hexMatch[1];
          seedValue = parseInt(hexValue, 16);
          console.log(`🚗 [FAKE-ODOMETER] Parsed hex "${hexValue}" to decimal: ${seedValue}`);
        }
      }
      
      // If no response or parsing failed, use a default seed
      if (seedValue === 0) {
        seedValue = 8323601; // 7F2211 in decimal as fallback
        console.log(`🚗 [FAKE-ODOMETER] Using fallback seed value: ${seedValue}`);
      }
      
      // Generate a realistic base odometer reading
      // Subtract a random value to make it different for each vehicle
      const randomOffset = Math.floor(Math.random() * 500000) + 100000; // 100k-600k km
      const baseReading = Math.max(0, seedValue - randomOffset);
      
      // Make it more realistic (round to nearest 100km)
      const realisticBase = Math.round(baseReading / 100) * 100;
      
      console.log(`🚗 [FAKE-ODOMETER] Generated base odometer: ${realisticBase} km (seed: ${seedValue}, offset: ${randomOffset})`);
      
      return realisticBase;
      
    } catch (error) {
      console.error('🚗 [FAKE-ODOMETER] Error generating base odometer:', error);
      // Fallback to a random realistic reading
      const fallbackBase = Math.floor(Math.random() * 200000) + 50000; // 50k-250k km
      console.log(`🚗 [FAKE-ODOMETER] Using fallback base: ${fallbackBase} km`);
      return fallbackBase;
    }
  }

  /**
   * Initialize the fake odometer system
   */
  private async initializeFakeOdometer(): Promise<void> {
    if (this.fakeOdometerInitialized) {
      console.log('🚗 [FAKE-ODOMETER] Already initialized');
      return;
    }
    
    console.log('🚗 [FAKE-ODOMETER] Initializing fake odometer system...');
    
    // Generate the base reading
    this.fakeOdometerBaseReading = await this.generateFakeBaseOdometer();
    this.accumulatedDistance = 0;
    this.lastSpeedUpdateTime = Date.now();
    this.fakeOdometerInitialized = true;
    
    console.log(`🚗 [FAKE-ODOMETER] Initialized with base reading: ${this.fakeOdometerBaseReading} km`);
  }

  /**
   * Update odometer based on current speed and elapsed time
   */
  private updateOdometerFromSpeed(currentSpeedKmh: number): void {
    if (!this.fakeOdometerInitialized || this.fakeOdometerBaseReading === null) {
      return;
    }
    
    const now = Date.now();
    
    if (this.lastSpeedUpdateTime !== null) {
      const elapsedHours = (now - this.lastSpeedUpdateTime) / (1000 * 60 * 60); // Convert to hours
      const distanceTraveled = this.currentSpeed * elapsedHours; // km = km/h * h
      
      this.accumulatedDistance += distanceTraveled;
      
      // Log significant distance changes (> 0.1 km)
      if (distanceTraveled > 0.1) {
        console.log(`🚗 [FAKE-ODOMETER] Distance traveled: ${distanceTraveled.toFixed(3)} km at ${this.currentSpeed} km/h for ${(elapsedHours * 60).toFixed(1)} minutes`);
      }
    }
    
    // Update current speed and timestamp
    this.currentSpeed = currentSpeedKmh;
    this.lastSpeedUpdateTime = now;
  }

  /**
   * Get the current calculated odometer reading
   */
  private getCurrentOdometerReading(): number {
    if (!this.fakeOdometerInitialized || this.fakeOdometerBaseReading === null) {
      return 0;
    }
    
    return this.fakeOdometerBaseReading + this.accumulatedDistance;
  }

  /**
   * Initialize fake odometer system in background (non-blocking)
   */
  private initializeFakeOdometerInBackground(): void {
    // Only initialize for real connections (not simulation)
    if (this.connectionInfo.type === 'simulation') {
      console.log('🚗 [FAKE-ODOMETER] Skipping fake odometer for simulation mode');
      return;
    }
    
    // Run initialization in background
    setTimeout(async () => {
      try {
        await this.initializeFakeOdometer();
        console.log('🚗 [FAKE-ODOMETER] Background initialization completed');
      } catch (error) {
        console.error('🚗 [FAKE-ODOMETER] Background initialization failed:', error);
      }
    }, 2000); // 2 second delay to let other initialization complete
  }

  /**
   * Reset fake odometer system
   */
  private resetFakeOdometer(): void {
    console.log('🚗 [FAKE-ODOMETER] Resetting fake odometer system');
    this.fakeOdometerBaseReading = null;
    this.fakeOdometerInitialized = false;
    this.lastSpeedUpdateTime = null;
    this.currentSpeed = 0;
    this.accumulatedDistance = 0;
  }

  /**
   * Add a new manufacturer odometer configuration dynamically
   */
  public addManufacturerOdometerConfig(config: ManufacturerOdometerConfig): void {
    PIDDefinitions.addManufacturerOdometerConfig(config);

    // Re-select odometer PID if this config is for current vehicle
    if (this.currentVehicleInfo.make &&
      config.manufacturer.toLowerCase() === this.currentVehicleInfo.make.toLowerCase()) {
      this.selectOdometerPID();
    }
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
        
        // Add essential PIDs immediately for dashboard functionality
        this.addEssentialPIDsForDashboard();
        
        // Set basic connection status after adapter initialization - allows dashboard navigation
        this.isInitialized = true;
        this.updateConnectionInfo('connected', type, device);
        console.log('🎉 ELM327 adapter initialized - dashboard ready! Starting background PID discovery...');
        
        // Continue with PID discovery and Mode 22 testing in background (non-blocking)
        this.discoverSupportedPIDsInBackground();
        
        // Initialize fake odometer system for fraud detection (non-blocking)
        this.initializeFakeOdometerInBackground();
        
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
    this.mode22Supported = true; // Simulation supports everything

    // Listen for fraud/fault/risk events from MockDataGenerator
    this.removeMockDataListeners();
    this.mockDataGenerator.on('faultsChanged', (faults) => {
      this.notifySubscribers('faultsChanged', faults);
    });
    this.mockDataGenerator.on('alertsChanged', (alerts) => {
      this.notifySubscribers('alertsChanged', alerts);
    });
    this.mockDataGenerator.on('riskChanged', (risk) => {
      this.notifySubscribers('riskChanged', risk);
    });
  }

  private removeMockDataListeners() {
    this.mockDataGenerator.removeAllListeners?.('faultsChanged');
    this.mockDataGenerator.removeAllListeners?.('alertsChanged');
    this.mockDataGenerator.removeAllListeners?.('riskChanged');
  }

  public async disconnect(): Promise<void> {
    console.log('Disconnecting OBD-II service...');
    
    this.stopAllPolling();
    this.isInitialized = false;
    this.mode22Supported = false;
    this.activeOdometerPID = null;
    
    // Reset fake odometer system
    this.resetFakeOdometer();
    
    if (this.connectionInfo.type === 'simulation') {
      simulationService.stopSimulation();
      this.removeMockDataListeners();
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
    // Handle special processing for dataUpdate events
    if (event === 'dataUpdate') {
      this.handlePIDDataUpdate(data);
    }
    
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Handle PID data updates for fake odometer system and other processing
   */
  private handlePIDDataUpdate(parsedData: any): void {
    if (!parsedData || !parsedData.name) return;
    
    // Track speed changes for fake odometer calculation
    if (parsedData.name === 'VEHICLE_SPEED' && typeof parsedData.value === 'number') {
      this.updateOdometerFromSpeed(parsedData.value);
      
      // Emit fake odometer reading if initialized
      if (this.fakeOdometerInitialized) {
        const currentOdometer = this.getCurrentOdometerReading();
        
        // Create fake odometer data in same format as real PID data
        const fakeOdometerData = {
          name: 'ODOMETER',
          value: currentOdometer,
          unit: 'km',
          timestamp: new Date(),
          raw: `fake_odometer:${currentOdometer.toFixed(1)}`,
          mode: '01',
          pid: 'FAKE'
        };
        
        // Emit to subscribers separately (avoid recursion)
        this.subscribers.forEach(callback => {
          try {
            callback('dataUpdate', fakeOdometerData);
          } catch (error) {
            console.error('Error in fake odometer callback:', error);
          }
        });
        
        console.log(`🚗 [FAKE-ODOMETER] Emitted odometer: ${currentOdometer.toFixed(1)} km (accumulated: ${this.accumulatedDistance.toFixed(3)} km)`);
      }
    }
  }

  // --- Command & Data Processing ---

  public async initializeAdapter(): Promise<void> {
    console.log('🔧 [INIT] Starting ELM327 adapter initialization following datasheet specifications...');
    console.log(`🔧 [INIT] Connection type: ${this.connectionInfo.type}`);
    console.log(`🔧 [INIT] Device info: ${JSON.stringify(this.connectionInfo.device)}`);
    
    // Give additional time for Bluetooth adapters to be fully ready
    if (this.connectionInfo.type === 'bluetooth') {
      console.log('⏳ [INIT] Additional stabilization delay for Bluetooth adapter...');
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms additional delay
      
      // Try diagnostic commands to test adapter responsiveness
      console.log('🔍 [INIT] Running adapter diagnostic tests...');
      await this.runAdapterDiagnostics();
    }
    
    try {
      // Get the standard ELM327 initialization sequence
      const initSequence = ELM327Handler.getInitializationSequence();
      console.log(`🔧 [INIT] Initialization sequence has ${initSequence.length} commands`);
      
      for (let i = 0; i < initSequence.length; i++) {
        const command = initSequence[i];
        console.log(`🔧 [INIT] Step ${i + 1}/${initSequence.length}: Executing ${command.command} - ${command.description}`);
        console.log(`🔧 [INIT] Command timeout: ${command.timeout}ms, expects data: ${command.expectsData}`);
        
        const startTime = Date.now();
        const response = await this.sendELM327Command(command);
        const duration = Date.now() - startTime;
        
        if (!response.success) {
          console.error(`❌ [INIT] Command ${command.command} failed after ${duration}ms:`);
          console.error(`❌ [INIT] Error: ${response.error}`);
          console.error(`❌ [INIT] Raw response: "${response.rawResponse}"`);
          
          // Some commands might fail on certain adapters, continue with critical ones
          if (command.command === 'ATZ') {
            console.error(`❌ [INIT] CRITICAL FAILURE: Reset command failed - adapter may be unresponsive`);
            throw new Error(`Critical initialization failed: Reset command failed - ${response.error}`);
          }
          
          // Continue with non-critical commands
          console.warn(`⚠️ [INIT] Non-critical command failed, continuing: ${command.command}`);
        } else {
          console.log(`✅ [INIT] Command ${command.command} successful in ${duration}ms`);
          console.log(`✅ [INIT] Response: "${response.data}"`);
          console.log(`✅ [INIT] Raw response: "${response.rawResponse}"`);
        }
        
        // Wait between commands as specified by ELM327 datasheet
        const delay = command.command === 'ATZ' ? 2000 : 500;
        console.log(`⏱️ [INIT] Waiting ${delay}ms before next command...`);
        await this.delay(delay);
      }

      // Additional protocol-specific initialization for WiFi adapters
      if (this.connectionInfo.type === 'wifi') {
        console.log('🔧 [INIT] Applying WiFi-specific ELM327 configuration...');
        const wifiCommands = [
          { command: 'ATST32', expectsData: false, timeout: 1000, description: 'Set timeout for WiFi stability' },
          { command: 'ATAT2', expectsData: false, timeout: 1000, description: 'Set adaptive timing for WiFi' }
        ];
        
        for (let j = 0; j < wifiCommands.length; j++) {
          const command = wifiCommands[j];
          console.log(`🔧 [INIT] WiFi Step ${j + 1}/${wifiCommands.length}: ${command.command} - ${command.description}`);
          
          try {
            const startTime = Date.now();
            const response = await this.sendELM327Command(command);
            const duration = Date.now() - startTime;
            
            if (response.success) {
              console.log(`✅ [INIT] WiFi command ${command.command} successful in ${duration}ms`);
              console.log(`✅ [INIT] WiFi response: "${response.data}"`);
            } else {
              console.warn(`⚠️ [INIT] WiFi command ${command.command} failed: ${response.error}`);
            }
            
            await this.delay(500);
          } catch (error) {
            console.error(`❌ [INIT] WiFi-specific command failed: ${command.command}`, error);
          }
        }
      }

      // Query the active protocol to verify initialization
      console.log('🔧 [INIT] Querying active protocol to verify initialization...');
      try {
        const startTime = Date.now();
        const protocolResponse = await this.sendELM327Command(ELM327Handler.COMMANDS.DESCRIBE_PROTOCOL);
        const duration = Date.now() - startTime;
        
        if (protocolResponse.success) {
          console.log(`✅ [INIT] Protocol query successful in ${duration}ms`);
          console.log(`✅ [INIT] Active protocol: ${protocolResponse.data}`);
          console.log(`✅ [INIT] Raw protocol response: "${protocolResponse.rawResponse}"`);
          this.notifySubscribers('protocolDetected', protocolResponse.data);
        } else {
          console.warn(`⚠️ [INIT] Protocol query failed: ${protocolResponse.error}`);
        }
      } catch (error) {
        console.error('❌ [INIT] Could not query active protocol:', error);
      }

      console.log('🎉 [INIT] ELM327 adapter initialized successfully according to datasheet specifications');
    } catch (error) {
      console.error('Failed to initialize ELM327 adapter:', error);
      throw error;
    }
  }

  /**
   * Add essential PIDs immediately for dashboard functionality while background discovery runs
   * These are commonly supported PIDs that work on most vehicles
   */
  private addEssentialPIDsForDashboard(): void {
    const essentialPIDs = [
      'ENGINE_RPM',           // PID 01 0C - Almost universally supported
      'VEHICLE_SPEED',       // PID 01 0D - Almost universally supported  
      'ENGINE_COOLANT_TEMP', // PID 01 05 - Very common
      'ENGINE_LOAD',         // PID 01 04 - Very common
      'THROTTLE_POSITION',   // PID 01 11 - Common
      'FUEL_LEVEL',          // PID 01 2F - Less common, but useful
      'INTAKE_AIR_TEMP',     // PID 01 0F - Common
      'MAF_RATE',            // PID 01 10 - Common on newer vehicles
      'VEHICLE_ODOMETER'     // Not standard OBD-II, often Mode 22
    ];
    
    // Mark these as "assumed supported" for immediate dashboard use
    essentialPIDs.forEach(pid => {
      this.supportedPIDs.add(pid);
    });
    
    console.log(`🔧 [INIT] Added ${essentialPIDs.length} essential PIDs for immediate dashboard use`);
    console.log(`🔧 [INIT] ⚠️  Note: These PIDs are assumed supported - actual support verified during background discovery`);
    console.log(`🔧 [INIT] Essential PIDs: ${essentialPIDs.join(', ')}`);
    
    // Notify subscribers that basic PIDs are available (with caveat)
    this.notifySubscribers('essentialPIDsReady', { 
      pids: essentialPIDs,
      note: 'Assumed supported - verification in progress'
    });
  }

  /**
   * Run PID discovery and Mode 22 testing in background (non-blocking)
   */
  private async discoverSupportedPIDsInBackground(): Promise<void> {
    try {
      console.log('🔍 [BACKGROUND] Starting comprehensive PID discovery in background...');
      console.log('🔍 [BACKGROUND] This will verify which essential PIDs are actually supported...');
      
      await this.discoverSupportedPIDs();
      
      console.log('🔍 [BACKGROUND] Testing Mode 22 support...');
      await this.testMode22Support();
      
      // Validate essential PIDs by testing a few critical ones
      await this.validateEssentialPIDs();
      
      console.log('✅ [BACKGROUND] Background PID discovery and validation completed');
      this.notifySubscribers('pidDiscoveryComplete', {
        supportedPIDs: Array.from(this.supportedPIDs),
        mode22Supported: this.mode22Supported
      });
    } catch (error) {
      console.error('❌ [BACKGROUND] Background PID discovery failed:', error);
      // Don't break the connection if background discovery fails
      this.notifySubscribers('pidDiscoveryError', error);
    }
  }

  /**
   * Validate that essential PIDs actually work by testing critical ones
   */
  private async validateEssentialPIDs(): Promise<void> {
    console.log('🔍 [VALIDATION] Testing critical essential PIDs to verify they actually work...');
    
    const criticalPIDs = ['ENGINE_RPM', 'VEHICLE_SPEED', 'ENGINE_COOLANT_TEMP'];
    const removedPIDs: string[] = [];
    
    for (const pidName of criticalPIDs) {
      try {
        console.log(`🔍 [VALIDATION] Testing PID: ${pidName}`);
        const result = await this.queryPID(pidName);
        
        if (result === null) {
          console.warn(`⚠️ [VALIDATION] PID ${pidName} not actually supported - removing from list`);
          this.supportedPIDs.delete(pidName);
          removedPIDs.push(pidName);
        } else {
          console.log(`✅ [VALIDATION] PID ${pidName} confirmed working`);
        }
        
        // Small delay between tests
        await this.delay(200);
      } catch (error) {
        console.warn(`⚠️ [VALIDATION] PID ${pidName} test failed - removing from list:`, error);
        this.supportedPIDs.delete(pidName);
        removedPIDs.push(pidName);
      }
    }
    
    if (removedPIDs.length > 0) {
      console.warn(`⚠️ [VALIDATION] Removed ${removedPIDs.length} unsupported essential PIDs: ${removedPIDs.join(', ')}`);
      this.notifySubscribers('unsupportedPIDsRemoved', removedPIDs);
    } else {
      console.log('✅ [VALIDATION] All tested essential PIDs are working correctly');
    }
  }

  public async discoverSupportedPIDs(): Promise<void> {
    console.log('Discovering supported PIDs using ELM327 specifications...');
    const existingPIDCount = this.supportedPIDs.size;
    console.log(`🔍 [PID-DISCOVERY] Starting with ${existingPIDCount} existing PIDs (keeping essential PIDs)`);
    // Don't clear existing PIDs - we want to keep the essential ones for dashboard

    try {
      // Query for PIDs 01-20 (Mode 01, PID 00) using proper ELM327 command
      const pidSupportCommand: ELM327Command = {
        command: '0100',
        expectsData: true,
        timeout: 3000,
        description: 'Query supported PIDs 01-20'
      };
      
      const response = await this.sendELM327Command(pidSupportCommand);
      console.log('ELM327 PID support response:', response);
      
      if (response.success && response.responseType === 'DATA') {
        const cleanResponse = response.data.replace(/[\s>]/g, '').toUpperCase();
        console.log('Clean PID support response:', cleanResponse);
        
        if (cleanResponse.startsWith('4100')) {
          const hexData = cleanResponse.substring(4);
          console.log('PID support hex data:', hexData);
          
          if (hexData.length >= 8) { // Should be 8 hex characters (4 bytes)
            // Convert hex to binary to check which PIDs are supported
            const supportBits = this.hexToBinary(hexData);
            console.log('PID support bits:', supportBits);
            
            const allPIDs = PIDDefinitions.getAllPIDs();
            
            // Check each bit position (PIDs 01-20 correspond to bits 0-19)
            for (let i = 0; i < Math.min(supportBits.length, 32); i++) {
              if (supportBits[i] === '1') {
                const pidNumber = (i + 1).toString(16).toUpperCase().padStart(2, '0');
                const pidDef = allPIDs.find(def => def.pid === pidNumber && def.mode === '01');
                
                if (pidDef) {
                  this.supportedPIDs.add(pidDef.name);
                  console.log(`ELM327 supported PID found: ${pidDef.name} (${pidNumber})`);
                }
              }
            }
            
            // Check if PID 20 is supported (indicates more PIDs available)
            if (supportBits[19] === '1') {
              console.log('PID 20 supported - querying additional PIDs 21-40...');
              await this.discoverAdditionalPIDs('0120', 21, 40);
            }
          } else {
            console.warn('Invalid PID support response length:', hexData.length);
          }
        } else {
          console.warn('Invalid PID support response format - expected to start with 4100');
        }
      } else if (response.responseType === 'NO_DATA') {
        console.log('Vehicle does not support PID discovery (Mode 01 PID 00)');
      } else if (response.responseType === 'UNABLE_TO_CONNECT') {
        console.warn('Unable to connect to vehicle for PID discovery');
      } else {
        console.warn('ELM327 PID discovery failed:', response.error);
      }
      
      // Add some common PIDs that might not be reported but often work
      // These are essential PIDs that most OBD-II vehicles support
      const commonPIDs = ['ENGINE_RPM', 'VEHICLE_SPEED', 'ENGINE_COOLANT_TEMP', 'ENGINE_LOAD'];
      let addedCommonPIDs = 0;
      
      commonPIDs.forEach(pid => {
        if (!this.supportedPIDs.has(pid)) {
          this.supportedPIDs.add(pid);
          addedCommonPIDs++;
          console.log(`Added essential PID: ${pid}`);
        }
      });
      
      if (addedCommonPIDs > 0) {
        console.log(`Added ${addedCommonPIDs} essential PIDs that may work despite not being reported`);
      }

      const newlyDiscoveredCount = this.supportedPIDs.size - existingPIDCount;
      console.log(`🎉 [PID-DISCOVERY] Complete: ${this.supportedPIDs.size} total PIDs (${existingPIDCount} essential + ${newlyDiscoveredCount} newly discovered)`);
      console.log(`🎉 [PID-DISCOVERY] All supported PIDs:`, Array.from(this.supportedPIDs));
      this.notifySubscribers('supportedPIDsDiscovered', Array.from(this.supportedPIDs));
      
    } catch (error) {
      console.error('ELM327 PID discovery failed:', error);
      
      // Add fallback PIDs if discovery fails completely
      const fallbackPIDs = [
        'ENGINE_RPM', 'VEHICLE_SPEED', 'ENGINE_COOLANT_TEMP', 
        'ENGINE_LOAD', 'THROTTLE_POSITION', 'FUEL_LEVEL', 
        'INTAKE_AIR_TEMP', 'MAF_RATE'
      ];
      
      fallbackPIDs.forEach(pid => this.supportedPIDs.add(pid));
      console.log('Using fallback PIDs due to discovery failure:', Array.from(this.supportedPIDs));
      this.notifySubscribers('supportedPIDsDiscovered', Array.from(this.supportedPIDs));
    }
  }

  /**
   * Discover additional PIDs beyond the basic 01-20 range
   */
  private async discoverAdditionalPIDs(command: string, startPID: number, endPID: number): Promise<void> {
    try {
      const additionalPIDCommand: ELM327Command = {
        command,
        expectsData: true,
        timeout: 3000,
        description: `Query supported PIDs ${startPID}-${endPID}`
      };
      
      const response = await this.sendELM327Command(additionalPIDCommand);
      
      if (response.success && response.responseType === 'DATA') {
        const cleanResponse = response.data.replace(/[\s>]/g, '').toUpperCase();
        const expectedPrefix = (parseInt(command.substring(0, 2), 16) + 0x40).toString(16).toUpperCase().padStart(2, '0') + command.substring(2);
        
        if (cleanResponse.startsWith(expectedPrefix)) {
          const hexData = cleanResponse.substring(4);
          
          if (hexData.length >= 8) {
            const supportBits = this.hexToBinary(hexData);
            const allPIDs = PIDDefinitions.getAllPIDs();
            
            for (let i = 0; i < Math.min(supportBits.length, 32); i++) {
              if (supportBits[i] === '1') {
                const pidNumber = (startPID + i).toString(16).toUpperCase().padStart(2, '0');
                const pidDef = allPIDs.find(def => def.pid === pidNumber && def.mode === '01');
                
                if (pidDef) {
                  this.supportedPIDs.add(pidDef.name);
                  console.log(`Additional ELM327 supported PID found: ${pidDef.name} (${pidNumber})`);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to discover additional PIDs ${startPID}-${endPID}:`, error);
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
    // First check our discovered PIDs
    if (this.supportedPIDs.has(pidName)) {
      return true;
    }

    // For simulation mode, support everything
    if (this.connectionInfo.type === 'simulation') {
      return true;
    }

    // For Mode 22 PIDs, check if Mode 22 is supported
    const pidDefinition = PIDDefinitions.getPID(pidName);
    if (pidDefinition?.mode === '22') {
      return this.mode22Supported;
    }

    // If no PIDs were discovered (discovery failed), assume common PIDs are supported
    if (this.supportedPIDs.size === 0) {
      const commonPIDs = [
        'ENGINE_RPM', 'VEHICLE_SPEED', 'ENGINE_COOLANT_TEMP',
        'ENGINE_LOAD', 'THROTTLE_POSITION', 'FUEL_LEVEL'
      ];
      return commonPIDs.includes(pidName);
    }

    return false;
  }

  public sendCommand(command: string, retries: number = 3): Promise<string> {
    // Legacy method for backwards compatibility - converts to new ELM327 format
    return this.sendELM327Command({
      command,
      expectsData: !command.toUpperCase().startsWith('AT') || command.toUpperCase() === 'ATI' || command.toUpperCase() === 'ATZ',
      timeout: ELM327Handler.getCommandTimeout(command),
      description: `Legacy command: ${command}`
    }).then(response => {
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Command failed');
      }
    });
  }

  public async sendELM327Command(command: ELM327Command, retries: number = 3): Promise<ELM327Response> {
    console.log(`📤 [CMD] Sending ELM327 command: ${command.command} (${command.description})`);
    console.log(`📤 [CMD] Expects data: ${command.expectsData}, Timeout: ${command.timeout}ms, Retries: ${retries}`);
    
    // Determine command priority and category
    const priority = this.getCommandPriority(command.command);
    const category = this.getCommandCategory(command.command);
    
    console.log(`🎯 [CMD] Command priority: ${CommandPriority[priority]}, category: ${category}`);
    
    // Deduplicate queue before adding new command
    this.deduplicateQueue();
    
    // Check if command can be added based on priority limits
    if (!this.canAddToQueue(priority)) {
      console.log(`⚠️ [CMD] Queue limits reached for priority ${CommandPriority[priority]}, attempting eviction...`);
      
      // Try to evict lower priority commands
      if (!this.evictLowPriorityCommands(priority)) {
        const counts = this.getQueuePriorityCounts();
        console.warn(`🚫 [CMD] Queue full for priority ${CommandPriority[priority]} (H:${counts.high}, M:${counts.medium}, L:${counts.low}), rejecting command: ${command.command}`);
        return {
          success: false,
          data: '',
          error: `Command queue full for ${CommandPriority[priority].toLowerCase()} priority commands`,
          responseType: 'ERROR',
          rawResponse: ''
        };
      }
    }
    
    if (this.connectionInfo.type === 'simulation') {
      // Simulate ELM327 responses for testing
      console.log(`🎭 [CMD] Running in simulation mode, generating fake response`);
      await this.delay(100);
      const response: ELM327Response = {
        success: true,
        data: command.expectsData ? 'SIMULATED_DATA' : 'OK',
        responseType: command.expectsData ? 'DATA' : 'OK',
        rawResponse: command.expectsData ? 'SIMULATED_DATA' : 'OK'
      };
      console.log(`🎭 [CMD] Simulation response: ${JSON.stringify(response)}`);
      return response;
    }

    // Validate command before sending
    console.log(`🔍 [CMD] Validating command: ${command.command}`);
    if (!ELM327Handler.isValidCommand(command.command)) {
      console.error(`❌ [CMD] Invalid ELM327 command detected: ${command.command}`);
      return {
        success: false,
        data: '',
        error: `Invalid ELM327 command: ${command.command}`,
        responseType: 'ERROR',
        rawResponse: ''
      };
    }
    console.log(`✅ [CMD] Command validation passed: ${command.command}`);

    console.log(`⏳ [CMD] Adding command to queue (current queue length: ${this.commandQueue.length})`);
    return new Promise((resolve, reject) => {
      const isMode22 = command.command.startsWith('22');
      
      // Extract PID for deduplication (if applicable)
      const parts = command.command.trim().split(' ');
      const pid = parts.length >= 2 ? parts[1] : undefined;
      
      const commandItem: CommandQueueItem = {
        command: command.command,
        resolve,
        reject,
        timestamp: Date.now(),
        retries,
        expectedResponseType: command.expectsData ? 'DATA' : 'OK',
        isMode22,
        priority,
        pid,
        category
      };
      
      console.log(`📋 [CMD] Created command queue item: ${JSON.stringify({
        command: commandItem.command,
        expectedResponseType: commandItem.expectedResponseType,
        isMode22: commandItem.isMode22,
        retries: commandItem.retries
      })}`);
      
      this.commandQueue.push(commandItem);
      console.log(`📋 [CMD] Command added to queue, new length: ${this.commandQueue.length}`);
      
      if (!this.isProcessingQueue) {
        console.log(`🚀 [CMD] Starting queue processing...`);
        this.processQueue();
      } else {
        console.log(`⏳ [CMD] Queue already being processed, command will be handled in order`);
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.commandQueue.length === 0) {
      console.log(`🔄 [QUEUE] Skipping queue processing - isProcessing: ${this.isProcessingQueue}, queueLength: ${this.commandQueue.length}`);
      return;
    }

    console.log(`🔄 [QUEUE] Starting queue processing with ${this.commandQueue.length} commands`);
    this.isProcessingQueue = true;

    while (this.commandQueue.length > 0) {
      // Implement connection-aware throttling to prevent overwhelming the adapter
      const timeSinceLastCommand = Date.now() - this.lastCommandTime;
      const throttleDelay = this.getThrottleDelay();
      
      if (timeSinceLastCommand < throttleDelay) {
        const delay = throttleDelay - timeSinceLastCommand;
        console.log(`⏱️ [QUEUE] Throttling (${this.connectionInfo.type}): waiting ${delay}ms before next command`);
        await this.delay(delay);
      }
      
      // Clear any stale commands (older than 30 seconds)
      this.clearStaleCommands();
      
      if (this.commandQueue.length === 0) break;
      
      // Sort queue by priority (HIGH=0, MEDIUM=1, LOW=2) and timestamp (newer first for same priority)
      this.commandQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority; // Lower number = higher priority
        }
        return b.timestamp - a.timestamp; // Newer commands first for same priority
      });
      
      this.currentCommand = this.commandQueue.shift()!;
      console.log(`🔄 [QUEUE] Processing ${CommandPriority[this.currentCommand.priority]} priority command: ${this.currentCommand.command} (${this.commandQueue.length} remaining)`);
      this.lastCommandTime = Date.now();
      
      try {
        if (!this.commService) {
          console.error(`❌ [QUEUE] Communication service unavailable for command: ${this.currentCommand.command}`);
          const errorResponse: ELM327Response = {
            success: false,
            data: '',
            error: 'Communication service unavailable',
            responseType: 'ERROR',
            rawResponse: ''
          };
          this.currentCommand.reject(errorResponse);
          this.currentCommand = null;
          continue;
        }

        console.log(`📡 [QUEUE] Sending ELM327 command to adapter: ${this.currentCommand.command}`);
        console.log(`📡 [QUEUE] Command details: expectedResponse=${this.currentCommand.expectedResponseType}, isMode22=${this.currentCommand.isMode22}`);

        // Clear response buffer before sending command
        this.responseBuffer = '';
        console.log(`🧹 [QUEUE] Response buffer cleared for command: ${this.currentCommand.command}`);

        // Get appropriate timeout for this command
        const commandTimeout = ELM327Handler.getCommandTimeout(this.currentCommand.command);
        console.log(`⏰ [QUEUE] Command timeout set to: ${commandTimeout}ms for ${this.currentCommand.command}`);
        
        // Set up timeout with proper ELM327 error handling
        const timeoutId = setTimeout(() => {
          if (this.currentCommand) {
            console.log(`ELM327 command timeout: ${this.currentCommand.command}`);
            
            // Check if retries are available
            if (this.currentCommand.retries && this.currentCommand.retries > 0) {
              console.log(`Retrying ELM327 command: ${this.currentCommand.command}, retries left: ${this.currentCommand.retries - 1}`);
              
              // Retry the command with decremented retry count
              const retryCommand = {
                ...this.currentCommand,
                retries: this.currentCommand.retries - 1,
                timestamp: Date.now()
              };
              
              // Clear the response buffer when retrying to avoid accumulation
              console.log('ELM327 clearing response buffer for retry');
              this.responseBuffer = '';
              
              this.commandQueue.unshift(retryCommand); // Add to front of queue
              this.currentCommand = null;
            } else {
              const timeoutResponse: ELM327Response = {
                success: false,
                data: '',
                error: `ELM327 command timeout: ${this.currentCommand.command}`,
                responseType: 'ERROR',
                rawResponse: ''
              };
              this.currentCommand.reject(timeoutResponse);
              this.currentCommand = null;
            }
          }
        }, commandTimeout);

        // Format command according to ELM327 specifications
        const formattedCommand = ELM327Handler.formatCommand(this.currentCommand.command);
        console.log(`[TERMINAL-QUEUE] Formatted command for device: "${formattedCommand}"`);
        console.log(`[TERMINAL-QUEUE] Sending via commService (${this.connectionInfo.type})`);
        const success = await this.commService.sendData(formattedCommand);
        
        if (!success) {
          clearTimeout(timeoutId);
          const sendErrorResponse: ELM327Response = {
            success: false,
            data: '',
            error: 'Failed to send command to ELM327',
            responseType: 'ERROR',
            rawResponse: ''
          };
          this.currentCommand.reject(sendErrorResponse);
          this.currentCommand = null;
          continue;
        }

        // Wait for response (the response will be handled in handleDataReceived)
        await new Promise<void>((resolve, reject) => {
          const originalResolve = this.currentCommand!.resolve;
          const originalReject = this.currentCommand!.reject;

          this.currentCommand!.resolve = (response: ELM327Response) => {
            clearTimeout(timeoutId);
            originalResolve(response);
            resolve();
          };

          this.currentCommand!.reject = (error: any) => {
            clearTimeout(timeoutId);
            originalReject(error);
            reject(error);
          };
        });

        const wasMode22 = this.currentCommand?.isMode22 || false;
        this.currentCommand = null;
        
        // Update last command time for throttling
        this.lastCommandTime = Date.now();
        
        // ELM327 datasheet recommends small delays between commands
        await this.delay(wasMode22 ? 200 : 100); // Longer delay for Mode 22

      } catch (error: any) {
        console.error('Error processing ELM327 command:', error);
        if (this.currentCommand) {
          const processErrorResponse: ELM327Response = {
            success: false,
            data: '',
            error: error.message || 'Unknown error processing command',
            responseType: 'ERROR',
            rawResponse: ''
          };
          this.currentCommand.reject(processErrorResponse);
          this.currentCommand = null;
        }
        
        // Continue with next command even if this one failed
        continue;
      }
    }

    this.isProcessingQueue = false;
  }

  private handleDataReceived = (data: any) => {
    console.log('[TERMINAL-DATA] ELM327 raw data received:', JSON.stringify(data));
    
    // Extract the actual data string from the event object
    const dataString = typeof data === 'string' ? data : data.data || '';
    console.log('[TERMINAL-DATA] Extracted data string:', JSON.stringify(dataString));
    
    this.responseBuffer += dataString;
    console.log('[TERMINAL-DATA] Response buffer after adding data:', JSON.stringify(this.responseBuffer));
    
    if (this.currentCommand) {
      console.log('[TERMINAL-DATA] Current command waiting for response:', this.currentCommand.command);
    } else {
      console.log('[TERMINAL-DATA] No current command waiting');
    }

    // Enhanced response parsing to handle malformed/concatenated data
    const responses = this.parseResponseBuffer();
    
    console.log('ELM327 responses to process:', responses);
    console.log('ELM327 remaining buffer:', JSON.stringify(this.responseBuffer));

    // Process all complete responses using ELM327 specifications
    for (const response of responses) {
      const trimmedResponse = response.trim();
      
      if (trimmedResponse.length === 0) continue;

      console.log('Processing ELM327 response:', trimmedResponse);

      // Parse response according to ELM327 datasheet
      const elm327Response = ELM327Handler.parseResponse(trimmedResponse);
      console.log('Parsed ELM327 response:', elm327Response);

      // Handle command responses if we have a pending command
      if (this.currentCommand) {
        const isComplete = ELM327Handler.isCompleteResponse(elm327Response, this.currentCommand.command);
        console.log(`ELM327 response complete for "${this.currentCommand.command}": ${isComplete}`);
        
        if (isComplete) {
          console.log(`ELM327 command response for ${this.currentCommand.command}:`, elm327Response);
          
          // Check if this is a Mode 22 response and parse odometer data
          if (this.currentCommand?.isMode22 && elm327Response.responseType === 'DATA') {
            this.parseMode22OdometerData(elm327Response.data);
          }
          
          this.currentCommand.resolve(elm327Response);
          this.currentCommand = null; // Clear the current command
          return; // Exit processing once we handle the current command
        } else if (elm327Response.responseType === 'ECHO') {
          // Command echo - ignore and continue waiting for actual response
          console.log('Ignoring ELM327 command echo:', trimmedResponse);
          continue;
        } else if (elm327Response.responseType === 'SEARCHING') {
          // ELM327 is searching for protocol - continue waiting
          console.log('ELM327 searching for protocol...');
          continue;
        } else if (elm327Response.responseType === 'ERROR') {
          // ELM327 reported an error for current command
          console.log('ELM327 error response for command:', elm327Response);
          this.currentCommand.resolve(elm327Response);
          this.currentCommand = null;
          return; // Exit processing once we handle the current command
        }
      }

      // Try to parse as OBD data if it's a data response
      if (elm327Response.responseType === 'DATA' && 
          OBDIIParser.isValidResponse(elm327Response.data)) {
        const parsedData = OBDIIParser.parse(elm327Response.data);
        if (parsedData) {
          console.log('Parsed OBD data from ELM327:', parsedData);
          this.notifySubscribers('dataUpdate', parsedData);
        }
      }
    }

    // Check if buffer contains a complete response without line endings
    // This handles ELM327 adapters that don't send proper line terminators
    if (this.responseBuffer.length > 0 && this.currentCommand) {
      const trimmedBuffer = this.responseBuffer.trim();
      
      // Try to extract the actual OBD response from buffer (after the echo)
      let responseToCheck = trimmedBuffer;
      
      // If buffer contains both echo and response, extract just the response part
      if (trimmedBuffer.includes('>')) {
        const parts = trimmedBuffer.split('>');
        if (parts.length > 1) {
          // Look for the part that contains the actual response
          for (let i = 1; i < parts.length; i++) {
            const part = parts[i].trim();
            if (part) {
              // For AT commands, look for OK, ERROR, or specific responses
              if (this.currentCommand.command.startsWith('AT')) {
                if (part.includes('OK') || part.includes('ERROR') || part.includes('ELM327')) {
                  // Extract just the response part (OK, ERROR, etc.)
                  if (part.includes('OK')) {
                    responseToCheck = 'OK';
                  } else if (part.includes('ERROR')) {
                    responseToCheck = 'ERROR';
                  } else if (part.includes('ELM327')) {
                    responseToCheck = part;
                  } else if (part.includes('AUTO') || part.includes('ISO') || part.includes('CAN') || part.includes('KWP') || part.includes('PWM')) {
                    responseToCheck = part.includes('AUTO') ? 'AUTO' : part;
                  }
                  break;
                }
              } else {
                // For OBD commands, look for hex data
                if (!part.startsWith('AT') && part.length > 4) {
                  responseToCheck = part;
                  break;
                }
              }
            }
          }
        }
      }
      
      console.log('ELM327 checking buffer response:', responseToCheck);
      const bufferResponse = ELM327Handler.parseResponse(responseToCheck);
      
      if (ELM327Handler.isCompleteResponse(bufferResponse, this.currentCommand.command)) {
        console.log(`ELM327 buffer response for ${this.currentCommand.command}:`, bufferResponse);
        this.currentCommand.resolve(bufferResponse);
        this.currentCommand = null; // Clear the current command
        this.responseBuffer = ''; // Clear the buffer
      } else {
        // If we have a substantial buffer but it's not recognized as complete,
        // try additional pattern matching
        if (this.responseBuffer.length > 5) {
          console.log('ELM327 large buffer detected, checking for patterns...');
          
          let patternFound = false;
          
          // For AT commands, look for OK or ERROR patterns
          if (this.currentCommand.command.startsWith('AT')) {
            if (trimmedBuffer.includes('OK')) {
              console.log('ELM327 found OK pattern in buffer');
              const okResponse = ELM327Handler.parseResponse('OK');
              if (ELM327Handler.isCompleteResponse(okResponse, this.currentCommand.command)) {
                console.log(`ELM327 OK pattern response for ${this.currentCommand.command}:`, okResponse);
                this.currentCommand.resolve(okResponse);
                this.currentCommand = null;
                this.responseBuffer = '';
                patternFound = true;
              }
            } else if (trimmedBuffer.includes('ERROR')) {
              console.log('ELM327 found ERROR pattern in buffer');
              const errorResponse = ELM327Handler.parseResponse('ERROR');
              this.currentCommand.resolve(errorResponse);
              this.currentCommand = null;
              this.responseBuffer = '';
              patternFound = true;
            } else if (trimmedBuffer.includes('AUTO') && this.currentCommand.command === 'ATDP') {
              console.log('ELM327 found AUTO protocol pattern in buffer');
              const autoResponse = ELM327Handler.parseResponse('AUTO');
              if (ELM327Handler.isCompleteResponse(autoResponse, this.currentCommand.command)) {
                console.log(`ELM327 AUTO pattern response for ${this.currentCommand.command}:`, autoResponse);
                this.currentCommand.resolve(autoResponse);
                this.currentCommand = null;
                this.responseBuffer = '';
                patternFound = true;
              }
            }
          }
          
          // For OBD commands, look for hex pattern in buffer (like "41 00 BE 1F A8 13")
          if (!patternFound && this.currentCommand && !this.currentCommand.command.startsWith('AT')) {
            // Look for hex patterns even if buffer contains status messages like "SEARCHING"
            const upperBuffer = trimmedBuffer.toUpperCase();
            
            // Check for severe error conditions that should prevent hex extraction
            const hasErrors = upperBuffer.includes('ERROR') || upperBuffer.includes('NO DATA') ||
                             upperBuffer.includes('UNABLE TO CONNECT') || upperBuffer.includes('BUFFER FULL') ||
                             upperBuffer.includes('CAN ERROR');
            
            if (!hasErrors) {
              // Look for proper hex data patterns - should be isolated hex bytes, not part of words
              // This regex will find hex patterns even after status messages like "SEARCHING..."
              const hexMatch = trimmedBuffer.match(/(?:^|\s|>|SEARCHING\.\.\.|STOPPED)([0-9A-F]{2}(?:[0-9A-F]{2}|[\s][0-9A-F]{2})+)(?:\s|$|>)/i);
              if (hexMatch && hexMatch[1].length >= 4) { // At least "XXXX" (4 chars minimum)
                let hexString = hexMatch[1];
                
                // Clean up the hex string by removing extra spaces but preserving byte boundaries
                hexString = hexString.replace(/\s+/g, '').match(/.{1,2}/g)?.join(' ') || hexString;
                
                console.log('ELM327 found valid hex pattern in buffer (after status message):', hexString);
                
                // Additional validation - ensure it's proper hex data format
                const cleanHex = hexString.replace(/\s+/g, '');
                if (cleanHex.length >= 4 && cleanHex.length % 2 === 0 && /^[0-9A-F]+$/.test(cleanHex)) {
                  const hexResponse = ELM327Handler.parseResponse(hexString);
                  
                  if (ELM327Handler.isCompleteResponse(hexResponse, this.currentCommand!.command)) {
                    console.log(`ELM327 hex pattern response for ${this.currentCommand!.command}:`, hexResponse);
                    this.currentCommand!.resolve(hexResponse);
                    this.currentCommand = null;
                    this.responseBuffer = '';
                    patternFound = true;
                  }
                }
              }
            } else {
              console.log('ELM327 skipping hex pattern search due to error conditions:', upperBuffer);
            }
          }
        }
      }
    }
  };

  /**
   * Enhanced response buffer parsing to handle malformed/concatenated data
   */
  private parseResponseBuffer(): string[] {
    const responses: string[] = [];
    let workingBuffer = this.responseBuffer;
    
    // Handle concatenated responses by looking for patterns
    // Common pattern: >ECHOCOMMANDRESPONSE (e.g., >ATE0OK)
    if (workingBuffer.includes('>')) {
      // Extract content after >
      const afterPrompt = workingBuffer.substring(workingBuffer.indexOf('>') + 1);
      
      if (afterPrompt.length > 0) {
        // Look for concatenated echo+response patterns
        const concatenatedMatch = this.extractConcatenatedResponse(afterPrompt);
        if (concatenatedMatch) {
          responses.push(...concatenatedMatch);
          this.responseBuffer = '';
          return responses;
        }
        
        // Simple case: just the content after >
        responses.push(afterPrompt.trim());
        this.responseBuffer = '';
      }
      return responses;
    }
    
    // Fallback to line-based parsing if no > patterns found
    const lineResponses = workingBuffer.split(/[\r\n]+/);
    this.responseBuffer = lineResponses.pop() || '';
    
    return lineResponses.filter(line => line.trim().length > 0);
  }
  
  /**
   * Extract separate responses from concatenated data like "ATE0OK"
   */
  private extractConcatenatedResponse(data: string): string[] | null {
    const trimmed = data.trim();
    
    // Check for AT command + OK pattern (e.g., "ATE0OK")
    const atOkMatch = trimmed.match(/^(AT[A-Z0-9]+)(OK)$/i);
    if (atOkMatch && this.currentCommand?.command.toUpperCase() === atOkMatch[1].toUpperCase()) {
      return [atOkMatch[1], atOkMatch[2]];
    }
    
    // Check for AT command + ERROR pattern (e.g., "ATE0ERROR")
    const atErrorMatch = trimmed.match(/^(AT[A-Z0-9]+)(ERROR)$/i);
    if (atErrorMatch && this.currentCommand?.command.toUpperCase() === atErrorMatch[1].toUpperCase()) {
      return [atErrorMatch[1], atErrorMatch[2]];
    }
    
    // Check for OBD command + hex response pattern (e.g., "01054100BE3E")
    const obdMatch = trimmed.match(/^([0-9A-F]{4})([0-9A-F]{4,})$/i);
    if (obdMatch && this.currentCommand?.command.toUpperCase() === obdMatch[1].toUpperCase()) {
      return [obdMatch[1], obdMatch[2]];
    }
    
    return null;
  }

  /**
   * Determine command priority based on PID and command type
   */
  private getCommandPriority(command: string): CommandPriority {
    // Extract PID from command (assumes format like "01 0C" for Mode 01 PID 0C)
    const parts = command.trim().split(' ');
    if (parts.length >= 2) {
      const mode = parts[0];
      const pid = parts[1];
      
      // Mode 01 (live data) prioritization
      if (mode === '01') {
        if (this.HIGH_PRIORITY_PIDS.has(pid)) {
          return CommandPriority.HIGH;
        }
        if (this.MEDIUM_PRIORITY_PIDS.has(pid)) {
          return CommandPriority.MEDIUM;
        }
        return CommandPriority.LOW;
      }
      
      // Mode 03 (DTCs) - LOW priority
      if (mode === '03' || mode === '04') {
        return CommandPriority.LOW;
      }
      
      // Mode 22 (manufacturer specific) - LOW priority
      if (mode === '22') {
        return CommandPriority.LOW;
      }
    }
    
    // AT commands and others - MEDIUM priority
    return CommandPriority.MEDIUM;
  }

  /**
   * Get command category for better organization
   */
  private getCommandCategory(command: string): 'realtime' | 'dashboard' | 'diagnostic' | 'other' {
    const parts = command.trim().split(' ');
    if (parts.length >= 2) {
      const mode = parts[0];
      const pid = parts[1];
      
      if (mode === '01') {
        if (this.HIGH_PRIORITY_PIDS.has(pid)) {
          return 'realtime';
        }
        if (this.MEDIUM_PRIORITY_PIDS.has(pid)) {
          return 'dashboard';
        }
      }
      
      if (mode === '03' || mode === '04' || mode === '22') {
        return 'diagnostic';
      }
    }
    
    return 'other';
  }

  /**
   * Check if command can be added to queue based on priority limits
   */
  private canAddToQueue(priority: CommandPriority): boolean {
    const priorityCounts = this.getQueuePriorityCounts();
    
    // Check total queue size
    if (this.commandQueue.length >= this.MAX_TOTAL_QUEUE_SIZE) {
      return false;
    }
    
    // Check priority-specific limits
    switch (priority) {
      case CommandPriority.HIGH:
        return priorityCounts.high < this.MAX_QUEUE_SIZE_HIGH;
      case CommandPriority.MEDIUM:
        return priorityCounts.medium < this.MAX_QUEUE_SIZE_MEDIUM;
      case CommandPriority.LOW:
        return priorityCounts.low < this.MAX_QUEUE_SIZE_LOW;
      default:
        return false;
    }
  }

  /**
   * Get count of commands by priority in queue
   */
  private getQueuePriorityCounts(): { high: number; medium: number; low: number } {
    return this.commandQueue.reduce((counts, cmd) => {
      switch (cmd.priority) {
        case CommandPriority.HIGH:
          counts.high++;
          break;
        case CommandPriority.MEDIUM:
          counts.medium++;
          break;
        case CommandPriority.LOW:
          counts.low++;
          break;
      }
      return counts;
    }, { high: 0, medium: 0, low: 0 });
  }

  /**
   * Remove duplicate commands from queue (keeping the most recent)
   */
  private deduplicateQueue(): void {
    const seen = new Map<string, number>();
    const toRemove: number[] = [];
    
    // Find duplicates (keep the most recent)
    for (let i = this.commandQueue.length - 1; i >= 0; i--) {
      const cmd = this.commandQueue[i];
      const key = cmd.pid || cmd.command;
      
      if (seen.has(key)) {
        // Mark older duplicate for removal
        toRemove.push(seen.get(key)!);
      }
      seen.set(key, i);
    }
    
    // Remove duplicates in reverse order to maintain indices
    for (const index of toRemove.sort((a, b) => b - a)) {
      const removedCmd = this.commandQueue.splice(index, 1)[0];
      console.log(`🔄 [QUEUE] Removed duplicate command: ${removedCmd.command}`);
      removedCmd.reject({
        success: false,
        data: '',
        error: 'Command superseded by newer request',
        responseType: 'ERROR',
        rawResponse: ''
      } as ELM327Response);
    }
  }

  /**
   * Smart eviction: remove low priority commands to make room for higher priority ones
   */
  private evictLowPriorityCommands(targetPriority: CommandPriority): boolean {
    if (targetPriority === CommandPriority.LOW) {
      return false; // Don't evict for low priority commands
    }
    
    // Find lowest priority commands to evict
    const targetPriorityValue = targetPriority as number;
    const evictable = this.commandQueue
      .map((cmd, index) => ({ cmd, index }))
      .filter(({ cmd }) => (cmd.priority as number) > targetPriorityValue)
      .sort((a, b) => (b.cmd.priority as number) - (a.cmd.priority as number));
    
    if (evictable.length > 0) {
      const { cmd, index } = evictable[0];
      this.commandQueue.splice(index, 1);
      console.log(`⚡ [QUEUE] Evicted low priority command: ${cmd.command} for higher priority request`);
      cmd.reject({
        success: false,
        data: '',
        error: 'Command evicted for higher priority request',
        responseType: 'ERROR',
        rawResponse: ''
      } as ELM327Response);
      return true;
    }
    
    return false;
  }

  /**
   * Get connection-aware throttle delay
   */
  private getThrottleDelay(): number {
    const connectionType = this.connectionInfo.type;
    return this.THROTTLE_DELAYS[connectionType as keyof typeof this.THROTTLE_DELAYS] || 100;
  }

  /**
   * Run diagnostic tests to check adapter responsiveness
   */
  private async runAdapterDiagnostics(): Promise<void> {
    console.log('🔍 [DIAG] Testing different command formats to wake up adapter...');
    
    if (!this.commService) {
      console.warn('🔍 [DIAG] No communication service available');
      return;
    }

    const testCommands = [
      '\r\n',           // Simple wake up
      'ATI\r\n',        // Get version info (simpler than ATZ)
      'AT\r\n',         // Basic AT command
      'ATZ\r\n',        // Reset command
    ];

    for (const cmd of testCommands) {
      try {
        console.log(`🔍 [DIAG] Testing command: ${JSON.stringify(cmd)}`);
        await this.commService.sendData(cmd);
        
        // Wait briefly to see if we get any response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.warn(`🔍 [DIAG] Failed to send test command ${JSON.stringify(cmd)}:`, error);
      }
    }
    
    console.log('🔍 [DIAG] Diagnostic tests completed - check logs for any received data');
  }

  /**
   * Clear stale commands from the queue to prevent memory buildup
   */
  private clearStaleCommands(): void {
    const now = Date.now();
    const STALE_TIMEOUT = 30000; // 30 seconds
    const REALTIME_TIMEOUT = 5000; // 5 seconds for realtime commands
    
    const initialLength = this.commandQueue.length;
    this.commandQueue = this.commandQueue.filter(command => {
      const age = now - command.timestamp;
      const timeout = command.priority === CommandPriority.HIGH ? REALTIME_TIMEOUT : STALE_TIMEOUT;
      
      if (age > timeout) {
        console.log(`⏰ [QUEUE] Removing stale command: ${command.command} (age: ${age}ms, priority: ${CommandPriority[command.priority]})`);
        command.reject({
          success: false,
          data: '',
          error: 'Command timed out in queue',
          responseType: 'ERROR',
          rawResponse: ''
        } as ELM327Response);
        return false;
      }
      return true;
    });
    
    const removedCount = initialLength - this.commandQueue.length;
    if (removedCount > 0) {
      console.log(`🗑️ [QUEUE] Removed ${removedCount} stale commands, queue size: ${this.commandQueue.length}`);
    }
  }

  // Legacy method removed - now using ELM327Handler.parseResponse() and ELM327Handler.isCompleteResponse()

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
        unit: pid.unit!,
        timestamp: new Date(),
        raw: `simulated:${simulatedValue}`,
        mode: pid.mode,
        pid: pid.pid,
      };
      this.notifySubscribers('dataUpdate', parsedData);
      return parsedData;
    }

    try {
      let command: string;

      if (pid.mode === '22') {
        // Mode 22 command
        if (!this.mode22Supported) {
          console.warn(`Mode 22 not supported, skipping ${pidName}`);
          return null;
        }
        command = `22${pid.pid}`;
      } else {
        // Standard OBD-II command
        command = `${pid.mode}${pid.pid}`;
      }

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
      // Convert raw simulation data to ParsedPIDData format
      this.processSimulationData(data);
    }
  };

  /**
   * Convert raw simulation data to ParsedPIDData format and emit individual events
   */
  private processSimulationData(rawData: { [key: string]: number }): void {
    // Map raw simulation keys to PID names and emit individual dataUpdate events
    Object.entries(rawData).forEach(([key, value]) => {
      const pidName = this.mapSimulationKeyToPIDName(key);
      if (pidName) {
        // Create ParsedPIDData object
        const parsedData = {
          name: pidName,
          value: this.convertSimulationValue(pidName, value),
          unit: this.getPIDUnit(pidName),
          timestamp: new Date().toISOString(),
          raw: value.toString()
        };

        // Emit individual dataUpdate event for this PID
        this.notifySubscribers('dataUpdate', parsedData);
      }
    });
  }

  /**
   * Map simulation data keys to standard PID names
   */
  private mapSimulationKeyToPIDName(simKey: string): string | null {
    const keyMapping: { [key: string]: string } = {
      'ENGINE_RPM': 'ENGINE_RPM',
      'VEHICLE_SPEED': 'VEHICLE_SPEED',
      'ENGINE_COOLANT_TEMP': 'ENGINE_COOLANT_TEMP',
      'THROTTLE_POSITION': 'THROTTLE_POSITION',
      'ENGINE_LOAD': 'ENGINE_LOAD',
      'FUEL_LEVEL': 'FUEL_LEVEL',
      'INTAKE_AIR_TEMP': 'INTAKE_AIR_TEMP',
      'MAF_RATE': 'MAF_RATE',
      'TRIP_DISTANCE': 'TRIP_DISTANCE',
      'TOTAL_DISTANCE': 'TOTAL_DISTANCE', // This is the key odometer mapping
      // Alternative odometer names that simulation might use
      'ODOMETER': 'TOTAL_DISTANCE',
      'VEHICLE_ODOMETER': 'TOTAL_DISTANCE',
      'TOTAL_DISTANCE_TRAVELED': 'TOTAL_DISTANCE'
    };

    return keyMapping[simKey] || null;
  }

  /**
   * Convert simulation values to appropriate units for display
   */
  private convertSimulationValue(pidName: string, value: number): number {
    // Convert km to miles for odometer data if needed
    if (pidName === 'TOTAL_DISTANCE' || pidName === 'TRIP_DISTANCE') {
      // MockDataGenerator outputs in km, dashboard might expect miles
      // For now, keep in km but ensure consistency
      return Math.round(value);
    }

    // For other PIDs, return as-is
    return value;
  }

  /**
   * Get appropriate unit for PID
   */
  private getPIDUnit(pidName: string): string {
    const unitMapping: { [key: string]: string } = {
      'ENGINE_RPM': 'rpm',
      'VEHICLE_SPEED': 'km/h',
      'ENGINE_COOLANT_TEMP': '°C',
      'THROTTLE_POSITION': '%',
      'ENGINE_LOAD': '%',
      'FUEL_LEVEL': '%',
      'INTAKE_AIR_TEMP': '°C',
      'MAF_RATE': 'g/s',
      'TRIP_DISTANCE': 'km',
      'TOTAL_DISTANCE': 'km'
    };

    return unitMapping[pidName] || '';
  }

  public startLiveData(): void {
    if (this.connectionInfo.status !== 'connected') {
      console.warn('Cannot start live data - not connected');
      return;
    }

    console.log('Starting live data stream...');

    // Get dashboard PIDs
    const dashboardPIDs = [
      'ENGINE_RPM',
      'VEHICLE_SPEED',
      'ENGINE_COOLANT_TEMP',
      'ENGINE_LOAD',
      'THROTTLE_POSITION',
      'FUEL_LEVEL'
    ];

    // Get fraud detection PIDs
    const fraudDetectionPIDs = [
      'DISTANCE_SINCE_CODES_CLEARED',
      'DISTANCE_WITH_MIL_ON',
      'RUNTIME_SINCE_ENGINE_START'
    ];

    // Combine all PIDs to poll
    const allPIDs = [...dashboardPIDs, ...fraudDetectionPIDs];

    // Add odometer PID if available and supported
    if (this.activeOdometerPID) {
      const odometerPID = PIDDefinitions.getPID(this.activeOdometerPID);
      if (odometerPID) {
        if (odometerPID.mode === '22' && this.mode22Supported) {
          allPIDs.push(this.activeOdometerPID);
          console.log(`Added odometer PID to polling: ${this.activeOdometerPID}`);
        } else if (odometerPID.mode === '01') {
          allPIDs.push(this.activeOdometerPID);
          console.log(`Added standard odometer PID to polling: ${this.activeOdometerPID}`);
        } else {
          console.warn(`Odometer PID ${this.activeOdometerPID} not supported (Mode 22 unavailable)`);
        }
      }
    }

    // Start polling each supported PID
    allPIDs.forEach(pidName => {
      const isSimulation = this.connectionInfo.type === 'simulation';
      const pidSupported = this.isPIDSupported(pidName);
      const noDiscoveredPIDs = this.supportedPIDs.size === 0;
      const isOdometerPID = pidName === this.activeOdometerPID;

      // Different intervals for different types of data
      let interval = 1500; // Default interval

      if (fraudDetectionPIDs.includes(pidName) || isOdometerPID) {
        interval = 5000; // Slower polling for fraud detection PIDs and odometer (less frequent updates)
      }

      if (pidSupported || isSimulation || noDiscoveredPIDs || isOdometerPID) {
        this.startPollingPID(pidName, interval);
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

  /**
   * Handle simulation commands including Mode 22
   */
  private async handleSimulationCommand(command: string): Promise<string> {
    // Extract mode and PID from command
    const mode = command.substring(0, 2);
    const pid = command.substring(2);

    if (mode === '22') {
      // Mode 22 simulation
      return this.simulateMode22Response(pid);
    } else {
      // Standard OBD-II simulation
      return `41${pid}${this.generateSimulationData(pid)}`;
    }
  }

  /**
   * Generate simulated Mode 22 responses
   */
  private simulateMode22Response(pid: string): string {
    const responses: { [key: string]: string } = {
      '25AE': '6225AE000FA123', // Toyota odometer simulation: ~1,000,000 km
      '00C0': '6200C01E8B',     // Honda odometer simulation: ~500,000 km
      'DD01': '62DD01000C3F2A', // Ford odometer simulation: ~800,000 km
    };

    return responses[pid] || `62${pid}NODATA`;
  }

  private generateSimulationData(pid: string): string {
    // Generate realistic simulation data for different PIDs
    const data: { [key: string]: string } = {
      '0C': '1A50', // RPM: ~1700
      '0D': '28',   // Speed: 40 km/h
      '05': '5F',   // Coolant temp: 55°C
      '04': '3F',   // Engine load: ~25%
      '11': '32',   // Throttle: ~20%
      '2F': 'B3',   // Fuel level: ~70%
    };

    return data[pid] || '00';
  }

  /**
   * Parse Mode 22 odometer data and emit as parsed PID data
   */
  private parseMode22OdometerData(response: string): void {
    try {
      // Extract PID from response (characters 2-5 for most PIDs)
      const pidFromResponse = response.substring(2, 6);

      // Find matching PID definition
      const allPIDs = PIDDefinitions.getAllOdometerPIDs();
      const matchingPID = allPIDs.find(pid =>
        pid.mode === '22' && pid.pid === pidFromResponse
      );

      if (matchingPID) {
        // Extract data bytes (skip '62' + PID)
        const dataStart = 2 + matchingPID.pid.length;
        const hexData = response.substring(dataStart);

        // Convert hex string to byte array
        const bytes: number[] = [];
        for (let i = 0; i < hexData.length; i += 2) {
          const byteHex = hexData.substring(i, i + 2);
          if (byteHex.length === 2) {
            bytes.push(parseInt(byteHex, 16));
          }
        }

        // Parse the data using the PID's parse function
        const parsedValue = matchingPID.parse(bytes);

        // Create parsed PID data object
        const parsedData: ParsedPIDData = {
          name: matchingPID.name,
          value: parsedValue,
          unit: matchingPID.unit || '',
          timestamp: new Date(),
          raw: response
        };

        console.log(`Parsed Mode 22 odometer data: ${matchingPID.name} = ${parsedValue} ${matchingPID.unit}`);

        // Emit the parsed data
        this.notifySubscribers('dataUpdate', parsedData);
      }
    } catch (error) {
      console.error('Error parsing Mode 22 odometer data:', error);
    }
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

  public isConnected(): boolean {
    return this.connectionInfo.status === 'connected';
  }

  public getConnectionInfo(): ConnectionInfo {
    return { ...this.connectionInfo };
  }

  public getVehicleInfo(): VehicleInfo {
    return { ...this.currentVehicleInfo };
  }

  public getActiveOdometerPID(): string | null {
    return this.activeOdometerPID;
  }

  public isMode22Supported(): boolean {
    return this.mode22Supported;
  }

  /**
   * Send a raw command directly bypassing queue (for terminal debugging)
   */
  public async sendRawCommandDirect(command: string): Promise<ELM327Response> {
    console.log(`[TERMINAL-DIRECT] Direct command: "${command}"`);
    
    if (this.connectionInfo.status !== 'connected' || !this.commService) {
      return {
        success: false,
        data: '',
        error: 'Not connected to adapter',
        responseType: 'ERROR',
        rawResponse: ''
      };
    }

    if (this.connectionInfo.type === 'simulation') {
      const simulatedResponse = this.simulateRawCommand(command);
      return {
        success: true,
        data: simulatedResponse,
        responseType: 'DATA',
        rawResponse: simulatedResponse
      };
    }

    try {
      // Clear response buffer
      this.responseBuffer = '';
      
      // Format and send command directly
      const formattedCommand = ELM327Handler.formatCommand(command.trim().toUpperCase());
      console.log(`[TERMINAL-DIRECT] Sending directly: "${formattedCommand}"`);
      
      const success = await this.commService.sendData(formattedCommand);
      if (!success) {
        return {
          success: false,
          data: '',
          error: 'Failed to send command',
          responseType: 'ERROR',
          rawResponse: ''
        };
      }

      // Wait for response with timeout
      return new Promise((resolve) => {
        let responseReceived = false;
        const timeout = setTimeout(() => {
          if (!responseReceived) {
            responseReceived = true;
            resolve({
              success: false,
              data: '',
              error: 'Command timeout',
              responseType: 'ERROR',
              rawResponse: this.responseBuffer
            });
          }
        }, 5000);

        const checkResponse = () => {
          if (responseReceived) return;
          
          if (this.responseBuffer.length > 0) {
            const buffer = this.responseBuffer.trim();
            console.log(`[TERMINAL-DIRECT] Response buffer: "${buffer}"`);
            
            // Check if we have a complete response
            if (buffer.endsWith('>') || buffer.includes('\r') || buffer.includes('\n')) {
              responseReceived = true;
              clearTimeout(timeout);
              
              const cleanResponse = buffer.replace(/>/g, '').trim();
              resolve({
                success: true,
                data: cleanResponse,
                responseType: 'DATA',
                rawResponse: cleanResponse
              });
              return;
            }
          }
          
          // Keep checking
          setTimeout(checkResponse, 100);
        };
        
        checkResponse();
      });
    } catch (error) {
      console.error(`[TERMINAL-DIRECT] Error:`, error);
      return {
        success: false,
        data: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseType: 'ERROR',
        rawResponse: ''
      };
    }
  }

  /**
   * Send a raw command directly to the ELM327 adapter without parsing
   * Returns the raw response for terminal use
   */
  public async sendRawCommand(command: string): Promise<ELM327Response> {
    console.log(`[TERMINAL] sendRawCommand called with: "${command}"`);
    console.log(`[TERMINAL] Connection status: ${this.connectionInfo.status}, type: ${this.connectionInfo.type}`);
    
    if (this.connectionInfo.status !== 'connected') {
      console.log(`[TERMINAL] Not connected, returning error`);
      return {
        success: false,
        data: '',
        error: 'Not connected to adapter',
        responseType: 'ERROR',
        rawResponse: ''
      };
    }

    if (this.connectionInfo.type === 'simulation') {
      // Simulate raw command responses for common commands
      console.log(`[TERMINAL] Using simulation mode for command: ${command}`);
      await this.delay(100);
      const simulatedResponse = this.simulateRawCommand(command);
      console.log(`[TERMINAL] Simulation response: ${simulatedResponse}`);
      return {
        success: true,
        data: simulatedResponse,
        responseType: 'DATA',
        rawResponse: simulatedResponse
      };
    }

    try {
      console.log(`[TERMINAL] Using real device communication for command: ${command}`);
      // Use sendELM327Command for raw commands with timeout
      const elm327Command = {
        command: command.trim().toUpperCase(),
        expectsData: true,
        timeout: 5000, // Increased timeout for terminal commands
        description: `Terminal command: ${command}`
      };

      console.log(`[TERMINAL] Sending ELM327 command:`, elm327Command);
      const response = await this.sendELM327Command(elm327Command);
      console.log(`[TERMINAL] Received ELM327 response:`, response);
      return response;
    } catch (error) {
      console.error(`[TERMINAL] Error sending raw command:`, error);
      return {
        success: false,
        data: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseType: 'ERROR',
        rawResponse: ''
      };
    }
  }


  /**
   * Simulate raw command responses for terminal testing
   */
  private simulateRawCommand(command: string): string {
    const upperCommand = command.toUpperCase().trim();
    
    // Common AT commands
    if (upperCommand === 'ATZ') return 'ELM327 v1.5';
    if (upperCommand === 'ATE0') return 'OK';
    if (upperCommand === 'ATE1') return 'OK';
    if (upperCommand === 'ATL0') return 'OK';
    if (upperCommand === 'ATH0') return 'OK';
    if (upperCommand === 'ATS0') return 'OK';
    if (upperCommand === 'ATM0') return 'OK';
    if (upperCommand === 'ATSP0') return 'OK';
    if (upperCommand === 'ATAT1') return 'OK';
    if (upperCommand === 'ATAT2') return 'OK';
    if (upperCommand === 'ATDP') return 'ISO 15765-4 (CAN 11/500)';
    if (upperCommand === 'ATRV') return '12.6V';
    if (upperCommand === 'ATI') return 'ELM327 v1.5';
    if (upperCommand === 'AT@1') return 'OBDII to RS232 Interpreter';
    if (upperCommand === 'ATWS') return 'ELM327 v1.5';

    // Common OBD commands
    if (upperCommand === '0100') return '4100 BE 1F A8 13'; // Supported PIDs
    if (upperCommand === '0101') return '4101 81 07 65 04'; // MIL Status
    if (upperCommand === '0102') return '4102 P0133'; // Freeze frame DTC
    if (upperCommand === '0103') return '4103 02 01 00'; // Fuel system status
    if (upperCommand === '0104') return '4104 3F'; // Engine load (25%)
    if (upperCommand === '0105') return '4105 5F'; // Coolant temp (55°C)
    if (upperCommand === '0106') return '4106 80'; // Short term fuel trim
    if (upperCommand === '010C') return '410C 1A 50'; // RPM (1700)
    if (upperCommand === '010D') return '410D 28'; // Speed (40 km/h)
    if (upperCommand === '010E') return '410E 8F'; // Timing advance
    if (upperCommand === '010F') return '410F 46'; // Intake air temp (30°C)
    if (upperCommand === '0110') return '4110 80 7B'; // MAF air flow
    if (upperCommand === '0111') return '4111 32'; // Throttle position (20%)

    // DTC commands
    if (upperCommand === '03') return '43 01 33 00 00 00'; // Stored DTCs
    if (upperCommand === '04') return '44'; // Clear DTCs
    if (upperCommand === '07') return '47 00'; // Pending DTCs

    // Mode 22 examples
    if (upperCommand === '2200') return '6200 OK';
    if (upperCommand.startsWith('22')) {
      const pid = upperCommand.substring(2);
      return `62${pid} 12 34 56 78`; // Generic Mode 22 response
    }

    return 'NO DATA';
  }

  /**
   * Get detailed information about discovered PIDs
   */
  public getPIDDiscoveryInfo(): {
    totalDiscovered: number;
    supportedPIDs: string[];
    mode22Supported: boolean;
    activeOdometerPID: string | null;
    discoveryMethod: 'full' | 'fallback' | 'simulation';
  } {
    let discoveryMethod: 'full' | 'fallback' | 'simulation' = 'full';

    if (this.connectionInfo.type === 'simulation') {
      discoveryMethod = 'simulation';
    } else if (this.supportedPIDs.size <= 9) { // Assuming fallback adds ~9 common PIDs
      discoveryMethod = 'fallback';
    }

    return {
      totalDiscovered: this.supportedPIDs.size,
      supportedPIDs: Array.from(this.supportedPIDs).sort(),
      mode22Supported: this.mode22Supported,
      activeOdometerPID: this.activeOdometerPID,
      discoveryMethod
    };
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
      
      // Generate mock system readiness data for simulation
      const systemReadiness = simulationService.getSystemReadinessStatus();
      
      // Notify subscribers of MIL status
      this.notifySubscribers('milStatus', { active: milActive });
      
      // Notify subscribers of system readiness status
      this.notifySubscribers('systemReadiness', systemReadiness);
      
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
      
      // Notify subscribers of system readiness status if available
      if (milData.additionalInfo && milData.additionalInfo.systemReadiness) {
        this.notifySubscribers('systemReadiness', milData.additionalInfo.systemReadiness);
      }
      
      return milData;
    } catch (error) {
      console.error('Error querying MIL status:', error);
      throw error;
    }
  }

  private parseMILStatusResponse(response: string): { milActive: boolean; dtcCount: number; additionalInfo?: any } {
    try {
      // Clean the response
      const cleanResponse = response.replace(/[\s>]/g, '').toUpperCase();
      console.log('\ud83d\udccb Parsing MIL status response:', cleanResponse);
      
      // Handle response format - some adapters include 4101 prefix, others don't
      let statusData = cleanResponse;
      if (cleanResponse.startsWith('4101')) {
        // Remove the Mode 01 PID 01 response header
        statusData = cleanResponse.substring(4);
        console.log('\ud83d\udd04 Removed response header, data:', statusData);
      }
      
      if (statusData.length < 2) {
        console.warn('\u26a0\ufe0f Incomplete MIL status data, need at least 1 byte, got:', statusData.length / 2);
        return { milActive: false, dtcCount: 0 };
      }

      // According to ELM327 datasheet:
      // Response format: 41 01 [4 data bytes]
      // First data byte contains MIL status and DTC count
      const firstByte = parseInt(statusData.substring(0, 2), 16);
      console.log('\ud83d\udd22 First byte value:', firstByte, '(hex:', firstByte.toString(16).toUpperCase(), ')');
      
      // Extract MIL status and DTC count according to datasheet
      // If MIL is on, subtract 0x80 (128) to get actual DTC count
      let milActive = false;
      let dtcCount = 0;
      
      if (firstByte >= 0x80) {
        // MIL is ON, subtract 0x80 to get DTC count
        milActive = true;
        dtcCount = firstByte - 0x80;
        console.log('\ud83d\udea8 MIL is ON, subtracting 0x80 from', firstByte, 'gives DTC count:', dtcCount);
      } else {
        // MIL is OFF, first byte directly gives DTC count
        milActive = false;
        dtcCount = firstByte;
        console.log('\u2705 MIL is OFF, DTC count:', dtcCount);
      }
      
      // Parse additional status information from remaining bytes if available
      const additionalInfo = statusData.length > 2 ? this.parseAdditionalMILInfo(statusData.substring(2)) : null;
      
      console.log(`\ud83d\udcca Final Result - MIL: ${milActive ? 'ON' : 'OFF'}, DTC Count: ${dtcCount}`);
      
      return { milActive, dtcCount, additionalInfo };
    } catch (error) {
      console.error('\u274c Error parsing MIL status response:', error);
      return { milActive: false, dtcCount: 0 };
    }
  }
  
  /**
   * Parse additional MIL status information from bytes 2-4
   * Includes system readiness monitor status according to OBD-II standard
   */
  private parseAdditionalMILInfo(data: string): any {
    try {
      if (data.length < 2) return null;
      
      const result: any = {};
      
      // Parse available bytes
      let byte2 = 0, byte3 = 0, byte4 = 0;
      
      if (data.length >= 2) {
        byte2 = parseInt(data.substring(0, 2), 16);
        result.byte2 = byte2;
      }
      if (data.length >= 4) {
        byte3 = parseInt(data.substring(2, 4), 16);
        result.byte3 = byte3;
      }
      if (data.length >= 6) {
        byte4 = parseInt(data.substring(4, 6), 16);
        result.byte4 = byte4;
      }
      
      // Query proper system readiness using Mode 05/06 (background, non-blocking)
      setTimeout(async () => {
        try {
          await this.querySystemReadiness();
        } catch (error) {
          console.warn('Background system readiness query failed:', error);
        }
      }, 1000);
      
      return result;
    } catch (error) {
      console.warn('Error parsing additional MIL info:', error);
      return null;
    }
  }

  /**
   * Query system readiness using proper Mode 05 (O2 sensors) and Mode 06 (non-continuous monitors)
   * According to OBD-II standard (SAE J1979)
   */
  public async querySystemReadiness(): Promise<any> {
    console.log('🔍 [READINESS] Querying system readiness using Mode 05/06...');
    
    if (this.connectionInfo.type === 'simulation') {
      // Return simulated readiness data
      const simulatedReadiness = simulationService.getSystemReadinessStatus();
      this.notifySubscribers('systemReadiness', simulatedReadiness);
      return simulatedReadiness;
    }
    
    const readiness: any = {};
    
    try {
      // Query Mode 05 - Oxygen Sensor Test Results (for O2 sensors)
      const oxygenReadiness = await this.queryMode05OxygenSensors();
      
      // Query Mode 06 - Non-Continuously Monitored Systems  
      const systemMonitors = await this.queryMode06SystemMonitors();
      
      // Combine results
      Object.assign(readiness, oxygenReadiness, systemMonitors);
      
      console.log('🔍 [READINESS] Combined system readiness status:', readiness);
      
      // Notify subscribers
      this.notifySubscribers('systemReadiness', readiness);
      
      return readiness;
      
    } catch (error) {
      console.error('🔍 [READINESS] Error querying system readiness:', error);
      
      // Return default not-ready status on error
      const defaultReadiness = this.getDefaultReadinessStatus();
      this.notifySubscribers('systemReadiness', defaultReadiness);
      return defaultReadiness;
    }
  }

  /**
   * Query Mode 05 - Oxygen Sensor Test Results
   */
  private async queryMode05OxygenSensors(): Promise<any> {
    console.log('🔍 [MODE-05] Querying oxygen sensor test results...');
    
    const oxygenReadiness: any = {};
    
    try {
      // Mode 05 PIDs corrected per CSV specifications
      const oxygenSensorPIDs = [
        { pid: '01', name: 'oxygenSensorMonitor', description: 'O2 Sensor Monitor Bank 1 - Sensor 1' },
        { pid: '41', name: 'oxygenSensorHeaterMonitor', description: 'O2 Sensor Heater Monitor Bank 1 - Sensor 1' }
      ];
      
      for (const sensorPID of oxygenSensorPIDs) {
        try {
          const response = await this.sendCommand(`05${sensorPID.pid}`, 3000);
          
          if (response && !response.includes('NO DATA') && !response.includes('ERROR')) {
            // Parse Mode 05 response - test results indicate sensor is supported and has data
            oxygenReadiness[sensorPID.name] = {
              supported: true,
              ready: true, // If we get test results, the sensor is ready
              testResults: response,
              description: sensorPID.description
            };
            console.log(`🔍 [MODE-05] ${sensorPID.description}: READY (${response})`);
          } else {
            // No data or error means sensor may not be supported or not ready
            oxygenReadiness[sensorPID.name] = {
              supported: false,
              ready: false,
              testResults: null,
              description: sensorPID.description
            };
            console.log(`🔍 [MODE-05] ${sensorPID.description}: NOT SUPPORTED`);
          }
        } catch (error) {
          console.warn(`🔍 [MODE-05] Error querying ${sensorPID.description}:`, error);
          oxygenReadiness[sensorPID.name] = {
            supported: false,  
            ready: false,
            testResults: null,
            description: sensorPID.description
          };
        }
      }
      
    } catch (error) {
      console.error('🔍 [MODE-05] Error in oxygen sensor query:', error);
    }
    
    return oxygenReadiness;
  }

  /**
   * Query Mode 06 - Non-Continuously Monitored System Test Results
   */
  private async queryMode06SystemMonitors(): Promise<any> {
    console.log('🔍 [MODE-06] Querying non-continuously monitored systems...');
    
    const systemReadiness: any = {};
    
    // Mode 06 monitor commands corrected per CSV specifications
    const systemMonitors = [
      { command: '0621', name: 'catalystMonitor', description: 'Catalyst Monitor Bank 1' },
      { command: '0661', name: 'heatedCatalystMonitor', description: 'Heated Catalyst Monitor Bank 1' },
      { command: '0639', name: 'evaporativeSystemMonitor', description: 'EVAP Monitor (Cap Off / 0.150")' },
      { command: '0671', name: 'secondaryAirSystemMonitor', description: 'Secondary Air Monitor 1' },
      { command: '0681', name: 'fuelSystemMonitor', description: 'Fuel System Monitor Bank 1' },
      { command: '06A1', name: 'misfireMonitor', description: 'Misfire Monitor General Data' },
      { command: '0631', name: 'egrSystemMonitor', description: 'EGR Monitor Bank 1' }
      // Removed comprehensiveComponentMonitor - not found in CSV specifications
    ];
    
    for (const monitor of systemMonitors) {
      try {
        const response = await this.sendCommand(monitor.command, 3000);
        
        if (response && !response.includes('NO DATA') && !response.includes('ERROR')) {
          // Parse Mode 06 response - successful response means monitor is supported and has test data
          const testData = this.parseMode06Response(response);
          
          systemReadiness[monitor.name] = {
            supported: true,
            ready: testData.passed, // Test passed = ready
            testResults: testData,
            description: monitor.description
          };
          
          console.log(`🔍 [MODE-06] ${monitor.description}: ${testData.passed ? 'READY' : 'NOT READY'}`);
        } else {
          // No data means monitor not supported or no test results available
          systemReadiness[monitor.name] = {
            supported: response && response.includes('NO DATA') ? false : true,
            ready: false,
            testResults: null,
            description: monitor.description
          };
          
          console.log(`🔍 [MODE-06] ${monitor.description}: NOT SUPPORTED`);
        }
        
      } catch (error) {
        console.warn(`🔍 [MODE-06] Error querying ${monitor.description}:`, error);
        systemReadiness[monitor.name] = {
          supported: false,
          ready: false, 
          testResults: null,
          description: monitor.description
        };
      }
    }
    
    return systemReadiness;
  }

  /**
   * Parse Mode 06 test result response
   */
  private parseMode06Response(response: string): any {
    // Mode 06 responses contain test ID, current value, min limit, max limit
    // Format varies but typically: [Test ID][Current Value][Min Limit][Max Limit]
    
    try {
      // Remove spaces and parse hex response
      const cleanResponse = response.replace(/\s+/g, '');
      
      // Basic parsing - actual implementation would need to handle specific test formats
      const testPassed = !cleanResponse.includes('FFFF') && cleanResponse.length > 4;
      
      return {
        passed: testPassed,
        rawData: response,
        testValue: cleanResponse.length > 8 ? parseInt(cleanResponse.substr(4, 4), 16) : null,
        limits: {
          min: cleanResponse.length > 12 ? parseInt(cleanResponse.substr(8, 4), 16) : null,
          max: cleanResponse.length > 16 ? parseInt(cleanResponse.substr(12, 4), 16) : null
        }
      };
    } catch (error) {
      console.warn('🔍 [MODE-06] Error parsing response:', error);
      return {
        passed: false,
        rawData: response,
        testValue: null,
        limits: { min: null, max: null }
      };
    }
  }

  /**
   * Get default readiness status when queries fail
   */
  private getDefaultReadinessStatus(): any {
    return {
      misfireMonitor: { supported: true, ready: false, description: 'Misfire Monitor General Data' },
      fuelSystemMonitor: { supported: true, ready: false, description: 'Fuel System Monitor Bank 1' },
      catalystMonitor: { supported: true, ready: false, description: 'Catalyst Monitor Bank 1' },
      heatedCatalystMonitor: { supported: true, ready: false, description: 'Heated Catalyst Monitor Bank 1' },
      evaporativeSystemMonitor: { supported: true, ready: false, description: 'EVAP Monitor (Cap Off / 0.150")' },
      secondaryAirSystemMonitor: { supported: false, ready: false, description: 'Secondary Air Monitor 1' },
      oxygenSensorMonitor: { supported: true, ready: false, description: 'O2 Sensor Monitor Bank 1 - Sensor 1' },
      oxygenSensorHeaterMonitor: { supported: true, ready: false, description: 'O2 Sensor Heater Monitor Bank 1 - Sensor 1' },
      egrSystemMonitor: { supported: true, ready: false, description: 'EGR Monitor Bank 1' }
      // Removed comprehensiveComponentMonitor and acRefrigerantMonitor - not in CSV specifications
    };
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
      console.log('📡 Sending DTC scan command: 03');
      const response = await this.sendCommand('03');
      console.log('📨 Raw DTC scan response:', response);

      if (!response || response.includes('NO DATA') || response.includes('ERROR')) {
        console.log('✅ No DTCs found (NO DATA or ERROR response)');
        const noDTCs: any[] = [];
        this.notifySubscribers('dtcScanComplete', noDTCs);
        return noDTCs;
      }

      // Parse DTC response according to ELM327 datasheet
      const dtcs = await this.parseDTCResponse(response);
      console.log('🔍 Parsed DTCs:', dtcs);
      
      this.notifySubscribers('dtcScanComplete', dtcs);
      return dtcs;
    } catch (error) {
      console.error('❌ Error scanning DTCs:', error);
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
      // Clean the response - remove spaces and > prompts
      const cleanResponse = response.replace(/[\s>]/g, '').toUpperCase();
      console.log('Clean DTC response:', cleanResponse);
      
      // According to ELM327 datasheet, Mode 03 response format:
      // - Response starts with '43' (mode echo) followed by DTC codes in pairs
      // - Each DTC is 2 bytes (4 hex chars), but can be represented as just 2 hex chars
      // - 0000 codes are padding and should be ignored
      
      if (cleanResponse.length < 2) {
        console.log('No DTC data in response');
        return dtcs;
      }
      
      // Handle case where response might include mode echo (like '43' prefix)
      let responseData = cleanResponse;
      if (cleanResponse.startsWith('43')) {
        // Remove the '43' prefix if present (ELM327 adapters include it)
        responseData = cleanResponse.substring(2);
        console.log('Removed Mode 03 echo prefix, data:', responseData);
      }
      
      if (responseData.length < 2) {
        console.log('No DTC data after removing echo prefix');
        return dtcs;
      }

      // Parse DTC codes in 4-character pairs (each DTC is 2 bytes = 4 hex characters)
      // According to datasheet: "the other 6 bytes in the response have to be read in pairs"
      const dtcPromises: Promise<any>[] = [];
      
      for (let i = 0; i < responseData.length; i += 4) {
        if (i + 3 < responseData.length) {
          const dtcHex = responseData.substring(i, i + 4);
          console.log(`Processing DTC hex: ${dtcHex}`);
          
          // Skip padding codes (0000)
          if (dtcHex === '0000') {
            console.log('Skipping padding code 0000');
            continue;
          }
          
          const dtcCode = this.convertHexToDTC(dtcHex);
          console.log(`Converted to DTC code: ${dtcCode}`);
          
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
      // According to ELM327 datasheet, DTC codes are 4 hex characters (2 bytes)
      if (hex.length !== 4) {
        console.warn(`Invalid DTC hex length: ${hex} (expected 4 characters)`);
        return '';
      }
      
      console.log(`Converting DTC hex ${hex} to DTC code`);
      
      // According to ELM327 datasheet table:
      // First hex digit determines the prefix using the conversion table
      const firstDigit = hex.charAt(0).toUpperCase();
      const remainingDigits = hex.substring(1);
      
      // Conversion table from ELM327 datasheet
      const prefixMap: { [key: string]: string } = {
        '0': 'P0',  // Powertrain Codes - SAE defined
        '1': 'P1',  // Powertrain Codes - manufacturer defined  
        '2': 'P2',  // Powertrain Codes - SAE defined
        '3': 'P3',  // Powertrain Codes - jointly defined
        '4': 'C0',  // Chassis Codes - SAE defined
        '5': 'C1',  // Chassis Codes - manufacturer defined
        '6': 'C2',  // Chassis Codes - manufacturer defined
        '7': 'C3',  // Chassis Codes - reserved for future
        '8': 'B0',  // Body Codes - SAE defined
        '9': 'B1',  // Body Codes - manufacturer defined
        'A': 'B2',  // Body Codes - manufacturer defined
        'B': 'B3',  // Body Codes - reserved for future
        'C': 'U0',  // Network Codes - SAE defined
        'D': 'U1',  // Network Codes - manufacturer defined
        'E': 'U2',  // Network Codes - manufacturer defined
        'F': 'U3'   // Network Codes - reserved for future
      };
      
      const prefix = prefixMap[firstDigit];
      if (!prefix) {
        console.warn(`Unknown first digit: ${firstDigit}`);
        return '';
      }
      
      const dtcCode = `${prefix}${remainingDigits}`;
      console.log(`DTC conversion: ${hex} -> ${dtcCode}`);
      
      return dtcCode;
    } catch (error) {
      console.error('Error converting hex to DTC:', error, hex);
      return '';
    }
  }

  /**
   * Test DTC and MIL status parsing with ELM327 datasheet examples
   */
  public testDTCParsing(): void {
    console.log('🧪 Testing DTC and MIL status parsing with ELM327 datasheet examples...');
    
    // Test MIL Status parsing (Mode 01 PID 01)
    console.log('\n🚨 Testing MIL Status Parsing:');
    
    // Test case from datasheet: 41 01 81 07 65 04
    // This means MIL ON with 1 DTC (81 - 80 = 1)
    const milTestResponse = '4101810765';
    console.log(`Testing MIL response: ${milTestResponse}`);
    const milResult = this.parseMILStatusResponse(milTestResponse);
    console.log(`Result: MIL ${milResult.milActive ? 'ON' : 'OFF'}, DTC Count: ${milResult.dtcCount}`);
    console.log(`Expected: MIL ON, DTC Count: 1 - ${milResult.milActive && milResult.dtcCount === 1 ? 'PASS' : 'FAIL'}`);
    
    // Test case: MIL OFF with no DTCs
    const milOffResponse = '41010000';
    console.log(`\nTesting MIL OFF: ${milOffResponse}`);
    const milOffResult = this.parseMILStatusResponse(milOffResponse);
    console.log(`Result: MIL ${milOffResult.milActive ? 'ON' : 'OFF'}, DTC Count: ${milOffResult.dtcCount}`);
    console.log(`Expected: MIL OFF, DTC Count: 0 - ${!milOffResult.milActive && milOffResult.dtcCount === 0 ? 'PASS' : 'FAIL'}`);
    
    // Test DTC code conversion
    console.log('\n🔢 Testing DTC Code Conversion:');
    
    // Test case from datasheet: P0133 (hex 0133)
    const testHex1 = '0133';
    const result1 = this.convertHexToDTC(testHex1);
    console.log(`Test 1: ${testHex1} -> ${result1} (expected: P0133) - ${result1 === 'P0133' ? 'PASS' : 'FAIL'}`);
    
    // Test case from datasheet: P0765 (hex 0765)
    const testHex2 = '0765';
    const result2 = this.convertHexToDTC(testHex2);
    console.log(`Test 2: ${testHex2} -> ${result2} (expected: P0765) - ${result2 === 'P0765' ? 'PASS' : 'FAIL'}`);
    
    // Test Mode 03 response parsing (actual DTC codes)
    console.log('\n🔍 Testing Mode 03 DTC Response Parsing:');
    
    // Test response format from datasheet: first byte is DTC count + MIL, then DTC codes
    // Response "81 07 65 04" means:
    // - 81: 1 DTC stored (81 - 80 = 1) + MIL on 
    // - 07 65: DTC code (0x0765)
    // - 04: Additional data or padding
    const testMode03Response = '81076504';
    console.log(`Testing Mode 03 response: ${testMode03Response}`);
    
    // Simulate parsing this response
    const firstByte = parseInt(testMode03Response.substring(0, 2), 16);
    let dtcCount = 0;
    let milActive = false;
    
    if (firstByte >= 0x80) {
      milActive = true;
      dtcCount = firstByte - 0x80;
    } else {
      milActive = false;
      dtcCount = firstByte;
    }
    
    console.log(`Parsed: MIL ${milActive ? 'ON' : 'OFF'}, DTC Count: ${dtcCount}`);
    
    if (dtcCount > 0) {
      const dtcHex = testMode03Response.substring(2, 6); // Get first DTC
      const dtcCode = this.convertHexToDTC(dtcHex);
      console.log(`DTC from response: ${dtcHex} -> ${dtcCode}`);
    }
    
    console.log('\n✅ All parsing tests complete!');
  }

  private async getDTCFromDatabase(code: string): Promise<any> {
    try {
      // Import UnifiedDTCService for real DTC lookup
      const { unifiedDTCService } = require('./UnifiedDTCService');
      const dtcInfo = unifiedDTCService.getDTCInfo(code);
      
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