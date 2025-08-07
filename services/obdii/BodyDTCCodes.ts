// Comprehensive Body OBD-II Diagnostic Trouble Code Database
// Merged from comprehensive DTC database and temp files
// Contains all B-codes (Body) with proper subsystem categorization

export class BodyDTCCodes {
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

    this.codes = this.initializeBodyDTCDatabase();
  }

  initializeBodyDTCDatabase() {
    return {
      // ==================== BODY CODES (B0xxx - Generic SAE) ====================
      
      // B0001-B0099: Airbag/SRS System Codes
      'B0001': {
        description: 'Driver Airbag Circuit Resistance Low',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Faulty airbag', 'Wiring short', 'Clock spring failure', 'Connector corrosion'],
        symptoms: ['Airbag warning light', 'Airbag may not deploy', 'SRS light on'],
        solutions: ['Professional airbag service required', 'Check wiring', 'Replace clock spring', 'Do not attempt DIY repair']
      },
      'B0002': {
        description: 'Driver Airbag Circuit Resistance High',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Open airbag circuit', 'Wiring break', 'Airbag disconnected', 'Clock spring failure'],
        symptoms: ['Airbag warning light', 'SRS malfunction', 'Airbag inoperative'],
        solutions: ['Professional diagnosis required', 'Check connections', 'Replace clock spring', 'Airbag system service']
      },
      'B0004': {
        description: 'PCM Discrete Input Speed Signal Not Present',
        system: 'Body', subsystem: 'Electronic Control', severity: this.severityLevels.MEDIUM,
        causes: ['Possible sensor fault', 'Wiring issue', 'BCM/ECU malfunction'],
        symptoms: ['Warning light ON', 'Related system not working'],
        solutions: ['Check wiring/connectors', 'Replace faulty sensor/module', 'Inspect BCM/ECU']
      },
      'B0005': {
        description: 'In Park Switch Circuit Malfunction',
        system: 'Body', subsystem: 'Transmission Control', severity: this.severityLevels.MEDIUM,
        causes: ['Park switch failure', 'Wiring issue', 'Shifter mechanism problem'],
        symptoms: ['Warning light ON', 'Shifter not recognized', 'Starting issues'],
        solutions: ['Check park switch', 'Inspect wiring/connectors', 'Test shifter mechanism']
      },
      'B0012': {
        description: 'Right Front/Passenger Frontal Deployment Loop Circuit',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Airbag circuit fault', 'Wiring issue', 'Connector problem'],
        symptoms: ['Airbag warning light', 'SRS malfunction'],
        solutions: ['Professional airbag service', 'Check wiring/connectors', 'Do not attempt DIY repair']
      },
      'B0013': {
        description: 'Right Front/Passenger Frontal Deployment Loop Circuit',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Airbag circuit fault', 'Wiring issue', 'Connector problem'],
        symptoms: ['Airbag warning light', 'SRS malfunction'],
        solutions: ['Professional airbag service', 'Check wiring/connectors', 'Do not attempt DIY repair']
      },
      'B0014': {
        description: 'Right Front/Passenger Frontal Deployment Loop Circuit',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Airbag circuit fault', 'Wiring issue', 'Connector problem'],
        symptoms: ['Airbag warning light', 'SRS malfunction'],
        solutions: ['Professional airbag service', 'Check wiring/connectors', 'Do not attempt DIY repair']
      },
      'B0016': {
        description: 'Right Front/Passenger Frontal Deployment Loop (Single Stage or Stage 1) Resistance Low',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Airbag squib resistance low', 'Wiring short', 'Connector corrosion'],
        symptoms: ['Airbag warning light', 'SRS malfunction'],
        solutions: ['Professional airbag service', 'Check resistance values', 'Do not attempt DIY repair']
      },
      'B0017': {
        description: 'Right Front/Passenger Frontal Deployment Loop (Single Stage or Stage 1) Open',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Open airbag circuit', 'Wiring break', 'Disconnected airbag'],
        symptoms: ['Airbag warning light', 'SRS malfunction'],
        solutions: ['Professional airbag service', 'Check connections', 'Do not attempt DIY repair']
      },
      'B0018': {
        description: 'Right Front/Passenger Frontal Deployment Loop (Single Stage or Stage 1) Short to Ground/Voltage Out of Range',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Wiring short to ground', 'Voltage out of range', 'Circuit fault'],
        symptoms: ['Airbag warning light', 'SRS malfunction'],
        solutions: ['Professional airbag service', 'Check wiring', 'Do not attempt DIY repair']
      },
      'B0022': {
        description: 'Left Front/Driver Frontal Deployment Loop (Single Stage or Stage 1) Resistance Low',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Airbag squib resistance low', 'Wiring short', 'Connector issue'],
        symptoms: ['Airbag warning light', 'SRS malfunction'],
        solutions: ['Professional airbag service', 'Check resistance', 'Do not attempt DIY repair']
      },
      'B0024': {
        description: 'Left Front/Driver Frontal Deployment Loop (Single Stage or Stage 1) Short to Ground/Voltage Out of Range',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Wiring short to ground', 'Voltage fault', 'Circuit problem'],
        symptoms: ['Airbag warning light', 'SRS malfunction'],
        solutions: ['Professional airbag service', 'Check wiring', 'Do not attempt DIY repair']
      },
      'B0026': {
        description: 'Left Front/Driver Frontal Deployment Loop (Single Stage or Stage 1) Open',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Open airbag circuit', 'Wiring break', 'Disconnected airbag'],
        symptoms: ['Airbag warning light', 'SRS malfunction'],
        solutions: ['Professional airbag service', 'Check connections', 'Do not attempt DIY repair']
      },
      'B0028': {
        description: 'Right Front/Passenger Side Deployment Loop Resistance Low',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Side airbag resistance low', 'Wiring short', 'Connector corrosion'],
        symptoms: ['Airbag warning light', 'Side airbag malfunction'],
        solutions: ['Professional airbag service', 'Check resistance', 'Do not attempt DIY repair']
      },
      'B0029': {
        description: 'Right Front/Passenger Side Deployment Loop Open',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Open side airbag circuit', 'Wiring break', 'Disconnected airbag'],
        symptoms: ['Airbag warning light', 'Side airbag malfunction'],
        solutions: ['Professional airbag service', 'Check connections', 'Do not attempt DIY repair']
      },
      'B0030': {
        description: 'Right Front/Passenger Side Deployment Loop Short to Ground/Voltage Out of Range',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Wiring short to ground', 'Voltage fault', 'Side airbag circuit issue'],
        symptoms: ['Airbag warning light', 'Side airbag malfunction'],
        solutions: ['Professional airbag service', 'Check wiring', 'Do not attempt DIY repair']
      },
      'B0035': {
        description: 'ADS Closed/Shorted to Ground',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.HIGH,
        causes: ['Acceleration detection sensor shorted', 'Wiring issue', 'Sensor failure'],
        symptoms: ['Airbag warning light', 'ADS malfunction'],
        solutions: ['Check ADS sensor', 'Inspect wiring', 'Professional airbag service']
      },
      'B0036': {
        description: 'ADS Open/Missing/Shorted to Battery',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.HIGH,
        causes: ['ADS sensor open/missing', 'Wiring fault', 'Sensor disconnected'],
        symptoms: ['Airbag warning light', 'ADS malfunction'],
        solutions: ['Check ADS sensor', 'Verify connections', 'Professional airbag service']
      },
      'B0037': {
        description: 'AUX switch closed/shorted to ground',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.MEDIUM,
        causes: ['Auxiliary switch fault', 'Wiring short', 'Switch stuck closed'],
        symptoms: ['Warning light ON', 'Switch malfunction'],
        solutions: ['Check AUX switch', 'Inspect wiring', 'Replace switch if needed']
      },
      'B0038': {
        description: 'AUX switch open/shorted to battery',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.MEDIUM,
        causes: ['AUX switch open', 'Wiring fault', 'Switch failure'],
        symptoms: ['Warning light ON', 'Switch malfunction'],
        solutions: ['Check AUX switch', 'Inspect wiring', 'Replace switch if needed']
      },
      'B0040': {
        description: 'Left Front/Driver Side Deployment Loop Resistance Low',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Side airbag resistance low', 'Wiring short', 'Connector issue'],
        symptoms: ['Airbag warning light', 'Side airbag malfunction'],
        solutions: ['Professional airbag service', 'Check resistance', 'Do not attempt DIY repair']
      },
      'B0041': {
        description: 'Left Front/Driver Side Deployment Loop Open',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Open side airbag circuit', 'Wiring break', 'Disconnected airbag'],
        symptoms: ['Airbag warning light', 'Side airbag malfunction'],
        solutions: ['Professional airbag service', 'Check connections', 'Do not attempt DIY repair']
      },
      'B0042': {
        description: 'Left Front/Driver Frontal Deployment Loop Circuit',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Frontal airbag circuit fault', 'Wiring issue', 'Connector problem'],
        symptoms: ['Airbag warning light', 'Frontal airbag malfunction'],
        solutions: ['Professional airbag service', 'Check circuit', 'Do not attempt DIY repair']
      },
      'B0043': {
        description: 'Left Front/Driver Frontal Deployment Loop Circuit',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Frontal airbag circuit fault', 'Wiring issue', 'Connector problem'],
        symptoms: ['Airbag warning light', 'Frontal airbag malfunction'],
        solutions: ['Professional airbag service', 'Check circuit', 'Do not attempt DIY repair']
      },
      'B0044': {
        description: 'Left Front/Driver Frontal Deployment Loop Circuit',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Frontal airbag circuit fault', 'Wiring issue', 'Connector problem'],
        symptoms: ['Airbag warning light', 'Frontal airbag malfunction'],
        solutions: ['Professional airbag service', 'Check circuit', 'Do not attempt DIY repair']
      },
      'B0045': {
        description: 'Left Front Side Deploy Loop Short to Ground/Voltage Out of Range',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Side airbag wiring short', 'Voltage fault', 'Circuit problem'],
        symptoms: ['Airbag warning light', 'Side airbag malfunction'],
        solutions: ['Professional airbag service', 'Check wiring', 'Do not attempt DIY repair']
      },
      'B0051': {
        description: 'Deployment Commanded',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Airbag deployment occurred', 'Crash event detected', 'System triggered'],
        symptoms: ['Airbag deployed', 'SRS light on', 'System needs reset'],
        solutions: ['Professional airbag service', 'Replace deployed airbags', 'System reset required']
      },
      'B0053': {
        description: 'Deployment Commanded with Loop Malfunctions Present',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Deployment with circuit faults', 'Multiple system failures', 'Crash with malfunction'],
        symptoms: ['Airbag warning light', 'Deployment issues', 'Multiple faults'],
        solutions: ['Professional airbag service', 'Complete system diagnosis', 'Replace all faulty components']
      },
      'B0057': {
        description: 'Right Front/Passenger Pretensioner Deployment Loop Resistance Low',
        system: 'Body', subsystem: 'Seatbelt System', severity: this.severityLevels.CRITICAL,
        causes: ['Pretensioner resistance low', 'Wiring short', 'Seatbelt system fault'],
        symptoms: ['Seatbelt warning light', 'Pretensioner malfunction'],
        solutions: ['Professional seatbelt service', 'Check resistance', 'Do not attempt DIY repair']
      },
      'B0058': {
        description: 'Right Front/Passenger Pretensioner Deployment Loop Open',
        system: 'Body', subsystem: 'Seatbelt System', severity: this.severityLevels.CRITICAL,
        causes: ['Open pretensioner circuit', 'Wiring break', 'Disconnected pretensioner'],
        symptoms: ['Seatbelt warning light', 'Pretensioner malfunction'],
        solutions: ['Professional seatbelt service', 'Check connections', 'Do not attempt DIY repair']
      },
      'B0059': {
        description: 'Right Front/Passenger Pretensioner Deployment Loop Short to Ground/Voltage Out of Range',
        system: 'Body', subsystem: 'Seatbelt System', severity: this.severityLevels.CRITICAL,
        causes: ['Pretensioner wiring short', 'Voltage fault', 'Circuit problem'],
        symptoms: ['Seatbelt warning light', 'Pretensioner malfunction'],
        solutions: ['Professional seatbelt service', 'Check wiring', 'Do not attempt DIY repair']
      },
      'B0061': {
        description: 'Roof Rail Module-Left Deployment Loop Circuit',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Roof rail airbag circuit fault', 'Wiring issue', 'Module problem'],
        symptoms: ['Airbag warning light', 'Roof rail airbag malfunction'],
        solutions: ['Professional airbag service', 'Check roof rail circuit', 'Do not attempt DIY repair']
      },
      'B0062': {
        description: 'Roof Rail Module-Left Deployment Loop Circuit',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Roof rail airbag circuit fault', 'Wiring issue', 'Module problem'],
        symptoms: ['Airbag warning light', 'Roof rail airbag malfunction'],
        solutions: ['Professional airbag service', 'Check roof rail circuit', 'Do not attempt DIY repair']
      },
      'B0064': {
        description: 'Left Front/Driver Pretensioner Deployment Loop Resistance Low',
        system: 'Body', subsystem: 'Seatbelt System', severity: this.severityLevels.CRITICAL,
        causes: ['Driver pretensioner resistance low', 'Wiring short', 'Seatbelt fault'],
        symptoms: ['Seatbelt warning light', 'Driver pretensioner malfunction'],
        solutions: ['Professional seatbelt service', 'Check resistance', 'Do not attempt DIY repair']
      },
      'B0065': {
        description: 'Left Front/Driver Pretensioner Deployment Loop Open',
        system: 'Body', subsystem: 'Seatbelt System', severity: this.severityLevels.CRITICAL,
        causes: ['Open driver pretensioner circuit', 'Wiring break', 'Disconnected pretensioner'],
        symptoms: ['Seatbelt warning light', 'Driver pretensioner malfunction'],
        solutions: ['Professional seatbelt service', 'Check connections', 'Do not attempt DIY repair']
      },

      // B0100-B0199: Additional Airbag and Safety System Codes
      'B0100': {
        description: 'Driver Airbag Squib Circuit High Resistance',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['High resistance in squib circuit', 'Corroded connections', 'Damaged wiring'],
        symptoms: ['SRS warning light', 'Airbag may not deploy properly'],
        solutions: ['Professional airbag service required', 'Check connections', 'Resistance testing']
      },
      'B0101': {
        description: 'Driver Airbag Squib Circuit Low Resistance',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Short in squib circuit', 'Damaged airbag', 'Wiring fault'],
        symptoms: ['SRS warning light', 'Airbag system fault'],
        solutions: ['Professional airbag service required', 'Replace airbag', 'Wiring repair']
      },
      'B0102': {
        description: 'Passenger Airbag Squib Circuit High Resistance',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['High resistance in passenger squib', 'Connection issues', 'Wiring problems'],
        symptoms: ['SRS warning light', 'Passenger airbag fault'],
        solutions: ['Professional airbag service', 'Check passenger airbag circuit', 'Connection repair']
      },
      'B0103': {
        description: 'Passenger Airbag Squib Circuit Low Resistance',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.CRITICAL,
        causes: ['Short in passenger squib circuit', 'Damaged airbag', 'Wiring fault'],
        symptoms: ['SRS warning light', 'Passenger airbag malfunction'],
        solutions: ['Professional airbag service', 'Replace passenger airbag', 'Circuit repair']
      },
      'B0110': {
        description: 'Side Impact Sensor Left Front Circuit Malfunction',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.HIGH,
        causes: ['Side impact sensor failure', 'Wiring issues', 'Sensor mounting problems'],
        symptoms: ['SRS warning light', 'Side airbag system fault'],
        solutions: ['Replace side impact sensor', 'Check wiring', 'Verify sensor mounting']
      },
      'B0111': {
        description: 'Side Impact Sensor Right Front Circuit Malfunction',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.HIGH,
        causes: ['Side impact sensor failure', 'Wiring issues', 'Sensor mounting problems'],
        symptoms: ['SRS warning light', 'Side airbag system fault'],
        solutions: ['Replace side impact sensor', 'Check wiring', 'Verify sensor mounting']
      },
      'B0120': {
        description: 'Side Impact Sensor Left Rear Circuit Malfunction',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.HIGH,
        causes: ['Rear side sensor failure', 'Wiring problems', 'Sensor damage'],
        symptoms: ['SRS warning light', 'Rear side airbag fault'],
        solutions: ['Replace rear side sensor', 'Check connections', 'Sensor inspection']
      },
      'B0121': {
        description: 'Side Impact Sensor Right Rear Circuit Malfunction',
        system: 'Body', subsystem: 'Airbag System', severity: this.severityLevels.HIGH,
        causes: ['Rear side sensor failure', 'Wiring problems', 'Sensor damage'],
        symptoms: ['SRS warning light', 'Rear side airbag fault'],
        solutions: ['Replace rear side sensor', 'Check connections', 'Sensor inspection']
      },

      // B0126-B0199: Additional HVAC and Sensor Codes
      'B0145': {
        description: 'Auxiliary HVAC Actuator Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Actuator motor failure', 'Wiring issue', 'Control module malfunction'],
        symptoms: ['HVAC not responding', 'Auxiliary system not working'],
        solutions: ['Check actuator wiring', 'Replace auxiliary actuator', 'Test control module']
      },
      'B0159': {
        description: 'Outside Air Temperature Sensor Circuit Range/Performance',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Temperature sensor fault', 'Wiring issue', 'Sensor out of range'],
        symptoms: ['Incorrect outside temp display', 'HVAC performance issues'],
        solutions: ['Replace outside air temp sensor', 'Check sensor wiring', 'Calibrate sensor']
      },
      'B0160': {
        description: 'Ambient Air Temperature Sensor Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Ambient temp sensor failure', 'Wiring problems', 'Sensor contamination'],
        symptoms: ['Inaccurate ambient temp reading', 'Climate control issues'],
        solutions: ['Replace ambient temp sensor', 'Clean sensor', 'Check wiring/connectors']
      },
      'B0162': {
        description: 'Ambient Air Temperature Sensor Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Sensor circuit fault', 'Wiring damage', 'Connector corrosion'],
        symptoms: ['Temperature sensor malfunction', 'HVAC system errors'],
        solutions: ['Test sensor circuit', 'Repair wiring', 'Clean/replace connectors']
      },
      'B0164': {
        description: 'Passenger Compartment Temperature Sensor #1 Circuit Range/Performance',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Interior temp sensor fault', 'Sensor positioning issue', 'Circuit malfunction'],
        symptoms: ['Poor climate control', 'Cabin temp sensor error', 'Uncomfortable interior'],
        solutions: ['Replace cabin temp sensor', 'Check sensor placement', 'Test sensor circuit']
      },
      'B0169': {
        description: 'In-car Temperature Sensor Failure (passenger)',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Passenger side temp sensor failure', 'Sensor circuit open', 'Wiring fault'],
        symptoms: ['Passenger side climate issues', 'Temp sensor warning', 'Uneven heating/cooling'],
        solutions: ['Replace passenger temp sensor', 'Check sensor circuit', 'Test wiring integrity']
      },
      'B0174': {
        description: 'Output Air Temperature Sensor #1 (Upper) Circuit Range/Performance',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Upper duct temp sensor fault', 'Sensor drift', 'Circuit performance issue'],
        symptoms: ['Inaccurate outlet temp', 'HVAC performance problems', 'Temperature fluctuation'],
        solutions: ['Replace upper temp sensor', 'Calibrate sensor', 'Check sensor circuit']
      },
      'B0179': {
        description: 'Output Air Temperature Sensor #2 (Lower) Circuit Range/Performance',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Lower duct temp sensor fault', 'Sensor contamination', 'Wiring issues'],
        symptoms: ['Lower vent temp issues', 'Inconsistent air temperature', 'HVAC malfunction'],
        solutions: ['Replace lower temp sensor', 'Clean sensor element', 'Repair sensor wiring']
      },
      'B0183': {
        description: 'Sunload Sensor Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Sunload sensor failure', 'Sensor obstruction', 'Circuit fault'],
        symptoms: ['Automatic climate control issues', 'No sun compensation', 'Poor HVAC response'],
        solutions: ['Replace sunload sensor', 'Clean sensor lens', 'Check sensor circuit']
      },
      'B0184': {
        description: 'Solar Load Sensor #1 Circuit Range (sunload)',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Solar sensor #1 range fault', 'Sensor calibration issue', 'Circuit malfunction'],
        symptoms: ['Poor sun load detection', 'Inadequate climate response', 'Sensor range error'],
        solutions: ['Calibrate solar sensor', 'Replace sensor #1', 'Test sensor circuit']
      },
      'B0188': {
        description: 'Sunload Sensor Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Secondary sunload sensor fault', 'Wiring problem', 'Sensor degradation'],
        symptoms: ['Inconsistent sun load detection', 'HVAC response delay', 'Climate control issues'],
        solutions: ['Replace secondary sunload sensor', 'Check wiring', 'Clean sensor surface']
      },
      'B0189': {
        description: 'Solar Load Sensor #2 Circuit Range (sunload)',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Solar sensor #2 range issue', 'Sensor drift', 'Environmental contamination'],
        symptoms: ['Solar sensor #2 malfunction', 'Uneven climate response', 'Sensor error codes'],
        solutions: ['Replace solar sensor #2', 'Recalibrate sensor', 'Clean sensor housing']
      },

      // B0200-B0228: Body Control Module and Electrical System Codes
      'B0200': {
        description: 'Left Front Door Ajar Switch Circuit Malfunction',
        system: 'Body', subsystem: 'Body Control', severity: this.severityLevels.LOW,
        causes: ['Door ajar switch failure', 'Wiring issues', 'Door latch problems'],
        symptoms: ['Door ajar warning always on', 'Interior lights stay on', 'Chime sounds'],
        solutions: ['Replace door switch', 'Check wiring', 'Adjust door latch', 'Lubricate switch']
      },
      'B0201': {
        description: 'Right Front Door Ajar Switch Circuit Malfunction',
        system: 'Body', subsystem: 'Body Control', severity: this.severityLevels.LOW,
        causes: ['Door ajar switch failure', 'Wiring issues', 'Door latch problems'],
        symptoms: ['Door ajar warning always on', 'Interior lights stay on', 'Chime sounds'],
        solutions: ['Replace door switch', 'Check wiring', 'Adjust door latch', 'Lubricate switch']
      },
      'B0202': {
        description: 'Left Rear Door Ajar Switch Circuit Malfunction',
        system: 'Body', subsystem: 'Body Control', severity: this.severityLevels.LOW,
        causes: ['Rear door switch failure', 'Wiring issues', 'Door latch problems'],
        symptoms: ['Door ajar warning', 'Interior lights malfunction', 'Warning chime'],
        solutions: ['Replace rear door switch', 'Check wiring', 'Door latch service']
      },
      'B0203': {
        description: 'Right Rear Door Ajar Switch Circuit Malfunction',
        system: 'Body', subsystem: 'Body Control', severity: this.severityLevels.LOW,
        causes: ['Rear door switch failure', 'Wiring issues', 'Door latch problems'],
        symptoms: ['Door ajar warning', 'Interior lights malfunction', 'Warning chime'],
        solutions: ['Replace rear door switch', 'Check wiring', 'Door latch service']
      },
      'B0210': {
        description: 'Hood Ajar Switch Circuit Malfunction',
        system: 'Body', subsystem: 'Body Control', severity: this.severityLevels.LOW,
        causes: ['Hood switch failure', 'Wiring problems', 'Switch adjustment needed'],
        symptoms: ['Hood ajar warning', 'Security system issues', 'Warning light on'],
        solutions: ['Replace hood switch', 'Adjust switch position', 'Check wiring']
      },
      'B0211': {
        description: 'Trunk/Tailgate Ajar Switch Circuit Malfunction',
        system: 'Body', subsystem: 'Body Control', severity: this.severityLevels.LOW,
        causes: ['Trunk switch failure', 'Wiring issues', 'Latch problems'],
        symptoms: ['Trunk ajar warning', 'Interior lights on', 'Security issues'],
        solutions: ['Replace trunk switch', 'Check wiring', 'Adjust latch']
      },

      // B0229-B0299: Additional HVAC and Climate Control Codes
      'B0229': {
        description: 'HVAC Actuator Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['HVAC actuator failure', 'Wiring issue', 'Control module malfunction'],
        symptoms: ['HVAC system not responding', 'Actuator not working', 'Climate control issues'],
        solutions: ['Check actuator wiring', 'Replace HVAC actuator', 'Test control module']
      },
      'B0248': {
        description: 'Mode Door Inoperative Error',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Mode door actuator failure', 'Door mechanism binding', 'Electrical fault'],
        symptoms: ['Air not switching between vents', 'Mode door stuck', 'HVAC mode not changing'],
        solutions: ['Replace mode door actuator', 'Free binding mechanism', 'Check electrical connections']
      },
      'B0249': {
        description: 'Heater/Defrost/AC Door Range Error',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Door position sensor fault', 'Actuator range issue', 'Calibration error'],
        symptoms: ['Temperature door not reaching full range', 'Inconsistent heating/cooling', 'Door position error'],
        solutions: ['Recalibrate door position', 'Replace position sensor', 'Check actuator range']
      },
      'B0263': {
        description: 'HVAC Actuator Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Secondary actuator failure', 'Wiring problem', 'Control circuit fault'],
        symptoms: ['Secondary HVAC function not working', 'Actuator circuit malfunction'],
        solutions: ['Test actuator circuit', 'Replace secondary actuator', 'Repair wiring']
      },
      'B0268': {
        description: 'A/I Door Inoperative Error',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Air inlet door actuator failure', 'Door binding', 'Control signal issue'],
        symptoms: ['Air inlet door not operating', 'Fresh air/recirculation not switching', 'Poor air quality'],
        solutions: ['Replace air inlet door actuator', 'Free door mechanism', 'Check control signal']
      },
      'B0269': {
        description: 'Air Inlet Door Range Error',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Door position sensor error', 'Actuator travel limit issue', 'Mechanical obstruction'],
        symptoms: ['Air inlet door not fully opening/closing', 'Position feedback error', 'Reduced airflow'],
        solutions: ['Check door travel limits', 'Replace position sensor', 'Clear obstructions']
      },
      'B0283': {
        description: 'Electric Rear Defrost Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Rear defrost grid failure', 'Wiring fault', 'Relay problems', 'Control module issue'],
        symptoms: ['Rear window defrost not working', 'Fogged rear window', 'Defrost warning light'],
        solutions: ['Check defrost grid continuity', 'Test relay', 'Repair wiring', 'Check control module']
      },
      'B0285': {
        description: 'Electric Rear Defrost Circuit Low (BCM)',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Low voltage to defrost grid', 'Wiring resistance issue', 'Poor ground connection'],
        symptoms: ['Weak rear defrost performance', 'Slow window clearing', 'BCM voltage error'],
        solutions: ['Check voltage supply', 'Test ground connections', 'Repair high resistance wiring']
      },
      'B0286': {
        description: 'Electric Rear Defrost Circuit High (BCM)',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['High voltage in defrost circuit', 'Short in wiring', 'Control module fault'],
        symptoms: ['Excessive current in defrost circuit', 'BCM voltage error', 'Potential grid damage'],
        solutions: ['Check for wiring shorts', 'Test control module', 'Measure circuit voltage']
      },

      // B0300-B0399: HVAC and Climate Control Codes
      'B0300': {
        description: 'HVAC Blower Motor Circuit Malfunction',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Blower motor failure', 'Resistor problems', 'Wiring issues', 'Control module fault'],
        symptoms: ['No air flow', 'Blower not working', 'Limited fan speeds', 'No heating/cooling'],
        solutions: ['Replace blower motor', 'Check blower resistor', 'Test wiring', 'Check control module']
      },
      'B0301': {
        description: 'HVAC Blower Motor Resistor Circuit Malfunction',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Blower resistor failure', 'Overheating', 'Poor connections', 'High current draw'],
        symptoms: ['Only high speed works', 'No low speeds', 'Intermittent operation'],
        solutions: ['Replace blower resistor', 'Check connections', 'Test blower motor current', 'Clean resistor housing']
      },
      'B0302': {
        description: 'HVAC Temperature Blend Door Actuator Circuit Malfunction',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Blend door actuator failure', 'Mechanical binding', 'Wiring problems', 'Calibration issues'],
        symptoms: ['No temperature control', 'Always hot or cold air', 'Clicking noises', 'Temperature fluctuation'],
        solutions: ['Replace blend door actuator', 'Check for binding', 'Recalibrate system', 'Check wiring']
      },
      'B0303': {
        description: 'HVAC Mode Door Actuator Circuit Malfunction',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Mode door actuator failure', 'Door binding', 'Wiring issues', 'Control problems'],
        symptoms: ['Air comes from wrong vents', 'No vent switching', 'Actuator noise'],
        solutions: ['Replace mode door actuator', 'Check door operation', 'Test wiring', 'Recalibrate']
      },
      'B0304': {
        description: 'HVAC Recirculation Door Actuator Circuit Malfunction',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.LOW,
        causes: ['Recirculation actuator failure', 'Door problems', 'Wiring faults'],
        symptoms: ['No fresh air/recirculation control', 'Fogged windows', 'Poor air quality'],
        solutions: ['Replace recirculation actuator', 'Check door mechanism', 'Test control circuit']
      },

      // B0414-B0429: Additional HVAC Actuator System Codes  
      'B0414': {
        description: 'Air Temperature/Mode Door Actuator Malfunction',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Temperature/mode door actuator failure', 'Actuator binding', 'Control circuit fault'],
        symptoms: ['Temperature and mode control not working', 'Actuator noise', 'Inconsistent airflow'],
        solutions: ['Replace temperature/mode door actuator', 'Check actuator operation', 'Test control circuit']
      },
      'B0418': {
        description: 'HVAC Actuator Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['HVAC actuator circuit fault', 'Wiring issue', 'Control module malfunction'],
        symptoms: ['HVAC actuator not responding', 'Circuit malfunction', 'Climate control issues'],
        solutions: ['Test actuator circuit', 'Check wiring/connectors', 'Replace control module']
      },
      'B0419': {
        description: 'Air Mix Door #2 Range Error',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Air mix door #2 range issue', 'Position sensor error', 'Actuator travel limit problem'],
        symptoms: ['Secondary air mix door not reaching full range', 'Temperature control issues', 'Position error'],
        solutions: ['Check door travel limits', 'Replace position sensor', 'Calibrate actuator range']
      },
      'B0423': {
        description: 'Air Mix Door #2 Inoperative Error',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Air mix door #2 actuator failure', 'Door binding', 'Electrical fault'],
        symptoms: ['Secondary air mix door not operating', 'Temperature control problems', 'Actuator not responding'],
        solutions: ['Replace air mix door #2 actuator', 'Free door mechanism', 'Check electrical connections']
      },
      'B0424': {
        description: 'Air Temperature/Mode Door Actuator Malfunction',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Secondary temp/mode actuator fault', 'Mechanical binding', 'Control signal issue'],
        symptoms: ['Secondary temperature/mode control not working', 'Actuator malfunction', 'Control issues'],
        solutions: ['Replace secondary temp/mode actuator', 'Check for binding', 'Test control signal']
      },
      'B0428': {
        description: 'Air Mix Door #3 Inoperative Error',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Air mix door #3 actuator failure', 'Door stuck', 'Control circuit problem'],
        symptoms: ['Third air mix door not operating', 'Multi-zone temperature issues', 'Door not responding'],
        solutions: ['Replace air mix door #3 actuator', 'Free stuck door', 'Check control circuit']
      },
      'B0429': {
        description: 'Temperature Control #3 Rear Circuit Range/Performance',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Rear temperature control circuit issue', 'Range performance problem', 'Sensor malfunction'],
        symptoms: ['Rear temperature control not working properly', 'Control range error', 'Performance issues'],
        solutions: ['Test rear temperature control circuit', 'Check performance parameters', 'Replace sensor']
      },

      // B0400-B0413: Lighting System Codes
      'B0400': {
        description: 'Headlight Low Beam Left Circuit Malfunction',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Burnt bulb', 'Wiring fault', 'Relay problems', 'Switch malfunction'],
        symptoms: ['Left headlight not working', 'Dim light output', 'Intermittent operation'],
        solutions: ['Replace headlight bulb', 'Check wiring', 'Test relay', 'Inspect switch']
      },
      'B0401': {
        description: 'Headlight Low Beam Right Circuit Malfunction',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Burnt bulb', 'Wiring fault', 'Relay problems', 'Switch malfunction'],
        symptoms: ['Right headlight not working', 'Dim light output', 'Intermittent operation'],
        solutions: ['Replace headlight bulb', 'Check wiring', 'Test relay', 'Inspect switch']
      },
      'B0402': {
        description: 'Headlight High Beam Left Circuit Malfunction',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Burnt high beam bulb', 'Wiring issues', 'Switch problems', 'Relay fault'],
        symptoms: ['Left high beam not working', 'No bright lights', 'Switch problems'],
        solutions: ['Replace high beam bulb', 'Check wiring', 'Test high beam switch', 'Check relay']
      },
      'B0403': {
        description: 'Headlight High Beam Right Circuit Malfunction',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Burnt high beam bulb', 'Wiring issues', 'Switch problems', 'Relay fault'],
        symptoms: ['Right high beam not working', 'No bright lights', 'Switch problems'],
        solutions: ['Replace high beam bulb', 'Check wiring', 'Test high beam switch', 'Check relay']
      },
      'B0410': {
        description: 'Turn Signal Left Front Circuit Malfunction',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Burnt turn signal bulb', 'Wiring fault', 'Flasher relay problems', 'Switch issues'],
        symptoms: ['Left turn signal not working', 'Fast blinking', 'No turn signal'],
        solutions: ['Replace turn signal bulb', 'Check wiring', 'Test flasher relay', 'Inspect switch']
      },
      'B0411': {
        description: 'Turn Signal Right Front Circuit Malfunction',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Burnt turn signal bulb', 'Wiring fault', 'Flasher relay problems', 'Switch issues'],
        symptoms: ['Right turn signal not working', 'Fast blinking', 'No turn signal'],
        solutions: ['Replace turn signal bulb', 'Check wiring', 'Test flasher relay', 'Inspect switch']
      },
      'B0412': {
        description: 'Turn Signal Left Rear Circuit Malfunction',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Burnt rear turn signal bulb', 'Wiring problems', 'Ground issues', 'Socket corrosion'],
        symptoms: ['Left rear turn signal not working', 'Fast blinking', 'Turn signal problems'],
        solutions: ['Replace rear bulb', 'Check wiring', 'Clean socket', 'Test ground connection']
      },
      'B0413': {
        description: 'Turn Signal Right Rear Circuit Malfunction',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Burnt rear turn signal bulb', 'Wiring problems', 'Ground issues', 'Socket corrosion'],
        symptoms: ['Right rear turn signal not working', 'Fast blinking', 'Turn signal problems'],
        solutions: ['Replace rear bulb', 'Check wiring', 'Clean socket', 'Test ground connection']
      },

      // B0500-B0599: Power Window and Door System Codes
      'B0500': {
        description: 'Power Window Left Front Motor Circuit Malfunction',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.LOW,
        causes: ['Window motor failure', 'Wiring problems', 'Switch malfunction', 'Regulator binding'],
        symptoms: ['Left front window not working', 'Slow operation', 'Intermittent function'],
        solutions: ['Replace window motor', 'Check wiring', 'Test switch', 'Lubricate regulator']
      },
      'B0501': {
        description: 'Power Window Right Front Motor Circuit Malfunction',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.LOW,
        causes: ['Window motor failure', 'Wiring problems', 'Switch malfunction', 'Regulator binding'],
        symptoms: ['Right front window not working', 'Slow operation', 'Intermittent function'],
        solutions: ['Replace window motor', 'Check wiring', 'Test switch', 'Lubricate regulator']
      },
      'B0502': {
        description: 'Power Window Left Rear Motor Circuit Malfunction',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.LOW,
        causes: ['Rear window motor failure', 'Wiring issues', 'Switch problems', 'Mechanical binding'],
        symptoms: ['Left rear window not working', 'Slow operation', 'Motor noise'],
        solutions: ['Replace rear window motor', 'Check wiring', 'Test switch', 'Service regulator']
      },
      'B0503': {
        description: 'Power Window Right Rear Motor Circuit Malfunction',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.LOW,
        causes: ['Rear window motor failure', 'Wiring issues', 'Switch problems', 'Mechanical binding'],
        symptoms: ['Right rear window not working', 'Slow operation', 'Motor noise'],
        solutions: ['Replace rear window motor', 'Check wiring', 'Test switch', 'Service regulator']
      },
      'B0510': {
        description: 'Central Door Lock Actuator Left Front Circuit Malfunction',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.LOW,
        causes: ['Door lock actuator failure', 'Wiring problems', 'Control module issues', 'Mechanical problems'],
        symptoms: ['Left front door not locking/unlocking', 'Actuator noise', 'Intermittent operation'],
        solutions: ['Replace door lock actuator', 'Check wiring', 'Test control module', 'Lubricate mechanism']
      },
      'B0511': {
        description: 'Central Door Lock Actuator Right Front Circuit Malfunction',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.LOW,
        causes: ['Door lock actuator failure', 'Wiring problems', 'Control module issues', 'Mechanical problems'],
        symptoms: ['Right front door not locking/unlocking', 'Actuator noise', 'Intermittent operation'],
        solutions: ['Replace door lock actuator', 'Check wiring', 'Test control module', 'Lubricate mechanism']
      },

      // B1535-B1599: Continued Body System Control Codes
      'B1535': {
        description: 'Memory 2 Switch Circuit Failure',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Faulty memory 2 switch', 'Wiring issue', 'Seat control module problem', 'Switch contacts worn'],
        symptoms: ['Memory position 2 not working', 'Switch unresponsive', 'Cannot recall position 2'],
        solutions: ['Replace memory 2 switch', 'Check wiring connections', 'Test seat control module', 'Clean switch assembly']
      },
      'B1536': {
        description: 'Memory 2 Switch Circuit Open',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Open circuit in memory switch wiring', 'Disconnected switch', 'Wire break', 'Failed switch contacts'],
        symptoms: ['Memory 2 button dead', 'No response from button', 'Position 2 not accessible'],
        solutions: ['Check switch connections', 'Test wiring continuity', 'Repair open circuit', 'Replace memory switch']
      },
      'B1537': {
        description: 'Memory 2 Switch Circuit Short To Battery',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Short to battery in switch circuit', 'Internal switch fault', 'Wiring damage', 'Connector problem'],
        symptoms: ['Memory 2 always active', 'Seat moves to position 2', 'Switch malfunction'],
        solutions: ['Locate short to battery', 'Replace faulty switch', 'Repair damaged wiring', 'Check all connectors']
      },
      'B1538': {
        description: 'Memory 2 Switch Circuit Short To Ground',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Ground short in memory circuit', 'Damaged wiring', 'Switch failure', 'Moisture damage'],
        symptoms: ['Memory 2 not working', 'Blown circuit protection', 'System errors'],
        solutions: ['Find and repair ground short', 'Replace damaged components', 'Dry moisture damage', 'Test memory system']
      },

      // B1600-B1679: Advanced Body Control System Codes  
      'B1600': {
        description: 'PATS Ignition Key Transponder Signal Not Received',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Key transponder failure', 'Weak transponder signal', 'Antenna circuit fault', 'Key reader malfunction'],
        symptoms: ['Engine won\'t start', 'Security light flashing', 'Key not recognized', 'No start condition'],
        solutions: ['Check key transponder', 'Test antenna circuit', 'Replace key reader', 'Reprogram key']
      },
      'B1601': {
        description: 'PATS Ignition Key Transponder Signal Not Received',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Transponder communication lost', 'Signal interference', 'Reader circuit failure', 'Key damage'],
        symptoms: ['Intermittent no-start', 'Key recognition failure', 'Security system active'],
        solutions: ['Test transponder signal', 'Check for interference', 'Replace damaged key', 'Service reader circuit']
      },
      'B1602': {
        description: 'PATS Ignition Key Transponder Signal Not Received',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Multiple transponder failures', 'System communication error', 'Module malfunction', 'Wiring harness damage'],
        symptoms: ['Complete key system failure', 'All keys not working', 'Security lockout'],
        solutions: ['Professional PATS diagnosis', 'Replace security module', 'Repair wiring harness', 'Reprogram all keys']
      },
      'B1603': {
        description: 'PATS Ignition Key Transponder Signal Not Received',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Persistent transponder failure', 'Antenna coil damage', 'Module power supply issue', 'Ground circuit fault'],
        symptoms: ['Continuous no-start condition', 'Security system malfunction', 'Key system inoperative'],
        solutions: ['Replace antenna coil', 'Check module power supply', 'Repair ground circuit', 'Complete system reset']
      },
      'B1604': {
        description: 'PATS Ignition Key Transponder Signal Not Received',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Transponder frequency drift', 'Temperature-related failure', 'Key battery depletion', 'Circuit resonance issue'],
        symptoms: ['Temperature-dependent starting', 'Key works intermittently', 'Cold start problems'],
        solutions: ['Replace key battery', 'Test at different temperatures', 'Check circuit resonance', 'Reprogram transponder']
      },
      'B1605': {
        description: 'PATS Ignition Key Transponder Signal Not Received',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Transponder circuit open', 'Key chip damage', 'Reader coil failure', 'System timing error'],
        symptoms: ['Key completely unrecognized', 'No transponder response', 'System timeout'],
        solutions: ['Replace key chip', 'Test reader coil', 'Check system timing', 'Professional key service']
      },
      'B1606': {
        description: 'PATS Ignition Key Transponder Signal Not Received',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Final transponder attempt failed', 'System lockout active', 'Security breach detected', 'Module in protect mode'],
        symptoms: ['Permanent lockout condition', 'Security light solid', 'System disabled'],
        solutions: ['Security system reset required', 'Professional service only', 'Module replacement', 'Complete reprogramming']
      },

      // B1505-B1534: Additional Body System Control Codes
      'B1505': {
        description: 'Lamp Turn Signal Right Circuit Short To Battery',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Short to battery in wiring', 'Faulty turn signal bulb', 'Damaged wiring harness', 'BCM malfunction'],
        symptoms: ['Turn signal malfunction', 'Blown fuse', 'Turn signal stays on', 'Warning light on dashboard'],
        solutions: ['Check wiring for short to battery', 'Replace turn signal bulb', 'Inspect wiring harness', 'Test BCM operation']
      },
      'B1506': {
        description: 'Lamp Turn Signal Right Circuit Short To Ground',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Short to ground in wiring', 'Damaged turn signal bulb', 'Corroded connections', 'Faulty bulb socket'],
        symptoms: ['Turn signal not working', 'Blown fuse', 'Fast blinking turn signal', 'Warning light'],
        solutions: ['Locate and repair short to ground', 'Replace turn signal bulb', 'Clean corroded connections', 'Replace bulb socket']
      },
      'B1507': {
        description: 'Flash to Pass Switch Circuit Failure',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Faulty flash to pass switch', 'Wiring issue', 'BCM malfunction', 'Switch connector problem'],
        symptoms: ['Flash to pass not working', 'High beam malfunction', 'Switch inoperative'],
        solutions: ['Replace flash to pass switch', 'Check wiring/connectors', 'Test BCM operation', 'Inspect switch assembly']
      },
      'B1508': {
        description: 'Flash to Pass Switch Circuit Open',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Open circuit in switch wiring', 'Disconnected switch', 'Broken wire', 'Failed switch contacts'],
        symptoms: ['Flash to pass not responding', 'No high beam flash', 'Switch appears dead'],
        solutions: ['Check switch connections', 'Test switch continuity', 'Repair open circuit', 'Replace switch if faulty']
      },
      'B1509': {
        description: 'Flash to Pass Switch Circuit Short To Battery',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Short to battery in switch circuit', 'Damaged wiring', 'Switch internal failure', 'Connector fault'],
        symptoms: ['High beams stuck on', 'Flash function always active', 'Blown fuse', 'Overheating'],
        solutions: ['Locate and repair short to battery', 'Replace faulty switch', 'Check wiring harness', 'Test connections']
      },
      'B1510': {
        description: 'Flash to Pass Switch Circuit Short To Ground',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Short to ground in circuit', 'Damaged wiring insulation', 'Moisture in connections', 'Switch failure'],
        symptoms: ['Flash to pass not working', 'Blown fuse', 'Circuit protection activated'],
        solutions: ['Find and repair ground short', 'Dry out wet connections', 'Replace damaged wiring', 'Test switch operation']
      },
      'B1511': {
        description: 'Driver Door Handle Circuit Failure',
        system: 'Body', subsystem: 'Door Control', severity: this.severityLevels.MEDIUM,
        causes: ['Faulty door handle switch', 'Wiring problem', 'BCM issue', 'Connector corrosion'],
        symptoms: ['Door handle not working', 'Entry system malfunction', 'Keyless entry issues'],
        solutions: ['Replace door handle switch', 'Check wiring/connectors', 'Clean corroded connections', 'Test BCM']
      },
      'B1512': {
        description: 'Driver Door Handle Circuit Open',
        system: 'Body', subsystem: 'Door Control', severity: this.severityLevels.MEDIUM,
        causes: ['Open circuit in handle wiring', 'Disconnected switch', 'Broken wire in door', 'Failed handle switch'],
        symptoms: ['Door handle unresponsive', 'No electrical function', 'Keyless entry not working from handle'],
        solutions: ['Check door handle connections', 'Test circuit continuity', 'Repair broken wires', 'Replace handle switch']
      },
      'B1513': {
        description: 'Driver Door Handle Circuit Short To Battery',
        system: 'Body', subsystem: 'Door Control', severity: this.severityLevels.MEDIUM,
        causes: ['Short to battery in handle circuit', 'Damaged door wiring', 'Handle switch failure', 'Water damage'],
        symptoms: ['Handle function always active', 'Electrical drain', 'BCM malfunction', 'Blown fuse'],
        solutions: ['Locate short to battery', 'Replace damaged wiring', 'Seal water entry points', 'Replace handle switch']
      },
      'B1514': {
        description: 'Driver Door Handle Circuit Short To Ground',
        system: 'Body', subsystem: 'Door Control', severity: this.severityLevels.MEDIUM,
        causes: ['Ground short in handle circuit', 'Pinched wiring in door', 'Corroded connections', 'Switch malfunction'],
        symptoms: ['Door handle not responding', 'Blown fuse', 'BCM error messages'],
        solutions: ['Find and repair ground short', 'Check door wiring harness', 'Replace corroded connectors', 'Test handle switch']
      },
      'B1515': {
        description: 'Seat Driver Occupied Switch Circuit Failure',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Faulty occupancy sensor', 'Wiring issue', 'Seat control module problem', 'Sensor mat damage'],
        symptoms: ['Airbag system warnings', 'Seat belt warnings', 'Seat adjustment issues'],
        solutions: ['Replace occupancy sensor', 'Check sensor wiring', 'Test seat control module', 'Inspect sensor mat']
      },
      'B1516': {
        description: 'Seat Driver Occupied Switch Circuit Open',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Open circuit in sensor wiring', 'Disconnected sensor', 'Broken wire under seat', 'Sensor failure'],
        symptoms: ['Inconsistent occupancy detection', 'Airbag warning light', 'Seat functions not working'],
        solutions: ['Check sensor connections', 'Test wiring continuity', 'Repair broken circuits', 'Replace occupancy sensor']
      },
      'B1517': {
        description: 'Seat Driver Occupied Switch Circuit Short To Battery',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Short to battery in sensor circuit', 'Damaged wiring under seat', 'Sensor internal fault', 'Water damage'],
        symptoms: ['Seat always shows occupied', 'Airbag system errors', 'Electrical issues'],
        solutions: ['Locate short to battery', 'Replace damaged wiring', 'Check for water damage', 'Replace occupancy sensor']
      },
      'B1518': {
        description: 'Seat Driver Occupied Switch Circuit Short To Ground',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Ground short in sensor circuit', 'Crushed wiring', 'Corroded connections', 'Sensor mat failure'],
        symptoms: ['Seat shows unoccupied when occupied', 'Airbag warnings', 'System malfunctions'],
        solutions: ['Find and repair ground short', 'Check wiring under seat', 'Clean connections', 'Replace sensor mat']
      },
      'B1519': {
        description: 'Hood Switch Circuit Failure',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Faulty hood switch', 'Wiring problem', 'Switch adjustment issue', 'Connector corrosion'],
        symptoms: ['Hood ajar warning when closed', 'Security system issues', 'Interior lights stay on'],
        solutions: ['Replace hood switch', 'Adjust switch position', 'Check wiring/connectors', 'Clean corroded terminals']
      },
      'B1520': {
        description: 'Hood Switch Circuit Open',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Open circuit in hood switch wiring', 'Disconnected switch', 'Broken wire', 'Switch contact failure'],
        symptoms: ['No hood open detection', 'Security system not arming', 'Warning light issues'],
        solutions: ['Check switch connections', 'Test circuit continuity', 'Repair open circuit', 'Replace hood switch']
      },
      'B1521': {
        description: 'Hood Switch Circuit Short To Battery',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Short to battery in switch circuit', 'Damaged wiring', 'Switch internal failure', 'Water intrusion'],
        symptoms: ['Hood always shows open', 'Security system malfunction', 'Warning lights on'],
        solutions: ['Locate short to battery', 'Replace damaged wiring', 'Check for water damage', 'Replace hood switch']
      },
      'B1522': {
        description: 'Hood Switch Circuit Short To Ground',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Ground short in switch circuit', 'Pinched wiring', 'Corrosion', 'Switch mounting issue'],
        symptoms: ['Hood status unknown', 'Blown fuse', 'Security system errors'],
        solutions: ['Find and repair ground short', 'Check wiring routing', 'Clean corroded areas', 'Secure switch mounting']
      },
      'B1523': {
        description: 'Keyless Entry Circuit Failure',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Faulty keyless entry module', 'Antenna problem', 'Wiring issue', 'BCM malfunction'],
        symptoms: ['Remote not working', 'Keyless entry inoperative', 'Door locks not responding'],
        solutions: ['Replace keyless entry module', 'Check antenna connections', 'Test wiring', 'Reprogram system']
      },
      'B1524': {
        description: 'Keyless Entry Circuit Open',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Open circuit in keyless entry wiring', 'Disconnected module', 'Antenna wire break', 'Module failure'],
        symptoms: ['No remote response', 'Keyless entry dead', 'System not communicating'],
        solutions: ['Check module connections', 'Test circuit continuity', 'Repair antenna wiring', 'Replace entry module']
      },
      'B1525': {
        description: 'Keyless Entry Circuit Short To Battery',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Short to battery in entry circuit', 'Module internal fault', 'Wiring damage', 'Connector problem'],
        symptoms: ['System always powered', 'Battery drain', 'Module overheating', 'Erratic operation'],
        solutions: ['Locate short to battery', 'Replace faulty module', 'Repair damaged wiring', 'Check connectors']
      },
      'B1526': {
        description: 'Keyless Entry Circuit Short To Ground',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Ground short in entry circuit', 'Damaged wiring', 'Module failure', 'Water damage'],
        symptoms: ['Keyless entry not working', 'Blown fuse', 'System errors'],
        solutions: ['Find and repair ground short', 'Replace damaged components', 'Dry out water damage', 'Test system operation']
      },
      'B1527': {
        description: 'Memory Set Switch Circuit Failure',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Faulty memory set switch', 'Wiring problem', 'Seat module issue', 'Switch wear'],
        symptoms: ['Memory set function not working', 'Cannot store seat positions', 'Switch unresponsive'],
        solutions: ['Replace memory set switch', 'Check switch wiring', 'Test seat memory module', 'Clean switch contacts']
      },
      'B1528': {
        description: 'Memory Set Switch Circuit Open',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Open circuit in switch wiring', 'Disconnected switch', 'Broken wire', 'Switch contact failure'],
        symptoms: ['Memory set button dead', 'No response when pressed', 'Cannot program positions'],
        solutions: ['Check switch connections', 'Test circuit continuity', 'Repair open circuit', 'Replace memory switch']
      },
      'B1529': {
        description: 'Memory Set Switch Circuit Short To Battery',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Short to battery in switch circuit', 'Switch internal fault', 'Wiring damage', 'Connector issue'],
        symptoms: ['Memory function always active', 'Switch stuck on', 'System malfunction'],
        solutions: ['Locate short to battery', 'Replace faulty switch', 'Repair wiring damage', 'Check connectors']
      },
      'B1530': {
        description: 'Memory Set Switch Circuit Short To Ground',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Ground short in switch circuit', 'Damaged wiring', 'Switch failure', 'Corrosion'],
        symptoms: ['Memory set not working', 'Blown fuse', 'System protection active'],
        solutions: ['Find and repair ground short', 'Replace damaged wiring', 'Clean corroded connections', 'Test switch operation']
      },
      'B1531': {
        description: 'Memory 1 Switch Circuit Failure',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Faulty memory 1 switch', 'Wiring issue', 'Seat control module problem', 'Switch contacts worn'],
        symptoms: ['Memory position 1 not working', 'Switch unresponsive', 'Cannot recall position 1'],
        solutions: ['Replace memory 1 switch', 'Check wiring connections', 'Test seat control module', 'Clean switch assembly']
      },
      'B1532': {
        description: 'Memory 1 Switch Circuit Open',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Open circuit in memory switch wiring', 'Disconnected switch', 'Wire break', 'Failed switch contacts'],
        symptoms: ['Memory 1 button dead', 'No response from button', 'Position 1 not accessible'],
        solutions: ['Check switch connections', 'Test wiring continuity', 'Repair open circuit', 'Replace memory switch']
      },
      'B1533': {
        description: 'Memory 1 Switch Circuit Short To Battery',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Short to battery in switch circuit', 'Internal switch fault', 'Wiring damage', 'Connector problem'],
        symptoms: ['Memory 1 always active', 'Seat moves to position 1', 'Switch malfunction'],
        solutions: ['Locate short to battery', 'Replace faulty switch', 'Repair damaged wiring', 'Check all connectors']
      },
      'B1534': {
        description: 'Memory 1 Switch Circuit Short To Ground',
        system: 'Body', subsystem: 'Seat Memory', severity: this.severityLevels.MEDIUM,
        causes: ['Ground short in memory circuit', 'Damaged wiring', 'Switch failure', 'Moisture damage'],
        symptoms: ['Memory 1 not working', 'Blown circuit protection', 'System errors'],
        solutions: ['Find and repair ground short', 'Replace damaged components', 'Dry moisture damage', 'Test memory system']
      },

      // B1000+ Electronic Control Module Codes
      'B1000': {
        description: 'ECU Defective',
        system: 'Body', subsystem: 'Electronic Control', severity: this.severityLevels.CRITICAL,
        causes: ['ECU internal failure', 'Power supply issues', 'Software corruption', 'Hardware failure'],
        symptoms: ['Multiple system failures', 'Warning lights', 'No communication', 'Vehicle inoperative'],
        solutions: ['Replace ECU', 'Check power supply', 'Reprogram ECU', 'Professional diagnosis required']
      },
      'B1001': {
        description: 'Body Control Module (BCM) Communication Error',
        system: 'Body', subsystem: 'Electronic Control', severity: this.severityLevels.HIGH,
        causes: ['BCM failure', 'CAN bus issues', 'Wiring problems', 'Power supply faults'],
        symptoms: ['Multiple body system failures', 'No communication', 'Warning lights'],
        solutions: ['Check BCM power', 'Test CAN bus', 'Replace BCM', 'Professional diagnosis']
      },
      'B1002': {
        description: 'Body Control Module Internal Fault',
        system: 'Body', subsystem: 'Electronic Control', severity: this.severityLevels.HIGH,
        causes: ['BCM internal failure', 'Software corruption', 'Hardware fault', 'Voltage issues'],
        symptoms: ['Erratic body system operation', 'Multiple malfunctions', 'Warning messages'],
        solutions: ['Replace BCM', 'Check power supply', 'Software update', 'Professional service']
      },
      'B1003': {
        description: 'Ignition Switch Circuit Malfunction',
        system: 'Body', subsystem: 'Ignition System', severity: this.severityLevels.HIGH,
        causes: ['Ignition switch failure', 'Wiring problems', 'Contact wear', 'Security system issues'],
        symptoms: ['Starting problems', 'Intermittent operation', 'Electrical system faults'],
        solutions: ['Replace ignition switch', 'Check wiring', 'Test contacts', 'Security system check']
      },
      'B1004': {
        description: 'Starter Enable Relay Circuit Malfunction',
        system: 'Body', subsystem: 'Starting System', severity: this.severityLevels.HIGH,
        causes: ['Starter relay failure', 'Wiring issues', 'Control circuit problems', 'Security system fault'],
        symptoms: ['No start condition', 'Starter not engaging', 'Intermittent starting'],
        solutions: ['Replace starter relay', 'Check wiring', 'Test control circuit', 'Security system diagnosis']
      },
      'B1005': {
        description: 'Park/Neutral Position Switch Circuit Malfunction',
        system: 'Body', subsystem: 'Transmission Control', severity: this.severityLevels.MEDIUM,
        causes: ['PNP switch failure', 'Adjustment issues', 'Wiring problems', 'Shifter problems'],
        symptoms: ['Starting in wrong gear', 'Backup lights not working', 'Cruise control issues'],
        solutions: ['Replace PNP switch', 'Adjust switch', 'Check wiring', 'Test shifter linkage']
      },
      
      // B1200-B1299: Instrument Cluster and Display System Codes
      'B1200': {
        description: 'Instrument Cluster Internal Circuit Malfunction',
        system: 'Body', subsystem: 'Instrument Cluster', severity: this.severityLevels.MEDIUM,
        causes: ['Cluster internal circuit fault', 'Power supply issue', 'Ground connection problem', 'Internal component failure'],
        symptoms: ['Gauges not working', 'Warning lights malfunction', 'Display issues', 'Cluster reset'],
        solutions: ['Check cluster power supply', 'Verify ground connections', 'Replace instrument cluster', 'Professional diagnosis']
      },
      'B1201': {
        description: 'Odometer Circuit Malfunction',
        system: 'Body', subsystem: 'Instrument Cluster', severity: this.severityLevels.MEDIUM,
        causes: ['Odometer memory failure', 'Speed signal loss', 'Circuit fault', 'EEPROM corruption'],
        symptoms: ['Odometer not counting', 'Mileage display issues', 'Speed signal problems'],
        solutions: ['Check speed signal', 'Verify odometer circuit', 'Cluster reprogramming', 'Professional service']
      },
      'B1202': {
        description: 'Speedometer Circuit Malfunction',
        system: 'Body', subsystem: 'Instrument Cluster', severity: this.severityLevels.MEDIUM,
        causes: ['Speed sensor failure', 'Speedometer circuit fault', 'Signal processing error', 'Wiring issues'],
        symptoms: ['Speedometer not working', 'Erratic speed reading', 'Speed display frozen'],
        solutions: ['Test speed sensor', 'Check speedometer circuit', 'Repair wiring', 'Replace cluster']
      },
      'B1203': {
        description: 'Fuel Gauge Circuit Malfunction',
        system: 'Body', subsystem: 'Instrument Cluster', severity: this.severityLevels.LOW,
        causes: ['Fuel sender failure', 'Gauge circuit fault', 'Wiring problem', 'Ground connection issue'],
        symptoms: ['Fuel gauge inaccurate', 'Gauge stuck', 'Erratic fuel reading'],
        solutions: ['Test fuel sender', 'Check gauge circuit', 'Repair wiring', 'Verify ground connections']
      },
      'B1204': {
        description: 'Temperature Gauge Circuit Malfunction',
        system: 'Body', subsystem: 'Instrument Cluster', severity: this.severityLevels.MEDIUM,
        causes: ['Temperature sender fault', 'Gauge circuit problem', 'Signal processing error'],
        symptoms: ['Temperature gauge not working', 'Inaccurate temp reading', 'Gauge fluctuation'],
        solutions: ['Test temperature sender', 'Check gauge circuit', 'Verify signal path']
      },
      'B1205': {
        description: 'Tachometer Circuit Malfunction',
        system: 'Body', subsystem: 'Instrument Cluster', severity: this.severityLevels.LOW,
        causes: ['RPM signal loss', 'Tachometer circuit fault', 'Signal processing error'],
        symptoms: ['Tachometer not working', 'Erratic RPM reading', 'RPM display frozen'],
        solutions: ['Check RPM signal', 'Test tachometer circuit', 'Verify signal source']
      },
      
      // B1300-B1399: Anti-theft and Security System Codes
      'B1300': {
        description: 'Anti-theft System Control Module Circuit Malfunction',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Anti-theft module failure', 'Power supply issue', 'Communication fault', 'System malfunction'],
        symptoms: ['Vehicle won\'t start', 'Security light on', 'Key not recognized', 'System armed continuously'],
        solutions: ['Check anti-theft module', 'Verify power supply', 'Test communication', 'Professional security service']
      },
      'B1301': {
        description: 'Immobilizer Key Code Circuit Malfunction',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Key transponder failure', 'Antenna circuit fault', 'Key code corruption', 'Reader malfunction'],
        symptoms: ['Key not recognized', 'Engine won\'t start', 'Security light flashing', 'No key detection'],
        solutions: ['Test key transponder', 'Check antenna circuit', 'Reprogram key', 'Professional key service']
      },
      'B1302': {
        description: 'Door Lock Switch Circuit Malfunction',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Door lock switch failure', 'Wiring fault', 'Control module issue', 'Switch contact wear'],
        symptoms: ['Door locks not responding', 'Switch not working', 'Intermittent operation'],
        solutions: ['Replace door lock switch', 'Check wiring', 'Test control module', 'Clean switch contacts']
      },
      'B1303': {
        description: 'Alarm System Circuit Malfunction',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Alarm module failure', 'Sensor malfunction', 'Wiring issue', 'Power supply problem'],
        symptoms: ['Alarm not working', 'False alarms', 'System malfunction', 'Siren not operating'],
        solutions: ['Check alarm module', 'Test sensors', 'Repair wiring', 'Verify power supply']
      },
      
      // B1400-B1499: Seat and Restraint System Codes
      'B1400': {
        description: 'Driver Seat Position Sensor Circuit Malfunction',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.LOW,
        causes: ['Seat position sensor failure', 'Wiring fault', 'Mechanical binding', 'Motor overload'],
        symptoms: ['Seat position not detected', 'Memory seat not working', 'Position feedback error'],
        solutions: ['Test position sensor', 'Check wiring', 'Lubricate mechanism', 'Check motor operation']
      },
      'B1401': {
        description: 'Passenger Seat Position Sensor Circuit Malfunction',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.LOW,
        causes: ['Passenger seat sensor fault', 'Circuit malfunction', 'Connector issue', 'Sensor misalignment'],
        symptoms: ['Passenger seat memory issues', 'Position not saved', 'Sensor error'],
        solutions: ['Replace seat sensor', 'Check circuit', 'Clean connector', 'Align sensor']
      },
      'B1402': {
        description: 'Seat Belt Buckle Switch Circuit Malfunction',
        system: 'Body', subsystem: 'Safety Systems', severity: this.severityLevels.MEDIUM,
        causes: ['Seat belt switch failure', 'Wiring problem', 'Connector corrosion', 'Switch wear'],
        symptoms: ['Seat belt warning not working', 'Switch not detecting', 'Warning light issues'],
        solutions: ['Replace seat belt switch', 'Repair wiring', 'Clean connector', 'Test switch operation']
      },
      'B1403': {
        description: 'Seat Heater Circuit Malfunction',
        system: 'Body', subsystem: 'Comfort Systems', severity: this.severityLevels.LOW,
        causes: ['Seat heater element failure', 'Control module fault', 'Wiring issue', 'Temperature sensor problem'],
        symptoms: ['Seat heater not working', 'Uneven heating', 'Overheating', 'Control not responding'],
        solutions: ['Test heater element', 'Check control module', 'Repair wiring', 'Replace temperature sensor']
      },
      
      // B1500-B1599: Mirror and Wiper System Codes
      'B1500': {
        description: 'Power Mirror Circuit Malfunction',
        system: 'Body', subsystem: 'Mirror Control', severity: this.severityLevels.LOW,
        causes: ['Mirror motor failure', 'Switch malfunction', 'Wiring fault', 'Control module issue'],
        symptoms: ['Mirror not adjusting', 'Mirror stuck', 'Switch not responding', 'Intermittent operation'],
        solutions: ['Test mirror motor', 'Replace switch', 'Check wiring', 'Test control module']
      },
      'B1501': {
        description: 'Heated Mirror Circuit Malfunction',
        system: 'Body', subsystem: 'Mirror Control', severity: this.severityLevels.LOW,
        causes: ['Mirror heater element failure', 'Control circuit fault', 'Wiring problem', 'Switch malfunction'],
        symptoms: ['Mirror not heating', 'Fogging issues', 'Heater not responding'],
        solutions: ['Test heater element', 'Check control circuit', 'Repair wiring', 'Replace switch']
      },
      'B1502': {
        description: 'Windshield Wiper Motor Circuit Malfunction',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.MEDIUM,
        causes: ['Wiper motor failure', 'Control module fault', 'Wiring issue', 'Linkage binding'],
        symptoms: ['Wipers not working', 'Slow operation', 'Intermittent function', 'Motor noise'],
        solutions: ['Replace wiper motor', 'Check control module', 'Repair wiring', 'Lubricate linkage']
      },
      'B1503': {
        description: 'Windshield Washer Pump Circuit Malfunction',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.LOW,
        causes: ['Washer pump failure', 'Clogged lines', 'Electrical fault', 'Low fluid level'],
        symptoms: ['Washer not working', 'Weak spray', 'No fluid delivery'],
        solutions: ['Replace washer pump', 'Clear clogged lines', 'Check electrical connections', 'Fill washer fluid']
      },
      'B1504': {
        description: 'Rear Wiper Motor Circuit Malfunction',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.LOW,
        causes: ['Rear wiper motor failure', 'Switch malfunction', 'Wiring fault', 'Mechanical binding'],
        symptoms: ['Rear wiper not working', 'Intermittent operation', 'Motor overheating'],
        solutions: ['Replace rear wiper motor', 'Test switch', 'Check wiring', 'Free binding mechanism']
      },

      // B2075-B2090: Seat Control System Codes
      'B2075': {
        description: 'Lumbar Switch Control Circuit',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Lumbar switch malfunction', 'Wiring issue', 'Seat control module fault', 'Switch contact wear'],
        symptoms: ['Lumbar support not adjusting', 'Switch unresponsive', 'Seat comfort issues'],
        solutions: ['Replace lumbar switch', 'Check wiring/connectors', 'Test seat control module', 'Clean switch contacts']
      },
      'B2080': {
        description: 'Lumbar Switch Control Circuit',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Secondary lumbar circuit fault', 'Switch degradation', 'Control module communication error', 'Actuator problem'],
        symptoms: ['Lumbar adjustment intermittent', 'Switch response poor', 'Position not holding'],
        solutions: ['Test lumbar actuator', 'Check control module communication', 'Replace switch assembly', 'Calibrate lumbar system']
      },
      'B2085': {
        description: 'Lumbar Switch Control Circuit',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Lumbar circuit voltage issue', 'Switch internal fault', 'Wiring harness damage', 'Ground connection problem'],
        symptoms: ['Lumbar support erratic operation', 'Switch malfunction', 'Seat adjustment issues'],
        solutions: ['Check circuit voltage', 'Test switch operation', 'Inspect wiring harness', 'Verify ground connections']
      },
      'B2090': {
        description: 'Lumbar Switch Control Circuit',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Final lumbar circuit failure', 'Complete switch breakdown', 'System power loss', 'Module failure'],
        symptoms: ['Lumbar system completely inoperative', 'No switch response', 'Seat comfort system down'],
        solutions: ['Replace entire lumbar system', 'Check system power', 'Replace seat control module', 'Professional seat service']
      },

      // B3000-B3199: Advanced Body Control and Security System Codes
      'B3028': {
        description: 'Starter Relay Interface Short to Ground',
        system: 'Body', subsystem: 'Starting System', severity: this.severityLevels.HIGH,
        causes: ['Starter relay circuit short to ground', 'Wiring harness damage', 'Relay coil fault', 'BCM output fault'],
        symptoms: ['Engine won\'t start', 'Starter relay not engaging', 'Blown fuse', 'BCM error'],
        solutions: ['Check starter relay circuit for shorts', 'Replace damaged wiring', 'Test BCM output', 'Replace starter relay']
      },
      'B3029': {
        description: 'Starter Relay Interface Open/Short to B+',
        system: 'Body', subsystem: 'Starting System', severity: this.severityLevels.HIGH,
        causes: ['Starter relay circuit open or short to battery', 'Wiring fault', 'Relay contact failure', 'BCM malfunction'],
        symptoms: ['Starting system inoperative', 'Relay stuck on/off', 'Electrical system issues'],
        solutions: ['Test starter relay circuit', 'Check for opens/shorts to battery', 'Replace faulty relay', 'Repair wiring']
      },
      'B3031': {
        description: 'Key Decoder Device in Assembly Learn Mode',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Security system in learn mode', 'Key programming active', 'System initialization', 'Module reset condition'],
        symptoms: ['Security system learning keys', 'Temporary system unavailable', 'Programming mode active'],
        solutions: ['Complete key programming procedure', 'Exit learn mode', 'Follow security system initialization', 'Professional programming']
      },
      'B3033': {
        description: 'Security System Indicates Tamper',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Tamper detection activated', 'Unauthorized access attempt', 'Sensor malfunction', 'Wiring disturbance'],
        symptoms: ['Security alarm triggered', 'Tamper warning active', 'System locked out', 'Warning lights on'],
        solutions: ['Check for physical tampering', 'Reset security system', 'Test tamper sensors', 'Professional security service']
      },
      'B3055': {
        description: 'Key Not Present',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Key not detected by system', 'Transponder failure', 'Key reader malfunction', 'Weak transponder signal'],
        symptoms: ['Engine won\'t start', 'Key not recognized', 'Security light flashing', 'No key detected message'],
        solutions: ['Use programmed key', 'Replace key battery', 'Check key transponder', 'Reprogram key']
      },
      'B3060': {
        description: 'Security System Sensor Data Incorrect but Valid',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Security sensor providing incorrect data', 'Sensor calibration issue', 'Environmental interference', 'Sensor degradation'],
        symptoms: ['Security system false alarms', 'Inconsistent sensor readings', 'Intermittent security issues'],
        solutions: ['Recalibrate security sensors', 'Check sensor mounting', 'Test sensor operation', 'Replace faulty sensor']
      },
      'B3064': {
        description: 'Driver Door Key Cylinder Circuit',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.MEDIUM,
        causes: ['Key cylinder switch malfunction', 'Wiring fault in door', 'Switch contact wear', 'Door lock mechanism issue'],
        symptoms: ['Key cylinder not working electrically', 'Door locks not responding to key', 'Switch malfunction'],
        solutions: ['Replace key cylinder switch', 'Check door wiring', 'Test switch contacts', 'Service door lock mechanism']
      },
      'B3069': {
        description: 'Right Front/Left Front Door Key Unlock Circuit Low',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.MEDIUM,
        causes: ['Door unlock circuit voltage low', 'Wiring resistance high', 'Poor ground connection', 'Actuator resistance'],
        symptoms: ['Door unlock function weak', 'Slow unlock operation', 'Intermittent unlock'],
        solutions: ['Check unlock circuit voltage', 'Test wiring resistance', 'Verify ground connections', 'Check actuator operation']
      },
      'B3108': {
        description: 'Transmitter Synchronization Failure',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.MEDIUM,
        causes: ['Remote transmitter out of sync', 'Security module timing issue', 'Signal interference', 'Transmitter battery low'],
        symptoms: ['Remote not working', 'Keyless entry inoperative', 'Intermittent remote operation'],
        solutions: ['Resynchronize remote transmitter', 'Replace transmitter battery', 'Check for interference', 'Reprogram remote']
      },
      'B3109': {
        description: '3 consecutive low battery signals from the same programmed transmitter',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.LOW,
        causes: ['Transmitter battery low', 'Weak transmitter signal', 'Transmitter aging', 'Battery drain'],
        symptoms: ['Remote range reduced', 'Intermittent remote operation', 'Weak signal warning'],
        solutions: ['Replace transmitter battery', 'Test transmitter signal strength', 'Check transmitter contacts', 'Replace transmitter if needed']
      },
      'B3127': {
        description: 'LF Door Only, Unlock Circuit Low (BCM)',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.MEDIUM,
        causes: ['Left front door unlock circuit low voltage', 'BCM output fault', 'Wiring resistance', 'Actuator problem'],
        symptoms: ['Left front door unlock weak', 'Slow unlock operation', 'Door not unlocking'],
        solutions: ['Check BCM unlock output', 'Test door unlock circuit', 'Verify actuator operation', 'Check wiring integrity']
      },
      'B3128': {
        description: 'LF Door Only, Unlock Circuit High (BCM)',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.MEDIUM,
        causes: ['Left front door unlock circuit high voltage', 'Short to battery', 'BCM fault', 'Wiring short'],
        symptoms: ['Door unlock always active', 'Actuator overheating', 'System malfunction'],
        solutions: ['Check for short to battery', 'Test BCM output', 'Repair wiring short', 'Replace faulty actuator']
      },
      'B3132': {
        description: 'All Door Unlock Circuit Low (BCM)',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.MEDIUM,
        causes: ['All door unlock circuit low voltage', 'BCM power supply issue', 'High circuit resistance', 'Ground problem'],
        symptoms: ['All doors unlock slowly', 'Weak unlock operation', 'Intermittent unlock function'],
        solutions: ['Check BCM power supply', 'Test unlock circuit voltage', 'Verify ground connections', 'Check circuit resistance']
      },
      'B3133': {
        description: 'All Door Unlock Circuit High (BCM)',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.MEDIUM,
        causes: ['All door unlock circuit high voltage', 'Short to battery in wiring', 'BCM output fault', 'Relay stuck'],
        symptoms: ['Doors unlock continuously', 'System always active', 'Battery drain', 'Actuator damage'],
        solutions: ['Check for short to battery', 'Test BCM unlock output', 'Verify relay operation', 'Repair circuit short']
      },
      'B3137': {
        description: 'All Door Lock Circuit Low (BCM)',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.MEDIUM,
        causes: ['All door lock circuit low voltage', 'BCM output insufficient', 'Circuit resistance high', 'Power supply problem'],
        symptoms: ['Doors lock slowly', 'Weak lock operation', 'Some doors not locking'],
        solutions: ['Check lock circuit voltage', 'Test BCM lock output', 'Verify power supply', 'Check circuit integrity']
      },
      'B3138': {
        description: 'All Door Lock Circuit High (BCM)',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.MEDIUM,
        causes: ['All door lock circuit high voltage', 'Short to battery', 'BCM malfunction', 'Relay failure'],
        symptoms: ['Doors lock continuously', 'Cannot unlock doors', 'System malfunction', 'Actuator overload'],
        solutions: ['Find and repair short to battery', 'Test BCM operation', 'Check relay function', 'Replace faulty components']
      },
      'B3142': {
        description: 'Left Front Unlock Switch Circuit Low',
        system: 'Body', subsystem: 'Door Control', severity: this.severityLevels.MEDIUM,
        causes: ['Left front unlock switch circuit low voltage', 'Switch contact resistance', 'Wiring problem', 'Ground issue'],
        symptoms: ['Left front unlock switch weak response', 'Switch not working properly', 'Intermittent operation'],
        solutions: ['Test switch circuit voltage', 'Clean switch contacts', 'Check wiring connections', 'Verify ground circuit']
      },
      'B3147': {
        description: 'Passenger Unlock Switch Circuit Low',
        system: 'Body', subsystem: 'Door Control', severity: this.severityLevels.MEDIUM,
        causes: ['Passenger unlock switch circuit low voltage', 'Switch malfunction', 'Wiring resistance', 'Poor connection'],
        symptoms: ['Passenger unlock switch not responsive', 'Weak switch operation', 'Intermittent function'],
        solutions: ['Test passenger switch circuit', 'Replace unlock switch', 'Check wiring integrity', 'Clean connections']
      },
      'B3152': {
        description: 'Left Front Lock Switch Circuit Low',
        system: 'Body', subsystem: 'Door Control', severity: this.severityLevels.MEDIUM,
        causes: ['Left front lock switch circuit low voltage', 'Switch wear', 'Circuit resistance', 'Connection problem'],
        symptoms: ['Lock switch not working properly', 'Weak switch response', 'Intermittent lock function'],
        solutions: ['Test lock switch circuit', 'Replace worn switch', 'Check circuit resistance', 'Repair connections']
      },
      'B3157': {
        description: 'Passenger Lock Switch Circuit Low',
        system: 'Body', subsystem: 'Door Control', severity: this.severityLevels.MEDIUM,
        causes: ['Passenger lock switch circuit low voltage', 'Switch contact degradation', 'Wiring issue', 'Connector corrosion'],
        symptoms: ['Passenger lock switch malfunction', 'Switch unresponsive', 'Inconsistent operation'],
        solutions: ['Test passenger lock switch', 'Clean switch contacts', 'Check wiring condition', 'Replace corroded connectors']
      },
      'B3172': {
        description: 'Window Up Switch Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Window up switch circuit low voltage', 'Switch contact resistance', 'Wiring degradation', 'Poor ground'],
        symptoms: ['Window up function weak', 'Slow window operation', 'Switch not responsive'],
        solutions: ['Test window up switch circuit', 'Clean switch contacts', 'Check wiring condition', 'Verify ground connection']
      },
      'B3177': {
        description: 'Window Down Switch Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Window down switch circuit low voltage', 'Switch malfunction', 'Circuit resistance high', 'Connection issue'],
        symptoms: ['Window down function impaired', 'Slow down operation', 'Intermittent switch response'],
        solutions: ['Test window down circuit', 'Replace faulty switch', 'Check circuit resistance', 'Repair connections']
      },
      'B3182': {
        description: 'Window Switch Circuit',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Window switch circuit malfunction', 'Switch internal fault', 'Wiring problem', 'Control module issue'],
        symptoms: ['Window switch not working', 'Multiple window functions affected', 'Switch panel malfunction'],
        solutions: ['Replace window switch assembly', 'Check switch wiring', 'Test control module', 'Inspect switch panel']
      },
      'B3187': {
        description: 'Window Switch Circuit',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Secondary window switch circuit fault', 'Switch degradation', 'Wiring harness issue', 'Module communication error'],
        symptoms: ['Window switch intermittent', 'Some functions not working', 'Switch response poor'],
        solutions: ['Test all switch functions', 'Replace defective switch', 'Check wiring harness', 'Verify module communication']
      },
      'B3192': {
        description: 'Window Switch Circuit',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Window switch circuit general fault', 'Multi-switch failure', 'Harness damage', 'Power supply issue'],
        symptoms: ['Multiple window switches affected', 'System-wide window issues', 'Switch panel malfunction'],
        solutions: ['Diagnose all window switches', 'Check power supply to switches', 'Inspect wiring harness', 'Replace switch assembly']
      },
      'B3197': {
        description: 'Window Switch Circuit',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Window switch circuit comprehensive fault', 'Switch matrix failure', 'Control system issue', 'Wiring network problem'],
        symptoms: ['Window control system inoperative', 'All switches non-functional', 'System-wide failure'],
        solutions: ['Complete switch system diagnosis', 'Replace switch control unit', 'Check entire wiring network', 'Professional diagnosis required']
      },

      // B1702-B1780: Mirror, Seat, Audio, and Security System Codes
      'B1702': {
        description: 'Mirror Switch L Input Shorted to Ground',
        system: 'Body', subsystem: 'Mirror Control', severity: this.severityLevels.MEDIUM,
        causes: ['Faulty mirror switch', 'Wiring harness damage', 'Short circuit to ground', 'BCM malfunction'],
        symptoms: ['Mirror inoperative', 'Warning light ON', 'Left mirror position control failure'],
        solutions: ['Check mirror switch wiring', 'Test mirror switch operation', 'Repair short circuit', 'Replace BCM if faulty']
      },
      'B1703': {
        description: 'Mirror Switch L Down Input Stuck High',
        system: 'Body', subsystem: 'Mirror Control', severity: this.severityLevels.MEDIUM,
        causes: ['Stuck mirror switch', 'Wiring issue', 'Switch internal failure', 'BCM input fault'],
        symptoms: ['Mirror continuously moves down', 'Switch unresponsive', 'Position control erratic'],
        solutions: ['Replace mirror switch', 'Check wiring continuity', 'Inspect switch mechanism', 'Test BCM inputs']
      },
      'B1770': {
        description: 'Cassette not responding',
        system: 'Body', subsystem: 'Entertainment System', severity: this.severityLevels.LOW,
        causes: ['Cassette transport failure', 'Belt drive worn', 'Capstan motor fault', 'Control circuit failure'],
        symptoms: ['Tape playback inoperative', 'Transport mechanism stuck', 'No audio output', 'Cassette eject failure'],
        solutions: ['Replace transport belt', 'Test capstan motor', 'Repair control circuit', 'Clean tape heads']
      },
      'B1780': {
        description: 'Theft Lock Enabled',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Security system activation', 'Theft attempt detected', 'Key authentication failure', 'System tamper detection'],
        symptoms: ['Vehicle systems locked', 'Audio system disabled', 'Engine immobilization', 'Security light flashing'],
        solutions: ['Enter security code', 'Reset theft system', 'Reprogram keys', 'Check system integrity']
      },

      // B1900-B1983: Safety, Charging, and Power Management Codes
      'B1900': {
        description: 'Driver Belt Tower Vert Sensor Circuit Malfunction',
        system: 'Body', subsystem: 'Safety Systems', severity: this.severityLevels.HIGH,
        causes: ['Seat belt sensor failure', 'Wiring harness damage', 'Sensor contamination', 'SRS module fault'],
        symptoms: ['Seat belt warning inoperative', 'SRS light illuminated', 'Belt tension incorrect', 'Safety system compromised'],
        solutions: ['Test belt sensor circuit', 'Clean contaminated sensor', 'Repair harness damage', 'Replace SRS module']
      },
      'B1910': {
        description: 'Generator L-Terminal Open Circuit',
        system: 'Body', subsystem: 'Charging System', severity: this.severityLevels.HIGH,
        causes: ['Alternator L-terminal fault', 'Wiring open circuit', 'Terminal corrosion', 'Voltage regulator failure'],
        symptoms: ['Charging system warning', 'Battery discharge', 'Voltage regulation poor', 'Electrical system instability'],
        solutions: ['Test L-terminal circuit', 'Repair open circuit', 'Clean corroded terminals', 'Replace voltage regulator']
      },
      'B1981': {
        description: 'Battery Voltage Low',
        system: 'Body', subsystem: 'Power Management', severity: this.severityLevels.HIGH,
        causes: ['Battery degradation', 'Charging system failure', 'Excessive power drain', 'Connection resistance high'],
        symptoms: ['Low voltage warning', 'System performance reduced', 'Starting difficulty', 'Electrical instability'],
        solutions: ['Test battery condition', 'Check charging system', 'Identify excessive drain', 'Clean battery connections']
      },

      // B2101-B2110: Advanced Power Seat Control Codes
      'B2101': {
        description: 'Recline Aft Switch Failed',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Recline switch failure', 'Switch contact wear', 'Actuator mechanism fault', 'Control signal lost'],
        symptoms: ['Seat recline aft inoperative', 'Switch feedback missing', 'Position memory incorrect'],
        solutions: ['Replace recline switch', 'Clean worn contacts', 'Test actuator mechanism', 'Verify control signals']
      },
      'B2102': {
        description: 'Recline Forward Switch Failed',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Forward recline switch fault', 'Switch mechanism jam', 'Circuit open condition', 'Module input failure'],
        symptoms: ['Forward recline inoperative', 'Switch unresponsive', 'Seat angle adjustment fails'],
        solutions: ['Test recline switch', 'Clear mechanism jam', 'Repair open circuit', 'Replace input module']
      },
      'B2103': {
        description: 'Rear Vertical Down Switch Failed',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Vertical switch failure', 'Contact corrosion', 'Switch housing damage', 'Signal interference'],
        symptoms: ['Rear height lowering fails', 'Switch position not detected', 'Seat tilt affected'],
        solutions: ['Replace vertical switch', 'Clean corroded contacts', 'Repair switch housing', 'Shield signal wires']
      },
      'B2104': {
        description: 'Rear Vertical Up Switch Failed',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Up switch contact failure', 'Switch wiring damage', 'Actuator overload', 'Position feedback lost'],
        symptoms: ['Rear height raising inoperative', 'Switch illumination off', 'Memory position wrong'],
        solutions: ['Test up switch contacts', 'Repair wiring damage', 'Check actuator loading', 'Calibrate position feedback']
      },
      'B2105': {
        description: 'Horizontal Aft Switch Failed',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Horizontal switch fault', 'Track binding', 'Switch signal corruption', 'Motor protection active'],
        symptoms: ['Seat aft movement disabled', 'Track operation erratic', 'Position memory lost'],
        solutions: ['Replace horizontal switch', 'Lubricate seat tracks', 'Clean signal connections', 'Reset motor protection']
      },
      'B2106': {
        description: 'Horizontal Forward Switch Failed',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Forward switch failure', 'Track obstruction', 'Control circuit fault', 'Switch housing crack'],
        symptoms: ['Forward seat movement fails', 'Track mechanism binding', 'Switch feedback incorrect'],
        solutions: ['Test forward switch', 'Remove track obstruction', 'Repair control circuit', 'Replace cracked housing']
      },
      'B2107': {
        description: 'Front Vertical Down Switch Failed',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Front down switch fault', 'Contact oxidation', 'Mechanism overload', 'Position sensor error'],
        symptoms: ['Front lowering inoperative', 'Height adjustment fails', 'Seat levelness affected'],
        solutions: ['Replace down switch', 'Clean oxidized contacts', 'Check mechanism loading', 'Calibrate position sensor']
      },
      'B2108': {
        description: 'Front Vertical Up Switch Failed',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Up switch malfunction', 'Circuit resistance high', 'Switch mechanism wear', 'Control module fault'],
        symptoms: ['Front height raising fails', 'Switch response delayed', 'Memory recall incorrect'],
        solutions: ['Test switch resistance', 'Replace worn mechanism', 'Clean switch contacts', 'Update control module']
      },
      'B2109': {
        description: 'Lumbar Aft Switch Failed',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.LOW,
        causes: ['Lumbar switch failure', 'Actuator binding', 'Switch contact wear', 'Position feedback lost'],
        symptoms: ['Lumbar aft adjustment fails', 'Support position incorrect', 'Comfort reduced'],
        solutions: ['Replace lumbar switch', 'Lubricate actuator', 'Clean switch contacts', 'Recalibrate position']
      },
      'B2110': {
        description: 'Lumbar Forward Switch Failed',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.LOW,
        causes: ['Forward lumbar switch fault', 'Mechanism jam', 'Circuit open', 'Module input error'],
        symptoms: ['Lumbar forward adjustment inoperative', 'Switch unresponsive', 'Support position stuck'],
        solutions: ['Test lumbar switch', 'Clear mechanism jam', 'Repair open circuit', 'Replace input module']
      },

      // B3200-B3935: Advanced Window, Door, HVAC, and Control Systems
      'B3203': {
        description: 'Rear Window Lockout Switch Input Circuit High',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Lockout switch stuck high', 'Wiring short to battery', 'Switch internal fault', 'BCM input error'],
        symptoms: ['Window lockout always active', 'Rear windows inoperative', 'Switch LED always on'],
        solutions: ['Replace lockout switch', 'Repair short to battery', 'Check BCM input', 'Test switch circuit']
      },
      'B3282': {
        description: 'Window Switch-Express Input Shorted to Ground',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Express switch short to ground', 'Wiring harness damage', 'Switch contact failure', 'Ground fault'],
        symptoms: ['Express window function not working', 'Switch unresponsive', 'One-touch operation disabled'],
        solutions: ['Locate and repair ground short', 'Replace express switch', 'Check harness integrity', 'Test ground connections']
      },
      'B3287': {
        description: 'Left Rear Window Switch Express Down Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Express down circuit voltage low', 'Switch contact resistance', 'Wiring resistance high', 'Poor connection'],
        symptoms: ['Left rear express down slow', 'Switch response poor', 'Window operation delayed'],
        solutions: ['Check circuit voltage', 'Clean switch contacts', 'Repair high resistance wiring', 'Tighten connections']
      },
      'B3292': {
        description: 'Right Rear Window Switch Express Down Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Right rear express circuit fault', 'Switch degradation', 'Circuit resistance issue', 'Connection corrosion'],
        symptoms: ['Right rear express down impaired', 'Switch function inconsistent', 'Slow window operation'],
        solutions: ['Test express circuit', 'Replace degraded switch', 'Check circuit resistance', 'Clean corroded connections']
      },
      'B3377': {
        description: 'Left Front Window Up Switch Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Window up switch circuit low voltage', 'Switch contact wear', 'Wiring issue', 'Ground problem'],
        symptoms: ['Left front window up slow', 'Switch unresponsive', 'Window operation erratic'],
        solutions: ['Test up switch circuit', 'Replace worn switch', 'Check wiring integrity', 'Verify ground connections']
      },
      'B3382': {
        description: 'Left Front Window Down Switch Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Down switch circuit voltage low', 'Switch malfunction', 'Circuit resistance high', 'Connection fault'],
        symptoms: ['Window down function weak', 'Switch response delayed', 'Intermittent operation'],
        solutions: ['Check down switch voltage', 'Replace faulty switch', 'Repair circuit resistance', 'Fix connections']
      },
      'B3387': {
        description: 'Right Front Window Up Switch Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Right front up circuit fault', 'Switch contact degradation', 'Wiring resistance', 'Power supply issue'],
        symptoms: ['Right window up impaired', 'Switch feedback poor', 'Window movement slow'],
        solutions: ['Test right up circuit', 'Clean switch contacts', 'Check wiring resistance', 'Verify power supply']
      },
      'B3392': {
        description: 'Right Front Window Down Switch Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Down circuit voltage insufficient', 'Switch internal fault', 'Harness degradation', 'Ground resistance'],
        symptoms: ['Right window down slow', 'Switch malfunction', 'Operation inconsistent'],
        solutions: ['Measure circuit voltage', 'Replace internal switch', 'Repair harness', 'Improve ground connection']
      },
      'B3397': {
        description: 'Left Rear Window Up Switch Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Left rear up circuit low', 'Switch wear', 'Circuit loading high', 'Connection resistance'],
        symptoms: ['Left rear window up weak', 'Switch response poor', 'Window stalls'],
        solutions: ['Check up circuit loading', 'Replace worn switch', 'Reduce circuit resistance', 'Clean connections']
      },
      'B3410': {
        description: 'AHLD Front Axle Sensor Signal Circuit',
        system: 'Body', subsystem: 'Suspension Control', severity: this.severityLevels.MEDIUM,
        causes: ['Height sensor signal fault', 'Sensor malfunction', 'Wiring harness damage', 'Signal interference'],
        symptoms: ['Suspension height incorrect', 'Height adjustment malfunction', 'Warning lights on'],
        solutions: ['Test height sensor signal', 'Replace faulty sensor', 'Repair harness damage', 'Shield signal wires']
      },
      'B3420': {
        description: 'AHLD Rear Axle Sensor Signal Circuit',
        system: 'Body', subsystem: 'Suspension Control', severity: this.severityLevels.MEDIUM,
        causes: ['Rear height sensor fault', 'Signal circuit open', 'Sensor contamination', 'Control module error'],
        symptoms: ['Rear suspension height wrong', 'System malfunction', 'Ride quality affected'],
        solutions: ['Replace rear height sensor', 'Repair signal circuit', 'Clean contaminated sensor', 'Reset control module']
      },
      'B3452': {
        description: 'Left Rear Window Down Switch Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Left rear down circuit fault', 'Switch contact corrosion', 'Voltage drop issue', 'Wiring degradation'],
        symptoms: ['Left rear window down impaired', 'Switch unresponsive', 'Window operation erratic'],
        solutions: ['Check down circuit voltage', 'Clean corroded contacts', 'Repair voltage drop', 'Replace degraded wiring']
      },
      'B3457': {
        description: 'Right Rear Window Up Switch Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Right rear up circuit low', 'Switch mechanism fault', 'Circuit overload', 'Ground issue'],
        symptoms: ['Right rear window up slow', 'Switch malfunction', 'Window stalling'],
        solutions: ['Test up circuit capacity', 'Repair switch mechanism', 'Reduce circuit overload', 'Fix ground issue']
      },
      'B3462': {
        description: 'Right Rear Window Down Switch Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Down circuit insufficient voltage', 'Switch failure', 'Harness connector issue', 'Module input fault'],
        symptoms: ['Right rear down function weak', 'Switch feedback lost', 'Intermittent operation'],
        solutions: ['Boost circuit voltage', 'Replace failed switch', 'Repair connector issue', 'Test module input']
      },
      'B3467': {
        description: 'Left Front Window Express Down Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Express down circuit fault', 'Switch timing issue', 'Circuit resistance high', 'Control logic error'],
        symptoms: ['Express down function impaired', 'One-touch operation fails', 'Switch timing off'],
        solutions: ['Check express circuit', 'Calibrate switch timing', 'Reduce circuit resistance', 'Update control logic']
      },
      'B3472': {
        description: 'Right Front Window Express Down Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Right express circuit low', 'Switch calibration off', 'Power supply insufficient', 'Signal corruption'],
        symptoms: ['Right express down disabled', 'One-touch not working', 'Window operation manual only'],
        solutions: ['Test express circuit power', 'Recalibrate switch', 'Improve power supply', 'Clean signal path']
      },
      'B3477': {
        description: 'Left Rear Window Express Down Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Left rear express fault', 'Circuit voltage insufficient', 'Switch programming error', 'Harness resistance'],
        symptoms: ['Left rear express down fails', 'Auto-down not functioning', 'Manual operation only'],
        solutions: ['Check express voltage', 'Reprogram switch', 'Repair harness resistance', 'Verify circuit integrity']
      },
      'B3482': {
        description: 'Malfunction Window Express Down Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['General express system fault', 'Multiple circuit issues', 'Control module malfunction', 'Power distribution problem'],
        symptoms: ['All express down functions disabled', 'System-wide window issues', 'One-touch features off'],
        solutions: ['Diagnose all express circuits', 'Check control module', 'Test power distribution', 'System-wide reset']
      },
      'B3517': {
        description: 'Left Rear Door Switch Express Up/Down Window Contact Shorted to GND',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Door switch short to ground', 'Switch housing water damage', 'Contact corrosion', 'Wiring pinch'],
        symptoms: ['Left rear door switch malfunction', 'Express functions disabled', 'Switch always grounded'],
        solutions: ['Locate ground short', 'Dry water damage', 'Clean corroded contacts', 'Repair pinched wiring']
      },
      'B3522': {
        description: 'Right Rear Door Switch Express Up/Down Window Contact Shorted to GND',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Right door switch ground fault', 'Moisture in switch', 'Contact wear', 'Harness chafing'],
        symptoms: ['Right rear door switch inoperative', 'Express controls not working', 'Switch stuck grounded'],
        solutions: ['Find and repair ground fault', 'Seal moisture entry', 'Replace worn contacts', 'Protect harness from chafing']
      },
      'B3527': {
        description: 'Window Lockout Switch Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Lockout switch circuit low voltage', 'Switch contact resistance', 'Poor power supply', 'Ground fault'],
        symptoms: ['Window lockout function impaired', 'Rear windows partially locked', 'Switch response weak'],
        solutions: ['Check lockout circuit voltage', 'Clean switch contacts', 'Improve power supply', 'Repair ground fault']
      },
      'B3531': {
        description: 'Auxiliary HVAC Actuator Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Auxiliary actuator malfunction', 'Circuit overload', 'Actuator binding', 'Control signal lost'],
        symptoms: ['Auxiliary HVAC function not working', 'Climate control limited', 'Actuator noise'],
        solutions: ['Test auxiliary actuator', 'Check circuit loading', 'Free binding actuator', 'Verify control signals']
      },
      'B3642': {
        description: 'Seat Cool Temperature Switch Shorted',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Temperature switch short circuit', 'Switch internal failure', 'Wiring harness damage', 'Moisture ingress'],
        symptoms: ['Seat cooling temperature uncontrolled', 'Switch malfunction', 'Cooling system erratic'],
        solutions: ['Replace shorted switch', 'Repair harness damage', 'Seal moisture entry points', 'Test cooling system']
      },
      'B3702': {
        description: 'Intermittent Wiper Delay Input Circuit Low (BCM)',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.MEDIUM,
        causes: ['Delay switch circuit low', 'BCM input fault', 'Switch contact wear', 'Circuit resistance high'],
        symptoms: ['Intermittent wiper delay not working', 'Fixed delay intervals', 'Switch unresponsive'],
        solutions: ['Check delay circuit voltage', 'Test BCM input', 'Replace worn switch', 'Reduce circuit resistance']
      },
      'B3703': {
        description: 'Intermittent Wiper Delay Input Circuit High/Open (BCM)',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.MEDIUM,
        causes: ['Delay circuit open/high', 'Switch disconnected', 'BCM input high impedance', 'Wiring break'],
        symptoms: ['Delay function stuck on maximum', 'No delay adjustment', 'Switch position not detected'],
        solutions: ['Repair open circuit', 'Reconnect switch', 'Test BCM input impedance', 'Fix wiring break']
      },
      'B3708': {
        description: 'Front Washer Motor Input High (BCM)',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.MEDIUM,
        causes: ['Washer motor input high', 'Short to battery', 'BCM input fault', 'Switch stuck closed'],
        symptoms: ['Front washer always on', 'Washer motor continuous', 'Fluid reservoir emptying fast'],
        solutions: ['Locate short to battery', 'Replace stuck switch', 'Test BCM input', 'Check washer motor circuit']
      },
      'B3713': {
        description: 'Rear Washer Motor Input Circuit High (BCM)',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.MEDIUM,
        causes: ['Rear washer input high voltage', 'Circuit short to power', 'Switch malfunction', 'BCM processing error'],
        symptoms: ['Rear washer stuck on', 'Continuous pump operation', 'Washer fluid waste'],
        solutions: ['Find and repair short to power', 'Replace malfunctioning switch', 'Reset BCM processing', 'Test washer circuit']
      },
      'B3717': {
        description: 'Front Wiper Relay Drive Circuit Low (BCM)',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.MEDIUM,
        causes: ['Wiper relay drive circuit low', 'BCM output insufficient', 'Relay coil resistance high', 'Ground issue'],
        symptoms: ['Front wipers not operating', 'Relay not energizing', 'Wiper system dead'],
        solutions: ['Check BCM output voltage', 'Test relay coil resistance', 'Improve ground connection', 'Replace wiper relay']
      },
      'B3718': {
        description: 'Front Wiper Relay Drive Circuit High (BCM)',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.MEDIUM,
        causes: ['Relay drive circuit high voltage', 'BCM output stuck high', 'Short to battery', 'Relay contacts welded'],
        symptoms: ['Front wipers stuck on', 'Relay always energized', 'Cannot turn wipers off'],
        solutions: ['Check BCM output', 'Locate short to battery', 'Replace welded relay contacts', 'Reset BCM output']
      },
      'B3722': {
        description: 'Rear Wiper Relay Drive Circuit Low (BCM)',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.MEDIUM,
        causes: ['Rear wiper relay drive low', 'BCM output weak', 'Relay circuit resistance', 'Power supply issue'],
        symptoms: ['Rear wiper not working', 'Relay not activating', 'No rear wiper response'],
        solutions: ['Test BCM relay output', 'Check relay circuit', 'Improve power supply', 'Replace rear wiper relay']
      },
      'B3723': {
        description: 'Rear Wiper Relay Drive Circuit High (BCM)',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.MEDIUM,
        causes: ['Rear relay drive high voltage', 'BCM output fault', 'Circuit short to power', 'Relay failure'],
        symptoms: ['Rear wiper always on', 'Relay continuously energized', 'Wiper motor overheating'],
        solutions: ['Check BCM relay drive', 'Repair short to power', 'Replace failed relay', 'Test wiper motor']
      },
      'B3761': {
        description: 'HVAC Actuator Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['HVAC actuator circuit fault', 'Actuator motor failure', 'Control signal corruption', 'Power supply inadequate'],
        symptoms: ['HVAC actuator not responding', 'Climate control malfunction', 'Air distribution incorrect'],
        solutions: ['Test actuator circuit', 'Replace actuator motor', 'Clean control signals', 'Check power supply adequacy']
      },
      'B3770': {
        description: 'HVAC Actuator Circuit',
        system: 'Body', subsystem: 'HVAC System', severity: this.severityLevels.MEDIUM,
        causes: ['Secondary HVAC actuator fault', 'Circuit overload condition', 'Actuator mechanical binding', 'Temperature sensor error'],
        symptoms: ['Secondary climate zone malfunction', 'Temperature control erratic', 'Actuator operation noisy'],
        solutions: ['Test secondary actuator', 'Reduce circuit overload', 'Free mechanical binding', 'Calibrate temperature sensor']
      },
      'B3793': {
        description: 'Memory Seat Module Over Current',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.HIGH,
        causes: ['Seat motor overcurrent', 'Module overload protection', 'Motor bearing failure', 'Circuit short condition'],
        symptoms: ['Seat movement stopped', 'Memory functions disabled', 'Module protection active', 'Seat motor overheating'],
        solutions: ['Check seat motor current', 'Replace worn bearings', 'Locate circuit short', 'Reset module protection']
      },
      'B3801': {
        description: 'Passenger Compartment Lamp Request Circuit',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Interior lamp circuit fault', 'Request signal lost', 'Switch malfunction', 'BCM output error'],
        symptoms: ['Interior lights not responding', 'Dome lights inoperative', 'Map lights not working'],
        solutions: ['Test lamp request circuit', 'Verify request signal', 'Replace faulty switch', 'Check BCM output']
      },
      'B3802': {
        description: 'Park Lamps Request Circuit',
        system: 'Body', subsystem: 'Lighting System', severity: this.severityLevels.MEDIUM,
        causes: ['Park lamp request fault', 'Light switch circuit issue', 'BCM communication error', 'Relay control problem'],
        symptoms: ['Park lights not responding to switch', 'Running lights inoperative', 'Light system malfunction'],
        solutions: ['Test park lamp request', 'Check light switch circuit', 'Verify BCM communication', 'Test relay control']
      },
      'B3808': {
        description: 'Rear Door Lock Relay Circuit',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.MEDIUM,
        causes: ['Rear door lock relay fault', 'Relay coil open/short', 'Control circuit failure', 'BCM output problem'],
        symptoms: ['Rear doors not locking', 'Central locking incomplete', 'Relay not energizing'],
        solutions: ['Replace rear door lock relay', 'Test relay coil', 'Check control circuit', 'Verify BCM output']
      },
      'B3809': {
        description: 'Rear Door Unlock Relay Circuit',
        system: 'Body', subsystem: 'Door Locks', severity: this.severityLevels.MEDIUM,
        causes: ['Rear unlock relay malfunction', 'Relay contact failure', 'Circuit resistance high', 'Control signal weak'],
        symptoms: ['Rear doors not unlocking', 'Manual unlock required', 'Partial central unlock'],
        solutions: ['Replace unlock relay', 'Clean relay contacts', 'Reduce circuit resistance', 'Strengthen control signal']
      },
      'B3810': {
        description: 'Washer Relay Circuit',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.MEDIUM,
        causes: ['Washer relay circuit fault', 'Relay drive inadequate', 'Coil resistance issue', 'Contact corrosion'],
        symptoms: ['Washer system not working', 'No fluid spray', 'Relay not operating'],
        solutions: ['Test washer relay circuit', 'Check relay drive signal', 'Measure coil resistance', 'Clean corroded contacts']
      },
      'B3811': {
        description: 'Washer Relay Circuit',
        system: 'Body', subsystem: 'Wiper System', severity: this.severityLevels.MEDIUM,
        causes: ['Secondary washer relay fault', 'Dual relay system issue', 'Cross-circuit interference', 'Relay timing error'],
        symptoms: ['Backup washer not working', 'Inconsistent washer operation', 'Relay timing off'],
        solutions: ['Test secondary relay', 'Check dual relay system', 'Eliminate interference', 'Adjust relay timing']
      },
      'B3819': {
        description: 'Left Rear Power Window Up Relay Circuit',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Left rear up relay fault', 'Relay coil failure', 'Control circuit open', 'BCM output insufficient'],
        symptoms: ['Left rear window up not working', 'Manual operation only', 'Relay not switching'],
        solutions: ['Replace left rear up relay', 'Test relay coil', 'Repair control circuit', 'Check BCM output']
      },
      'B3820': {
        description: 'Left Rear Power Window Down Relay Circuit',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Left rear down relay malfunction', 'Relay contacts worn', 'Circuit overload', 'Ground connection poor'],
        symptoms: ['Left rear window down fails', 'Window up only', 'Relay contacts sticking'],
        solutions: ['Replace down relay', 'Clean worn contacts', 'Reduce circuit overload', 'Improve ground connection']
      },
      'B3821': {
        description: 'Window Lockout Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Lockout circuit voltage low', 'Switch circuit fault', 'Power supply inadequate', 'Circuit loading high'],
        symptoms: ['Window lockout weak', 'Partial lockout function', 'Rear windows partially operative'],
        solutions: ['Check lockout circuit voltage', 'Test switch circuit', 'Improve power supply', 'Reduce circuit loading']
      },
      'B3822': {
        description: 'Right Rear Power Window Up Relay Circuit',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Right rear up relay circuit fault', 'Relay driver failure', 'Circuit short/open', 'Module output error'],
        symptoms: ['Right rear window up inoperative', 'One-way window operation', 'Relay driver overheating'],
        solutions: ['Test right rear up relay', 'Replace relay driver', 'Repair circuit fault', 'Check module output']
      },
      'B3823': {
        description: 'Right Rear Power Window Down Relay Circuit',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Right rear down relay fault', 'Contact welding', 'Thermal protection active', 'Circuit impedance high'],
        symptoms: ['Right rear window down disabled', 'Window stuck up', 'Relay overheating protection'],
        solutions: ['Replace down relay', 'Clean welded contacts', 'Reset thermal protection', 'Reduce circuit impedance']
      },
      'B3824': {
        description: 'Window Lockout Circuit Low',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Duplicate lockout circuit fault', 'Secondary switch issue', 'Circuit redundancy failure', 'Control logic error'],
        symptoms: ['Inconsistent window lockout', 'Partial system lockout', 'Lockout function unreliable'],
        solutions: ['Check secondary lockout circuit', 'Test backup switch', 'Repair redundancy failure', 'Update control logic']
      },
      'B3832': {
        description: 'Window Position Sensor Circuit',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Window position sensor fault', 'Sensor signal lost', 'Calibration error', 'Sensor contamination'],
        symptoms: ['Window position unknown', 'Auto-up/down disabled', 'Express functions not working'],
        solutions: ['Replace position sensor', 'Restore sensor signal', 'Recalibrate window position', 'Clean contaminated sensor']
      },
      'B3833': {
        description: 'Window Position Sensor Circuit',
        system: 'Body', subsystem: 'Power Windows', severity: this.severityLevels.MEDIUM,
        causes: ['Secondary position sensor fault', 'Dual sensor conflict', 'Sensor drift', 'Signal interference'],
        symptoms: ['Window position inaccurate', 'Conflicting position readings', 'Express function erratic'],
        solutions: ['Replace secondary sensor', 'Resolve sensor conflict', 'Calibrate sensor drift', 'Shield signal interference']
      },
      'B3905': {
        description: 'Lumbar Switch Control Circuit',
        system: 'Body', subsystem: 'Seat Control', severity: this.severityLevels.MEDIUM,
        causes: ['Lumbar control switch fault', 'Switch circuit open/short', 'Actuator overload', 'Position feedback lost'],
        symptoms: ['Lumbar adjustment not working', 'Switch unresponsive', 'Lumbar position stuck'],
        solutions: ['Replace lumbar switch', 'Repair switch circuit', 'Check actuator loading', 'Restore position feedback']
      },
      'B3935': {
        description: 'Transponder Authentication Error',
        system: 'Body', subsystem: 'Security System', severity: this.severityLevels.HIGH,
        causes: ['Transponder failure', 'Key authentication error', 'Security module fault', 'Signal interference'],
        symptoms: ['Key not recognized', 'Engine won\'t start', 'Security light flashing', 'No start condition'],
        solutions: ['Check transponder', 'Reprogram key', 'Test security module', 'Professional service required']
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

export default BodyDTCCodes;