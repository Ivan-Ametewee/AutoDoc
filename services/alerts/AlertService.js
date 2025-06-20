// src/services/alerts/AlertService.js
import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './NotificationService';
import { DatabaseService } from '../database/DatabaseService';

class AlertService extends EventEmitter {
  constructor() {
    super();
    this.activeAlerts = new Map();
    this.thresholds = new Map();
    this.alertHistory = [];
    this.isInitialized = false;
    this.notificationService = new NotificationService();
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadThresholds();
      await this.loadAlertHistory();
      await this.notificationService.initialize();
      this.isInitialized = true;
      console.log('AlertService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AlertService:', error);
      throw error;
    }
  }

  // Load saved thresholds from storage
  async loadThresholds() {
    try {
      const saved = await AsyncStorage.getItem('alert_thresholds');
      if (saved) {
        const thresholds = JSON.parse(saved);
        this.thresholds = new Map(Object.entries(thresholds));
      } else {
        // Set default thresholds
        this.setDefaultThresholds();
      }
    } catch (error) {
      console.error('Error loading thresholds:', error);
      this.setDefaultThresholds();
    }
  }

  // Set default alert thresholds
  setDefaultThresholds() {
    const defaults = {
      // Engine parameters
      engineTemp: { min: 70, max: 105, unit: '°C', priority: 'high' },
      oilTemp: { min: 60, max: 120, unit: '°C', priority: 'medium' },
      rpm: { min: 500, max: 6500, unit: 'RPM', priority: 'medium' },
      
      // Fuel system
      fuelPressure: { min: 30, max: 80, unit: 'psi', priority: 'high' },
      fuelLevel: { min: 10, max: 100, unit: '%', priority: 'low' },
      
      // Electrical system
      batteryVoltage: { min: 11.5, max: 14.8, unit: 'V', priority: 'high' },
      
      // Performance metrics
      speed: { min: 0, max: 120, unit: 'mph', priority: 'medium' },
      throttlePosition: { min: 0, max: 100, unit: '%', priority: 'low' },
      
      // Emissions
      o2Sensor: { min: 0.1, max: 0.9, unit: 'V', priority: 'medium' },
      
      // Pressure systems
      manifoldPressure: { min: 10, max: 25, unit: 'inHg', priority: 'medium' },
      barometricPressure: { min: 28, max: 32, unit: 'inHg', priority: 'low' }
    };

    Object.entries(defaults).forEach(([key, value]) => {
      this.thresholds.set(key, value);
    });

    this.saveThresholds();
  }

  // Save thresholds to storage
  async saveThresholds() {
    try {
      const thresholdsObj = Object.fromEntries(this.thresholds);
      await AsyncStorage.setItem('alert_thresholds', JSON.stringify(thresholdsObj));
    } catch (error) {
      console.error('Error saving thresholds:', error);
    }
  }

  // Load alert history
  async loadAlertHistory() {
    try {
      const history = await DatabaseService.getAlertHistory();
      this.alertHistory = history || [];
    } catch (error) {
      console.error('Error loading alert history:', error);
    }
  }

  // Check data against thresholds
  checkThresholds(data) {
    if (!this.isInitialized) return;

    Object.entries(data).forEach(([parameter, value]) => {
      if (this.thresholds.has(parameter)) {
        this.evaluateThreshold(parameter, value);
      }
    });
  }

  // Evaluate individual threshold
  evaluateThreshold(parameter, value) {
    const threshold = this.thresholds.get(parameter);
    if (!threshold) return;

    const alertKey = `${parameter}_alert`;
    const isOutOfRange = value < threshold.min || value > threshold.max;
    const existingAlert = this.activeAlerts.get(alertKey);

    if (isOutOfRange && !existingAlert) {
      // Create new alert
      const alert = this.createAlert(parameter, value, threshold);
      this.activeAlerts.set(alertKey, alert);
      this.triggerAlert(alert);
      
    } else if (!isOutOfRange && existingAlert) {
      // Clear existing alert
      this.clearAlert(alertKey);
    } else if (isOutOfRange && existingAlert) {
      // Update existing alert with new value
      existingAlert.currentValue = value;
      existingAlert.lastUpdated = new Date().toISOString();
      this.emit('alertUpdated', existingAlert);
    }
  }

  // Create alert object
  createAlert(parameter, value, threshold) {
    const isBelow = value < threshold.min;
    const isAbove = value > threshold.max;
    
    return {
      id: `${parameter}_${Date.now()}`,
      parameter,
      currentValue: value,
      threshold,
      type: isBelow ? 'below_threshold' : 'above_threshold',
      priority: threshold.priority,
      message: this.generateAlertMessage(parameter, value, threshold, isBelow),
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };
  }

  // Generate human-readable alert message
  generateAlertMessage(parameter, value, threshold, isBelow) {
    const paramName = this.formatParameterName(parameter);
    const formattedValue = `${value}${threshold.unit}`;
    const boundaryValue = isBelow ? `${threshold.min}${threshold.unit}` : `${threshold.max}${threshold.unit}`;
    const direction = isBelow ? 'below' : 'above';
    
    return `${paramName} is ${direction} safe range: ${formattedValue} (limit: ${boundaryValue})`;
  }

  // Format parameter names for display
  formatParameterName(parameter) {
    const nameMap = {
      engineTemp: 'Engine Temperature',
      oilTemp: 'Oil Temperature',
      rpm: 'Engine RPM',
      fuelPressure: 'Fuel Pressure',
      fuelLevel: 'Fuel Level',
      batteryVoltage: 'Battery Voltage',
      speed: 'Vehicle Speed',
      throttlePosition: 'Throttle Position',
      o2Sensor: 'Oxygen Sensor',
      manifoldPressure: 'Manifold Pressure',
      barometricPressure: 'Barometric Pressure'
    };
    
    return nameMap[parameter] || parameter;
  }

  // Trigger alert actions
  async triggerAlert(alert) {
    try {
      // Add to history
      this.alertHistory.unshift(alert);
      await this.saveAlertToDatabase(alert);
      
      // Send notification
      await this.notificationService.sendAlert(alert);
      
      // Emit event
      this.emit('alertTriggered', alert);
      
      console.log(`Alert triggered: ${alert.message}`);
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  // Clear alert
  clearAlert(alertKey) {
    const alert = this.activeAlerts.get(alertKey);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.activeAlerts.delete(alertKey);
      this.emit('alertCleared', alert);
      console.log(`Alert cleared: ${alert.parameter}`);
    }
  }

  // Acknowledge alert
  acknowledgeAlert(alertId) {
    for (const [key, alert] of this.activeAlerts) {
      if (alert.id === alertId) {
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date().toISOString();
        this.emit('alertAcknowledged', alert);
        break;
      }
    }
  }

  // Save alert to database
  async saveAlertToDatabase(alert) {
    try {
      await DatabaseService.saveAlert(alert);
    } catch (error) {
      console.error('Error saving alert to database:', error);
    }
  }

  // Get active alerts
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  // Get alerts by priority
  getAlertsByPriority(priority) {
    return this.getActiveAlerts().filter(alert => alert.priority === priority);
  }

  // Get unacknowledged alerts
  getUnacknowledgedAlerts() {
    return this.getActiveAlerts().filter(alert => !alert.acknowledged);
  }

  // Update threshold
  async updateThreshold(parameter, threshold) {
    this.thresholds.set(parameter, threshold);
    await this.saveThresholds();
    this.emit('thresholdUpdated', { parameter, threshold });
  }

  // Get threshold
  getThreshold(parameter) {
    return this.thresholds.get(parameter);
  }

  // Get all thresholds
  getAllThresholds() {
    return Object.fromEntries(this.thresholds);
  }

  // Clear all alerts
  clearAllAlerts() {
    const clearedAlerts = Array.from(this.activeAlerts.values());
    clearedAlerts.forEach(alert => {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
    });
    
    this.activeAlerts.clear();
    this.emit('allAlertsCleared', clearedAlerts);
  }

  // Get alert statistics
  getAlertStatistics() {
    const total = this.alertHistory.length;
    const active = this.activeAlerts.size;
    const acknowledged = this.getActiveAlerts().filter(a => a.acknowledged).length;
    
    const byPriority = {
      high: this.getAlertsByPriority('high').length,
      medium: this.getAlertsByPriority('medium').length,
      low: this.getAlertsByPriority('low').length
    };
    
    return {
      total,
      active,
      acknowledged,
      unacknowledged: active - acknowledged,
      byPriority
    };
  }

  // Cleanup old history
  async cleanupHistory(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      this.alertHistory = this.alertHistory.filter(
        alert => new Date(alert.timestamp) > cutoffDate
      );
      
      await DatabaseService.cleanupOldAlerts(cutoffDate);
      console.log(`Alert history cleaned up, kept last ${daysToKeep} days`);
    } catch (error) {
      console.error('Error cleaning up alert history:', error);
    }
  }

  // Dispose
  dispose() {
    this.removeAllListeners();
    this.activeAlerts.clear();
    this.thresholds.clear();
    this.alertHistory = [];
    this.isInitialized = false;
    
    if (this.notificationService) {
      this.notificationService.dispose();
    }
  }
}

export default new AlertService();