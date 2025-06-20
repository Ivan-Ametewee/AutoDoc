// src/services/obdii/DTCCodes.js

/**
 * Comprehensive OBDII Diagnostic Trouble Code (DTC) database
 * Format: DTC codes follow SAE J2012 standard
 * Structure: [Letter][Digit][Digit][Digit][Digit]
 * - First character: System (P=Powertrain, B=Body, C=Chassis, U=Network)
 * - Second character: 0=Generic, 1=Manufacturer specific, 2/3=Reserved
 */

export class DTCCodes {
  constructor() {
    this.codes = this.initializeDTCDatabase();
    this.systemPrefixes = {
      'P': 'Powertrain',
      'B': 'Body',
      'C': 'Chassis',
      'U': 'Network/Communication'
    };
    
    this.severityLevels = {
      CRITICAL: 'critical',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low',
      INFO: 'info'
    };
  }

  /**
   * Initialize comprehensive DTC code database
   */
  initializeDTCDatabase() {
    return {
      // POWERTRAIN CODES (P0xxx - Generic)
      'P0000': {
        description: 'No codes stored in PCM',
        system: 'Powertrain',
        subsystem: 'General',
        severity: this.severityLevels.INFO,
        causes: ['System normal', 'All diagnostics passed'],
        symptoms: ['No symptoms'],
        solutions: ['No action required']
      },
      
      // Fuel and Air Metering
      'P0100': {
        description: 'Mass or Volume Air Flow Circuit Malfunction',
        system: 'Powertrain',
        subsystem: 'Air/Fuel Metering',
        severity: this.severityLevels.MEDIUM,
        causes: ['MAF sensor failure', 'Wiring issues', 'Air leak', 'Dirty MAF sensor'],
        symptoms: ['Poor acceleration', 'Rough idle', 'Black smoke', 'Poor fuel economy'],
        solutions: ['Clean MAF sensor', 'Check wiring', 'Replace MAF sensor', 'Check for air leaks']
      },
      'P0101': {
        description: 'Mass or Volume Air Flow Circuit Range/Performance Problem',
        system: 'Powertrain',
        subsystem: 'Air/Fuel Metering',
        severity: this.severityLevels.MEDIUM,
        causes: ['Dirty MAF sensor', 'Air filter clogged', 'Intake manifold leak'],
        symptoms: ['Poor performance', 'Hesitation', 'Stalling'],
        solutions: ['Clean MAF sensor', 'Replace air filter', 'Check intake system']
      },
      'P0102': {
        description: 'Mass or Volume Air Flow Circuit Low Input',
        system: 'Powertrain',
        subsystem: 'Air/Fuel Metering',
        severity: this.severityLevels.MEDIUM,
        causes: ['MAF sensor failure', 'Wiring short to ground', 'PCM failure'],
        symptoms: ['Engine runs rich', 'Poor fuel economy', 'Black exhaust smoke'],
        solutions: ['Test MAF sensor', 'Check wiring', 'Replace MAF sensor']
      },
      'P0103': {
        description: 'Mass or Volume Air Flow Circuit High Input',
        system: 'Powertrain',
        subsystem: 'Air/Fuel Metering',
        severity: this.severityLevels.MEDIUM,
        causes: ['MAF sensor failure', 'Wiring short to voltage', 'Air leak after MAF'],
        symptoms: ['Engine runs lean', 'Poor performance', 'Hesitation'],
        solutions: ['Check for air leaks', 'Test MAF sensor', 'Inspect wiring']
      },
      
      // Fuel System
      'P0171': {
        description: 'System Too Lean (Bank 1)',
        system: 'Powertrain',
        subsystem: 'Fuel System',
        severity: this.severityLevels.HIGH,
        causes: ['Vacuum leak', 'Fuel pump weak', 'Dirty fuel injectors', 'MAF sensor dirty'],
        symptoms: ['Poor acceleration', 'Engine hesitation', 'Rough idle', 'Engine knock'],
        solutions: ['Check for vacuum leaks', 'Test fuel pressure', 'Clean injectors', 'Clean MAF']
      },
      'P0172': {
        description: 'System Too Rich (Bank 1)',
        system: 'Powertrain',
        subsystem: 'Fuel System',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty O2 sensor', 'Leaking fuel injector', 'High fuel pressure', 'Dirty air filter'],
        symptoms: ['Black exhaust smoke', 'Poor fuel economy', 'Strong fuel smell', 'Carbon buildup'],
        solutions: ['Replace O2 sensor', 'Test fuel injectors', 'Check fuel pressure', 'Replace air filter']
      },
      'P0174': {
        description: 'System Too Lean (Bank 2)',
        system: 'Powertrain',
        subsystem: 'Fuel System',
        severity: this.severityLevels.HIGH,
        causes: ['Vacuum leak', 'Fuel pump weak', 'Dirty fuel injectors', 'MAF sensor dirty'],
        symptoms: ['Poor acceleration', 'Engine hesitation', 'Rough idle', 'Engine knock'],
        solutions: ['Check for vacuum leaks', 'Test fuel pressure', 'Clean injectors', 'Clean MAF']
      },
      'P0175': {
        description: 'System Too Rich (Bank 2)',
        system: 'Powertrain',
        subsystem: 'Fuel System',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty O2 sensor', 'Leaking fuel injector', 'High fuel pressure', 'Dirty air filter'],
        symptoms: ['Black exhaust smoke', 'Poor fuel economy', 'Strong fuel smell', 'Carbon buildup'],
        solutions: ['Replace O2 sensor', 'Test fuel injectors', 'Check fuel pressure', 'Replace air filter']
      },
      
      // Ignition System
      'P0300': {
        description: 'Random/Multiple Cylinder Misfire Detected',
        system: 'Powertrain',
        subsystem: 'Ignition System',
        severity: this.severityLevels.CRITICAL,
        causes: ['Worn spark plugs', 'Faulty ignition coils', 'Fuel system problems', 'Engine mechanical issues'],
        symptoms: ['Engine shaking', 'Loss of power', 'Poor fuel economy', 'Rough idle'],
        solutions: ['Replace spark plugs', 'Test ignition coils', 'Check fuel system', 'Engine compression test']
      },
      'P0301': {
        description: 'Cylinder 1 Misfire Detected',
        system: 'Powertrain',
        subsystem: 'Ignition System',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty spark plug', 'Bad ignition coil', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Engine vibration', 'Loss of power', 'Rough idle'],
        solutions: ['Replace spark plug #1', 'Test ignition coil #1', 'Check fuel injector #1']
      },
      'P0302': {
        description: 'Cylinder 2 Misfire Detected',
        system: 'Powertrain',
        subsystem: 'Ignition System',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty spark plug', 'Bad ignition coil', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Engine vibration', 'Loss of power', 'Rough idle'],
        solutions: ['Replace spark plug #2', 'Test ignition coil #2', 'Check fuel injector #2']
      },
      'P0303': {
        description: 'Cylinder 3 Misfire Detected',
        system: 'Powertrain',
        subsystem: 'Ignition System',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty spark plug', 'Bad ignition coil', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Engine vibration', 'Loss of power', 'Rough idle'],
        solutions: ['Replace spark plug #3', 'Test ignition coil #3', 'Check fuel injector #3']
      },
      'P0304': {
        description: 'Cylinder 4 Misfire Detected',
        system: 'Powertrain',
        subsystem: 'Ignition System',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty spark plug', 'Bad ignition coil', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Engine vibration', 'Loss of power', 'Rough idle'],
        solutions: ['Replace spark plug #4', 'Test ignition coil #4', 'Check fuel injector #4']
      },
      
      // Emissions System
      'P0420': {
        description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
        system: 'Powertrain',
        subsystem: 'Emissions',
        severity: this.severityLevels.MEDIUM,
        causes: ['Catalytic converter failure', 'O2 sensor failure', 'Engine running rich/lean', 'Exhaust leak'],
        symptoms: ['Reduced fuel economy', 'Sulfur smell', 'Failed emissions test'],
        solutions: ['Replace catalytic converter', 'Replace O2 sensors', 'Fix fuel system issues']
      },
      'P0430': {
        description: 'Catalyst System Efficiency Below Threshold (Bank 2)',
        system: 'Powertrain',
        subsystem: 'Emissions',
        severity: this.severityLevels.MEDIUM,
        causes: ['Catalytic converter failure', 'O2 sensor failure', 'Engine running rich/lean', 'Exhaust leak'],
        symptoms: ['Reduced fuel economy', 'Sulfur smell', 'Failed emissions test'],
        solutions: ['Replace catalytic converter', 'Replace O2 sensors', 'Fix fuel system issues']
      },
      
      // O2 Sensor Codes
      'P0130': {
        description: 'O2 Sensor Circuit Malfunction (Bank 1 Sensor 1)',
        system: 'Powertrain',
        subsystem: 'Emissions',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty O2 sensor', 'Wiring problems', 'Exhaust leak', 'Fuel contamination'],
        symptoms: ['Poor fuel economy', 'Failed emissions', 'Engine runs rich/lean'],
        solutions: ['Replace O2 sensor', 'Check wiring', 'Repair exhaust leaks']
      },
      'P0131': {
        description: 'O2 Sensor Circuit Low Voltage (Bank 1 Sensor 1)',
        system: 'Powertrain',
        subsystem: 'Emissions',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty O2 sensor', 'Wiring short to ground', 'Exhaust leak before sensor'],
        symptoms: ['Engine runs lean', 'Poor performance', 'Hesitation'],
        solutions: ['Replace O2 sensor', 'Repair wiring', 'Fix exhaust leaks']
      },
      'P0132': {
        description: 'O2 Sensor Circuit High Voltage (Bank 1 Sensor 1)',
        system: 'Powertrain',
        subsystem: 'Emissions',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty O2 sensor', 'Wiring short to voltage', 'Fuel contamination'],
        symptoms: ['Engine runs rich', 'Black smoke', 'Poor fuel economy'],
        solutions: ['Replace O2 sensor', 'Check wiring', 'Test fuel system']
      },
      
      // Engine Temperature
      'P0217': {
        description: 'Engine Over Temperature Condition',
        system: 'Powertrain',
        subsystem: 'Cooling System',
        severity: this.severityLevels.CRITICAL,
        causes: ['Coolant leak', 'Thermostat failure', 'Water pump failure', 'Radiator blockage'],
        symptoms: ['Engine overheating', 'Steam from engine', 'Temperature warning light'],
        solutions: ['Check coolant level', 'Replace thermostat', 'Test water pump', 'Flush cooling system']
      },
      
      // Transmission Codes
      'P0700': {
        description: 'Transmission Control System Malfunction',
        system: 'Powertrain',
        subsystem: 'Transmission',
        severity: this.severityLevels.HIGH,
        causes: ['TCM failure', 'Wiring issues', 'Transmission internal problems'],
        symptoms: ['Transmission not shifting', 'Harsh shifts', 'No movement'],
        solutions: ['Scan TCM codes', 'Check wiring', 'Transmission service']
      },
      'P0750': {
        description: 'Shift Solenoid A Malfunction',
        system: 'Powertrain',
        subsystem: 'Transmission',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty shift solenoid', 'Wiring problems', 'Low transmission fluid'],
        symptoms: ['Harsh shifts', 'No shifting', 'Stuck in gear'],
        solutions: ['Replace shift solenoid', 'Check fluid level', 'Repair wiring']
      },
      
      // BODY CODES (B0xxx)
      'B0001': {
        description: 'Driver Airbag Circuit Resistance Low',
        system: 'Body',
        subsystem: 'Airbag System',
        severity: this.severityLevels.CRITICAL,
        causes: ['Faulty airbag', 'Wiring short', 'Clock spring failure'],
        symptoms: ['Airbag warning light', 'Airbag may not deploy'],
        solutions: ['Professional airbag service required', 'Check wiring', 'Replace clock spring']
      },
      'B1000': {
        description: 'ECU Defective',
        system: 'Body',
        subsystem: 'Electronic Control',
        severity: this.severityLevels.CRITICAL,
        causes: ['ECU internal failure', 'Power supply issues', 'Software corruption'],
        symptoms: ['Multiple system failures', 'Warning lights', 'No communication'],
        solutions: ['Replace ECU', 'Check power supply', 'Reprogram ECU']
      },
      
      // CHASSIS CODES (C0xxx)
      'C0035': {
        description: 'Left Front Wheel Speed Circuit Malfunction',
        system: 'Chassis',
        subsystem: 'ABS System',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty wheel speed sensor', 'Damaged sensor ring', 'Wiring issues'],
        symptoms: ['ABS warning light', 'ABS not functioning', 'Traction control issues'],
        solutions: ['Replace wheel speed sensor', 'Check sensor ring', 'Repair wiring']
      },
      'C0040': {
        description: 'Right Front Wheel Speed Circuit Malfunction',
        system: 'Chassis',
        subsystem: 'ABS System',
        severity: this.severityLevels.HIGH,
        causes: ['Faulty wheel speed sensor', 'Damaged sensor ring', 'Wiring issues'],
        symptoms: ['ABS warning light', 'ABS not functioning', 'Traction control issues'],
        solutions: ['Replace wheel speed sensor', 'Check sensor ring', 'Repair wiring']
      },
      
      // NETWORK CODES (U0xxx)
      'U0001': {
        description: 'High Speed CAN Communication Bus',
        system: 'Network',
        subsystem: 'Communication',
        severity: this.severityLevels.HIGH,
        causes: ['CAN bus wiring issues', 'ECU communication failure', 'Termination resistor problems'],
        symptoms: ['Multiple warning lights', 'System malfunctions', 'No communication'],
        solutions: ['Check CAN bus wiring', 'Test termination resistors', 'Scan all modules']
      },
      'U0100': {
        description: 'Lost Communication with ECM/PCM',
        system: 'Network',
        subsystem: 'Communication',
        severity: this.severityLevels.CRITICAL,
        causes: ['ECM failure', 'Power supply issues', 'CAN bus problems'],
        symptoms: ['Engine not starting', 'No engine communication', 'Multiple warnings'],
        solutions: ['Check ECM power', 'Test CAN bus', 'Replace ECM if necessary']
      },
      
      // Manufacturer Specific Codes (P1xxx examples)
      'P1000': {
        description: 'OBD System Readiness Test Not Complete',
        system: 'Powertrain',
        subsystem: 'OBD System',
        severity: this.severityLevels.INFO,
        causes: ['Drive cycle not completed', 'Recent battery disconnect', 'Recent code clearing'],
        symptoms: ['Emissions test failure', 'Readiness monitors not set'],
        solutions: ['Complete drive cycle', 'Drive vehicle normally', 'Allow monitors to run']
      }
    };
  }

  /**
   * Get DTC information by code
   */
  getDTCInfo(code) {
    const upperCode = code.toUpperCase();
    
    if (this.codes[upperCode]) {
      return {
        code: upperCode,
        ...this.codes[upperCode],
        systemType: this.getSystemType(upperCode),
        codeType: this.getCodeType(upperCode)
      };
    }
    
    // Return generic info for unknown codes
    return {
      code: upperCode,
      description: 'Unknown diagnostic trouble code',
      system: this.getSystemType(upperCode),
      subsystem: 'Unknown',
      severity: this.severityLevels.MEDIUM,
      causes: ['Code not in database'],
      symptoms: ['Unknown symptoms'],
      solutions: ['Consult service manual', 'Professional diagnosis recommended'],
      systemType: this.getSystemType(upperCode),
      codeType: this.getCodeType(upperCode)
    };
  }

  /**
   * Get system type from code prefix
   */
  getSystemType(code) {
    const prefix = code.charAt(0);
    return this.systemPrefixes[prefix] || 'Unknown';
  }

  /**
   * Get code type (Generic/Manufacturer specific)
   */
  getCodeType(code) {
    if (code.length < 2) return 'Unknown';
    
    const secondChar = code.charAt(1);
    switch (secondChar) {
      case '0':
        return 'Generic (SAE)';
      case '1':
        return 'Manufacturer Specific';
      case '2':
      case '3':
        return 'Reserved';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get all codes for a specific system
   */
  getCodesBySystem(system) {
    const systemCodes = {};
    
    Object.keys(this.codes).forEach(code => {
      if (this.codes[code].system === system) {
        systemCodes[code] = this.codes[code];
      }
    });
    
    return systemCodes;
  }

  /**
   * Get codes by severity level
   */
  getCodesBySeverity(severity) {
    const severityCodes = {};
    
    Object.keys(this.codes).forEach(code => {
      if (this.codes[code].severity === severity) {
        severityCodes[code] = this.codes[code];
      }
    });
    
    return severityCodes;
  }

  /**
   * Search codes by description or symptoms
   */
  searchCodes(searchTerm) {
    const results = [];
    const searchLower = searchTerm.toLowerCase();
    
    Object.keys(this.codes).forEach(code => {
      const dtc = this.codes[code];
      const searchableText = [
        code,
        dtc.description,
        dtc.subsystem,
        ...dtc.causes,
        ...dtc.symptoms,
        ...dtc.solutions
      ].join(' ').toLowerCase();
      
      if (searchableText.includes(searchLower)) {
        results.push({
          code,
          ...dtc,
          systemType: this.getSystemType(code),
          codeType: this.getCodeType(code)
        });
      }
    });
    
    return results;
  }

  /**
   * Get random DTC for testing
   */
  getRandomDTC() {
    const codes = Object.keys(this.codes);
    const randomCode = codes[Math.floor(Math.random() * codes.length)];
    return this.getDTCInfo(randomCode);
  }

  /**
   * Get DTCs for specific scenarios (for simulation)
   */
  getDTCsForScenario(scenario) {
    const scenarioDTCs = {
      'overheating': ['P0217', 'P0128'],
      'engine_trouble': ['P0300', 'P0301', 'P0171'],
      'low_fuel': ['P0171', 'P0174'],
      'cold_start': ['P1000'],
      'emissions': ['P0420', 'P0430', 'P0130'],
      'transmission': ['P0700', 'P0750'],
      'abs_issues': ['C0035', 'C0040'],
      'communication': ['U0100', 'U0001']
    };
    
    const codes = scenarioDTCs[scenario] || [];
    return codes.map(code => this.getDTCInfo(code));
  }

  /**
   * Get all available codes
   */
  getAllCodes() {
    return Object.keys(this.codes).map(code => this.getDTCInfo(code));
  }

  /**
   * Get system statistics
   */
  getSystemStatistics() {
    const stats = {};
    
    Object.values(this.systemPrefixes).forEach(system => {
      stats[system] = {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      };
    });
    
    Object.keys(this.codes).forEach(code => {
      const dtc = this.codes[code];
      const system = dtc.system;
      
      if (stats[system]) {
        stats[system].total++;
        stats[system][dtc.severity]++;
      }
    });
    
    return stats;
  }
}

// Export singleton instance
export const dtcCodes = new DTCCodes();
export default DTCCodes;