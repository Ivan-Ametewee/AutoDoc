// store/actions/connectionActions.js
import BluetoothService from '../../services/bluetooth/BluetoothService';
import OBDIIService from '../../services/obdii/OBDIIService';
import WiFiService from '../../services/wifi/WiFiService';

// Action Types
export const CONNECTION_TYPES = {
  // Scanning
  START_SCANNING: 'START_SCANNING',
  STOP_SCANNING: 'STOP_SCANNING',
  SCAN_SUCCESS: 'SCAN_SUCCESS',
  SCAN_ERROR: 'SCAN_ERROR',

  // Device Management
  ADD_DEVICE: 'ADD_DEVICE',
  REMOVE_DEVICE: 'REMOVE_DEVICE',
  UPDATE_DEVICE: 'UPDATE_DEVICE',
  CLEAR_DEVICES: 'CLEAR_DEVICES',

  // Connection
  SET_CONNECTION_MODE: 'SET_CONNECTION_MODE',
  CONNECT_START: 'CONNECT_START',
  CONNECT_SUCCESS: 'CONNECT_SUCCESS',
  CONNECT_FAILED: 'CONNECT_FAILED',
  DISCONNECT: 'DISCONNECT',

  // OBDII Communication
  OBDII_CONNECTED: 'OBDII_CONNECTED',
  OBDII_DISCONNECTED: 'OBDII_DISCONNECTED',
  OBDII_ERROR: 'OBDII_ERROR',

  // Connection Status
  SET_CONNECTION_TYPE: 'SET_CONNECTION_TYPE',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_SIGNAL_STRENGTH: 'SET_SIGNAL_STRENGTH',

  // Simulation Mode
  TOGGLE_SIMULATION_MODE: 'TOGGLE_SIMULATION_MODE',
  SET_SIMULATION_MODE: 'SET_SIMULATION_MODE',
};

// Singleton instances
const bluetoothService = new BluetoothService();
const wifiService = new WiFiService();
const obdiiService = new OBDIIService();

// Action Creators

// Scanning Actions
export const startScanning = (connectionType = 'bluetooth') => async (dispatch) => {
  dispatch({ type: CONNECTION_TYPES.START_SCANNING, payload: { connectionType } });

  try {
    let devices = [];

    if (connectionType === 'bluetooth') {
      devices = await bluetoothService.startScan();
    } else if (connectionType === 'wifi') {
      devices = await wifiService.startScan();
    }

    dispatch({
      type: CONNECTION_TYPES.SCAN_SUCCESS,
      payload: { devices, connectionType }
    });

    return devices;
  } catch (error) {
    console.error('Scan error:', error);
    dispatch({
      type: CONNECTION_TYPES.SCAN_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const stopScanning = (connectionType = 'bluetooth') => async (dispatch) => {
  try {
    if (connectionType === 'bluetooth') {
      await bluetoothService.stopScan();
    } else if (connectionType === 'wifi') {
      await wifiService.stopScan();
    }

    dispatch({ type: CONNECTION_TYPES.STOP_SCANNING, payload: { connectionType } });
  } catch (error) {
    console.error('Error stopping scan:', error);
  }
};

// Device Management Actions
export const addDevice = (device) => ({
  type: CONNECTION_TYPES.ADD_DEVICE,
  payload: { device }
});

export const removeDevice = (deviceId) => ({
  type: CONNECTION_TYPES.REMOVE_DEVICE,
  payload: { deviceId }
});

export const updateDevice = (deviceId, updates) => ({
  type: CONNECTION_TYPES.UPDATE_DEVICE,
  payload: { deviceId, updates }
});

export const clearDevices = () => ({
  type: CONNECTION_TYPES.CLEAR_DEVICES
});

// Connection Actions
export const connectToDevice = (device) => async (dispatch) => {
  dispatch({ type: CONNECTION_TYPES.CONNECT_START, payload: { device } });

  try {
    const connectionType = device.type || 'bluetooth';
    let connectedDevice;

    if (connectionType === 'bluetooth') {
      connectedDevice = await bluetoothService.connect(device);
    } else if (connectionType === 'wifi') {
      connectedDevice = await wifiService.connect(device);
    }

    await obdiiService.initialize(connectedDevice, connectionType);

    dispatch({
      type: CONNECTION_TYPES.CONNECT_SUCCESS,
      payload: { device: connectedDevice }
    });

    return connectedDevice;
  } catch (error) {
    console.error('Connection error:', error);
    dispatch({
      type: CONNECTION_TYPES.CONNECT_FAILED,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const disconnectDevice = () => async (dispatch) => {
  try {
    await bluetoothService.disconnect();
    await obdiiService.cleanup();

    dispatch({ type: CONNECTION_TYPES.DISCONNECT });
  } catch (error) {
    console.error('Disconnect error:', error);
    // Still dispatch disconnect even if there's an error
    dispatch({ type: CONNECTION_TYPES.DISCONNECT });
    throw error;
  }
};

// OBDII Actions
export const initializeOBDII = (connection) => async (dispatch) => {
  try {
    const obdiiConnection = await OBDIIService.initialize(connection);

    dispatch({
      type: CONNECTION_TYPES.OBDII_CONNECTED,
      payload: { obdiiConnection }
    });

    // Test connection with a basic PID
    await OBDIIService.sendCommand('0100'); // Supported PIDs

    return obdiiConnection;
  } catch (error) {
    dispatch({
      type: CONNECTION_TYPES.OBDII_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const testOBDIIConnection = () => async (dispatch) => {
  try {
    const response = await OBDIIService.sendCommand('0100');
    return response;
  } catch (error) {
    dispatch({
      type: CONNECTION_TYPES.OBDII_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

// Status Actions
export const setConnectionType = (connectionType) => ({
  type: CONNECTION_TYPES.SET_CONNECTION_TYPE,
  payload: { connectionType }
});

export const setConnectionStatus = (status) => ({
  type: CONNECTION_TYPES.SET_CONNECTION_STATUS,
  payload: { status }
});

export const setConnectionMode = (mode, device = null, connectionType = setConnectionMode | null) => ({
  type: CONNECTION_TYPES.SET_CONNECTION_MODE,
  payload: { mode, device, connectionType },
});

export const setSignalStrength = (strength) => ({
  type: CONNECTION_TYPES.SET_SIGNAL_STRENGTH,
  payload: { strength }
});

// Simulation Actions
export const toggleSimulationMode = () => ({
  type: CONNECTION_TYPES.TOGGLE_SIMULATION_MODE
});

export const setSimulationMode = (enabled) => ({
  type: CONNECTION_TYPES.SET_SIMULATION_MODE,
  payload: { enabled }
});

// Utility Actions
export const refreshDeviceList = (connectionType = 'bluetooth') => async (dispatch) => {
  await dispatch(stopScanning(connectionType));
  await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
  return dispatch(startScanning(connectionType));
};

export const reconnectToLastDevice = () => async (dispatch, getState) => {
  const { connection } = getState();

  if (connection.lastConnectedDevice) {
    try {
      await dispatch(connectToDevice(connection.lastConnectedDevice));
    } catch (error) {
      console.error('Failed to reconnect to last device:', error);
      throw error;
    }
  } else {
    throw new Error('No previous device to reconnect to');
  }
};

// Connection monitoring
export const startConnectionMonitoring = () => async (dispatch) => {
  // Monitor connection status every 5 seconds
  const monitorInterval = setInterval(async () => {
    try {
      const isConnected = await OBDIIService.isConnected();

      if (!isConnected) {
        dispatch({ type: CONNECTION_TYPES.OBDII_DISCONNECTED });
        clearInterval(monitorInterval);
      }
    } catch (error) {
      console.error('Connection monitoring error:', error);
    }
  }, 5000);

  return monitorInterval;
};

export const stopConnectionMonitoring = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
  }
};

export const enableDemoMode = () => async (dispatch) => {
  try {
    await obdiiService.enableSimulation();
    dispatch({ type: CONNECTION_TYPES.SET_SIMULATION_MODE, payload: { enabled: true } });
  } catch (error) {
    console.error('Demo mode error:', error);
    throw error;
  }
};

export const checkBluetoothStatus = () => async (dispatch) => {
  try {
    const status = await bluetoothService.checkStatus();
    dispatch({
      type: CONNECTION_TYPES.SET_CONNECTION_STATUS,
      payload: {
        bluetoothEnabled: status.enabled,
        hasPermissions: status.hasPermissions
      }
    });
    return status;
  } catch (error) {
    console.error('Bluetooth status check error:', error);
    throw error;
  }
};

export const requestBluetoothPermissions = () => async (dispatch) => {
  try {
    const granted = await bluetoothService.requestPermissions();
    dispatch({
      type: CONNECTION_TYPES.SET_CONNECTION_STATUS,
      payload: { hasPermissions: granted }
    });
    return granted;
  } catch (error) {
    console.error('Permission request error:', error);
    throw error;
  }
};