// SettingsData.js - Application settings and preferences management

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Settings Data Service
 * Manages application settings, user preferences, and configuration
 */
class SettingsDataService {
  constructor() {
    this.settings = {};
    this.storageKey = 'app_settings';
    this.defaultSettings = this.getDefaultSettings();
    this.settingsListeners = [];
  }

  /**
   * Initialize the settings service
   */
  async initialize() {
    try {
      await this.loadSettings();
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Get setting value
   * @param {string} key - Setting key (supports dot notation)
   * @param {*} defaultValue - Default value if setting not found
   * @returns {*} Setting value
   */
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.settings;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set setting value
   * @param {string} key - Setting key (supports dot notation)
   * @param {*} value - Setting value
   */
  async set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    let target = this.settings;

    // Navigate to the parent object
    for (const k of keys) {
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }

    // Set the value
    const oldValue = target[lastKey];
    target[lastKey] = value;

    // Save settings
    await this.saveSettings();

    // Notify listeners
    this.notifyListeners(key, value, oldValue);
  }

  /**
   * Update multiple settings at once
   * @param {Object} updates - Object with setting updates
   */
  async updateSettings(updates) {
    const changes = [];

    for (const [key, value] of Object.entries(updates)) {
      const oldValue = this.get(key);
      await this.set(key, value);
      changes.push({ key, value, oldValue });
    }

    return changes;
  }

  /**
   * Reset setting to default value
   * @param {string} key - Setting key
   */
  async resetSetting(key) {
    const defaultValue = this.getDefaultValue(key);
    await this.set(key, defaultValue);
  }

  /**
   * Reset all settings to defaults
   */
  async resetAllSettings() {
    this.settings = { ...this.defaultSettings };
    await this.saveSettings();
    this.notifyListeners('*', this.settings, {});
  }

  /**
   * Get all settings
   * @returns {Object} All settings
   */
  getAll() {
    return { ...this.settings };
  }

  /**
   * Get settings by category
   * @param {string} category - Settings category
   * @returns {Object} Category settings
   */
  getCategory(category) {
    return this.get(category, {});
  }

  /**
   * Update category settings
   * @param {string} category - Settings category
   * @param {Object} updates - Updates to apply
   */
  async updateCategory(category, updates) {
    const currentSettings = this.getCategory(category);
    const newSettings = { ...currentSettings, ...updates };
    await this.set(category, newSettings);
  }

  /**
   * Check if setting exists
   * @param {string} key - Setting key
   * @returns {boolean} True if setting exists
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete setting
   * @param {string} key - Setting key
   */
  async delete(key) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    let target = this.settings;

    // Navigate to the parent object
    for (const k of keys) {
      if (!target[k] || typeof target[k] !== 'object') {
        return; // Setting doesn't exist
      }
      target = target[k];
    }

    const oldValue = target[lastKey];
    delete target[lastKey];

    await this.saveSettings();
    this.notifyListeners(key, undefined, oldValue);
  }

  /**
   * Export settings
   * @param {Array} categories - Categories to export (optional)
   * @returns {Object} Exported settings
   */
  async exportSettings(categories = null) {
    let settingsToExport = this.settings;

    if (categories && categories.length > 0) {
      settingsToExport = {};
      categories.forEach(category => {
        settingsToExport[category] = this.getCategory(category);
      });
    }

    return {
      settings: settingsToExport,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Import settings
   * @param {Object} data - Settings data to import
   * @returns {boolean} Success status
   */
  async importSettings(data) {
    try {
      if (!data.settings || typeof data.settings !== 'object') {
        throw new Error('Invalid settings data format');
      }

      // Merge with existing settings rather than replace
      this.settings = {
        ...this.settings,
        ...data.settings
      };

      await this.saveSettings();
      this.notifyListeners('*', this.settings, {});
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Add settings change listener
   * @param {Function} listener - Listener callback
   * @returns {Function} Unsubscribe function
   */
  addListener(listener) {
    this.settingsListeners.push(listener);
    return () => {
      const index = this.settingsListeners.indexOf(listener);
      if (index > -1) {
        this.settingsListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of settings changes
   * @param {string} key - Changed setting key
   * @param {*} newValue - New setting value
   * @param {*} oldValue - Previous setting value
   */
  notifyListeners(key, newValue, oldValue) {
    this.settingsListeners.forEach(listener => {
      try {
        listener(key, newValue, oldValue);
      } catch (error) {
        
      }
    });
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const storedSettings = await AsyncStorage.getItem(this.storageKey);
      if (storedSettings) {
        this.settings = {
          ...this.defaultSettings,
          ...JSON.parse(storedSettings)
        };
      } else {
        this.settings = { ...this.defaultSettings };
      }
    } catch (error) {
      
      this.settings = { ...this.defaultSettings };
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get default settings
   * @returns {Object} Default settings
   */
  getDefaultSettings() {
    return {
      general: {
        theme: 'auto',
        language: 'en',
        units: 'imperial',
        notifications: true
      },
      connection: {
        autoConnect: true,
        preferredDevice: null,
        connectionTimeout: 30000
      },
      display: {
        refreshRate: 1000,
        keepScreenOn: true,
        showGrid: true
      },
      alerts: {
        enabled: true,
        vibration: true,
        sound: true,
        thresholds: {
          rpm: { high: 6000, critical: 7000 },
          coolantTemp: { high: 95, critical: 105 },
          engineLoad: { high: 85, critical: 95 },
          fuelLevel: { low: 25, critical: 10 }
        }
      },
      logging: {
        enabled: true,
        interval: 1000,
        parameters: ['rpm', 'speed', 'coolantTemp', 'engineLoad']
      },
      diagnostics: {
        autoScan: true,
        scanInterval: 3600000,
        clearCodesAfterFix: false
      },
      export: {
        format: 'csv',
        includeTimestamp: true,
        compressionEnabled: false
      }
    };
  }

  /**
   * Get default value for a specific setting
   * @param {string} key - Setting key
   * @returns {*} Default value
   */
  getDefaultValue(key) {
    const keys = key.split('.');
    let value = this.defaultSettings;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return value;
  }
}

// Export singleton instance
export const settingsData = new SettingsDataService();
export default SettingsDataService;