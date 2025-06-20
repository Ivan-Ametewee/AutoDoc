import { AlertService } from '../alerts/AlertService';
import { DatabaseService } from '../database/DatabaseService';
import { SimulationService } from '../simulation/SimulationService';
import { OBDIIParser } from './OBDIIParser';
import { PIDDefinitions } from './PIDDefinitions';

class OBDIIService {
  constructor() {
    this.isConnected = false;
    this.isSimulating = false;
    this.connectionType = null; // 'bluetooth' | 'wifi'
    this.device = null;
    this.dataBuffer = '';
    this.subscribers = [];
    this.activeCommands = new Set();
    this.commandQueue = [];
    this.isProcessingQueue = false;
    this.dataCallback = null;
    this.pollingInterval = null;
  }

  // Connection Management
  async connect(device, type = 'bluetooth') {
    try {
      this.device = device;
      this.connectionType = type;

      if (type === 'bluetooth') {
        // Bluetooth connection logic would go here
        // For now, we'll simulate
        this.isConnected = true;
      } else if (type === 'wifi') {
        // WiFi connection logic would go here
        this.isConnected = true;
      }

      if (this.isConnected) {
        await this.initializeConnection();
        this.notifySubscribers('connectionStatus', { connected: true, device, type });
      }

      return this.isConnected;
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      this.isConnected = false;
      this.device = null;
      this.connectionType = null;
      this.stopAllCommands();
      this.notifySubscribers('connectionStatus', { connected: false });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }

  // Simulation Mode
  enableSimulation() {
    this.isSimulating = true;
    this.isConnected = true;
    SimulationService.start();
    this.startDataCollection();
    this.notifySubscribers('connectionStatus', { connected: true, simulating: true });
  }

  disableSimulation() {
    this.isSimulating = false;
    SimulationService.stop();
    this.stopAllCommands();
  }

  // Data Collection
  async startDataCollection() {
    if (!this.isConnected && !this.isSimulating) {
      throw new Error('Not connected to device');
    }

    // Start collecting basic engine data
    this.startCommand('ENGINE_RPM');
    this.startCommand('VEHICLE_SPEED');
    this.startCommand('ENGINE_COOLANT_TEMP');
    this.startCommand('THROTTLE_POSITION');
    this.startCommand('ENGINE_LOAD');
    this.startCommand('FUEL_LEVEL');
    this.startCommand('INTAKE_AIR_TEMP');
    this.startCommand('MAF_RATE');
  }

  stopDataCollection() {
    this.stopAllCommands();
  }

  // Command Management
  startCommand(pidName, interval = 1000) {
    if (this.activeCommands.has(pidName)) return;

    const pid = PIDDefinitions.getPID(pidName);
    if (!pid) {
      console.error(`Unknown PID: ${pidName}`);
      return;
    }

    this.activeCommands.add(pidName);

    const intervalId = setInterval(async () => {
      try {
        const data = await this.queryPID(pid);
        if (data) {
          this.processReceivedData(pidName, data);
        }
      } catch (error) {
        console.error(`Error querying ${pidName}:`, error);
      }
    }, interval);

    // Store interval ID for cleanup
    pid.intervalId = intervalId;
  }

  stopCommand(pidName) {
    const pid = PIDDefinitions.getPID(pidName);
    if (pid && pid.intervalId) {
      clearInterval(pid.intervalId);
      delete pid.intervalId;
    }
    this.activeCommands.delete(pidName);
  }

  stopAllCommands() {
    this.activeCommands.forEach(pidName => {
      this.stopCommand(pidName);
    });
  }

  // Data Query and Processing
  async queryPID(pid) {
    if (this.isSimulating) {
      return SimulationService.generatePIDData(pid.name);
    }

    // Real device communication would go here
    // For now, return null as we don't have real hardware
    return null;
  }

  processReceivedData(pidName, rawData) {
    try {
      const pid = PIDDefinitions.getPID(pidName);
      const parsedData = OBDIIParser.parsePIDResponse(pid, rawData);

      const dataPoint = {
        pid: pidName,
        value: parsedData.value,
        unit: parsedData.unit,
        timestamp: new Date(),
        raw: rawData
      };

      // Store in database
      DatabaseService.addDataPoint(dataPoint);

      // Check for alerts
      AlertService.checkThreshold(pidName, parsedData.value);

      // Notify subscribers
      this.notifySubscribers('dataUpdate', dataPoint);

    } catch (error) {
      console.error('Error processing data:', error);
    }
  }

  // Diagnostic Trouble Codes
  async readDTCs() {
    if (this.isSimulating) {
      return SimulationService.generateDTCs();
    }

    // Real DTC reading would go here
    return [];
  }

  async clearDTCs() {
    if (this.isSimulating) {
      return SimulationService.clearDTCs();
    }

    // Real DTC clearing would go here
    return true;
  }

  // Vehicle Information
  async getVehicleInfo() {
    const commands = [
      'VIN',
      'CALIBRATION_ID',
      'ECU_NAME',
      'SUPPORTED_PIDS_01_20',
      'SUPPORTED_PIDS_21_40'
    ];

    const info = {};

    if (this.isSimulating) {
      return SimulationService.generateVehicleInfo();
    }

    // Real vehicle info queries would go here
    return info;
  }

  // Subscription Management
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    });
  }

  // Connection Initialization
  async initializeConnection() {
    try {
      // Send initialization commands
      await this.sendCommand('ATZ'); // Reset
      await this.sendCommand('ATE0'); // Echo off
      await this.sendCommand('ATL0'); // Line feeds off
      await this.sendCommand('ATS0'); // Spaces off
      await this.sendCommand('ATSP0'); // Auto protocol

      // Test connection
      const response = await this.sendCommand('0100'); // Test command
      if (!response) {
        throw new Error('No response from ECU');
      }

      return true;
    } catch (error) {
      console.error('Initialization failed:', error);
      throw error;
    }
  }

  async sendCommand(command) {
    if (this.isSimulating) {
      return SimulationService.simulateCommand(command);
    }

    // Real command sending would go here
    return null;
  }

  // Utility Methods
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      simulating: this.isSimulating,
      device: this.device,
      type: this.connectionType
    };
  }

  getActiveCommands() {
    return Array.from(this.activeCommands);
  }

  subscribeToLiveData(callback) {
    this.dataCallback = callback;
    this.startDataPolling();
    return () => {
      this.dataCallback = null;
      this.stopDataPolling();
    };
  }

  async refreshConnection() {
    try {
      await this.disconnect();
      await this.connect();
      return true;
    } catch (error) {
      console.error('Failed to refresh connection:', error);
      throw error;
    }
  }

  startDataPolling() {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(() => {
      if (this.dataCallback) {
        this.dataCallback({
          speed: this.getSpeed(),
          rpm: this.getRPM(),
          engineTemp: this.getEngineTemp(),
          fuelLevel: this.getFuelLevel(),
          throttlePosition: this.getThrottlePosition(),
          engineLoad: this.getEngineLoad(),
          maf: this.getMAF(),
          o2Voltage: this.getO2Voltage(),
          timing: this.getTiming()
        });
      }
    }, 100); // Poll every 100ms
  }

  stopDataPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

export default new OBDIIService();