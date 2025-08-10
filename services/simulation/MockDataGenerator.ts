import { EventEmitter } from 'events';

interface EngineState {
  running: boolean;
  warmupTime: number;
  rpm: number;
  speed: number;
  coolantTemp: number;
  throttlePosition: number;
  engineLoad: number;
  fuelLevel: number;
  intakeAirTemp: number;
  mafRate: number;
}

type DrivingScenario = 'idle' | 'city' | 'highway' | 'aggressive';
type FraudMode = 'none' | 'rollback' | 'tampering' | 'multiple';

interface FraudSimulation {
  enabled: boolean;
  mode: FraudMode;
  rollbackAmount: number;
  rollbackTriggered: boolean;
  tamperingPatterns: string[];
  lastFraudEvent: number;
}

class MockDataGenerator extends EventEmitter {
  private engineState: EngineState;
  private drivingScenario: DrivingScenario;
  private lastUpdate: number;
  private faults: any[];
  private faultProbability: number; // Probability of generating a fault
  private tripDistance: number; // Distance for the current trip
  private totalDistance: number; // Total distance (odometer reading)
  private fraudSimulation: FraudSimulation; // NEW: Fraud simulation state
  private freezeFrameCache: Map<string, any> = new Map(); // Cache freeze frame data per DTC

  constructor() {
    super();
    this.engineState = {
      running: true, // Start engine automatically in simulation
      warmupTime: 0,
      rpm: 700, // Idle RPM
      speed: 0,
      coolantTemp: 20,
      throttlePosition: 0,
      engineLoad: 15, // Base engine load
      fuelLevel: 75,
      intakeAirTemp: 25,
      mafRate: 2.5 // Idle MAF rate
    } as EngineState;
    this.drivingScenario = 'idle';
    this.lastUpdate = Date.now();
    this.tripDistance = 0;
    this.totalDistance = 45231;
    this.faults = [];
    this.faultProbability = 0.8;
    this.fraudSimulation = {
      enabled: false,
      mode: 'none',
      rollbackAmount: 0,
      rollbackTriggered: false,
      tamperingPatterns: [],
      lastFraudEvent: 0
    };
  }

  // Main data generation method
  public generateRealtimeData() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // seconds
    this.lastUpdate = now;

    this.updateEngineState(deltaTime);
    this.simulateDrivingScenario(deltaTime);
    this.updateDistance(deltaTime);
    this.checkForFaults();

    // NEW: Apply fraud simulation if enabled
    if (this.fraudSimulation.enabled) {
      this.applyFraudSimulation(now);
    }

    return this.getCurrentReadings();
  }

  updateEngineState(deltaTime: number) {
    if (this.engineState.running) {
      this.engineState.warmupTime += deltaTime;

      // Coolant temperature rises gradually when cold
      if (this.engineState.coolantTemp < 90) {
        const tempRiseRate = Math.max(0.5, (90 - this.engineState.coolantTemp) * 0.02);
        this.engineState.coolantTemp = Math.max(5, this.engineState.coolantTemp + tempRiseRate * deltaTime); // Minimum 5°C
      }

      // Intake air temperature affected by engine heat and ambient
      const ambientTemp = 25;
      const engineHeatEffect = (this.engineState.coolantTemp - ambientTemp) * 0.3;
      const baseIntakeTemp = ambientTemp + engineHeatEffect + this.randomVariation(2);
      this.engineState.intakeAirTemp = Math.max(5, baseIntakeTemp); // Minimum 5°C to prevent negative values
    }
  }

  simulateDrivingScenario(deltaTime: number) {
    switch (this.drivingScenario) {
      case 'idle':
        this.simulateIdle();
        break;
      case 'city':
        this.simulateCityDriving(deltaTime);
        break;
      case 'highway':
        this.simulateHighwayDriving(deltaTime);
        break;
      case 'aggressive':
        this.simulateAggressiveDriving(deltaTime);
        break;
    }

    // Randomly change scenarios
    if (Math.random() < 0.001) {
      this.changeScenario();
    }
  }

  simulateIdle() {
    this.engineState.rpm = 700 + this.randomVariation(50);
    this.engineState.speed = 0;
    this.engineState.throttlePosition = Math.max(0, Math.min(100, 0 + this.randomVariation(2)));
    this.engineState.engineLoad = 15 + this.randomVariation(5);
    this.engineState.mafRate = 2.5 + this.randomVariation(0.5);
  }

  simulateCityDriving(deltaTime: number) {
    // Variable speed and RPM for city driving
    const baseSpeed = 35 + Math.sin(Date.now() / 10000) * 20;
    this.engineState.speed = Math.max(0, baseSpeed + this.randomVariation(10));
    this.engineState.rpm = this.calculateRPMFromSpeed(this.engineState.speed) + this.randomVariation(100);
    this.engineState.throttlePosition = Math.max(0, Math.min(100, 20 + this.randomVariation(15)));
    this.engineState.engineLoad = 35 + this.randomVariation(10);
    this.engineState.mafRate = 15 + this.randomVariation(5);

    this.updateDistance(deltaTime);
  }

  simulateHighwayDriving(deltaTime: number) {
    // Steady highway speed
    this.engineState.speed = 75 + this.randomVariation(5);
    this.engineState.rpm = this.calculateRPMFromSpeed(this.engineState.speed) + this.randomVariation(50);
    this.engineState.throttlePosition = Math.max(0, Math.min(100, 45 + this.randomVariation(8)));
    this.engineState.engineLoad = 55 + this.randomVariation(8);
    this.engineState.mafRate = 25 + this.randomVariation(3);

    this.updateDistance(deltaTime);
  }

  simulateAggressiveDriving(deltaTime: number) {
    // High RPM and throttle
    this.engineState.speed = 50 + Math.sin(Date.now() / 5000) * 30;
    this.engineState.rpm = Math.min(6500, this.calculateRPMFromSpeed(this.engineState.speed) * 1.3) + this.randomVariation(200);
    this.engineState.throttlePosition = Math.max(0, Math.min(100, 70 + this.randomVariation(20)));
    this.engineState.engineLoad = 75 + this.randomVariation(15);
    this.engineState.mafRate = 35 + this.randomVariation(8);

    this.updateDistance(deltaTime);
  }

  calculateRPMFromSpeed(speed: number): number {
    // Simplified transmission simulation
    if (speed === 0) return 700; // Idle

    // Approximate gear ratios
    const gearRatios = [3.5, 2.1, 1.4, 1.0, 0.8];
    const finalDrive = 3.9;
    const wheelCircumference = 2.0; // meters

    let gear = 1;
    if (speed > 15) gear = 2;
    if (speed > 25) gear = 3;
    if (speed > 40) gear = 4;
    if (speed > 55) gear = 5;

    const gearRatio = gearRatios[gear - 1];
    const wheelRPM = (speed * 1.60934 * 1000) / (60 * wheelCircumference); // Convert mph to wheel RPM

    return wheelRPM * gearRatio * finalDrive;
  }

  updateDistance(deltaTime: number) {
    const distanceKm = (this.engineState.speed * 1.60934 * deltaTime) / 3600;
    this.tripDistance += distanceKm;
    this.totalDistance += distanceKm;
  }

  changeScenario() {
    const scenarios = ['idle', 'city', 'highway', 'aggressive'];
    const currentIndex = scenarios.indexOf(this.drivingScenario);
    const newScenarios = scenarios.filter((_, index) => index !== currentIndex);
    this.drivingScenario = newScenarios[Math.floor(Math.random() * newScenarios.length)] as DrivingScenario;
  }

  checkForFaults() {
    if (Math.random() < this.faultProbability) {
      this.generateRandomFault();
    }

    // Clear faults occasionally
    if (Math.random() < 0.0001 && this.faults.length > 0) {
      this.faults.splice(Math.floor(Math.random() * this.faults.length), 1);
    }
  }

  generateRandomFault() {
    const possibleFaults = [
      { code: 'P0171', description: 'System Too Lean (Bank 1)', severity: 'medium' },
      { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'high' },
      { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold', severity: 'medium' },
      { code: 'P0128', description: 'Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)', severity: 'low' },
      { code: 'P0442', description: 'Evaporative Emission Control System Leak Detected (small leak)', severity: 'low' },
      { code: 'P0506', description: 'Idle Control System RPM Lower Than Expected', severity: 'medium' }
    ];

    const fault = possibleFaults[Math.floor(Math.random() * possibleFaults.length)];

    if (!this.faults.find(f => f.code === fault.code)) {
      this.faults.push({
        ...fault,
        timestamp: new Date(),
        pending: Math.random() < 0.3 // 30% chance of being pending
      });
      
      // Capture freeze frame data at the moment this DTC is generated
      const freezeFrame = this.generateFreezeFrame();
      this.freezeFrameCache.set(fault.code, freezeFrame);
      console.log(`🔒 Captured freeze frame for ${fault.code} at DTC detection:`, freezeFrame);
    }
  }

  /**
   * Add a specific fault code (used by fraud simulation)
   */
  addFault(fault: { code: string; description: string; severity: string }) {
    if (!this.faults.find(f => f.code === fault.code)) {
      this.faults.push({
        ...fault,
        timestamp: new Date(),
        pending: false
      });
      
      // Capture freeze frame data at the moment this DTC is generated
      const freezeFrame = this.generateFreezeFrame();
      this.freezeFrameCache.set(fault.code, freezeFrame);
      console.log(`🔒 Captured freeze frame for ${fault.code} at DTC detection:`, freezeFrame);
      
      this.emit('faultsChanged', this.faults);
      this.emit('alertsChanged', this.getActiveAlerts());
      this.emit('riskChanged', this.getRiskScoreAndStatus());
      console.log(`🚨 Added fraud-related fault: ${fault.code} - ${fault.description}`);
    }
  }

  // Returns active alerts (critical or pending faults)
  getActiveAlerts() {
    return this.faults.filter(f => f.severity === 'critical' || f.pending);
  }

  // Returns a risk score and status based on current faults
  getRiskScoreAndStatus() {
    let risk = 0;
    let status = 'Normal';
    for (const f of this.faults) {
      if (f.severity === 'critical') risk += 50;
      else if (f.severity === 'high') risk += 30;
      else if (f.severity === 'medium') risk += 15;
      else if (f.severity === 'low') risk += 5;
      if (f.code === 'U0001') risk += 50; // Odometer fraud code
    }
    if (risk >= 80) status = 'High Risk';
    else if (risk >= 40) status = 'Moderate Risk';
    else if (risk > 0) status = 'Low Risk';
    return { riskScore: risk, status };
  }

  getCurrentReadings(): { [key: string]: number } {
    return {
      ENGINE_RPM: Math.round(this.engineState.rpm),
      VEHICLE_SPEED: Math.round(this.engineState.speed),
      ENGINE_COOLANT_TEMP: Math.round(this.engineState.coolantTemp),
      THROTTLE_POSITION: Math.round(this.engineState.throttlePosition),
      ENGINE_LOAD: Math.round(this.engineState.engineLoad),
      FUEL_LEVEL: Math.round(this.engineState.fuelLevel),
      INTAKE_AIR_TEMP: Math.round(this.engineState.intakeAirTemp),
      MAF_RATE: Math.round(this.engineState.mafRate * 10) / 10,
      CONTROL_MODULE_VOLTAGE: this.generateBatteryVoltage(),
      TRIP_DISTANCE: Math.round(this.tripDistance * 10) / 10,
      TOTAL_DISTANCE: Math.round(this.totalDistance),
      ODOMETER_STANDARD: Math.round(this.totalDistance),
      ODOMETER: Math.round(this.totalDistance),
      VEHICLE_ODOMETER: Math.round(this.totalDistance),
      TOTAL_DISTANCE_TRAVELED: Math.round(this.totalDistance),
      DISTANCE_SINCE_CODES_CLEARED: 1000, // Default value for diagnostic distance
      DISTANCE_WITH_MIL_ON: 0 // Assuming no MIL on by default
    };
  }

  // Generate specific PID data
  generatePIDData(pidName: string): number {
    const readings = this.getCurrentReadings();
    const value = readings[pidName] || 0;
    console.log(`MockData: ${pidName} = ${value} (engine running: ${this.engineState.running})`);
    return value;
  }

  // Generate fault codes
  generateDTCs() {
    return this.faults.map(fault => ({
      code: fault.code,
      description: fault.description,
      severity: fault.severity === 'high' ? 'critical' : fault.severity === 'medium' ? 'moderate' : 'minor',
      status: fault.pending ? 'pending' : 'active',
      system: this.getSystemFromCode(fault.code),
      timestamp: fault.timestamp,
      freezeFrameData: this.getFreezeFrameForDTC(fault.code)
    }));
  }

  // Helper to determine system from DTC code
  private getSystemFromCode(code: string): string {
    const prefix = code.charAt(0);
    switch (prefix) {
      case 'P': return 'engine';
      case 'B': return 'body';
      case 'C': return 'chassis';
      case 'U': return 'network';
      default: return 'unknown';
    }
  }

  generateFreezeFrame() {
    // Capture actual current engine state as freeze frame data (snapshot of live data)
    const currentReadings = this.getCurrentReadings();
    
    return {
      rpm: Math.round(currentReadings.ENGINE_RPM || this.engineState.rpm),
      speed: Math.round(currentReadings.VEHICLE_SPEED || this.engineState.speed),
      engineLoad: Math.round(currentReadings.ENGINE_LOAD || this.engineState.engineLoad),
      coolantTemp: Math.round(currentReadings.ENGINE_COOLANT_TEMP || this.engineState.coolantTemp),
      throttlePosition: Math.round(currentReadings.THROTTLE_POSITION || this.engineState.throttlePosition),
      // Additional freeze frame parameters that may be useful for diagnostics
      fuelLevel: Math.round(currentReadings.FUEL_LEVEL || this.engineState.fuelLevel),
      intakeAirTemp: Math.round(currentReadings.INTAKE_AIR_TEMP || this.engineState.intakeAirTemp),
      maf: Number((currentReadings.MAF_RATE || this.engineState.mafRate).toFixed(1)),
      timestamp: new Date() // Actual time when DTC was detected (not random backdated time)
    };
  }

  // Get freeze frame data for a specific DTC (cached)
  getFreezeFrameForDTC(dtcCode: string) {
    if (!this.freezeFrameCache.has(dtcCode)) {
      // If no freeze frame exists, this DTC may have been created before the freeze frame capture was implemented
      // Generate one using current state as fallback, but log this as unusual
      console.warn(`⚠️ No freeze frame found for ${dtcCode}, generating fallback using current state`);
      const freezeFrame = this.generateFreezeFrame();
      this.freezeFrameCache.set(dtcCode, freezeFrame);
      return freezeFrame;
    }
    
    const freezeFrame = this.freezeFrameCache.get(dtcCode);
    console.log(`📋 Retrieved freeze frame for ${dtcCode}:`, freezeFrame);
    return freezeFrame;
  }

  // Generate vehicle information
  generateVehicleInfo() {
    return {
      vin: 'JH4KA8260MC000001',
      make: 'Toyota',
      model: 'Camry',
      year: 2018,
      engine: '2.5L I4',
      ecuName: 'Engine Control Module',
      supportedPIDs: [
        'ENGINE_RPM', 'VEHICLE_SPEED', 'ENGINE_COOLANT_TEMP',
        'THROTTLE_POSITION', 'ENGINE_LOAD', 'FUEL_LEVEL',
        'INTAKE_AIR_TEMP', 'MAF_RATE', 'CONTROL_MODULE_VOLTAGE',
        'TOTAL_DISTANCE'
      ]
    };
  }

  // Control methods
  startEngine() {
    this.engineState.running = true;
    this.engineState.warmupTime = 0;
  }

  stopEngine() {
    this.engineState.running = false;
    this.engineState.rpm = 0;
    this.engineState.speed = 0;
    this.engineState.throttlePosition = 0;
    this.engineState.engineLoad = 0;
    this.engineState.mafRate = 0;
  }

  setDrivingScenario(scenario: DrivingScenario) {
    if (['idle', 'city', 'highway', 'aggressive'].includes(scenario)) {
      this.drivingScenario = scenario;
    }
  }

  clearDTCs() {
    this.faults = [];
    // Clear freeze frame cache when DTCs are cleared
    this.freezeFrameCache.clear();
    return true;
  }

  // === NEW: FRAUD SIMULATION METHODS ===

  /**
   * Enable fraud simulation with specific scenarios
   */
  public enableFraudSimulation(mode: FraudMode = 'rollback'): void {
    console.log(`🚨 Enabling fraud simulation mode: ${mode}`);

    this.fraudSimulation.enabled = true;
    this.fraudSimulation.mode = mode;
    this.fraudSimulation.lastFraudEvent = Date.now();
    this.fraudSimulation.rollbackTriggered = false;

    switch (mode) {
      case 'rollback':
        this.fraudSimulation.rollbackAmount = Math.floor(Math.random() * 50000) + 10000; // 10k-60k rollback
        console.log(`📉 Odometer rollback will occur: ${this.fraudSimulation.rollbackAmount} units`);
        break;
      case 'tampering':
        this.fraudSimulation.tamperingPatterns = ['speed_rpm_mismatch', 'impossible_values'];
        console.log('⚙️ ECU tampering patterns enabled');
        break;
      case 'multiple':
        this.fraudSimulation.rollbackAmount = Math.floor(Math.random() * 25000) + 5000;
        this.fraudSimulation.tamperingPatterns = ['speed_rpm_mismatch'];
        console.log('🔥 Multiple fraud patterns enabled');
        break;
    }
  }

  /**
   * Disable fraud simulation
   */
  public disableFraudSimulation(): void {
    console.log('✅ Disabling fraud simulation');
    this.fraudSimulation.enabled = false;
    this.fraudSimulation.mode = 'none';
    this.fraudSimulation.rollbackTriggered = false;
    this.fraudSimulation.tamperingPatterns = [];
  }

  /**
   * Apply fraud simulation effects
   */
  private applyFraudSimulation(currentTime: number): void {
    const timeSinceLastEvent = currentTime - this.fraudSimulation.lastFraudEvent;

    switch (this.fraudSimulation.mode) {
      case 'rollback':
        this.simulateOdometerRollback(timeSinceLastEvent);
        break;
      case 'tampering':
        this.simulateECUTampering();
        break;
      case 'multiple':
        this.simulateOdometerRollback(timeSinceLastEvent);
        this.simulateECUTampering();
        break;
    }
  }

  /**
   * Simulate odometer rollback after a delay
   */
  private simulateOdometerRollback(timeSinceLastEvent: number): void {
    // Trigger rollback after 15 seconds of normal operation
    if (!this.fraudSimulation.rollbackTriggered && timeSinceLastEvent > 15000) {
      const originalDistance = this.totalDistance;
      this.totalDistance = Math.max(0, this.totalDistance - this.fraudSimulation.rollbackAmount);

      console.log(`🚨 FRAUD SIMULATION: Odometer rollback occurred!`);
      console.log(`📉 ${originalDistance} km → ${this.totalDistance} km (-${this.fraudSimulation.rollbackAmount} km)`);

      this.fraudSimulation.rollbackTriggered = true;
      this.fraudSimulation.lastFraudEvent = Date.now();

      // Create a fraud-related fault code
      this.addFault({
        code: 'U0001',
        description: 'Odometer Data Inconsistency Detected',
        severity: 'critical'
      });
    }
  }

  /**
   * Simulate ECU tampering patterns
   */
  private simulateECUTampering(): void {
    const timeSinceStart = Date.now() - this.fraudSimulation.lastFraudEvent;
    
    if (this.fraudSimulation.tamperingPatterns.includes('speed_rpm_mismatch')) {
      // Show impossible speed/RPM combinations more frequently for demo
      if (Math.random() < 0.3) { // Increased to 30% chance
        if (this.engineState.speed > 20) {
          // Force RPM to 0 while showing speed (impossible)
          this.engineState.rpm = 0;
          console.log('⚠️ FRAUD SIMULATION: Impossible speed/RPM combination');
        } else {
          // Or show high RPM with no speed
          this.engineState.rpm = 3000 + Math.random() * 2000;
          this.engineState.speed = 0;
          console.log('⚠️ FRAUD SIMULATION: High RPM with no movement');
        }
      }
    }

    if (this.fraudSimulation.tamperingPatterns.includes('impossible_values')) {
      // Generate impossible parameter values more frequently
      if (Math.random() < 0.2) { // Increased to 20% chance
        const tamperingType = Math.floor(Math.random() * 3);
        
        switch (tamperingType) {
          case 0:
            // Impossible speed
            this.engineState.speed = Math.random() * 200 + 250; // 250-450 km/h
            console.log('⚠️ FRAUD SIMULATION: Impossible speed value generated:', this.engineState.speed);
            break;
          case 1:
            // Impossible temperature
            this.engineState.coolantTemp = Math.random() * 50 + 150; // 150-200°C (overheating)
            console.log('⚠️ FRAUD SIMULATION: Impossible temperature generated:', this.engineState.coolantTemp);
            break;
          case 2:
            // Impossible fuel level (over 100%)
            this.engineState.fuelLevel = 100 + Math.random() * 20; // 100-120%
            console.log('⚠️ FRAUD SIMULATION: Impossible fuel level generated:', this.engineState.fuelLevel);
            break;
        }
      }
    }
    
    // Add periodic glitches every 10 seconds
    if (timeSinceStart % 10000 < 1000) { // Glitch for 1 second every 10 seconds
      this.engineState.throttlePosition = Math.random() * 100;
      this.engineState.engineLoad = Math.random() * 100;
      console.log('⚡ FRAUD SIMULATION: Parameter glitch active');
    }
  }

  /**
   * Set up predefined fraud demo scenarios
   */
  public setupFraudDemoScenario(scenario: 'clean' | 'rollback' | 'tampering' | 'sophisticated'): void {
    switch (scenario) {
      case 'clean':
        // Clear all fraud simulation and faults
        this.disableFraudSimulation();
        this.totalDistance = 45231;
        this.clearDTCs(); // Remove all fault codes
        console.log('✅ Clean vehicle scenario - no fraud patterns, all faults cleared');
        break;

      case 'rollback':
        // Set up rollback scenario with immediate minor rollback and scheduled major rollback
        this.totalDistance = 125000; // Higher starting odometer
        this.enableFraudSimulation('rollback');
        
        // Add immediate minor rollback to show instant effect
        this.totalDistance -= 500; // Immediate 500km decrease
        this.addFault({
          code: 'U0100',
          description: 'Lost Communication With ECM/PCM',
          severity: 'high'
        });
        
        console.log('📉 Rollback fraud scenario - immediate 500km decrease, major rollback in 15s');
        break;

      case 'tampering':
        // Set up tampering with immediate effects
        this.totalDistance = 89000;
        this.enableFraudSimulation('tampering');
        
        // Add immediate tampering effects
        this.engineState.speed = 45; // Set speed to trigger tampering
        this.engineState.rpm = 0; // Impossible: speed without RPM
        
        this.addFault({
          code: 'P0606',
          description: 'PCM Processor Fault',
          severity: 'critical'
        });
        this.addFault({
          code: 'U0155',
          description: 'Lost Communication With Instrument Panel Cluster',
          severity: 'medium'
        });
        
        console.log('⚙️ ECU tampering scenario - immediate impossible parameter values');
        break;

      case 'sophisticated':
        // Multiple fraud techniques with immediate effects
        this.totalDistance = 156000;
        this.enableFraudSimulation('multiple');
        
        // Immediate rollback
        this.totalDistance -= 15000; // Major immediate rollback
        
        // Immediate tampering effects  
        this.engineState.speed = 85;
        this.engineState.rpm = 0; // Impossible combination
        
        // Add multiple fraud indicators
        this.addFault({
          code: 'U0001',
          description: 'High Speed CAN Communication Bus',
          severity: 'critical'
        });
        this.addFault({
          code: 'P0602',
          description: 'Control Module Programming Error',
          severity: 'critical'
        });
        this.addFault({
          code: 'U0100',
          description: 'Lost Communication With ECM/PCM',
          severity: 'high'
        });
        
        console.log('🔥 Sophisticated fraud scenario - immediate 15000km rollback + tampering + multiple faults');
        break;
    }
    
    // Reset fraud event timer to ensure scheduled effects work
    this.fraudSimulation.lastFraudEvent = Date.now();
    
    // Emit events to update listeners immediately
    this.emit('faultsChanged', this.faults);
    this.emit('alertsChanged', this.getActiveAlerts());
    this.emit('riskChanged', this.getRiskScoreAndStatus());
  }

  /**
   * Get fraud simulation status for debugging
   */
  public getFraudSimulationStatus(): FraudSimulation {
    return { ...this.fraudSimulation };
  }

  // Generate realistic battery voltage based on engine state
  private generateBatteryVoltage(): number {
    if (!this.engineState.running) {
      // Battery voltage when engine off (12.6V typical for good battery)
      return 12.6 + this.randomVariation(0.2);
    } else {
      // Alternator charging voltage (13.8-14.4V typical)
      const baseVoltage = 14.1;
      const rpmEffect = Math.min(0.3, this.engineState.rpm / 3000 * 0.3); // Higher RPM = slightly higher voltage
      const loadEffect = -this.engineState.engineLoad / 100 * 0.2; // Higher load = slightly lower voltage
      return baseVoltage + rpmEffect + loadEffect + this.randomVariation(0.1);
    }
  }

  // Utility methods
  randomVariation(range: number): number {
    return (Math.random() - 0.5) * 2 * range;
  }

  reset() {
    this.engineState = {
      running: true, // Start engine automatically in simulation
      warmupTime: 0,
      rpm: 700, // Idle RPM
      speed: 0,
      coolantTemp: 20,
      throttlePosition: 0,
      engineLoad: 15, // Base engine load
      fuelLevel: 75,
      intakeAirTemp: 25,
      mafRate: 2.5 // Idle MAF rate
    };
    this.faults = [];
    this.freezeFrameCache.clear(); // Clear freeze frame cache on reset
    this.tripDistance = 0;
    this.emit('faultsChanged', this.faults);
    this.emit('alertsChanged', this.getActiveAlerts());
    this.emit('riskChanged', this.getRiskScoreAndStatus());
  }

  // --- MIL Status Generation ---

  /**
   * Generate MIL (Malfunction Indicator Lamp) status
   */
  generateMILStatus(): { milActive: boolean; dtcCount: number } {
    const milActive = this.faults.length > 0;
    const dtcCount = Math.min(this.faults.length, 127); // Max 127 DTCs
    
    return { milActive, dtcCount };
  }
}

export default new MockDataGenerator();