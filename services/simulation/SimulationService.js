// src/services/simulation/SimulationService.js

import { VehicleSimulator } from './VehicleSimulator';
import { MockDataGenerator } from './MockDataGenerator';

class SimulationService {
  constructor() {
    this.isSimulating = false;
    this.simulationInterval = null;
    this.vehicleSimulator = new VehicleSimulator();
    this.mockDataGenerator = new MockDataGenerator();
    this.callbacks = new Set();
    this.currentData = {};
    this.simulationSpeed = 1000; // milliseconds
    this.lastUpdateTime = Date.now();
    
    // Simulation scenarios
    this.scenarios = {
      NORMAL_DRIVING: 'normal_driving',
      HIGHWAY_DRIVING: 'highway_driving',
      CITY_DRIVING: 'city_driving',
      IDLE: 'idle',
      COLD_START: 'cold_start',
      OVERHEATING: 'overheating',
      ENGINE_TROUBLE: 'engine_trouble',
      LOW_FUEL: 'low_fuel'
    };
    
    this.currentScenario = this.scenarios.NORMAL_DRIVING;
  }

  /**
   * Start the simulation service
   */
  startSimulation() {
    if (this.isSimulating) {
      console.log('Simulation already running');
      return;
    }

    console.log('Starting OBDII simulation...');
    this.isSimulating = true;
    this.lastUpdateTime = Date.now();
    
    // Initialize vehicle state
    this.vehicleSimulator.initialize();
    
    // Start the simulation loop
    this.simulationInterval = setInterval(() => {
      this.updateSimulation();
    }, this.simulationSpeed);

    // Notify callbacks that simulation started
    this.notifyCallbacks('simulation_started', { status: 'started' });
  }

  /**
   * Stop the simulation service
   */
  stopSimulation() {
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

    // Notify callbacks that simulation stopped
    this.notifyCallbacks('simulation_stopped', { status: 'stopped' });
  }

  /**
   * Update simulation data
   */
  updateSimulation() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // seconds
    this.lastUpdateTime = now;

    try {
      // Update vehicle state based on current scenario
      this.vehicleSimulator.update(deltaTime, this.currentScenario);
      
      // Get current vehicle data
      const vehicleData = this.vehicleSimulator.getCurrentData();
      
      // Generate mock OBDII data based on vehicle state
      this.currentData = this.mockDataGenerator.generateRealtimeData(vehicleData);
      
      // Add timestamp
      this.currentData.timestamp = now;
      this.currentData.scenario = this.currentScenario;
      
      // Notify all registered callbacks
      this.notifyCallbacks('data_update', this.currentData);
      
    } catch (error) {
      console.error('Error updating simulation:', error);
      this.notifyCallbacks('simulation_error', { error: error.message });
    }
  }

  /**
   * Register callback for simulation updates
   */
  registerCallback(callback) {
    if (typeof callback === 'function') {
      this.callbacks.add(callback);
      
      // Send current data immediately if simulation is running
      if (this.isSimulating && this.currentData) {
        callback('data_update', this.currentData);
      }
    }
  }

  /**
   * Unregister callback
   */
  unregisterCallback(callback) {
    this.callbacks.delete(callback);
  }

  /**
   * Notify all registered callbacks
   */
  notifyCallbacks(eventType, data) {
    this.callbacks.forEach(callback => {
      try {
        callback(eventType, data);
      } catch (error) {
        console.error('Error in simulation callback:', error);
      }
    });
  }

  /**
   * Change simulation scenario
   */
  setScenario(scenario) {
    if (Object.values(this.scenarios).includes(scenario)) {
      console.log(`Changing simulation scenario to: ${scenario}`);
      this.currentScenario = scenario;
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
  setSimulationSpeed(speed) {
    if (speed >= 100 && speed <= 5000) {
      this.simulationSpeed = speed;
      
      if (this.isSimulating) {
        // Restart with new speed
        this.stopSimulation();
        setTimeout(() => this.startSimulation(), 100);
      }
    }
  }

  /**
   * Get current simulation data
   */
  getCurrentData() {
    return this.currentData;
  }

  /**
   * Get simulation status
   */
  getStatus() {
    return {
      isRunning: this.isSimulating,
      scenario: this.currentScenario,
      speed: this.simulationSpeed,
      uptime: this.isSimulating ? Date.now() - this.lastUpdateTime : 0,
      dataPointsGenerated: this.mockDataGenerator.getStatistics().totalGenerated
    };
  }

  /**
   * Generate diagnostic trouble codes for testing
   */
  generateDTCs() {
    return this.mockDataGenerator.generateDTCs(this.currentScenario);
  }

  /**
   * Simulate connection events
   */
  simulateConnectionEvent(eventType) {
    const events = {
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
  getAvailableScenarios() {
    return Object.keys(this.scenarios).map(key => ({
      key: this.scenarios[key],
      name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      description: this.getScenarioDescription(this.scenarios[key])
    }));
  }

  /**
   * Get scenario description
   */
  getScenarioDescription(scenario) {
    const descriptions = {
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
  reset() {
    const wasRunning = this.isSimulating;
    
    if (wasRunning) {
      this.stopSimulation();
    }
    
    this.vehicleSimulator.reset();
    this.mockDataGenerator.reset();
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
  destroy() {
    this.stopSimulation();
    this.callbacks.clear();
    this.vehicleSimulator = null;
    this.mockDataGenerator = null;
    this.currentData = {};
  }
}

// Export singleton instance
export const simulationService = new SimulationService();
export { SimulationService };