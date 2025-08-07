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

      // B0200-B0299: Body Control Module and Electrical System Codes
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

      // B0400-B0499: Lighting System Codes
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