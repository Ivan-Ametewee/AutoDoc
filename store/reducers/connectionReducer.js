// src/store/reducers/connectionReducer.js

const initialState = {
  // Connection Status
  isConnected: false,
  isConnecting: false,
  isScanning: false,
  connectionType: null, // 'bluetooth' | 'wifi' | null
  
  // Device Information
  connectedDevice: null,
  availableDevices: [],
  lastConnectedDevice: null,
  
  // Connection Health
  connectionStrength: 0,
  lastDataReceived: null,
  connectionErrors: [],
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  
  // Protocol Information
  supportedProtocols: [],
  activeProtocol: null,
  protocolVersion: null,
  
  // Error Handling
  error: null,
  lastError: null,
  errorCount: 0,
  
  // Settings
  autoReconnect: true,
  connectionTimeout: 10000,
  scanDuration: 30000,
};

const connectionReducer = (state = initialState, action) => {
  switch (action.type) {
    // Scanning Actions
    case 'START_DEVICE_SCAN':
      return {
        ...state,
        isScanning: true,
        availableDevices: [],
        error: null,
      };

    case 'STOP_DEVICE_SCAN':
      return {
        ...state,
        isScanning: false,
      };

    case 'DEVICE_FOUND':
      return {
        ...state,
        availableDevices: [
          ...state.availableDevices.filter(device => device.id !== action.payload.id),
          action.payload,
        ],
      };

    case 'CLEAR_AVAILABLE_DEVICES':
      return {
        ...state,
        availableDevices: [],
      };

    // Connection Actions
    case 'START_CONNECTION':
      return {
        ...state,
        isConnecting: true,
        isConnected: false,
        error: null,
        reconnectAttempts: 0,
      };

    case 'CONNECTION_SUCCESS':
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        connectedDevice: action.payload.device,
        lastConnectedDevice: action.payload.device,
        connectionType: action.payload.connectionType,
        supportedProtocols: action.payload.supportedProtocols || [],
        activeProtocol: action.payload.activeProtocol || null,
        protocolVersion: action.payload.protocolVersion || null,
        connectionStrength: 100,
        lastDataReceived: new Date().toISOString(),
        error: null,
        errorCount: 0,
        reconnectAttempts: 0,
      };

    case 'CONNECTION_FAILED':
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        connectedDevice: null,
        connectionType: null,
        error: action.payload.error,
        lastError: action.payload.error,
        errorCount: state.errorCount + 1,
        connectionErrors: [
          ...state.connectionErrors.slice(-4), // Keep last 5 errors
          {
            timestamp: new Date().toISOString(),
            error: action.payload.error,
            device: action.payload.device,
          },
        ],
      };

    case 'DISCONNECT_DEVICE':
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        connectedDevice: null,
        connectionType: null,
        connectionStrength: 0,
        activeProtocol: null,
        error: null,
      };

    // Reconnection Logic
    case 'ATTEMPT_RECONNECT':
      return {
        ...state,
        isConnecting: true,
        reconnectAttempts: state.reconnectAttempts + 1,
        error: null,
      };

    case 'RECONNECT_FAILED':
      return {
        ...state,
        isConnecting: false,
        error: action.payload.error,
        lastError: action.payload.error,
      };

    case 'MAX_RECONNECT_ATTEMPTS_REACHED':
      return {
        ...state,
        isConnecting: false,
        error: 'Maximum reconnection attempts reached',
        reconnectAttempts: 0,
      };

    // Connection Health
    case 'UPDATE_CONNECTION_STRENGTH':
      return {
        ...state,
        connectionStrength: action.payload.strength,
        lastDataReceived: new Date().toISOString(),
      };

    case 'DATA_RECEIVED':
      return {
        ...state,
        lastDataReceived: new Date().toISOString(),
        connectionStrength: Math.min(100, state.connectionStrength + 1),
      };

    case 'CONNECTION_TIMEOUT':
      return {
        ...state,
        connectionStrength: Math.max(0, state.connectionStrength - 10),
        error: 'Connection timeout - weak signal',
      };

    // Protocol Management
    case 'SET_ACTIVE_PROTOCOL':
      return {
        ...state,
        activeProtocol: action.payload.protocol,
        protocolVersion: action.payload.version,
      };

    case 'UPDATE_SUPPORTED_PROTOCOLS':
      return {
        ...state,
        supportedProtocols: action.payload.protocols,
      };

    // Settings
    case 'UPDATE_CONNECTION_SETTINGS':
      return {
        ...state,
        autoReconnect: action.payload.autoReconnect ?? state.autoReconnect,
        connectionTimeout: action.payload.connectionTimeout ?? state.connectionTimeout,
        scanDuration: action.payload.scanDuration ?? state.scanDuration,
        maxReconnectAttempts: action.payload.maxReconnectAttempts ?? state.maxReconnectAttempts,
      };

    // Error Management
    case 'CLEAR_CONNECTION_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'CLEAR_CONNECTION_ERRORS':
      return {
        ...state,
        error: null,
        lastError: null,
        connectionErrors: [],
        errorCount: 0,
      };

    // Reset
    case 'RESET_CONNECTION_STATE':
      return {
        ...initialState,
        lastConnectedDevice: state.lastConnectedDevice,
        autoReconnect: state.autoReconnect,
        connectionTimeout: state.connectionTimeout,
        scanDuration: state.scanDuration,
        maxReconnectAttempts: state.maxReconnectAttempts,
      };

    default:
      return state;
  }
};

export default connectionReducer;