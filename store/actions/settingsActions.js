// store/actions/settingsActions.js
import DatabaseService from '../../services/database/DatabaseService';
import AlertService from '../../services/alerts/AlertService';
import NotificationService from '../../services/alerts/NotificationService';

// Action Types
export const SETTINGS_TYPES = {
  // General Settings
  UPDATE_SETTING: 'UPDATE_SETTING',
  UPDATE_MULTIPLE_SETTINGS: 'UPDATE_MULTIPLE_SETTINGS',
  RESET_SETTINGS: 'RESET_SETTINGS',
  LOAD_SETTINGS: 'LOAD_SETTINGS',
  SAVE_SETTINGS: 'SAVE_SETTINGS',
  
  // Display Settings
  SET_THEME: 'SET_THEME',
  SET_UNITS: 'SET_UNITS',
  SET_LANGUAGE: 'SET_LANGUAGE',
  UPDATE_DASHBOARD_LAYOUT: 'UPDATE_DASHBOARD_LAYOUT',
  
  // Data Settings
  SET_DATA_REFRESH_RATE: 'SET_DATA_REFRESH_RATE',
  SET_DATA_RETENTION_PERIOD: 'SET_DATA_RETENTION_PERIOD',
  SET_AUTO_SAVE_ENABLED: 'SET_AUTO_SAVE_ENABLED',
  SET_DATA_SMOOTHING: 'SET_DATA_SMOOTHING',
  
  // Alert Settings
  SET_ALERTS_ENABLED: 'SET_ALERTS_ENABLED',
  UPDATE_ALERT_THRESHOLD: 'UPDATE_ALERT_THRESHOLD',
  ADD_ALERT_THRESHOLD: 'ADD_ALERT_THRESHOLD',
  REMOVE_ALERT_THRESHOLD: 'REMOVE_ALERT_THRESHOLD',
  SET_NOTIFICATION_SETTINGS: 'SET_NOTIFICATION_SETTINGS',
  
  // Connection Settings
  SET_AUTO_CONNECT: 'SET_AUTO_CONNECT',
  SET_CONNECTION_TIMEOUT: 'SET_CONNECTION_TIMEOUT',
  SET_RETRY_ATTEMPTS: 'SET_RETRY_ATTEMPTS',
  UPDATE_DEVICE_PREFERENCES: 'UPDATE_DEVICE_PREFERENCES',
  
  // Export Settings
  SET_DEFAULT_EXPORT_FORMAT: 'SET_DEFAULT_EXPORT_FORMAT',
  SET_EXPORT_LOCATION: 'SET_EXPORT_LOCATION',
  UPDATE_EXPORT_TEMPLATES: 'UPDATE_EXPORT_TEMPLATES',
  
  // Privacy Settings
  SET_DATA_SHARING_ENABLED: 'SET_DATA_SHARING_ENABLED',
  SET_ANALYTICS_ENABLED: 'SET_ANALYTICS_ENABLED',
  SET_CRASH_REPORTING_ENABLED: 'SET_CRASH_REPORTING_ENABLED',
  
  // Backup Settings
  SET_BACKUP_ENABLED: 'SET_BACKUP_ENABLED',
  SET_BACKUP_FREQUENCY: 'SET_BACKUP_FREQUENCY',
  SET_BACKUP_LOCATION: 'SET_BACKUP_LOCATION',
};

// Default Settings
export const DEFAULT_SETTINGS = {
  // General
  theme: 'auto', // 'light', 'dark', 'auto'
  language: 'en',
  units: 'metric', // 'metric', 'imperial'
  
  // Display
  dashboardLayout: 'grid',
  showWelcomeScreen: true,
  fullScreenMode: false,
  
  // Data
  dataRefreshRate: 1000, // milliseconds
  dataRetentionPeriod: 30, // days
  autoSaveEnabled: true,
  dataSmoothingEnabled: false,
  dataSmoothingFactor: 0.3,
  
  // Alerts
  alertsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  alertThresholds: {
    engineTemp: { min: 70, max: 105, unit: 'C', enabled: true },
    rpm: { min: 500, max: 6000, unit: 'rpm', enabled: true },
    speed: { min: 0, max: 120, unit: 'km/h', enabled: false },
    fuelLevel: { min: 10, max: 100, unit: '%', enabled: true },
  },
  notificationSettings: {
    showInApp: true,
    showPushNotifications: true,
    persistentNotifications: false,
    notificationSound: 'default',
  },
  
  // Connection
  autoConnect: true,
  connectionTimeout: 10000, // milliseconds
  retryAttempts: 3,
  preferredConnectionType: 'bluetooth',
  devicePreferences: {},
  
  // Export
  defaultExportFormat: 'csv',
  exportLocation: 'documents',
  includeTimestamps: true,
  includeMetadata: true,
  
  // Privacy
  dataSharingEnabled: false,
  analyticsEnabled: true,
  crashReportingEnabled: true,
  
  // Backup
  backupEnabled: false,
  backupFrequency: 'weekly',
  backupLocation: 'cloud',
  
  // Advanced
  debugMode: false,
  simulationMode: false,
  developerOptions: false,
};

// General Settings Actions
export const updateSetting = (key, value) => async (dispatch) => {
  dispatch({
    type: SETTINGS_TYPES.UPDATE_SETTING,
    payload: { key, value }
  });
  
  // Apply setting immediately if needed
  await applySetting(key, value);
  
  // Save to persistent storage
  try {
    await DatabaseService.saveSetting(key, value);
  } catch (error) {
    
  }
};

export const updateMultipleSettings = (settings) => async (dispatch) => {
  dispatch({
    type: SETTINGS_TYPES.UPDATE_MULTIPLE_SETTINGS,
    payload: { settings }
  });
  
  // Apply settings
  for (const [key, value] of Object.entries(settings)) {
    await applySetting(key, value);
  }
  
  // Save to persistent storage
  try {
    await DatabaseService.saveMultipleSettings(settings);
  } catch (error) {
    
  }
};

export const resetSettings = () => async (dispatch) => {
  dispatch({
    type: SETTINGS_TYPES.RESET_SETTINGS,
    payload: { settings: DEFAULT_SETTINGS }
  });
  
  try {
    await DatabaseService.resetSettings();
  } catch (error) {
    
  }
};

export const loadSettings = () => async (dispatch) => {
  try {
    const settings = await DatabaseService.loadSettings();
    
    dispatch({
      type: SETTINGS_TYPES.LOAD_SETTINGS,
      payload: { settings: { ...DEFAULT_SETTINGS, ...settings } }
    });
    
    return settings;
  } catch (error) {
    
    // Load defaults on error
    dispatch({
      type: SETTINGS_TYPES.LOAD_SETTINGS,
      payload: { settings: DEFAULT_SETTINGS }
    });
  }
};

// Display Settings Actions
export const setTheme = (theme) => (dispatch) => {
  dispatch(updateSetting('theme', theme));
};

export const setUnits = (units) => (dispatch) => {
  dispatch(updateSetting('units', units));
};

export const setLanguage = (language) => (dispatch) => {
  dispatch(updateSetting('language', language));
};

export const updateDashboardLayout = (layout) => ({
  type: SETTINGS_TYPES.UPDATE_DASHBOARD_LAYOUT,
  payload: { layout }
});

// Data Settings Actions
export const setDataRefreshRate = (rate) => (dispatch) => {
  // Validate rate (between 100ms and 10s)
  const validRate = Math.max(100, Math.min(10000, rate));
  dispatch(updateSetting('dataRefreshRate', validRate));
};

export const setDataRetentionPeriod = (days) => (dispatch) => {
  // Validate retention period (1-365 days)
  const validDays = Math.max(1, Math.min(365, days));
  dispatch(updateSetting('dataRetentionPeriod', validDays));
};

export const setAutoSaveEnabled = (enabled) => (dispatch) => {
  dispatch(updateSetting('autoSaveEnabled', enabled));
};

export const setDataSmoothing = (enabled, factor = 0.3) => (dispatch) => {
  dispatch(updateMultipleSettings({
    dataSmoothingEnabled: enabled,
    dataSmoothingFactor: Math.max(0.1, Math.min(1.0, factor))
  }));
};

// Alert Settings Actions
export const setAlertsEnabled = (enabled) => async (dispatch) => {
  dispatch(updateSetting('alertsEnabled', enabled));
  
  if (enabled) {
    await NotificationService.requestPermissions();
  }
};

export const updateAlertThreshold = (pidCode, threshold) => (dispatch, getState) => {
  const { settings } = getState();
  const updatedThresholds = {
    ...settings.alertThresholds,
    [pidCode]: { ...settings.alertThresholds[pidCode], ...threshold }
  };
  
  dispatch(updateSetting('alertThresholds', updatedThresholds));
  
  // Update alert service
  AlertService.updateThresholds(updatedThresholds);
};

export const addAlertThreshold = (pidCode, threshold) => (dispatch, getState) => {
  const { settings } = getState();
  const updatedThresholds = {
    ...settings.alertThresholds,
    [pidCode]: threshold
  };
  
  dispatch(updateSetting('alertThresholds', updatedThresholds));
};

export const removeAlertThreshold = (pidCode) => (dispatch, getState) => {
  const { settings } = getState();
  const updatedThresholds = { ...settings.alertThresholds };
  delete updatedThresholds[pidCode];
  
  dispatch(updateSetting('alertThresholds', updatedThresholds));
};

export const setNotificationSettings = (notificationSettings) => (dispatch) => {
  dispatch(updateSetting('notificationSettings', notificationSettings));
  
  // Update notification service
  NotificationService.updateSettings(notificationSettings);
};

// Connection Settings Actions
export const setAutoConnect = (enabled) => (dispatch) => {
  dispatch(updateSetting('autoConnect', enabled));
};

export const setConnectionTimeout = (timeout) => (dispatch) => {
  // Validate timeout (5-60 seconds)
  const validTimeout = Math.max(5000, Math.min(60000, timeout));
  dispatch(updateSetting('connectionTimeout', validTimeout));
};

export const setRetryAttempts = (attempts) => (dispatch) => {
  // Validate attempts (1-10)
  const validAttempts = Math.max(1, Math.min(10, attempts));
  dispatch(updateSetting('retryAttempts', validAttempts));
};

export const updateDevicePreferences = (deviceId, preferences) => (dispatch, getState) => {
  const { settings } = getState();
  const updatedPreferences = {
    ...settings.devicePreferences,
    [deviceId]: { ...settings.devicePreferences[deviceId], ...preferences }
  };
  
  dispatch(updateSetting('devicePreferences', updatedPreferences));
};

// Export Settings Actions
export const setDefaultExportFormat = (format) => (dispatch) => {
  dispatch(updateSetting('defaultExportFormat', format));
};

export const setExportLocation = (location) => (dispatch) => {
  dispatch(updateSetting('exportLocation', location));
};

export const updateExportTemplates = (templates) => (dispatch) => {
  dispatch(updateSetting('exportTemplates', templates));
};

// Privacy Settings Actions
export const setDataSharingEnabled = (enabled) => (dispatch) => {
  dispatch(updateSetting('dataSharingEnabled', enabled));
};

export const setAnalyticsEnabled = (enabled) => (dispatch) => {
  dispatch(updateSetting('analyticsEnabled', enabled));
};

export const setCrashReportingEnabled = (enabled) => (dispatch) => {
  dispatch(updateSetting('crashReportingEnabled', enabled));
};

// Backup Settings Actions
export const setBackupEnabled = (enabled) => (dispatch) => {
  dispatch(updateSetting('backupEnabled', enabled));
};

export const setBackupFrequency = (frequency) => (dispatch) => {
  dispatch(updateSetting('backupFrequency', frequency));
};

export const setBackupLocation = (location) => (dispatch) => {
  dispatch(updateSetting('backupLocation', location));
};

// Utility Functions
const applySetting = async (key, value) => {
  switch (key) {
    case 'theme':
      // Apply theme changes
      break;
    case 'language':
      // Apply language changes
      break;
    case 'alertsEnabled':
      if (value) {
        await NotificationService.requestPermissions();
      }
      break;
    case 'notificationSettings':
      NotificationService.updateSettings(value);
      break;
    case 'alertThresholds':
      AlertService.updateThresholds(value);
      break;
    default:
      break;
  }
};

// Preset Configurations
export const applyPresetConfiguration = (presetName) => (dispatch) => {
  const presets = {
    performance: {
      dataRefreshRate: 500,
      alertThresholds: {
        engineTemp: { min: 70, max: 100, enabled: true },
        rpm: { min: 1000, max: 7000, enabled: true },
        speed: { min: 0, max: 200, enabled: true },
      },
      dataSmoothingEnabled: false,
    },
    economy: {
      dataRefreshRate: 2000,
      alertThresholds: {
        fuelLevel: { min: 15, max: 100, enabled: true },
        engineTemp: { min: 70, max: 110, enabled: true },
      },
      dataSmoothingEnabled: true,
      dataSmoothingFactor: 0.5,
    },
    diagnostic: {
      dataRefreshRate: 1000,
      alertsEnabled: true,
      autoSaveEnabled: true,
      dataRetentionPeriod: 90,
    },
  };
  
  const preset = presets[presetName];
  if (preset) {
    dispatch(updateMultipleSettings(preset));
  }
};

// Import/Export Settings
export const exportSettings = () => async (dispatch, getState) => {
  const { settings } = getState();
  
  try {
    const ExportService = require('../../services/export/ExportService').default;
    return await ExportService.exportSettings(settings);
  } catch (error) {
    
    throw error;
  }
};

export const importSettings = (settingsData) => async (dispatch) => {
  try {
    // Validate imported settings
    const validatedSettings = validateImportedSettings(settingsData);
    
    dispatch(updateMultipleSettings(validatedSettings));
    
    return validatedSettings;
  } catch (error) {
    
    throw error;
  }
};

const validateImportedSettings = (settings) => {
  const validated = {};
  
  // Only accept known settings keys
  Object.keys(DEFAULT_SETTINGS).forEach(key => {
    if (settings.hasOwnProperty(key)) {
      validated[key] = settings[key];
    }
  });
  
  return validated;
};