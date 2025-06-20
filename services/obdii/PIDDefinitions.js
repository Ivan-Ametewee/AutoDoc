// PIDDefinitions.js - Complete OBDII PID database with parsing functions

/**
 * OBDII Parameter ID (PID) definitions and parsing functions
 * Supports both standard PIDs (Mode 01) and manufacturer-specific PIDs
 */

export const PID_DEFINITIONS = {
  // Engine Parameters
  '0C': {
    name: 'Engine RPM',
    description: 'Engine revolutions per minute',
    unit: 'rpm',
    min: 0,
    max: 16383.75,
    parser: (data) => ((data[0] * 256) + data[1]) / 4,
    category: 'engine',
    priority: 'high'
  },
  
  '0D': {
    name: 'Vehicle Speed',
    description: 'Vehicle speed sensor',
    unit: 'km/h',
    min: 0,
    max: 255,
    parser: (data) => data[0],
    category: 'vehicle',
    priority: 'high'
  },
  
  '05': {
    name: 'Engine Coolant Temperature',
    description: 'Engine coolant temperature',
    unit: '°C',
    min: -40,
    max: 215,
    parser: (data) => data[0] - 40,
    category: 'engine',
    priority: 'high'
  },
  
  '0F': {
    name: 'Intake Air Temperature',
    description: 'Intake air temperature sensor',
    unit: '°C',
    min: -40,
    max: 215,
    parser: (data) => data[0] - 40,
    category: 'engine',
    priority: 'medium'
  },
  
  '10': {
    name: 'MAF Air Flow Rate',
    description: 'Mass air flow sensor',
    unit: 'g/s',
    min: 0,
    max: 655.35,
    parser: (data) => ((data[0] * 256) + data[1]) / 100,
    category: 'engine',
    priority: 'medium'
  },
  
  '11': {
    name: 'Throttle Position',
    description: 'Throttle position sensor',
    unit: '%',
    min: 0,
    max: 100,
    parser: (data) => (data[0] * 100) / 255,
    category: 'engine',
    priority: 'medium'
  },
  
  '04': {
    name: 'Engine Load',
    description: 'Calculated engine load value',
    unit: '%',
    min: 0,
    max: 100,
    parser: (data) => (data[0] * 100) / 255,
    category: 'engine',
    priority: 'medium'
  },
  
  '06': {
    name: 'Short Term Fuel Trim Bank 1',
    description: 'Short term fuel trim percentage',
    unit: '%',
    min: -100,
    max: 99.2,
    parser: (data) => (data[0] - 128) * 100 / 128,
    category: 'fuel',
    priority: 'medium'
  },
  
  '07': {
    name: 'Long Term Fuel Trim Bank 1',
    description: 'Long term fuel trim percentage',
    unit: '%',
    min: -100,
    max: 99.2,
    parser: (data) => (data[0] - 128) * 100 / 128,
    category: 'fuel',
    priority: 'medium'
  },
  
  '08': {
    name: 'Short Term Fuel Trim Bank 2',
    description: 'Short term fuel trim percentage Bank 2',
    unit: '%',
    min: -100,
    max: 99.2,
    parser: (data) => (data[0] - 128) * 100 / 128,
    category: 'fuel',
    priority: 'medium'
  },
  
  '09': {
    name: 'Long Term Fuel Trim Bank 2',
    description: 'Long term fuel trim percentage Bank 2',
    unit: '%',
    min: -100,
    max: 99.2,
    parser: (data) => (data[0] - 128) * 100 / 128,
    category: 'fuel',
    priority: 'medium'
  },
  
  '0A': {
    name: 'Fuel System Pressure',
    description: 'Fuel rail pressure (gauge pressure)',
    unit: 'kPa',
    min: 0,
    max: 765,
    parser: (data) => data[0] * 3,
    category: 'fuel',
    priority: 'low'
  },
  
  '0B': {
    name: 'Intake Manifold Pressure',
    description: 'Intake manifold absolute pressure',
    unit: 'kPa',
    min: 0,
    max: 255,
    parser: (data) => data[0],
    category: 'engine',
    priority: 'medium'
  },
  
  '0E': {
    name: 'Timing Advance',
    description: 'Timing advance (Cylinder #1)',
    unit: '°',
    min: -64,
    max: 63.5,
    parser: (data) => (data[0] / 2) - 64,
    category: 'engine',
    priority: 'low'
  },
  
  '12': {
    name: 'Secondary Air Status',
    description: 'Secondary air status',
    unit: 'status',
    parser: (data) => {
      const status = data[0];
      const statuses = {
        0x01: 'Upstream',
        0x02: 'Downstream of catalytic converter',
        0x04: 'From outside atmosphere or off',
        0x08: 'Pump commanded on for diagnostics'
      };
      return statuses[status] || 'Unknown';
    },
    category: 'emissions',
    priority: 'low'
  },
  
  '13': {
    name: 'Oxygen Sensors Present',
    description: 'Oxygen sensors present in 2 banks',
    unit: 'bitmap',
    parser: (data) => data[0].toString(2).padStart(8, '0'),
    category: 'emissions',
    priority: 'low'
  },
  
  '14': {
    name: 'O2 Sensor 1 Voltage',
    description: 'Oxygen sensor 1 voltage and fuel trim',
    unit: 'V',
    min: 0,
    max: 1.275,
    parser: (data) => data[0] / 200,
    category: 'emissions',
    priority: 'medium'
  },
  
  '15': {
    name: 'O2 Sensor 2 Voltage',
    description: 'Oxygen sensor 2 voltage and fuel trim',
    unit: 'V',
    min: 0,
    max: 1.275,
    parser: (data) => data[0] / 200,
    category: 'emissions',
    priority: 'medium'
  },
  
  '1C': {
    name: 'OBD Standards',
    description: 'OBD standards this vehicle conforms to',
    unit: 'standard',
    parser: (data) => {
      const standards = {
        0x01: 'OBD-II as defined by CARB',
        0x02: 'OBD as defined by EPA',
        0x03: 'OBD and OBD-II',
        0x04: 'OBD-I',
        0x05: 'Not OBD compliant',
        0x06: 'EOBD (Europe)',
        0x07: 'EOBD and OBD-II',
        0x08: 'EOBD and OBD',
        0x09: 'EOBD, OBD and OBD II',
        0x0A: 'JOBD (Japan)',
        0x0B: 'JOBD and OBD II',
        0x0C: 'JOBD and EOBD',
        0x0D: 'JOBD, EOBD, and OBD II'
      };
      return standards[data[0]] || 'Unknown';
    },
    category: 'system',
    priority: 'low'
  },
  
  '1F': {
    name: 'Run Time Since Engine Start',
    description: 'Run time since engine start',
    unit: 'seconds',
    min: 0,
    max: 65535,
    parser: (data) => (data[0] * 256) + data[1],
    category: 'engine',
    priority: 'low'
  },
  
  '21': {
    name: 'Distance Traveled with MIL On',
    description: 'Distance traveled with malfunction indicator lamp on',
    unit: 'km',
    min: 0,
    max: 65535,
    parser: (data) => (data[0] * 256) + data[1],
    category: 'emissions',
    priority: 'low'
  },
  
  '22': {
    name: 'Fuel Rail Pressure',
    description: 'Fuel rail pressure (relative to manifold vacuum)',
    unit: 'kPa',
    min: 0,
    max: 5177.265,
    parser: (data) => ((data[0] * 256) + data[1]) * 0.079,
    category: 'fuel',
    priority: 'low'
  },
  
  '23': {
    name: 'Fuel Rail Gauge Pressure',
    description: 'Fuel rail gauge pressure (diesel, or gasoline direct injection)',
    unit: 'kPa',
    min: 0,
    max: 655350,
    parser: (data) => ((data[0] * 256) + data[1]) * 10,
    category: 'fuel',
    priority: 'low'
  },
  
  '2F': {
    name: 'Fuel Tank Level',
    description: 'Fuel tank level input',
    unit: '%',
    min: 0,
    max: 100,
    parser: (data) => (data[0] * 100) / 255,
    category: 'fuel',
    priority: 'medium'
  },
  
  '30': {
    name: 'Warm-ups Since Codes Cleared',
    description: 'Warm-ups since codes cleared',
    unit: 'count',
    min: 0,
    max: 255,
    parser: (data) => data[0],
    category: 'system',
    priority: 'low'
  },
  
  '31': {
    name: 'Distance Since Codes Cleared',
    description: 'Distance traveled since codes cleared',
    unit: 'km',
    min: 0,
    max: 65535,
    parser: (data) => (data[0] * 256) + data[1],
    category: 'system',
    priority: 'low'
  },
  
  '33': {
    name: 'Absolute Barometric Pressure',
    description: 'Absolute barometric pressure',
    unit: 'kPa',
    min: 0,
    max: 255,
    parser: (data) => data[0],
    category: 'environment',
    priority: 'low'
  },
  
  '42': {
    name: 'Control Module Voltage',
    description: 'Control module voltage',
    unit: 'V',
    min: 0,
    max: 65.535,
    parser: (data) => ((data[0] * 256) + data[1]) / 1000,
    category: 'electrical',
    priority: 'medium'
  },
  
  '43': {
    name: 'Absolute Load Value',
    description: 'Absolute load value',
    unit: '%',
    min: 0,
    max: 25700,
    parser: (data) => ((data[0] * 256) + data[1]) * 100 / 255,
    category: 'engine',
    priority: 'low'
  },
  
  '44': {
    name: 'Fuel–Air Commanded Equivalence Ratio',
    description: 'Fuel–Air commanded equivalence ratio',
    unit: 'ratio',
    min: 0,
    max: 2,
    parser: (data) => ((data[0] * 256) + data[1]) / 32768,
    category: 'fuel',
    priority: 'low'
  },
  
  '45': {
    name: 'Relative Throttle Position',
    description: 'Relative throttle position',
    unit: '%',
    min: 0,
    max: 100,
    parser: (data) => (data[0] * 100) / 255,
    category: 'engine',
    priority: 'medium'
  },
  
  '46': {
    name: 'Ambient Air Temperature',
    description: 'Ambient air temperature',
    unit: '°C',
    min: -40,
    max: 215,
    parser: (data) => data[0] - 40,
    category: 'environment',
    priority: 'low'
  },
  
  '47': {
    name: 'Absolute Throttle Position B',
    description: 'Absolute throttle position B',
    unit: '%',
    min: 0,
    max: 100,
    parser: (data) => (data[0] * 100) / 255,
    category: 'engine',
    priority: 'low'
  },
  
  '48': {
    name: 'Absolute Throttle Position C',
    description: 'Absolute throttle position C',
    unit: '%',
    min: 0,
    max: 100,
    parser: (data) => (data[0] * 100) / 255,
    category: 'engine',
    priority: 'low'
  },
  
  '49': {
    name: 'Accelerator Pedal Position D',
    description: 'Accelerator pedal position D',
    unit: '%',
    min: 0,
    max: 100,
    parser: (data) => (data[0] * 100) / 255,
    category: 'engine',
    priority: 'medium'
  },
  
  '4A': {
    name: 'Accelerator Pedal Position E',
    description: 'Accelerator pedal position E',
    unit: '%',
    min: 0,
    max: 100,
    parser: (data) => (data[0] * 100) / 255,
    category: 'engine',
    priority: 'medium'
  },
  
  '4B': {
    name: 'Accelerator Pedal Position F',
    description: 'Accelerator pedal position F',
    unit: '%',
    min: 0,
    max: 100,
    parser: (data) => (data[0] * 100) / 255,
    category: 'engine',
    priority: 'medium'
  },
  
  '4C': {
    name: 'Commanded Throttle Actuator',
    description: 'Commanded throttle actuator',
    unit: '%',
    min: 0,
    max: 100,
    parser: (data) => (data[0] * 100) / 255,
    category: 'engine',
    priority: 'low'
  },
  
  '51': {
    name: 'Fuel Type',
    description: 'Fuel Type',
    unit: 'type',
    parser: (data) => {
      const fuelTypes = {
        0x01: 'Gasoline',
        0x02: 'Methanol',
        0x03: 'Ethanol',
        0x04: 'Diesel',
        0x05: 'LPG',
        0x06: 'CNG',
        0x07: 'Propane',
        0x08: 'Electric',
        0x09: 'Bifuel running Gasoline',
        0x0A: 'Bifuel running Methanol',
        0x0B: 'Bifuel running Ethanol',
        0x0C: 'Bifuel running LPG',
        0x0D: 'Bifuel running CNG',
        0x0E: 'Bifuel running Propane',
        0x0F: 'Bifuel running Electricity',
        0x10: 'Bifuel running electric and combustion engine',
        0x11: 'Hybrid gasoline',
        0x12: 'Hybrid Ethanol',
        0x13: 'Hybrid Diesel',
        0x14: 'Hybrid Electric',
        0x15: 'Hybrid running electric and combustion engine',
        0x16: 'Hybrid Regenerative',
        0x17: 'Bifuel running diesel'
      };
      return fuelTypes[data[0]] || 'Unknown';
    },
    category: 'fuel',
    priority: 'low'
  }
};

// PID categories for organization
export const PID_CATEGORIES = {
  engine: {
    name: 'Engine',
    icon: 'engine',
    color: '#FF6B6B'
  },
  fuel: {
    name: 'Fuel System',
    icon: 'fuel',
    color: '#4ECDC4'
  },
  emissions: {
    name: 'Emissions',
    icon: 'leaf',
    color: '#45B7D1'
  },
  electrical: {
    name: 'Electrical',
    icon: 'battery',
    color: '#FFA07A'
  },
  vehicle: {
    name: 'Vehicle',
    icon: 'car',
    color: '#98D8C8'
  },
  environment: {
    name: 'Environment',
    icon: 'thermometer',
    color: '#F7DC6F'
  },
  system: {
    name: 'System',
    icon: 'settings',
    color: '#BB8FCE'
  }
};

// Dashboard display configurations
export const DASHBOARD_PIDS = {
  primary: ['0C', '0D', '05', '11'], // RPM, Speed, Coolant Temp, Throttle Position
  secondary: ['04', '10', '0F', '42'], // Engine Load, MAF, Intake Temp, Voltage
  fuel: ['06', '07', '2F', '51'], // Fuel trims, tank level, fuel type
  advanced: ['0B', '0E', '1F', '43'] // Manifold pressure, timing, runtime, absolute load
};

// Alert thresholds for monitoring
export const PID_THRESHOLDS = {
  '05': { // Coolant Temperature
    warning: 95,
    critical: 105,
    unit: '°C'
  },
  '0F': { // Intake Air Temperature
    warning: 60,
    critical: 80,
    unit: '°C'
  },
  '0C': { // Engine RPM
    warning: 6000,
    critical: 7000,
    unit: 'rpm'
  },
  '42': { // Control Module Voltage
    warningLow: 11.5,
    criticalLow: 11.0,
    warningHigh: 14.5,
    criticalHigh: 15.0,
    unit: 'V'
  },
  '2F': { // Fuel Tank Level
    warning: 15,
    critical: 5,
    unit: '%'
  }
};

/**
 * Parse raw OBDII response data
 * @param {string} pid - Parameter ID
 * @param {Array} data - Raw data bytes
 * @returns {Object} Parsed value with metadata
 */
export const parsePIDResponse = (pid, data) => {
  const definition = PID_DEFINITIONS[pid.toUpperCase()];
  if (!definition) {
    return {
      error: `Unknown PID: ${pid}`,
      raw: data
    };
  }

  try {
    const value = definition.parser(data);
    return {
      pid,
      name: definition.name,
      value,
      unit: definition.unit,
      category: definition.category,
      priority: definition.priority,
      timestamp: new Date().toISOString(),
      raw: data
    };
  } catch (error) {
    return {
      error: `Parse error for PID ${pid}: ${error.message}`,
      raw: data
    };
  }
};

/**
 * Get PIDs by category
 * @param {string} category - Category name
 * @returns {Array} Array of PID definitions
 */
export const getPIDsByCategory = (category) => {
  return Object.entries(PID_DEFINITIONS)
    .filter(([, definition]) => definition.category === category)
    .map(([pid, definition]) => ({ pid, ...definition }));
};

/**
 * Get PIDs by priority
 * @param {string} priority - Priority level (high, medium, low)
 * @returns {Array} Array of PID definitions
 */
export const getPIDsByPriority = (priority) => {
  return Object.entries(PID_DEFINITIONS)
    .filter(([, definition]) => definition.priority === priority)
    .map(([pid, definition]) => ({ pid, ...definition }));
};

/**
 * Validate PID format
 * @param {string} pid - Parameter ID to validate
 * @returns {boolean} True if valid PID format
 */
export const isValidPID = (pid) => {
  return /^[0-9A-F]{2}$/i.test(pid) && PID_DEFINITIONS[pid.toUpperCase()];
};

/**
 * Get all supported PIDs
 * @returns {Array} Array of all supported PID codes
 */
export const getAllSupportedPIDs = () => {
  return Object.keys(PID_DEFINITIONS);
};

export default PID_DEFINITIONS;