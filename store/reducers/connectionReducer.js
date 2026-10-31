// src/store/reducers/connectionReducer.js

const initialState = {
  // Connection Status
  isConnected: false,
  isConnecting: false,
  isScanning: false,
  connectionType: null, // 'bluetooth' | 'wifi' | null
  mode: null, // 'demo' | 'bluetooth' | 'wifi' | null
  
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

    default:
      return state;
  }
};

export default connectionReducer;