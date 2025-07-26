// services/obdii/OBDIIService.ts

import { EventEmitter } from 'events';
import BluetoothService from '../bluetooth/BluetoothService';
import OdometerFraudDetectionService from '../fraud/OdometerFraudDetectionService';
import MockDataGenerator from '../simulation/MockDataGenerator';
import { simulationService } from '../simulation/SimulationService';
import WiFiManager from '../wifi/WiFiManager';
import { OBDIIParser, ParsedPIDData } from './OBDIIParser';
import { ManufacturerOdometerConfig, PIDDefinitions } from './PIDDefinitions';

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
  isMode22?: boolean; // NEW: Flag for Mode 22 commands
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

  // NEW: Vehicle-specific configuration
  private currentVehicleInfo: VehicleInfo = {};
  private activeOdometerPID: string | null = null;
  private mode22Supported = false;

  // Response handling
  private responseBuffer = '';
  private currentCommand: CommandQueueItem | null = null;
  private commandTimeout = 5000;
  private maxRetries = 3;

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

        // Initialize the adapter with proper error handling
        await this.initializeAdapter();
        await this.discoverSupportedPIDs();

        // NEW: Test Mode 22 support
        await this.testMode22Support();

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

  public enableSimulation(): void {
    if (this.connectionInfo.status === 'connected') return;
    this.updateConnectionInfo('connected', 'simulation');
    simulationService.startSimulation();
    simulationService.registerCallback(this.handleSimulationData);
    this.isInitialized = true;
    this.mode22Supported = true; // Simulation supports everything

    // --- Listen for fraud/fault/risk events from MockDataGenerator ---
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

  // --- Command Handling with Mode 22 Support ---

  public async sendCommand(command: string, timeout = this.commandTimeout): Promise<string> {
    return new Promise((resolve, reject) => {
      const isMode22 = command.startsWith('22');

      const queueItem: CommandQueueItem = {
        command,
        resolve,
        reject,
        timestamp: Date.now(),
        isMode22
      };

      this.commandQueue.push(queueItem);
      this.processCommandQueue();

      // Set timeout
      setTimeout(() => {
        const index = this.commandQueue.indexOf(queueItem);
        if (index > -1) {
          this.commandQueue.splice(index, 1);
          reject(new Error(`Command timeout: ${command}`));
        }
      }, timeout);
    });
  }

  private async processCommandQueue(): Promise<void> {
    if (this.isProcessingQueue || this.commandQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift();
      if (!command) break;

      this.currentCommand = command;

      try {
        const formattedCommand = this.formatCommand(command.command);
        console.log(`Sending command: ${formattedCommand}${command.isMode22 ? ' (Mode 22)' : ''}`);

        if (this.connectionInfo.type === 'simulation') {
          // Handle simulation
          const mockResponse = await this.handleSimulationCommand(command.command);
          command.resolve(mockResponse);
        } else if (this.commService) {
          // Send to real device
          await this.commService.sendData(formattedCommand);

          // Wait for response (handled by handleDataReceived)
          // The response will be processed and resolve/reject will be called
        } else {
          command.reject(new Error('No communication service available'));
        }

        // Add delay between commands to avoid overwhelming the ECU
        await this.delay(command.isMode22 ? 200 : 100); // Longer delay for Mode 22

      } catch (error) {
        console.error('Error processing command:', error);
        command.reject(error);
      }

      this.currentCommand = null;
    }

    this.isProcessingQueue = false;
  }

  private formatCommand(command: string): string {
    // Ensure command ends with carriage return
    const formatted = command.endsWith('\r') ? command : command + '\r';
    return formatted;
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

  // --- Data Reception and Parsing ---

  private handleDataReceived = (data: string) => {
    this.responseBuffer += data;

    // Process complete responses (ending with '>')
    const responses = this.responseBuffer.split('>');

    for (let i = 0; i < responses.length - 1; i++) {
      const response = responses[i].trim();
      if (response) {
        this.processResponse(response);
      }
    }

    // Keep the last partial response
    this.responseBuffer = responses[responses.length - 1];
  };

  private processResponse(response: string): void {
    console.log('Processing response:', response);

    if (this.currentCommand) {
      // Check if this is a Mode 22 response
      if (this.currentCommand.isMode22) {
        this.processMode22Response(response);
      } else {
        this.processStandardResponse(response);
      }
    }
  }

  /**
   * Process Mode 22 response
   */
  private processMode22Response(response: string): void {
    if (!this.currentCommand) return;

    try {
      // Mode 22 responses start with '62' followed by the PID
      if (response.startsWith('62')) {
        this.currentCommand.resolve(response);

        // Parse and emit the data if it's an odometer reading
        this.parseMode22OdometerData(response);
      } else if (response.includes('NO DATA') || response.includes('ERROR')) {
        this.currentCommand.reject(new Error(`Mode 22 command failed: ${response}`));
      } else {
        this.currentCommand.resolve(response);
      }
    } catch (error) {
      console.error('Error processing Mode 22 response:', error);
      this.currentCommand.reject(error);
    }
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

  /**
   * Process standard OBD-II response
   */
  private processStandardResponse(response: string): void {
    if (!this.currentCommand) return;

    try {
      if (response.includes('NO DATA') || response.includes('ERROR')) {
        this.currentCommand.reject(new Error(`Command failed: ${response}`));
      } else {
        this.currentCommand.resolve(response);
      }
    } catch (error) {
      console.error('Error processing standard response:', error);
      this.currentCommand.reject(error);
    }
  }

  // --- Initialization Methods ---

  private async initializeAdapter(): Promise<void> {
    const initCommands = [
      'ATZ',      // Reset adapter
      'ATE0',     // Echo off
      'ATL0',     // Line feeds off
      'ATS0',     // Spaces off
      'ATH1',     // Headers on
      'ATSP0',    // Set protocol to auto
    ];

    for (const command of initCommands) {
      try {
        await this.sendCommand(command);
        await this.delay(100);
      } catch (error) {
        console.warn(`Initialization command failed: ${command}`, error);
      }
    }
  }

  /**
 * Full implementation of PID discovery with proper bitmask parsing
 */
  private async discoverSupportedPIDs(): Promise<void> {
    console.log('🔍 Starting comprehensive PID discovery...');

    try {
      // Clear existing supported PIDs
      this.supportedPIDs.clear();

      // Discover PIDs in ranges: 01-20, 21-40, 41-60, 61-80, etc.
      const pidRanges = [
        { command: '0100', range: '01-20', startPID: 1 },
        { command: '0120', range: '21-40', startPID: 33 },
        { command: '0140', range: '41-60', startPID: 65 },
        { command: '0160', range: '61-80', startPID: 97 },
        { command: '0180', range: '81-A0', startPID: 129 },
        { command: '01A0', range: 'A1-C0', startPID: 161 }
      ];

      for (const pidRange of pidRanges) {
        try {
          console.log(`🔎 Checking PID range ${pidRange.range}...`);

          const response = await this.sendCommand(pidRange.command, 3000);

          if (!response || response.includes('NO DATA') || response.includes('ERROR')) {
            console.log(`❌ No data for PID range ${pidRange.range}`);
            continue;
          }

          // Parse the response (format: 41 [PID] [4 bytes of bitmask])
          const cleanResponse = response.replace(/\s+/g, '').toUpperCase();

          if (cleanResponse.length < 14) { // 41 + 2 PID chars + 8 hex chars (4 bytes)
            console.warn(`⚠️ Invalid response length for ${pidRange.range}: ${cleanResponse}`);
            continue;
          }

          // Extract the 4-byte bitmask (skip "41" + PID code)
          const bitmaskHex = cleanResponse.substring(6, 14); // 8 hex characters = 4 bytes

          if (bitmaskHex.length !== 8) {
            console.warn(`⚠️ Invalid bitmask length for ${pidRange.range}: ${bitmaskHex}`);
            continue;
          }

          console.log(`📊 PID range ${pidRange.range} bitmask: ${bitmaskHex}`);

          // Parse the bitmask and identify supported PIDs
          const supportedPIDsInRange = this.parsePIDBitmask(bitmaskHex, pidRange.startPID);

          // Add supported PIDs to our set
          supportedPIDsInRange.forEach(pidInfo => {
            this.supportedPIDs.add(pidInfo.name);
            console.log(`✅ Supported PID found: ${pidInfo.name} (${pidInfo.hex})`);
          });

          console.log(`📈 Found ${supportedPIDsInRange.length} supported PIDs in range ${pidRange.range}`);

          // Add a small delay between range checks
          await this.delay(200);

        } catch (error) {
          console.warn(`⚠️ Error checking PID range ${pidRange.range}:`, error);
          // Continue with next range even if this one fails
        }
      }

      // Log discovery results
      const totalSupportedPIDs = this.supportedPIDs.size;
      console.log(`🎯 PID discovery complete: ${totalSupportedPIDs} PIDs supported`);
      console.log('📋 Supported PIDs:', Array.from(this.supportedPIDs).sort());

      // Add common PIDs if none were discovered (fallback)
      if (totalSupportedPIDs === 0) {
        console.log('🔧 No PIDs discovered, adding common fallback PIDs...');
        this.addFallbackPIDs();
      }

    } catch (error) {
      console.error('❌ PID discovery failed:', error);
      // Add fallback PIDs in case of complete failure
      this.addFallbackPIDs();
    }
  }

  /**
   * Parse a 4-byte PID support bitmask and return supported PID information
   */
  private parsePIDBitmask(bitmaskHex: string, startPIDNumber: number): Array<{ name: string, hex: string, pidNumber: number }> {
    const supportedPIDs: Array<{ name: string, hex: string, pidNumber: number }> = [];

    try {
      // Convert hex string to 32-bit number
      const bitmask = parseInt(bitmaskHex, 16);

      // Check each bit (32 bits total, representing PIDs 1-32 in the range)
      for (let bitPosition = 0; bitPosition < 32; bitPosition++) {
        // Check if the bit is set (1 means supported)
        const isSupported = (bitmask & (1 << (31 - bitPosition))) !== 0;

        if (isSupported) {
          const pidNumber = startPIDNumber + bitPosition;
          const pidHex = pidNumber.toString(16).toUpperCase().padStart(2, '0');

          // Find the PID name from our definitions
          const pidName = this.getPIDNameFromHex(pidHex);

          if (pidName) {
            supportedPIDs.push({
              name: pidName,
              hex: pidHex,
              pidNumber: pidNumber
            });
          } else {
            // Unknown PID, but it's supported
            supportedPIDs.push({
              name: `UNKNOWN_PID_${pidHex}`,
              hex: pidHex,
              pidNumber: pidNumber
            });
          }
        }
      }

    } catch (error) {
      console.error('Error parsing PID bitmask:', error, bitmaskHex);
    }

    return supportedPIDs;
  }

  /**
   * Get PID name from hex code by looking up in our PID definitions
   */
  private getPIDNameFromHex(pidHex: string): string | null {
    const allPIDs = PIDDefinitions.getAllPIDs();

    // Look for Mode 01 PIDs with matching hex code
    const matchingPID = allPIDs.find(pid =>
      pid.mode === '01' &&
      pid.pid.toUpperCase() === pidHex.toUpperCase()
    );

    return matchingPID ? matchingPID.name : null;
  }

  /**
   * Add common fallback PIDs when discovery fails
   */
  private addFallbackPIDs(): void {
    const commonPIDs = [
      'ENGINE_RPM',
      'VEHICLE_SPEED',
      'ENGINE_COOLANT_TEMP',
      'ENGINE_LOAD',
      'THROTTLE_POSITION',
      'FUEL_LEVEL',
      'DISTANCE_SINCE_CODES_CLEARED',
      'DISTANCE_WITH_MIL_ON',
      'RUNTIME_SINCE_ENGINE_START'
    ];

    commonPIDs.forEach(pidName => {
      this.supportedPIDs.add(pidName);
    });

    console.log(`🔧 Added ${commonPIDs.length} fallback PIDs`);
  }

  /**
   * Check if a specific PID is supported (enhanced version)
   */
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

  // --- PID Querying and Polling ---

  public async queryPID(pidName: string): Promise<ParsedPIDData | null> {
    const pidDefinition = PIDDefinitions.getPID(pidName);
    if (!pidDefinition) {
      console.error(`PID definition not found: ${pidName}`);
      return null;
    }

    try {
      let command: string;

      if (pidDefinition.mode === '22') {
        // Mode 22 command
        if (!this.mode22Supported) {
          console.warn(`Mode 22 not supported, skipping ${pidName}`);
          return null;
        }
        command = `22${pidDefinition.pid}`;
      } else {
        // Standard OBD-II command
        command = `${pidDefinition.mode}${pidDefinition.pid}`;
      }

      const rawResponse = await this.sendCommand(command);

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

  // --- Live Data Streaming ---

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

  // --- Simulation Handling ---

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

  // --- Utility Methods ---

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateConnectionInfo(status: ConnectionStatus, type: ConnectionType | null, device?: any, error?: string): void {
    this.connectionInfo = { status, type, device, error };
    this.notifySubscribers('connectionStatus', this.connectionInfo);
  }

  private handleDisconnection = () => {
    console.log('Connection lost, attempting to disconnect cleanly');
    this.disconnect();
  };

  // --- Subscription Management ---

  public subscribe(callback: SubscriberCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  public notifySubscribers(event: string, data: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  // --- Public Getters ---

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
}

export default new OBDIIService();