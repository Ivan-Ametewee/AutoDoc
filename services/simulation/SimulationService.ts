// services/simulation/SimulationService.ts

import { VehicleSimulator } from './VehicleSimulator';
import mockDataGenerator from './MockDataGenerator';

type SimulationCallback = (eventType: string, data: any) => void;

class SimulationService {
  private isSimulating = false;
  private simulationInterval: number | null = null;
  private vehicleSimulator: VehicleSimulator;
  private callbacks: Set<SimulationCallback> = new Set();
  private currentData: any = {};
  private simulationSpeed = 1000; // ms
  private lastUpdateTime: number = Date.now();
  private milActive = false; // Malfunction Indicator Lamp status
  
  // **FIXED**: Declared the scenarios and currentScenario properties
  private scenarios = {
    NORMAL_DRIVING: 'normal_driving',
    HIGHWAY_DRIVING: 'highway_driving',
    CITY_DRIVING: 'city_driving',
    IDLE: 'idle',
    COLD_START: 'cold_start',
    OVERHEATING: 'overheating',
    ENGINE_TROUBLE: 'engine_trouble',
    LOW_FUEL: 'low_fuel'
  };
  private currentScenario: string = this.scenarios.NORMAL_DRIVING;

  constructor() {
    this.vehicleSimulator = new VehicleSimulator();
  }

  /**
   * Start the simulation service
   */
  public startSimulation(): void {
    if (this.isSimulating) {
      console.log('Simulation already running');
      return;
    }

    console.log('Starting OBDII simulation...');
    this.isSimulating = true;
    this.lastUpdateTime = Date.now();
    
    // Initialize vehicle state. Assuming initialize method exists on VehicleSimulator
    // this.vehicleSimulator.initialize(); 
    
    // Send initial data immediately for better UX
    this.updateSimulation();
    
    // Start the simulation loop
    this.simulationInterval = setInterval(() => {
      this.updateSimulation();
    }, this.simulationSpeed);

    this.notifyCallbacks('simulation_started', { status: 'started' });
  }

  /**
   * Stop the simulation service
   */
  public stopSimulation(): void {
    if (!this.isSimulating) {
      console.log('Simulation not running');
      return;
    }

    console.log('Stopping OBDII simulation...');
    this.isSimulating = false;
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    this.notifyCallbacks('simulation_stopped', { status: 'stopped' });
  }

  /**
   * Update simulation data
   */
  private updateSimulation(): void {
    const deltaTime = (Date.now() - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = Date.now();

    this.vehicleSimulator.update(deltaTime, this.currentScenario);
    this.currentData = mockDataGenerator.generateRealtimeData();
    
    // Check if there are active DTCs to set MIL status
    const activeDTCs = mockDataGenerator.generateDTCs();
    const hasActiveDTCs = activeDTCs.some(dtc => 
      (dtc.severity === 'critical' || dtc.severity === 'moderate') && dtc.status === 'active'
    );
    
    if (hasActiveDTCs !== this.milActive) {
      this.milActive = hasActiveDTCs;
      this.notifyCallbacks('mil_status', { active: this.milActive });
    }
    
    this.notifyCallbacks('data_update', this.currentData);
  }

  public registerCallback(callback: SimulationCallback): void {
    this.callbacks.add(callback);
  }

  public unregisterCallback(callback: SimulationCallback): void {
    this.callbacks.delete(callback);
  }

  private notifyCallbacks(eventType: string, data: any): void {
    this.callbacks.forEach(callback => callback(eventType, data));
  }

  /**
   * Change simulation scenario
   */
  public setScenario(scenario: string): void {
    if (Object.values(this.scenarios).includes(scenario)) {
      console.log(`Changing simulation scenario to: ${scenario}`);
      // **FIXED**: Correctly assign to `this.currentScenario`
      this.currentScenario = scenario; 
      // Assuming `setScenario` exists on VehicleSimulator
      this.vehicleSimulator.setScenario(scenario);
      
      this.notifyCallbacks('scenario_changed', { 
        scenario: scenario,
        timestamp: Date.now()
      });
    } else {
      console.warn(`Invalid scenario: ${scenario}`);
    }
  }

  /**
   * Set simulation speed (update interval in milliseconds)
   */
  public setSimulationSpeed(speed: number): void {
    if (speed >= 100 && speed <= 5000) {
      this.simulationSpeed = speed;
      
      if (this.isSimulating) {
        this.stopSimulation();
        setTimeout(() => this.startSimulation(), 100);
      }
    }
  }

  /**
   * Get current simulation data
   */
  public getCurrentData(): any {
    return this.currentData;
  }

  /**
   * Get simulation status
   */
  public getStatus(): any {
    return {
      isRunning: this.isSimulating,
      scenario: this.currentScenario,
      speed: this.simulationSpeed,
      uptime: this.isSimulating ? Date.now() - this.lastUpdateTime : 0,
      // **FIXED**: Removed call to non-existent method `getStatistics`
      // In a real app, you might track this separately.
      dataPointsGenerated: 'N/A' 
    };
  }

  /**
   * Generate diagnostic trouble codes for testing
   */
  public generateDTCs(): any[] {
    // **FIXED**: `generateDTCs` on mockDataGenerator doesn't take arguments
    return mockDataGenerator.generateDTCs(); 
  }

  /**
   * Clear DTCs and turn off MIL
   */
  public clearDTCs(): boolean {
    const success = mockDataGenerator.clearDTCs();
    if (success) {
      this.milActive = false;
      this.notifyCallbacks('mil_status', { active: false });
      this.notifyCallbacks('dtc_cleared', { success: true });
      console.log('Simulation: DTCs cleared, MIL turned off');
    }
    return success;
  }

  /**
   * Get MIL status
   */
  public getMILStatus(): boolean {
    return this.milActive;
  }

  /**
   * Generate mock system readiness status for simulation
   */
  public getSystemReadinessStatus(): any {
    // Generate realistic system readiness data based on current scenario  
    // Updated to match Mode 05/06 format with descriptions
    const baseReadiness = {
      misfireMonitor: { 
        supported: true, 
        ready: true,
        description: 'Misfire Monitor General Data',
        testResults: { passed: true, rawData: 'SIMULATED' }
      },
      fuelSystemMonitor: { 
        supported: true, 
        ready: true,
        description: 'Fuel System Monitor Bank 1',
        testResults: { passed: true, rawData: 'SIMULATED' }
      },
      catalystMonitor: { 
        supported: true, 
        ready: this.currentScenario !== this.scenarios.ENGINE_TROUBLE,
        description: 'Catalyst Monitor Bank 1',
        testResults: { 
          passed: this.currentScenario !== this.scenarios.ENGINE_TROUBLE, 
          rawData: 'SIMULATED' 
        }
      },
      heatedCatalystMonitor: { 
        supported: true, 
        ready: true,
        description: 'Heated Catalyst Monitor Bank 1',
        testResults: { passed: true, rawData: 'SIMULATED' }
      },
      evaporativeSystemMonitor: { 
        supported: true, 
        ready: this.currentScenario !== this.scenarios.COLD_START,
        description: 'EVAP Monitor (Cap Off / 0.150")',
        testResults: { 
          passed: this.currentScenario !== this.scenarios.COLD_START, 
          rawData: 'SIMULATED' 
        }
      },
      secondaryAirSystemMonitor: { 
        supported: false, 
        ready: false,
        description: 'Secondary Air Monitor 1',
        testResults: null
      },
      oxygenSensorMonitor: { 
        supported: true, 
        ready: true,
        description: 'O2 Sensor Monitor Bank 1 - Sensor 1',
        testResults: { passed: true, rawData: 'SIMULATED' }
      },
      oxygenSensorHeaterMonitor: { 
        supported: true, 
        ready: true,
        description: 'O2 Sensor Heater Monitor Bank 1 - Sensor 1',
        testResults: { passed: true, rawData: 'SIMULATED' }
      },
      egrSystemMonitor: { 
        supported: true, 
        ready: this.currentScenario !== this.scenarios.OVERHEATING,
        description: 'EGR Monitor Bank 1',
        testResults: { 
          passed: this.currentScenario !== this.scenarios.OVERHEATING, 
          rawData: 'SIMULATED' 
        }
      }
    };

    // Modify readiness based on current scenario
    switch (this.currentScenario) {
      case this.scenarios.COLD_START:
        // During cold start, some monitors may not be ready
        baseReadiness.catalystMonitor.ready = false;
        baseReadiness.evaporativeSystemMonitor.ready = false;
        baseReadiness.oxygenSensorMonitor.ready = false;
        break;
        
      case this.scenarios.ENGINE_TROUBLE:
        // Engine trouble affects multiple systems
        baseReadiness.misfireMonitor.ready = false;
        baseReadiness.catalystMonitor.ready = false;
        baseReadiness.fuelSystemMonitor.ready = false;
        break;
        
      case this.scenarios.OVERHEATING:
        // Overheating affects temperature-sensitive systems
        baseReadiness.catalystMonitor.ready = false;
        baseReadiness.egrSystemMonitor.ready = false;
        break;
        
      default:
        // Normal scenarios - most systems ready
        break;
    }

    // If MIL is active, some monitors might not be ready
    if (this.milActive) {
      baseReadiness.misfireMonitor.ready = false;
    }

    console.log('🔧 Generated system readiness status for scenario:', this.currentScenario);
    return baseReadiness;
  }

  /**
   * Simulate connection events
   */
  public simulateConnectionEvent(eventType: string): void {
    const events: { [key: string]: any } = {
      'connect': { status: 'connected', device: 'ELM327 Simulator' },
      'disconnect': { status: 'disconnected', reason: 'simulation' },
      'error': { status: 'error', error: 'Simulated connection error' },
      'timeout': { status: 'timeout', message: 'Connection timeout simulation' }
    };

    if (events[eventType]) {
      this.notifyCallbacks('connection_event', events[eventType]);
    }
  }

  /**
   * Get available scenarios
   */
  public getAvailableScenarios(): { key: string, name: string, description: string }[] {
    return Object.keys(this.scenarios).map(key => ({
      key: this.scenarios[key as keyof typeof this.scenarios],
      name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      description: this.getScenarioDescription(this.scenarios[key as keyof typeof this.scenarios])
    }));
  }

  /**
   * Get scenario description
   */
  private getScenarioDescription(scenario: string): string {
    const descriptions: { [key: string]: string } = {
      [this.scenarios.NORMAL_DRIVING]: 'Regular city/suburban driving conditions',
      [this.scenarios.HIGHWAY_DRIVING]: 'High-speed highway driving simulation',
      [this.scenarios.CITY_DRIVING]: 'Stop-and-go city traffic simulation',
      [this.scenarios.IDLE]: 'Vehicle idling with engine running',
      [this.scenarios.COLD_START]: 'Cold engine startup sequence',
      [this.scenarios.OVERHEATING]: 'Engine overheating scenario',
      [this.scenarios.ENGINE_TROUBLE]: 'Various engine problems simulation',
      [this.scenarios.LOW_FUEL]: 'Low fuel level warnings and effects'
    };
    
    return descriptions[scenario] || 'Unknown scenario';
  }

  /**
   * Reset simulation to initial state
   */
  public reset(): void {
    const wasRunning = this.isSimulating;
    if (wasRunning) {
      this.stopSimulation();
    }
    
    // **FIXED**: Call reset on the instances
    this.vehicleSimulator.reset(); 
    mockDataGenerator.reset(); 
    this.currentData = {};
    this.currentScenario = this.scenarios.NORMAL_DRIVING;
    
    if (wasRunning) {
      setTimeout(() => this.startSimulation(), 100);
    }
    
    this.notifyCallbacks('simulation_reset', { timestamp: Date.now() });
  }

  /**
   * Generate historical data for fraud detection testing
   */
  public generateHistoricalData(daysBack: number = 30): any[] {
    console.log(`🗂️ Generating ${daysBack} days of historical data for fraud detection`);
    
    const historicalData = [];
    const now = new Date();
    const currentData = this.getCurrentData();
    
    // Get base odometer from current simulation data
    const mockReadings = mockDataGenerator.getCurrentReadings();
    const baseOdometer = currentData.odometer || mockReadings.TOTAL_DISTANCE || 45000;
    const baseEngineHours = currentData.engineHours || 150; // TODO: Add engineHours property to MockDataGenerator
    
    for (let i = daysBack; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      
      // Calculate realistic odometer progression (30-80 km per day average)
      const dailyDistance = 30 + Math.random() * 50; // 30-80 km
      const totalDistanceBack = i * dailyDistance;
      
      // Calculate engine hours (assuming 1-3 hours of driving per day)
      const dailyEngineHours = 1 + Math.random() * 2; // 1-3 hours
      const totalEngineHoursBack = i * dailyEngineHours;
      
      historicalData.push({
        id: `historical_${i}`,
        timestamp: timestamp.toISOString(),
        odometer: Math.max(0, baseOdometer - totalDistanceBack),
        mileage: Math.max(0, baseOdometer - totalDistanceBack),
        source: 'obd',
        engineHours: Math.max(0, baseEngineHours - totalEngineHoursBack),
        vehicleSpeed: i === 0 ? (currentData.speed || 0) : Math.random() * 60, // Random historical speeds
        engineRPM: i === 0 ? (currentData.rpm || 0) : 800 + Math.random() * 2000,
        distanceSinceCodesCleared: Math.max(0, 5000 - totalDistanceBack),
        distanceWithMILOn: 0,
        fuelLevel: 20 + Math.random() * 60, // 20-80% fuel level
        raw: `historical_simulation_${i}`
      });
    }
    
    // Sort by timestamp (oldest first)
    historicalData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log(`✅ Generated ${historicalData.length} historical data points`);
    return historicalData;
  }

  /**
   * Set up fraud demo scenarios (delegates to MockDataGenerator)
   */
  public setupFraudDemoScenario(scenario: 'clean' | 'rollback' | 'tampering' | 'sophisticated'): void {
    console.log(`🎯 SimulationService: Setting up fraud demo scenario: ${scenario}`);
    
    // Delegate to MockDataGenerator which has the actual implementation
    if (mockDataGenerator && typeof mockDataGenerator.setupFraudDemoScenario === 'function') {
      mockDataGenerator.setupFraudDemoScenario(scenario);
      
      // Notify callbacks about the fraud scenario change
      this.notifyCallbacks('fraud_scenario_changed', {
        scenario,
        timestamp: Date.now(),
        fraudStatus: mockDataGenerator.getFraudSimulationStatus()
      });
    } else {
      console.error('❌ MockDataGenerator.setupFraudDemoScenario method not available');
      throw new Error('Fraud demo scenario setup not available in MockDataGenerator');
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopSimulation();
    this.callbacks.clear();
    // **FIXED**: Can't set imported modules to null, just clear local references
    this.currentData = {};
  }
}

// Export a singleton instance for the rest of the app to use
const simulationService = new SimulationService();
export { simulationService, SimulationService }; // Export both instance and type