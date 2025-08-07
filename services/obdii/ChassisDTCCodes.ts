// Comprehensive Chassis OBD-II Diagnostic Trouble Code Database
// Merged from comprehensive DTC database and temp files
// Contains all C-codes (Chassis) with proper subsystem categorization

export class ChassisDTCCodes {
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

    this.codes = this.initializeChassisDTCDatabase();
  }

  initializeChassisDTCDatabase() {
    return {
      // ==================== CHASSIS CODES (C0xxx - Generic SAE) ====================
      
      // C0000-C0099: Vehicle Speed and ABS System Codes
      'C0000': {
        description: 'Vehicle Speed Information Circuit Malfunction',
        system: 'Chassis', subsystem: 'Vehicle Speed Control', severity: this.severityLevels.MEDIUM,
        causes: ['Vehicle speed sensor fault', 'Wiring issue', 'ECU malfunction'],
        symptoms: ['Speedometer issues', 'ABS malfunction', 'Cruise control problems'],
        solutions: ['Check speed sensor', 'Inspect wiring/connectors', 'Test ECU']
      },
      'C0035': {
        description: 'Left Front Wheel Speed Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Faulty wheel speed sensor', 'Damaged sensor ring', 'Wiring issues', 'Connector problems'],
        symptoms: ['ABS warning light', 'ABS not functioning', 'Traction control issues', 'Poor braking'],
        solutions: ['Replace wheel speed sensor', 'Check sensor ring', 'Repair wiring', 'Clean connector']
      },
      'C0040': {
        description: 'Right Front Wheel Speed Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Faulty wheel speed sensor', 'Damaged sensor ring', 'Wiring issues', 'Brake contamination'],
        symptoms: ['ABS warning light', 'ABS not functioning', 'Traction control issues'],
        solutions: ['Replace wheel speed sensor', 'Check sensor ring', 'Repair wiring', 'Clean brakes']
      },
      'C0041': {
        description: 'Right Front Wheel Speed Sensor Circuit Range/Performance (EBCM)',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Wheel speed sensor out of range', 'Sensor calibration issue', 'EBCM malfunction'],
        symptoms: ['ABS warning light', 'Traction control malfunction', 'Poor brake performance'],
        solutions: ['Calibrate sensor', 'Replace speed sensor', 'Check EBCM', 'Verify sensor gap']
      },
      'C0045': {
        description: 'Left Rear Wheel Speed Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Rear wheel sensor failure', 'Sensor ring damage', 'Wiring corrosion', 'Connector issues'],
        symptoms: ['ABS light on', 'Rear ABS not working', 'Stability control issues'],
        solutions: ['Replace rear sensor', 'Inspect sensor ring', 'Repair wiring', 'Service connector']
      },
      'C0046': {
        description: 'Left Rear Wheel Speed Sensor Circuit Range/Performance (EBCM)',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Left rear sensor performance issue', 'EBCM communication problem', 'Sensor range fault'],
        symptoms: ['ABS warning light', 'Left rear wheel lockup', 'Stability control malfunction'],
        solutions: ['Check sensor performance', 'Replace sensor', 'Test EBCM', 'Verify wiring integrity']
      },
      'C0050': {
        description: 'Right Rear Wheel Speed Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Right rear sensor fault', 'Damaged tone ring', 'Wiring problems', 'Brake debris'],
        symptoms: ['ABS malfunction', 'Traction control off', 'Brake system warning'],
        solutions: ['Replace wheel sensor', 'Clean tone ring', 'Repair wiring', 'Clean brake area']
      },
      'C0051': {
        description: 'LF Wheel Speed Sensor Circuit Range/Performance (EBCM)',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Left front sensor range issue', 'EBCM calibration problem', 'Signal interference'],
        symptoms: ['ABS warning light', 'Left front brake issues', 'Traction control problems'],
        solutions: ['Check sensor range', 'Calibrate EBCM', 'Replace sensor', 'Eliminate interference']
      },

      // C0060-C0099: ABS Solenoid and Actuator Codes
      'C0060': {
        description: 'Left Front ABS Solenoid #1 Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['ABS solenoid failure', 'Wiring fault', 'Hydraulic valve stuck', 'Control module issue'],
        symptoms: ['ABS warning light', 'Left front brake lockup', 'Poor brake modulation'],
        solutions: ['Replace ABS solenoid', 'Check hydraulic system', 'Inspect wiring', 'Test control module']
      },
      'C0065': {
        description: 'Left Front ABS Solenoid #2 Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Secondary solenoid failure', 'Electrical fault', 'Hydraulic contamination', 'Valve malfunction'],
        symptoms: ['ABS warning light', 'Brake system malfunction', 'Poor stopping performance'],
        solutions: ['Replace solenoid valve', 'Flush brake system', 'Check electrical connections', 'Service ABS module']
      },
      'C0070': {
        description: 'Right Front ABS Solenoid #1 Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Right front solenoid failure', 'Circuit fault', 'Hydraulic issue', 'Control problem'],
        symptoms: ['ABS warning light', 'Right front brake problems', 'Uneven braking'],
        solutions: ['Replace ABS solenoid', 'Check circuit integrity', 'Service hydraulic system', 'Test control module']
      },
      'C0075': {
        description: 'Right Front ABS Solenoid #2 Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Secondary solenoid fault', 'Wiring issue', 'Hydraulic valve problem', 'Module malfunction'],
        symptoms: ['ABS light on', 'Brake modulation issues', 'Reduced braking efficiency'],
        solutions: ['Replace solenoid', 'Repair wiring', 'Service valve', 'Check ABS module']
      },
      'C0080': {
        description: 'Left Rear ABS Solenoid #1 Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Left rear solenoid failure', 'Electrical fault', 'Hydraulic blockage', 'Control issue'],
        symptoms: ['ABS warning light', 'Left rear brake lockup', 'Stability control problems'],
        solutions: ['Replace rear solenoid', 'Check electrical system', 'Clear hydraulic blockage', 'Service control module']
      },
      'C0085': {
        description: 'Left Rear ABS Solenoid #2 Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Secondary rear solenoid fault', 'Circuit problem', 'Valve contamination', 'Module error'],
        symptoms: ['ABS malfunction', 'Poor brake performance', 'System warning lights'],
        solutions: ['Replace solenoid valve', 'Repair circuit', 'Clean contamination', 'Reset module']
      },
      'C0090': {
        description: 'Right Rear ABS Solenoid #1 Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Right rear solenoid failure', 'Wiring fault', 'Hydraulic malfunction', 'ECU problem'],
        symptoms: ['ABS warning light', 'Right rear brake issues', 'Vehicle instability'],
        solutions: ['Replace solenoid', 'Repair wiring', 'Service hydraulics', 'Check ECU']
      },
      'C0095': {
        description: 'Right Rear ABS Solenoid #2 Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Secondary solenoid failure', 'Electrical issue', 'Hydraulic fault', 'System contamination'],
        symptoms: ['ABS light on', 'Brake system malfunction', 'Poor vehicle control'],
        solutions: ['Replace solenoid', 'Check electrical system', 'Service hydraulics', 'Clean system']
      },

      // Additional Chassis System Codes
      'C0100': {
        description: 'Pump Motor Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['ABS pump motor failure', 'Electrical fault', 'Motor seizure', 'Control circuit issue'],
        symptoms: ['ABS warning light', 'No brake assist', 'Hard brake pedal', 'Pump noise'],
        solutions: ['Replace ABS pump motor', 'Check electrical connections', 'Service hydraulic system', 'Test control circuit']
      },
      'C0110': {
        description: 'Pump Motor Circuit Range/Performance',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Pump motor performance degraded', 'Electrical resistance issues', 'Bearing wear', 'Contamination'],
        symptoms: ['Reduced brake assist', 'Unusual pump operation', 'Intermittent ABS function'],
        solutions: ['Check motor performance', 'Test electrical resistance', 'Replace bearings', 'Clean system']
      },
      'C0121': {
        description: 'Valve Relay Circuit Malfunction',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.HIGH,
        causes: ['Valve relay failure', 'Relay circuit fault', 'Power supply issue', 'Control module problem'],
        symptoms: ['ABS system inoperative', 'Valve control loss', 'Multiple system warnings'],
        solutions: ['Replace valve relay', 'Check relay circuit', 'Verify power supply', 'Test control module']
      },
      'C0141': {
        description: 'System Voltage Low',
        system: 'Chassis', subsystem: 'ABS System', severity: this.severityLevels.MEDIUM,
        causes: ['Low battery voltage', 'Charging system fault', 'High electrical load', 'Poor connections'],
        symptoms: ['ABS warning light', 'Reduced system performance', 'Multiple electrical issues'],
        solutions: ['Check battery voltage', 'Test charging system', 'Reduce electrical load', 'Clean connections']
      },
      'C0161': {
        description: 'ABS/TCS Brake Switch Circuit Malfunction',
        system: 'Chassis', subsystem: 'Brake System', severity: this.severityLevels.MEDIUM,
        causes: ['Brake switch failure', 'Switch circuit fault', 'Adjustment issue', 'Wiring problem'],
        symptoms: ['Brake lights not working', 'ABS/TCS malfunction', 'Cruise control issues'],
        solutions: ['Replace brake switch', 'Adjust switch position', 'Repair wiring', 'Test circuit continuity']
      },
      'C0550': {
        description: 'ECU Malfunction',
        system: 'Chassis', subsystem: 'Electronic Control', severity: this.severityLevels.CRITICAL,
        causes: ['ABS ECU internal failure', 'Software corruption', 'Hardware fault', 'Power supply issue'],
        symptoms: ['Complete ABS system failure', 'Multiple warning lights', 'No system communication'],
        solutions: ['Replace ABS ECU', 'Reprogram software', 'Check hardware connections', 'Verify power supply']
      },
      
      // C0600-C0699: Electronic Stability Control (ESC) Codes
      'C0600': {
        description: 'Electronic Stability Control System Malfunction',
        system: 'Chassis', subsystem: 'Stability Control', severity: this.severityLevels.HIGH,
        causes: ['ESC module failure', 'Sensor malfunction', 'System calibration error', 'Communication fault'],
        symptoms: ['ESC warning light', 'Stability control disabled', 'Poor vehicle stability', 'System intervention issues'],
        solutions: ['Check ESC module', 'Test sensors', 'Recalibrate system', 'Professional ESC service']
      },
      'C0601': {
        description: 'Electronic Stability Control System Performance',
        system: 'Chassis', subsystem: 'Stability Control', severity: this.severityLevels.HIGH,
        causes: ['ESC performance degraded', 'Sensor drift', 'Calibration issues', 'Software problems'],
        symptoms: ['Reduced stability control', 'Delayed system response', 'Performance warnings'],
        solutions: ['Recalibrate ESC system', 'Check sensor alignment', 'Update software', 'Test system performance']
      },
      'C0602': {
        description: 'Vehicle Speed Signal Invalid',
        system: 'Chassis', subsystem: 'Stability Control', severity: this.severityLevels.HIGH,
        causes: ['Speed sensor failure', 'Signal corruption', 'Wiring issues', 'Module communication error'],
        symptoms: ['Stability control malfunction', 'Speed-related warnings', 'System disabled'],
        solutions: ['Test speed sensors', 'Check signal integrity', 'Repair wiring', 'Test module communication']
      },
      'C0603': {
        description: 'Lateral Acceleration Sensor Circuit Malfunction',
        system: 'Chassis', subsystem: 'Stability Control', severity: this.severityLevels.HIGH,
        causes: ['Lateral G-sensor failure', 'Sensor circuit fault', 'Mounting issues', 'Calibration error'],
        symptoms: ['ESC warning light', 'Stability control disabled', 'False system activations'],
        solutions: ['Replace lateral G-sensor', 'Check sensor circuit', 'Verify mounting', 'Recalibrate sensor']
      },
      'C0604': {
        description: 'Yaw Rate Sensor Circuit Malfunction',
        system: 'Chassis', subsystem: 'Stability Control', severity: this.severityLevels.HIGH,
        causes: ['Yaw rate sensor failure', 'Circuit malfunction', 'Sensor contamination', 'Calibration drift'],
        symptoms: ['ESC system disabled', 'Yaw control issues', 'Vehicle instability'],
        solutions: ['Replace yaw rate sensor', 'Clean sensor', 'Recalibrate system', 'Check circuit integrity']
      },
      'C0605': {
        description: 'Steering Angle Sensor Circuit Malfunction',
        system: 'Chassis', subsystem: 'Steering System', severity: this.severityLevels.HIGH,
        causes: ['Steering angle sensor failure', 'Clock spring issues', 'Calibration error', 'Communication fault'],
        symptoms: ['ESC malfunction', 'Steering assist issues', 'Warning lights', 'Stability problems'],
        solutions: ['Replace steering angle sensor', 'Check clock spring', 'Recalibrate sensor', 'Test communication']
      },
      
      // C0700-C0799: Traction Control System Codes
      'C0700': {
        description: 'Traction Control System Malfunction',
        system: 'Chassis', subsystem: 'Traction Control', severity: this.severityLevels.HIGH,
        causes: ['TCS module failure', 'Wheel speed sensor issues', 'System disabled', 'Control valve problems'],
        symptoms: ['TCS warning light', 'No traction control', 'Wheel spin', 'Poor acceleration'],
        solutions: ['Check TCS module', 'Test wheel speed sensors', 'Verify control valves', 'System diagnosis']
      },
      'C0701': {
        description: 'Traction Control System Performance',
        system: 'Chassis', subsystem: 'Traction Control', severity: this.severityLevels.MEDIUM,
        causes: ['TCS performance degraded', 'Sensor sensitivity issues', 'Calibration problems', 'Software faults'],
        symptoms: ['Reduced traction control', 'Delayed intervention', 'Performance issues'],
        solutions: ['Recalibrate TCS', 'Adjust sensor sensitivity', 'Update software', 'Performance testing']
      },
      'C0702': {
        description: 'Traction Control Valve Relay Circuit Malfunction',
        system: 'Chassis', subsystem: 'Traction Control', severity: this.severityLevels.HIGH,
        causes: ['TCS valve relay failure', 'Relay circuit fault', 'Power supply issues', 'Control module problem'],
        symptoms: ['TCS system inoperative', 'Valve control loss', 'No brake intervention'],
        solutions: ['Replace TCS valve relay', 'Check relay circuit', 'Verify power supply', 'Test control module']
      },
      
      // C0800-C0899: Power Steering System Codes
      'C0800': {
        description: 'Power Steering Control Module Circuit Malfunction',
        system: 'Chassis', subsystem: 'Power Steering', severity: this.severityLevels.HIGH,
        causes: ['Power steering module failure', 'Circuit fault', 'Power supply issues', 'Communication error'],
        symptoms: ['Heavy steering', 'Power steering warning', 'No steering assist', 'System malfunction'],
        solutions: ['Replace steering module', 'Check circuit integrity', 'Verify power supply', 'Test communication']
      },
      'C0801': {
        description: 'Power Steering Motor Circuit Malfunction',
        system: 'Chassis', subsystem: 'Power Steering', severity: this.severityLevels.HIGH,
        causes: ['Steering motor failure', 'Motor circuit fault', 'Brush wear', 'Overload condition'],
        symptoms: ['No power steering', 'Heavy steering effort', 'Motor noise', 'Intermittent assist'],
        solutions: ['Replace steering motor', 'Check motor circuit', 'Inspect brushes', 'Test motor load']
      },
      'C0802': {
        description: 'Power Steering Torque Sensor Circuit Malfunction',
        system: 'Chassis', subsystem: 'Power Steering', severity: this.severityLevels.HIGH,
        causes: ['Torque sensor failure', 'Sensor circuit fault', 'Calibration error', 'Mechanical damage'],
        symptoms: ['Steering assist problems', 'Variable steering effort', 'Warning lights'],
        solutions: ['Replace torque sensor', 'Check sensor circuit', 'Recalibrate sensor', 'Inspect mechanism']
      },
      'C0803': {
        description: 'Power Steering Position Sensor Circuit Malfunction',
        system: 'Chassis', subsystem: 'Power Steering', severity: this.severityLevels.MEDIUM,
        causes: ['Position sensor failure', 'Sensor alignment issues', 'Circuit problems', 'Wear/contamination'],
        symptoms: ['Steering position errors', 'Assist level problems', 'Centering issues'],
        solutions: ['Replace position sensor', 'Check sensor alignment', 'Clean sensor area', 'Test circuit']
      },
      
      // C0900-C0999: Suspension System Codes
      'C0900': {
        description: 'Active Suspension Control Module Circuit Malfunction',
        system: 'Chassis', subsystem: 'Suspension System', severity: this.severityLevels.MEDIUM,
        causes: ['Suspension control module failure', 'Power supply issues', 'Communication fault', 'System error'],
        symptoms: ['Suspension warning light', 'Ride quality issues', 'Height control problems', 'System disabled'],
        solutions: ['Check suspension module', 'Verify power supply', 'Test communication', 'Professional suspension service']
      },
      'C0901': {
        description: 'Front Left Suspension Actuator Circuit Malfunction',
        system: 'Chassis', subsystem: 'Suspension System', severity: this.severityLevels.MEDIUM,
        causes: ['Front left actuator failure', 'Circuit fault', 'Air leak', 'Valve malfunction'],
        symptoms: ['Uneven ride height', 'Suspension sag', 'Ride quality issues', 'Warning lights'],
        solutions: ['Replace suspension actuator', 'Check circuit', 'Repair air leaks', 'Test valve operation']
      },
      'C0902': {
        description: 'Front Right Suspension Actuator Circuit Malfunction',
        system: 'Chassis', subsystem: 'Suspension System', severity: this.severityLevels.MEDIUM,
        causes: ['Front right actuator failure', 'Electrical fault', 'Pneumatic problems', 'Control issues'],
        symptoms: ['Ride height variation', 'Poor handling', 'Suspension noise', 'System warnings'],
        solutions: ['Replace front right actuator', 'Check electrical connections', 'Service pneumatic system', 'Test control module']
      },
      'C0903': {
        description: 'Rear Left Suspension Actuator Circuit Malfunction',
        system: 'Chassis', subsystem: 'Suspension System', severity: this.severityLevels.MEDIUM,
        causes: ['Rear left actuator failure', 'Circuit malfunction', 'Air spring leak', 'Valve problems'],
        symptoms: ['Rear suspension sag', 'Uneven vehicle stance', 'Rough ride', 'Warning indicators'],
        solutions: ['Replace rear left actuator', 'Repair circuit', 'Fix air spring leak', 'Service valve']
      },
      'C0904': {
        description: 'Rear Right Suspension Actuator Circuit Malfunction',
        system: 'Chassis', subsystem: 'Suspension System', severity: this.severityLevels.MEDIUM,
        causes: ['Rear right actuator failure', 'Wiring issues', 'Pneumatic leak', 'System malfunction'],
        symptoms: ['Suspension height issues', 'Vehicle lean', 'Ride comfort problems', 'System alerts'],
        solutions: ['Replace rear right actuator', 'Check wiring', 'Repair pneumatic leak', 'System diagnosis']
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

export default ChassisDTCCodes;