// src/store/reducers/settingsReducer.js

const initialState = {
  // App Settings
  app: {
    theme: 'dark', // 'light' | 'dark' | 'auto'
    language: 'en', // 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja'
    units: 'metric', // 'metric' | 'imperial'
    autoStart: false,
    keepScreenOn: true,
    enableHapticFeedback: true,
    enableSoundAlerts: true,
    enableNotifications: true,
    dataRetentionDays: 30,
    autoBackup: false,
    developerMode: false,
  },

  // Display Settings
  display: {
    refreshRate: 1000, // milliseconds
    maxGaugeValue: {
      rpm: 8000,
      speed: 200,
      coolantTemp: 120,
      engineLoad: 100,
      throttlePosition: 100,
    },
    showDigitalValues: true,
    showAnalogGauges: true,
    showGraphs: true,
    graphTimespan: 300, // seconds
    fontSize: 'medium', // 'small' | 'medium' | 'large'
    colorScheme: 'default', // 'default' | 'colorblind' | 'highContrast'
    dashboardLayout: 'grid', // 'grid' | 'list' | 'compact'
    customGaugeOrder: [],
    hiddenGauges: [],
  },

  // Connection Settings
  connection: {
    autoConnect: true,
    autoReconnect: true,
    connectionTimeout: 10000,
    dataTimeout: 5000,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    preferredConnectionType: 'bluetooth', // 'bluetooth' | 'wifi'
    bluetoothScanDuration: 30000,
    wifiScanDuration: 15000,
    enableConnectionLogging: false,
    logLevel: 'info', // 'debug' | 'info' | 'warn' | 'error'
  },

  // Data Collection Settings
  dataCollection: {
    enabled: true,
    interval: 1000, // milliseconds
    batchSize: 10,
    compressionEnabled: true,
    maxStorageSize: 500, // MB
    autoCleanup: true,
    priorityPids: ['01', '0C', '0D', '05', '0F'], // Engine Load, RPM, Speed, Coolant Temp, Intake Temp
    enabledPids: [],
    customPids: [],
    recordOnlyWhenDriving: false,
    minimumSpeedForRecording: 5, // km/h or mph
  },

  // Alert Settings
  alerts: {
    enabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    persistentNotifications: false,
    alertDelay: 3000, // milliseconds before showing alert
    autoAcknowledge: false,
    autoAcknowledgeDelay: 30000,
    emailAlerts: false,
    emailAddress: '',
    smsAlerts: false,
    phoneNumber: '',
    criticalAlertsOnly: false,
    muteAfterHours: false,
    muteStartTime: '22:00',
    muteEndTime: '08:00',
  },

  // Threshold Settings
  thresholds: {
    rpm: {
      warning: 5500,
      critical: 6500,
      enabled: true,
    },
    speed: {
      warning: 120,
      critical: 150,
      enabled: true,
    },
    coolantTemp: {
      warning: 100,
      critical: 110,
      enabled: true,
    },
    engineLoad: {
      warning: 85,
      critical: 95,
      enabled: true,
    },
    throttlePosition: {
      warning: 90,
      critical: 98,
      enabled: true,
    },
    batteryVoltage: {
      warningLow: 11.5,
      criticalLow: 11.0,
      warningHigh: 14.5,
      criticalHigh: 15.0,
      enabled: true,
    },
    fuelLevel: {
      warning: 15,
      critical: 5,
      enabled: true,
    },
    oilPressure: {
      warningLow: 20,
      criticalLow: 10,
      enabled: false,
    },
    intakeTemp: {
      warning: 60,
      critical: 80,
      enabled: true,
    },
  },

  // Export Settings
  export: {
    defaultFormat: 'csv', // 'csv' | 'json' | 'xml' | 'pdf'
    includeTimestamps: true,
    includeCalculatedValues: true,
    includeAlerts: true,
    includeDiagnostics: true,
    dateFormat: 'ISO', // 'ISO' | 'US' | 'EU' | 'custom'
    customDateFormat: 'YYYY-MM-DD HH:mm:ss',
    compression: 'none', // 'none' | 'zip' | 'gzip'
    emailExports: false,
    autoExportEnabled: false,
    autoExportInterval: 'daily', // 'hourly' | 'daily' | 'weekly' | 'monthly'
    exportLocation: 'documents', // 'documents' | 'downloads' | 'custom'
    customExportPath: '',
  },

  // Privacy Settings
  privacy: {
    shareUsageData: false,
    shareCrashReports: true,
    sharePerformanceData: false,
    anonymizeData: true,
    enableLocationTracking: false,
    dataSharingOptOut: false,
    clearDataOnUninstall: true,
  },

  // Advanced Settings
  advanced: {
    enableDebugMode: false,
    logLevel: 'info',
    maxLogSize: 10, // MB
    enableProtocolLogging: false,
    customInitCommands: [],
    enableRawDataView: false,
    allowCustomPids: false,
    enableSimulationMode: false,
    simulationDataFile: '',
    enableExperimentalFeatures: false,
    performanceMode: 'balanced', // 'power_saving' | 'balanced' | 'performance'
    enableMultipleConnections: false,
    customProtocolSettings: {},
  },

  // Backup Settings
  backup: {
    enabled: false,
    frequency: 'weekly', // 'daily' | 'weekly' | 'monthly'
    includeSettings: true,
    includeHistoricalData: true,
    includeVehicleProfiles: true,
    backupLocation: 'cloud', // 'local' | 'cloud' | 'both'
    cloudProvider: 'default', // 'default' | 'google' | 'dropbox' | 'onedrive'
    encryptBackups: true,
    maxBackupCount: 10,
    autoRestore: false,
  },

  // Diagnostic Settings
  diagnostics: {
    autoScanOnConnect: true,
    clearCodesAfterRepair: false,
    showPendingCodes: true,
    showPermanentCodes: true,
    enableFreezeFrameData: true,
    enableReadinessTests: true,
    diagnosticInterval: 30000, // milliseconds
    enableContinuousMonitoring: false,
    alertOnNewCodes: true,
    generateDiagnosticReports: true,
    includeVehicleInfo: true,
  },

  // Update Settings
  updates: {
    autoCheckUpdates: true,
    checkInterval: 86400000, // 24 hours in milliseconds
    autoDownload: false,
    autoInstall: false,
    allowBetaUpdates: false,
    updateChannel: 'stable', // 'stable' | 'beta' | 'alpha'
    notifyOnUpdates: true,
    updateOnWifi: true,
    updateOnCellular: false,
  },

  // User Preferences
  user: {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    preferredContactMethod: 'email', // 'email' | 'sms' | 'push'
    timezone: 'auto',
    dateFormat: 'auto',
    numberFormat: 'auto',
    experienceLevel: 'beginner', // 'beginner' | 'intermediate' | 'expert'
    showTutorials: true,
    showTips: true,
  },

  // Reset and Maintenance
  maintenance: {
    lastCleanup: null,
    lastBackup: null,
    lastUpdate: null,
    cacheSize: 0,
    databaseSize: 0,
    logSize: 0,
    totalAppUsage: 0,
    featuresUsed: [],
    crashCount: 0,
    lastCrash: null,
  },
};

const settingsReducer = (state = initialState, action) => {
  switch (action.type) {
    // App Settings
    case 'UPDATE_APP_SETTINGS':
      return {
        ...state,
        app: {
          ...state.app,
          ...action.payload,
        },
      };

    case 'SET_THEME':
      return {
        ...state,
        app: {
          ...state.app,
          theme: action.payload.theme,
        },
      };

    case 'SET_LANGUAGE':
      return {
        ...state,
        app: {
          ...state.app,
          language: action.payload.language,
        },
      };

    case 'SET_UNITS':
      return {
        ...state,
        app: {
          ...state.app,
          units: action.payload.units,
        },
      };

    // Display Settings
    case 'UPDATE_DISPLAY_SETTINGS':
      return {
        ...state,
        display: {
          ...state.display,
          ...action.payload,
        },
      };

    case 'SET_REFRESH_RATE':
      return {
        ...state,
        display: {
          ...state.display,
          refreshRate: action.payload.rate,
        },
      };

    case 'UPDATE_GAUGE_SETTINGS':
      return {
        ...state,
        display: {
          ...state.display,
          maxGaugeValue: {
            ...state.display.maxGaugeValue,
            ...action.payload.gaugeSettings,
          },
        },
      };

    case 'SET_DASHBOARD_LAYOUT':
      return {
        ...state,
        display: {
          ...state.display,
          dashboardLayout: action.payload.layout,
        },
      };

    case 'UPDATE_GAUGE_ORDER':
      return {
        ...state,
        display: {
          ...state.display,
          customGaugeOrder: action.payload.order,
        },
      };

    case 'TOGGLE_GAUGE_VISIBILITY':
      const { gaugeId, visible } = action.payload;
      const hiddenGauges = visible
        ? state.display.hiddenGauges.filter(id => id !== gaugeId)
        : [...state.display.hiddenGauges, gaugeId];

      return {
        ...state,
        display: {
          ...state.display,
          hiddenGauges,
        },
      };

    // Connection Settings
    case 'UPDATE_CONNECTION_SETTINGS':
      return {
        ...state,
        connection: {
          ...state.connection,
          ...action.payload,
        },
      };

    // Data Collection Settings
    case 'UPDATE_DATA_COLLECTION_SETTINGS':
      return {
        ...state,
        dataCollection: {
          ...state.dataCollection,
          ...action.payload,
        },
      };

    case 'UPDATE_ENABLED_PIDS':
      return {
        ...state,
        dataCollection: {
          ...state.dataCollection,
          enabledPids: action.payload.pids,
        },
      };

    case 'ADD_CUSTOM_PID':
      return {
        ...state,
        dataCollection: {
          ...state.dataCollection,
          customPids: [
            ...state.dataCollection.customPids,
            action.payload.pid,
          ],
        },
      };

    case 'REMOVE_CUSTOM_PID':
      return {
        ...state,
        dataCollection: {
          ...state.dataCollection,
          customPids: state.dataCollection.customPids.filter(
            pid => pid.id !== action.payload.pidId
          ),
        },
      };

    // Alert Settings
    case 'UPDATE_ALERT_SETTINGS':
      return {
        ...state,
        alerts: {
          ...state.alerts,
          ...action.payload,
        },
      };

    // Threshold Settings
    case 'UPDATE_THRESHOLDS':
      return {
        ...state,
        thresholds: {
          ...state.thresholds,
          ...action.payload.thresholds,
        },
      };

    case 'UPDATE_THRESHOLD':
      const { parameter, threshold } = action.payload;
      return {
        ...state,
        thresholds: {
          ...state.thresholds,
          [parameter]: {
            ...state.thresholds[parameter],
            ...threshold,
          },
        },
      };

    case 'RESET_THRESHOLDS_TO_DEFAULT':
      return {
        ...state,
        thresholds: initialState.thresholds,
      };

    // Export Settings
    case 'UPDATE_EXPORT_SETTINGS':
      return {
        ...state,
        export: {
          ...state.export,
          ...action.payload,
        },
      };

    // Privacy Settings
    case 'UPDATE_PRIVACY_SETTINGS':
      return {
        ...state,
        privacy: {
          ...state.privacy,
          ...action.payload,
        },
      };

    // Advanced Settings
    case 'UPDATE_ADVANCED_SETTINGS':
      return {
        ...state,
        advanced: {
          ...state.advanced,
          ...action.payload,
        },
      };

    case 'TOGGLE_DEBUG_MODE':
      return {
        ...state,
        advanced: {
          ...state.advanced,
          enableDebugMode: !state.advanced.enableDebugMode,
        },
      };

    case 'ADD_CUSTOM_INIT_COMMAND':
      return {
        ...state,
        advanced: {
          ...state.advanced,
          customInitCommands: [
            ...state.advanced.customInitCommands,
            action.payload.command,
          ],
        },
      };

    case 'REMOVE_CUSTOM_INIT_COMMAND':
      return {
        ...state,
        advanced: {
          ...state.advanced,
          customInitCommands: state.advanced.customInitCommands.filter(
            (_, index) => index !== action.payload.index
          ),
        },
      };

    // Backup Settings
    case 'UPDATE_BACKUP_SETTINGS':
      return {
        ...state,
        backup: {
          ...state.backup,
          ...action.payload,
        },
      };

    // Diagnostic Settings
    case 'UPDATE_DIAGNOSTIC_SETTINGS':
      return {
        ...state,
        diagnostics: {
          ...state.diagnostics,
          ...action.payload,
        },
      };

    // Update Settings
    case 'UPDATE_UPDATE_SETTINGS':
      return {
        ...state,
        updates: {
          ...state.updates,
          ...action.payload,
        },
      };

    // User Preferences
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };

    // Maintenance
    case 'UPDATE_MAINTENANCE_INFO':
      return {
        ...state,
        maintenance: {
          ...state.maintenance,
          ...action.payload,
        },
      };

    case 'RECORD_FEATURE_USAGE':
      const feature = action.payload.feature;
      const featuresUsed = state.maintenance.featuresUsed.includes(feature)
        ? state.maintenance.featuresUsed
        : [...state.maintenance.featuresUsed, feature];

      return {
        ...state,
        maintenance: {
          ...state.maintenance,
          featuresUsed,
          totalAppUsage: state.maintenance.totalAppUsage + 1,
        },
      };

    case 'RECORD_CRASH':
      return {
        ...state,
        maintenance: {
          ...state.maintenance,
          crashCount: state.maintenance.crashCount + 1,
          lastCrash: new Date().toISOString(),
        },
      };

    // Import/Export Settings
    case 'IMPORT_SETTINGS':
      return {
        ...state,
        ...action.payload.settings,
        maintenance: {
          ...state.maintenance,
          lastUpdate: new Date().toISOString(),
        },
      };

    case 'EXPORT_SETTINGS':
      // This would typically trigger a side effect, not modify state
      return state;

    // Reset Settings
    case 'RESET_ALL_SETTINGS':
      return initialState;

    case 'RESET_SETTINGS_CATEGORY':
      const category = action.payload.category;
      return {
        ...state,
        [category]: initialState[category],
      };

    default:
      return state;
  }
};

export default settingsReducer;