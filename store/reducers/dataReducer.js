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
    // Data Collection
    case 'START_DATA_COLLECTION':
      return {
        ...state,
        isCollectingData: true,
        sessionStartTime: null, // Fix: should be null, not string
        currentSessionId: action.payload.sessionId,
        sessionData: [],
        activeAlerts: [],
      };

    case 'STOP_DATA_COLLECTION':
      return {
        ...state,
        isCollectingData: false,
        sessionDuration: action.payload.duration,
        sessionStartTime: null, // Fix: reset to null
        historicalSessions: [
          ...state.historicalSessions,
          {
            id: state.currentSessionId,
            startTime: state.sessionStartTime,
            endTime: new Date().toISOString(),
            duration: action.payload.duration,
            dataPoints: state.sessionData.length,
            calculatedValues: state.calculatedValues,
          },
        ],
      };

    case 'data/updateRealTimeData':
      const newDataPoint = {
        timestamp: new Date().toISOString(),
        ...action.payload,
      };

      return {
        ...state,
        liveData: {
          ...state.liveData,
          ...action.payload,
          lastUpdate: new Date(),
        },
        lastDataUpdate: new Date().toISOString(),
        dataPoints: [
          ...state.dataPoints.slice(-(state.maxDataPoints - 1)),
          newDataPoint,
        ],
        sessionData: [
          ...state.sessionData,
          newDataPoint,
        ],
      };

    case 'data/updatePIDData':
      const { pidData, vehicleData } = action.payload;
      
      return {
        ...state,
        // Update PID-specific storage
        pidData: {
          ...state.pidData,
          [pidData.name]: pidData,
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
        lastDataUpdate: pidData.timestamp.toISOString(),
      };

    case 'UPDATE_LIVE_DATA':
      const legacyDataPoint = {
        timestamp: new Date().toISOString(),
        ...action.payload.data,
      };

      return {
        ...state,
        liveData: {
          ...state.liveData,
          ...action.payload.data,
        },
        lastDataUpdate: new Date().toISOString(),
        dataPoints: [
          ...state.dataPoints.slice(-(state.maxDataPoints - 1)),
          legacyDataPoint,
        ],
        sessionData: [
          ...state.sessionData,
          legacyDataPoint,
        ],
      };

    case 'BATCH_UPDATE_DATA':
      return {
        ...state,
        liveData: {
          ...state.liveData,
          ...action.payload.data,
        },
        lastDataUpdate: new Date().toISOString(),
        dataPoints: [
          ...state.dataPoints.slice(-(state.maxDataPoints - action.payload.dataPoints.length)),
          ...action.payload.dataPoints,
        ],
      };

    // DTC Management
    case 'UPDATE_DTC_CODES':
      return {
        ...state,
        dtcCodes: action.payload.codes,
        dtcCount: action.payload.codes.length,
        milStatus: action.payload.milStatus,
      };

    case 'UPDATE_PENDING_DTC_CODES':
      return {
        ...state,
        pendingDtcCodes: action.payload.codes,
      };

    case 'CLEAR_DTC_CODES':
      return {
        ...state,
        dtcCodes: [],
        pendingDtcCodes: [],
        dtcCount: 0,
        milStatus: false,
      };

    case 'ADD_FREEZE_FRAME_DATA':
      return {
        ...state,
        freezeFrameData: [
          ...state.freezeFrameData,
          action.payload.data,
        ],
      };

    // Readiness Tests
    case 'UPDATE_READINESS_TESTS':
      return {
        ...state,
        readinessTests: {
          ...state.readinessTests,
          ...action.payload.tests,
        },
      };

    // Vehicle Information
    case 'UPDATE_VEHICLE_INFO':
      return {
        ...state,
        vehicleInfo: {
          ...state.vehicleInfo,
          ...action.payload.info,
        },
      };

    case 'UPDATE_SUPPORTED_PIDS':
      return {
        ...state,
        vehicleInfo: {
          ...state.vehicleInfo,
          supportedPids: action.payload.pids,
        },
      };

    // Calculated Values
    case 'UPDATE_CALCULATED_VALUES':
      return {
        ...state,
        calculatedValues: {
          ...state.calculatedValues,
          ...action.payload.values,
        },
      };

    // Alerts
    case 'ADD_ALERT':
      return {
        ...state,
        activeAlerts: [
          ...state.activeAlerts.filter(alert => alert.id !== action.payload.alert.id),
          action.payload.alert,
        ],
        alertHistory: [
          ...state.alertHistory,
          action.payload.alert,
        ],
      };

    case 'REMOVE_ALERT':
      return {
        ...state,
        activeAlerts: state.activeAlerts.filter(alert => alert.id !== action.payload.alertId),
      };

    case 'CLEAR_ALERTS':
      return {
        ...state,
        activeAlerts: [],
      };

    case 'UPDATE_THRESHOLDS':
      return {
        ...state,
        thresholds: {
          ...state.thresholds,
          ...action.payload.thresholds,
        },
      };

    // Data Management
    case 'CLEAR_SESSION_DATA':
      return {
        ...state,
        sessionData: [],
        currentSessionId: null,
        sessionStartTime: null,
        sessionDuration: 0,
        activeAlerts: [],
      };

    case 'CLEAR_HISTORICAL_DATA':
      return {
        ...state,
        historicalSessions: [],
        dataPoints: [],
        alertHistory: [],
      };

    case 'SET_DATA_COLLECTION_INTERVAL':
      return {
        ...state,
        dataCollectionInterval: action.payload.interval,
      };

    case 'SET_MAX_DATA_POINTS':
      return {
        ...state,
        maxDataPoints: action.payload.maxPoints,
      };

    // Simulation Mode
    case 'TOGGLE_SIMULATION_MODE':
      const newSimulationMode = !state.isSimulationMode;
      return {
        ...state,
        isSimulationMode: newSimulationMode,
        // Set simulation default values when entering simulation mode
        liveData: newSimulationMode ? {
          ...state.liveData,
          odometer: 45231, // Default simulation odometer value
          tripOdometer: 0,
          engineHours: 150,
          batteryVoltage: 12.0,
          distanceSinceCodesCleared: 0,
          distanceWithMILOn: 0,
          runtimeSinceEngineStart: 0,
        } : {
          // Reset to null values when exiting simulation mode
          ...state.liveData,
          odometer: null,
          tripOdometer: null,
          engineHours: null,
          batteryVoltage: null,
          distanceSinceCodesCleared: null,
          distanceWithMILOn: null,
          runtimeSinceEngineStart: null,
        },
      };

    case 'SET_SIMULATION_SCENARIO':
      return {
        ...state,
        simulationScenario: action.payload.scenario,
      };

    // Export Settings
    case 'UPDATE_EXPORT_SETTINGS':
      return {
        ...state,
        exportSettings: {
          ...state.exportSettings,
          ...action.payload.settings,
        },
      };

    // Error Handling
    case 'DATA_ERROR':
      return {
        ...state,
        dataErrors: [
          ...state.dataErrors.slice(-4), // Keep last 5 errors
          {
            timestamp: new Date().toISOString(),
            error: action.payload.error,
            context: action.payload.context,
          },
        ],
        lastDataError: action.payload.error,
        errorCount: state.errorCount + 1,
      };

    case 'CLEAR_DATA_ERRORS':
      return {
        ...state,
        dataErrors: [],
        lastDataError: null,
        errorCount: 0,
      };

    // Reset
    case 'RESET_DATA_STATE':
      return {
        ...initialState,
        vehicleInfo: state.vehicleInfo,
        thresholds: state.thresholds,
        exportSettings: state.exportSettings,
        isSimulationMode: state.isSimulationMode,
      };

    default:
      return state;
  }
};

export default dataReducer;