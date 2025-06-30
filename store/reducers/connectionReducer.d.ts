export interface ConnectionDevice {
    id: string;
    name?: string;
    address?: string;
    bonded?: boolean;
    rssi?: number;
    type?: string;
}

export interface ConnectionState {
    isConnected: boolean;
    isConnecting: boolean;
    isScanning: boolean;
    connectionType: string | null;
    mode: string | null;
    connectedDevice: ConnectionDevice | null;
    availableDevices: ConnectionDevice[];
    lastConnectedDevice: ConnectionDevice | null;
    connectionStrength: number;
    lastDataReceived: string | null;
    connectionErrors: any[];
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    supportedProtocols: any[];
    activeProtocol: string | null;
    protocolVersion: string | null;
    error: any;
    lastError: any;
    errorCount: number;
    autoReconnect: boolean;
    connectionTimeout: number;
    scanDuration: number;
}
