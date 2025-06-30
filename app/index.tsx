import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import BluetoothManager from '../services/bluetooth/BluetoothManager';
import WiFiManager from '../services/wifi/WiFiManager';
//import { setConnectionType } from '../../store/actions/connectionActions';

// Types
interface ConnectionOption {
  id: string;
  name: string;
  type: 'bluetooth' | 'wifi' | 'demo';
  icon: keyof typeof Ionicons.glyphMap;
  status: 'available' | 'connecting' | 'connected' | 'unavailable';
  address?: string;
  bonded?: boolean;
  rssi?: number;
  security?: string;
  signal?: string;
}

interface WiFiNetwork {
  SSID: string;
  level: number;
  capabilities: string;
  frequency?: number;
  isOBD?: boolean;
  signal?: string;
  security?: string;
}

// Constants
const SCAN_TIMEOUT = 10000;
const CONNECTION_TIMEOUT = 5000;

const DEFAULT_CONNECTIONS: ConnectionOption[] = [
  {
    id: 'bluetooth-scan',
    name: 'Bluetooth OBD Adapter',
    type: 'bluetooth',
    icon: 'bluetooth',
    status: 'available',
  },
  {
    id: 'wifi-scan',
    name: 'WiFi OBD Adapter',
    type: 'wifi',
    icon: 'wifi',
    status: 'available',
  },
  {
    id: 'demo-001',
    name: 'Demo Mode',
    type: 'demo',
    icon: 'car-sport',
    status: 'available',
  },
];

export default function ConnectionScreen() {
  const dispatch = useDispatch();
  // State
  const [connections, setConnections] = useState<ConnectionOption[]>(DEFAULT_CONNECTIONS);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothState, setBluetoothState] = useState({
    initialized: false,
    enabled: false,
    hasPermissions: false,
  });
  const [wifiInitialized, setWifiInitialized] = useState(false);
  const [bluetoothDevices, setBluetoothDevices] = useState<ConnectionOption[]>([]);
  const [wifiNetworks, setWifiNetworks] = useState<ConnectionOption[]>([]);
  const [showBluetoothDevices, setShowBluetoothDevices] = useState(false);
  const [showWifiNetworks, setShowWifiNetworks] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<ConnectionOption | null>(null);
  const [networkPassword, setNetworkPassword] = useState('');
  const [showCustomServerModal, setShowCustomServerModal] = useState(false);
  const [customHost, setCustomHost] = useState('192.168.0.10');
  const [customPort, setCustomPort] = useState('35000');

  // Refs
  const bluetoothManagerRef = useRef<typeof BluetoothManager | null>(BluetoothManager);
  const wifiManagerRef = useRef<typeof WiFiManager | null>(WiFiManager);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cleanupManagers();
    };
  }, []);

  const cleanupManagers = useCallback(() => {
    try {
      if (bluetoothState.initialized && bluetoothManagerRef.current) {
        bluetoothManagerRef.current.removeAllListeners?.();
      }
      if (wifiInitialized && wifiManagerRef.current) {
        wifiManagerRef.current.removeAllListeners?.();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, [bluetoothState.initialized, wifiInitialized]);

  // Safe state updater
  const safeSetState = useCallback((updater: () => void) => {
    if (isMountedRef.current) {
      updater();
    }
  }, []);

  // Error handler
  const handleError = useCallback((title: string, error: unknown, onDismiss?: () => void) => {
    const message = error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'An unexpected error occurred';

    console.error(`${title}:`, error);

    Alert.alert(title, message, [
      { text: 'OK', onPress: onDismiss }
    ]);
  }, []);

  // Bluetooth event handlers
  const setupBluetoothListeners = useCallback(() => {
    const manager = bluetoothManagerRef.current;
    if (!manager) return;

    try {
      manager.on('initialized', () => {
        safeSetState(() => {
          setBluetoothState(prev => ({
            ...prev,
            initialized: true,
            enabled: true,
            hasPermissions: true
          }));
        });
        startBluetoothScan();
      });

      manager.on('obdDeviceFound', (device: any) => {
        if (device && device.address) {
          addBluetoothDevice(device);
        }
      });

      manager.on('scanStateChanged', ({ state, devices }: any) => {
        safeSetState(() => {
          setIsScanning(state === 'scanning');
        });
      });

      manager.on('connectionStateChanged', ({ state, device }: any) => {
        if (device?.id) {
          updateDeviceStatus(device.id, state);

          if (state === 'connected') {
            setTimeout(() => {
              if (isMountedRef.current) {
                router.replace('/(tabs)/dashboard');
              }
            }, CONNECTION_TIMEOUT);
          }
        }
      });

      manager.on('bluetoothStateChanged', ({ enabled }: any) => {
        safeSetState(() => {
          setBluetoothState(prev => ({ ...prev, enabled }));
        });

        if (!enabled) {
          Alert.alert(
            'Bluetooth Disabled',
            'Please enable Bluetooth to connect to OBD adapters.',
            [{ text: 'OK' }]
          );
        }
      });

      manager.on('error', (error: any) => {
        handleError('Bluetooth Error', error, () => {
          safeSetState(() => {
            setIsScanning(false);
            setBluetoothState(prev => ({ ...prev, initialized: false }));
          });
        });
      });
    } catch (error) {
      handleError('Setup Error', error);
    }
  }, [safeSetState, handleError]);

  // WiFi event handlers
  const setupWiFiListeners = useCallback(() => {
    const manager = wifiManagerRef.current;
    if (!manager) return;

    try {
      manager.on('initialized', () => {
        safeSetState(() => setWifiInitialized(true));
        startWiFiScan();
      });

      manager.on('obdNetworkFound', (network: WiFiNetwork) => {
        if (network && network.SSID) {
          addWiFiNetwork(network);
        }
      });

      manager.on('scanStateChanged', ({ state }: any) => {
        safeSetState(() => setIsScanning(state === 'scanning'));
      });

      manager.on('connectionStateChanged', ({ state, config }: any) => {
        if (selectedNetwork) {
          if (state === 'connected') {
            updateWiFiNetworkStatus(selectedNetwork.id, 'connected');
            setTimeout(() => {
              if (isMountedRef.current) {
                router.replace('/(tabs)/dashboard');
              }
            }, CONNECTION_TIMEOUT);
          } else if (state === 'disconnected') {
            updateWiFiNetworkStatus(selectedNetwork.id, 'available');
          }
        }
      });

      manager.on('error', (error: any) => {
        handleError('WiFi Error', error, () => {
          safeSetState(() => {
            setIsScanning(false);
            if (selectedNetwork) {
              updateWiFiNetworkStatus(selectedNetwork.id, 'available');
            }
          });
        });
      });
    } catch (error) {
      handleError('Setup Error', error);
    }
  }, [safeSetState, handleError, selectedNetwork]);

  // Initialize Bluetooth
  const initializeBluetooth = useCallback(async () => {
    if (!bluetoothManagerRef.current) {
      handleError('Bluetooth Error', new Error('Bluetooth manager not available'));
      return;
    }

    try {
      setupBluetoothListeners();
      const success = await bluetoothManagerRef.current.initialize();

      if (!success) {
        const message = Platform.OS === 'android'
          ? 'Please enable Bluetooth and grant location permissions to scan for OBD adapters.'
          : 'Please enable Bluetooth to connect to OBD adapters.';

        Alert.alert('Bluetooth Setup Required', message, [
          { text: 'Cancel', onPress: () => setShowBluetoothDevices(false) },
          { text: 'Try Again', onPress: initializeBluetooth }
        ]);
      }
    } catch (error) {
      handleError('Bluetooth Initialization Failed', error, () => {
        setShowBluetoothDevices(false);
      });
    }
  }, [setupBluetoothListeners, handleError]);

  // Initialize WiFi
  const initializeWiFi = useCallback(async () => {
    if (!wifiManagerRef.current) {
      handleError('WiFi Error', new Error('WiFi manager not available'));
      return;
    }

    try {
      setupWiFiListeners();
      const success = await wifiManagerRef.current.initialize();

      if (!success) {
        Alert.alert(
          'WiFi Setup Required',
          'Please enable WiFi and grant location permissions to scan for OBD adapters.',
          [
            { text: 'Cancel', onPress: () => setShowWifiNetworks(false) },
            { text: 'Try Again', onPress: initializeWiFi }
          ]
        );
      }
    } catch (error) {
      handleError('WiFi Initialization Failed', error, () => {
        setShowWifiNetworks(false);
      });
    }
  }, [setupWiFiListeners, handleError]);

  // Start Bluetooth scan
  const startBluetoothScan = useCallback(async () => {
    if (!bluetoothManagerRef.current || !bluetoothState.initialized) return;

    try {
      setIsScanning(true);
      setBluetoothDevices([]);

      await bluetoothManagerRef.current.scanForDevices(SCAN_TIMEOUT);
    } catch (error) {
      handleError('Scan Failed', error);
    } finally {
      safeSetState(() => setIsScanning(false));
    }
  }, [bluetoothState.initialized, handleError, safeSetState]);

  // Start WiFi scan
  const startWiFiScan = useCallback(async () => {
    if (!wifiManagerRef.current || !wifiInitialized) return;

    try {
      setIsScanning(true);
      setWifiNetworks([]);

      await wifiManagerRef.current.scanForNetworks();
    } catch (error) {
      handleError('Scan Failed', error);
    } finally {
      safeSetState(() => setIsScanning(false));
    }
  }, [wifiInitialized, handleError, safeSetState]);

  // Add Bluetooth device
  const addBluetoothDevice = useCallback((device: {
    id?: string;
    address: string;
    name?: string;
    bonded?: boolean;
    rssi?: number;
  }) => {
    const connectionOption: ConnectionOption = {
      id: device.id || device.address,
      name: device.name || `Unknown Device (${device.address})`,
      type: 'bluetooth',
      icon: 'bluetooth',
      status: 'available',
      address: device.address,
      bonded: device.bonded,
      rssi: device.rssi,
    };

    safeSetState(() => {
      setBluetoothDevices(prev => {
        const existingIndex = prev.findIndex(conn => conn.id === connectionOption.id);

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...connectionOption };
          return updated;
        }
        return [...prev, connectionOption];
      });
    });
  }, [safeSetState]);

  // Add WiFi network
  const addWiFiNetwork = useCallback((network: WiFiNetwork) => {
    const connectionOption: ConnectionOption = {
      id: network.SSID,
      name: network.SSID,
      type: 'wifi',
      icon: 'wifi',
      status: 'available',
      signal: getSignalStrength(network.level),
      security: getSecurityType(network.capabilities),
    };

    safeSetState(() => {
      setWifiNetworks(prev => {
        const existingIndex = prev.findIndex(conn => conn.id === connectionOption.id);

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...connectionOption };
          return updated;
        }
        return [...prev, connectionOption];
      });
    });
  }, [safeSetState]);

  // Helper functions
  const getSignalStrength = (level: number): string => {
    if (level >= -50) return 'excellent';
    if (level >= -60) return 'good';
    if (level >= -70) return 'fair';
    if (level >= -80) return 'weak';
    return 'very_weak';
  };

  const getSecurityType = (capabilities: string): string => {
    if (capabilities.includes('WPA3')) return 'WPA3';
    if (capabilities.includes('WPA2')) return 'WPA2';
    if (capabilities.includes('WPA')) return 'WPA';
    if (capabilities.includes('WEP')) return 'WEP';
    return 'OPEN';
  };

  // Update device status
  const updateDeviceStatus = useCallback((
    deviceId: string,
    status: string
  ) => {
    if (!deviceId) return;

    const statusMap: { [key: string]: ConnectionOption['status'] } = {
      'connecting': 'connecting',
      'connected': 'connected',
      'disconnected': 'available'
    };

    const newStatus: ConnectionOption['status'] = statusMap[status] || 'available';

    safeSetState(() => {
      setBluetoothDevices(prev =>
        prev.map(conn =>
          conn.id === deviceId
            ? { ...conn, status: newStatus }
            : conn
        )
      );
    });
  }, [safeSetState]);

  // Update WiFi network status
  const updateWiFiNetworkStatus = useCallback((
    networkId: string,
    status: ConnectionOption['status']
  ) => {
    safeSetState(() => {
      setWifiNetworks(prev =>
        prev.map(conn =>
          conn.id === networkId
            ? { ...conn, status: status }
            : conn
        )
      );
    });
  }, [safeSetState]);

  // Handle connection
  const handleConnect = useCallback(async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    const bluetoothDevice = bluetoothDevices.find(c => c.id === connectionId);
    const wifiNetwork = wifiNetworks.find(c => c.id === connectionId);
    const targetConnection = connection || bluetoothDevice || wifiNetwork;

    if (!targetConnection) return;

    // Handle option selection
    if (connectionId === 'bluetooth-scan') {
      setShowBluetoothDevices(true);
      if (!bluetoothState.initialized) {
        await initializeBluetooth();
      } else {
        startBluetoothScan();
      }
      return;
    }

    if (connectionId === 'wifi-scan') {
      setShowWifiNetworks(true);
      if (!wifiInitialized) {
        await initializeWiFi();
      } else {
        startWiFiScan();
      }
      return;
    }

    // Update status to connecting
    if (bluetoothDevice) {
      updateDeviceStatus(connectionId, 'connecting');
    } else if (wifiNetwork) {
      updateWiFiNetworkStatus(connectionId, 'connecting');
    } else {
      setConnections(prev =>
        prev.map(c =>
          c.id === connectionId ? { ...c, status: 'connecting' } : c
        )
      );
    }

    try {
      if (targetConnection.type === 'demo') {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, CONNECTION_TIMEOUT));
        //dispatch(setConnectionType('demo'));
        setConnections(prev =>
          prev.map(c =>
            c.id === connectionId ? { ...c, status: 'connected' } : c
          )
        );

        setTimeout(() => {
          if (isMountedRef.current) {
            router.replace('/(tabs)/dashboard');
          }
        }, 500);

      } else if (targetConnection.type === 'bluetooth') {
        if (!bluetoothState.initialized || !bluetoothState.enabled) {
          throw new Error('Bluetooth is not available');
        }

        if (!bluetoothManagerRef.current) {
          throw new Error('Bluetooth manager not available');
        }

        const success = await bluetoothManagerRef.current.connectToDevice(connectionId);
        if (!success) {
          throw new Error('Failed to connect to Bluetooth device');
        }

        //dispatch(setConnectionType('bluetooth'/*, targetConnection, 'bluetooth'*/));
      } else if (targetConnection.type === 'wifi') {
        if (!wifiInitialized) {
          throw new Error('WiFi is not available');
        }

        setSelectedNetwork(targetConnection);

        if (targetConnection.security && targetConnection.security !== 'OPEN') {
          setShowPasswordModal(true);
        } else {
          await connectToWiFiNetwork(targetConnection.id, '');
          //dispatch(setConnectionType('wifi'/*, targetConnection, 'wifi'*/));
        }
      }

    } catch (error) {
      // Reset status on error
      if (bluetoothDevice) {
        updateDeviceStatus(connectionId, 'available');
      } else if (wifiNetwork) {
        updateWiFiNetworkStatus(connectionId, 'available');
      } else {
        setConnections(prev =>
          prev.map(c =>
            c.id === connectionId ? { ...c, status: 'available' } : c
          )
        );
      }

      handleError('Connection Failed', error);
    }
  }, [
    connections, bluetoothDevices, wifiNetworks, bluetoothState, wifiInitialized,
    initializeBluetooth, initializeWiFi, startBluetoothScan, startWiFiScan,
    updateDeviceStatus, updateWiFiNetworkStatus, handleError, dispatch
  ]);

  // Connect to WiFi network
  const connectToWiFiNetwork = useCallback(async (ssid: string, password: string) => {
    if (!wifiManagerRef.current) {
      throw new Error('WiFi manager not available');
    }

    try {
      const success = await wifiManagerRef.current.connectToOBDNetwork(ssid, password);
      if (!success) {
        throw new Error('Failed to connect to WiFi network');
      }
    } catch (error) {
      if (selectedNetwork) {
        updateWiFiNetworkStatus(selectedNetwork.id, 'available');
      }
      throw error;
    }
  }, [selectedNetwork, updateWiFiNetworkStatus]);

  // Handle password submission
  const handlePasswordSubmit = useCallback(async () => {
    if (!selectedNetwork) return;

    try {
      setShowPasswordModal(false);
      await connectToWiFiNetwork(selectedNetwork.id, networkPassword);
      //dispatch(setConnectionType('wifi'/*, selectedNetwork, 'wifi'*/));
    } catch (error) {
      handleError('Connection Failed', error);
    } finally {
      setNetworkPassword('');
      setSelectedNetwork(null);
    }
  }, [selectedNetwork, networkPassword, connectToWiFiNetwork, handleError, dispatch]);

  // Handle custom server connection
  const handleCustomServerConnect = useCallback(async () => {
    if (!selectedNetwork || !wifiManagerRef.current) return;

    try {
      setShowCustomServerModal(false);

      const host = customHost.trim();
      const port = parseInt(customPort.trim());

      if (!host || isNaN(port)) {
        throw new Error('Please enter valid host and port');
      }

      const success = await wifiManagerRef.current.connectToCustomServer(
        selectedNetwork.id,
        networkPassword,
        host,
        port
      );

      if (!success) {
        throw new Error('Failed to connect to custom server');
      }
    } catch (error) {
      if (selectedNetwork) {
        updateWiFiNetworkStatus(selectedNetwork.id, 'available');
      }
      handleError('Connection Failed', error);
    } finally {
      setNetworkPassword('');
      setSelectedNetwork(null);
    }
  }, [selectedNetwork, customHost, customPort, networkPassword, updateWiFiNetworkStatus, handleError]);

  // Handle rescan
  const handleRescan = useCallback(async () => {
    if (showBluetoothDevices) {
      if (!bluetoothState.initialized) {
        Alert.alert('Bluetooth Not Available', 'Please initialize Bluetooth first.');
        return;
      }
      if (!bluetoothState.enabled) {
        Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth to scan for devices.');
        return;
      }
      startBluetoothScan();
    } else if (showWifiNetworks) {
      if (!wifiInitialized) {
        Alert.alert('WiFi Not Available', 'Please initialize WiFi first.');
        return;
      }
      startWiFiScan();
    }
  }, [showBluetoothDevices, showWifiNetworks, bluetoothState, wifiInitialized, startBluetoothScan, startWiFiScan]);

  // Handle back to options
  const handleBackToOptions = useCallback(() => {
    setShowBluetoothDevices(false);
    setShowWifiNetworks(false);
    setBluetoothDevices([]);
    setWifiNetworks([]);

    if (isScanning) {
      try {
        if (bluetoothState.initialized && bluetoothManagerRef.current) {
          bluetoothManagerRef.current.stopScan?.();
        }
      } catch (error) {
        console.error('Error stopping scan:', error);
      }
      setIsScanning(false);
    }
  }, [isScanning, bluetoothState.initialized]);

  // UI Helper functions
  const getStatusColor = (status: ConnectionOption['status']): string => {
    const colors = {
      available: '#007AFF',
      connecting: '#FF9500',
      connected: '#34C759',
      unavailable: '#FF3B30',
    };
    return colors[status] || '#8E8E93';
  };

  const getStatusText = (status: ConnectionOption['status']): string => {
    const texts = {
      available: 'Available',
      connecting: 'Connecting...',
      connected: 'Connected',
      unavailable: 'Unavailable',
    };
    return texts[status] || 'Unknown';
  };

  const getSignalIcon = (signal?: string): keyof typeof Ionicons.glyphMap => {
    return ['weak', 'very_weak'].includes(signal || '') ? 'wifi-outline' : 'wifi';
  };

  // Render connection card
  const renderConnectionCard = useCallback((connection: ConnectionOption) => {
    const isBluetoothDevice = connection.type === 'bluetooth' && connection.id !== 'bluetooth-scan';
    const isWiFiNetwork = connection.type === 'wifi' && connection.id !== 'wifi-scan';

    const deviceInfo = isBluetoothDevice ? (
      <Text style={styles.deviceInfo}>
        {connection.address && `${connection.address}`}
        {connection.bonded && ' • Paired'}
        {connection.rssi && ` • ${connection.rssi}dBm`}
      </Text>
    ) : isWiFiNetwork ? (
      <Text style={styles.deviceInfo}>
        {connection.security && `${connection.security}`}
        {connection.signal && ` • ${connection.signal.replace('_', ' ')}`}
      </Text>
    ) : null;

    return (
      <TouchableOpacity
        key={connection.id}
        style={[
          styles.connectionCard,
          connection.status === 'connected' && styles.connectedCard,
        ]}
        onPress={() => handleConnect(connection.id)}
        disabled={connection.status === 'connecting' || connection.status === 'connected'}
      >
        <View style={styles.connectionIcon}>
          <Ionicons
            name={isWiFiNetwork ? getSignalIcon(connection.signal) : connection.icon}
            size={24}
            color={getStatusColor(connection.status)}
          />
        </View>

        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{connection.name}</Text>
          {deviceInfo}
          <Text style={[styles.connectionStatus, { color: getStatusColor(connection.status) }]}>
            {getStatusText(connection.status)}
          </Text>
        </View>

        <View style={styles.connectionAction}>
          {connection.status === 'connecting' ? (
            <ActivityIndicator size="small" color="#FF9500" />
          ) : connection.status === 'connected' ? (
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
          ) : isWiFiNetwork && connection.security !== 'OPEN' ? (
            <Ionicons name="lock-closed" size={20} color="#8E8E93" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          )}
        </View>
      </TouchableOpacity>
    );
  }, [handleConnect, getStatusColor, getStatusText, getSignalIcon]);

  // Computed values
  const currentDevices = showBluetoothDevices ? bluetoothDevices :
    showWifiNetworks ? wifiNetworks :
      connections;

  const currentTitle = showBluetoothDevices ? 'Bluetooth Devices' :
    showWifiNetworks ? 'WiFi Networks' :
      'Connection Options';

  const emptyStateText = showBluetoothDevices ? 'No Bluetooth adapters found' :
    showWifiNetworks ? 'No WiFi OBD adapters found' :
      'No connection options';

  const emptyStateSubtext = showBluetoothDevices ?
    'Make sure your OBD adapter is plugged in and in pairing mode' :
    showWifiNetworks ?
      'Make sure your WiFi OBD adapter is powered on and broadcasting' :
      '';

  const canRescan = (showBluetoothDevices && bluetoothState.initialized) ||
    (showWifiNetworks && wifiInitialized);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {(showBluetoothDevices || showWifiNetworks) && (
          <TouchableOpacity style={styles.backButton} onPress={handleBackToOptions}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>OBDII Diagnostic</Text>
        <Text style={styles.subtitle}>
          {showBluetoothDevices ? 'Choose Bluetooth device' :
            showWifiNetworks ? 'Choose WiFi network' :
              'Connect to your vehicle'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{currentTitle}</Text>
            {(showBluetoothDevices || showWifiNetworks) && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleRescan}
                disabled={isScanning || !canRescan}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={canRescan ? "#007AFF" : "#C7C7CC"}
                  />
                )}
                <Text style={[styles.scanText, { color: canRescan ? "#007AFF" : "#C7C7CC" }]}>
                  {isScanning ? 'Scanning...' : 'Rescan'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {currentDevices.length > 0 ? (
            currentDevices.map(renderConnectionCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name={showBluetoothDevices ? "bluetooth" : showWifiNetworks ? "wifi" : "car-sport"}
                size={48}
                color="#C7C7CC"
              />
              <Text style={styles.emptyStateText}>{emptyStateText}</Text>
              {emptyStateSubtext && (
                <Text style={styles.emptyStateSubtext}>{emptyStateSubtext}</Text>
              )}
              {canRescan && !isScanning && (
                <TouchableOpacity style={styles.rescanButton} onPress={handleRescan}>
                  <Text style={styles.rescanButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Network Password</Text>
            <Text style={styles.modalSubtitle}>
              Network: {selectedNetwork?.name}
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={networkPassword}
              onChangeText={setNetworkPassword}
              secureTextEntry={true}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setNetworkPassword('');
                  setSelectedNetwork(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.connectButton]}
                onPress={handlePasswordSubmit}
                disabled={!networkPassword.trim()}
              >
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.customServerButton}
              onPress={() => {
                setShowPasswordModal(false);
                setShowCustomServerModal(true);
              }}
            >
              <Text style={styles.customServerButtonText}>Custom Server Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Server Modal */}
      <Modal
        visible={showCustomServerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomServerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Custom Server Settings</Text>
            <Text style={styles.modalSubtitle}>
              Network: {selectedNetwork?.name}
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={networkPassword}
              onChangeText={setNetworkPassword}
              secureTextEntry={true}
            />

            <TextInput
              style={styles.passwordInput}
              placeholder="Host (e.g., 192.168.0.10)"
              value={customHost}
              onChangeText={setCustomHost}
            />

            <TextInput
              style={styles.passwordInput}
              placeholder="Port (e.g., 35000)"
              value={customPort}
              onChangeText={setCustomPort}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCustomServerModal(false);
                  setNetworkPassword('');
                  setSelectedNetwork(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.connectButton]}
                onPress={handleCustomServerConnect}
                disabled={!networkPassword.trim() || !customHost.trim() || !customPort.trim()}
              >
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
    marginLeft: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  scanText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 4,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  connectedCard: {
    borderWidth: 1,
    borderColor: '#34C759',
  },
  connectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  deviceInfo: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  connectionStatus: {
    fontSize: 15,
    fontWeight: '500',
  },
  connectionAction: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  rescanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  rescanButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 17,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#8E8E93',
  },
  connectButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customServerButton: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  customServerButtonText: {
    fontSize: 15,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

// import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, Image, FlatList, Pressable } from 'react-native';
// import { router } from 'expo-router';
// import React, { useState, useEffect, useCallback } from 'react';
// import { Wifi, Bluetooth, PlayCircle, ChevronLeft, ServerCrash } from 'lucide-react-native';

// // Import all necessary services
// import OBDIIService from '../services/obdii/OBDIIService';
// import WiFiService from '../services/wifi/WiFiService';
// import BluetoothService from '../services/bluetooth/BluetoothService';

// // Define types for discovered devices to be used in the list
// interface DiscoveredDevice {
//   name: string;
//   address: string; // MAC address for Bluetooth, SSID for Wi-Fi
//   type: 'wifi' | 'bluetooth';
//   raw: any; // The original device object from the service
// }

// export default function ConnectionScreen() {
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === 'dark';

//   // --- UI State Management ---
//   const [view, setView] = useState<'initial' | 'discovering' | 'connecting'>('initial');
//   const [discoveryType, setDiscoveryType] = useState<'wifi' | 'bluetooth' | null>(null);
//   const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   // --- Service Subscription ---
//   useEffect(() => {
//     // Listen for the final connection status from the central service
//     const unsubscribe = OBDIIService.subscribe((event, data) => {
//       if (event === 'connectionStatus') {
//         if (data.status === 'connected') {
//           // On successful connection, navigate to the dashboard
//           router.replace('/(tabs)/dashboard');
//         } else if (data.status === 'error') {
//           setError(data.error || 'An unknown connection error occurred.');
//           setView('initial'); // Go back to the initial screen on error
//         } else if (data.status === 'connecting') {
//           setView('connecting');
//         }
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   // --- Action Handlers ---
//   const handleStartDiscovery = useCallback(async (type: 'wifi' | 'bluetooth') => {
//     setView('discovering');
//     setDiscoveryType(type);
//     setError(null);
//     setDevices([]);

//     try {
//       let foundDevices: DiscoveredDevice[] = [];
//       if (type === 'wifi') {
//         await WiFiService.requestPermissions();
//         const { obd: obdNetworks } = await WiFiService.scanNetworks();
//         foundDevices = obdNetworks.map(net => ({
//           name: net.SSID,
//           address: net.SSID, // Use SSID as the unique identifier
//           type: 'wifi',
//           raw: net,
//         }));
//       } else { // Bluetooth
//         await BluetoothService.requestPermissions();
//         // Getting bonded (already paired) devices is usually faster and more reliable
//         const bondedDevices = await BluetoothService.getBondedDevices();
//         foundDevices = bondedDevices.map(dev => ({
//           name: dev.name || 'Unknown Device',
//           address: dev.address,
//           type: 'bluetooth',
//           raw: dev,
//         }));
//       }
//       setDevices(foundDevices);
//     } catch (e: any) {
//       setError(`Failed to scan for ${type} devices. Please check permissions and try again.`);
//       setView('initial');
//     }
//   }, []);

//   const handleSelectDevice = async (device: DiscoveredDevice) => {
//     setError(null);
//     setView('connecting');
//     try {
//       // For Wi-Fi, we need the SSID. For Bluetooth, we pass the whole device object.
//       const connectionTarget = device.type === 'wifi' ? { ssid: device.address, password: '' } : device.raw;
//       await OBDIIService.connect(connectionTarget, device.type);
//     } catch (e: any) {
//       setError(e.message || 'Failed to connect.');
//       setView('initial');
//     }
//   };

//   const handleStartDemo = () => {
//     setError(null);
//     setView('connecting');
//     OBDIIService.enableSimulation();
//   };

//   const resetView = () => {
//     setView('initial');
//     setError(null);
//     setDevices([]);
//   };

//   const styles = getStyles(isDark);

//   // --- Render Logic ---
//   const renderInitialView = () => (
//     <>
//       <View style={styles.header}>
//         <Image source={require('../assets/images/icon.png')} style={styles.logo} />
//         <Text style={styles.title}>OBD-II Simulator</Text>
//         <Text style={styles.subtitle}>Connect to your vehicle to get started</Text>
//       </View>
//       <View style={styles.buttonContainer}>
//         <ConnectionButton icon={Wifi} label="Connect via Wi-Fi" onPress={() => handleStartDiscovery('wifi')} isDark={isDark} />
//         <ConnectionButton icon={Bluetooth} label="Connect via Bluetooth" onPress={() => handleStartDiscovery('bluetooth')} isDark={isDark} />
//         <ConnectionButton icon={PlayCircle} label="Start Demo Mode" onPress={handleStartDemo} isDark={isDark} />
//       </View>
//     </>
//   );

//   const renderDiscoveryView = () => (
//     <>
//       <View style={styles.listHeader}>
//         <TouchableOpacity onPress={resetView} style={styles.backButton}>
//           <ChevronLeft color={isDark ? '#fff' : '#000'} size={28} />
//         </TouchableOpacity>
//         <Text style={styles.title}>Select a {discoveryType === 'wifi' ? 'Wi-Fi' : 'Bluetooth'} Device</Text>
//       </View>
//       {devices.length === 0 ? (
//         <View style={styles.centeredMessage}>
//             <ActivityIndicator size="large" />
//             <Text style={styles.statusText}>Scanning for devices...</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={devices}
//           keyExtractor={(item) => item.address}
//           renderItem={({ item }) => (
//             <Pressable style={styles.deviceButton} onPress={() => handleSelectDevice(item)}>
//               <Text style={styles.deviceText}>{item.name}</Text>
//               <Text style={styles.deviceSubtext}>{item.address}</Text>
//             </Pressable>
//           )}
//           ListEmptyComponent={() => (
//             <View style={styles.centeredMessage}>
//                 <ServerCrash color={isDark ? '#888' : '#666'} size={48} />
//                 <Text style={styles.statusText}>No devices found.</Text>
//                 <Text style={styles.statusSubtext}>Ensure the OBD-II adapter is powered on and in range.</Text>
//             </View>
//           )}
//         />
//       )}
//     </>
//   );

//   const renderConnectingView = () => (
//     <View style={styles.centeredMessage}>
//       <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
//       <Text style={styles.statusText}>Connecting...</Text>
//     </View>
//   );


//   const renderContent = () => {
//     switch (view) {
//       case 'discovering':
//         return renderDiscoveryView();
//       case 'connecting':
//         return renderConnectingView();
//       case 'initial':
//       default:
//         return renderInitialView();
//     }
//   }

//   return (
//     <View style={styles.container}>
//       {renderContent()}
//       {error && (
//         <View style={styles.errorContainer}>
//             <Text style={styles.errorText}>{error}</Text>
//         </View>
//       )}
//     </View>
//   );
// }

// // --- Helper Components & Styles ---
// const ConnectionButton = ({ icon: Icon, label, onPress, isDark }: any) => {
//     const styles = getStyles(isDark);
//     return (
//       <TouchableOpacity style={styles.button} onPress={onPress}>
//         <Icon color={isDark ? '#fff' : '#000'} size={24} />
//         <Text style={styles.buttonText}>{label}</Text>
//       </TouchableOpacity>
//     );
// };

// const getStyles = (isDark: boolean) => StyleSheet.create({
//     container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f5f5f5', paddingTop: 60, paddingHorizontal: 20 },
//     header: { alignItems: 'center', marginBottom: 60, marginTop: 40 },
//     logo: { width: 100, height: 100, marginBottom: 20 },
//     title: { fontSize: 28, fontWeight: 'bold', color: isDark ? '#fff' : '#000', textAlign: 'center' },
//     subtitle: { fontSize: 16, color: isDark ? '#a0a0a0' : '#666', marginTop: 8 },
//     buttonContainer: { width: '100%', maxWidth: 400, alignSelf: 'center' },
//     button: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e1e1e' : '#fff', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: isDark ? '#333' : '#ddd' },
//     buttonText: { fontSize: 18, color: isDark ? '#fff' : '#000', marginLeft: 15 },
//     statusContainer: { marginTop: 40, alignItems: 'center', height: 60 },
//     statusText: { marginTop: 20, fontSize: 16, color: isDark ? '#a0a0a0' : '#666', textAlign: 'center' },
//     statusSubtext: { marginTop: 8, fontSize: 14, color: isDark ? '#777' : '#888', textAlign: 'center' },
//     errorContainer: { position: 'absolute', bottom: 40, left: 20, right: 20, padding: 15, backgroundColor: isDark ? '#5c1f1f' : '#fdecea', borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#993333' : '#f5c6cb' },
//     errorText: { color: isDark ? '#ffb3b3' : '#721c24', textAlign: 'center', fontSize: 16 },
//     listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
//     backButton: { padding: 5 },
//     deviceButton: { backgroundColor: isDark ? '#1e1e1e' : '#fff', padding: 20, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: isDark ? '#333' : '#ddd' },
//     deviceText: { fontSize: 16, fontWeight: '600', color: isDark ? '#eee' : '#222' },
//     deviceSubtext: { fontSize: 12, color: isDark ? '#999' : '#555', marginTop: 4 },
//     centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
// });