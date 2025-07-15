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
    
    // Start the engine for realistic data
    mockDataGenerator.startEngine();
    
    // Add some test DTCs randomly when starting simulation
    if (Math.random() < 0.7) { // 70% chance of having DTCs
      mockDataGenerator.addTestDTCs();
    }
    
    // Check initial MIL status
    const initialDTCs = mockDataGenerator.generateDTCs();
    const hasActiveDTCs = initialDTCs.some(dtc => 
      (dtc.severity === 'critical' || dtc.severity === 'moderate') && dtc.status === 'active'
    );
    this.milActive = hasActiveDTCs;
    if (hasActiveDTCs) {
      this.notifyCallbacks('mil_status', { active: true });
    }
    
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