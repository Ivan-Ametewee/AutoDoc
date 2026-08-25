// VehicleData.js - Vehicle profile and configuration storage service

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from './DatabaseService';

/**
 * Vehicle Data Service
 * Manages vehicle profiles, configurations, and related data storage
 */
class VehicleDataService {
  constructor() {
    this.currentVehicle = null;
    this.vehicles = [];
    this.storageKey = 'vehicle_data';
    this.currentVehicleKey = 'current_vehicle_id';
  }

  /**
   * Initialize the vehicle data service
   */
  async initialize() {
    try {
      await this.loadVehicles();
      await this.loadCurrentVehicle();
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Create a new vehicle profile
   * @param {Object} vehicleData - Vehicle information
   * @returns {Object} Created vehicle profile
   */
  async createVehicle(vehicleData) {
    const vehicle = {
      id: this.generateVehicleId(),
      ...vehicleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      settings: this.getDefaultVehicleSettings(),
      statistics: this.getDefaultStatistics()
    };

    // Validate required fields
    this.validateVehicleData(vehicle);

    // Add to local array
    this.vehicles.push(vehicle);

    // Save to storage
    await this.saveVehicles();

    // Set as current vehicle if it's the first one
    if (this.vehicles.length === 1) {
      await this.setCurrentVehicle(vehicle.id);
    }

    // Save to database
    await DatabaseService.saveVehicleProfile(vehicle);

    return vehicle;
  }

  /**
   * Update existing vehicle profile
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated vehicle profile
   */
  async updateVehicle(vehicleId, updates) {
    const vehicleIndex = this.vehicles.findIndex(v => v.id === vehicleId);
    if (vehicleIndex === -1) {
      throw new Error('Vehicle not found');
    }

    // Apply updates
    this.vehicles[vehicleIndex] = {
      ...this.vehicles[vehicleIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const updatedVehicle = this.vehicles[vehicleIndex];

    // Validate after update
    this.validateVehicleData(updatedVehicle);

    // Save to storage
    await this.saveVehicles();

    // Update current vehicle if it's the one being updated
    if (this.currentVehicle && this.currentVehicle.id === vehicleId) {
      this.currentVehicle = updatedVehicle;
    }

    // Update in database
    await DatabaseService.updateVehicleProfile(updatedVehicle);

    return updatedVehicle;
  }

  /**
   * Delete vehicle profile
   * @param {string} vehicleId - Vehicle ID to delete
   * @returns {boolean} Success status
   */
  async deleteVehicle(vehicleId) {
    const vehicleIndex = this.vehicles.findIndex(v => v.id === vehicleId);
    if (vehicleIndex === -1) {
      throw new Error('Vehicle not found');
    }

    // Remove from array
    this.vehicles.splice(vehicleIndex, 1);

    // If this was the current vehicle, select another one
    if (this.currentVehicle && this.currentVehicle.id === vehicleId) {
      if (this.vehicles.length > 0) {
        await this.setCurrentVehicle(this.vehicles[0].id);
      } else {
        this.currentVehicle = null;
        await AsyncStorage.removeItem(this.currentVehicleKey);
      }
    }

    // Save to storage
    await this.saveVehicles();

    // Delete from database
    await DatabaseService.deleteVehicleProfile(vehicleId);

    return true;
  }

  /**
   * Get all vehicle profiles
   * @returns {Array} Array of vehicle profiles
   */
  getAllVehicles() {
    return this.vehicles.slice(); // Return copy
  }

  /**
   * Get vehicle by ID
   * @param {string} vehicleId - Vehicle ID
   * @returns {Object|null} Vehicle profile or null if not found
   */
  getVehicleById(vehicleId) {
    return this.vehicles.find(v => v.id === vehicleId) || null;
  }

  /**
   * Get current active vehicle
   * @returns {Object|null} Current vehicle profile
   */
  getCurrentVehicle() {
    return this.currentVehicle;
  }

  /**
   * Set current active vehicle
   * @param {string} vehicleId - Vehicle ID to set as current
   * @returns {Object} Current vehicle profile
   */
  async setCurrentVehicle(vehicleId) {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    this.currentVehicle = vehicle;
    await AsyncStorage.setItem(this.currentVehicleKey, vehicleId);

    return vehicle;
  }

  /**
   * Update vehicle statistics
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} stats - Statistics to update
   */
  async updateVehicleStatistics(vehicleId, stats) {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    vehicle.statistics = {
      ...vehicle.statistics,
      ...stats,
      lastUpdated: new Date().toISOString()
    };

    await this.updateVehicle(vehicleId, { statistics: vehicle.statistics });
  }

  /**
   * Update vehicle settings
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} settings - Settings to update
   */
  async updateVehicleSettings(vehicleId, settings) {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    vehicle.settings = {
      ...vehicle.settings,
      ...settings
    };

    await this.updateVehicle(vehicleId, { settings: vehicle.settings });
  }

  /**
   * Search vehicles by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array} Matching vehicles
   */
  searchVehicles(criteria) {
    return this.vehicles.filter(vehicle => {
      return Object.keys(criteria).every(key => {
        if (typeof criteria[key] === 'string') {
          return vehicle[key]?.toLowerCase().includes(criteria[key].toLowerCase());
        }
        return vehicle[key] === criteria[key];
      });
    });
  }

  /**
   * Export vehicle data
   * @param {string} vehicleId - Vehicle ID (optional, exports all if not provided)
   * @returns {Object} Exported data
   */
  async exportVehicleData(vehicleId = null) {
    if (vehicleId) {
      const vehicle = this.getVehicleById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }
      return {
        vehicle,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    }

    return {
      vehicles: this.vehicles,
      currentVehicleId: this.currentVehicle?.id || null,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Import vehicle data
   * @param {Object} data - Imported data
   * @returns {boolean} Success status
   */
  async importVehicleData(data) {
    try {
      if (data.vehicle) {
        // Single vehicle import
        const vehicle = {
          ...data.vehicle,
          id: this.generateVehicleId(), // Generate new ID to avoid conflicts
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await this.createVehicle(vehicle);
      } else if (data.vehicles) {
        // Multiple vehicles import
        for (const vehicleData of data.vehicles) {
          const vehicle = {
            ...vehicleData,
            id: this.generateVehicleId(), // Generate new ID to avoid conflicts
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await this.createVehicle(vehicle);
        }
      }
      return true;
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Load vehicles from storage
   */
  async loadVehicles() {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        this.vehicles = JSON.parse(data);
      }
    } catch (error) {
      
      this.vehicles = [];
    }
  }

  /**
   * Save vehicles to storage
   */
  async saveVehicles() {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.vehicles));
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Load current vehicle from storage
   */
  async loadCurrentVehicle() {
    try {
      const vehicleId = await AsyncStorage.getItem(this.currentVehicleKey);
      if (vehicleId) {
        this.currentVehicle = this.getVehicleById(vehicleId);
      }
    } catch (error) {
      
    }
  }

  /**
   * Generate unique vehicle ID
   * @returns {string} Unique vehicle ID
   */
  generateVehicleId() {
    return `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate vehicle data
   * @param {Object} vehicle - Vehicle data to validate
   */
  validateVehicleData(vehicle) {
    const required = ['make', 'model', 'year'];
    const missing = required.filter(field => !vehicle[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (vehicle.year && (vehicle.year < 1996 || vehicle.year > new Date().getFullYear() + 1)) {
      throw new Error('Invalid year. Must be 1996 or later.');
    }

    if (vehicle.vin && vehicle.vin.length !== 17) {
      throw new Error('VIN must be exactly 17 characters');
    }
  }

  /**
   * Get default vehicle settings
   * @returns {Object} Default settings object
   */
  getDefaultVehicleSettings() {
    return {
      units: {
        temperature: 'celsius', // celsius, fahrenheit
        pressure: 'kpa', // kpa, psi, bar
        distance: 'km', // km, miles
        fuelConsumption: 'l100km' // l100km, mpg, kmpl
      },
      alerts: {
        enableAlerts: true,
        soundEnabled: true,
        vibrationEnabled: true,
        criticalOnly: false
      },
      dashboard: {
        refreshRate: 1000, // milliseconds
        autoScale: true,
        showGrid: true,
        theme: 'auto' // auto, light, dark
      },
      monitoring: {
        enableLogging: true,
        logInterval: 5000, // milliseconds
        maxLogSize: 10000, // number of records
        autoExport: false
      },
      maintenance: {
        enableReminders: true,
        oilChangeInterval: 5000, // km
        filterChangeInterval: 15000, // km
        inspectionInterval: 365 // days
      }
    };
  }

  /**
   * Get default statistics object
   * @returns {Object} Default statistics object
   */
  getDefaultStatistics() {
    return {
      totalDistance: 0,
      totalRuntime: 0,
      avgFuelConsumption: 0,
      maxSpeed: 0,
      maxRPM: 0,
      maxCoolantTemp: 0,
      diagnosticScans: 0,
      dtcCount: 0,
      lastScanDate: null,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Clear all vehicle data (for testing/reset)
   */
  async clearAllData() {
    this.vehicles = [];
    this.currentVehicle = null;
    await AsyncStorage.removeItem(this.storageKey);
    await AsyncStorage.removeItem(this.currentVehicleKey);
    await DatabaseService.clearVehicleData();
  }

  /**
   * Get vehicle summary for display
   * @param {string} vehicleId - Vehicle ID
   * @returns {Object} Vehicle summary
   */
  getVehicleSummary(vehicleId) {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) {
      return null;
    }

    return {
      id: vehicle.id,
      displayName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      isActive: vehicle.isActive,
      isCurrent: this.currentVehicle?.id === vehicle.id,
      lastUsed: vehicle.updatedAt,
      totalScans: vehicle.statistics?.diagnosticScans || 0,
      totalDistance: vehicle.statistics?.totalDistance || 0
    };
  }

  /**
   * Get maintenance schedule for vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Array} Maintenance items
   */
  getMaintenanceSchedule(vehicleId) {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) {
      return [];
    }

    const currentDate = new Date();
    const currentDistance = vehicle.statistics?.totalDistance || 0;
    const settings = vehicle.settings?.maintenance || this.getDefaultVehicleSettings().maintenance;

    const schedule = [];

    // Oil change
    const lastOilChange = vehicle.maintenance?.lastOilChange || 0;
    const oilChangeDue = lastOilChange + settings.oilChangeInterval;
    schedule.push({
      type: 'oil_change',
      name: 'Oil Change',
      dueDistance: oilChangeDue,
      overdue: currentDistance >= oilChangeDue,
      urgency: this.calculateUrgency(currentDistance, oilChangeDue)
    });

    // Filter change
    const lastFilterChange = vehicle.maintenance?.lastFilterChange || 0;
    const filterChangeDue = lastFilterChange + settings.filterChangeInterval;
    schedule.push({
      type: 'filter_change',
      name: 'Air Filter Change',
      dueDistance: filterChangeDue,
      overdue: currentDistance >= filterChangeDue,
      urgency: this.calculateUrgency(currentDistance, filterChangeDue)
    });

    // Inspection
    const lastInspection = vehicle.maintenance?.lastInspection || vehicle.createdAt;
    const inspectionDate = new Date(lastInspection);
    inspectionDate.setDate(inspectionDate.getDate() + settings.inspectionInterval);
    schedule.push({
      type: 'inspection',
      name: 'Safety Inspection',
      dueDate: inspectionDate.toISOString(),
      overdue: currentDate >= inspectionDate,
      urgency: this.calculateDateUrgency(currentDate, inspectionDate)
    });

    return schedule.sort((a, b) => b.urgency - a.urgency);
  }

  /**
   * Calculate urgency for distance-based maintenance
   * @param {number} current - Current distance
   * @param {number} due - Due distance
   * @returns {number} Urgency score (0-100)
   */
  calculateUrgency(current, due) {
    if (current >= due) return 100; // Overdue
    const remaining = due - current;
    const threshold = due * 0.1; // 10% threshold
    if (remaining <= threshold) {
      return Math.round((1 - remaining / threshold) * 99);
    }
    return 0;
  }

  /**
   * Calculate urgency for date-based maintenance
   * @param {Date} current - Current date
   * @param {Date} due - Due date
   * @returns {number} Urgency score (0-100)
   */
  calculateDateUrgency(current, due) {
    if (current >= due) return 100; // Overdue
    const diffTime = due.getTime() - current.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) { // 30 days threshold
      return Math.round((1 - diffDays / 30) * 99);
    }
    return 0;
  }
}

// Vehicle form validation schemas
export const VEHICLE_VALIDATION_SCHEMA = {
  make: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s-]+$/
  },
  model: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s-]+$/
  },
  year: {
    required: true,
    type: 'number',
    min: 1996,
    max: new Date().getFullYear() + 1
  },
  vin: {
    required: false,
    length: 17,
    pattern: /^[A-HJ-NPR-Z0-9]{17}$/i
  },
  engine: {
    required: false,
    maxLength: 100
  },
  transmission: {
    required: false,
    enum: ['manual', 'automatic', 'cvt', 'dual-clutch']
  },
  fuelType: {
    required: false,
    enum: ['gasoline', 'diesel', 'hybrid', 'electric', 'lpg', 'cng']
  }
};

// Predefined vehicle makes for form dropdowns
export const VEHICLE_MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
  'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar',
  'Jeep', 'Kia', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi',
  'Nissan', 'Pontiac', 'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota',
  'Volkswagen', 'Volvo', 'Other'
];

// Export singleton instance
export const VehicleData = new VehicleDataService();
export default VehicleData;