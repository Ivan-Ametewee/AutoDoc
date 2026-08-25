//AlertService.ts
// src/services/alerts/AlertService.ts
import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './NotificationService.js';
import DatabaseService from '../database/DatabaseService';

type Threshold = {
  min: number;
  max: number;
  unit: string;
  priority: 'high' | 'medium' | 'low';
};

type Alert = {
  id: string;
  parameter: string;
  currentValue: number;
  threshold: Threshold;
  type: 'below_threshold' | 'above_threshold';
  priority: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  lastUpdated: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
};

class AlertService extends EventEmitter {
  private activeAlerts: Map<string, Alert> = new Map();
  private thresholds: Map<string, Threshold> = new Map();
  private alertHistory: Alert[] = [];
  private isInitialized: boolean = false;
  private notificationService: NotificationService;

  constructor() {
    super();
    this.notificationService = new NotificationService();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadThresholds();
      await this.loadAlertHistory();
      await this.notificationService.initialize();
      this.isInitialized = true;
      
    } catch (error) {
      
      throw error;
    }
  }

  private async loadThresholds(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('alert_thresholds');
      if (saved) {
        const thresholds = JSON.parse(saved) as Record<string, Threshold>;
        this.thresholds = new Map(Object.entries(thresholds));
      } else {
        this.setDefaultThresholds();
      }
    } catch (error) {
      
      this.setDefaultThresholds();
    }
  }

  private setDefaultThresholds(): void {
    const defaults: Record<string, Threshold> = {
      engineTemp: { min: 70, max: 105, unit: '°C', priority: 'high' },
      oilTemp: { min: 60, max: 120, unit: '°C', priority: 'medium' },
      rpm: { min: 500, max: 6500, unit: 'RPM', priority: 'medium' },
      fuelPressure: { min: 30, max: 80, unit: 'psi', priority: 'high' },
      fuelLevel: { min: 10, max: 100, unit: '%', priority: 'low' },
      batteryVoltage: { min: 11.5, max: 14.8, unit: 'V', priority: 'high' },
      speed: { min: 0, max: 120, unit: 'mph', priority: 'medium' },
      throttlePosition: { min: 0, max: 100, unit: '%', priority: 'low' },
      o2Sensor: { min: 0.1, max: 0.9, unit: 'V', priority: 'medium' },
      manifoldPressure: { min: 10, max: 25, unit: 'inHg', priority: 'medium' },
      barometricPressure: { min: 28, max: 32, unit: 'inHg', priority: 'low' }
    };

    Object.entries(defaults).forEach(([key, value]) => {
      this.thresholds.set(key, value);
    });

    this.saveThresholds();
  }

  private async saveThresholds(): Promise<void> {
    try {
      const thresholdsObj = Object.fromEntries(this.thresholds);
      await AsyncStorage.setItem('alert_thresholds', JSON.stringify(thresholdsObj));
    } catch (error) {
      
    }
  }

  private async loadAlertHistory(): Promise<void> {
    try {
      const history = await DatabaseService.getAlertHistory();
      this.alertHistory = history || [];
    } catch (error) {
      
    }
  }

  checkThresholds(data: Record<string, number>): void {
    if (!this.isInitialized) return;

    Object.entries(data).forEach(([parameter, value]) => {
      if (this.thresholds.has(parameter)) {
        this.evaluateThreshold(parameter, value);
      }
    });
  }

  private evaluateThreshold(parameter: string, value: number): void {
    const threshold = this.thresholds.get(parameter);
    if (!threshold) return;

    const alertKey = `${parameter}_alert`;
    const isOutOfRange = value < threshold.min || value > threshold.max;
    const existingAlert = this.activeAlerts.get(alertKey);

    if (isOutOfRange && !existingAlert) {
      const alert = this.createAlert(parameter, value, threshold);
      this.activeAlerts.set(alertKey, alert);
      this.triggerAlert(alert);
    } else if (!isOutOfRange && existingAlert) {
      this.clearAlert(alertKey);
    } else if (isOutOfRange && existingAlert) {
      existingAlert.currentValue = value;
      existingAlert.lastUpdated = new Date().toISOString();
      this.emit('alertUpdated', existingAlert);
    }
  }

  private createAlert(parameter: string, value: number, threshold: Threshold): Alert {
    const isBelow = value < threshold.min;

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

  private generateAlertMessage(parameter: string, value: number, threshold: Threshold, isBelow: boolean): string {
    const paramName = this.formatParameterName(parameter);
    const formattedValue = `${value}${threshold.unit}`;
    const boundaryValue = isBelow ? `${threshold.min}${threshold.unit}` : `${threshold.max}${threshold.unit}`;
    const direction = isBelow ? 'below' : 'above';

    return `${paramName} is ${direction} safe range: ${formattedValue} (limit: ${boundaryValue})`;
  }

  private formatParameterName(parameter: string): string {
    const nameMap: Record<string, string> = {
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

  private async triggerAlert(alert: Alert): Promise<void> {
    try {
      this.alertHistory.unshift(alert);
      await this.saveAlertToDatabase(alert);
      await this.notificationService.sendAlert(alert);
      this.emit('alertTriggered', alert);
      
    } catch (error) {
      
    }
  }

  private clearAlert(alertKey: string): void {
    const alert = this.activeAlerts.get(alertKey);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.activeAlerts.delete(alertKey);
      this.emit('alertCleared', alert);
      
    }
  }

  acknowledgeAlert(alertId: string): void {
    for (const [key, alert] of this.activeAlerts.entries()) {
      if (alert.id === alertId) {
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date().toISOString();
        this.emit('alertAcknowledged', alert);
        break;
      }
    }
  }

  private async saveAlertToDatabase(alert: Alert): Promise<void> {
    try {
      await DatabaseService.saveAlert(alert);
    } catch (error) {
      
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertsByPriority(priority: 'high' | 'medium' | 'low'): Alert[] {
    return this.getActiveAlerts().filter(alert => alert.priority === priority);
  }

  getUnacknowledgedAlerts(): Alert[] {
    return this.getActiveAlerts().filter(alert => !alert.acknowledged);
  }

  async updateThreshold(parameter: string, threshold: Threshold): Promise<void> {
    this.thresholds.set(parameter, threshold);
    await this.saveThresholds();
    this.emit('thresholdUpdated', { parameter, threshold });
  }

  getThreshold(parameter: string): Threshold | undefined {
    return this.thresholds.get(parameter);
  }

  getAllThresholds(): Record<string, Threshold> {
    return Object.fromEntries(this.thresholds);
  }

  clearAllAlerts(): void {
    const clearedAlerts = Array.from(this.activeAlerts.values());
    clearedAlerts.forEach(alert => {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
    });
    this.activeAlerts.clear();
    this.emit('allAlertsCleared', clearedAlerts);
  }

  getAlertStatistics(): Record<string, any> {
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

  async cleanupHistory(daysToKeep = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      this.alertHistory = this.alertHistory.filter(
        alert => new Date(alert.timestamp) > cutoffDate
      );

      await DatabaseService.cleanupOldAlerts(cutoffDate);
      
    } catch (error) {
      
    }
  }

  dispose(): void {
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