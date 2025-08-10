// services/obdii/PIDDefinitions.ts

/**
 * Defines the structure for an OBD-II Parameter ID (PID).
 */
export interface PIDDefinition {
  name: string;
  pid: string;
  mode: string;
  bytes: number;
  description: string;
  unit?: string;
  min?: number;
  max?: number;
  parse: (bytes: number[]) => number | string;
  intervalId?: NodeJS.Timeout; // Used internally for polling
  manufacturer?: string; // NEW: For manufacturer-specific PIDs
  vehicleTypes?: string[]; // NEW: Specific vehicle models/years this applies to
}

/**
 * Interface for manufacturer-specific odometer configurations
 */
export interface ManufacturerOdometerConfig {
  manufacturer: string;
  pidName: string;
  pid: string;
  mode: string;
  bytes: number;
  parseFunction: (bytes: number[]) => number;
  supportedModels?: string[]; // Optional: specific models this works for
  supportedYears?: { min: number; max?: number }; // Optional: year range
}

/**
 * A static class that holds definitions for various OBD-II PIDs.
 */
export class PIDDefinitions {
  private static pids: Map<string, PIDDefinition> = new Map([
    // --- Mode 01: Standard Powertrain Diagnostic Data ---
    ['SUPPORTED_PIDS_01_20', {
      name: 'SUPPORTED_PIDS_01_20',
      pid: '00',
      mode: '01',
      bytes: 4,
      description: 'Supported PIDs [01-20]',
      parse: (bytes) => {
        return bytes.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join('');
      },
    }],

    ['ENGINE_RPM', {
      name: 'ENGINE_RPM',
      pid: '0C',
      mode: '01',
      bytes: 2,
      description: 'Engine RPM',
      unit: 'rpm',
      min: 0,
      max: 16383.75,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        return Math.round(((bytes[0] * 256) + bytes[1]) / 4);
      },
    }],

    ['VEHICLE_SPEED', {
      name: 'VEHICLE_SPEED',
      pid: '0D',
      mode: '01',
      bytes: 1,
      description: 'Vehicle Speed',
      unit: 'km/h',
      min: 0,
      max: 255,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return bytes[0];
      },
    }],

    ['ENGINE_COOLANT_TEMP', {
      name: 'ENGINE_COOLANT_TEMP',
      pid: '05',
      mode: '01',
      bytes: 1,
      description: 'Engine Coolant Temperature',
      unit: '°C',
      min: -40,
      max: 215,
      parse: (bytes) => {
        if (bytes.length < 1) return -40;
        return bytes[0] - 40;
      },
    }],

    ['ENGINE_LOAD', {
      name: 'ENGINE_LOAD',
      pid: '04',
      mode: '01',
      bytes: 1,
      description: 'Calculated Engine Load',
      unit: '%',
      min: 0,
      max: 100,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round((bytes[0] * 100) / 255 * 10) / 10;
      },
    }],

    ['THROTTLE_POSITION', {
      name: 'THROTTLE_POSITION',
      pid: '11',
      mode: '01',
      bytes: 1,
      description: 'Throttle Position',
      unit: '%',
      min: 0,
      max: 100,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round((bytes[0] * 100) / 255 * 10) / 10;
      },
    }],

    ['FUEL_LEVEL', {
      name: 'FUEL_LEVEL',
      pid: '2F',
      mode: '01',
      bytes: 1,
      description: 'Fuel Tank Level Input',
      unit: '%',
      min: 0,
      max: 100,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round((bytes[0] * 100) / 255 * 10) / 10;
      },
    }],

    ['DISTANCE_SINCE_CODES_CLEARED', {
      name: 'DISTANCE_SINCE_CODES_CLEARED',
      pid: '31',
      mode: '01',
      bytes: 2,
      description: 'Distance traveled since codes cleared',
      unit: 'km',
      min: 0,
      max: 65535,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        return (bytes[0] * 256) + bytes[1];
      },
    }],

    ['DISTANCE_WITH_MIL_ON', {
      name: 'DISTANCE_WITH_MIL_ON',
      pid: '21',
      mode: '01',
      bytes: 2,
      description: 'Distance traveled with MIL on',
      unit: 'km',
      min: 0,
      max: 65535,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        return (bytes[0] * 256) + bytes[1];
      },
    }],

    ['RUNTIME_SINCE_ENGINE_START', {
      name: 'RUNTIME_SINCE_ENGINE_START',
      pid: '1F',
      mode: '01',
      bytes: 2,
      description: 'Runtime since engine start',
      unit: 'seconds',
      min: 0,
      max: 65535,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        return (bytes[0] * 256) + bytes[1];
      },
    }],

    ['INTAKE_AIR_TEMP', {
      name: 'INTAKE_AIR_TEMP',
      pid: '0F',
      mode: '01',
      bytes: 1,
      description: 'Intake Air Temperature',
      unit: '°C',
      min: -40,
      max: 215,
      parse: (bytes) => {
        if (bytes.length < 1) return -40;
        return bytes[0] - 40;
      },
    }],

    ['MAF_RATE', {
      name: 'MAF_RATE',
      pid: '10',
      mode: '01',
      bytes: 2,
      description: 'Mass Air Flow Rate',
      unit: 'g/s',
      min: 0,
      max: 655.35,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        return Math.round(((bytes[0] * 256) + bytes[1]) / 100 * 10) / 10;
      },
    }],

    ['CONTROL_MODULE_VOLTAGE', {
      name: 'CONTROL_MODULE_VOLTAGE',
      pid: '42',
      mode: '01',  
      bytes: 2,
      description: 'Control Module Voltage',
      unit: 'V',
      min: 0,
      max: 65.535,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        return Math.round(((bytes[0] * 256) + bytes[1]) / 1000 * 100) / 100;
      },
    }],

    // --- Mode 22: Manufacturer-Specific Diagnostic Data ---
    
    /**
     * Toyota Odometer Reading
     * Command: 2225AE
     * Response format: 62 25 AE [4 data bytes]
     */
    ['ODOMETER_TOYOTA', {
      name: 'ODOMETER_TOYOTA',
      pid: '25AE',
      mode: '22',
      bytes: 4,
      description: 'Odometer Reading (Toyota)',
      unit: 'km',
      min: 0,
      max: 4294967295, // 2^32 - 1
      manufacturer: 'Toyota',
      vehicleTypes: ['Toyota', 'Lexus', 'Scion'],
      parse: (bytes) => {
        if (bytes.length < 4) return 0;
        // Formula: (A * 2^24) + (B * 2^16) + (C * 2^8) + D
        return (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3];
      },
    }],

    /**
     * Standard OBD-II Odometer (newer vehicles)
     * Some newer vehicles support the standard odometer PID
     */
    ['ODOMETER_STANDARD', {
      name: 'ODOMETER_STANDARD',
      pid: 'A6',
      mode: '01',
      bytes: 4,
      description: 'Odometer Reading (Standard)',
      unit: 'km',
      min: 0,
      max: 4294967295,
      parse: (bytes) => {
        if (bytes.length < 4) return 0;
        return (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3];
      },
    }],

    // Generic odometer aliases for compatibility
    ['ODOMETER', {
      name: 'ODOMETER',
      pid: 'A6',
      mode: '01',
      bytes: 4,
      description: 'Odometer Reading (Generic)',
      unit: 'km',
      min: 0,
      max: 4294967295,
      parse: (bytes) => {
        if (bytes.length < 4) return 0;
        return (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3];
      },
    }],

    ['VEHICLE_ODOMETER', {
      name: 'VEHICLE_ODOMETER',
      pid: 'A6',
      mode: '01',
      bytes: 4,
      description: 'Vehicle Odometer Reading',
      unit: 'km',
      min: 0,
      max: 4294967295,
      parse: (bytes) => {
        if (bytes.length < 4) return 0;
        return (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3];
      },
    }],

    ['TOTAL_DISTANCE', {
      name: 'TOTAL_DISTANCE',
      pid: 'A6',
      mode: '01',
      bytes: 4,
      description: 'Total Distance Traveled',
      unit: 'km',
      min: 0,
      max: 4294967295,
      parse: (bytes) => {
        if (bytes.length < 4) return 0;
        return (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3];
      },
    }],

    ['TOTAL_DISTANCE_TRAVELED', {
      name: 'TOTAL_DISTANCE_TRAVELED',
      pid: 'A6',
      mode: '01',
      bytes: 4,
      description: 'Total Distance Traveled (Alternative)',
      unit: 'km',
      min: 0,
      max: 4294967295,
      parse: (bytes) => {
        if (bytes.length < 4) return 0;
        return (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3];
      },
    }],
  ]);

  /**
   * Manufacturer-specific odometer configurations
   * This allows dynamic addition of new manufacturer PIDs
   */
  private static manufacturerOdometerConfigs: ManufacturerOdometerConfig[] = [
    {
      manufacturer: 'Toyota',
      pidName: 'ODOMETER_TOYOTA',
      pid: '25AE',
      mode: '22',
      bytes: 4,
      parseFunction: (bytes: number[]) => {
        if (bytes.length < 4) return 0;
        return (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3];
      },
      supportedModels: ['Camry', 'Corolla', 'Prius', 'RAV4', 'Highlander', 'Tacoma', 'Tundra'],
      supportedYears: { min: 2005 } // Most Toyota vehicles from 2005+
    },
    {
      manufacturer: 'Honda',
      pidName: 'ODOMETER_HONDA',
      pid: '00C0', // Example Honda PID (would need verification)
      mode: '22',
      bytes: 3,
      parseFunction: (bytes: number[]) => {
        if (bytes.length < 3) return 0;
        return (bytes[0] * 65536) + (bytes[1] * 256) + bytes[2];
      },
      supportedYears: { min: 2006 }
    },
    {
      manufacturer: 'Ford',
      pidName: 'ODOMETER_FORD',
      pid: 'DD01', // Example Ford PID (would need verification)
      mode: '22',
      bytes: 4,
      parseFunction: (bytes: number[]) => {
        if (bytes.length < 4) return 0;
        return (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3];
      },
      supportedYears: { min: 2008 }
    }
    // Add more manufacturers as needed
  ];

  /**
   * Retrieves a PID definition by its common name.
   */
  public static getPID(name: string): PIDDefinition | undefined {
    return this.pids.get(name);
  }

  /**
   * Retrieves all defined PIDs.
   */
  public static getAllPIDs(): PIDDefinition[] {
    return Array.from(this.pids.values());
  }

  /**
   * Get manufacturer-specific odometer configurations
   */
  public static getManufacturerOdometerConfigs(): ManufacturerOdometerConfig[] {
    return [...this.manufacturerOdometerConfigs];
  }

  /**
   * Get odometer PID for a specific manufacturer
   */
  public static getOdometerPIDForManufacturer(manufacturer: string): PIDDefinition | undefined {
    const config = this.manufacturerOdometerConfigs.find(
      config => config.manufacturer.toLowerCase() === manufacturer.toLowerCase()
    );
    
    if (config) {
      return this.pids.get(config.pidName);
    }
    
    return undefined;
  }

  /**
   * Dynamically add a new manufacturer odometer configuration
   */
  public static addManufacturerOdometerConfig(config: ManufacturerOdometerConfig): void {
    // Remove existing config for same manufacturer if it exists
    this.manufacturerOdometerConfigs = this.manufacturerOdometerConfigs.filter(
      existingConfig => existingConfig.manufacturer.toLowerCase() !== config.manufacturer.toLowerCase()
    );
    
    // Add the new config
    this.manufacturerOdometerConfigs.push(config);
    
    // Create and add the PID definition
    const pidDefinition: PIDDefinition = {
      name: config.pidName,
      pid: config.pid,
      mode: config.mode,
      bytes: config.bytes,
      description: `Odometer Reading (${config.manufacturer})`,
      unit: 'km',
      min: 0,
      max: 4294967295,
      manufacturer: config.manufacturer,
      parse: config.parseFunction,
    };
    
    this.pids.set(config.pidName, pidDefinition);
  }

  /**
   * Get all available odometer PIDs (standard + manufacturer-specific)
   */
  public static getAllOdometerPIDs(): PIDDefinition[] {
    return Array.from(this.pids.values()).filter(pid => 
      pid.name.toLowerCase().includes('odometer')
    );
  }

  /**
   * Get PIDs for real-time dashboard display
   */
  public static getDashboardPIDs(): PIDDefinition[] {
    const dashboardPIDNames = [
      'ENGINE_RPM',
      'VEHICLE_SPEED',
      'ENGINE_COOLANT_TEMP',
      'ENGINE_LOAD',
      'THROTTLE_POSITION',
      'FUEL_LEVEL',
      'INTAKE_AIR_TEMP',
      'MAF_RATE',
      'CONTROL_MODULE_VOLTAGE',
      'ODOMETER_STANDARD', // For vehicles that support standard odometer PID
      'ODOMETER', // Generic odometer alias
      'VEHICLE_ODOMETER', // Vehicle odometer alias
      'TOTAL_DISTANCE', // Total distance traveled
      'TOTAL_DISTANCE_TRAVELED', // Alternative total distance
      'DISTANCE_SINCE_CODES_CLEARED', // Alternative distance reading
      'DISTANCE_WITH_MIL_ON' // Alternative distance reading
    ];
    
    return dashboardPIDNames
      .map(name => this.getPID(name))
      .filter((pid): pid is PIDDefinition => pid !== undefined);
  }

  /**
   * Get PIDs that should be polled for fraud detection
   */
  public static getFraudDetectionPIDs(): PIDDefinition[] {
    const fraudPIDNames = [
      'DISTANCE_SINCE_CODES_CLEARED',
      'DISTANCE_WITH_MIL_ON',
      'RUNTIME_SINCE_ENGINE_START'
    ];
    
    return fraudPIDNames
      .map(name => this.getPID(name))
      .filter((pid): pid is PIDDefinition => pid !== undefined);
  }

  /**
   * Check if a PID uses Mode 22 (manufacturer-specific)
   */
  public static isMode22PID(pidName: string): boolean {
    const pid = this.getPID(pidName);
    return pid?.mode === '22';
  }

  /**
   * Format command for Mode 22 PIDs
   */
  public static formatMode22Command(pid: string): string {
    return `22${pid}`;
  }

  /**
   * Validate if a manufacturer odometer config is compatible with vehicle info
   */
  public static isOdometerConfigCompatible(
    config: ManufacturerOdometerConfig,
    vehicleMake: string,
    vehicleModel?: string,
    vehicleYear?: number
  ): boolean {
    // Check manufacturer match
    if (config.manufacturer.toLowerCase() !== vehicleMake.toLowerCase()) {
      return false;
    }

    // Check model compatibility if specified
    if (config.supportedModels && vehicleModel) {
      const modelMatch = config.supportedModels.some(
        model => model.toLowerCase() === vehicleModel.toLowerCase()
      );
      if (!modelMatch) {
        return false;
      }
    }

    // Check year compatibility if specified
    if (config.supportedYears && vehicleYear) {
      if (vehicleYear < config.supportedYears.min) {
        return false;
      }
      if (config.supportedYears.max && vehicleYear > config.supportedYears.max) {
        return false;
      }
    }

    return true;
  }
}