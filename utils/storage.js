// OBDII Diagnostic App - Storage Utilities
// AsyncStorage wrapper with encryption and data management

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

/**
 * Storage utility class with error handling and data validation
 */
class StorageManager {
  constructor() {
    this.prefix = '@OBDIIDiagnostic:';
  }

  /**
   * Generate storage key with prefix
   * @param {string} key - Storage key
   * @returns {string} Prefixed key
   */
  _generateKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Store data in AsyncStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {Promise<boolean>} Success status
   */
  async setItem(key, value) {
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        version: '1.0.0',
      });
      
      await AsyncStorage.setItem(this._generateKey(key), serializedValue);
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Retrieve data from AsyncStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {Promise<*>} Retrieved value or default
   */
  async getItem(key, defaultValue = null) {
    try {
      const serializedValue = await AsyncStorage.getItem(this._generateKey(key));
      
      if (serializedValue === null) {
        return defaultValue;
      }

      const parsed = JSON.parse(serializedValue);
      
      // Return the data, handling both new format (with metadata) and legacy format
      return parsed.data !== undefined ? parsed.data : parsed;
    } catch (error) {
      
      return defaultValue;
    }
  }

  /**
   * Remove item from AsyncStorage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Success status
   */
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(this._generateKey(key));
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Clear all app data from AsyncStorage
   * @returns {Promise<boolean>} Success status
   */
  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith(this.prefix));
      
      if (appKeys.length > 0) {
        await AsyncStorage.multiRemove(appKeys);
      }
      
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Get all keys stored by the app
   * @returns {Promise<string[]>} Array of keys
   */
  async getAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      
      return [];
    }
  }

  /**
   * Get storage usage information
   * @returns {Promise<Object>} Storage usage stats
   */
  async getStorageInfo() {
    try {
      const keys = await this.getAllKeys();
      let totalSize = 0;
      const itemSizes = {};

      for (const key of keys) {
        const value = await AsyncStorage.getItem(this._generateKey(key));
        const size = new Blob([value || '']).size;
        itemSizes[key] = size;
        totalSize += size;
      }

      return {
        totalItems: keys.length,
        totalSize,
        itemSizes,
        formattedSize: this._formatBytes(totalSize),
      };
    } catch (error) {
      
      return {
        totalItems: 0,
        totalSize: 0,
        itemSizes: {},
        formattedSize: '0 B',
      };
    }
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// Create singleton instance
const storage = new StorageManager();

/**
 * Vehicle Profile Storage
 */
export const vehicleStorage = {
  /**
   * Save vehicle profile
   * @param {Object} profile - Vehicle profile data
   * @returns {Promise<boolean>} Success status
   */
  async saveProfile(profile) {
    const profileData = {
      ...profile,
      lastUpdated: Date.now(),
    };
    return await storage.setItem(STORAGE_KEYS.VEHICLE_PROFILE, profileData);
  },

  /**
   * Get vehicle profile
   * @returns {Promise<Object|null>} Vehicle profile or null
   */
  async getProfile() {
    return await storage.getItem(STORAGE_KEYS.VEHICLE_PROFILE, null);
  },

  /**
   * Update specific vehicle profile field
   * @param {string} field - Field name
   * @param {*} value - New value
   * @returns {Promise<boolean>} Success status
   */
  async updateProfileField(field, value) {
    const profile = await this.getProfile();
    if (profile) {
      profile[field] = value;
      profile.lastUpdated = Date.now();
      return await this.saveProfile(profile);
    }
    return false;
  },

  /**
   * Delete vehicle profile
   * @returns {Promise<boolean>} Success status
   */
  async deleteProfile() {
    return await storage.removeItem(STORAGE_KEYS.VEHICLE_PROFILE);
  },
};

/**
 * User Settings Storage
 */
export const settingsStorage = {
  /**
   * Save user settings
   * @param {Object} settings - User settings data
   * @returns {Promise<boolean>} Success status
   */
  async saveSettings(settings) {
    return await storage.setItem(STORAGE_KEYS.USER_SETTINGS, settings);
  },

  /**
   * Get user settings
   * @returns {Promise<Object>} User settings with defaults
   */
  async getSettings() {
    const defaultSettings = {
      units: {
        temperature: 'celsius',
        speed: 'kmh',
        pressure: 'kpa',
        fuelConsumption: 'lph',
      },
      theme: 'light',
      notifications: {
        enabled: true,
        highTemperature: true,
        lowFuel: true,
        dtcCodes: true,
        connectionLost: true,
      },
      dashboard: {
        refreshInterval: 1000,
        showGrid: true,
        gaugeStyle: 'circular',
      },
      export: {
        format: 'pdf',
        includeDiagnostics: true,
        includeHistory: true,
      },
      privacy: {
        shareUsageData: false,
        shareLocationData: false,
      },
    };

    const savedSettings = await storage.getItem(STORAGE_KEYS.USER_SETTINGS, {});
    return { ...defaultSettings, ...savedSettings };
  },

  /**
   * Update specific setting
   * @param {string} category - Setting category
   * @param {string} key - Setting key
   * @param {*} value - New value
   * @returns {Promise<boolean>} Success status
   */
  async updateSetting(category, key, value) {
    const settings = await this.getSettings();
    if (!settings[category]) {
      settings[category] = {};
    }
    settings[category][key] = value;
    return await this.saveSettings(settings);
  },
};

/**
 * Connection History Storage
 */
export const connectionStorage = {
  /**
   * Save connection to history
   * @param {Object} connection - Connection data
   * @returns {Promise<boolean>} Success status
   */
  async saveConnection(connection) {
    const history = await this.getHistory();
    const connectionData = {
      ...connection,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    // Remove duplicate connections (same device)
    const filteredHistory = history.filter(
      conn => conn.deviceId !== connection.deviceId
    );

    // Add new connection at the beginning
    const updatedHistory = [connectionData, ...filteredHistory].slice(0, 10); // Keep only last 10

    return await storage.setItem(STORAGE_KEYS.CONNECTION_HISTORY, updatedHistory);
  },

  /**
   * Get connection history
   * @returns {Promise<Array>} Array of connection records
   */
  async getHistory() {
    return await storage.getItem(STORAGE_KEYS.CONNECTION_HISTORY, []);
  },

  /**
   * Clear connection history
   * @returns {Promise<boolean>} Success status
   */
  async clearHistory() {
    return await storage.removeItem(STORAGE_KEYS.CONNECTION_HISTORY);
  },

  /**
   * Remove specific connection from history
   * @param {string} connectionId - Connection ID
   * @returns {Promise<boolean>} Success status
   */
  async removeConnection(connectionId) {
    const history = await this.getHistory();
    const filteredHistory = history.filter(conn => conn.id !== connectionId);
    return await storage.setItem(STORAGE_KEYS.CONNECTION_HISTORY, filteredHistory);
  },
};

/**
 * Alert Settings Storage
 */
export const alertStorage = {
  /**
   * Save alert settings
   * @param {Object} alertSettings - Alert configuration
   * @returns {Promise<boolean>} Success status
   */
  async saveAlertSettings(alertSettings) {
    return await storage.setItem(STORAGE_KEYS.ALERT_SETTINGS, alertSettings);
  },

  /**
   * Get alert settings
   * @returns {Promise<Object>} Alert settings with defaults
   */
  async getAlertSettings() {
    const defaultSettings = {
      thresholds: {
        engineTemp: { warning: 95, critical: 105 },
        engineRPM: { warning: 6000, critical: 7000 },
        fuelLevel: { warning: 20, critical: 10 },
        engineLoad: { warning: 85, critical: 95 },
      },
      notifications: {
        sound: true,
        vibration: true,
        popup: true,
      },
      enabled: true,
    };

    const savedSettings = await storage.getItem(STORAGE_KEYS.ALERT_SETTINGS, {});
    return { ...defaultSettings, ...savedSettings };
  },

  /**
   * Update alert threshold
   * @param {string} parameter - Parameter name
   * @param {string} level - Threshold level (warning/critical)
   * @param {number} value - Threshold value
   * @returns {Promise<boolean>} Success status
   */
  async updateThreshold(parameter, level, value) {
    const settings = await this.getAlertSettings();
    if (!settings.thresholds[parameter]) {
      settings.thresholds[parameter] = {};
    }
    settings.thresholds[parameter][level] = value;
    return await this.saveAlertSettings(settings);
  },
};

/**
 * Export Settings Storage
 */
export const exportStorage = {
  /**
   * Save export settings
   * @param {Object} exportSettings - Export configuration
   * @returns {Promise<boolean>} Success status
   */
  async saveExportSettings(exportSettings) {
    return await storage.setItem(STORAGE_KEYS.EXPORT_SETTINGS, exportSettings);
  },

  /**
   * Get export settings
   * @returns {Promise<Object>} Export settings with defaults
   */
  async getExportSettings() {
    const defaultSettings = {
      format: 'pdf',
      dateRange: 'last7days',
      includeGraphs: true,
      includeDTC: true,
      includeVehicleInfo: true,
      compression: 'medium',
      emailSettings: {
        enabled: false,
        recipients: [],
        subject: 'Vehicle Diagnostic Report',
      },
    };

    const savedSettings = await storage.getItem(STORAGE_KEYS.EXPORT_SETTINGS, {});
    return { ...defaultSettings, ...savedSettings };
  },
};

/**
 * Calibration Data Storage
 */
export const calibrationStorage = {
  /**
   * Save calibration data
   * @param {Object} calibrationData - Calibration parameters
   * @returns {Promise<boolean>} Success status
   */
  async saveCalibration(calibrationData) {
    return await storage.setItem(STORAGE_KEYS.CALIBRATION_DATA, calibrationData);
  },

  /**
   * Get calibration data
   * @returns {Promise<Object>} Calibration data with defaults
   */
  async getCalibration() {
    const defaultCalibration = {
      fuelTrim: 0,
      ignitionTiming: 0,
      idleSpeed: 800,
      throttlePosition: 0,
    };

    const savedCalibration = await storage.getItem(STORAGE_KEYS.CALIBRATION_DATA, {});
    return { ...defaultCalibration, ...savedCalibration };
  },
};

/**
 * Diagnostic Data Storage
 */
export const diagnosticStorage = {
  /**
   * Save diagnostic session data
   * @param {Object} diagnosticData - Diagnostic session data
   * @returns {Promise<boolean>} Success status
   */
  async saveDiagnosticSession(diagnosticData) {
    const sessions = await this.getDiagnosticSessions();
    const sessionData = {
      ...diagnosticData,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    
    const updatedSessions = [sessionData, ...sessions];
    return await storage.setItem(STORAGE_KEYS.DIAGNOSTIC_SESSIONS, updatedSessions);
  },

  /**
   * Get all diagnostic sessions
   * @returns {Promise<Array>} Array of diagnostic sessions
   */
  async getDiagnosticSessions() {
    return await storage.getItem(STORAGE_KEYS.DIAGNOSTIC_SESSIONS, []);
  },

  /**
   * Get specific diagnostic session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} Diagnostic session data
   */
  async getDiagnosticSession(sessionId) {
    const sessions = await this.getDiagnosticSessions();
    return sessions.find(session => session.id === sessionId) || null;
  },

  /**
   * Delete diagnostic session
   * @param {string} sessionId - Session ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteDiagnosticSession(sessionId) {
    const sessions = await this.getDiagnosticSessions();
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    return await storage.setItem(STORAGE_KEYS.DIAGNOSTIC_SESSIONS, updatedSessions);
  },

  /**
   * Clear all diagnostic sessions
   * @returns {Promise<boolean>} Success status
   */
  async clearDiagnosticSessions() {
    return await storage.removeItem(STORAGE_KEYS.DIAGNOSTIC_SESSIONS);
  }
};

/**
 * Maintenance Data Storage
 */
export const maintenanceStorage = {
  /**
   * Save maintenance record
   * @param {Object} record - Maintenance record data
   * @returns {Promise<boolean>} Success status
   */
  async saveMaintenanceRecord(record) {
    const records = await this.getMaintenanceRecords();
    const maintenanceRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    
    const updatedRecords = [maintenanceRecord, ...records];
    return await storage.setItem(STORAGE_KEYS.MAINTENANCE_RECORDS, updatedRecords);
  },

  /**
   * Get all maintenance records
   * @returns {Promise<Array>} Array of maintenance records
   */
  async getMaintenanceRecords() {
    return await storage.getItem(STORAGE_KEYS.MAINTENANCE_RECORDS, []);
  },

  /**
   * Get maintenance record by ID
   * @param {string} recordId - Record ID
   * @returns {Promise<Object|null>} Maintenance record
   */
  async getMaintenanceRecord(recordId) {
    const records = await this.getMaintenanceRecords();
    return records.find(record => record.id === recordId) || null;
  },

  /**
   * Update maintenance record
   * @param {string} recordId - Record ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<boolean>} Success status
   */
  async updateMaintenanceRecord(recordId, updates) {
    const records = await this.getMaintenanceRecords();
    const index = records.findIndex(record => record.id === recordId);
    
    if (index === -1) return false;
    
    records[index] = {
      ...records[index],
      ...updates,
      lastUpdated: Date.now()
    };
    
    return await storage.setItem(STORAGE_KEYS.MAINTENANCE_RECORDS, records);
  },

  /**
   * Delete maintenance record
   * @param {string} recordId - Record ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteMaintenanceRecord(recordId) {
    const records = await this.getMaintenanceRecords();
    const updatedRecords = records.filter(record => record.id !== recordId);
    return await storage.setItem(STORAGE_KEYS.MAINTENANCE_RECORDS, updatedRecords);
  },

  /**
   * Get maintenance schedule
   * @returns {Promise<Object>} Maintenance schedule with defaults
   */
  async getMaintenanceSchedule() {
    const defaultSchedule = {
      oilChange: {
        interval: 5000, // km
        lastService: null,
        nextDue: null
      },
      tireRotation: {
        interval: 10000, // km
        lastService: null,
        nextDue: null
      },
      brakeInspection: {
        interval: 15000, // km
        lastService: null,
        nextDue: null
      },
      airFilter: {
        interval: 20000, // km
        lastService: null,
        nextDue: null
      },
      generalInspection: {
        interval: 30000, // km
        lastService: null,
        nextDue: null
      }
    };

    const savedSchedule = await storage.getItem(STORAGE_KEYS.MAINTENANCE_SCHEDULE, {});
    return { ...defaultSchedule, ...savedSchedule };
  },

  /**
   * Update maintenance schedule
   * @param {Object} schedule - Updated schedule
   * @returns {Promise<boolean>} Success status
   */
  async updateMaintenanceSchedule(schedule) {
    return await storage.setItem(STORAGE_KEYS.MAINTENANCE_SCHEDULE, schedule);
  }
};