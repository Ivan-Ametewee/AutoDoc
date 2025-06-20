import SQLite from 'react-native-sqlite-storage';

// Enable promise-based API
SQLite.enablePromise(true);

class DatabaseService {
  constructor() {
    this.database = null;
    this.isInitialized = false;
  }

  // Initialize database connection and create tables
  async initialize() {
    try {
      this.database = await SQLite.openDatabase({
        name: 'OBDIIApp.db',
        location: 'default',
      });

      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  // Create all necessary tables
  async createTables() {
    const queries = [
      // Data points table for real-time sensor data
      `CREATE TABLE IF NOT EXISTS data_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pid TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        raw_data TEXT,
        session_id TEXT
      )`,

      // Vehicle profiles table
      `CREATE TABLE IF NOT EXISTS vehicle_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        make TEXT,
        model TEXT,
        year INTEGER,
        vin TEXT,
        engine_type TEXT,
        transmission TEXT,
        fuel_type TEXT,
        is_active INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // DTC (Diagnostic Trouble Codes) table
      `CREATE TABLE IF NOT EXISTS dtc_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        description TEXT,
        severity TEXT,
        status TEXT DEFAULT 'active',
        first_detected DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_detected DATETIME DEFAULT CURRENT_TIMESTAMP,
        cleared_at DATETIME,
        freeze_frame_data TEXT,
        vehicle_id INTEGER,
        FOREIGN KEY (vehicle_id) REFERENCES vehicle_profiles (id)
      )`,

      // Trip data table
      `CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        distance REAL DEFAULT 0,
        duration INTEGER DEFAULT 0,
        avg_speed REAL DEFAULT 0,
        max_speed REAL DEFAULT 0,
        avg_rpm REAL DEFAULT 0,
        max_rpm REAL DEFAULT 0,
        fuel_consumed REAL DEFAULT 0,
        avg_fuel_economy REAL DEFAULT 0,
        vehicle_id INTEGER,
        FOREIGN KEY (vehicle_id) REFERENCES vehicle_profiles (id)
      )`,

      // Alert thresholds table
      `CREATE TABLE IF NOT EXISTS alert_thresholds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pid TEXT NOT NULL,
        threshold_type TEXT NOT NULL, -- 'min', 'max', 'range'
        min_value REAL,
        max_value REAL,
        is_enabled INTEGER DEFAULT 1,
        vehicle_id INTEGER,
        FOREIGN KEY (vehicle_id) REFERENCES vehicle_profiles (id)
      )`,

      // User settings table
      `CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Export history table
      `CREATE TABLE IF NOT EXISTS export_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        export_type TEXT NOT NULL, -- 'csv', 'pdf', 'json'
        file_path TEXT,
        date_range_start DATETIME,
        date_range_end DATETIME,
        record_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of queries) {
      await this.database.executeSql(query);
    }

    // Create indexes for better performance
    await this.createIndexes();
  }

  // Create database indexes
  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_data_points_timestamp ON data_points (timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_data_points_pid ON data_points (pid)',
      'CREATE INDEX IF NOT EXISTS idx_dtc_codes_code ON dtc_codes (code)',
      'CREATE INDEX IF NOT EXISTS idx_trips_start_time ON trips (start_time)',
      'CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_active ON vehicle_profiles (is_active)'
    ];

    for (const index of indexes) {
      await this.database.executeSql(index);
    }
  }

  // Data Points Operations
  async addDataPoint(dataPoint) {
    const { pid, value, unit, raw, sessionId } = dataPoint;
    const query = `
      INSERT INTO data_points (pid, value, unit, raw_data, session_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    try {
      await this.database.executeSql(query, [pid, value, unit, raw, sessionId]);
    } catch (error) {
      console.error('Error adding data point:', error);
    }
  }

  async getDataPoints(pid, startTime, endTime, limit = 1000) {
    let query = 'SELECT * FROM data_points WHERE pid = ?';
    const params = [pid];

    if (startTime) {
      query += ' AND timestamp >= ?';
      params.push(startTime);
    }

    if (endTime) {
      query += ' AND timestamp <= ?';
      params.push(endTime);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    try {
      const [results] = await this.database.executeSql(query, params);
      const dataPoints = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        dataPoints.push(results.rows.item(i));
      }
      
      return dataPoints;
    } catch (error) {
      console.error('Error getting data points:', error);
      return [];
    }
  }

  async getLatestDataPoint(pid) {
    const query = 'SELECT * FROM data_points WHERE pid = ? ORDER BY timestamp DESC LIMIT 1';
    
    try {
      const [results] = await this.database.executeSql(query, [pid]);
      return results.rows.length > 0 ? results.rows.item(0) : null;
    } catch (error) {
      console.error('Error getting latest data point:', error);
      return null;
    }
  }

  // Vehicle Profile Operations
  async createVehicleProfile(profile) {
    const query = `
      INSERT INTO vehicle_profiles (name, make, model, year, vin, engine_type, transmission, fuel_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await this.database.executeSql(query, [
        profile.name, profile.make, profile.model, profile.year,
        profile.vin, profile.engineType, profile.transmission, profile.fuelType
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating vehicle profile:', error);
      throw error;
    }
  }

  async getVehicleProfiles() {
    const query = 'SELECT * FROM vehicle_profiles ORDER BY is_active DESC, created_at DESC';
    
    try {
      const [results] = await this.database.executeSql(query);
      const profiles = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        profiles.push(results.rows.item(i));
      }
      
      return profiles;
    } catch (error) {
      console.error('Error getting vehicle profiles:', error);
      return [];
    }
  }

  async setActiveVehicle(vehicleId) {
    const queries = [
      'UPDATE vehicle_profiles SET is_active = 0',
      'UPDATE vehicle_profiles SET is_active = 1 WHERE id = ?'
    ];
    
    try {
      await this.database.executeSql(queries[0]);
      await this.database.executeSql(queries[1], [vehicleId]);
    } catch (error) {
      console.error('Error setting active vehicle:', error);
      throw error;
    }
  }

  async getActiveVehicle() {
    const query = 'SELECT * FROM vehicle_profiles WHERE is_active = 1 LIMIT 1';
    
    try {
      const [results] = await this.database.executeSql(query);
      return results.rows.length > 0 ? results.rows.item(0) : null;
    } catch (error) {
      console.error('Error getting active vehicle:', error);
      return null;
    }
  }

  async updateVehicleProfile(vehicleId, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const query = `
      UPDATE vehicle_profiles 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    try {
      await this.database.executeSql(query, [...values, vehicleId]);
    } catch (error) {
      console.error('Error updating vehicle profile:', error);
      throw error;
    }
  }

  async deleteVehicleProfile(vehicleId) {
    const query = 'DELETE FROM vehicle_profiles WHERE id = ?';
    
    try {
      await this.database.executeSql(query, [vehicleId]);
    } catch (error) {
      console.error('Error deleting vehicle profile:', error);
      throw error;
    }
  }

  // DTC Operations
  async addDTC(dtc) {
    const query = `
      INSERT OR REPLACE INTO dtc_codes (code, description, severity, freeze_frame_data, vehicle_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    try {
      await this.database.executeSql(query, [
        dtc.code, dtc.description, dtc.severity, 
        JSON.stringify(dtc.freezeFrameData), dtc.vehicleId
      ]);
    } catch (error) {
      console.error('Error adding DTC:', error);
    }
  }

  async getDTCs(vehicleId = null, includeCleared = false) {
    let query = 'SELECT * FROM dtc_codes';
    const params = [];

    if (vehicleId) {
      query += ' WHERE vehicle_id = ?';
      params.push(vehicleId);
    }

    if (!includeCleared) {
      query += vehicleId ? ' AND' : ' WHERE';
      query += ' status != "cleared"';
    }

    query += ' ORDER BY first_detected DESC';

    try {
      const [results] = await this.database.executeSql(query, params);
      const dtcs = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        const dtc = results.rows.item(i);
        if (dtc.freeze_frame_data) {
          dtc.freeze_frame_data = JSON.parse(dtc.freeze_frame_data);
        }
        dtcs.push(dtc);
      }
      
      return dtcs;
    } catch (error) {
      console.error('Error getting DTCs:', error);
      return [];
    }
  }

  async clearDTC(dtcId) {
    const query = `
      UPDATE dtc_codes 
      SET status = 'cleared', cleared_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    try {
      await this.database.executeSql(query, [dtcId]);
    } catch (error) {
      console.error('Error clearing DTC:', error);
      throw error;
    }
  }

  async clearAllDTCs(vehicleId = null) {
    let query = 'UPDATE dtc_codes SET status = "cleared", cleared_at = CURRENT_TIMESTAMP';
    const params = [];

    if (vehicleId) {
      query += ' WHERE vehicle_id = ?';
      params.push(vehicleId);
    }

    try {
      await this.database.executeSql(query, params);
    } catch (error) {
      console.error('Error clearing all DTCs:', error);
      throw error;
    }
  }

  // Trip Operations
  async startTrip(vehicleId) {
    const query = `
      INSERT INTO trips (vehicle_id)
      VALUES (?)
    `;
    
    try {
      const [result] = await this.database.executeSql(query, [vehicleId]);
      return result.insertId;
    } catch (error) {
      console.error('Error starting trip:', error);
      throw error;
    }
  }

  async endTrip(tripId, tripData) {
    const query = `
      UPDATE trips 
      SET end_time = CURRENT_TIMESTAMP, 
          distance = ?, duration = ?, avg_speed = ?, max_speed = ?,
          avg_rpm = ?, max_rpm = ?, fuel_consumed = ?, avg_fuel_economy = ?
      WHERE id = ?
    `;
    
    try {
      await this.database.executeSql(query, [
        tripData.distance, tripData.duration, tripData.avgSpeed, tripData.maxSpeed,
        tripData.avgRpm, tripData.maxRpm, tripData.fuelConsumed, tripData.avgFuelEconomy,
        tripId
      ]);
    } catch (error) {
      console.error('Error ending trip:', error);
      throw error;
    }
  }

  async getTrips(vehicleId = null, limit = 50) {
    let query = 'SELECT * FROM trips';
    const params = [];

    if (vehicleId) {
      query += ' WHERE vehicle_id = ?';
      params.push(vehicleId);
    }

    query += ' ORDER BY start_time DESC LIMIT ?';
    params.push(limit);

    try {
      const [results] = await this.database.executeSql(query, params);
      const trips = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        trips.push(results.rows.item(i));
      }
      
      return trips;
    } catch (error) {
      console.error('Error getting trips:', error);
      return [];
    }
  }

  async getTripById(tripId) {
    const query = 'SELECT * FROM trips WHERE id = ?';
    
    try {
      const [results] = await this.database.executeSql(query, [tripId]);
      return results.rows.length > 0 ? results.rows.item(0) : null;
    } catch (error) {
      console.error('Error getting trip by ID:', error);
      return null;
    }
  }

  async deleteTrip(tripId) {
    const query = 'DELETE FROM trips WHERE id = ?';
    
    try {
      await this.database.executeSql(query, [tripId]);
    } catch (error) {
      console.error('Error deleting trip:', error);
      throw error;
    }
  }

  // Alert Threshold Operations
  async setAlertThreshold(threshold) {
    const query = `
      INSERT OR REPLACE INTO alert_thresholds 
      (pid, threshold_type, min_value, max_value, is_enabled, vehicle_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      await this.database.executeSql(query, [
        threshold.pid, threshold.type, threshold.minValue, 
        threshold.maxValue, threshold.isEnabled ? 1 : 0, threshold.vehicleId
      ]);
    } catch (error) {
      console.error('Error setting alert threshold:', error);
      throw error;
    }
  }

  async getAlertThresholds(vehicleId = null) {
    let query = 'SELECT * FROM alert_thresholds';
    const params = [];

    if (vehicleId) {
      query += ' WHERE vehicle_id = ?';
      params.push(vehicleId);
    }

    query += ' ORDER BY pid';

    try {
      const [results] = await this.database.executeSql(query, params);
      const thresholds = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        thresholds.push(results.rows.item(i));
      }
      
      return thresholds;
    } catch (error) {
      console.error('Error getting alert thresholds:', error);
      return [];
    }
  }

  async deleteAlertThreshold(thresholdId) {
    const query = 'DELETE FROM alert_thresholds WHERE id = ?';
    
    try {
      await this.database.executeSql(query, [thresholdId]);
    } catch (error) {
      console.error('Error deleting alert threshold:', error);
      throw error;
    }
  }

  async toggleAlertThreshold(thresholdId, isEnabled) {
    const query = 'UPDATE alert_thresholds SET is_enabled = ? WHERE id = ?';
    
    try {
      await this.database.executeSql(query, [isEnabled ? 1 : 0, thresholdId]);
    } catch (error) {
      console.error('Error toggling alert threshold:', error);
      throw error;
    }
  }

  // User Settings Operations
  async setSetting(key, value) {
    const query = `
      INSERT OR REPLACE INTO user_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    
    try {
      await this.database.executeSql(query, [key, JSON.stringify(value)]);
    } catch (error) {
      console.error('Error setting user setting:', error);
      throw error;
    }
  }

  async getSetting(key, defaultValue = null) {
    const query = 'SELECT value FROM user_settings WHERE key = ?';
    
    try {
      const [results] = await this.database.executeSql(query, [key]);
      
      if (results.rows.length > 0) {
        const value = results.rows.item(0).value;
        return JSON.parse(value);
      }
      
      return defaultValue;
    } catch (error) {
      console.error('Error getting user setting:', error);
      return defaultValue;
    }
  }

  async getAllSettings() {
    const query = 'SELECT * FROM user_settings ORDER BY key';
    
    try {
      const [results] = await this.database.executeSql(query);
      const settings = {};
      
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        settings[row.key] = JSON.parse(row.value);
      }
      
      return settings;
    } catch (error) {
      console.error('Error getting all settings:', error);
      return {};
    }
  }

  async deleteSetting(key) {
    const query = 'DELETE FROM user_settings WHERE key = ?';
    
    try {
      await this.database.executeSql(query, [key]);
    } catch (error) {
      console.error('Error deleting setting:', error);
      throw error;
    }
  }

  // Export History Operations
  async addExportRecord(exportData) {
    const query = `
      INSERT INTO export_history 
      (export_type, file_path, date_range_start, date_range_end, record_count)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await this.database.executeSql(query, [
        exportData.type, exportData.filePath, exportData.startDate,
        exportData.endDate, exportData.recordCount
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding export record:', error);
      throw error;
    }
  }

  async getExportHistory(limit = 20) {
    const query = 'SELECT * FROM export_history ORDER BY created_at DESC LIMIT ?';
    
    try {
      const [results] = await this.database.executeSql(query, [limit]);
      const exports = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        exports.push(results.rows.item(i));
      }
      
      return exports;
    } catch (error) {
      console.error('Error getting export history:', error);
      return [];
    }
  }

  async deleteExportRecord(exportId) {
    const query = 'DELETE FROM export_history WHERE id = ?';
    
    try {
      await this.database.executeSql(query, [exportId]);
    } catch (error) {
      console.error('Error deleting export record:', error);
      throw error;
    }
  }

  // Utility Operations
  async cleanupOldData(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffString = cutoffDate.toISOString();

    const queries = [
      'DELETE FROM data_points WHERE timestamp < ?',
      'DELETE FROM export_history WHERE created_at < ?'
    ];

    try {
      for (const query of queries) {
        await this.database.executeSql(query, [cutoffString]);
      }
      
      console.log(`Cleaned up data older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw error;
    }
  }

  async getDatabaseStats() {
    const queries = [
      'SELECT COUNT(*) as count FROM data_points',
      'SELECT COUNT(*) as count FROM vehicle_profiles',
      'SELECT COUNT(*) as count FROM dtc_codes WHERE status != "cleared"',
      'SELECT COUNT(*) as count FROM trips',
      'SELECT COUNT(*) as count FROM alert_thresholds WHERE is_enabled = 1'
    ];

    try {
      const stats = {};
      const labels = ['dataPoints', 'vehicles', 'activeDTCs', 'trips', 'activeAlerts'];

      for (let i = 0; i < queries.length; i++) {
        const [results] = await this.database.executeSql(queries[i]);
        stats[labels[i]] = results.rows.item(0).count;
      }

      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {};
    }
  }

  async resetDatabase() {
    const tables = [
      'data_points', 'vehicle_profiles', 'dtc_codes', 
      'trips', 'alert_thresholds', 'user_settings', 'export_history'
    ];

    try {
      for (const table of tables) {
        await this.database.executeSql(`DELETE FROM ${table}`);
      }
      
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }

  // Close database connection
  async close() {
    if (this.database) {
      try {
        await this.database.close();
        this.database = null;
        this.isInitialized = false;
        console.log('Database connection closed');
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }
  }
}

// Create and export singleton instance
const databaseService = new DatabaseService();
export default databaseService;