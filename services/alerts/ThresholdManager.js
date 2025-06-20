// src/services/alerts/ThresholdManager.js
import { EventEmitter } from 'events';
import { DatabaseService } from '../database/DatabaseService';

export class ThresholdManager extends EventEmitter {
  constructor() {
    super();
    this.thresholds = new Map();
    this.vehicleProfiles = new Map();
    this.currentProfile = 'default';
    this.customThresholds = new Map();
    this.adaptiveSettings = {
      enabled: false,
      learningPeriod: 30, // days
      confidenceThreshold: 0.8,
      adaptationRate: 0.1
    };
    this.historicalData = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadThresholds();
      await this.loadVehicleProfiles();
      await this.loadAdaptiveSettings();
      await this.loadHistoricalData();
      this.isInitialized = true;
      console.log('ThresholdManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ThresholdManager:', error);
      throw error;
    }
  }

  // Load thresholds from SQLite database
  async loadThresholds() {
    try {
      const data = await DatabaseService.getThresholdConfigurations();
      if (data && data.thresholds) {
        this.thresholds = new Map(Object.entries(data.thresholds));
        this.customThresholds = new Map(Object.entries(data.customThresholds || {}));
        this.currentProfile = data.currentProfile || 'default';
      } else {
        this.initializeDefaultThresholds();
      }
    } catch (error) {
      console.error('Error loading thresholds from database:', error);
      this.initializeDefaultThresholds();
    }
  }

  // Initialize default threshold configurations
  initializeDefaultThresholds() {
    const defaultThresholds = {
      // Engine System
      engineTemp: {
        min: 70, max: 105, unit: '°C', priority: 'high',
        description: 'Engine coolant temperature',
        category: 'engine',
        adaptive: true,
        warningOffset: { min: 5, max: 5 }, // Warning 5 degrees before critical
        hysteresis: 2 // Prevent threshold oscillation
      },
      
      oilTemp: {
        min: 60, max: 120, unit: '°C', priority: 'medium',
        description: 'Engine oil temperature',
        category: 'engine',
        adaptive: true,
        warningOffset: { min: 5, max: 10 }
      },
      
      oilPressure: {
        min: 20, max: 80, unit: 'psi', priority: 'high',
        description: 'Engine oil pressure',
        category: 'engine',
        adaptive: false,
        warningOffset: { min: 5, max: 10 }
      },
      
      rpm: {
        min: 500, max: 6500, unit: 'RPM', priority: 'medium',
        description: 'Engine revolutions per minute',
        category: 'engine',
        adaptive: true,
        warningOffset: { min: 100, max: 500 }
      },
      
      // Fuel System
      fuelPressure: {
        min: 30, max: 80, unit: 'psi', priority: 'high',
        description: 'Fuel rail pressure',
        category: 'fuel',
        adaptive: false,
        warningOffset: { min: 5, max: 10 }
      },
      
      fuelLevel: {
        min: 10, max: 100, unit: '%', priority: 'low',
        description: 'Fuel tank level',
        category: 'fuel',
        adaptive: false,
        warningOffset: { min: 5, max: 0 }
      },
      
      fuelTrim: {
        min: -25, max: 25, unit: '%', priority: 'medium',
        description: 'Long term fuel trim',
        category: 'fuel',
        adaptive: true,
        warningOffset: { min: 5, max: 5 }
      },
      
      // Electrical System
      batteryVoltage: {
        min: 11.5, max: 14.8, unit: 'V', priority: 'high',
        description: 'Battery voltage',
        category: 'electrical',
        adaptive: false,
        warningOffset: { min: 0.5, max: 0.5 }
      },
      
      alternatorOutput: {
        min: 13.5, max: 14.8, unit: 'V', priority: 'medium',
        description: 'Alternator output voltage',
        category: 'electrical',
        adaptive: false,
        warningOffset: { min: 0.3, max: 0.3 }
      },
      
      // Performance Metrics
      speed: {
        min: 0, max: 120, unit: 'mph', priority: 'medium',
        description: 'Vehicle speed',
        category: 'performance',
        adaptive: false,
        warningOffset: { min: 0, max: 10 }
      },
      
      throttlePosition: {
        min: 0, max: 100, unit: '%', priority: 'low',
        description: 'Throttle position sensor',
        category: 'performance',
        adaptive: true,
        warningOffset: { min: 0, max: 5 }
      },
      
      loadValue: {
        min: 0, max: 100, unit: '%', priority: 'low',
        description: 'Calculated engine load',
        category: 'performance',
        adaptive: true,
        warningOffset: { min: 0, max: 10 }
      },
      
      // Emissions System
      o2Sensor: {
        min: 0.1, max: 0.9, unit: 'V', priority: 'medium',
        description: 'Oxygen sensor voltage',
        category: 'emissions',
        adaptive: true,
        warningOffset: { min: 0.05, max: 0.05 }
      },
      
      catalystTemp: {
        min: 300, max: 800, unit: '°C', priority: 'medium',
        description: 'Catalytic converter temperature',
        category: 'emissions',
        adaptive: true,
        warningOffset: { min: 50, max: 50 }
      },
      
      // Pressure Systems
      manifoldPressure: {
        min: 10, max: 25, unit: 'inHg', priority: 'medium',
        description: 'Intake manifold absolute pressure',
        category: 'pressure',
        adaptive: true,
        warningOffset: { min: 2, max: 2 }
      },
      
      barometricPressure: {
        min: 28, max: 32, unit: 'inHg', priority: 'low',
        description: 'Barometric pressure',
        category: 'environmental',
        adaptive: false,
        warningOffset: { min: 1, max: 1 }
      },
      
      boostPressure: {
        min: 0, max: 20, unit: 'psi', priority: 'medium',
        description: 'Turbo/supercharger boost pressure',
        category: 'pressure',
        adaptive: true,
        warningOffset: { min: 1, max: 2 }
      },
      
      // Transmission (if available)
      transTemp: {
        min: 60, max: 120, unit: '°C', priority: 'high',
        description: 'Transmission fluid temperature',
        category: 'transmission',
        adaptive: true,
        warningOffset: { min: 10, max: 10 }
      }
    };

    Object.entries(defaultThresholds).forEach(([key, value]) => {
      this.thresholds.set(key, value);
    });

    this.saveThresholds();
  }

  // Load vehicle profiles from SQLite database
  async loadVehicleProfiles() {
    try {
      const profiles = await DatabaseService.getVehicleProfiles();
      if (profiles && profiles.length > 0) {
        this.vehicleProfiles = new Map(profiles.map(p => [p.id, p]));
      } else {
        this.initializeDefaultProfiles();
      }
    } catch (error) {
      console.error('Error loading vehicle profiles from database:', error);
      this.initializeDefaultProfiles();
    }
  }

  // Initialize default vehicle profiles
  initializeDefaultProfiles() {
    const profiles = {
      default: {
        name: 'Default Vehicle',
        description: 'Standard thresholds for most vehicles',
        modifications: {}
      },
      
      performance: {
        name: 'Performance Vehicle',
        description: 'Adjusted thresholds for high-performance vehicles',
        modifications: {
          rpm: { max: 7500 },
          engineTemp: { max: 110 },
          oilTemp: { max: 130 },
          boostPressure: { max: 25 }
        }
      },
      
      diesel: {
        name: 'Diesel Engine',
        description: 'Thresholds optimized for diesel engines',
        modifications: {
          engineTemp: { min: 60, max: 95 },
          rpm: { max: 5000 },
          fuelPressure: { min: 50, max: 120 }
        }
      },
      
      hybrid: {
        name: 'Hybrid Vehicle',
        description: 'Thresholds for hybrid electric vehicles',
        modifications: {
          batteryVoltage: { min: 11.0, max: 15.0 },
          engineTemp: { min: 65, max: 100 }
        }
      },
      
      truck: {
        name: 'Heavy Duty Truck',
        description: 'Thresholds for commercial vehicles',
        modifications: {
          oilPressure: { min: 30, max: 100 },
          transTemp: { max: 130 },
          fuelPressure: { min: 40, max: 100 }
        }
      }
    };

    Object.entries(profiles).forEach(([key, value]) => {
      this.vehicleProfiles.set(key, value);
    });

    this.saveVehicleProfiles();
  }

  // Load adaptive learning settings from SQLite database
  async loadAdaptiveSettings() {
    try {
      const settings = await DatabaseService.getAdaptiveThresholdSettings();
      if (settings) {
        this.adaptiveSettings = { ...this.adaptiveSettings, ...settings };
      }
    } catch (error) {
      console.error('Error loading adaptive settings from database:', error);
    }
  }

  // Load historical data for adaptive learning
  async loadHistoricalData() {
    try {
      const data = await DatabaseService.getHistoricalThresholdData();
      this.historicalData = new Map(data || []);
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  }

  // Get threshold for parameter
  getThreshold(parameter) {
    const baseThreshold = this.thresholds.get(parameter);
    if (!baseThreshold) return null;

    // Apply vehicle profile modifications
    const profile = this.vehicleProfiles.get(this.currentProfile);
    let threshold = { ...baseThreshold };

    if (profile && profile.modifications[parameter]) {
      threshold = { ...threshold, ...profile.modifications[parameter] };
    }

    // Apply adaptive adjustments if enabled
    if (this.adaptiveSettings.enabled && threshold.adaptive) {
      const adaptiveAdjustment = this.getAdaptiveAdjustment(parameter);
      if (adaptiveAdjustment) {
        threshold.min += adaptiveAdjustment.min || 0;
        threshold.max += adaptiveAdjustment.max || 0;
        threshold.isAdaptive = true;
      }
    }

    return threshold;
  }

  // Get adaptive adjustment for parameter
  getAdaptiveAdjustment(parameter) {
    const historical = this.historicalData.get(parameter);
    if (!historical || historical.length < 100) return null;

    const recentData = historical.slice(-1000); // Last 1000 readings
    const mean = recentData.reduce((sum, val) => sum + val, 0) / recentData.length;
    
    // Calculate standard deviation
    const variance = recentData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentData.length;
    const stdDev = Math.sqrt(variance);

    const baseThreshold = this.thresholds.get(parameter);
    const currentRange = baseThreshold.max - baseThreshold.min;
    
    // Adaptive adjustment based on vehicle's normal operating range
    const adjustment = {
      min: Math.max(mean - (2 * stdDev) - baseThreshold.min, -currentRange * 0.1) * this.adaptiveSettings.adaptationRate,
      max: Math.max(baseThreshold.max - (mean + (2 * stdDev)), -currentRange * 0.1) * this.adaptiveSettings.adaptationRate
    };

    return adjustment;
  }

  // Set threshold for parameter
  async setThreshold(parameter, threshold) {
    const existing = this.thresholds.get(parameter) || {};
    const updated = { ...existing, ...threshold, lastModified: new Date().toISOString() };
    
    this.thresholds.set(parameter, updated);
    await this.saveThresholds();
    
    this.emit('thresholdUpdated', { parameter, threshold: updated });
    return updated;
  }

  // Create custom threshold
  async createCustomThreshold(parameter, threshold) {
    const customConfig = {
      ...threshold,
      isCustom: true,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    this.customThresholds.set(parameter, customConfig);
    await this.saveThresholds();
    
    this.emit('customThresholdCreated', { parameter, threshold: customConfig });
    return customConfig;
  }

  // Get all thresholds
  getAllThresholds() {
    const allThresholds = {};
    
    for (const [key, value] of this.thresholds) {
      allThresholds[key] = this.getThreshold(key);
    }
    
    return allThresholds;
  }

  // Get thresholds by category
  getThresholdsByCategory(category) {
    const filtered = {};
    
    for (const [key, value] of this.thresholds) {
      if (value.category === category) {
        filtered[key] = this.getThreshold(key);
      }
    }
    
    return filtered;
  }

  // Set vehicle profile
  async setVehicleProfile(profileId) {
    if (!this.vehicleProfiles.has(profileId)) {
      throw new Error(`Vehicle profile '${profileId}' not found`);
    }
    
    this.currentProfile = profileId;
    await this.saveThresholds();
    
    this.emit('profileChanged', { profileId, profile: this.vehicleProfiles.get(profileId) });
  }

  // Create vehicle profile
  async createVehicleProfile(profileId, profileData) {
    const profile = {
      ...profileData,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    this.vehicleProfiles.set(profileId, profile);
    await this.saveVehicleProfiles();
    
    this.emit('profileCreated', { profileId, profile });
    return profile;
  }

  // Update vehicle profile
  async updateVehicleProfile(profileId, updates) {
    const existing = this.vehicleProfiles.get(profileId);
    if (!existing) {
      throw new Error(`Vehicle profile '${profileId}' not found`);
    }
    
    const updated = {
      ...existing,
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    this.vehicleProfiles.set(profileId, updated);
    await this.saveVehicleProfiles();
    
    this.emit('profileUpdated', { profileId, profile: updated });
    return updated;
  }

  // Get vehicle profiles
  getVehicleProfiles() {
    return Object.fromEntries(this.vehicleProfiles);
  }

  // Reset thresholds to defaults
  async resetThresholds(parameters = null) {
    if (parameters) {
      // Reset specific parameters
      parameters.forEach(param => {
        if (this.thresholds.has(param)) {
          this.thresholds.delete(param);
        }
      });
    } else {
      // Reset all thresholds
      this.thresholds.clear();
      this.customThresholds.clear();
    }
    
    this.initializeDefaultThresholds();
    await this.saveThresholds();
    
    this.emit('thresholdsReset', { parameters });
  }

  // Update historical data for adaptive learning
  updateHistoricalData(parameter, value) {
    if (!this.historicalData.has(parameter)) {
      this.historicalData.set(parameter, []);
    }
    
    const data = this.historicalData.get(parameter);
    data.push(value);
    
    // Keep only recent data (last 10000 readings)
    if (data.length > 10000) {
      data.splice(0, data.length - 10000);
    }
    
    this.historicalData.set(parameter, data);
  }

  // Enable/disable adaptive learning
  async setAdaptiveLearning(enabled, settings = {}) {
    this.adaptiveSettings = {
      ...this.adaptiveSettings,
      enabled,
      ...settings
    };
    
    await DatabaseService.saveAdaptiveThresholdSettings(this.adaptiveSettings);
    this.emit('adaptiveSettingsChanged', this.adaptiveSettings);
  }

  // Get threshold statistics
  getThresholdStatistics() {
    const stats = {
      total: this.thresholds.size,
      custom: this.customThresholds.size,
      adaptive: 0,
      byCategory: {},
      byPriority: { high: 0, medium: 0, low: 0 }
    };
    
    for (const [key, threshold] of this.thresholds) {
      if (threshold.adaptive) stats.adaptive++;
      
      const category = threshold.category || 'unknown';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      const priority = threshold.priority || 'medium';
      stats.byPriority[priority]++;
    }
    
    return stats;
  }

  // Import thresholds from file/backup
  async importThresholds(thresholdData) {
    try {
      const { thresholds, profiles, settings } = thresholdData;
      
      if (thresholds) {
        Object.entries(thresholds).forEach(([key, value]) => {
          this.thresholds.set(key, { ...value, imported: true });
        });
      }
      
      if (profiles) {
        Object.entries(profiles).forEach(([key, value]) => {
          this.vehicleProfiles.set(key, { ...value, imported: true });
        });
      }
      
      if (settings) {
        this.adaptiveSettings = { ...this.adaptiveSettings, ...settings };
      }
      
      await this.saveThresholds();
      await this.saveVehicleProfiles();
      
      this.emit('thresholdsImported', { thresholds, profiles, settings });
      return true;
    } catch (error) {
      console.error('Error importing thresholds:', error);
      throw error;
    }
  }

  // Export thresholds for backup
  exportThresholds() {
    return {
      thresholds: Object.fromEntries(this.thresholds),
      customThresholds: Object.fromEntries(this.customThresholds),
      profiles: Object.fromEntries(this.vehicleProfiles),
      settings: this.adaptiveSettings,
      currentProfile: this.currentProfile,
      exportDate: new Date().toISOString()
    };
  }

  // Save thresholds to SQLite database
  async saveThresholds() {
    try {
      const data = {
        thresholds: Object.fromEntries(this.thresholds),
        customThresholds: Object.fromEntries(this.customThresholds),
        currentProfile: this.currentProfile,
        lastUpdated: new Date().toISOString()
      };
      
      await DatabaseService.saveThresholdConfigurations(data);
    } catch (error) {
      console.error('Error saving thresholds to database:', error);
    }
  }

  // Save vehicle profiles to SQLite database
  async saveVehicleProfiles() {
    try {
      const profiles = Array.from(this.vehicleProfiles.entries()).map(([id, profile]) => ({
        id,
        ...profile,
        lastUpdated: new Date().toISOString()
      }));
      
      await DatabaseService.saveVehicleProfiles(profiles);
    } catch (error) {
      console.error('Error saving vehicle profiles to database:', error);
    }
  }

  // Validate threshold configuration
  validateThreshold(parameter, threshold) {
    const errors = [];
    
    if (typeof threshold.min !== 'number' || typeof threshold.max !== 'number') {
      errors.push('Min and max values must be numbers');
    }
    
    if (threshold.min >= threshold.max) {
      errors.push('Min value must be less than max value');
    }
    
    if (!threshold.unit || typeof threshold.unit !== 'string') {
      errors.push('Unit must be specified');
    }
    
    if (!['high', 'medium', 'low'].includes(threshold.priority)) {
      errors.push('Priority must be high, medium, or low');
    }
    
    return errors;
  }

  // Dispose
  dispose() {
    this.removeAllListeners();
    this.thresholds.clear();
    this.vehicleProfiles.clear();
    this.customThresholds.clear();
    this.historicalData.clear();
    this.isInitialized = false;
  }
}

export default new ThresholdManager();