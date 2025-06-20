// store/actions/dataActions.js
import OBDIIService from '../../services/obdii/OBDIIService';
import DatabaseService from '../../services/database/DatabaseService';
import SimulationService from '../../services/simulation/SimulationService';
import AlertService from '../../services/alerts/AlertService';

// Action Types
export const DATA_TYPES = {
  // Real-time Data
  UPDATE_REAL_TIME_DATA: 'UPDATE_REAL_TIME_DATA',
  CLEAR_REAL_TIME_DATA: 'CLEAR_REAL_TIME_DATA',
  SET_DATA_STREAMING: 'SET_DATA_STREAMING',
  
  // PID Management
  ADD_MONITORED_PID: 'ADD_MONITORED_PID',
  REMOVE_MONITORED_PID: 'REMOVE_MONITORED_PID',
  UPDATE_PID_CONFIG: 'UPDATE_PID_CONFIG',
  SET_MONITORED_PIDS: 'SET_MONITORED_PIDS',
  
  // Diagnostic Trouble Codes
  UPDATE_DTC_CODES: 'UPDATE_DTC_CODES',
  CLEAR_DTC_CODES: 'CLEAR_DTC_CODES',
  ADD_DTC_CODE: 'ADD_DTC_CODE',
  REMOVE_DTC_CODE: 'REMOVE_DTC_CODE',
  
  // Historical Data
  ADD_HISTORICAL_DATA: 'ADD_HISTORICAL_DATA',
  LOAD_HISTORICAL_DATA: 'LOAD_HISTORICAL_DATA',
  CLEAR_HISTORICAL_DATA: 'CLEAR_HISTORICAL_DATA',
  SET_HISTORICAL_FILTER: 'SET_HISTORICAL_FILTER',
  
  // Data Recording
  START_DATA_RECORDING: 'START_DATA_RECORDING',
  STOP_DATA_RECORDING: 'STOP_DATA_RECORDING',
  SET_RECORDING_STATUS: 'SET_RECORDING_STATUS',
  
  // Vehicle Information
  UPDATE_VEHICLE_INFO: 'UPDATE_VEHICLE_INFO',
  SET_VEHICLE_PROTOCOL: 'SET_VEHICLE_PROTOCOL',
  
  // Data Processing
  SET_DATA_PROCESSING: 'SET_DATA_PROCESSING',
  DATA_PROCESSING_ERROR: 'DATA_PROCESSING_ERROR',
  
  // Alerts and Thresholds
  TRIGGER_ALERT: 'TRIGGER_ALERT',
  CLEAR_ALERT: 'CLEAR_ALERT',
  UPDATE_ALERT_STATUS: 'UPDATE_ALERT_STATUS',
};

// Real-time Data Actions
export const updateRealTimeData = (pidData) => (dispatch, getState) => {
  const { settings } = getState();
  
  // Process and format the data
  const processedData = processRealTimeData(pidData);
  
  dispatch({
    type: DATA_TYPES.UPDATE_REAL_TIME_DATA,
    payload: { data: processedData, timestamp: Date.now() }
  });
  
  // Check for alerts if enabled
  if (settings.alertsEnabled) {
    dispatch(checkDataAlerts(processedData));
  }
  
  // Save to history if recording is active
  const { data } = getState();
  if (data.isRecording) {
    dispatch(saveDataPoint(processedData));
  }
};

export const startDataStreaming = (pids = []) => async (dispatch, getState) => {
  const { connection } = getState();
  
  dispatch({ type: DATA_TYPES.SET_DATA_STREAMING, payload: { streaming: true } });
  
  try {
    let dataService;
    
    if (connection.simulationMode) {
      dataService = SimulationService;
    } else {
      dataService = OBDIIService;
    }
    
    // Start streaming data for specified PIDs
    const streamingPids = pids.length > 0 ? pids : getState().data.monitoredPids;
    
    const streamInterval = setInterval(async () => {
      try {
        const pidData = await dataService.requestMultiplePIDs(streamingPids);
        dispatch(updateRealTimeData(pidData));
      } catch (error) {
        console.error('Data streaming error:', error);
        dispatch({
          type: DATA_TYPES.DATA_PROCESSING_ERROR,
          payload: { error: error.message }
        });
      }
    }, getState().settings.dataRefreshRate || 1000);
    
    return streamInterval;
  } catch (error) {
    dispatch({ type: DATA_TYPES.SET_DATA_STREAMING, payload: { streaming: false } });
    throw error;
  }
};

export const stopDataStreaming = (streamInterval) => (dispatch) => {
  if (streamInterval) {
    clearInterval(streamInterval);
  }
  
  dispatch({ type: DATA_TYPES.SET_DATA_STREAMING, payload: { streaming: false } });
};

export const clearRealTimeData = () => ({
  type: DATA_TYPES.CLEAR_REAL_TIME_DATA
});

// PID Management Actions
export const addMonitoredPID = (pid) => ({
  type: DATA_TYPES.ADD_MONITORED_PID,
  payload: { pid }
});

export const removeMonitoredPID = (pidCode) => ({
  type: DATA_TYPES.REMOVE_MONITORED_PID,
  payload: { pidCode }
});

export const updatePIDConfig = (pidCode, config) => ({
  type: DATA_TYPES.UPDATE_PID_CONFIG,
  payload: { pidCode, config }
});

export const setMonitoredPIDs = (pids) => ({
  type: DATA_TYPES.SET_MONITORED_PIDS,
  payload: { pids }
});

// DTC Actions
export const readDTCCodes = () => async (dispatch, getState) => {
  const { connection } = getState();
  
  try {
    let dtcCodes;
    
    if (connection.simulationMode) {
      dtcCodes = await SimulationService.getDTCCodes();
    } else {
      dtcCodes = await OBDIIService.readDTCCodes();
    }
    
    dispatch({
      type: DATA_TYPES.UPDATE_DTC_CODES,
      payload: { dtcCodes, timestamp: Date.now() }
    });
    
    return dtcCodes;
  } catch (error) {
    dispatch({
      type: DATA_TYPES.DATA_PROCESSING_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const clearDTCCodes = () => async (dispatch, getState) => {
  const { connection } = getState();
  
  try {
    if (!connection.simulationMode) {
      await OBDIIService.clearDTCCodes();
    }
    
    dispatch({ type: DATA_TYPES.CLEAR_DTC_CODES });
  } catch (error) {
    dispatch({
      type: DATA_TYPES.DATA_PROCESSING_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const addDTCCode = (dtcCode) => ({
  type: DATA_TYPES.ADD_DTC_CODE,
  payload: { dtcCode }
});

export const removeDTCCode = (codeId) => ({
  type: DATA_TYPES.REMOVE_DTC_CODE,
  payload: { codeId }
});

// Historical Data Actions
export const loadHistoricalData = (filter = {}) => async (dispatch) => {
  try {
    const historicalData = await DatabaseService.getHistoricalData(filter);
    
    dispatch({
      type: DATA_TYPES.LOAD_HISTORICAL_DATA,
      payload: { data: historicalData, filter }
    });
    
    return historicalData;
  } catch (error) {
    dispatch({
      type: DATA_TYPES.DATA_PROCESSING_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const saveDataPoint = (dataPoint) => async (dispatch) => {
  try {
    await DatabaseService.saveDataPoint(dataPoint);
    
    dispatch({
      type: DATA_TYPES.ADD_HISTORICAL_DATA,
      payload: { dataPoint }
    });
  } catch (error) {
    console.error('Error saving data point:', error);
  }
};

export const clearHistoricalData = (olderThan = null) => async (dispatch) => {
  try {
    await DatabaseService.clearHistoricalData(olderThan);
    
    dispatch({
      type: DATA_TYPES.CLEAR_HISTORICAL_DATA,
      payload: { olderThan }
    });
  } catch (error) {
    dispatch({
      type: DATA_TYPES.DATA_PROCESSING_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const setHistoricalFilter = (filter) => ({
  type: DATA_TYPES.SET_HISTORICAL_FILTER,
  payload: { filter }
});

// Data Recording Actions
export const startDataRecording = (sessionName = null) => async (dispatch) => {
  const sessionId = await DatabaseService.createRecordingSession(sessionName);
  
  dispatch({
    type: DATA_TYPES.START_DATA_RECORDING,
    payload: { sessionId, sessionName, startTime: Date.now() }
  });
  
  return sessionId;
};

export const stopDataRecording = () => async (dispatch, getState) => {
  const { data } = getState();
  
  if (data.currentRecordingSession) {
    await DatabaseService.endRecordingSession(data.currentRecordingSession);
  }
  
  dispatch({
    type: DATA_TYPES.STOP_DATA_RECORDING,
    payload: { endTime: Date.now() }
  });
};

export const setRecordingStatus = (status) => ({
  type: DATA_TYPES.SET_RECORDING_STATUS,
  payload: { status }
});

// Vehicle Information Actions
export const readVehicleInfo = () => async (dispatch, getState) => {
  const { connection } = getState();
  
  try {
    let vehicleInfo;
    
    if (connection.simulationMode) {
      vehicleInfo = await SimulationService.getVehicleInfo();
    } else {
      vehicleInfo = await OBDIIService.getVehicleInfo();
    }
    
    dispatch({
      type: DATA_TYPES.UPDATE_VEHICLE_INFO,
      payload: { vehicleInfo }
    });
    
    return vehicleInfo;
  } catch (error) {
    dispatch({
      type: DATA_TYPES.DATA_PROCESSING_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const setVehicleProtocol = (protocol) => ({
  type: DATA_TYPES.SET_VEHICLE_PROTOCOL,
  payload: { protocol }
});

// Alert Actions
export const checkDataAlerts = (data) => (dispatch, getState) => {
  const { settings } = getState();
  
  try {
    const alerts = AlertService.checkThresholds(data, settings.alertThresholds);
    
    alerts.forEach(alert => {
      dispatch({
        type: DATA_TYPES.TRIGGER_ALERT,
        payload: { alert }
      });
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
  }
};

export const clearAlert = (alertId) => ({
  type: DATA_TYPES.CLEAR_ALERT,
  payload: { alertId }
});

export const updateAlertStatus = (alertId, status) => ({
  type: DATA_TYPES.UPDATE_ALERT_STATUS,
  payload: { alertId, status }
});

// Utility Functions
const processRealTimeData = (pidData) => {
  const processedData = {};
  
  Object.keys(pidData).forEach(pidCode => {
    const rawValue = pidData[pidCode];
    
    // Apply any necessary conversions or calculations
    processedData[pidCode] = {
      value: rawValue,
      timestamp: Date.now(),
      formatted: formatPIDValue(pidCode, rawValue)
    };
  });
  
  return processedData;
};

const formatPIDValue = (pidCode, value) => {
  // This would use your formatters utility
  // For now, just return the value
  return value;
};

// Batch Data Operations
export const requestDataBatch = (pids) => async (dispatch, getState) => {
  const { connection } = getState();
  
  dispatch({ type: DATA_TYPES.SET_DATA_PROCESSING, payload: { processing: true } });
  
  try {
    let batchData;
    
    if (connection.simulationMode) {
      batchData = await SimulationService.requestMultiplePIDs(pids);
    } else {
      batchData = await OBDIIService.requestMultiplePIDs(pids);
    }
    
    dispatch(updateRealTimeData(batchData));
    
    return batchData;
  } catch (error) {
    dispatch({
      type: DATA_TYPES.DATA_PROCESSING_ERROR,
      payload: { error: error.message }
    });
    throw error;
  } finally {
    dispatch({ type: DATA_TYPES.SET_DATA_PROCESSING, payload: { processing: false } });
  }
};

// Export Data Actions
export const exportDataSession = (sessionId, format = 'csv') => async (dispatch) => {
  try {
    const ExportService = require('../../services/export/ExportService').default;
    const exportedData = await ExportService.exportSession(sessionId, format);
    
    return exportedData;
  } catch (error) {
    dispatch({
      type: DATA_TYPES.DATA_PROCESSING_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};