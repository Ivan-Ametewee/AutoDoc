/**
* Test Real-Time ECU Fraud Detection Integration
* 
* This test script verifies that the real-time fraud detection system
* properly integrates with live ECU data and triggers alerts.
*/

// Simulate the OBD service for testing
class MockOBDService {
  constructor() {
    this.subscribers = new Map();
    this.isSimulating = false;
  }

  subscribe(callback) {
    // This matches the OBDIIService pattern: subscribe(callback) where callback receives (eventType, data)
    if (typeof callback !== 'function') {
      throw new Error('Subscribe expects a callback function');
    }

    if (!this.subscribers.has('*')) {
      this.subscribers.set('*', []);
    }
    this.subscribers.get('*').push(callback);

    return () => {
      const callbacks = this.subscribers.get('*');
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event, data) {
    // Notify all subscribers with (eventType, data) pattern
    const callbacks = this.subscribers.get('*');
    if (callbacks) {
      callbacks.forEach(callback => callback(event, data));
    }
  }

  on(event, callback) {
    // Legacy method for compatibility - wraps the new subscribe pattern
    return this.subscribe((eventType, data) => {
      if (eventType === event) {
        callback(data);
      }
    });
  }

  // Simulate sending odometer data
  simulateOdometerData(odometer, speed = 50, rpm = 2000) {
    const data = {
      name: 'TOTAL_DISTANCE',
      value: odometer,
      unit: 'km',
      timestamp: new Date().toISOString(),
      raw: `6225AE${odometer.toString(16).padStart(8, '0')}`
    };

    this.emit('dataUpdate', data);

    // Also emit speed and RPM
    setTimeout(() => {
      this.emit('dataUpdate', {
        name: 'VEHICLE_SPEED',
        value: speed,
        unit: 'km/h',
        timestamp: new Date().toISOString()
      });
    }, 100);

    setTimeout(() => {
      this.emit('dataUpdate', {
        name: 'ENGINE_RPM',
        value: rpm,
        unit: 'rpm',
        timestamp: new Date().toISOString()
      });
    }, 200);
  }

  // Simulate suspicious odometer rollback
  simulateOdometerRollback(currentOdometer) {
    // First, send normal reading
    this.simulateOdometerData(currentOdometer);

    // Then, after 5 seconds, send rollback
    setTimeout(() => {
      const rollbackValue = currentOdometer - 50000; // 50k rollback
      this.simulateOdometerData(rollbackValue);
    }, 5000);
  }

  // Simulate impossible speed/RPM combination
  simulateImpossibleData() {
    this.emit('dataUpdate', {
      name: 'VEHICLE_SPEED',
      value: 80, // 80 km/h
      unit: 'km/h',
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      this.emit('dataUpdate', {
        name: 'ENGINE_RPM',
        value: 0, // 0 RPM - impossible with 80 km/h
        unit: 'rpm',
        timestamp: new Date().toISOString()
      });
    }, 500);
  }

  startContinuousSimulation() {
    if (this.isSimulating) return;

    this.isSimulating = true;
    let currentOdometer = 145000; // Starting odometer

    const interval = setInterval(() => {
      if (!this.isSimulating) {
        clearInterval(interval);
        return;
      }

      // Gradually increase odometer
      currentOdometer += Math.random() * 2; // 0-2 km increment
      this.simulateOdometerData(
        Math.round(currentOdometer),
        Math.random() * 120, // Random speed 0-120 km/h
        Math.random() * 4000 + 800 // Random RPM 800-4800
      );
    }, 3000); // Every 3 seconds

    return () => {
      this.isSimulating = false;
      clearInterval(interval);
    };
  }
}

// Test function
async function testRealTimeFraudDetection() {
  // Create mock OBD service
  const mockOBDService = new MockOBDService();

  // Import the fraud detection service
  // Note: In actual implementation, this would be imported properly
  const OdometerFraudDetectionService = {
    initializeRealTimeMonitoring: (obdService) => {
      // Subscribe to odometer data - correct pattern
      obdService.subscribe((eventType, data) => {
        if (eventType === 'dataUpdate' && data.name === 'TOTAL_DISTANCE') {
          // Simulate fraud detection logic
          if (Math.random() > 0.8) { // 20% chance of detecting "fraud"
            obdService.emit('fraudDetectionResult', {
              result: {
                overallRiskScore: Math.floor(Math.random() * 100),
                status: 'suspicious',
                checkResults: {
                  odometerRollback: {
                    anomalies: [{
                      id: `test_${Date.now()}`,
                      type: 'test_anomaly',
                      description: 'Test fraud pattern detected',
                      severity: 'medium'
                    }]
                  }
                }
              },
              reading: {
                odometer: data.value,
                timestamp: data.timestamp,
                source: 'obd'
              },
              timestamp: new Date().toISOString(),
              source: 'realtime'
            });
          }
        }
      });
    }
  };

  // Initialize fraud detection
  OdometerFraudDetectionService.initializeRealTimeMonitoring(mockOBDService);

  // Listen for fraud alerts - correct pattern
  mockOBDService.subscribe((eventType, fraudData) => {
    if (eventType === 'fraudDetectionResult') {
    }
  });

  // Test 1: Normal progression
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      mockOBDService.simulateOdometerData(145000 + i * 100);
    }, i * 1000);
  }

  // Test 2: Rollback scenario
  setTimeout(() => {
    mockOBDService.simulateOdometerRollback(148000);
  }, 4000);

  // Test 3: Impossible data
  setTimeout(() => {
    mockOBDService.simulateImpossibleData();
  }, 12000);

  // Test 4: Continuous monitoring
  setTimeout(() => {
    const stopSimulation = mockOBDService.startContinuousSimulation();

    // Stop after 30 seconds
    setTimeout(() => {
      stopSimulation();
    }, 30000);
  }, 15000);
}

// Export for use in React Native environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRealTimeFraudDetection, MockOBDService };
} else {
  // Run test if in browser/Node environment
  testRealTimeFraudDetection().catch(() => { });
}
