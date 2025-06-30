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
      parse: (bytes) => bytes.map(byte => byte.toString(2).padStart(8, '0')).join(' '),
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
      parse: (bytes) => (bytes[0] * 100) / 255,
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
      parse: (bytes) => bytes[0] - 40,
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
      parse: (bytes) => ((bytes[0] * 256) + bytes[1]) / 4,
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
      parse: (bytes) => bytes[0],
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
      parse: (bytes) => bytes[0] - 40,
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
      parse: (bytes) => ((bytes[0] * 256) + bytes[1]) / 100,
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
      parse: (bytes) => (bytes[0] * 100) / 255,
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
      parse: (bytes) => (bytes[0] * 100) / 255,
    }],

    // --- Mode 09: Vehicle Information ---
    ['VIN', {
        name: 'VIN',
        pid: '02',
        mode: '09',
        bytes: 20, // VIN is complex and can require special handling for multi-line responses
        description: 'Vehicle Identification Number',
        parse: (bytes) => bytes.map(byte => String.fromCharCode(byte)).join(''),
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
}