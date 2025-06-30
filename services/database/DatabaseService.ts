import SQLite, { SQLiteDatabase, ResultSet } from 'react-native-sqlite-storage';

// Interfaces for our data models
export interface DataPoint {
  id?: number;
  pid: string;
  value: number;
  unit?: string;
  timestamp?: string;
  raw_data?: string;
  session_id?: string;
}

export interface VehicleProfile {
  id?: number;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  engine_type?: string;
  transmission?: string;
  fuel_type?: string;
  is_active?: 0 | 1;
  created_at?: string;
  updated_at?: string;
}

export interface DtcCode {
  id?: number;
  code: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high';
  status?: 'active' | 'cleared';
  first_detected?: string;
  last_detected?: string;
  cleared_at?: string;
  freeze_frame_data?: string; // Stored as JSON string
  vehicle_id?: number;
}

export interface Alert {
  id?: number;
  alert_id: string;
  parameter: string;
  current_value: number;
  threshold_data: string; // JSON string
  type: 'below_threshold' | 'above_threshold';
  priority: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  last_updated: string;
  acknowledged: 0 | 1;
  acknowledged_at?: string;
  resolved: 0 | 1;
  resolved_at?: string;
  vehicle_id?: number;
}

// Enable promise-based API
SQLite.enablePromise(true);

class DatabaseService {
  private database: SQLiteDatabase | null = null;
  public isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
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

  private async createTables(): Promise<void> {
    const queries = [
      // ... (queries from the original file are unchanged) ...
       `CREATE TABLE IF NOT EXISTS data_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pid TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        raw_data TEXT,
        session_id TEXT
      )`,
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
      `
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id TEXT NOT NULL UNIQUE,
      parameter TEXT NOT NULL,
      current_value REAL NOT NULL,
      threshold_data TEXT NOT NULL,
      type TEXT NOT NULL,
      priority TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      acknowledged INTEGER DEFAULT 0,
      acknowledged_at DATETIME,
      resolved INTEGER DEFAULT 0,
      resolved_at DATETIME,
      vehicle_id INTEGER,
      FOREIGN KEY (vehicle_id) REFERENCES vehicle_profiles (id)
    )`
    ];
    await this.database!.transaction(tx => {
        queries.forEach(query => {
            tx.executeSql(query);
        });
    });
  }
  
  // --- Data Point Operations ---
  async addDataPoint(dataPoint: DataPoint): Promise<void> {
    const { pid, value, unit, raw_data, session_id } = dataPoint;
    const query = `INSERT INTO data_points (pid, value, unit, raw_data, session_id) VALUES (?, ?, ?, ?, ?)`;
    await this.database!.executeSql(query, [pid, value, unit, raw_data, session_id]);
  }

  // --- Vehicle Profile Operations ---
  async createVehicleProfile(profile: VehicleProfile): Promise<number> {
    const query = `INSERT INTO vehicle_profiles (name, make, model, year, vin, engine_type, transmission, fuel_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await this.database!.executeSql(query, [
      profile.name, profile.make, profile.model, profile.year,
      profile.vin, profile.engine_type, profile.transmission, profile.fuel_type,
    ]);
    return result.insertId;
  }

  async getVehicleProfiles(): Promise<VehicleProfile[]> {
    const query = 'SELECT * FROM vehicle_profiles ORDER BY is_active DESC, created_at DESC';
    const [results] = await this.database!.executeSql(query);
    return results.rows.raw();
  }
  
  async setActiveVehicle(vehicleId: number): Promise<void> {
     await this.database!.transaction(tx => {
        tx.executeSql('UPDATE vehicle_profiles SET is_active = 0');
        tx.executeSql('UPDATE vehicle_profiles SET is_active = 1 WHERE id = ?', [vehicleId]);
    });
  }

  async getActiveVehicle(): Promise<VehicleProfile | null> {
    const query = 'SELECT * FROM vehicle_profiles WHERE is_active = 1 LIMIT 1';
    const [results] = await this.database!.executeSql(query);
    return results.rows.length > 0 ? results.rows.item(0) : null;
  }
  
   async updateVehicleProfile(vehicleId: number, updates: Partial<VehicleProfile>): Promise<void> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const query = `UPDATE vehicle_profiles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.database!.executeSql(query, [...values, vehicleId]);
  }

  async saveAlert(alert: any): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO alerts (
        alert_id, parameter, current_value, threshold_data, type, priority, 
        message, timestamp, last_updated, acknowledged, acknowledged_at, 
        resolved, resolved_at, vehicle_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const activeVehicle = await this.getActiveVehicle();
    const vehicleId = activeVehicle?.id || null;
    
    await this.database!.executeSql(query, [
      alert.id,
      alert.parameter,
      alert.currentValue,
      JSON.stringify(alert.threshold),
      alert.type,
      alert.priority,
      alert.message,
      alert.timestamp,
      alert.lastUpdated,
      alert.acknowledged ? 1 : 0,
      alert.acknowledgedAt || null,
      alert.resolved ? 1 : 0,
      alert.resolvedAt || null,
      vehicleId
    ]);
  }

  async getAlertHistory(
    vehicleId?: number,
    limit = 100,
    priority?: 'high' | 'medium' | 'low',
    resolved?: boolean
  ): Promise<any[]> {
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params: any[] = [];

    if (vehicleId !== undefined) {
      query += ' AND vehicle_id = ?';
      params.push(vehicleId);
    }

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    if (resolved !== undefined) {
      query += ' AND resolved = ?';
      params.push(resolved ? 1 : 0);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const [results] = await this.database!.executeSql(query, params);
    const alerts = results.rows.raw();

    // Parse threshold_data back to object
    return alerts.map(alert => ({
      ...alert,
      threshold: JSON.parse(alert.threshold_data),
      acknowledged: alert.acknowledged === 1,
      resolved: alert.resolved === 1
    }));
  }

  async getActiveAlerts(vehicleId?: number): Promise<any[]> {
    return this.getAlertHistory(vehicleId, 50, undefined, false);
  }

  /**
   * Update alert status (acknowledge or resolve)
   */
  async updateAlertStatus(
    alertId: string, 
    updates: {
      acknowledged?: boolean;
      acknowledgedAt?: string;
      resolved?: boolean;
      resolvedAt?: string;
    }
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.acknowledged !== undefined) {
      fields.push('acknowledged = ?');
      values.push(updates.acknowledged ? 1 : 0);
    }

    if (updates.acknowledgedAt) {
      fields.push('acknowledged_at = ?');
      values.push(updates.acknowledgedAt);
    }

    if (updates.resolved !== undefined) {
      fields.push('resolved = ?');
      values.push(updates.resolved ? 1 : 0);
    }

    if (updates.resolvedAt) {
      fields.push('resolved_at = ?');
      values.push(updates.resolvedAt);
    }

    fields.push('last_updated = CURRENT_TIMESTAMP');

    const query = `UPDATE alerts SET ${fields.join(', ')} WHERE alert_id = ?`;
    values.push(alertId);

    await this.database!.executeSql(query, values);
  }

  /**
   * Clean up old alerts (delete alerts older than cutoff date)
   */
  async cleanupOldAlerts(cutoffDate: Date): Promise<void> {
    const query = 'DELETE FROM alerts WHERE timestamp < ?';
    const isoDate = cutoffDate.toISOString();
    
    const [result] = await this.database!.executeSql(query, [isoDate]);
    console.log(`Cleaned up ${result.rowsAffected} old alerts`);
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(vehicleId?: number): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    byPriority: { high: number; medium: number; low: number };
  }> {
    let baseQuery = 'SELECT COUNT(*) as count FROM alerts WHERE 1=1';
    const params: any[] = [];

    if (vehicleId !== undefined) {
      baseQuery += ' AND vehicle_id = ?';
      params.push(vehicleId);
    }

    // Total alerts
    const [totalResult] = await this.database!.executeSql(baseQuery, params);
    const total = totalResult.rows.item(0).count;

    // Active alerts
    const [activeResult] = await this.database!.executeSql(
      baseQuery + ' AND resolved = 0',
      params
    );
    const active = activeResult.rows.item(0).count;

    // Acknowledged alerts
    const [acknowledgedResult] = await this.database!.executeSql(
      baseQuery + ' AND acknowledged = 1 AND resolved = 0',
      params
    );
    const acknowledged = acknowledgedResult.rows.item(0).count;

    // By priority
    const priorities = ['high', 'medium', 'low'];
    const byPriority: { high: number; medium: number; low: number } = {
      high: 0,
      medium: 0,
      low: 0
    };

    for (const priority of priorities) {
      const [priorityResult] = await this.database!.executeSql(
        baseQuery + ' AND priority = ? AND resolved = 0',
        [...params, priority]
      );
      byPriority[priority as keyof typeof byPriority] = priorityResult.rows.item(0).count;
    }

    return {
      total,
      active,
      acknowledged,
      byPriority
    };
  }

  /**
   * Delete all alerts for a specific vehicle
   */
  async deleteVehicleAlerts(vehicleId: number): Promise<void> {
    const query = 'DELETE FROM alerts WHERE vehicle_id = ?';
    await this.database!.executeSql(query, [vehicleId]);
  }

  /**
   * Get alerts by parameter (e.g., all engine temperature alerts)
   */
  async getAlertsByParameter(
    parameter: string,
    vehicleId?: number,
    limit = 50
  ): Promise<any[]> {
    let query = 'SELECT * FROM alerts WHERE parameter = ?';
    const params: any[] = [parameter];

    if (vehicleId !== undefined) {
      query += ' AND vehicle_id = ?';
      params.push(vehicleId);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const [results] = await this.database!.executeSql(query, params);
    const alerts = results.rows.raw();

    return alerts.map(alert => ({
      ...alert,
      threshold: JSON.parse(alert.threshold_data),
      acknowledged: alert.acknowledged === 1,
      resolved: alert.resolved === 1
    }));
  }
  // --- DTC Operations ---
   async addDTC(dtc: DtcCode): Promise<void> {
    const query = `INSERT OR REPLACE INTO dtc_codes (code, description, severity, freeze_frame_data, vehicle_id) VALUES (?, ?, ?, ?, ?)`;
    await this.database!.executeSql(query, [
        dtc.code, dtc.description, dtc.severity, 
        JSON.stringify(dtc.freeze_frame_data || {}), dtc.vehicle_id
      ]);
  }

  async getDTCs(vehicleId: number | null = null, includeCleared = false): Promise<DtcCode[]> {
    let query = 'SELECT * FROM dtc_codes';
    const params: any[] = [];
    // ... logic from original file
    const [results] = await this.database!.executeSql(query, params);
    const dtcs: DtcCode[] = results.rows.raw();
    // Parse freeze_frame_data back to object
    dtcs.forEach(dtc => {
        if(dtc.freeze_frame_data) {
            dtc.freeze_frame_data = JSON.parse(dtc.freeze_frame_data as string);
        }
    });
    return dtcs;
  }
  
  // ... other methods converted similarly ...

  async close(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }
}


export default new DatabaseService();