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

class MockDataGenerator {
  private engineState: EngineState;
  private drivingScenario: DrivingScenario;
  private lastUpdate: number;
  private faults: any[];
  private faultProbability: number; // Probability of generating a fault
  private tripDistance: number; // Distance for the current trip
  private totalDistance: number; // Total distance (odometer reading)
  private freezeFrameCache: Map<string, any> = new Map(); // Cache freeze frame data per DTC

  constructor() {
    this.engineState = {
      running: false,
      warmupTime: 0,
      rpm: 0,
      speed: 0,
      coolantTemp: 20,
      throttlePosition: 0,
      engineLoad: 0,
      fuelLevel: 75,
      intakeAirTemp: 25,
      mafRate: 0
    } as EngineState;
    
    this.drivingScenario = 'idle'; // idle, city, highway, aggressive
    this.lastUpdate = Date.now();
    this.tripDistance = 0;
    this.totalDistance = 45231; // Odometer reading
    
    // Fault simulation - Start with some initial DTCs for testing
    this.faults = [
      {
        code: 'P0171',
        description: 'System Too Lean (Bank 1)',
        severity: 'medium',
        timestamp: new Date(Date.now() - 3600000),
        pending: false
      }
    ];
    this.faultProbability = 0.0020; // 0.2% chance per update - increased for better demo
  }

  // Main data generation method
  public generateRealtimeData() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // seconds
    this.lastUpdate = now;

    this.updateEngineState(deltaTime);
    this.simulateDrivingScenario(deltaTime);
    this.checkForFaults();

    return this.getCurrentReadings();
  }

  updateEngineState(deltaTime: number) {
    if (this.engineState.running) {
      this.engineState.warmupTime += deltaTime;
      
      // Coolant temperature rises gradually when cold
      if (this.engineState.coolantTemp < 90) {
        const tempRiseRate = Math.max(0.5, (90 - this.engineState.coolantTemp) * 0.02);
        this.engineState.coolantTemp += tempRiseRate * deltaTime;
      }
      
      // Intake air temperature affected by engine heat and ambient
      const ambientTemp = 25;
      const engineHeatEffect = (this.engineState.coolantTemp - ambientTemp) * 0.3;
      this.engineState.intakeAirTemp = ambientTemp + engineHeatEffect + this.randomVariation(2);
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
    this.engineState.throttlePosition = 0 + this.randomVariation(2);
    this.engineState.engineLoad = 15 + this.randomVariation(5);
    this.engineState.mafRate = 2.5 + this.randomVariation(0.5);
  }

  simulateCityDriving(deltaTime: number) {
    // Variable speed and RPM for city driving
    const baseSpeed = 35 + Math.sin(Date.now() / 10000) * 20;
    this.engineState.speed = Math.max(0, baseSpeed + this.randomVariation(10));
    this.engineState.rpm = this.calculateRPMFromSpeed(this.engineState.speed) + this.randomVariation(100);
    this.engineState.throttlePosition = 20 + this.randomVariation(15);
    this.engineState.engineLoad = 35 + this.randomVariation(10);
    this.engineState.mafRate = 15 + this.randomVariation(5);
    
    this.updateDistance(deltaTime);
  }

  simulateHighwayDriving(deltaTime: number) {
    // Steady highway speed
    this.engineState.speed = 75 + this.randomVariation(5);
    this.engineState.rpm = this.calculateRPMFromSpeed(this.engineState.speed) + this.randomVariation(50);
    this.engineState.throttlePosition = 45 + this.randomVariation(8);
    this.engineState.engineLoad = 55 + this.randomVariation(8);
    this.engineState.mafRate = 25 + this.randomVariation(3);
    
    this.updateDistance(deltaTime);
  }

  simulateAggressiveDriving(deltaTime: number) {
    // High RPM and throttle
    this.engineState.speed = 50 + Math.sin(Date.now() / 5000) * 30;
    this.engineState.rpm = Math.min(6500, this.calculateRPMFromSpeed(this.engineState.speed) * 1.3) + this.randomVariation(200);
    this.engineState.throttlePosition = 70 + this.randomVariation(20);
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
    }
  }

  getCurrentReadings(): {[key: string]: number} {
    return {
      ENGINE_RPM: Math.round(this.engineState.rpm),
      VEHICLE_SPEED: Math.round(this.engineState.speed),
      ENGINE_COOLANT_TEMP: Math.round(this.engineState.coolantTemp),
      THROTTLE_POSITION: Math.round(this.engineState.throttlePosition),
      ENGINE_LOAD: Math.round(this.engineState.engineLoad),
      FUEL_LEVEL: Math.round(this.engineState.fuelLevel),
      INTAKE_AIR_TEMP: Math.round(this.engineState.intakeAirTemp),
      MAF_RATE: Math.round(this.engineState.mafRate * 10) / 10,
      TRIP_DISTANCE: Math.round(this.tripDistance * 10) / 10,
      TOTAL_DISTANCE: Math.round(this.totalDistance)
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
    // Generate realistic freeze frame data (when the DTC was recorded)
    return {
      rpm: Math.floor(Math.random() * 1000) + 1500, // 1500-2500 RPM
      speed: Math.floor(Math.random() * 60) + 20, // 20-80 mph
      engineLoad: Math.floor(Math.random() * 40) + 30, // 30-70%
      coolantTemp: Math.floor(Math.random() * 30) + 85, // 85-115°C
      throttlePosition: Math.floor(Math.random() * 30) + 15, // 15-45%
      timestamp: new Date(Date.now() - Math.random() * 86400000) // Random time in last 24h
    };
  }

  // Get freeze frame data for a specific DTC (cached)
  getFreezeFrameForDTC(dtcCode: string) {
    if (!this.freezeFrameCache.has(dtcCode)) {
      // Generate and cache freeze frame data for this DTC
      const freezeFrame = this.generateFreezeFrame();
      this.freezeFrameCache.set(dtcCode, freezeFrame);
      console.log(`Generated freeze frame for ${dtcCode}:`, freezeFrame);
    }
    
    return this.freezeFrameCache.get(dtcCode);
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
        'INTAKE_AIR_TEMP', 'MAF_RATE'
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

  // Add a method to simulate having DTCs for testing
  addTestDTCs() {
    const testDTCs = [
      { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold (Bank 1)', severity: 'medium' },
      { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'high' },
      { code: 'P0128', description: 'Coolant Thermostat', severity: 'low' }
    ];
    
    // Add 1-2 random DTCs
    const numToAdd = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numToAdd; i++) {
      const testDTC = testDTCs[Math.floor(Math.random() * testDTCs.length)];
      if (!this.faults.find(f => f.code === testDTC.code)) {
        this.faults.push({
          ...testDTC,
          timestamp: new Date(),
          pending: Math.random() < 0.3
        });
      }
    }
  }

  // Utility methods
  randomVariation(range: number): number {
    return (Math.random() - 0.5) * 2 * range;
  }

  reset() {
    this.engineState = {
      running: false,
      warmupTime: 0,
      rpm: 0,
      speed: 0,
      coolantTemp: 20,
      throttlePosition: 0,
      engineLoad: 0,
      fuelLevel: 75,
      intakeAirTemp: 25,
      mafRate: 0
    };
    this.faults = [];
    this.freezeFrameCache.clear(); // Clear freeze frame cache on reset
    this.tripDistance = 0;
  }
}

export default new MockDataGenerator();