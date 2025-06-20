// HistoryData.js - Historical data management and storage service

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from './DatabaseService';
import { PID_DEFINITIONS } from './PIDDefinitions';

/**
 * History Data Service
 * Manages historical OBDII data collection, storage, and analysis
 */
class HistoryDataService {
  constructor() {
    this.sessions = [];
    this.currentSession = null;
    this.storageKey = 'history_data';
    this.currentSessionKey = 'current_session';
    this.maxRecordsPerSession = 10000;
    this.maxSessions = 100;
    this.isRecording = false;
  }

  /**
   * Initialize the history data service
   */
  async initialize() {
    try {
      await this.loadSessions();
      await this.loadCurrentSession();
      return true;
    } catch (error) {
      console.error('Failed to initialize HistoryDataService:', error);
      return false;
    }
  }

  /**
   * Start a new recording session
   * @param {Object} sessionConfig - Session configuration
   * @returns {Object} Created session
   */
  async startSession(sessionConfig = {}) {
    if (this.isRecording && this.currentSession) {
      throw new Error('Recording session already in progress');
    }

    const session = {
      id: this.generateSessionId(),
      vehicleId: sessionConfig.vehicleId || null,
      name: sessionConfig.name || `Session ${new Date().toLocaleString()}`,
      description: sessionConfig.description || '',
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      recordCount: 0,
      dataPoints: [],
      summary: this.getDefaultSessionSummary(),
      metadata: {
        sampleRate: sessionConfig.sampleRate || 1000, // milliseconds
        selectedPIDs: sessionConfig.selectedPIDs || [],
        autoSave: sessionConfig.autoSave !== false,
        maxDuration: sessionConfig.maxDuration || null, // seconds
        ...sessionConfig.metadata
      },
      status: 'active',
      createdAt: new Date().toISOString()
    };

    this.currentSession = session;
    this.isRecording = true;

    // Save current session
    await this.saveCurrentSession();

    // Add to sessions list
    this.sessions.unshift(session);
    await this.saveSessions();

    return session;
  }

  /**
   * Stop the current recording session
   * @returns {Object} Completed session
   */
  async stopSession() {
    if (!this.isRecording || !this.currentSession) {
      throw new Error('No active recording session');
    }

    const endTime = new Date().toISOString();
    const startTime = new Date(this.currentSession.startTime);
    const duration = (new Date(endTime) - startTime) / 1000; // seconds

    // Update current session
    this.currentSession.endTime = endTime;
    this.currentSession.duration = duration;
    this.currentSession.status = 'completed';
    this.currentSession.summary = this.calculateSessionSummary(this.currentSession);

    // Update in sessions array
    const sessionIndex = this.sessions.findIndex(s => s.id === this.currentSession.id);
    if (sessionIndex !== -1) {
      this.sessions[sessionIndex] = { ...this.currentSession };
    }

    // Save to database
    await DatabaseService.saveSession(this.currentSession);

    // Save to storage
    await this.saveSessions();

    // Clear current session
    const completedSession = { ...this.currentSession };
    this.currentSession = null;
    this.isRecording = false;
    await AsyncStorage.removeItem(this.currentSessionKey);

    return completedSession;
  }

  /**
   * Add data point to current session
   * @param {Object} dataPoint - OBDII data point
   */
  async addDataPoint(dataPoint) {
    if (!this.isRecording || !this.currentSession) {
      return;
    }

    // Add timestamp if not present
    if (!dataPoint.timestamp) {
      dataPoint.timestamp = new Date().toISOString();
    }

    // Add to current session
    this.currentSession.dataPoints.push(dataPoint);
    this.currentSession.recordCount = this.currentSession.dataPoints.length;

    // Check if we need to save (auto-save every 100 records)
    if (this.currentSession.metadata.autoSave && 
        this.currentSession.recordCount % 100 === 0) {
      await this.saveCurrentSession();
    }

    // Check limits
    await this.checkSessionLimits();
  }

  /**
   * Add multiple data points at once
   * @param {Array} dataPoints - Array of OBDII data points
   */
  async addDataPoints(dataPoints) {
    if (!this.isRecording || !this.currentSession) {
      return;
    }

    const timestamp = new Date().toISOString();
    const processedPoints = dataPoints.map(point => ({
      ...point,
      timestamp: point.timestamp || timestamp
    }));

    this.currentSession.dataPoints.push(...processedPoints);
    this.currentSession.recordCount = this.currentSession.dataPoints.length;

    if (this.currentSession.metadata.autoSave) {
      await this.saveCurrentSession();
    }

    await this.checkSessionLimits();
  }

  /**
   * Get current recording session
   * @returns {Object|null} Current session or null
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Get all sessions
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of sessions
   */
  getSessions(filters = {}) {
    let filteredSessions = [...this.sessions];

    if (filters.vehicleId) {
      filteredSessions = filteredSessions.filter(s => s.vehicleId === filters.vehicleId);
    }

    if (filters.status) {
      filteredSessions = filteredSessions.filter(s => s.status === filters.status);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredSessions = filteredSessions.filter(s => new Date(s.startTime) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredSessions = filteredSessions.filter(s => new Date(s.startTime) <= endDate);
    }

    if (filters.minDuration) {
      filteredSessions = filteredSessions.filter(s => s.duration >= filters.minDuration);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredSessions = filteredSessions.filter(s => 
        s.name.toLowerCase().includes(searchTerm) ||
        s.description.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by start time (newest first)
    return filteredSessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session or null if not found
   */
  async getSessionById(sessionId) {
    // Check in memory first
    let session = this.sessions.find(s => s.id === sessionId);
    
    if (!session) {
      // Try to load from database
      session = await DatabaseService.getSessionById(sessionId);
    }

    return session;
  }

  /**
   * Delete session
   * @param {string} sessionId - Session ID to delete
   * @returns {boolean} Success status
   */
  async deleteSession(sessionId) {
    // Cannot delete active session
    if (this.currentSession && this.currentSession.id === sessionId) {
      throw new Error('Cannot delete active session');
    }

    // Remove from memory
    const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      this.sessions.splice(sessionIndex, 1);
      await this.saveSessions();
    }

    // Remove from database
    await DatabaseService.deleteSession(sessionId);

    return true;
  }

  /**
   * Update session metadata
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated session
   */
  async updateSession(sessionId, updates) {
    const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    // Apply updates
    this.sessions[sessionIndex] = {
      ...this.sessions[sessionIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const updatedSession = this.sessions[sessionIndex];

    // Update current session if it's the one being updated
    if (this.currentSession && this.currentSession.id === sessionId) {
      this.currentSession = updatedSession;
      await this.saveCurrentSession();
    }

    // Save to storage
    await this.saveSessions();

    // Update in database
    await DatabaseService.updateSession(updatedSession);

    return updatedSession;
  }

  /**
   * Get session data for analysis
   * @param {string} sessionId - Session ID
   * @param {Object} options - Analysis options
   * @returns {Object} Processed session data
   */
  async getSessionData(sessionId, options = {}) {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    let dataPoints = session.dataPoints;

    // Apply time range filter
    if (options.startTime || options.endTime) {
      dataPoints = dataPoints.filter(point => {
        const pointTime = new Date(point.timestamp);
        if (options.startTime && pointTime < new Date(options.startTime)) return false;
        if (options.endTime && pointTime > new Date(options.endTime)) return false;
        return true;
      });
    }

    // Apply PID filter
    if (options.pids && options.pids.length > 0) {
      dataPoints = dataPoints.filter(point => options.pids.includes(point.pid));
    }

    // Apply sampling (reduce data density)
    if (options.sampleRate && options.sampleRate > 1) {
      dataPoints = dataPoints.filter((_, index) => index % options.sampleRate === 0);
    }

    return {
      session: {
        id: session.id,
        name: session.name,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration
      },
      dataPoints,
      totalPoints: dataPoints.length,
      timeRange: {
        start: dataPoints.length > 0 ? dataPoints[0].timestamp : null,
        end: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].timestamp : null
      }
    };
  }

  /**
   * Analyze session data
   * @param {string} sessionId - Session ID
   * @param {Array} pids - PIDs to analyze
   * @returns {Object} Analysis results
   */
  async analyzeSession(sessionId, pids = []) {
    const sessionData = await this.getSessionData(sessionId, { pids });
    const analysis = {};

    // Group data by PID
    const pidData = {};
    sessionData.dataPoints.forEach(point => {
      if (!pidData[point.pid]) {
        pidData[point.pid] = [];
      }
      pidData[point.pid].push(point);
    });

    // Analyze each PID
    Object.keys(pidData).forEach(pid => {
      const points = pidData[pid];
      const values = points.map(p => p.value).filter(v => typeof v === 'number');
      
      if (values.length === 0) return;

      const pidDef = PID_DEFINITIONS[pid];
      analysis[pid] = {
        name: pidDef?.name || `PID ${pid}`,
        unit: pidDef?.unit || '',
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        median: this.calculateMedian(values),
        trend: this.calculateTrend(points),
        alerts: this.checkAlerts(pid, values)
      };
    });

    return {
      sessionId,
      sessionName: sessionData.session.name,
      duration: sessionData.session.duration,
      totalDataPoints: sessionData.totalPoints,
      analyzedPIDs: Object.keys(analysis).length,
      analysis,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Export session data
   * @param {string} sessionId - Session ID
   * @param {string} format - Export format (json, csv)
   * @returns {Object} Export data
   */
  async exportSession(sessionId, format = 'json') {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const exportData = {
      session: {
        id: session.id,
        name: session.name,
        description: session.description,
        vehicleId: session.vehicleId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        recordCount: session.recordCount,
        summary: session.summary
      },
      dataPoints: session.dataPoints,
      exportedAt: new Date().toISOString(),
      format,
      version: '1.0'
    };

    if (format === 'csv') {
      return this.convertToCSV(exportData);
    }

    return exportData;
  }

  /**
   * Import session data
   * @param {Object} data - Import data
   * @returns {Object} Imported session
   */
  async importSession(data) {
    if (!data.session || !data.dataPoints) {
      throw new Error('Invalid import data format');
    }

    const session = {
      ...data.session,
      id: this.generateSessionId(), // Generate new ID
      status: 'completed',
      createdAt: new Date().toISOString(),
      importedAt: new Date().toISOString()
    };

    // Add to sessions
    this.sessions.unshift(session);
    await this.saveSessions();

    // Save to database
    await DatabaseService.saveSession(session);

    return session;
  }

  /**
   * Get session statistics
   * @param {Object} filters - Optional filters
   * @returns {Object} Statistics
   */
  getSessionStatistics(filters = {}) {
    const sessions = this.getSessions(filters);
    const completed = sessions.filter(s => s.status === 'completed');

    if (completed.length === 0) {
      return this.getEmptyStatistics();
    }

    const totalDuration = completed.reduce((sum, s) => sum + s.duration, 0);
    const totalRecords = completed.reduce((sum, s) => sum + s.recordCount, 0);
    const durations = completed.map(s => s.duration);

    return {
      totalSessions: completed.length,
      totalDuration,
      totalRecords,
      avgDuration: totalDuration / completed.length,
      avgRecords: totalRecords / completed.length,
      longestSession: Math.max(...durations),
      shortestSession: Math.min(...durations),
      mostRecentSession: completed.length > 0 ? completed[0].startTime : null,
      oldestSession: completed.length > 0 ? completed[completed.length - 1].startTime : null
    };
  }

  /**
   * Clean up old sessions
   * @param {Object} options - Cleanup options
   */
  async cleanupSessions(options = {}) {
    const maxAge = options.maxAge || 90; // days
    const maxSessions = options.maxSessions || this.maxSessions;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    let sessionsToDelete = [];

    // Delete by age
    sessionsToDelete = this.sessions.filter(session => 
      session.status === 'completed' && 
      new Date(session.startTime) < cutoffDate
    );

    // Delete excess sessions (keep newest)
    if (this.sessions.length > maxSessions) {
      const sortedSessions = [...this.sessions].sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
      );
      const excessSessions = sortedSessions.slice(maxSessions);
      sessionsToDelete.push(...excessSessions);
    }

    // Remove duplicates
    sessionsToDelete = [...new Set(sessionsToDelete.map(s => s.id))]
      .map(id => this.sessions.find(s => s.id === id));

    // Delete sessions
    for (const session of sessionsToDelete) {
      await this.deleteSession(session.id);
    }

    return {
      deletedCount: sessionsToDelete.length,
      remainingCount: this.sessions.length
    };
  }

  // Private helper methods

  /**
   * Check session limits and auto-stop if needed
   */
  async checkSessionLimits() {
    if (!this.currentSession) return;

    const { metadata } = this.currentSession;

    // Check record count limit
    if (this.currentSession.recordCount >= this.maxRecordsPerSession) {
      console.warn('Session reached maximum record count, stopping...');
      await this.stopSession();
      return;
    }

    // Check duration limit
    if (metadata.maxDuration) {
      const elapsed = (new Date() - new Date(this.currentSession.startTime)) / 1000;
      if (elapsed >= metadata.maxDuration) {
        console.warn('Session reached maximum duration, stopping...');
        await this.stopSession();
        return;
      }
    }
  }

  /**
   * Calculate session summary
   * @param {Object} session - Session to summarize
   * @returns {Object} Session summary
   */
  calculateSessionSummary(session) {
    if (!session.dataPoints.length) {
      return this.getDefaultSessionSummary();
    }

    const pidCounts = {};
    const pidValues = {};

    session.dataPoints.forEach(point => {
      pidCounts[point.pid] = (pidCounts[point.pid] || 0) + 1;
      
      if (typeof point.value === 'number') {
        if (!pidValues[point.pid]) pidValues[point.pid] = [];
        pidValues[point.pid].push(point.value);
      }
    });

    const summary = {
      totalDataPoints: session.dataPoints.length,
      uniquePIDs: Object.keys(pidCounts).length,
      mostFrequentPID: Object.keys(pidCounts).reduce((a, b) => 
        pidCounts[a] > pidCounts[b] ? a : b
      ),
      dataRate: session.duration > 0 ? session.dataPoints.length / session.duration : 0,
      pidSummary: {}
    };

    // Calculate PID summaries
    Object.keys(pidValues).forEach(pid => {
      const values = pidValues[pid];
      if (values.length > 0) {
        summary.pidSummary[pid] = {
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length
        };
      }
    });

    return summary;
  }

  /**
   * Calculate median value
   * @param {Array} values - Array of numbers
   * @returns {number} Median value
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Calculate trend for data points
   * @param {Array} points - Data points with timestamps
   * @returns {string} Trend direction
   */
  calculateTrend(points) {
    if (points.length < 2) return 'insufficient_data';
    
    const first = points[0].value;
    const last = points[points.length - 1].value;
    const diff = last - first;
    const threshold = Math.abs(first) * 0.05; // 5% threshold

    if (Math.abs(diff) < threshold) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Check for alerts in values
   * @param {string} pid - PID code
   * @param {Array} values - Array of values
   * @returns {Array} Array of alerts
   */
  checkAlerts(pid, values) {
    // This would integrate with your alert system
    // For now, return empty array
    return [];
  }

  /**
   * Convert export data to CSV format
   * @param {Object} exportData - Data to convert
   * @returns {string} CSV string
   */
  convertToCSV(exportData) {
    const headers = ['timestamp', 'pid', 'name', 'value', 'unit'];
    const rows = [headers.join(',')];

    exportData.dataPoints.forEach(point => {
      const pidDef = PID_DEFINITIONS[point.pid];
      const row = [
        point.timestamp,
        point.pid,
        pidDef?.name || `PID ${point.pid}`,
        point.value,
        pidDef?.unit || ''
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Generate unique session ID
   * @returns {string} Unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default session summary
   * @returns {Object} Default summary object
   */
  getDefaultSessionSummary() {
    return {
      totalDataPoints: 0,
      uniquePIDs: 0,
      mostFrequentPID: null,
      dataRate: 0,
      pidSummary: {}
    };
  }

  /**
   * Get empty statistics object
   * @returns {Object} Empty statistics
   */
  getEmptyStatistics() {
    return {
      totalSessions: 0,
      totalDuration: 0,
      totalRecords: 0,
      avgDuration: 0,
      avgRecords: 0,
      longestSession: 0,
      shortestSession: 0,
      mostRecentSession: null,
      oldestSession: null
    };
  }

  /**
   * Load sessions from storage
   */
  async loadSessions() {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        this.sessions = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      this.sessions = [];
    }
  }

  /**
   * Save sessions to storage
   */
  async saveSessions() {
    try {
      // Keep only the most recent sessions to prevent storage bloat
      const sessionsToSave = this.sessions.slice(0, this.maxSessions);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(sessionsToSave));
      this.sessions = sessionsToSave;
    } catch (error) {
      console.error('Failed to save sessions:', error);
      throw error;
    }
  }

  /**
   * Load current session from storage
   */
  async loadCurrentSession() {
    try {
      const data = await AsyncStorage.getItem(this.currentSessionKey);
      if (data) {
        this.currentSession = JSON.parse(data);
        this.isRecording = this.currentSession.status === 'active';
      }
    } catch (error) {
      console.error('Failed to load current session:', error);
    }
  }

  /**
   * Save current session to storage
   */
  async saveCurrentSession() {
    try {
      if (this.currentSession) {
        await AsyncStorage.setItem(this.currentSessionKey, JSON.stringify(this.currentSession));
      }
    } catch (error) {
      console.error('Failed to save current session:', error);
      throw error;
    }
  }

  /**
   * Clear all history data (for testing/reset)
   */
  async clearAllData() {
    this.sessions = [];
    this.currentSession = null;
    this.isRecording = false;
    await AsyncStorage.removeItem(this.storageKey);
    await AsyncStorage.removeItem(this.currentSessionKey);
    await DatabaseService.clearHistoryData();
  }
}

// Export singleton instance
export const HistoryData = new HistoryDataService();
export default HistoryData;