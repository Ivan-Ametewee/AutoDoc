import WiFiService from './WiFiService'; // Assuming WiFiService.ts is in the same directory
import { EventEmitter } from 'events';
// For react-native-tcp-socket, depending on its internal structure,
// a default import might be necessary for 'createConnection'.
// If this still gives errors, you might need to use `const TcpSocket = require('react-native-tcp-socket');`
// and potentially add `@types/react-native-tcp-socket` if available and helpful.
import TcpSocket from 'react-native-tcp-socket'; // Changed for createConnection directly

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

interface ConnectionEventData {
  state: ConnectionState;
  config?: OBDServerConfig;
}

interface NetworkEventData {
  state: NetworkState;
  network?: { ssid: string; connected: boolean };
  networks?: Network[];
  obdNetworks?: Network[];
}

interface DataEventData {
  data: string;
  timestamp: string;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected';
// Added 'disconnected' to NetworkState
type NetworkState = 'idle' | 'scanning' | 'connecting' | 'connected' | 'disconnected';
type ServerState = 'disconnected' | 'connecting' | 'connected';
type SignalStrength = 'excellent' | 'good' | 'fair' | 'weak' | 'very_weak';
type SecurityType = 'WPA3' | 'WPA2' | 'WPA' | 'WEP' | 'OPEN';

// --- WiFiManager Class ---
class WiFiManager extends EventEmitter {
  private wifiService: typeof WiFiService; // Type for the imported singleton instance
  private discoveredNetworks: Map<string, Network>;
  private obdNetworks: Map<string, Network>;
  private connectionState: ConnectionState;
  private networkState: NetworkState;
  private serverState: ServerState;
  private currentNetwork: { ssid: string; connected: boolean } | null;
  private serverConfig: OBDServerConfig;

  constructor() {
    super();
    this.wifiService = WiFiService;
    this.discoveredNetworks = new Map<string, Network>();
    this.obdNetworks = new Map<string, Network>();
    this.connectionState = 'disconnected';
    this.networkState = 'idle';
    this.serverState = 'disconnected';
    this.currentNetwork = null;
    this.serverConfig = {
      host: '192.168.0.10',
      port: 35000,
      timeout: 5000
    };

    this.setupServiceListeners();
  }

  private setupServiceListeners(): void {
    this.wifiService.on('networkConnected', (network: { ssid: string; connected: boolean }) => {
      this.currentNetwork = network;
      this.networkState = 'connected';
      this.emit('networkStateChanged', {
        state: 'connected',
        network: network
      } as NetworkEventData); // Type assertion
      this.emit('networkConnected', network);
    });

    this.wifiService.on('networkDisconnected', (network: { ssid: string; connected: boolean }) => {
      this.currentNetwork = null;
      this.networkState = 'disconnected'; // Now valid due to updated NetworkState
      this.connectionState = 'disconnected';
      this.serverState = 'disconnected';
      this.emit('networkStateChanged', {
        state: 'disconnected', // Now valid
        network: network
      } as NetworkEventData);
      this.emit('networkDisconnected', network);
    });

    this.wifiService.on('connecting', (data: { ssid: string }) => {
      this.networkState = 'connecting';
      this.emit('networkStateChanged', {
        state: 'connecting',
        network: data
      } as NetworkEventData);
    });

    this.wifiService.on('serverConnected', (config: OBDServerConfig) => {
      this.serverState = 'connected';
      this.connectionState = 'connected';
      this.emit('connectionStateChanged', {
        state: 'connected',
        config: config
      } as ConnectionEventData);
      this.emit('serverConnected', config);
    });

    this.wifiService.on('serverDisconnected', () => {
      this.serverState = 'disconnected';
      this.connectionState = 'disconnected';
      this.emit('connectionStateChanged', {
        state: 'disconnected'
      } as ConnectionEventData);
      this.emit('serverDisconnected');
    });

    this.wifiService.on('serverConnecting', (config: OBDServerConfig) => {
      this.serverState = 'connecting';
      this.connectionState = 'connecting';
      this.emit('connectionStateChanged', {
        state: 'connecting',
        config: config
      } as ConnectionEventData);
    });

    this.wifiService.on('scanStarted', () => {
      this.networkState = 'scanning';
      this.discoveredNetworks.clear();
      this.emit('scanStateChanged', { state: 'scanning' } as NetworkEventData);
    });

    this.wifiService.on('scanCompleted', (data: { all: Network[]; obd: Network[] }) => {
      this.networkState = 'idle';
      this.processDiscoveredNetworks(data.all, data.obd);
      this.emit('scanStateChanged', {
        state: 'idle',
        networks: data.all,
        obdNetworks: data.obd
      } as NetworkEventData);
    });

    this.wifiService.on('dataReceived', (data: DataEventData) => {
      this.emit('dataReceived', data);
    });

    this.wifiService.on('dataSent', (data: string) => {
      this.emit('dataSent', data);
    });

    this.wifiService.on('error', (error: Error) => {
      this.emit('error', error);
    });

    this.wifiService.on('reconnecting', (data: { attempt: number }) => {
      this.emit('reconnecting', data);
    });

    this.wifiService.on('reconnected', () => {
      this.emit('reconnected');
    });

    this.wifiService.on('reconnectionFailed', () => {
      this.emit('reconnectionFailed');
    });
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing WiFi Manager...');

      const hasPermissions = await this.wifiService.requestPermissions();
      if (!hasPermissions) {
        throw new Error('WiFi permissions not granted');
      }

      const isEnabled = await this.wifiService.isWiFiEnabled();
      if (!isEnabled) {
        const enabled = await this.wifiService.enableWiFi();
        if (!enabled) {
          throw new Error('WiFi could not be enabled');
        }
      }

      console.log('WiFi Manager initialized successfully');
      this.emit('initialized');
      return true;

    } catch (error: any) {
      console.error('Failed to initialize WiFi Manager:', error);
      this.emit('error', error);
      return false;
    }
  }

  async scanForNetworks(): Promise<{ all: Network[]; obd: Network[] }> {
    try {
      console.log('Starting network scan...');
      const result = await this.wifiService.scanNetworks();
      return result;
    } catch (error: any) {
      console.error('Error scanning for networks:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private processDiscoveredNetworks(allNetworks: Network[], obdNetworks: Network[]): void {
    allNetworks.forEach(network => {
      this.discoveredNetworks.set(network.SSID, network);
    });

    obdNetworks.forEach(network => {
      this.obdNetworks.set(network.SSID, {
        ...network,
        isOBD: true,
        signal: this.getSignalStrength(network),
        security: this.getSecurityType(network)
      });
      this.emit('obdNetworkFound', network);
    });

    console.log(`Processed ${allNetworks.length} networks, ${obdNetworks.length} OBDII networks`);
  }

  private getSignalStrength(network: Network): SignalStrength {
    const level = network.level || 0;

    if (level >= -50) return 'excellent';
    if (level >= -60) return 'good';
    if (level >= -70) return 'fair';
    if (level >= -80) return 'weak';
    return 'very_weak';
  }

  private getSecurityType(network: Network): SecurityType {
    const capabilities = network.capabilities || '';

    if (capabilities.includes('WPA3')) return 'WPA3';
    if (capabilities.includes('WPA2')) return 'WPA2';
    if (capabilities.includes('WPA')) return 'WPA';
    if (capabilities.includes('WEP')) return 'WEP';
    return 'OPEN';
  }

  async connectToOBDNetwork(ssid: string, password = ''): Promise<boolean> {
    try {
      console.log('Connecting to OBDII network:', ssid);

      const networkSuccess = await this.wifiService.connectToNetwork(ssid, password);
      if (!networkSuccess) {
        throw new Error('Failed to connect to WiFi network');
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      const serverSuccess = await this.wifiService.connectToOBDServer();
      if (!serverSuccess) {
        throw new Error('Failed to connect to OBDII server');
      }

      console.log('Successfully connected to OBDII network and server');
      return true;

    } catch (error: any) {
      console.error('Error connecting to OBDII network:', error);
      this.emit('error', error);
      return false;
    }
  }

  async connectToCustomServer(ssid: string, password: string, host: string, port: number): Promise<boolean> {
    try {
      console.log(`Connecting to custom OBDII server at ${host}:${port}`);

      this.setServerConfig(host, port);

      const networkSuccess = await this.wifiService.connectToNetwork(ssid, password);
      if (!networkSuccess) {
        throw new Error('Failed to connect to WiFi network');
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      const serverSuccess = await this.wifiService.connectToOBDServer(host, port);
      if (!serverSuccess) {
        throw new Error('Failed to connect to custom OBDII server');
      }

      console.log('Successfully connected to custom OBDII server');
      return true;

    } catch (error: any) {
      console.error('Error connecting to custom server:', error);
      this.emit('error', error);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      console.log('Disconnecting from WiFi network and server...');

      await this.wifiService.closeSocket();

      const success = await this.wifiService.disconnectFromNetwork();

      return success;

    } catch (error: any) {
      console.error('Error disconnecting:', error);
      this.emit('error', error);
      return false;
    }
  }

  async sendCommand(command: string): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to OBDII server');
      }

      const formattedCommand = command.endsWith('\r') ? command : command + '\r';

      const success = await this.wifiService.sendData(formattedCommand);

      if (success) {
        console.log('Command sent:', command);
      }

      return success;

    } catch (error: any) {
      console.error('Error sending command:', error);
      this.emit('error', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to OBDII server');
      }

      console.log('Testing OBDII connection...');

      const success = await this.sendCommand('ATZ');

      if (success) {
        this.emit('connectionTested', { success: true });
      }

      return success;

    } catch (error: any) {
      console.error('Error testing connection:', error);
      this.emit('connectionTested', { success: false, error });
      return false;
    }
  }

  async getCurrentNetwork(): Promise<Network | null> {
    try {
      const network = await this.wifiService.getCurrentNetwork();
      // Need to cast to Network if the structure matches, or adjust the return type of WiFiService.getCurrentNetwork
      // Assuming WiFiService.getCurrentNetwork returns a subset of Network or needs mapping
      if (network) {
        return {
            SSID: network.ssid || '', // Map ssid to SSID
            BSSID: network.bssid || '', // Map bssid to BSSID
            capabilities: '', // Capabilities might not be directly available here, add if needed
            level: network.rssi || 0, // Map rssi to level
            frequency: network.frequency || 0, // Map frequency
            isOBD: false // Default to false unless determined otherwise
        } as Network; // Explicitly cast if you're sure about the mapping
      }
      return null;
    } catch (error: any) {
      console.error('Error getting current network:', error);
      return null;
    }
  }

  async getNetworkInfo(): Promise<any | null> { // Use 'any' if the exact structure is not known or defined
    try {
      const info = await this.wifiService.getNetworkInfo();
      return info;
    } catch (error: any) {
      console.error('Error getting network info:', error);
      return null;
    }
  }

  setServerConfig(host: string, port: number): void {
    this.serverConfig.host = host;
    this.serverConfig.port = port;
    this.wifiService.setServerConfig(host, port);
  }

  getServerConfig(): OBDServerConfig {
    return { ...this.serverConfig };
  }

  updateServerTimeout(timeout: number): void {
    this.serverConfig.timeout = timeout;
  }

  isConnected(): boolean {
    return this.wifiService.isConnectedToServer();
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getNetworkState(): NetworkState {
    return this.networkState;
  }

  getServerState(): ServerState {
    return this.serverState;
  }

  getCurrentNetworkSSID(): string | null {
    return this.wifiService.getCurrentNetworkSSID();
  }

  getDiscoveredNetworks(): Network[] {
    return Array.from(this.discoveredNetworks.values());
  }

  getOBDNetworks(): Network[] {
    return Array.from(this.obdNetworks.values());
  }

  getNetworkDetails(ssid: string): Network | undefined {
    return this.discoveredNetworks.get(ssid) || this.obdNetworks.get(ssid);
  }

  isNetworkSecured(ssid: string): boolean {
    const network = this.getNetworkDetails(ssid);
    return network ? this.getSecurityType(network) !== 'OPEN' : false;
  }

  getNetworkSignalStrength(ssid: string): SignalStrength | null {
    const network = this.getNetworkDetails(ssid);
    return network ? this.getSignalStrength(network) : null;
  }

  filterNetworksBySignal(minSignal: SignalStrength = 'weak'): Network[] {
    const signalLevels: SignalStrength[] = ['very_weak', 'weak', 'fair', 'good', 'excellent'];
    const minIndex = signalLevels.indexOf(minSignal);

    return this.getOBDNetworks().filter(network => {
      // Ensure network.signal is defined before trying to get its index
      const signalIndex = network.signal ? signalLevels.indexOf(network.signal) : -1;
      return signalIndex >= minIndex;
    });
  }

  clearNetworkList(): void {
    this.discoveredNetworks.clear();
    this.obdNetworks.clear();
  }

  async pingServer(host: string | null = null, port: number | null = null): Promise<boolean> {
    try {
      const targetHost = host || this.serverConfig.host;
      const targetPort = port || this.serverConfig.port;

      console.log(`Pinging OBDII server at ${targetHost}:${targetPort}`);

      const testSocket = TcpSocket.createConnection({
        port: targetPort,
        host: targetHost
      }, () => {
        console.log('Ping successful');
      });
      testSocket.setTimeout(3000);

      return new Promise((resolve) => {
        testSocket.on('connect', () => {
          testSocket.destroy();
          resolve(true);
        });

        // This is the line that needs the fix for the callback signature
        // The TypeScript definition for `EventEmitter.on('error', ...)` on some platforms
        // expects the callback to potentially receive more than one argument.
        testSocket.on('error', (error: Error, extra?: any) => {
          console.error('Ping socket error:', error);
          testSocket.destroy();
          resolve(false);
        });

        testSocket.on('timeout', () => {
          console.log('Ping socket timeout');
          testSocket.destroy();
          resolve(false);
        });
      });

    } catch (error: any) {
      console.error('Error pinging server:', error);
      return false;
    }
  }

  getConnectionDiagnostics(): {
    networkState: NetworkState;
    serverState: ServerState;
    connectionState: ConnectionState;
    currentNetwork: { ssid: string; connected: boolean } | null;
    serverConfig: OBDServerConfig;
    isConnected: boolean;
    networksFound: number;
    obdNetworksFound: number;
  } {
    return {
      networkState: this.networkState,
      serverState: this.serverState,
      connectionState: this.connectionState,
      currentNetwork: this.currentNetwork,
      serverConfig: this.serverConfig,
      isConnected: this.isConnected(),
      networksFound: this.discoveredNetworks.size,
      obdNetworksFound: this.obdNetworks.size
    };
  }

  destroy(): void {
    console.log('Destroying WiFi Manager...');
    this.wifiService.destroy();
    this.discoveredNetworks.clear();
    this.obdNetworks.clear();
    this.removeAllListeners();
  }
}

export default new WiFiManager();