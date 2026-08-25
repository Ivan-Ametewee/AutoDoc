import { EventEmitter } from 'events';
import { PermissionsAndroid, Platform } from 'react-native';
import TcpSocket from 'react-native-tcp-socket'; // Changed for TypeScript compatibility
import WifiManager from 'react-native-wifi-reborn';
import { enhanceOBDNetwork, filterOBDWiFiNetworks } from '../../utils/deviceFilters';

// --- Type Definitions ---
interface OBDServerConfig {
  host: string;
  port: number;
  timeout: number;
}

interface Network {
  SSID: string;
  BSSID: string;
  capabilities: string;
  level: number;
  frequency: number;
  isOBD?: boolean; // Optional property for OBD networks
  signal?: 'excellent' | 'good' | 'fair' | 'weak' | 'very_weak';
  security?: 'WPA3' | 'WPA2' | 'WPA' | 'WEP' | 'OPEN';
}

interface ConnectionInfo {
  ssid: string | null;
  bssid: string | null;
  ipAddress: string | null;
  subnetMask: string | null;
  gateway: string | null;
  dnsServers: string[];
  rssi: number;
  frequency: number;
  linkSpeed: number;
  hiddenSSID: boolean;
  isConnected: boolean;
  isConnectionSuspended: boolean;
  // Add other properties if known from WifiManager.connectionStatus()
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected';
type NetworkState = 'idle' | 'scanning' | 'connecting';
type ServerState = 'disconnected' | 'connecting' | 'connected';

// --- WiFiService Class ---
class WiFiService extends EventEmitter {
  private socket: any | null;
  private isConnected: boolean;
  private isConnecting: boolean;
  private currentNetwork: { ssid: string; connected: boolean } | null;
  private obdServerConfig: OBDServerConfig;
  private readBuffer: string;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private heartbeatInterval: any | null; // Use any for cross-platform compatibility

  constructor() {
    super();
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.currentNetwork = null;
    this.obdServerConfig = {
      host: '192.168.0.10',
      port: 35000,
      timeout: 30000
    };
    this.readBuffer = '';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.heartbeatInterval = null;

    this.setupNetworkListeners();
  }

  private setupNetworkListeners(): void {
    // Android-specific network monitoring could be added here
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // Only request permissions that are available in PermissionsAndroid.PERMISSIONS
        const permissionsToRequest: string[] = [];

        // Location permissions (required for WiFi scanning on Android)
        const fineLocation = PermissionsAndroid.PERMISSIONS?.ACCESS_FINE_LOCATION;
        if (fineLocation && typeof fineLocation === 'string') {
          permissionsToRequest.push(fineLocation);
        }

        // Coarse location for older Android versions
        if (Platform.Version < 29) {
          const coarseLocation = PermissionsAndroid.PERMISSIONS?.ACCESS_COARSE_LOCATION;
          if (coarseLocation && typeof coarseLocation === 'string') {
            permissionsToRequest.push(coarseLocation);
          }
        }

        // For Android 13+ (API 33+), add nearby WiFi devices permission if available
        if (Platform.Version >= 33) {
          const nearbyWifiDevices = PermissionsAndroid.PERMISSIONS?.NEARBY_WIFI_DEVICES;
          if (nearbyWifiDevices && typeof nearbyWifiDevices === 'string') {
            permissionsToRequest.push(nearbyWifiDevices);
          }
        }





        if (!PermissionsAndroid || !PermissionsAndroid.requestMultiple) {

          return true;
        }

        if (permissionsToRequest.length === 0) {

          return true;
        }

        const granted = await PermissionsAndroid.requestMultiple(
          permissionsToRequest as any // Cast to avoid type issues
        );

        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );




        if (!allGranted) {
          Object.entries(granted).forEach(([permission, result]) => {
            if (result !== PermissionsAndroid.RESULTS.GRANTED) {

            }
          });

        }

        return true;
      } catch (error: any) { // Use 'any' for caught errors if not explicitly typed



        this.emit('error', error);
        return true;
      }
    }
    return true;
  }

  async isWiFiEnabled(): Promise<boolean> {
    try {
      const enabled: boolean = await WifiManager.isEnabled();

      return enabled;
    } catch (error: any) {

      this.emit('error', error);
      return false;
    }
  }

  async enableWiFi(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        WifiManager.setEnabled(true);
        return true;
      }
      return false;
    } catch (error: any) {

      this.emit('error', error);
      return false;
    }
  }

  async scanNetworks(): Promise<{ all: Network[]; obd: Network[] }> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('WiFi permissions not granted');
      }

      const isEnabled = await this.isWiFiEnabled();
      if (!isEnabled) {
        const enabled = await this.enableWiFi();
        if (!enabled) {
          throw new Error('WiFi is not enabled');
        }
      }


      this.emit('scanStarted');

      const networks: Network[] = await WifiManager.loadWifiList();

      const obdNetworks = filterOBDWiFiNetworks(networks).map(enhanceOBDNetwork);


      this.emit('scanCompleted', { all: networks, obd: obdNetworks });

      return { all: networks, obd: obdNetworks };

    } catch (error: any) {

      this.emit('error', error);
      throw error;
    }
  }

  // Moved OBD network detection logic to utils/deviceFilters.ts for consistency

  async connectToNetwork(ssid: string, password = ''): Promise<boolean> {
    try {
      if (this.isConnecting) {

        return false;
      }

      this.isConnecting = true;
      this.emit('connecting', { ssid });



      await WifiManager.connectToProtectedSSID(ssid, password, false, false);

      // Poll to confirm the connection is stable and the SSID matches.
      const success = await this.pollForConnection(ssid);

      if (success) {

        this.currentNetwork = { ssid, connected: true };
        this.emit('networkConnected', this.currentNetwork);
        return true;
      } else {
        throw new Error(`Connection to ${ssid} timed out or failed to confirm.`);
      }

      // const currentSSID: string | null = await WifiManager.getCurrentWifiSSID();
      // if (currentSSID) {
      //   console.log('Connected to network:', currentSSID);
      //   this.currentNetwork = { ssid: currentSSID, connected: true };
      //   this.emit('networkConnected', this.currentNetwork);
      //   return true;
      // } else {
      //   throw new Error('Failed to get current SSID after connection');
      // }

    } catch (error: any) {

      this.emit('error', { message: `Failed to connect to ${ssid}`, details: error });
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  // --- NEW HELPER METHOD ---
  /**
   * Polls the device's current SSID to confirm a successful connection.
   * @param {string} expectedSSID The SSID we expect to be connected to.
   * @returns {Promise<boolean>} A promise that resolves to true if connected, false if timed out.
   */
  private async pollForConnection(expectedSSID: string): Promise<boolean> {
    const timeout = 20000; // 20-second timeout
    const interval = 1000; // Check every 1 second
    const startTime = Date.now();



    while (Date.now() - startTime < timeout) {
      try {
        const currentSSID = await WifiManager.getCurrentWifiSSID(); //
        if (currentSSID === expectedSSID) {

          return true;
        }
      } catch (error) {
        // Silently ignore errors during polling (e.g., if WiFi is temporarily unavailable)
      }
      // Wait for the next interval
      await new Promise(resolve => setTimeout(resolve, interval));
    }


    return false;
  }

  async disconnectFromNetwork(): Promise<boolean> {
    try {
      if (this.currentNetwork) {


        if (this.socket) {
          await this.closeSocket();
        }

        await WifiManager.disconnect();

        const network = this.currentNetwork;
        this.currentNetwork = null;
        this.emit('networkDisconnected', network);

        return true;
      }
      return true;
    } catch (error: any) {

      this.emit('error', error);
      return false;
    }
  }

  async connectToOBDServer(host: string | null = null, port: number | null = null): Promise<boolean> {
    try {
      if (this.isConnected) {

        return true;
      }

      const serverHost = host || this.obdServerConfig.host;
      const serverPort = port || this.obdServerConfig.port;


      this.emit('serverConnecting', { host: serverHost, port: serverPort });

      return new Promise((resolve, reject) => {
        const socket = TcpSocket.createConnection({
          port: serverPort,
          host: serverHost
        }, () => {
          // Connection callback

          this.socket = socket;
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('serverConnected', { host: serverHost, port: serverPort });
          resolve(true);
        });

        socket.setTimeout(this.obdServerConfig.timeout);

        socket.on('data', (data: string | { toString(): string }) => {
          const strData = typeof data === 'string' ? data : data.toString();
          this.handleIncomingData(strData);
        });

        socket.on('error', (error: Error) => { // error is an Error object

          this.emit('error', error);

          if (!this.isConnected) {
            reject(error);
          } else {
            this.handleDisconnection();
          }
        });

        socket.on('close', () => {

          this.handleDisconnection();
        });

        socket.on('timeout', () => {

          socket.destroy();
          reject(new Error('Connection timeout'));
        });
      });

    } catch (error: any) {

      this.emit('error', error);
      return false;
    }
  }

  async closeSocket(): Promise<void> {
    try {
      if (this.socket) {
        this.stopHeartbeat();
        this.socket.destroy();
        this.socket = null;
        this.isConnected = false;

      }
    } catch (error: any) {

    }
  }

  async sendData(data: string): Promise<boolean> {
    try {
      if (!this.isConnected || !this.socket) {
        throw new Error('Not connected to OBDII server');
      }

      // Ensure data is properly formatted for ELM327
      let formattedData = data.trim();

      // Add carriage return if not present (ELM327 expects \r termination)
      if (!formattedData.endsWith('\r') && !formattedData.endsWith('\r\n')) {
        formattedData += '\r';
      }



      return new Promise((resolve, reject) => {
        this.socket?.write(formattedData, 'utf8', (error?: Error) => { // error is optional
          if (error) {

            reject(error);
          } else {
            this.emit('dataSent', formattedData);
            resolve(true);
          }
        });
      });

    } catch (error: any) {

      this.emit('error', error);
      return false;
    }
  }

  private handleIncomingData(data: string): void {


    this.readBuffer += data;

    // Enhanced parsing to handle concatenated responses and malformed data
    this.parseAndEmitResponses();
  }

  /**
   * Enhanced response parsing to handle ELM327 concatenated responses
   */
  private parseAndEmitResponses(): void {
    let processedData = false;

    // First, try to split by proper ELM327 terminators
    const messages = this.readBuffer.split(/[\r\n]+/);

    if (messages.length > 1) {
      // Keep the last incomplete message in buffer
      this.readBuffer = messages.pop() || '';

      messages.forEach(message => {
        if (message.trim()) {
          this.emit('dataReceived', {
            data: message.trim(),
            timestamp: new Date().toISOString()
          });
          processedData = true;
        }
      });
    }

    // Handle concatenated responses without proper line terminators
    // Look for ELM327 prompt patterns: >RESPONSE
    if (!processedData && this.readBuffer.includes('>')) {
      const promptResponses = this.extractPromptResponses();
      if (promptResponses.length > 0) {
        promptResponses.forEach(response => {
          this.emit('dataReceived', {
            data: response,
            timestamp: new Date().toISOString()
          });
        });
        processedData = true;
      }
    }

    // Handle responses without line terminators (like "OK", "ERROR")
    if (!processedData && this.readBuffer.length > 0) {
      const trimmedBuffer = this.readBuffer.trim();

      // Check for complete ELM327 responses
      if (this.isCompleteResponse(trimmedBuffer)) {
        this.emit('dataReceived', {
          data: trimmedBuffer,
          timestamp: new Date().toISOString()
        });
        this.readBuffer = ''; // Clear the buffer
      }
    }
  }

  /**
   * Extract responses from concatenated data using ELM327 prompt patterns
   */
  private extractPromptResponses(): string[] {
    const responses: string[] = [];
    const promptPattern = />([^>]+)/g;
    let match;

    while ((match = promptPattern.exec(this.readBuffer)) !== null) {
      const response = match[1].trim();
      if (response.length > 0) {
        responses.push(response);
      }
    }

    // Update buffer to keep only the last incomplete part
    if (responses.length > 0) {
      const lastPromptIndex = this.readBuffer.lastIndexOf('>');
      if (lastPromptIndex !== -1) {
        const afterLastPrompt = this.readBuffer.substring(lastPromptIndex + 1);
        // Only keep incomplete responses
        if (!this.isCompleteResponse(afterLastPrompt.trim())) {
          this.readBuffer = '>' + afterLastPrompt;
        } else {
          this.readBuffer = '';
        }
      }
    }

    return responses;
  }

  /**
   * Check if a response appears to be complete
   */
  private isCompleteResponse(response: string): boolean {
    const trimmed = response.trim();
    if (!trimmed) return false;

    // Common ELM327 complete responses
    const completeResponses = [
      'OK', 'ERROR', '?', 'NO DATA', 'UNABLE TO CONNECT',
      'SEARCHING...', 'STOPPED', 'BUS INIT: OK', 'BUS INIT: ERROR'
    ];

    // Check for exact matches
    if (completeResponses.includes(trimmed.toUpperCase())) {
      return true;
    }

    // Check for ELM327 version info
    if (trimmed.toUpperCase().includes('ELM327')) {
      return true;
    }

    // Check for hex data (OBD responses) - should be even length hex
    const hexPattern = /^[0-9A-F\s]+$/i;
    if (hexPattern.test(trimmed) && trimmed.replace(/\s/g, '').length >= 4) {
      const cleanHex = trimmed.replace(/\s/g, '');
      return cleanHex.length % 2 === 0; // Valid hex data should be even length
    }

    // Check for protocol descriptions
    const protocolKeywords = ['ISO', 'SAE', 'CAN', 'KWP', 'PWM', 'AUTO'];
    if (protocolKeywords.some(keyword => trimmed.toUpperCase().includes(keyword))) {
      return true;
    }

    // Check for voltage readings
    if (trimmed.match(/^\d+\.\d+V?$/)) {
      return true;
    }

    return false;
  }

  private handleDisconnection(): void {
    const wasConnected = this.isConnected;
    this.isConnected = false;
    this.stopHeartbeat();

    if (this.socket) {
      this.socket = null;
    }

    if (wasConnected) {
      this.emit('serverDisconnected');

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnection();
      }
    }
  }

  private async attemptReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {

      this.emit('reconnectionFailed');
      return;
    }

    this.reconnectAttempts++;


    this.emit('reconnecting', { attempt: this.reconnectAttempts });

    setTimeout(async () => {
      try {
        const success = await this.connectToOBDServer();
        if (success) {

          this.emit('reconnected');
        } else {
          this.attemptReconnection();
        }
      } catch (error: any) {

        this.attemptReconnection();
      }
    }, 2000 * this.reconnectAttempts) as any;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Ensure only one heartbeat is active
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendData('0100\r').catch(() => { });
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public async disconnect(): Promise<boolean> {

    try {
      await this.closeSocket();
      await this.disconnectFromNetwork();
      return true;
    } catch (error: any) {

      // Even if one part fails, we should report it but not necessarily stop.
      // The state will be cleared anyway.
      return false;
    }
  }

  async getCurrentNetwork(): Promise<{ ssid: string | null;[key: string]: any } | null> {
    try {
      const ssid: string | null = await WifiManager.getCurrentWifiSSID();
      const info: any = await WifiManager.connectionStatus(); // Use any to avoid type conflicts

      return {
        ...info,
        ssid: ssid // Put ssid last to avoid overwrite warning
      };
    } catch (error: any) {

      return null;
    }
  }

  async getNetworkInfo(): Promise<any | null> {
    try {
      const info: any = await WifiManager.connectionStatus();
      return info;
    } catch (error: any) {

      return null;
    }
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  getCurrentNetworkSSID(): string | null {
    return this.currentNetwork?.ssid || null;
  }

  setServerConfig(host: string, port: number): void {
    this.obdServerConfig.host = host;
    this.obdServerConfig.port = port;
  }

  getServerConfig(): OBDServerConfig {
    return { ...this.obdServerConfig };
  }

  clearBuffer(): void {
    this.readBuffer = '';
  }

  destroy(): void {
    this.stopHeartbeat();
    this.closeSocket(); // This is async, but destroy usually doesn't await
    this.disconnectFromNetwork(); // This is async, but destroy usually doesn't await
    this.removeAllListeners();
  }
}

export default new WiFiService();