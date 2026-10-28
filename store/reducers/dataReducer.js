// src/store/reducers/dataReducer.js

const initialState = {
  // Real-time Vehicle Data
  liveData: {
    rpm: 0,
    speed: 0,
    engineTemp: 0, // Renamed from coolantTemp to match VehicleData interface
    engineLoad: 0,
    intakeAirTemp: 0, // Renamed from intakeTemp
    maf: 0, // Mass Air Flow
    throttlePosition: 0,
    fuelPressure: 0,
    fuelLevel: 0,
    o2Voltage: 0, // Renamed from oxygenSensor1 to match VehicleData interface
    oxygenSensor2: 0,
    timing: 0, // Added timing advance
    batteryVoltage: null, // Will show dashes until real data received
    calculatedEngineLoad: 0,
    absoluteThrottlePosition: 0,
    ambientAirTemp: 0,
    fuelTrimBank1: 0,
    fuelTrimBank2: 0,
    intakeManifoldPressure: 0,
    engineRunTime: 0,
    distanceTraveledSinceClear: 0,
    barometricPressure: 0,
    catalystTemp: 0,
    evapSystemVaporPressure: 0,
    // Odometer and related fields for fraud detection
    odometer: null, // Will show dashes until real data received
    tripOdometer: null, // Trip distance in km  
    engineHours: null, // Engine runtime in hours
    distanceSinceCodesCleared: null, // Distance since codes cleared
    distanceWithMILOn: null, // Distance with MIL on
    runtimeSinceEngineStart: null, // Runtime since engine start
    lastUpdate: null,
  },

  // PID-specific data storage
  pidData: {},
  rawPIDValues: {}, // Store raw PID responses for debugging

  // Data Collection
  isCollectingData: false,
  dataCollectionInterval: 1000, // milliseconds
  lastDataUpdate: null,
  dataPoints: [],
  maxDataPoints: 1000,

  // Historical Data
  sessionData: [],
  historicalSessions: [],
  currentSessionId: null,
  sessionStartTime: null, // Fix: should be null, not string
  sessionDuration: 0,

  // Diagnostic Trouble Codes
  dtcCodes: [],
  pendingDtcCodes: [],
  permanentDtcCodes: [],
  dtcCount: 0,
  milStatus: false, // Malfunction Indicator Lamp

  // Freeze Frame Data
  freezeFrameData: [],

  // Readiness Tests
  readinessTests: {
    catalystTest: 'not_ready',
    heatedCatalystTest: 'not_ready',
    evaporativeSystemTest: 'not_ready',
    secondaryAirSystemTest: 'not_ready',
    acRefrigerantTest: 'not_ready',
    oxygenSensorTest: 'not_ready',
    oxygenSensorHeaterTest: 'not_ready',
    egrSystemTest: 'not_ready',
    compressionIgnitionTest: 'not_ready',
    misfire: 'not_ready',
    fuelSystem: 'not_ready',
    components: 'not_ready',
  },

  // Vehicle Information
  vehicleInfo: {
    vin: null,
    make: null,
    model: null,
    year: null,
    engine: null,
    transmission: null,
    fuelType: null,
    ecuId: null,
    supportedPids: [],
  },

  // Data Processing
  calculatedValues: {
    avgSpeed: 0,
    avgRpm: 0,
    maxSpeed: 0,
    maxRpm: 0,
    fuelEfficiency: 0,
    co2Emissions: 0,
    engineEfficiency: 0,
    idleTime: 0,
    drivingTime: 0,
    hardAccelerations: 0,
    hardBraking: 0,
  },

  // Alerts and Thresholds
  activeAlerts: [],
  alertHistory: [],
  thresholds: {
    rpm: { min: 0, max: 6000, warning: 5500 },
    speed: { min: 0, max: 200, warning: 120 },
    coolantTemp: { min: 70, max: 110, warning: 100 },
    engineLoad: { min: 0, max: 100, warning: 90 },
    throttlePosition: { min: 0, max: 100, warning: 95 },
    batteryVoltage: { min: 11.0, max: 15.0, warning: 11.5 },
  },

  // Data Export
  exportSettings: {
    format: 'csv', // 'csv' | 'json' | 'pdf'
    includeCalculatedValues: true,
    includeAlerts: true,
    dateRange: 'session', // 'session' | 'day' | 'week' | 'month' | 'custom'
  },

  // Error Handling
  dataErrors: [],
  lastDataError: null,
  errorCount: 0,

  // Simulation Mode
  isSimulationMode: false,
  simulationScenario: 'normal', // 'normal' | 'highway' | 'city' | 'idle' | 'diagnostic'
};

const dataReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'data/updatePIDData':
      const { pidData, vehicleData } = action.payload;
      
      return {
        ...state,
        // Update PID-specific storage with serialized timestamps
        pidData: {
          ...state.pidData,
          [pidData.name]: {
            ...pidData,
            timestamp: pidData.timestamp instanceof Date ? pidData.timestamp.toISOString() : String(pidData.timestamp)
          },
        },
        rawPIDValues: {
          ...state.rawPIDValues,
          [pidData.name]: pidData.raw,
        },
        // Update live data with mapped vehicle data
        liveData: {
          ...state.liveData,
          ...vehicleData,
        },
        lastDataUpdate: pidData.timestamp instanceof Date ? pidData.timestamp.toISOString() : String(pidData.timestamp),
      };

    default:
      return state;
  }
};

export default dataReducer;