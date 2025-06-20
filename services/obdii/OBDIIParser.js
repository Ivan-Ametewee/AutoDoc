// src/services/obdii/OBDIIParser.js


/**
 * OBDII Data Parser - Handles parsing of raw OBDII responses
 * Supports ELM327 and similar adapter protocols
 */
export class OBDIIParser {
  constructor() {
    this.initializeConstants();
  }

  /**
   * Initialize parsing constants and lookup tables
   */
  initializeConstants() {
    // Standard OBDII response patterns
    this.responsePatterns = {
      PID_RESPONSE: /^[0-9A-F]{2}\s[0-9A-F]{2}/,
      DTC_RESPONSE: /^[0-9A-F]{4}/,
      ERROR_RESPONSE: /^(NO DATA|ERROR|UNABLE TO CONNECT|BUS INIT|CAN ERROR)/,
      PROMPT: /^>/,
      ELM_INFO: /^ELM|^AT|^\?/
    };

    // PID calculation formulas
    this.pidFormulas = {
      // Mode 01 PIDs
      '0104': { // Engine Load
        formula: (a) => (a * 100) / 255,
        unit: '%',
        name: 'Engine Load'
      },
      '0105': { // Coolant Temperature
        formula: (a) => a - 40,
        unit: '°C',
        name: 'Coolant Temperature'
      },
      '0106': { // Short Term Fuel Trim Bank 1
        formula: (a) => ((a - 128) * 100) / 128,
        unit: '%',
        name: 'Short Term Fuel Trim Bank 1'
      },
      '0107': { // Long Term Fuel Trim Bank 1
        formula: (a) => ((a - 128) * 100) / 128,
        unit: '%',
        name: 'Long Term Fuel Trim Bank 1'
      },
      '0108': { // Short Term Fuel Trim Bank 2
        formula: (a) => ((a - 128) * 100) / 128,
        unit: '%',
        name: 'Short Term Fuel Trim Bank 2'
      },
      '0109': { // Long Term Fuel Trim Bank 2
        formula: (a) => ((a - 128) * 100) / 128,
        unit: '%',
        name: 'Long Term Fuel Trim Bank 2'
      },
      '010A': { // Fuel System Pressure
        formula: (a) => a * 3,
        unit: 'kPa',
        name: 'Fuel System Pressure'
      },
      '010B': { // Intake Manifold Pressure
        formula: (a) => a,
        unit: 'kPa',
        name: 'Intake Manifold Pressure'
      },
      '010C': { // Engine RPM
        formula: (a, b) => ((a * 256) + b) / 4,
        unit: 'rpm',
        name: 'Engine RPM'
      },
      '010D': { // Vehicle Speed
        formula: (a) => a,
        unit: 'km/h',
        name: 'Vehicle Speed'
      },
      '010E': { // Timing Advance
        formula: (a) => (a - 128) / 2,
        unit: '°',
        name: 'Timing Advance'
      },
      '010F': { // Intake Air Temperature
        formula: (a) => a - 40,
        unit: '°C',
        name: 'Intake Air Temperature'
      },
      '0110': { // MAF Air Flow Rate
        formula: (a, b) => ((a * 256) + b) / 100,
        unit: 'g/s',
        name: 'MAF Air Flow Rate'
      },
      '0111': { // Throttle Position
        formula: (a) => (a * 100) / 255,
        unit: '%',
        name: 'Throttle Position'
      },
      '0114': { // O2 Sensor 1 Bank 1
        formula: (a, b) => ({ voltage: a / 200, trim: ((b - 128) * 100) / 128 }),
        unit: 'V / %',
        name: 'O2 Sensor 1 Bank 1'
      },
      '0115': { // O2 Sensor 2 Bank 1
        formula: (a, b) => ({ voltage: a / 200, trim: ((b - 128) * 100) / 128 }),
        unit: 'V / %',
        name: 'O2 Sensor 2 Bank 1'
      },
      '011F': { // Run Time Since Engine Start
        formula: (a, b) => (a * 256) + b,
        unit: 'seconds',
        name: 'Run Time Since Engine Start'
      },
      '0121': { // Distance Traveled with MIL On
        formula: (a, b) => (a * 256) + b,
        unit: 'km',
        name: 'Distance Traveled with MIL On'
      },
      '0122': { // Fuel Rail Pressure
        formula: (a, b) => ((a * 256) + b) * 0.079,
        unit: 'kPa',
        name: 'Fuel Rail Pressure'
      },
      '0123': { // Fuel Rail Gauge Pressure
        formula: (a, b) => ((a * 256) + b) * 10,
        unit: 'kPa',
        name: 'Fuel Rail Gauge Pressure'
      },
      '012F': { // Fuel Tank Level Input
        formula: (a) => (a * 100) / 255,
        unit: '%',
        name: 'Fuel Tank Level'
      },
      '0131': { // Distance Traveled Since Codes Cleared
        formula: (a, b) => (a * 256) + b,
        unit: 'km',
        name: 'Distance Since Codes Cleared'
      },
      '0133': { // Barometric Pressure
        formula: (a) => a,
        unit: 'kPa',
        name: 'Barometric Pressure'
      },
      '0142': { // Control Module Voltage
        formula: (a, b) => ((a * 256) + b) / 1000,
        unit: 'V',
        name: 'Control Module Voltage'
      },
      '0143': { // Absolute Load Value
        formula: (a, b) => ((a * 256) + b) * 100 / 255,
        unit: '%',
        name: 'Absolute Load Value'
      },
      '0144': { // Fuel Air Commanded Equivalence Ratio
        formula: (a, b) => ((a * 256) + b) / 32768,
        unit: 'ratio',
        name: 'Commanded Equivalence Ratio'
      },
      '0145': { // Relative Throttle Position
        formula: (a) => (a * 100) / 255,
        unit: '%',
        name: 'Relative Throttle Position'
      },
      '0146': { // Ambient Air Temperature
        formula: (a) => a - 40,
        unit: '°C',
        name: 'Ambient Air Temperature'
      },
      '0149': { // Accelerator Pedal Position D
        formula: (a) => (a * 100) / 255,
        unit: '%',
        name: 'Accelerator Pedal Position D'
      },
      '014A': { // Accelerator Pedal Position E
        formula: (a) => (a * 100) / 255,
        unit: '%',
        name: 'Accelerator Pedal Position E'
      },
      '014B': { // Accelerator Pedal Position F
        formula: (a) => (a * 100) / 255,
        unit: '%',
        name: 'Accelerator Pedal Position F'
      },
      '014C': { // Commanded Throttle Actuator
        formula: (a) => (a * 100) / 255,
        unit: '%',
        name: 'Commanded Throttle Actuator'
      },
      '014D': { // Time Run with MIL on
        formula: (a, b) => (a * 256) + b,
        unit: 'minutes',
        name: 'Time Run with MIL on'
      },
      '014E': { // Time since DTCs cleared
        formula: (a, b) => (a * 256) + b,
        unit: 'minutes',
        name: 'Time since DTCs cleared'
      },
      '0151': { // Fuel Type
        formula: (a) => {
          const fuelTypes = {
            0: 'Not available',
            1: 'Gasoline',
            2: 'Methanol',
            3: 'Ethanol',
            4: 'Diesel',
            5: 'LPG',
            6: 'CNG',
            7: 'Propane',
            8: 'Electric',
            9: 'Bifuel running Gasoline',
            10: 'Bifuel running Methanol',
            11: 'Bifuel running Ethanol',
            12: 'Bifuel running LPG',
            13: 'Bifuel running CNG',
            14: 'Bifuel running Propane'
          };
          return fuelTypes[a] || 'Unknown';
        },
        unit: '',
        name: 'Fuel Type'
      }
    };
  }

  /**
   * Parse raw OBDII response data
   * @param {string} rawData - Raw response from OBDII adapter
   * @returns {Object} Parsed response object
   */
  parseResponse(rawData) {
    const cleanData = rawData.trim();

    // Check for error responses
    if (this.responsePatterns.ERROR_RESPONSE.test(cleanData)) {
      return {
        type: 'ERROR',
        value: cleanData
      };
    }

    // Check for ELM info messages
    if (this.responsePatterns.ELM_INFO.test(cleanData)) {
      return {
        type: 'INFO',
        value: cleanData
      };
    }

    // Check for prompt
    if (this.responsePatterns.PROMPT.test(cleanData)) {
      return {
        type: 'PROMPT',
        value: cleanData
      };
    }

    // Check for DTC response
    if (this.responsePatterns.DTC_RESPONSE.test(cleanData)) {
      return this.parseDTCResponse(cleanData);
    }

    // Check for PID response
    if (this.responsePatterns.PID_RESPONSE.test(cleanData)) {
      return this.parsePIDResponse(cleanData);
    }

    // Unknown response type
    return {
      type: 'UNKNOWN',
      value: cleanData
    };
  }

  /**
   * Parse PID response data
   * @param {string} pid - PID identifier
   * @param {string} data - Raw PID response data
   * @returns {Object} Parsed PID data with value and unit
   */
  parsePIDResponse(pid, data) {
    // Remove spaces and get byte values
    const bytes = data.replace(/\s/g, '').match(/.{2}/g);
    if (!bytes || bytes.length < 2) {
      throw new Error('Invalid PID response format');
    }

    // Convert hex bytes to decimal values
    const values = bytes.map(byte => parseInt(byte, 16));
    
    // Get PID formula
    const pidInfo = this.pidFormulas[pid];
    if (!pidInfo) {
      throw new Error(`Unknown PID: ${pid}`);
    }

    // Calculate final value using formula
    const value = pidInfo.formula(...values);

    return {
      type: 'PID',
      pid: pid,
      name: pidInfo.name,
      value: value,
      unit: pidInfo.unit,
      bytes: bytes
    };
  }

  /**
   * Parse Diagnostic Trouble Code response
   * @param {string} data - Raw DTC response data
   * @returns {Object} Parsed DTC information
   */
  parseDTCResponse(data) {
    // Split response into individual DTC codes
    const dtcCodes = data.match(/.{4}/g) || [];
    
    // Parse each DTC code
    const codes = dtcCodes.map(code => {
      // First character determines the code type
      const type = code.charAt(0);
      const dtcTypes = {
        '0': 'P', // Powertrain
        '1': 'C', // Chassis
        '2': 'B', // Body
        '3': 'U'  // Network
      };

      // Format DTC code
      const formattedCode = `${dtcTypes[type] || 'P'}${code.substring(1)}`;
      
      // Get DTC information from database
      const dtcInfo = dtcCodes.getDTCInfo(formattedCode);

      return {
        code: formattedCode,
        description: dtcInfo.description,
        system: dtcInfo.system,
        subsystem: dtcInfo.subsystem,
        severity: dtcInfo.severity
      };
    });

    return {
      type: 'DTC',
      codes: codes
    };
  }

  /**
   * Convert hex string to bytes array
   * @param {string} hex - Hex string
   * @returns {Array} Array of byte values
   */
  hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }

  /**
   * Convert bytes array to hex string
   * @param {Array} bytes - Array of byte values
   * @returns {string} Hex string
   */
  bytesToHex(bytes) {
    return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Export singleton instance
export const obdiiParser = new OBDIIParser();
export default OBDIIParser;