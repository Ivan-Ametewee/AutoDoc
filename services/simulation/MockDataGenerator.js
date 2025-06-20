class MockDataGenerator {
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
    };
    
    this.drivingScenario = 'idle'; // idle, city, highway, aggressive
    this.lastUpdate = Date.now();
    this.tripDistance = 0;
    this.totalDistance = 45231; // Odometer reading
    
    // Fault simulation
    this.faults = [];
    this.faultProbability = 0.001; // 0.1% chance per update
  }

  // Main data generation method
  generateRealtimeData() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // seconds
    this.lastUpdate = now;

    this.updateEngineState(deltaTime);
    this.simulateDrivingScenario(deltaTime);
    this.checkForFaults();

    return this.getCurrentReadings();
  }

  updateEngineState(deltaTime) {
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

  simulateDrivingScenario(deltaTime) {
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

  simulateCityDriving(deltaTime) {
    // Variable speed and RPM for city driving
    const baseSpeed = 35 + Math.sin(Date.now() / 10000) * 20;
    this.engineState.speed = Math.max(0, baseSpeed + this.randomVariation(10));
    this.engineState.rpm = this.calculateRPMFromSpeed(this.engineState.speed) + this.randomVariation(100);
    this.engineState.throttlePosition = 20 + this.randomVariation(15);
    this.engineState.engineLoad = 35 + this.randomVariation(10);
    this.engineState.mafRate = 15 + this.randomVariation(5);
    
    this.updateDistance(deltaTime);
  }

  simulateHighwayDriving(deltaTime) {
    // Steady highway speed
    this.engineState.speed = 75 + this.randomVariation(5);
    this.engineState.rpm = this.calculateRPMFromSpeed(this.engineState.speed) + this.randomVariation(50);
    this.engineState.throttlePosition = 45 + this.randomVariation(8);
    this.engineState.engineLoad = 55 + this.randomVariation(8);
    this.engineState.mafRate = 25 + this.randomVariation(3);
    
    this.updateDistance(deltaTime);
  }

  simulateAggressiveDriving(deltaTime) {
    // High RPM and throttle
    this.engineState.speed = 50 + Math.sin(Date.now() / 5000) * 30;
    this.engineState.rpm = Math.min(6500, this.calculateRPMFromSpeed(this.engineState.speed) * 1.3) + this.randomVariation(200);
    this.engineState.throttlePosition = 70 + this.randomVariation(20);
    this.engineState.engineLoad = 75 + this.randomVariation(15);
    this.engineState.mafRate = 35 + this.randomVariation(8);
    
    this.updateDistance(deltaTime);
  }

  calculateRPMFromSpeed(speed) {
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

  updateDistance(deltaTime) {
    const distanceKm = (this.engineState.speed * 1.60934 * deltaTime) / 3600;
    this.tripDistance += distanceKm;
    this.totalDistance += distanceKm;
  }

  changeScenario() {
    const scenarios = ['idle', 'city', 'highway', 'aggressive'];
    const currentIndex = scenarios.indexOf(this.drivingScenario);
    const newScenarios = scenarios.filter((_, index) => index !== currentIndex);
    this.drivingScenario = newScenarios[Math.floor(Math.random() * newScenarios.length)];
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

  getCurrentReadings() {
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
  generatePIDData(pidName) {
    const readings = this.getCurrentReadings();
    return readings[pidName] || 0;
  }

  // Generate fault codes
  generateDTCs() {
    return this.faults.map(fault => ({
      ...fault,
      freezeFrameData: this.generateFreezeFrame()
    }));
  }

  generateFreezeFrame() {
    return {
      ENGINE_RPM: this.engineState.rpm,
      VEHICLE_SPEED: this.engineState.speed,
      ENGINE_COOLANT_TEMP: this.engineState.coolantTemp,
      ENGINE_LOAD: this.engineState.engineLoad,
      timestamp: new Date()
    };
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

  setDrivingScenario(scenario) {
    if (['idle', 'city', 'highway', 'aggressive'].includes(scenario)) {
      this.drivingScenario = scenario;
    }
  }

  clearDTCs() {
    this.faults = [];
    return true;
  }

  // Utility methods
  randomVariation(range) {
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
    this.tripDistance = 0;
  }
}

export default new MockDataGenerator();