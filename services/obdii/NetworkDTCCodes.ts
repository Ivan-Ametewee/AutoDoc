// Comprehensive Network/Communication OBD-II Diagnostic Trouble Code Database
// Merged from comprehensive DTC database and temp files
// Contains all U-codes (Network/Communication) with proper subsystem categorization

export class NetworkDTCCodes {
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

    this.codes = this.initializeNetworkDTCDatabase();
  }

  initializeNetworkDTCDatabase() {
    return {
      // ==================== NETWORK/COMMUNICATION CODES (U0xxx - Generic SAE) ====================
      
      // U0001-U0099: CAN Bus Communication Codes
      'U0001': {
        description: 'High Speed CAN Communication Bus',
        system: 'Network', subsystem: 'CAN Bus', severity: this.severityLevels.HIGH,
        causes: ['CAN bus wiring issues', 'ECU communication failure', 'Termination resistor problems', 'Network overload'],
        symptoms: ['Multiple warning lights', 'System malfunctions', 'No communication', 'Intermittent failures'],
        solutions: ['Check CAN bus wiring', 'Test termination resistors', 'Scan all modules', 'Professional network diagnosis']
      },
      'U0002': {
        description: 'High Speed CAN Communication Bus Performance',
        system: 'Network', subsystem: 'CAN Bus', severity: this.severityLevels.HIGH,
        causes: ['CAN bus performance degraded', 'Network congestion', 'Timing issues', 'Signal interference'],
        symptoms: ['Slow system response', 'Intermittent communication', 'Performance warnings'],
        solutions: ['Check bus performance', 'Reduce network load', 'Fix timing issues', 'Eliminate interference']
      },
      'U0003': {
        description: 'High Speed CAN Communication Bus (+) Open',
        system: 'Network', subsystem: 'CAN Bus', severity: this.severityLevels.HIGH,
        causes: ['CAN High wire open', 'Wiring break', 'Connector damage', 'Terminal corrosion'],
        symptoms: ['No CAN communication', 'Multiple system failures', 'Warning lights'],
        solutions: ['Repair CAN High wire', 'Check connectors', 'Replace damaged terminals', 'Clean corrosion']
      },
      'U0004': {
        description: 'High Speed CAN Communication Bus (+) Low',
        system: 'Network', subsystem: 'CAN Bus', severity: this.severityLevels.HIGH,
        causes: ['CAN High shorted to ground', 'Wiring fault', 'Module failure', 'Water damage'],
        symptoms: ['CAN bus failure', 'Communication loss', 'System malfunctions'],
        solutions: ['Check for shorts to ground', 'Repair wiring', 'Replace faulty module', 'Dry out connections']
      },
      'U0005': {
        description: 'High Speed CAN Communication Bus (+) High',
        system: 'Network', subsystem: 'CAN Bus', severity: this.severityLevels.HIGH,
        causes: ['CAN High shorted to power', 'Voltage spike', 'Module malfunction', 'Wiring error'],
        symptoms: ['CAN bus overload', 'Communication errors', 'System shutdowns'],
        solutions: ['Check for shorts to power', 'Protect against voltage spikes', 'Replace module', 'Correct wiring']
      },
      'U0006': {
        description: 'High Speed CAN Communication Bus (-) Open',
        system: 'Network', subsystem: 'CAN Bus', severity: this.severityLevels.HIGH,
        causes: ['CAN Low wire open', 'Wiring break', 'Connector issue', 'Terminal failure'],
        symptoms: ['CAN communication failure', 'Network down', 'Multiple warnings'],
        solutions: ['Repair CAN Low wire', 'Fix connectors', 'Replace terminals', 'Ensure continuity']
      },
      'U0007': {
        description: 'High Speed CAN Communication Bus (-) Low',
        system: 'Network', subsystem: 'CAN Bus', severity: this.severityLevels.HIGH,
        causes: ['CAN Low shorted to ground', 'Wiring fault', 'Ground loop', 'Module failure'],
        symptoms: ['CAN bus malfunction', 'Ground-related issues', 'Communication loss'],
        solutions: ['Check ground connections', 'Repair shorts', 'Eliminate ground loops', 'Replace module']
      },
      'U0008': {
        description: 'High Speed CAN Communication Bus (-) High',
        system: 'Network', subsystem: 'CAN Bus', severity: this.severityLevels.HIGH,
        causes: ['CAN Low shorted to voltage', 'Wiring error', 'Power supply issue', 'Module fault'],
        symptoms: ['CAN voltage problems', 'Communication errors', 'System instability'],
        solutions: ['Fix voltage shorts', 'Correct wiring', 'Stabilize power supply', 'Replace faulty module']
      },
      'U0009': {
        description: 'High Speed CAN Communication Bus (-) shorted to Bus (+)',
        system: 'Network', subsystem: 'CAN Bus', severity: this.severityLevels.HIGH,
        causes: ['CAN wires shorted together', 'Pinched wiring', 'Connector damage', 'Installation error'],
        symptoms: ['CAN bus failure', 'No differential signal', 'Complete communication loss'],
        solutions: ['Separate shorted wires', 'Repair pinched cables', 'Replace connector', 'Correct installation']
      },
      'U0010': {
        description: 'Medium Speed CAN Communication Bus',
        system: 'Network', subsystem: 'CAN Bus', severity: this.severityLevels.MEDIUM,
        causes: ['Medium speed CAN fault', 'Network issues', 'Module communication problems'],
        symptoms: ['Body system malfunctions', 'Comfort system issues', 'Communication errors'],
        solutions: ['Check medium speed network', 'Test body modules', 'Repair communication links']
      },
      'U0011': {
        description: 'Medium Speed CAN Communication Bus Performance',
        system: 'Network', subsystem: 'CAN Bus', severity: this.severityLevels.MEDIUM,
        causes: ['Medium CAN performance degraded', 'Bandwidth issues', 'Signal quality problems'],
        symptoms: ['Slow body system response', 'Intermittent features', 'Performance issues'],
        solutions: ['Optimize medium CAN performance', 'Check signal quality', 'Reduce network load']
      },

      // U0100-U0199: Module Communication Loss Codes
      'U0100': {
        description: 'Lost Communication with ECM/PCM',
        system: 'Network', subsystem: 'Engine Control', severity: this.severityLevels.CRITICAL,
        causes: ['ECM failure', 'Power supply issues', 'CAN bus problems', 'Wiring damage'],
        symptoms: ['Engine not starting', 'No engine communication', 'Multiple warnings', 'Vehicle inoperative'],
        solutions: ['Check ECM power', 'Test CAN bus', 'Replace ECM if necessary', 'Professional diagnosis']
      },
      'U0101': {
        description: 'Lost Communication with TCM',
        system: 'Network', subsystem: 'Transmission Control', severity: this.severityLevels.HIGH,
        causes: ['TCM failure', 'Communication bus issues', 'Power problems', 'Wiring faults'],
        symptoms: ['Transmission problems', 'No shift control', 'Limp mode', 'Communication errors'],
        solutions: ['Check TCM power', 'Test communication bus', 'Replace TCM', 'Repair wiring']
      },
      'U0102': {
        description: 'Lost Communication with Transfer Case Control Module',
        system: 'Network', subsystem: 'Drivetrain Control', severity: this.severityLevels.MEDIUM,
        causes: ['Transfer case module failure', 'Network issues', 'Power supply problems'],
        symptoms: ['4WD system inoperative', 'Transfer case problems', 'Warning lights'],
        solutions: ['Check transfer case module', 'Test network', 'Check power supply']
      },
      'U0103': {
        description: 'Lost Communication with Gear Shift Module',
        system: 'Network', subsystem: 'Transmission Control', severity: this.severityLevels.MEDIUM,
        causes: ['Gear shift module failure', 'Communication problems', 'Wiring issues'],
        symptoms: ['Shift problems', 'Gear indicator issues', 'Transmission warnings'],
        solutions: ['Test gear shift module', 'Check communication', 'Repair wiring']
      },
      'U0104': {
        description: 'Lost Communication with Cruise Control Module',
        system: 'Network', subsystem: 'Vehicle Control', severity: this.severityLevels.LOW,
        causes: ['Cruise control module failure', 'Network issues', 'Power problems'],
        symptoms: ['Cruise control inoperative', 'Speed control problems'],
        solutions: ['Check cruise module', 'Test network', 'Verify power supply']
      },
      'U0105': {
        description: 'Lost Communication with Fuel Injector Control Module',
        system: 'Network', subsystem: 'Engine Control', severity: this.severityLevels.HIGH,
        causes: ['Injector control module failure', 'Network problems', 'Power issues'],
        symptoms: ['Poor engine performance', 'Fuel injection problems', 'Engine misfires'],
        solutions: ['Test injector module', 'Check network', 'Verify power and ground']
      },
      'U0106': {
        description: 'Lost Communication with Glow Plug Module',
        system: 'Network', subsystem: 'Engine Control', severity: this.severityLevels.MEDIUM,
        causes: ['Glow plug module failure', 'Communication fault', 'Power supply issue'],
        symptoms: ['Hard cold start', 'Glow plug system inoperative', 'Diesel start problems'],
        solutions: ['Check glow plug module', 'Test communication', 'Verify power supply']
      },
      'U0107': {
        description: 'Lost Communication with Throttle Actuator Control Module',
        system: 'Network', subsystem: 'Engine Control', severity: this.severityLevels.HIGH,
        causes: ['Throttle actuator module failure', 'Network problems', 'Power issues'],
        symptoms: ['Throttle control problems', 'Engine performance issues', 'Limp mode'],
        solutions: ['Test throttle module', 'Check network', 'Verify power and signals']
      },
      'U0108': {
        description: 'Lost Communication with Alternative Fuel Control Module',
        system: 'Network', subsystem: 'Engine Control', severity: this.severityLevels.MEDIUM,
        causes: ['Alternative fuel module failure', 'Communication issue', 'System malfunction'],
        symptoms: ['Alternative fuel system problems', 'Fuel switching issues', 'Performance loss'],
        solutions: ['Check fuel control module', 'Test communication', 'Service fuel system']
      },
      'U0109': {
        description: 'Lost Communication with Fuel Pump Control Module',
        system: 'Network', subsystem: 'Fuel System', severity: this.severityLevels.HIGH,
        causes: ['Fuel pump module failure', 'Network communication loss', 'Power supply problems'],
        symptoms: ['Fuel pump not operating', 'Engine stalling', 'No start condition'],
        solutions: ['Check fuel pump module', 'Test network connection', 'Verify power supply']
      },
      'U0110': {
        description: 'Lost Communication with Drive Motor Control Module',
        system: 'Network', subsystem: 'Electric Drive', severity: this.severityLevels.HIGH,
        causes: ['Drive motor module failure', 'High voltage system issue', 'Communication fault'],
        symptoms: ['Electric drive not working', 'Hybrid system problems', 'Vehicle inoperative'],
        solutions: ['Check drive motor module', 'Test high voltage system', 'Professional EV service']
      },
      'U0111': {
        description: 'Lost Communication with Battery Energy Control Module A',
        system: 'Network', subsystem: 'Battery Management', severity: this.severityLevels.HIGH,
        causes: ['Battery control module failure', 'High voltage isolation', 'Communication loss'],
        symptoms: ['Battery management issues', 'Charging problems', 'Power system warnings'],
        solutions: ['Check battery module', 'Test HV isolation', 'Professional battery service']
      },
      'U0112': {
        description: 'Lost Communication with Battery Energy Control Module B',
        system: 'Network', subsystem: 'Battery Management', severity: this.severityLevels.HIGH,
        causes: ['Secondary battery module failure', 'Redundant system fault', 'Network issues'],
        symptoms: ['Battery backup system failure', 'Reduced battery capacity', 'System warnings'],
        solutions: ['Check backup battery module', 'Test redundant systems', 'Professional service']
      },
      'U0113': {
        description: 'Lost Communication with Emissions Critical Control Module',
        system: 'Network', subsystem: 'Emissions Control', severity: this.severityLevels.HIGH,
        causes: ['Emissions control module failure', 'DEF system issues', 'Communication problems'],
        symptoms: ['Emissions system malfunction', 'DEF system problems', 'Compliance issues'],
        solutions: ['Check emissions module', 'Service DEF system', 'Test communication network']
      },
      
      // U0114-U0199: Additional Module Communication Loss Codes
      'U0114': {
        description: 'Lost Communication with HVAC Control Module',
        system: 'Network', subsystem: 'Climate Control', severity: this.severityLevels.MEDIUM,
        causes: ['HVAC control module failure', 'Network communication fault', 'Power supply issues'],
        symptoms: ['Climate control not working', 'No HVAC response', 'Temperature control issues'],
        solutions: ['Check HVAC module', 'Test network communication', 'Verify power supply']
      },
      'U0115': {
        description: 'Lost Communication with Instrument Panel Control Module',
        system: 'Network', subsystem: 'Body Control', severity: this.severityLevels.MEDIUM,
        causes: ['Instrument cluster failure', 'Communication bus issues', 'Module power problems'],
        symptoms: ['Gauges not working', 'Warning lights malfunction', 'Display issues'],
        solutions: ['Check instrument cluster', 'Test communication bus', 'Verify module power']
      },
      'U0116': {
        description: 'Lost Communication with Parking Assist Control Module',
        system: 'Network', subsystem: 'Driver Assistance', severity: this.severityLevels.LOW,
        causes: ['Parking assist module failure', 'Sensor communication issues', 'Network problems'],
        symptoms: ['Parking assist not working', 'Sensor warnings', 'System disabled'],
        solutions: ['Check parking assist module', 'Test sensor communication', 'Diagnose network']
      },
      'U0117': {
        description: 'Lost Communication with Tire Pressure Monitor Control Module',
        system: 'Network', subsystem: 'Safety Systems', severity: this.severityLevels.MEDIUM,
        causes: ['TPMS module failure', 'RF communication issues', 'System malfunction'],
        symptoms: ['TPMS warning light', 'No tire pressure readings', 'System malfunction'],
        solutions: ['Check TPMS module', 'Test RF communication', 'Relearn tire sensors']
      },
      'U0118': {
        description: 'Lost Communication with Audio/Navigation Control Module',
        system: 'Network', subsystem: 'Infotainment', severity: this.severityLevels.LOW,
        causes: ['Audio system failure', 'Navigation module issues', 'Communication fault'],
        symptoms: ['Audio system not working', 'Navigation issues', 'Display problems'],
        solutions: ['Check audio module', 'Test navigation system', 'Verify communication']
      },
      'U0119': {
        description: 'Lost Communication with Supplemental Restraint System Control Module',
        system: 'Network', subsystem: 'Safety Systems', severity: this.severityLevels.CRITICAL,
        causes: ['SRS module failure', 'Airbag system issues', 'Communication fault'],
        symptoms: ['Airbag warning light', 'SRS system disabled', 'Safety system malfunction'],
        solutions: ['Professional airbag service', 'Check SRS module', 'Test communication network']
      },
      'U0120': {
        description: 'Lost Communication with Body Control Module',
        system: 'Network', subsystem: 'Body Control', severity: this.severityLevels.HIGH,
        causes: ['BCM failure', 'Power supply issues', 'Communication network fault'],
        symptoms: ['Multiple electrical failures', 'Lighting issues', 'Door control problems'],
        solutions: ['Check BCM', 'Verify power supply', 'Test communication network']
      },
      'U0121': {
        description: 'Lost Communication with Anti-lock Brake System Control Module',
        system: 'Network', subsystem: 'Brake System', severity: this.severityLevels.HIGH,
        causes: ['ABS module failure', 'Communication fault', 'Power supply problems'],
        symptoms: ['ABS warning light', 'Brake system malfunction', 'Stability control issues'],
        solutions: ['Check ABS module', 'Test communication', 'Verify power supply']
      },
      'U0122': {
        description: 'Lost Communication with Vehicle Dynamics Control Module',
        system: 'Network', subsystem: 'Vehicle Control', severity: this.severityLevels.HIGH,
        causes: ['VDC module failure', 'Stability system issues', 'Communication problems'],
        symptoms: ['Vehicle dynamics control disabled', 'Stability warnings', 'System malfunction'],
        solutions: ['Check VDC module', 'Test stability system', 'Diagnose communication']
      },
      'U0123': {
        description: 'Lost Communication with Electric Power Steering Control Module',
        system: 'Network', subsystem: 'Steering Control', severity: this.severityLevels.HIGH,
        causes: ['EPS module failure', 'Steering system issues', 'Communication fault'],
        symptoms: ['Power steering malfunction', 'Heavy steering', 'Steering warning light'],
        solutions: ['Check EPS module', 'Test steering system', 'Verify communication']
      },
      
      // U0200-U0299: Data Bus Communication Codes
      'U0200': {
        description: 'Internal Control Module Software Incompatibility',
        system: 'Network', subsystem: 'Module Programming', severity: this.severityLevels.HIGH,
        causes: ['Software version mismatch', 'Incomplete programming', 'Module compatibility issues'],
        symptoms: ['System malfunctions', 'Feature conflicts', 'Programming errors'],
        solutions: ['Update software', 'Reprogram modules', 'Check compatibility', 'Professional programming']
      },
      'U0201': {
        description: 'Control Module Configuration Incompatibility',
        system: 'Network', subsystem: 'Module Programming', severity: this.severityLevels.MEDIUM,
        causes: ['Configuration mismatch', 'Wrong vehicle parameters', 'Module setup errors'],
        symptoms: ['Feature not working', 'System conflicts', 'Configuration errors'],
        solutions: ['Reconfigure modules', 'Verify vehicle parameters', 'Professional programming']
      },
      'U0202': {
        description: 'Control Module Calibration/Programming Incomplete',
        system: 'Network', subsystem: 'Module Programming', severity: this.severityLevels.HIGH,
        causes: ['Interrupted programming', 'Incomplete calibration', 'Programming failure'],
        symptoms: ['Module not functioning', 'System errors', 'Programming incomplete'],
        solutions: ['Complete programming', 'Recalibrate module', 'Professional service']
      },
      'U0203': {
        description: 'Control Module Calibration/Programming Error',
        system: 'Network', subsystem: 'Module Programming', severity: this.severityLevels.HIGH,
        causes: ['Programming corruption', 'Calibration errors', 'Data transmission issues'],
        symptoms: ['Module malfunction', 'System errors', 'Feature not working'],
        solutions: ['Reprogram module', 'Recalibrate system', 'Check data integrity']
      },
      
      // U0300-U0399: Network Timeout and Performance Codes
      'U0300': {
        description: 'Internal Control Module Software Timeout',
        system: 'Network', subsystem: 'Module Performance', severity: this.severityLevels.MEDIUM,
        causes: ['Software processing delays', 'Module overload', 'Resource conflicts'],
        symptoms: ['Slow system response', 'Delayed functions', 'Performance issues'],
        solutions: ['Update software', 'Check module load', 'Optimize performance']
      },
      'U0301': {
        description: 'Control Module Memory Performance',
        system: 'Network', subsystem: 'Module Performance', severity: this.severityLevels.MEDIUM,
        causes: ['Memory issues', 'Data corruption', 'Storage problems'],
        symptoms: ['Memory errors', 'Data loss', 'System instability'],
        solutions: ['Check memory integrity', 'Clear memory errors', 'Replace module if needed']
      },
      'U0302': {
        description: 'Control Module Processor Performance',
        system: 'Network', subsystem: 'Module Performance', severity: this.severityLevels.MEDIUM,
        causes: ['Processor overload', 'Performance degradation', 'Processing errors'],
        symptoms: ['Slow response', 'System lag', 'Processing delays'],
        solutions: ['Check processor load', 'Optimize system', 'Update firmware']
      },
      
      // U0400-U0499: CAN Bus Specific Error Codes
      'U0400': {
        description: 'Invalid Data Received from Engine Control Module',
        system: 'Network', subsystem: 'Data Validation', severity: this.severityLevels.MEDIUM,
        causes: ['ECM data corruption', 'Communication errors', 'Signal interference'],
        symptoms: ['Data inconsistencies', 'System warnings', 'Performance issues'],
        solutions: ['Check ECM communication', 'Verify data integrity', 'Test signal quality']
      },
      'U0401': {
        description: 'Invalid Data Received from Transmission Control Module',
        system: 'Network', subsystem: 'Data Validation', severity: this.severityLevels.MEDIUM,
        causes: ['TCM data errors', 'Communication faults', 'Data transmission issues'],
        symptoms: ['Transmission warnings', 'Shift problems', 'Data errors'],
        solutions: ['Check TCM communication', 'Verify transmission data', 'Test network integrity']
      },
      'U0402': {
        description: 'Invalid Data Received from Body Control Module',
        system: 'Network', subsystem: 'Data Validation', severity: this.severityLevels.LOW,
        causes: ['BCM data corruption', 'Communication issues', 'Network problems'],
        symptoms: ['Body system warnings', 'Feature malfunctions', 'Data inconsistencies'],
        solutions: ['Check BCM communication', 'Verify body system data', 'Test network connection']
      },
      'U0403': {
        description: 'Invalid Data Received from Instrument Cluster',
        system: 'Network', subsystem: 'Data Validation', severity: this.severityLevels.LOW,
        causes: ['Cluster data errors', 'Display issues', 'Communication faults'],
        symptoms: ['Gauge inconsistencies', 'Display errors', 'Warning light issues'],
        solutions: ['Check cluster communication', 'Verify display data', 'Test gauge signals']
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

export default NetworkDTCCodes;