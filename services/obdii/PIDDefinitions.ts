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
}

/**
 * A static class that holds definitions for various OBD-II PIDs.
 */
export class PIDDefinitions {
  private static pids: Map<string, PIDDefinition> = new Map([
    // --- Mode 01: Powertrain Diagnostic Data ---
    ['SUPPORTED_PIDS_01_20', {
      name: 'SUPPORTED_PIDS_01_20',
      pid: '00',
      mode: '01',
      bytes: 4,
      description: 'Supported PIDs [01-20]',
      parse: (bytes) => {
        // Convert bytes to hex string for display
        return bytes.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join('');
      },
    }],

    ['MONITOR_STATUS', {
      name: 'MONITOR_STATUS',
      pid: '01',
      mode: '01',
      bytes: 4,
      description: 'Monitor status since DTCs cleared',
      parse: (bytes) => {
        // This is complex - for now just return hex
        return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
      },
    }],

    ['FREEZE_DTC', {
      name: 'FREEZE_DTC',
      pid: '02',
      mode: '01',
      bytes: 2,
      description: 'Freeze DTC',
      parse: (bytes) => {
        if (bytes.length < 2) return 'No Data';
        return `P${bytes[0].toString(16).padStart(2, '0')}${bytes[1].toString(16).padStart(2, '0')}`;
      },
    }],

    ['FUEL_SYSTEM_STATUS', {
      name: 'FUEL_SYSTEM_STATUS',
      pid: '03',
      mode: '01',
      bytes: 2,
      description: 'Fuel system status',
      parse: (bytes) => {
        const status = bytes[0];
        const statusMap: { [key: number]: string } = {
          1: 'Open loop due to insufficient engine temperature',
          2: 'Closed loop, using oxygen sensor feedback',
          4: 'Open loop due to engine load OR fuel cut due to deceleration',
          8: 'Open loop due to system failure',
          16: 'Closed loop, using at least one oxygen sensor but there is a fault'
        };
        return statusMap[status] || `Unknown (${status})`;
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

    ['SHORT_TERM_FUEL_TRIM_1', {
      name: 'SHORT_TERM_FUEL_TRIM_1',
      pid: '06',
      mode: '01',
      bytes: 1,
      description: 'Short Term Fuel Trim—Bank 1',
      unit: '%',
      min: -100,
      max: 99.2,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round(((bytes[0] - 128) * 100 / 128) * 10) / 10;
      },
    }],

    ['LONG_TERM_FUEL_TRIM_1', {
      name: 'LONG_TERM_FUEL_TRIM_1',
      pid: '07',
      mode: '01',
      bytes: 1,
      description: 'Long Term Fuel Trim—Bank 1',
      unit: '%',
      min: -100,
      max: 99.2,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round(((bytes[0] - 128) * 100 / 128) * 10) / 10;
      },
    }],

    ['SHORT_TERM_FUEL_TRIM_2', {
      name: 'SHORT_TERM_FUEL_TRIM_2',
      pid: '08',
      mode: '01',
      bytes: 1,
      description: 'Short Term Fuel Trim—Bank 2',
      unit: '%',
      min: -100,
      max: 99.2,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round(((bytes[0] - 128) * 100 / 128) * 10) / 10;
      },
    }],

    ['LONG_TERM_FUEL_TRIM_2', {
      name: 'LONG_TERM_FUEL_TRIM_2',
      pid: '09',
      mode: '01',
      bytes: 1,
      description: 'Long Term Fuel Trim—Bank 2',
      unit: '%',
      min: -100,
      max: 99.2,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round(((bytes[0] - 128) * 100 / 128) * 10) / 10;
      },
    }],

    ['FUEL_PRESSURE', {
      name: 'FUEL_PRESSURE',
      pid: '0A',
      mode: '01',
      bytes: 1,
      description: 'Fuel pressure',
      unit: 'kPa',
      min: 0,
      max: 765,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return bytes[0] * 3;
      },
    }],

    ['INTAKE_MANIFOLD_PRESSURE', {
      name: 'INTAKE_MANIFOLD_PRESSURE',
      pid: '0B',
      mode: '01',
      bytes: 1,
      description: 'Intake manifold absolute pressure',
      unit: 'kPa',
      min: 0,
      max: 255,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return bytes[0];
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

    ['TIMING_ADVANCE', {
      name: 'TIMING_ADVANCE',
      pid: '0E',
      mode: '01',
      bytes: 1,
      description: 'Timing advance',
      unit: '° before TDC',
      min: -64,
      max: 63.5,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round((bytes[0] / 2 - 64) * 10) / 10;
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
        return Math.round(((bytes[0] * 256) + bytes[1]) / 100 * 100) / 100;
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

    ['SECONDARY_AIR_STATUS', {
      name: 'SECONDARY_AIR_STATUS',
      pid: '12',
      mode: '01',
      bytes: 1,
      description: 'Commanded secondary air status',
      parse: (bytes) => {
        if (bytes.length < 1) return 'Unknown';
        const status = bytes[0];
        const statusMap: { [key: number]: string } = {
          1: 'Upstream',
          2: 'Downstream of catalytic converter',
          4: 'From the outside atmosphere or off',
          8: 'Pump commanded on for diagnostics'
        };
        return statusMap[status] || `Unknown (${status})`;
      },
    }],

    ['OXYGEN_SENSORS_PRESENT', {
      name: 'OXYGEN_SENSORS_PRESENT',
      pid: '13',
      mode: '01',
      bytes: 1,
      description: 'Oxygen sensors present (in 2 banks)',
      parse: (bytes) => {
        if (bytes.length < 1) return 'None';
        // Each bit represents a sensor
        const sensors = [];
        const value = bytes[0];
        for (let i = 0; i < 8; i++) {
          if (value & (1 << i)) {
            const bank = Math.floor(i / 4) + 1;
            const sensor = (i % 4) + 1;
            sensors.push(`Bank${bank}Sensor${sensor}`);
          }
        }
        return sensors.join(', ') || 'None';
      },
    }],

    // Oxygen sensor PIDs (14-1B)
    ['O2_SENSOR_1', {
      name: 'O2_SENSOR_1',
      pid: '14',
      mode: '01',
      bytes: 2,
      description: 'Oxygen Sensor 1 (Bank 1, Sensor 1)',
      unit: 'V',
      min: 0,
      max: 1.275,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        const voltage = bytes[0] / 200; // Voltage
        return Math.round(voltage * 1000) / 1000;
      },
    }],

    ['OBD_STANDARDS', {
      name: 'OBD_STANDARDS',
      pid: '1C',
      mode: '01',
      bytes: 1,
      description: 'OBD standards this vehicle conforms to',
      parse: (bytes) => {
        if (bytes.length < 1) return 'Unknown';
        const standards: { [key: number]: string } = {
          1: 'OBD-II as defined by CARB',
          2: 'OBD as defined by EPA',
          3: 'OBD and OBD-II',
          4: 'OBD-I',
          5: 'Not OBD compliant',
          6: 'EOBD (Europe)',
          7: 'EOBD and OBD-II',
          8: 'EOBD and OBD',
          9: 'EOBD, OBD and OBD II',
          10: 'JOBD (Japan)',
          11: 'JOBD and OBD II',
          12: 'JOBD and EOBD',
          13: 'JOBD, EOBD, and OBD II',
          17: 'Engine Manufacturer Diagnostics (EMD)',
          18: 'Engine Manufacturer Diagnostics Enhanced (EMD+)',
          19: 'Heavy Duty On-Board Diagnostics (Child/Partial) (HD OBD-C)',
          20: 'Heavy Duty On-Board Diagnostics (HD OBD)',
          21: 'World Wide Harmonized OBD (WWH OBD)',
          23: 'Heavy Duty Euro OBD Stage I without NOx control (HD EOBD-I)',
          24: 'Heavy Duty Euro OBD Stage I with NOx control (HD EOBD-I N)',
          25: 'Heavy Duty Euro OBD Stage II without NOx control (HD EOBD-II)',
          26: 'Heavy Duty Euro OBD Stage II with NOx control (HD EOBD-II N)',
          28: 'Brazil OBD Phase 1 (OBDBr-1)',
          29: 'Brazil OBD Phase 2 (OBDBr-2)',
          30: 'Korean OBD (KOBD)',
          31: 'India OBD I (IOBD I)',
          32: 'India OBD II (IOBD II)',
          33: 'Heavy Duty Euro OBD Stage VI (HD EOBD-IV)'
        };
        return standards[bytes[0]] || `Unknown standard (${bytes[0]})`;
      },
    }],

    ['AUXILIARY_INPUT_STATUS', {
      name: 'AUXILIARY_INPUT_STATUS',
      pid: '1E',
      mode: '01',
      bytes: 1,
      description: 'Auxiliary input status',
      parse: (bytes) => {
        if (bytes.length < 1) return 'Unknown';
        return (bytes[0] & 0x01) ? 'Power Take Off (PTO) active' : 'Power Take Off (PTO) not active';
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

    // PIDs 21-40 (supported PIDs 21-40)
    ['SUPPORTED_PIDS_21_40', {
      name: 'SUPPORTED_PIDS_21_40',
      pid: '20',
      mode: '01',
      bytes: 4,
      description: 'Supported PIDs [21-40]',
      parse: (bytes) => {
        return bytes.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join('');
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

    ['FUEL_RAIL_PRESSURE', {
      name: 'FUEL_RAIL_PRESSURE',
      pid: '22',
      mode: '01',
      bytes: 2,
      description: 'Fuel Rail Pressure (relative to manifold vacuum)',
      unit: 'kPa',
      min: 0,
      max: 5177.265,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        return Math.round(((bytes[0] * 256) + bytes[1]) * 0.079 * 100) / 100;
      },
    }],

    ['FUEL_RAIL_GAUGE_PRESSURE', {
      name: 'FUEL_RAIL_GAUGE_PRESSURE',
      pid: '23',
      mode: '01',
      bytes: 2,
      description: 'Fuel Rail Gauge Pressure (diesel, or gasoline direct injection)',
      unit: 'kPa',
      min: 0,
      max: 655350,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        return ((bytes[0] * 256) + bytes[1]) * 10;
      },
    }],

    // More oxygen sensor PIDs with improved parsing
    ['O2_SENSOR_1_WR_LAMBDA', {
      name: 'O2_SENSOR_1_WR_LAMBDA',
      pid: '24',
      mode: '01',
      bytes: 4,
      description: 'Oxygen Sensor 1 (Wide Range/Lambda)',
      unit: 'λ',
      min: 0,
      max: 2,
      parse: (bytes) => {
        if (bytes.length < 4) return 0;
        const lambda = ((bytes[0] * 256) + bytes[1]) / 32768;
        return Math.round(lambda * 1000) / 1000;
      },
    }],

    ['COMMANDED_EGR', {
      name: 'COMMANDED_EGR',
      pid: '2C',
      mode: '01',
      bytes: 1,
      description: 'Commanded EGR',
      unit: '%',
      min: 0,
      max: 100,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round((bytes[0] * 100) / 255 * 10) / 10;
      },
    }],

    ['EGR_ERROR', {
      name: 'EGR_ERROR',
      pid: '2D',
      mode: '01',
      bytes: 1,
      description: 'EGR Error',
      unit: '%',
      min: -100,
      max: 99.22,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round(((bytes[0] - 128) * 100 / 128) * 100) / 100;
      },
    }],

    ['COMMANDED_EVAPORATIVE_PURGE', {
      name: 'COMMANDED_EVAPORATIVE_PURGE',
      pid: '2E',
      mode: '01',
      bytes: 1,
      description: 'Commanded evaporative purge',
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

    ['WARM_UPS_SINCE_CODES_CLEARED', {
      name: 'WARM_UPS_SINCE_CODES_CLEARED',
      pid: '30',
      mode: '01',
      bytes: 1,
      description: 'Warm-ups since codes cleared',
      min: 0,
      max: 255,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return bytes[0];
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

    ['BAROMETRIC_PRESSURE', {
      name: 'BAROMETRIC_PRESSURE',
      pid: '33',
      mode: '01',
      bytes: 1,
      description: 'Barometric pressure',
      unit: 'kPa',
      min: 0,
      max: 255,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return bytes[0];
      },
    }],

    ['CATALYST_TEMP_B1S1', {
      name: 'CATALYST_TEMP_B1S1',
      pid: '3C',
      mode: '01',
      bytes: 2,
      description: 'Catalyst Temperature: Bank 1, Sensor 1',
      unit: '°C',
      min: -40,
      max: 6513.5,
      parse: (bytes) => {
        if (bytes.length < 2) return -40;
        return Math.round((((bytes[0] * 256) + bytes[1]) / 10 - 40) * 10) / 10;
      },
    }],

    ['CONTROL_MODULE_VOLTAGE', {
      name: 'CONTROL_MODULE_VOLTAGE',
      pid: '42',
      mode: '01',
      bytes: 2,
      description: 'Control module voltage',
      unit: 'V',
      min: 0,
      max: 65.535,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        return Math.round(((bytes[0] * 256) + bytes[1]) / 1000 * 100) / 100;
      },
    }],

    ['ABSOLUTE_LOAD_VALUE', {
      name: 'ABSOLUTE_LOAD_VALUE',
      pid: '43',
      mode: '01',
      bytes: 2,
      description: 'Absolute load value',
      unit: '%',
      min: 0,
      max: 25700,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        return Math.round(((bytes[0] * 256) + bytes[1]) * 100 / 255 * 10) / 10;
      },
    }],

    ['FUEL_AIR_COMMANDED_EQUIV_RATIO', {
      name: 'FUEL_AIR_COMMANDED_EQUIV_RATIO',
      pid: '44',
      mode: '01',
      bytes: 2,
      description: 'Fuel–Air commanded equivalence ratio',
      unit: 'λ',
      min: 0,
      max: 2,
      parse: (bytes) => {
        if (bytes.length < 2) return 0;
        return Math.round(((bytes[0] * 256) + bytes[1]) / 32768 * 1000) / 1000;
      },
    }],

    ['RELATIVE_THROTTLE_POSITION', {
      name: 'RELATIVE_THROTTLE_POSITION',
      pid: '45',
      mode: '01',
      bytes: 1,
      description: 'Relative throttle position',
      unit: '%',
      min: 0,
      max: 100,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round((bytes[0] * 100) / 255 * 10) / 10;
      },
    }],

    ['AMBIENT_AIR_TEMP', {
      name: 'AMBIENT_AIR_TEMP',
      pid: '46',
      mode: '01',
      bytes: 1,
      description: 'Ambient air temperature',
      unit: '°C',
      min: -40,
      max: 215,
      parse: (bytes) => {
        if (bytes.length < 1) return -40;
        return bytes[0] - 40;
      },
    }],

    ['ABSOLUTE_THROTTLE_POSITION_B', {
      name: 'ABSOLUTE_THROTTLE_POSITION_B',
      pid: '47',
      mode: '01',
      bytes: 1,
      description: 'Absolute throttle position B',
      unit: '%',
      min: 0,
      max: 100,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round((bytes[0] * 100) / 255 * 10) / 10;
      },
    }],

    ['ACCELERATOR_PEDAL_POSITION_D', {
      name: 'ACCELERATOR_PEDAL_POSITION_D',
      pid: '49',
      mode: '01',
      bytes: 1,
      description: 'Accelerator pedal position D',
      unit: '%',
      min: 0,
      max: 100,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round((bytes[0] * 100) / 255 * 10) / 10;
      },
    }],

    ['ACCELERATOR_PEDAL_POSITION_E', {
      name: 'ACCELERATOR_PEDAL_POSITION_E',
      pid: '4A',
      mode: '01',
      bytes: 1,
      description: 'Accelerator pedal position E',
      unit: '%',
      min: 0,
      max: 100,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round((bytes[0] * 100) / 255 * 10) / 10;
      },
    }],

    ['COMMANDED_THROTTLE_ACTUATOR', {
      name: 'COMMANDED_THROTTLE_ACTUATOR',
      pid: '4C',
      mode: '01',
      bytes: 1,
      description: 'Commanded throttle actuator',
      unit: '%',
      min: 0,
      max: 100,
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return Math.round((bytes[0] * 100) / 255 * 10) / 10;
      },
    }],

    // --- Mode 09: Vehicle Information ---
    ['VIN_MESSAGE_COUNT', {
      name: 'VIN_MESSAGE_COUNT',
      pid: '01',
      mode: '09',
      bytes: 1,
      description: 'VIN Message Count',
      parse: (bytes) => {
        if (bytes.length < 1) return 0;
        return bytes[0];
      },
    }],

    ['VIN', {
      name: 'VIN',
      pid: '02',
      mode: '09',
      bytes: 20, // VIN handling is more complex - this is simplified
      description: 'Vehicle Identification Number',
      parse: (bytes) => {
        // VIN is typically received in multiple messages
        // This is a simplified version
        let vin = '';
        for (let i = 0; i < Math.min(bytes.length, 17); i++) {
          if (bytes[i] >= 32 && bytes[i] <= 126) { // Printable ASCII
            vin += String.fromCharCode(bytes[i]);
          }
        }
        return vin || 'VIN_NOT_AVAILABLE';
      },
    }],
  ]);

  /**
   * Retrieves a PID definition by its common name.
   * @param name The name of the PID (e.g., 'ENGINE_RPM').
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
   * Get PIDs by mode
   */
  public static getPIDsByMode(mode: string): PIDDefinition[] {
    return Array.from(this.pids.values()).filter(pid => pid.mode === mode);
  }

  /**
   * Find PID by mode and PID code
   */
  public static findPID(mode: string, pidCode: string): PIDDefinition | undefined {
    return Array.from(this.pids.values()).find(
      pid => pid.mode.toUpperCase() === mode.toUpperCase() && 
             pid.pid.toUpperCase() === pidCode.toUpperCase()
    );
  }

  /**
   * Get common dashboard PIDs
   */
  public static getDashboardPIDs(): PIDDefinition[] {
    const dashboardPIDNames = [
      'ENGINE_RPM',
      'VEHICLE_SPEED',
      'ENGINE_COOLANT_TEMP',
      'ENGINE_LOAD',
      'THROTTLE_POSITION',
      'MAF_RATE',
      'INTAKE_AIR_TEMP',
      'FUEL_LEVEL',
      'TIMING_ADVANCE',
      'INTAKE_MANIFOLD_PRESSURE'
    ];
    
    return dashboardPIDNames
      .map(name => this.getPID(name))
      .filter((pid): pid is PIDDefinition => pid !== undefined);
  }

  /**
   * Get real-time monitoring PIDs (frequently updated)
   */
  public static getRealtimePIDs(): PIDDefinition[] {
    const realtimePIDNames = [
      'ENGINE_RPM',
      'VEHICLE_SPEED',
      'ENGINE_COOLANT_TEMP',
      'ENGINE_LOAD',
      'THROTTLE_POSITION',
      'MAF_RATE',
      'INTAKE_MANIFOLD_PRESSURE',
      'TIMING_ADVANCE'
    ];
    
    return realtimePIDNames
      .map(name => this.getPID(name))
      .filter((pid): pid is PIDDefinition => pid !== undefined);
  }

  /**
   * Get diagnostic PIDs (less frequently updated)
   */
  public static getDiagnosticPIDs(): PIDDefinition[] {
    const diagnosticPIDNames = [
      'MONITOR_STATUS',
      'FREEZE_DTC',
      'FUEL_SYSTEM_STATUS',
      'SECONDARY_AIR_STATUS',
      'OXYGEN_SENSORS_PRESENT',
      'OBD_STANDARDS',
      'DISTANCE_WITH_MIL_ON',
      'WARM_UPS_SINCE_CODES_CLEARED',
      'DISTANCE_SINCE_CODES_CLEARED',
      'RUNTIME_SINCE_ENGINE_START'
    ];
    
    return diagnosticPIDNames
      .map(name => this.getPID(name))
      .filter((pid): pid is PIDDefinition => pid !== undefined);
  }

  /**
   * Get supported PIDs checker PIDs
   */
  public static getSupportedPIDCheckers(): PIDDefinition[] {
    const supportedPIDNames = [
      'SUPPORTED_PIDS_01_20',
      'SUPPORTED_PIDS_21_40'
    ];
    
    return supportedPIDNames
      .map(name => this.getPID(name))
      .filter((pid): pid is PIDDefinition => pid !== undefined);
  }

  /**
   * Get all PID names
   */
  public static getAllPIDNames(): string[] {
    return Array.from(this.pids.keys());
  }

  /**
   * Check if a PID is supported (for use with supported PID bitmask)
   */
  public static isPIDSupported(pidCode: string, supportedPIDsBitmask: string): boolean {
    const pidNumber = parseInt(pidCode, 16);
    if (isNaN(pidNumber)) return false;
    
    // Convert hex string to number and check the appropriate bit
    const bitmask = parseInt(supportedPIDsBitmask, 16);
    const bitPosition = pidNumber % 32;
    
    return (bitmask & (1 << (31 - bitPosition))) !== 0;
  }

  /**
   * Get PIDs that have numeric values (for charts and gauges)
   */
  public static getNumericPIDs(): PIDDefinition[] {
    return Array.from(this.pids.values()).filter(pid => 
      pid.unit !== undefined && 
      pid.min !== undefined && 
      pid.max !== undefined
    );
  }

  /**
   * Get PIDs by category based on their description
   */
  public static getPIDsByCategory(category: 'engine' | 'fuel' | 'emissions' | 'sensors' | 'temperature'): PIDDefinition[] {
    const categoryKeywords = {
      engine: ['engine', 'rpm', 'load', 'timing'],
      fuel: ['fuel', 'trim', 'injection', 'rail', 'level'],
      emissions: ['egr', 'catalyst', 'evaporative', 'oxygen', 'lambda'],
      sensors: ['sensor', 'pressure', 'position', 'throttle'],
      temperature: ['temperature', 'temp', 'coolant', 'intake', 'ambient']
    };
    
    const keywords = categoryKeywords[category] || [];
    
    return Array.from(this.pids.values()).filter(pid => {
      const searchText = `${pid.name} ${pid.description}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword));
    });
  }
}