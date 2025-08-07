// Comprehensive Powertrain OBD-II Diagnostic Trouble Code Database
// Merged from comprehensive DTC database and temp files
// Contains all P-codes (Powertrain) with proper subsystem categorization

export class PowertrainDTCCodes {
  private severityLevels: any;
  private codes: any;

  constructor() {
    this.severityLevels = {
      CRITICAL: 'critical',
      HIGH: 'high', 
      MEDIUM: 'medium',
      LOW: 'low',
      INFO: 'info'
    };

    this.codes = this.initializePowertrainDTCDatabase();
  }

  initializePowertrainDTCDatabase() {
    return {
      // ==================== POWERTRAIN CODES (P0xxx - Generic SAE) ====================
      
      // P0000-P0099: System and VVT/Timing Codes
      'P0000': {
        description: 'No codes stored in PCM',
        system: 'Powertrain', subsystem: 'General', severity: this.severityLevels.INFO,
        causes: ['System normal'], symptoms: ['No symptoms'], solutions: ['No action required']
      },
      'P0010': {
        description: '"A" Camshaft Position Actuator Circuit (Bank 1)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Faulty VVT solenoid', 'Wiring issues', 'Low oil pressure', 'PCM failure'],
        symptoms: ['Poor performance', 'Rough idle', 'Check engine light'],
        solutions: ['Replace VVT solenoid', 'Check wiring', 'Check oil level/pressure', 'Test PCM']
      },
      'P0011': {
        description: '"A" Camshaft Position - Timing Over-Advanced or System Performance (Bank 1)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['VVT solenoid stuck', 'Timing chain stretched', 'Low oil pressure', 'Camshaft timing off'],
        symptoms: ['Poor performance', 'Engine knock', 'Reduced fuel economy'],
        solutions: ['Replace VVT solenoid', 'Check timing chain', 'Check oil pressure', 'Verify timing']
      },
      'P0012': {
        description: '"A" Camshaft Position - Timing Over-Retarded (Bank 1)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['VVT solenoid failure', 'Timing chain issues', 'Low oil pressure', 'Sludge buildup'],
        symptoms: ['Poor acceleration', 'Rough idle', 'Engine hesitation'],
        solutions: ['Replace VVT solenoid', 'Clean oil passages', 'Check timing', 'Change oil']
      },
      'P0013': {
        description: '"B" Camshaft Position Actuator Circuit (Bank 1)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Exhaust VVT solenoid failure', 'Wiring issues', 'PCM failure'],
        symptoms: ['Poor performance', 'Rough idle', 'Emissions issues'],
        solutions: ['Replace exhaust VVT solenoid', 'Check wiring', 'Test PCM']
      },
      'P0014': {
        description: '"B" Camshaft Position - Timing Over-Advanced or System Performance (Bank 1)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Exhaust VVT solenoid stuck', 'Timing issues', 'Oil pressure problems'],
        symptoms: ['Poor performance', 'Engine knock', 'Emissions failure'],
        solutions: ['Replace VVT solenoid', 'Check timing', 'Verify oil pressure']
      },
      'P0015': {
        description: '"B" Camshaft Position - Timing Over-Retarded (Bank 1)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['VVT solenoid failure', 'Oil flow restriction', 'Timing chain stretch'],
        symptoms: ['Poor acceleration', 'Rough idle', 'Reduced power'],
        solutions: ['Replace VVT solenoid', 'Clean oil system', 'Check timing chain']
      },
      'P0016': {
        description: 'Crankshaft Position - Camshaft Position Correlation (Bank 1 Sensor A)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.CRITICAL,
        causes: ['Timing chain jumped', 'VVT solenoid failure', 'Sensor failure', 'Timing belt broken'],
        symptoms: ['No start', 'Rough running', 'Engine rattle', 'Poor performance'],
        solutions: ['Check timing chain/belt', 'Replace sensors', 'Check VVT system', 'Professional diagnosis']
      },
      'P0017': {
        description: 'Crankshaft Position - Camshaft Position Correlation (Bank 1 Sensor B)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.CRITICAL,
        causes: ['Timing correlation error', 'VVT malfunction', 'Sensor problems'],
        symptoms: ['Poor performance', 'Rough idle', 'Engine noise'],
        solutions: ['Check timing correlation', 'Test VVT system', 'Replace sensors']
      },
      'P0018': {
        description: 'Crankshaft Position - Camshaft Position Correlation (Bank 2 Sensor A)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.CRITICAL,
        causes: ['Timing chain issues', 'VVT problems', 'Sensor failure'],
        symptoms: ['Poor performance', 'Engine noise', 'Rough running'],
        solutions: ['Check timing system', 'Test VVT', 'Replace sensors']
      },
      'P0019': {
        description: 'Crankshaft Position - Camshaft Position Correlation (Bank 2 Sensor B)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.CRITICAL,
        causes: ['Timing correlation error', 'VVT malfunction', 'Sensor issues'],
        symptoms: ['Engine performance issues', 'Rough operation'],
        solutions: ['Professional timing diagnosis', 'VVT system service', 'Sensor replacement']
      },
      'P0020': {
        description: '"A" Camshaft Position Actuator Circuit (Bank 2)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Bank 2 VVT solenoid failure', 'Wiring problems', 'PCM issues'],
        symptoms: ['Poor performance', 'Rough idle', 'Reduced power'],
        solutions: ['Replace VVT solenoid', 'Check wiring', 'Test PCM']
      },
      'P0021': {
        description: '"A" Camshaft Position - Timing Over-Advanced or System Performance (Bank 2)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['VVT solenoid stuck open', 'Oil pressure issues', 'Timing problems'],
        symptoms: ['Poor performance', 'Engine knock', 'Fuel economy loss'],
        solutions: ['Replace VVT solenoid', 'Check oil pressure', 'Verify timing']
      },
      'P0022': {
        description: '"A" Camshaft Position - Timing Over-Retarded (Bank 2)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['VVT solenoid stuck closed', 'Oil flow restriction', 'Timing chain issues'],
        symptoms: ['Poor acceleration', 'Rough idle', 'Performance loss'],
        solutions: ['Replace VVT solenoid', 'Clean oil passages', 'Check timing']
      },
      'P0023': {
        description: '"B" Camshaft Position Actuator Circuit (Bank 2)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Exhaust VVT solenoid failure', 'Electrical issues', 'PCM problems'],
        symptoms: ['Poor performance', 'Emissions issues', 'Rough operation'],
        solutions: ['Replace VVT solenoid', 'Check electrical connections', 'Test PCM']
      },
      'P0024': {
        description: '"B" Camshaft Position - Timing Over-Advanced or System Performance (Bank 2)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['VVT timing too advanced', 'Oil pressure problems', 'Solenoid issues'],
        symptoms: ['Engine knock', 'Poor performance', 'Emissions failure'],
        solutions: ['Adjust VVT timing', 'Check oil pressure', 'Replace solenoid']
      },
      'P0025': {
        description: '"B" Camshaft Position - Timing Over-Retarded (Bank 2)',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['VVT timing retarded', 'Oil flow issues', 'Solenoid malfunction'],
        symptoms: ['Power loss', 'Poor acceleration', 'Rough idle'],
        solutions: ['Correct VVT timing', 'Clean oil system', 'Replace solenoid']
      },
      
      // P0100-P0199: Air/Fuel Metering and Cooling System
      'P0100': {
        description: 'Mass or Volume Air Flow Circuit Malfunction',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['MAF sensor failure', 'Wiring issues', 'Air leak', 'Dirty MAF sensor'],
        symptoms: ['Poor acceleration', 'Rough idle', 'Black smoke', 'Poor fuel economy'],
        solutions: ['Clean MAF sensor', 'Check wiring', 'Replace MAF sensor', 'Check for air leaks']
      },
      'P0101': {
        description: 'Mass or Volume Air Flow Circuit Range/Performance Problem',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['Dirty MAF sensor', 'Air filter clogged', 'Intake manifold leak', 'MAF sensor drift'],
        symptoms: ['Poor performance', 'Hesitation', 'Stalling', 'Rough idle'],
        solutions: ['Clean MAF sensor', 'Replace air filter', 'Check intake system', 'Replace MAF if needed']
      },
      'P0102': {
        description: 'Mass or Volume Air Flow Circuit Low Input',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['MAF sensor failure', 'Wiring short to ground', 'PCM failure', 'Sensor contamination'],
        symptoms: ['Engine runs rich', 'Poor fuel economy', 'Black exhaust smoke', 'Rough idle'],
        solutions: ['Test MAF sensor', 'Check wiring', 'Replace MAF sensor', 'Check PCM']
      },
      'P0103': {
        description: 'Mass or Volume Air Flow Circuit High Input',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['MAF sensor failure', 'Wiring short to voltage', 'Air leak after MAF', 'Sensor malfunction'],
        symptoms: ['Engine runs lean', 'Poor performance', 'Hesitation', 'Surging'],
        solutions: ['Check for air leaks', 'Test MAF sensor', 'Inspect wiring', 'Replace MAF sensor']
      },
      'P0104': {
        description: 'Mass or Volume Air Flow Circuit Intermittent',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['Loose MAF connector', 'Intermittent wiring fault', 'MAF sensor failing', 'Vibration damage'],
        symptoms: ['Intermittent rough idle', 'Occasional stalling', 'Performance varies'],
        solutions: ['Check MAF connector', 'Inspect wiring', 'Replace MAF sensor', 'Secure connections']
      },
      'P0105': {
        description: 'Manifold Absolute Pressure/Barometric Pressure Circuit Malfunction',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['MAP sensor failure', 'Vacuum leak', 'Wiring issues', 'PCM failure'],
        symptoms: ['Poor performance', 'Rough idle', 'Stalling', 'Hard starting'],
        solutions: ['Test MAP sensor', 'Check vacuum lines', 'Inspect wiring', 'Replace MAP sensor']
      },
      'P0106': {
        description: 'Manifold Absolute Pressure/Barometric Pressure Circuit Range/Performance Problem',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['MAP sensor out of range', 'Vacuum leak', 'Restricted intake', 'Sensor drift'],
        symptoms: ['Poor acceleration', 'Rough idle', 'Hesitation', 'Fuel economy loss'],
        solutions: ['Check MAP sensor', 'Inspect vacuum system', 'Clean intake', 'Replace sensor']
      },
      'P0107': {
        description: 'Manifold Absolute Pressure/Barometric Pressure Circuit Low Input',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['MAP sensor failure', 'Wiring short to ground', 'Vacuum leak', 'PCM issue'],
        symptoms: ['Rich mixture', 'Black smoke', 'Poor fuel economy', 'Rough running'],
        solutions: ['Test MAP sensor', 'Check wiring', 'Find vacuum leaks', 'Replace sensor']
      },
      'P0108': {
        description: 'Manifold Absolute Pressure/Barometric Pressure Circuit High Input',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['MAP sensor failure', 'Restricted vacuum line', 'Wiring short to voltage', 'Blocked intake'],
        symptoms: ['Lean mixture', 'Poor performance', 'Hesitation', 'Surging'],
        solutions: ['Test MAP sensor', 'Check vacuum lines', 'Inspect wiring', 'Clear intake blockage']
      },
      'P0109': {
        description: 'Manifold Absolute Pressure/Barometric Pressure Circuit Intermittent',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['Loose MAP connector', 'Intermittent wiring', 'MAP sensor failing', 'Vacuum line issue'],
        symptoms: ['Intermittent performance issues', 'Occasional rough idle', 'Variable fuel mixture'],
        solutions: ['Secure MAP connector', 'Check wiring', 'Replace MAP sensor', 'Inspect vacuum lines']
      },
      'P0110': {
        description: 'Intake Air Temperature Circuit Malfunction',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.LOW,
        causes: ['IAT sensor failure', 'Wiring problems', 'Connector corrosion', 'PCM issue'],
        symptoms: ['Poor cold start', 'Rough idle when cold', 'Fuel economy loss'],
        solutions: ['Test IAT sensor', 'Check wiring', 'Clean connector', 'Replace sensor']
      },
      'P0111': {
        description: 'Intake Air Temperature Circuit Range/Performance Problem',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.LOW,
        causes: ['IAT sensor out of range', 'Sensor location issue', 'Heat soak', 'Sensor drift'],
        symptoms: ['Poor performance', 'Fuel mixture issues', 'Cold start problems'],
        solutions: ['Check sensor location', 'Test IAT sensor', 'Relocate if needed', 'Replace sensor']
      },
      'P0112': {
        description: 'Intake Air Temperature Circuit Low Input',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.LOW,
        causes: ['IAT sensor short to ground', 'Wiring issue', 'Sensor failure', 'Connector problem'],
        symptoms: ['Rich fuel mixture', 'Poor fuel economy', 'Black smoke'],
        solutions: ['Test IAT sensor', 'Check wiring', 'Inspect connector', 'Replace sensor']
      },
      'P0113': {
        description: 'Intake Air Temperature Circuit High Input',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.LOW,
        causes: ['IAT sensor open circuit', 'Wiring break', 'Connector damage', 'Sensor failure'],
        symptoms: ['Lean fuel mixture', 'Hard cold start', 'Performance issues'],
        solutions: ['Check IAT sensor', 'Repair wiring', 'Fix connector', 'Replace sensor']
      },
      'P0114': {
        description: 'Intake Air Temperature Circuit Intermittent',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.LOW,
        causes: ['Loose IAT connector', 'Intermittent wiring', 'Sensor failing', 'Vibration damage'],
        symptoms: ['Intermittent fuel mixture issues', 'Variable performance'],
        solutions: ['Secure connector', 'Check wiring', 'Replace IAT sensor', 'Eliminate vibration']
      },
      'P0115': {
        description: 'Engine Coolant Temperature Circuit Malfunction',
        system: 'Powertrain', subsystem: 'Cooling System', severity: this.severityLevels.MEDIUM,
        causes: ['ECT sensor failure', 'Wiring problems', 'Connector issues', 'PCM failure'],
        symptoms: ['Poor fuel economy', 'Hard starting', 'Rough idle', 'Overheating'],
        solutions: ['Test ECT sensor', 'Check wiring', 'Inspect connector', 'Replace sensor']
      },
      'P0116': {
        description: 'Engine Coolant Temperature Circuit Range/Performance Problem',
        system: 'Powertrain', subsystem: 'Cooling System', severity: this.severityLevels.MEDIUM,
        causes: ['ECT sensor out of range', 'Thermostat stuck', 'Cooling system issues', 'Sensor drift'],
        symptoms: ['Poor fuel economy', 'Hard cold start', 'Overheating'],
        solutions: ['Test ECT sensor', 'Check thermostat', 'Service cooling system', 'Replace sensor']
      },
      'P0117': {
        description: 'Engine Coolant Temperature Circuit Low Input',
        system: 'Powertrain', subsystem: 'Cooling System', severity: this.severityLevels.MEDIUM,
        causes: ['ECT sensor short to ground', 'Wiring fault', 'Sensor failure', 'PCM issue'],
        symptoms: ['Rich fuel mixture', 'Poor fuel economy', 'Hard starting'],
        solutions: ['Test ECT sensor', 'Check wiring', 'Replace sensor', 'Check PCM']
      },
      'P0118': {
        description: 'Engine Coolant Temperature Circuit High Input',
        system: 'Powertrain', subsystem: 'Cooling System', severity: this.severityLevels.MEDIUM,
        causes: ['ECT sensor open circuit', 'Wiring break', 'Connector damage', 'Sensor failure'],
        symptoms: ['Lean fuel mixture', 'Hard cold start', 'Fan runs constantly'],
        solutions: ['Check ECT sensor', 'Repair wiring', 'Fix connector', 'Replace sensor']
      },
      'P0119': {
        description: 'Engine Coolant Temperature Circuit Intermittent',
        system: 'Powertrain', subsystem: 'Cooling System', severity: this.severityLevels.MEDIUM,
        causes: ['Loose ECT connector', 'Intermittent wiring', 'Sensor failing', 'Corrosion'],
        symptoms: ['Intermittent overheating', 'Variable fuel mixture', 'Performance issues'],
        solutions: ['Secure connector', 'Check wiring', 'Replace ECT sensor', 'Clean connections']
      },
      'P0120': {
        description: 'Throttle/Pedal Position Sensor/Switch "A" Circuit Malfunction',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.HIGH,
        causes: ['TPS failure', 'Wiring problems', 'Connector issues', 'PCM failure'],
        symptoms: ['Poor acceleration', 'Rough idle', 'Stalling', 'Limp mode'],
        solutions: ['Test TPS', 'Check wiring', 'Inspect connector', 'Replace TPS']
      },
      'P0121': {
        description: 'Throttle/Pedal Position Sensor/Switch "A" Circuit Range/Performance Problem',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.HIGH,
        causes: ['TPS out of range', 'Throttle body dirty', 'Sensor drift', 'Mechanical binding'],
        symptoms: ['Poor performance', 'Hesitation', 'Surging', 'Idle issues'],
        solutions: ['Clean throttle body', 'Test TPS', 'Check for binding', 'Replace TPS']
      },
      'P0122': {
        description: 'Throttle/Pedal Position Sensor/Switch "A" Circuit Low Input',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.HIGH,
        causes: ['TPS short to ground', 'Wiring fault', 'Bad connector', 'Failed TPS'],
        symptoms: ['Poor acceleration', 'Limp mode', 'Engine stalling', 'Rough idle'],
        solutions: ['Test TPS voltage', 'Check wiring', 'Inspect connector', 'Replace TPS']
      },
      'P0123': {
        description: 'Throttle/Pedal Position Sensor/Switch "A" Circuit High Input',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.HIGH,
        causes: ['TPS short to voltage', 'Open circuit', 'Bad connector', 'Failed TPS'],
        symptoms: ['Poor acceleration', 'High idle', 'Engine surging', 'Performance loss'],
        solutions: ['Test TPS voltage', 'Check wiring', 'Inspect connector', 'Replace TPS']
      },
      'P0124': {
        description: 'Throttle/Pedal Position Sensor/Switch "A" Circuit Intermittent',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['Loose TPS connector', 'Intermittent wiring', 'Failing TPS', 'Corrosion'],
        symptoms: ['Intermittent performance issues', 'Occasional stalling', 'Variable idle'],
        solutions: ['Secure connector', 'Check wiring', 'Clean connections', 'Replace TPS']
      },
      'P0125': {
        description: 'Insufficient Coolant Temperature for Closed Loop Fuel Control',
        system: 'Powertrain', subsystem: 'Cooling System', severity: this.severityLevels.MEDIUM,
        causes: ['Thermostat stuck open', 'Low coolant', 'Bad ECT sensor', 'Cooling fan issues'],
        symptoms: ['Poor fuel economy', 'Rough idle when cold', 'Long warm-up time'],
        solutions: ['Replace thermostat', 'Check coolant level', 'Test ECT sensor', 'Check cooling fan']
      },
      'P0126': {
        description: 'Insufficient Coolant Temperature for Stable Operation',
        system: 'Powertrain', subsystem: 'Cooling System', severity: this.severityLevels.MEDIUM,
        causes: ['Thermostat malfunction', 'ECT sensor fault', 'Cooling system issues'],
        symptoms: ['Poor performance when cold', 'Extended warm-up', 'Fuel economy issues'],
        solutions: ['Replace thermostat', 'Test ECT sensor', 'Check cooling system', 'Verify coolant flow']
      },
      'P0127': {
        description: 'Intake Air Temperature Too High',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.MEDIUM,
        causes: ['IAT sensor fault', 'High ambient temperature', 'Heat soak', 'Restricted airflow'],
        symptoms: ['Reduced power', 'Poor performance', 'Engine knock', 'Overheating'],
        solutions: ['Test IAT sensor', 'Check air intake', 'Improve airflow', 'Relocate sensor']
      },
      'P0128': {
        description: 'Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)',
        system: 'Powertrain', subsystem: 'Cooling System', severity: this.severityLevels.MEDIUM,
        causes: ['Thermostat stuck open', 'Wrong thermostat', 'Cooling fan issues', 'ECT sensor fault'],
        symptoms: ['Poor fuel economy', 'Long warm-up time', 'Heater not hot', 'Rough idle'],
        solutions: ['Replace thermostat', 'Check cooling fan operation', 'Test ECT sensor', 'Verify coolant level']
      },
      'P0129': {
        description: 'Barometric Pressure Too Low',
        system: 'Powertrain', subsystem: 'Air/Fuel Metering', severity: this.severityLevels.LOW,
        causes: ['MAP sensor fault', 'Altitude compensation', 'Vacuum leak', 'Sensor calibration'],
        symptoms: ['Poor performance at altitude', 'Fuel mixture issues', 'Power loss'],
        solutions: ['Test MAP sensor', 'Check for vacuum leaks', 'Calibrate sensor', 'Verify altitude compensation']
      },
      'P0130': {
        description: 'O2 Sensor Circuit Malfunction (Bank 1 Sensor 1)',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['Failed O2 sensor', 'Wiring issues', 'Exhaust leak', 'Contaminated sensor'],
        symptoms: ['Poor fuel economy', 'Failed emissions test', 'Rough idle', 'Performance loss'],
        solutions: ['Replace O2 sensor', 'Check wiring', 'Fix exhaust leaks', 'Clean sensor']
      },

      // P0170-P0175: Fuel System Codes
      'P0170': {
        description: 'Fuel Trim Malfunction (Bank 1)',
        system: 'Powertrain', subsystem: 'Fuel System', severity: this.severityLevels.MEDIUM,
        causes: ['Vacuum leak', 'Fuel pressure issues', 'MAF sensor fault', 'Fuel injector problems'],
        symptoms: ['Poor fuel economy', 'Rough idle', 'Performance loss', 'Emissions failure'],
        solutions: ['Check for vacuum leaks', 'Test fuel pressure', 'Clean MAF sensor', 'Service fuel injectors']
      },
      'P0171': {
        description: 'System Too Lean (Bank 1)',
        system: 'Powertrain', subsystem: 'Fuel System', severity: this.severityLevels.MEDIUM,
        causes: ['Vacuum leak', 'Low fuel pressure', 'Dirty MAF sensor', 'Exhaust leak'],
        symptoms: ['Poor acceleration', 'Rough idle', 'Engine hesitation', 'Backfiring'],
        solutions: ['Find vacuum leaks', 'Check fuel pressure', 'Clean MAF sensor', 'Fix exhaust leaks']
      },
      'P0172': {
        description: 'System Too Rich (Bank 1)',
        system: 'Powertrain', subsystem: 'Fuel System', severity: this.severityLevels.MEDIUM,
        causes: ['Dirty air filter', 'Leaking fuel injector', 'High fuel pressure', 'Faulty MAF sensor'],
        symptoms: ['Poor fuel economy', 'Black exhaust smoke', 'Rough idle', 'Fouled spark plugs'],
        solutions: ['Replace air filter', 'Test fuel injectors', 'Check fuel pressure', 'Clean MAF sensor']
      },
      'P0173': {
        description: 'Fuel Trim Malfunction (Bank 2)',
        system: 'Powertrain', subsystem: 'Fuel System', severity: this.severityLevels.MEDIUM,
        causes: ['Vacuum leak', 'Fuel pressure issues', 'MAF sensor fault', 'Fuel injector problems'],
        symptoms: ['Poor fuel economy', 'Rough idle', 'Performance loss', 'Emissions failure'],
        solutions: ['Check for vacuum leaks', 'Test fuel pressure', 'Clean MAF sensor', 'Service fuel injectors']
      },
      'P0174': {
        description: 'System Too Lean (Bank 2)',
        system: 'Powertrain', subsystem: 'Fuel System', severity: this.severityLevels.MEDIUM,
        causes: ['Vacuum leak', 'Low fuel pressure', 'Dirty MAF sensor', 'Exhaust leak'],
        symptoms: ['Poor acceleration', 'Rough idle', 'Engine hesitation', 'Backfiring'],
        solutions: ['Find vacuum leaks', 'Check fuel pressure', 'Clean MAF sensor', 'Fix exhaust leaks']
      },
      'P0175': {
        description: 'System Too Rich (Bank 2)',
        system: 'Powertrain', subsystem: 'Fuel System', severity: this.severityLevels.MEDIUM,
        causes: ['Dirty air filter', 'Leaking fuel injector', 'High fuel pressure', 'Faulty MAF sensor'],
        symptoms: ['Poor fuel economy', 'Black exhaust smoke', 'Rough idle', 'Fouled spark plugs'],
        solutions: ['Replace air filter', 'Test fuel injectors', 'Check fuel pressure', 'Clean MAF sensor']
      },

      // P0300-P0308: Ignition System/Misfire Codes
      'P0300': {
        description: 'Random/Multiple Cylinder Misfire Detected',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Spark plugs', 'Ignition coils', 'Fuel injectors', 'Compression issues'],
        symptoms: ['Rough idle', 'Engine vibration', 'Power loss', 'Check engine light'],
        solutions: ['Replace spark plugs', 'Test ignition coils', 'Check fuel injectors', 'Compression test']
      },
      'P0301': {
        description: 'Cylinder 1 Misfire Detected',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Spark plug failure', 'Ignition coil fault', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Rough idle', 'Engine shaking', 'Power loss', 'Poor acceleration'],
        solutions: ['Replace cylinder 1 spark plug', 'Test ignition coil', 'Check fuel injector', 'Compression test']
      },
      'P0302': {
        description: 'Cylinder 2 Misfire Detected',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Spark plug failure', 'Ignition coil fault', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Rough idle', 'Engine shaking', 'Power loss', 'Poor acceleration'],
        solutions: ['Replace cylinder 2 spark plug', 'Test ignition coil', 'Check fuel injector', 'Compression test']
      },
      'P0303': {
        description: 'Cylinder 3 Misfire Detected',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Spark plug failure', 'Ignition coil fault', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Rough idle', 'Engine shaking', 'Power loss', 'Poor acceleration'],
        solutions: ['Replace cylinder 3 spark plug', 'Test ignition coil', 'Check fuel injector', 'Compression test']
      },
      'P0304': {
        description: 'Cylinder 4 Misfire Detected',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Spark plug failure', 'Ignition coil fault', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Rough idle', 'Engine shaking', 'Power loss', 'Poor acceleration'],
        solutions: ['Replace cylinder 4 spark plug', 'Test ignition coil', 'Check fuel injector', 'Compression test']
      },
      'P0305': {
        description: 'Cylinder 5 Misfire Detected',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Spark plug failure', 'Ignition coil fault', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Rough idle', 'Engine shaking', 'Power loss', 'Poor acceleration'],
        solutions: ['Replace cylinder 5 spark plug', 'Test ignition coil', 'Check fuel injector', 'Compression test']
      },
      'P0306': {
        description: 'Cylinder 6 Misfire Detected',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Spark plug failure', 'Ignition coil fault', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Rough idle', 'Engine shaking', 'Power loss', 'Poor acceleration'],
        solutions: ['Replace cylinder 6 spark plug', 'Test ignition coil', 'Check fuel injector', 'Compression test']
      },
      'P0307': {
        description: 'Cylinder 7 Misfire Detected',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Spark plug failure', 'Ignition coil fault', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Rough idle', 'Engine shaking', 'Power loss', 'Poor acceleration'],
        solutions: ['Replace cylinder 7 spark plug', 'Test ignition coil', 'Check fuel injector', 'Compression test']
      },
      'P0308': {
        description: 'Cylinder 8 Misfire Detected',
        system: 'Powertrain', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Spark plug failure', 'Ignition coil fault', 'Fuel injector problem', 'Low compression'],
        symptoms: ['Rough idle', 'Engine shaking', 'Power loss', 'Poor acceleration'],
        solutions: ['Replace cylinder 8 spark plug', 'Test ignition coil', 'Check fuel injector', 'Compression test']
      },

      // P0400-P0445: Emissions System Codes
      'P0400': {
        description: 'Exhaust Gas Recirculation Flow Malfunction',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['EGR valve stuck', 'Carbon buildup', 'Vacuum line issues', 'EGR sensor fault'],
        symptoms: ['Rough idle', 'Engine knock', 'Poor acceleration', 'Emissions failure'],
        solutions: ['Clean EGR valve', 'Check vacuum lines', 'Test EGR sensor', 'Clean carbon deposits']
      },
      'P0401': {
        description: 'Exhaust Gas Recirculation Flow Insufficient Detected',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['EGR valve stuck closed', 'Blocked EGR passages', 'Vacuum leak', 'Carbon buildup'],
        symptoms: ['Engine knock', 'NOx emissions high', 'Poor performance', 'Overheating'],
        solutions: ['Clean EGR valve', 'Clear EGR passages', 'Fix vacuum leaks', 'Remove carbon deposits']
      },
      'P0402': {
        description: 'Exhaust Gas Recirculation Flow Excessive Detected',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['EGR valve stuck open', 'Faulty EGR sensor', 'Vacuum line issues', 'Control valve problems'],
        symptoms: ['Rough idle', 'Stalling', 'Poor performance', 'Black smoke'],
        solutions: ['Replace EGR valve', 'Test EGR sensor', 'Check vacuum lines', 'Clean control valve']
      },
      'P0403': {
        description: 'Exhaust Gas Recirculation Circuit Malfunction',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['EGR solenoid failure', 'Wiring issues', 'PCM fault', 'Circuit problems'],
        symptoms: ['EGR system inoperative', 'Emissions failure', 'Performance issues'],
        solutions: ['Test EGR solenoid', 'Check wiring', 'Test PCM', 'Repair circuits']
      },
      'P0404': {
        description: 'Exhaust Gas Recirculation Circuit Range/Performance',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['EGR position sensor fault', 'Carbon buildup', 'Mechanical binding', 'Circuit issues'],
        symptoms: ['Poor EGR performance', 'Emissions failure', 'Engine performance issues'],
        solutions: ['Clean EGR valve', 'Test position sensor', 'Check for binding', 'Repair circuits']
      },
      'P0405': {
        description: 'Exhaust Gas Recirculation Sensor A Circuit Low',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['EGR sensor short to ground', 'Wiring fault', 'Bad connector', 'Sensor failure'],
        symptoms: ['EGR system malfunction', 'Performance issues', 'Emissions failure'],
        solutions: ['Test EGR sensor', 'Check wiring', 'Inspect connector', 'Replace sensor']
      },
      'P0406': {
        description: 'Exhaust Gas Recirculation Sensor A Circuit High',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['EGR sensor short to voltage', 'Open circuit', 'Bad connector', 'Sensor failure'],
        symptoms: ['EGR system malfunction', 'Performance issues', 'Emissions failure'],
        solutions: ['Test EGR sensor', 'Check wiring', 'Inspect connector', 'Replace sensor']
      },
      'P0420': {
        description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.HIGH,
        causes: ['Catalytic converter failure', 'O2 sensor issues', 'Engine problems', 'Fuel contamination'],
        symptoms: ['Failed emissions test', 'Sulfur smell', 'Poor fuel economy', 'Performance loss'],
        solutions: ['Replace catalytic converter', 'Test O2 sensors', 'Engine tune-up', 'Use quality fuel']
      },
      'P0421': {
        description: 'Warm Up Catalyst Efficiency Below Threshold (Bank 1)',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.HIGH,
        causes: ['Pre-cat failure', 'O2 sensor problems', 'Engine running rich', 'Contaminated catalyst'],
        symptoms: ['Emissions test failure', 'Poor cold performance', 'Sulfur odor'],
        solutions: ['Replace pre-catalyst', 'Test O2 sensors', 'Fix rich condition', 'Engine diagnosis']
      },
      'P0430': {
        description: 'Catalyst System Efficiency Below Threshold (Bank 2)',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.HIGH,
        causes: ['Bank 2 catalytic converter failure', 'O2 sensor issues', 'Engine problems', 'Fuel contamination'],
        symptoms: ['Failed emissions test', 'Sulfur smell', 'Poor fuel economy', 'Performance loss'],
        solutions: ['Replace Bank 2 catalytic converter', 'Test O2 sensors', 'Engine tune-up', 'Use quality fuel']
      },
      'P0431': {
        description: 'Warm Up Catalyst Efficiency Below Threshold (Bank 2)',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.HIGH,
        causes: ['Bank 2 pre-cat failure', 'O2 sensor problems', 'Engine running rich', 'Contaminated catalyst'],
        symptoms: ['Emissions test failure', 'Poor cold performance', 'Sulfur odor'],
        solutions: ['Replace Bank 2 pre-catalyst', 'Test O2 sensors', 'Fix rich condition', 'Engine diagnosis']
      },
      'P0440': {
        description: 'Evaporative Emission Control System Malfunction',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['EVAP leak', 'Faulty purge valve', 'Bad gas cap', 'Charcoal canister issues'],
        symptoms: ['Fuel odor', 'Check engine light', 'Failed emissions test'],
        solutions: ['Check gas cap', 'Test for EVAP leaks', 'Replace purge valve', 'Service charcoal canister']
      },
      'P0441': {
        description: 'Evaporative Emission Control System Incorrect Purge Flow',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['Purge valve stuck', 'Vacuum line issues', 'Charcoal canister saturated', 'Flow sensor fault'],
        symptoms: ['Poor performance', 'Fuel odor', 'Stalling', 'Rough idle'],
        solutions: ['Replace purge valve', 'Check vacuum lines', 'Replace charcoal canister', 'Test flow sensor']
      },
      'P0442': {
        description: 'Evaporative Emission Control System Leak Detected (Small Leak)',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.LOW,
        causes: ['Loose gas cap', 'Small EVAP leak', 'Faulty purge valve', 'Cracked vacuum lines'],
        symptoms: ['Fuel odor', 'Check engine light', 'Failed emissions test'],
        solutions: ['Tighten gas cap', 'Smoke test EVAP system', 'Replace purge valve', 'Repair vacuum lines']
      },
      'P0443': {
        description: 'Evaporative Emission Control System Purge Control Valve Circuit Malfunction',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['Purge valve solenoid failure', 'Wiring issues', 'PCM fault', 'Circuit problems'],
        symptoms: ['EVAP system inoperative', 'Poor performance', 'Emissions failure'],
        solutions: ['Replace purge solenoid', 'Check wiring', 'Test PCM', 'Repair circuits']
      },
      'P0444': {
        description: 'Evaporative Emission Control System Purge Control Valve Circuit Open',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['Open circuit to purge valve', 'Wiring break', 'Bad connector', 'Solenoid failure'],
        symptoms: ['EVAP system not working', 'Emissions test failure', 'Performance issues'],
        solutions: ['Repair open circuit', 'Check wiring', 'Fix connector', 'Replace solenoid']
      },
      'P0445': {
        description: 'Evaporative Emission Control System Purge Control Valve Circuit Shorted',
        system: 'Powertrain', subsystem: 'Emissions System', severity: this.severityLevels.MEDIUM,
        causes: ['Short circuit to purge valve', 'Wiring short', 'Bad connector', 'Solenoid failure'],
        symptoms: ['EVAP system malfunction', 'Poor performance', 'Emissions failure'],
        solutions: ['Repair short circuit', 'Check wiring', 'Fix connector', 'Replace solenoid']
      },

      // P1000-P1002: OBD System Codes
      'P1000': {
        description: 'OBD System Readiness Test Not Complete',
        system: 'Powertrain', subsystem: 'OBD System', severity: this.severityLevels.INFO,
        causes: ['Recent battery disconnect', 'PCM reset', 'Incomplete drive cycle', 'System not ready'],
        symptoms: ['Check engine light', 'Failed emissions test', 'Readiness monitors incomplete'],
        solutions: ['Complete drive cycle', 'Drive vehicle normally', 'Allow system to complete tests', 'Check for other codes']
      },
      'P1001': {
        description: 'Key On Engine Running (KOER) Test Not Able to Complete',
        system: 'Powertrain', subsystem: 'OBD System', severity: this.severityLevels.INFO,
        causes: ['Engine not at operating temperature', 'Incomplete test conditions', 'System fault'],
        symptoms: ['Test incomplete message', 'Readiness not set', 'Emissions test failure'],
        solutions: ['Warm up engine', 'Complete test drive', 'Check system requirements', 'Professional diagnosis']
      },
      'P1002': {
        description: 'Key On Engine Off (KOEO) Test Not Able to Complete',
        system: 'Powertrain', subsystem: 'OBD System', severity: this.severityLevels.INFO,
        causes: ['System not ready', 'Test conditions not met', 'PCM communication issues'],
        symptoms: ['Test incomplete message', 'Readiness not set', 'Diagnostic issues'],
        solutions: ['Check system readiness', 'Verify test conditions', 'PCM communication check', 'Professional diagnosis']
      }
    };
  }

  getCode(code: string) {
    return this.codes[code] || null;
  }

  getAllCodes() {
    return this.codes;
  }

  getCodesBySubsystem(subsystem: string) {
    return Object.entries(this.codes)
      .filter(([, data]: [string, any]) => data.subsystem === subsystem)
      .reduce((acc, [code, data]) => ({ ...acc, [code]: data }), {});
  }

  getCodesBySeverity(severity: string) {
    return Object.entries(this.codes)
      .filter(([, data]: [string, any]) => data.severity === severity)
      .reduce((acc, [code, data]) => ({ ...acc, [code]: data }), {});
  }
}

export default PowertrainDTCCodes;