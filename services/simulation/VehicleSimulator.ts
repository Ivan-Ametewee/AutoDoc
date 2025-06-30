// src/services/simulation/VehicleSimulator.ts

interface VehicleState {
  rpm: number;
  speed: number; // km/h
  engineLoad: number; // %
  throttlePos: number; // %
  coolantTemp: number; // °C
  intakeTemp: number; // °C
  oilTemp: number; // °C
  fuelLevel: number; // %
  fuelPressure: number; // kPa
  fuelTrim: number; // %
  maf: number; // g/s
  map: number; // kPa
  o2Sensor: number; // V
  catalystTemp: number; // °C
  batteryVoltage: number; // V
  alternatorOutput: number; // V
  gearPosition: 'P' | 'R' | 'N' | 'D' | 'L';
  transTemp: number; // °C
  ambientTemp: number; // °C
  barometricPressure: number; // kPa
  engineRunning: boolean;
  odometer: number; // km
  tripOdometer: number; // km
  fuelEconomy: number; // L/100km
  averageSpeed: number; // km/h
  engineHours: number;
}

interface VehicleLimits {
  rpm: { min: number; max: number; redline: number };
  speed: { min: number; max: number };
  coolantTemp: { min: number; max: number; normal: { min: number; max: number } };
  oilTemp: { min: number; max: number; normal: { min: number; max: number } };
  batteryVoltage: { min: number; max: number; normal: { min: number; max: number } };
  fuelPressure: { min: number; max: number; normal: { min: number; max: number } };
  engineLoad: { min: number; max: number };
  throttlePos: { min: number; max: number };
}

interface TrendState {
  rpmTrend: number;
  speedTrend: number;
  loadTrend: number;
  tempTrend: number;
  warmupPhase: boolean;
  warmupTime: number; // seconds
}

export class VehicleSimulator {
  public state: VehicleState;
  private limits: VehicleLimits;
  private trends: TrendState;
  private faultStates: { [key: string]: boolean };
  private engineRunTime: number;
  private tripDistance: number;
  private fuelConsumed: number;

  constructor() {
    this.state = this.getInitialState() as VehicleState;
    this.limits = this.getVehicleLimits();
    this.trends = this.getInitialTrends();
    this.faultStates = {};
    this.engineRunTime = 0;
    this.tripDistance = 0;
    this.fuelConsumed = 0;
  }

  /**
   * Get initial vehicle state
   */
  getInitialState(): VehicleState {
    return {
      // Engine parameters
      rpm: 800,                    // Engine RPM
      speed: 0,                    // Vehicle speed (km/h)
      engineLoad: 15,              // Engine load (%)
      throttlePos: 0,              // Throttle position (%)
      
      // Temperature sensors
      coolantTemp: 85,             // Coolant temperature (°C)
      intakeTemp: 25,              // Intake air temperature (°C)
      oilTemp: 80,                 // Oil temperature (°C)
      
      // Fuel system
      fuelLevel: 75,               // Fuel level (%)
      fuelPressure: 250,           // Fuel pressure (kPa)
      fuelTrim: 0,                 // Fuel trim (%)
      
      // Air intake
      maf: 5.2,                    // Mass airflow (g/s)
      map: 35,                     // Manifold absolute pressure (kPa)
      
      // Exhaust and emissions
      o2Sensor: 0.45,              // O2 sensor voltage
      catalystTemp: 400,           // Catalyst temperature (°C)
      
      // Electrical
      batteryVoltage: 12.6,        // Battery voltage (V)
      alternatorOutput: 14.2,      // Alternator output (V)
      
      // Transmission
      gearPosition: 'P',           // Gear position
      transTemp: 65,               // Transmission temperature (°C)
      
      // Environmental
      ambientTemp: 20,             // Ambient temperature (°C)
      barometricPressure: 101.3,   // Barometric pressure (kPa)
      
      // System status
      engineRunning: true,
      odometer: 125430,            // Total odometer (km)
      tripOdometer: 0,             // Trip odometer (km)
      
      // Calculated values
      fuelEconomy: 8.5,            // L/100km
      averageSpeed: 0,             // Average speed (km/h)
      engineHours: 2847            // Total engine hours
    };
  }

  /**
   * Get vehicle operating limits
   */
  getVehicleLimits() {
    return {
      rpm: { min: 600, max: 6500, redline: 6000 },
      speed: { min: 0, max: 200 },
      coolantTemp: { min: -40, max: 130, normal: { min: 75, max: 95 } },
      oilTemp: { min: -40, max: 150, normal: { min: 70, max: 110 } },
      batteryVoltage: { min: 11.0, max: 15.0, normal: { min: 12.0, max: 14.8 } },
      fuelPressure: { min: 200, max: 400, normal: { min: 240, max: 320 } },
      engineLoad: { min: 0, max: 100 },
      throttlePos: { min: 0, max: 100 }
    };
  }

  /**
   * Get initial trend values for realistic simulation
   */
  getInitialTrends() {
    return {
      rpmTrend: 0,
      speedTrend: 0,
      loadTrend: 0,
      tempTrend: 0,
      warmupPhase: true,
      warmupTime: 0
    };
  }

  /**
   * Initialize the vehicle simulator
   */
  initialize() {
    this.state = this.getInitialState();
    this.trends = this.getInitialTrends();
    this.faultStates = {};
    this.engineRunTime = 0;
    this.tripDistance = 0;
    this.fuelConsumed = 0;
    console.log('Vehicle simulator initialized');
  }

  /**
   * Update vehicle state based on scenario and time
   */
  update(deltaTime: number, scenario: string) {
    // Update running time
    this.engineRunTime += deltaTime;
    this.trends.warmupTime += deltaTime;
    
    // Check if warmup phase is complete (5 minutes)
    if (this.trends.warmupTime > 300) {
      this.trends.warmupPhase = false;
    }

    // Update based on current scenario
    switch (scenario) {
      case 'normal_driving':
        this.updateNormalDriving(deltaTime);
        break;
      case 'highway_driving':
        this.updateHighwayDriving(deltaTime);
        break;
      case 'city_driving':
        this.updateCityDriving(deltaTime);
        break;
      case 'idle':
        this.updateIdle();
        break;
      case 'cold_start':
        this.updateColdStart();
        break;
      case 'overheating':
        this.updateOverheating(deltaTime);
        break;
      case 'engine_trouble':
        this.updateEngineTrouble();
        break;
      case 'low_fuel':
        this.updateLowFuel();
        break;
      default:
        this.updateNormalDriving(deltaTime);
    }

    // Update calculated values
    this.updateCalculatedValues(deltaTime);
    
    // Apply realistic variations
    this.applyRealisticVariations();
    
    // Enforce limits
    this.enforceLimits();
  }

  /**
   * Update for normal driving scenario
   */
  updateNormalDriving(deltaTime: number) {
    // Simulate varying driving conditions
    const variation = Math.sin(this.engineRunTime * 0.1) * 0.5 + 0.5;
    
    this.state.speed = 30 + variation * 40; // 30-70 km/h
    this.state.rpm = 1200 + this.state.speed * 25 + Math.random() * 200;
    this.state.throttlePos = 15 + variation * 35;
    this.state.engineLoad = 25 + variation * 40;
    
    // MAF correlates with engine load and RPM
    this.state.maf = 3 + (this.state.engineLoad / 100) * 15 + (this.state.rpm / 6000) * 8;
    this.state.map = 30 + (this.state.throttlePos / 100) * 70;
  }

  /**
   * Update for highway driving scenario
   */
  updateHighwayDriving(deltaTime: number) {
    const cruiseVariation = Math.sin(this.engineRunTime * 0.05) * 0.3 + 0.7;
    
    this.state.speed = 90 + cruiseVariation * 20; // 90-110 km/h
    this.state.rpm = 2000 + cruiseVariation * 800;
    this.state.throttlePos = 25 + cruiseVariation * 15;
    this.state.engineLoad = 40 + cruiseVariation * 30;
    
    this.state.maf = 8 + (this.state.engineLoad / 100) * 12;
    this.state.map = 45 + (this.state.throttlePos / 100) * 45;
  }

  /**
   * Update for city driving scenario
   */
  updateCityDriving(deltaTime: number) {
    // Simulate stop-and-go traffic
    const stopGoCycle = Math.sin(this.engineRunTime * 0.3);
    const isAccelerating = stopGoCycle > 0;
    
    if (isAccelerating) {
      this.state.speed = Math.abs(stopGoCycle) * 50;
      this.state.throttlePos = 30 + Math.abs(stopGoCycle) * 50;
      this.state.engineLoad = 35 + Math.abs(stopGoCycle) * 45;
    } else {
      this.state.speed = Math.max(0, 20 + stopGoCycle * 20);
      this.state.throttlePos = Math.max(0, 10 + stopGoCycle * 15);
      this.state.engineLoad = Math.max(15, 25 + stopGoCycle * 20);
    }
    
    this.state.rpm = 800 + this.state.speed * 30 + Math.random() * 300;
    this.state.maf = 2 + (this.state.engineLoad / 100) * 18;
    this.state.map = 25 + (this.state.throttlePos / 100) * 75;
  }

  /**
   * Update for idle scenario
   */
  updateIdle() {
    this.state.speed = 0;
    this.state.rpm = 750 + Math.sin(this.engineRunTime * 2) * 50; // Idle variation
    this.state.throttlePos = 0;
    this.state.engineLoad = 15 + Math.random() * 10;
    this.state.maf = 2.5 + Math.random() * 1.5;
    this.state.map = 30 + Math.random() * 5;
  }

  /**
   * Update for cold start scenario
   */
  updateColdStart() {
    const warmupProgress = Math.min(this.trends.warmupTime / 300, 1); // 5 min warmup
    
    // High idle during warmup
    this.state.rpm = 1200 - (warmupProgress * 400); // 1200 -> 800 RPM
    this.state.coolantTemp = 20 + (warmupProgress * 65); // 20 -> 85°C
    this.state.oilTemp = 20 + (warmupProgress * 60); // 20 -> 80°C
    this.state.intakeTemp = 5 + (warmupProgress * 20); // Cold start
    
    this.state.speed = 0;
    this.state.throttlePos = 0;
    this.state.engineLoad = 20 - (warmupProgress * 5);
    this.state.fuelTrim = 15 - (warmupProgress * 15); // Rich mixture when cold
  }

  /**
   * Update for overheating scenario
   */
  updateOverheating(deltaTime: number) {
    // Gradually increase temperature
    this.state.coolantTemp = Math.min(110, this.state.coolantTemp + deltaTime * 2);
    this.state.oilTemp = Math.min(130, this.state.oilTemp + deltaTime * 1.5);
    
    // Engine performance degrades
    const overheatingFactor = Math.max(0.7, 1 - (this.state.coolantTemp - 95) / 50);
    
    this.state.rpm = Math.max(600, this.state.rpm * overheatingFactor);
    this.state.engineLoad = Math.min(100, this.state.engineLoad / overheatingFactor);
    
    // Set fault state
    this.faultStates.overheating = this.state.coolantTemp > 105;
  }

  /**
   * Update for engine trouble scenario
   */
  updateEngineTrouble() {
    // Simulate rough idle and misfires
    this.state.rpm = 800 + Math.random() * 200 - 100; // Rough idle
    this.state.engineLoad = 20 + Math.random() * 20;
    
    // Irregular O2 sensor readings
    this.state.o2Sensor = 0.45 + (Math.random() - 0.5) * 0.3;
    
    // Poor fuel trim
    this.state.fuelTrim = -10 + Math.random() * 20;
    
    // Set fault states
    this.faultStates.misfire = Math.random() > 0.7;
    this.faultStates.roughIdle = true;
  }

  /**
   * Update for low fuel scenario
   */
  updateLowFuel() {
    // Simulate low fuel level
    this.state.fuelLevel = Math.max(5, 10 + Math.sin(this.engineRunTime * 0.1) * 5);
    this.state.fuelPressure = Math.max(180, 250 - (15 - this.state.fuelLevel) * 10);
    
    // Fuel system struggles
    if (this.state.fuelLevel < 8) {
      this.state.rpm = this.state.rpm + (Math.random() - 0.5) * 100;
      this.faultStates.lowFuel = true;
    }
  }

  /**
   * Update calculated values
   */
  updateCalculatedValues(deltaTime: number) {
    // Update odometer
    const distanceTraveled = (this.state.speed * deltaTime) / 3600; // km
    this.state.tripOdometer += distanceTraveled;
    this.state.odometer += distanceTraveled;
    this.tripDistance += distanceTraveled;
    
    // Calculate fuel consumption
    const fuelRate = this.calculateFuelConsumption();
    this.fuelConsumed += fuelRate * deltaTime / 3600;
    
    // Update fuel level
    if (this.state.speed > 0) {
      this.state.fuelLevel = Math.max(0, this.state.fuelLevel - (fuelRate * deltaTime / 36000));
    }
    
    // Calculate fuel economy
    if (this.tripDistance > 0) {
      this.state.fuelEconomy = (this.fuelConsumed / this.tripDistance) * 100;
    }
    
    // Calculate average speed
    if (this.engineRunTime > 0) {
      this.state.averageSpeed = (this.tripDistance / this.engineRunTime) * 3600;
    }
    
    // Update engine hours
    this.state.engineHours += deltaTime / 3600;
  }

  /**
   * Calculate fuel consumption rate
   */
  calculateFuelConsumption() {
    // Base consumption rate (L/h)
    let baseRate = 0.8; // Idle consumption
    
    // Add consumption based on load and RPM
    baseRate += (this.state.engineLoad / 100) * 8;
    baseRate += (this.state.rpm / 6000) * 4;
    
    // Speed factor
    if (this.state.speed > 0) {
      baseRate += (this.state.speed / 100) * 2;
    }
    
    return Math.max(0.5, baseRate);
  }

  /**
   * Apply realistic variations to sensor readings
   */
  applyRealisticVariations() {
    // Add small random variations to simulate real sensor noise
    const addNoise = (value: number, percentage = 0.02) => {
      return value + (value * (Math.random() - 0.5) * percentage);
    };
    
    this.state.rpm = addNoise(this.state.rpm, 0.01);
    this.state.coolantTemp = addNoise(this.state.coolantTemp, 0.005);
    this.state.batteryVoltage = addNoise(this.state.batteryVoltage, 0.01);
    this.state.o2Sensor = addNoise(this.state.o2Sensor, 0.05);
    this.state.maf = addNoise(this.state.maf, 0.02);
  }

  /**
   * Enforce vehicle operating limits
   */
  enforceLimits() {
    // Enforce RPM limits
    this.state.rpm = Math.max(this.limits.rpm.min, 
                             Math.min(this.limits.rpm.max, this.state.rpm));
    
    // Enforce speed limits
    this.state.speed = Math.max(this.limits.speed.min, 
                               Math.min(this.limits.speed.max, this.state.speed));
    
    // Enforce temperature limits
    this.state.coolantTemp = Math.max(this.limits.coolantTemp.min, 
                                     Math.min(this.limits.coolantTemp.max, this.state.coolantTemp));
    
    // Enforce voltage limits
    this.state.batteryVoltage = Math.max(this.limits.batteryVoltage.min, 
                                        Math.min(this.limits.batteryVoltage.max, this.state.batteryVoltage));
    
    // Enforce percentage limits
    this.state.engineLoad = Math.max(0, Math.min(100, this.state.engineLoad));
    this.state.throttlePos = Math.max(0, Math.min(100, this.state.throttlePos));
    this.state.fuelLevel = Math.max(0, Math.min(100, this.state.fuelLevel));
  }

  /**
   * Set simulation scenario
   */
  setScenario(scenario: string) {
    // Reset some state when changing scenarios
    if (scenario === 'cold_start') {
      this.trends.warmupTime = 0;
      this.trends.warmupPhase = true;
      this.state.coolantTemp = 20;
      this.state.oilTemp = 20;
    }
    
    // Clear fault states unless it's a fault scenario
    if (!['overheating', 'engine_trouble', 'low_fuel'].includes(scenario)) {
      this.faultStates = {};
    }
  }

  /**
   * Get current vehicle data
   */
  getCurrentData() {
    return {
      ...this.state,
      faultStates: { ...this.faultStates },
      trends: { ...this.trends },
      runtime: this.engineRunTime,
      tripDistance: this.tripDistance,
      fuelConsumed: this.fuelConsumed
    };
  }

  /**
   * Reset vehicle state
   */
  reset() {
    this.initialize();
  }

  /**
   * Get fault states for DTC generation
   */
  getFaultStates() {
    return this.faultStates;
  }
}