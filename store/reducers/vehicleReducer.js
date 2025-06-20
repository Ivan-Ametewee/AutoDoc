// src/store/reducers/vehicleReducer.js

const initialState = {
  // Current Active Vehicle
  activeVehicle: null,
  
  // Vehicle Profiles
  vehicles: [],
  
  // Vehicle Information Template
  defaultVehicleInfo: {
    // Basic Information
    id: null,
    name: '',
    nickname: '',
    vin: '',
    make: '',
    model: '',
    year: null,
    trim: '',
    color: '',
    licensePlate: '',
    
    // Engine Information
    engine: {
      type: '', // 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'other'
      displacement: null, // in liters
      cylinders: null,
      configuration: '', // 'inline' | 'v' | 'boxer' | 'rotary'
      fuelSystem: '', // 'port_injection' | 'direct_injection' | 'carburetor'
      turbocharger: false,
      supercharger: false,
      compressionRatio: null,
      maxPower: null, // HP
      maxTorque: null, // lb-ft or Nm
    },
    
    // Transmission Information
    transmission: {
      type: '', // 'manual' | 'automatic' | 'cvt' | 'dual_clutch'
      gears: null,
      driveType: '', // 'fwd' | 'rwd' | 'awd' | '4wd'
    },
    
    // Technical Specifications
    specifications: {
      fuelCapacity: null, // gallons or liters
      mpg: {
        city: null,
        highway: null,
        combined: null,
      },
      weight: {
        curb: null, // lbs or kg
        gross: null,
      },
      dimensions: {
        length: null, // inches or cm
        width: null,
        height: null,
        wheelbase: null,
      },
      tires: {
        front: '',
        rear: '',
      },
    },
    
    // OBD Information
    obdInfo: {
      port: '', // 'obd1' | 'obd2'
      protocol: '', // 'iso9141' | 'kwp2000' | 'can' | 'vpw' | 'pwm'
      ecuCount: 1,
      supportedPids: [],
      supportedModes: [],
      vinSupported: false,
      calibrationId: '',
      cvn: '', // Calibration Verification Number
    },
    
    // Maintenance Information
    maintenance: {
      mileage: 0,
      lastOilChange: null,
      lastOilChangeMileage: null,
      oilChangeInterval: 5000,
      nextOilChange: null,
      lastInspection: null,
      inspectionDue: null,
      warrantyExpiration: null,
      insuranceExpiration: null,
      registrationExpiration: null,
    },
    
    // Service History
    serviceHistory: [],
    
    // Custom Settings per Vehicle
    customSettings: {
      thresholds: {},
      alerts: {},
      displayPreferences: {},
      dataCollectionSettings: {},
    },
    
    // Statistics
    statistics: {
      totalDistance: 0,
      totalDriveTime: 0,
      averageFuelEconomy: 0,
      maxSpeed: 0,
      maxRpm: 0,
      totalIdleTime: 0,
      hardAccelerations: 0,
      hardBraking: 0,
      diagnosticScans: 0,
      dtcCodesFound: 0,
      lastDriven: null,
      createdAt: null,
      updatedAt: null,
    },
    
    // Photos and Documents
    media: {
      photos: [],
      documents: [],
      manuals: [],
    },
    
    // Notes
    notes: '',
  },
  
  // Vehicle Detection
  autoDetection: {
    isDetecting: false,
    detectedInfo: null,
    detectionMethod: null, // 'vin' | 'manual' | 'database'
    detectionConfidence: 0,
    lastDetectionAttempt: null,
  },
  
  // Vehicle Database
  vehicleDatabase: {
    makes: [],
    models: {},
    years: {},
    trims: {},
    engines: {},
    lastUpdated: null,
    version: '1.0.0',
  },
  
  // Import/Export
  importExport: {
    isImporting: false,
    isExporting: false,
    lastImport: null,
    lastExport: null,
    importErrors: [],
    exportErrors: [],
  },
  
  // Comparison
  comparison: {
    selectedVehicles: [],
    comparisonMetrics: [
      'fuelEconomy',
      'performance',
      'maintenance',
      'diagnostics',
    ],
  },
  
  // Error Handling
  errors: [],
  lastError: null,
  
  // Loading States
  loading: {
    vehicles: false,
    vehicleInfo: false,
    detection: false,
    database: false,
  },
};

const vehicleReducer = (state = initialState, action) => {
  switch (action.type) {
    // Vehicle Management
    case 'ADD_VEHICLE':
      const newVehicle = {
        ...state.defaultVehicleInfo,
        ...action.payload.vehicle,
        id: action.payload.vehicle.id || Date.now().toString(),
        statistics: {
          ...state.defaultVehicleInfo.statistics,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      return {
        ...state,
        vehicles: [...state.vehicles, newVehicle],
        activeVehicle: state.activeVehicle || newVehicle.id,
      };

    case 'UPDATE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                ...action.payload.updates,
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'DELETE_VEHICLE':
      const remainingVehicles = state.vehicles.filter(
        vehicle => vehicle.id !== action.payload.vehicleId
      );
      
      return {
        ...state,
        vehicles: remainingVehicles,
        activeVehicle: state.activeVehicle === action.payload.vehicleId
          ? (remainingVehicles.length > 0 ? remainingVehicles[0].id : null)
          : state.activeVehicle,
      };

    case 'SET_ACTIVE_VEHICLE':
      return {
        ...state,
        activeVehicle: action.payload.vehicleId,
      };

    case 'DUPLICATE_VEHICLE':
      const originalVehicle = state.vehicles.find(v => v.id === action.payload.vehicleId);
      if (!originalVehicle) return state;

      const duplicatedVehicle = {
        ...originalVehicle,
        id: Date.now().toString(),
        name: `${originalVehicle.name} (Copy)`,
        nickname: `${originalVehicle.nickname} Copy`,
        vin: '',
        licensePlate: '',
        statistics: {
          ...state.defaultVehicleInfo.statistics,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        serviceHistory: [],
      };

      return {
        ...state,
        vehicles: [...state.vehicles, duplicatedVehicle],
      };

    // Vehicle Information Updates
    case 'UPDATE_VEHICLE_BASIC_INFO':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                ...action.payload.basicInfo,
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'UPDATE_VEHICLE_ENGINE_INFO':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                engine: {
                  ...vehicle.engine,
                  ...action.payload.engineInfo,
                },
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'UPDATE_VEHICLE_TRANSMISSION_INFO':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                transmission: {
                  ...vehicle.transmission,
                  ...action.payload.transmissionInfo,
                },
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'UPDATE_VEHICLE_SPECIFICATIONS':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                specifications: {
                  ...vehicle.specifications,
                  ...action.payload.specifications,
                },
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'UPDATE_VEHICLE_OBD_INFO':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                obdInfo: {
                  ...vehicle.obdInfo,
                  ...action.payload.obdInfo,
                },
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    // Maintenance
    case 'UPDATE_MAINTENANCE_INFO':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                maintenance: {
                  ...vehicle.maintenance,
                  ...action.payload.maintenanceInfo,
                },
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'ADD_SERVICE_RECORD':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                serviceHistory: [
                  ...vehicle.serviceHistory,
                  {
                    ...action.payload.serviceRecord,
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                  },
                ],
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'UPDATE_SERVICE_RECORD':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                serviceHistory: vehicle.serviceHistory.map(record =>
                  record.id === action.payload.recordId
                    ? { ...record, ...action.payload.updates }
                    : record
                ),
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'DELETE_SERVICE_RECORD':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                serviceHistory: vehicle.serviceHistory.filter(
                  record => record.id !== action.payload.recordId
                ),
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    // Custom Settings
    case 'UPDATE_VEHICLE_CUSTOM_SETTINGS':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                customSettings: {
                  ...vehicle.customSettings,
                  ...action.payload.settings,
                },
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    // Statistics
    case 'UPDATE_VEHICLE_STATISTICS':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                statistics: {
                  ...vehicle.statistics,
                  ...action.payload.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'INCREMENT_VEHICLE_STATISTIC':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                statistics: {
                  ...vehicle.statistics,
                  [action.payload.statistic]: vehicle.statistics[action.payload.statistic] + action.payload.value,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'RECORD_DRIVE_SESSION':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                statistics: {
                  ...vehicle.statistics,
                  totalDistance: vehicle.statistics.totalDistance + action.payload.distance,
                  totalDriveTime: vehicle.statistics.totalDriveTime + action.payload.driveTime,
                  totalIdleTime: vehicle.statistics.totalIdleTime + action.payload.idleTime,
                  hardAccelerations: vehicle.statistics.hardAccelerations + action.payload.hardAccelerations,
                  hardBraking: vehicle.statistics.hardBraking + action.payload.hardBraking,
                  maxSpeed: Math.max(vehicle.statistics.maxSpeed, action.payload.maxSpeed),
                  maxRpm: Math.max(vehicle.statistics.maxRpm, action.payload.maxRpm),
                  averageFuelEconomy: action.payload.avgFuelEconomy,
                  lastDriven: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    // Media Management
    case 'ADD_VEHICLE_PHOTO':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                media: {
                  ...vehicle.media,
                  photos: [
                    ...vehicle.media.photos,
                    {
                      id: Date.now().toString(),
                      uri: action.payload.photoUri,
                      caption: action.payload.caption || '',
                      timestamp: new Date().toISOString(),
                    },
                  ],
                },
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'DELETE_VEHICLE_PHOTO':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                media: {
                  ...vehicle.media,
                  photos: vehicle.media.photos.filter(
                    photo => photo.id !== action.payload.photoId
                  ),
                },
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'ADD_VEHICLE_DOCUMENT':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                media: {
                  ...vehicle.media,
                  documents: [
                    ...vehicle.media.documents,
                    {
                      id: Date.now().toString(),
                      name: action.payload.document.name,
                      type: action.payload.document.type,
                      uri: action.payload.document.uri,
                      size: action.payload.document.size,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                },
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'DELETE_VEHICLE_DOCUMENT':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                media: {
                  ...vehicle.media,
                  documents: vehicle.media.documents.filter(
                    doc => doc.id !== action.payload.documentId
                  ),
                },
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    // Vehicle Detection
    case 'START_VEHICLE_DETECTION':
      return {
        ...state,
        autoDetection: {
          ...state.autoDetection,
          isDetecting: true,
          detectedInfo: null,
          detectionMethod: null,
          detectionConfidence: 0,
        },
      };

    case 'VEHICLE_DETECTION_SUCCESS':
      return {
        ...state,
        autoDetection: {
          ...state.autoDetection,
          isDetecting: false,
          detectedInfo: action.payload.vehicleInfo,
          detectionMethod: action.payload.method,
          detectionConfidence: action.payload.confidence,
          lastDetectionAttempt: new Date().toISOString(),
        },
      };

    case 'VEHICLE_DETECTION_FAILED':
      return {
        ...state,
        autoDetection: {
          ...state.autoDetection,
          isDetecting: false,
          detectedInfo: null,
          detectionMethod: null,
          detectionConfidence: 0,
          lastDetectionAttempt: new Date().toISOString(),
        },
      };

    case 'CLEAR_DETECTION_RESULTS':
      return {
        ...state,
        autoDetection: {
          ...state.autoDetection,
          detectedInfo: null,
          detectionMethod: null,
          detectionConfidence: 0,
        },
      };

    // Vehicle Database
    case 'UPDATE_VEHICLE_DATABASE':
      return {
        ...state,
        vehicleDatabase: {
          ...state.vehicleDatabase,
          ...action.payload.database,
          lastUpdated: new Date().toISOString(),
        },
      };

    case 'ADD_MAKES_TO_DATABASE':
      return {
        ...state,
        vehicleDatabase: {
          ...state.vehicleDatabase,
          makes: [...new Set([...state.vehicleDatabase.makes, ...action.payload.makes])],
          lastUpdated: new Date().toISOString(),
        },
      };

    case 'ADD_MODELS_TO_DATABASE':
      return {
        ...state,
        vehicleDatabase: {
          ...state.vehicleDatabase,
          models: {
            ...state.vehicleDatabase.models,
            ...action.payload.models,
          },
          lastUpdated: new Date().toISOString(),
        },
      };

    // Import/Export
    case 'START_VEHICLE_IMPORT':
      return {
        ...state,
        importExport: {
          ...state.importExport,
          isImporting: true,
          importErrors: [],
        },
      };

    case 'VEHICLE_IMPORT_SUCCESS':
      return {
        ...state,
        vehicles: [...state.vehicles, ...action.payload.vehicles],
        importExport: {
          ...state.importExport,
          isImporting: false,
          lastImport: new Date().toISOString(),
          importErrors: [],
        },
      };

    case 'VEHICLE_IMPORT_FAILED':
      return {
        ...state,
        importExport: {
          ...state.importExport,
          isImporting: false,
          importErrors: action.payload.errors,
        },
      };

    case 'START_VEHICLE_EXPORT':
      return {
        ...state,
        importExport: {
          ...state.importExport,
          isExporting: true,
          exportErrors: [],
        },
      };

    case 'VEHICLE_EXPORT_SUCCESS':
      return {
        ...state,
        importExport: {
          ...state.importExport,
          isExporting: false,
          lastExport: new Date().toISOString(),
          exportErrors: [],
        },
      };

    case 'VEHICLE_EXPORT_FAILED':
      return {
        ...state,
        importExport: {
          ...state.importExport,
          isExporting: false,
          exportErrors: action.payload.errors,
        },
      };

    // Comparison
    case 'SELECT_VEHICLES_FOR_COMPARISON':
      return {
        ...state,
        comparison: {
          ...state.comparison,
          selectedVehicles: action.payload.vehicleIds,
        },
      };

    case 'UPDATE_COMPARISON_METRICS':
      return {
        ...state,
        comparison: {
          ...state.comparison,
          comparisonMetrics: action.payload.metrics,
        },
      };

    case 'CLEAR_VEHICLE_COMPARISON':
      return {
        ...state,
        comparison: {
          ...state.comparison,
          selectedVehicles: [],
        },
      };

    // Loading States
    case 'SET_VEHICLES_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          vehicles: action.payload.loading,
        },
      };

    case 'SET_VEHICLE_INFO_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          vehicleInfo: action.payload.loading,
        },
      };

    case 'SET_DETECTION_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          detection: action.payload.loading,
        },
      };

    case 'SET_DATABASE_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          database: action.payload.loading,
        },
      };

    // Error Handling
    case 'VEHICLE_ERROR':
      return {
        ...state,
        errors: [
          ...state.errors.slice(-4), // Keep last 5 errors
          {
            timestamp: new Date().toISOString(),
            error: action.payload.error,
            context: action.payload.context,
          },
        ],
        lastError: action.payload.error,
      };

    case 'CLEAR_VEHICLE_ERRORS':
      return {
        ...state,
        errors: [],
        lastError: null,
      };

    // Bulk Operations
    case 'BULK_UPDATE_VEHICLES':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          action.payload.vehicleIds.includes(vehicle.id)
            ? {
                ...vehicle,
                ...action.payload.updates,
                statistics: {
                  ...vehicle.statistics,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    case 'BULK_DELETE_VEHICLES':
      const remainingVehiclesAfterBulk = state.vehicles.filter(
        vehicle => !action.payload.vehicleIds.includes(vehicle.id)
      );
      
      return {
        ...state,
        vehicles: remainingVehiclesAfterBulk,
        activeVehicle: action.payload.vehicleIds.includes(state.activeVehicle)
          ? (remainingVehiclesAfterBulk.length > 0 ? remainingVehiclesAfterBulk[0].id : null)
          : state.activeVehicle,
      };

    // Reset
    case 'RESET_VEHICLE_STATE':
      return initialState;

    case 'RESET_VEHICLE_STATISTICS':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === action.payload.vehicleId
            ? {
                ...vehicle,
                statistics: {
                  ...state.defaultVehicleInfo.statistics,
                  createdAt: vehicle.statistics.createdAt,
                  updatedAt: new Date().toISOString(),
                },
              }
            : vehicle
        ),
      };

    default:
      return state;
  }
};

export default vehicleReducer;