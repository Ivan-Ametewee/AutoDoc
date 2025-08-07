import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, Image, FlatList, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';

// Import services with error handling
let OBDIIService: any = null;
let WiFiService: any = null;
let BluetoothService: any = null;

try {
  OBDIIService = require('../services/obdii/OBDIIService').default;
} catch (error) {
  console.warn('OBDIIService not available:', error);
}

try {
  WiFiService = require('../services/wifi/WiFiService').default;
} catch (error) {
  console.warn('WiFiService not available:', error);
}

try {
  BluetoothService = require('../services/bluetooth/BluetoothService').default;
} catch (error) {
  console.warn('BluetoothService not available:', error);
}

// Define types for discovered devices to be used in the list
interface DiscoveredDevice {
  name: string;
  address: string; // MAC address for Bluetooth, SSID for Wi-Fi
  type: 'wifi' | 'bluetooth';
  raw: any; // The original device object from the service
}

export default function ConnectionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // --- UI State Management ---
  const [view, setView] = useState<'initial' | 'discovering' | 'connecting'>('initial');
  const [discoveryType, setDiscoveryType] = useState<'wifi' | 'bluetooth' | null>(null);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- Service Subscription ---
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      if (OBDIIService) {
        // Listen for the final connection status from the central service
        unsubscribe = OBDIIService.subscribe((event: string, data: any) => {
          console.log('OBDIIService event:', event, data);
          if (event === 'connectionStatus') {
            if (data.status === 'connected') {
              // On successful connection, navigate to the dashboard
              console.log('Connected, navigating to dashboard');
              router.replace('/(tabs)/dashboard');
            } else if (data.status === 'error') {
              setError(data.error || 'An unknown connection error occurred.');
              setView('initial'); // Go back to the initial screen on error
            } else if (data.status === 'connecting') {
              setView('connecting');
            }
          }
        });

        // Check if already connected on mount
        const connectionInfo = OBDIIService.getConnectionStatus();
        if (connectionInfo && connectionInfo.status === 'connected') {
          console.log('Already connected on mount, navigating to dashboard');
          router.replace('/(tabs)/dashboard');
        }
      }
    } catch (error) {
      console.warn('Service subscription failed:', error);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error during service unsubscribe:', error);
        }
      }
    };
  }, []);

  // --- Action Handlers ---
  const handleStartDiscovery = useCallback(async (type: 'wifi' | 'bluetooth') => {
    // Prevent Bluetooth discovery on iOS
    if (type === 'bluetooth' && Platform.OS === 'ios') {
      setError('Bluetooth functionality is not available on iOS devices. Please use Wi-Fi or Demo Mode instead.');
      return;
    }

    setView('discovering');
    setDiscoveryType(type);
    setError(null);
    setDevices([]);

    try {
      let foundDevices: DiscoveredDevice[] = [];
      if (type === 'wifi') {
        if (!WiFiService) {
          throw new Error('WiFi service not available');
        }
        await WiFiService.requestPermissions();
        const { obd: obdNetworks } = await WiFiService.scanNetworks();
        foundDevices = obdNetworks.map((net: any, index: number) => ({
          name: net.SSID,
          address: net.SSID || `wifi_${index}`, // Use SSID as address for WiFi networks
          type: 'wifi',
          raw: net,
        }));
      } else { // Bluetooth
        if (!BluetoothService) {
          throw new Error('Bluetooth service not available');
        }
        await BluetoothService.requestPermissions();
        // Getting bonded (already paired) devices is usually faster and more reliable
        const bondedDevices = await BluetoothService.getBondedDevices();
        foundDevices = bondedDevices.map((dev: any) => ({
          name: dev.name || 'Unknown Device',
          address: dev.address,
          type: 'bluetooth',
          raw: dev,
        }));
      }
      setDevices(foundDevices);
    } catch (e: any) {
      console.warn(`Discovery failed for ${type}:`, e);
      setError(`Failed to scan for ${type} devices. Please check permissions and try again.`);
      setView('initial');
    }
  }, []);

  const handleSelectDevice = async (device: DiscoveredDevice) => {
    setError(null);
    setView('connecting');
    try {
      if (!OBDIIService) {
        throw new Error('OBD service not available');
      }
      // For Wi-Fi, we need the SSID. For Bluetooth, we pass the whole device object.
      const connectionTarget = device.type === 'wifi' ? { ssid: device.address, password: '' } : device.raw;
      await OBDIIService.connect(connectionTarget, device.type);
    } catch (e: any) {
      console.warn('Device connection failed:', e);
      setError(e.message || 'Failed to connect.');
      setView('initial');
    }
  };

  const handleStartDemo = async () => {
    setError(null);
    setView('connecting');
    
    try {
      if (!OBDIIService) {
        throw new Error('OBD service not available');
      }
      
      OBDIIService.enableSimulation();
      
      // Add a fallback timeout in case the subscription doesn't work
      setTimeout(() => {
        try {
          const connectionInfo = OBDIIService.getConnectionStatus();
          if (connectionInfo && connectionInfo.status === 'connected') {
            console.log('Demo mode connected, navigating to dashboard');
            router.replace('/(tabs)/dashboard');
          } else {
            console.log('Demo mode navigation fallback');
            router.replace('/(tabs)/dashboard');
          }
        } catch (error) {
          console.warn('Demo mode fallback failed:', error);
          router.replace('/(tabs)/dashboard');
        }
      }, 2000);
    } catch (error) {
      console.error('Demo mode error:', error);
      setError('Failed to start demo mode');
      setView('initial');
    }
  };

  const resetView = () => {
    setView('initial');
    setError(null);
    setDevices([]);
  };

  const styles = getStyles(isDark);

  // --- Render Logic ---
  const renderInitialView = () => (
    <>
      <View style={styles.header}>
        <Image source={require('../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.title}>OBD-II Simulator</Text>
        <Text style={styles.subtitle}>Connect to your vehicle to get started</Text>
      </View>
      <View style={styles.buttonContainer}>
        <ConnectionButton iconName="wifi" label="Connect via Wi-Fi" onPress={() => handleStartDiscovery('wifi')} isDark={isDark} />
        {Platform.OS !== 'ios' && (
          <ConnectionButton icon="bluetooth" label="Connect via Bluetooth" onPress={() => handleStartDiscovery('bluetooth')} isDark={isDark} />
        )}
        <ConnectionButton icon="play-circle" label="Start Demo Mode" onPress={handleStartDemo} isDark={isDark} />
        {Platform.OS === 'ios' && (
          <View style={styles.iosWarningContainer}>
            <Text style={styles.iosWarningText}>
              📱 Bluetooth is not available on iOS. Use Wi-Fi or Demo Mode instead.
            </Text>
          </View>
        )}
      </View>
    </>
  );

  const renderDiscoveryView = () => (
    <>
      <View style={styles.listHeader}>
        <TouchableOpacity onPress={resetView} style={styles.backButton}>
          <Ionicons name="chevron-back" color={isDark ? '#fff' : '#000'} size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>Select a {discoveryType === 'wifi' ? 'Wi-Fi' : 'Bluetooth'} Device</Text>
      </View>
      {devices.length === 0 ? (
        <View style={styles.centeredMessage}>
            <ActivityIndicator size="large" />
            <Text style={styles.statusText}>Scanning for devices...</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.address}
          renderItem={({ item }) => (
            <Pressable style={styles.deviceButton} onPress={() => handleSelectDevice(item)}>
              <Text style={styles.deviceText}>{item.name}</Text>
              <Text style={styles.deviceSubtext}>{item.address}</Text>
            </Pressable>
          )}
          ListEmptyComponent={() => (
            <View style={styles.centeredMessage}>
                <Ionicons name="server" color={isDark ? '#888' : '#666'} size={48} />
                <Text style={styles.statusText}>No devices found.</Text>
                <Text style={styles.statusSubtext}>Ensure the OBD-II adapter is powered on and in range.</Text>
            </View>
          )}
        />
      )}
    </>
  );

  const renderConnectingView = () => (
    <View style={styles.centeredMessage}>
      <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
      <Text style={styles.statusText}>Connecting...</Text>
    </View>
  );


  const renderContent = () => {
    switch (view) {
      case 'discovering':
        return renderDiscoveryView();
      case 'connecting':
        return renderConnectingView();
      case 'initial':
      default:
        return renderInitialView();
    }
  }

  return (
    <View style={styles.container}>
      {renderContent()}
      {error && (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// --- Helper Components & Styles ---
const ConnectionButton = ({ iconName, label, onPress, isDark }: any) => {
    const styles = getStyles(isDark);
    return (
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Ionicons name={iconName} color={isDark ? '#fff' : '#000'} size={24} />
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f5f5f5', paddingTop: 60, paddingHorizontal: 20 },
    header: { alignItems: 'center', marginBottom: 60, marginTop: 40 },
    logo: { width: 100, height: 100, marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: isDark ? '#fff' : '#000', textAlign: 'center' },
    subtitle: { fontSize: 16, color: isDark ? '#a0a0a0' : '#666', marginTop: 8 },
    buttonContainer: { width: '100%', maxWidth: 400, alignSelf: 'center' },
    button: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e1e1e' : '#fff', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: isDark ? '#333' : '#ddd' },
    buttonText: { fontSize: 18, color: isDark ? '#fff' : '#000', marginLeft: 15 },
    statusContainer: { marginTop: 40, alignItems: 'center', height: 60 },
    statusText: { marginTop: 20, fontSize: 16, color: isDark ? '#a0a0a0' : '#666', textAlign: 'center' },
    statusSubtext: { marginTop: 8, fontSize: 14, color: isDark ? '#777' : '#888', textAlign: 'center' },
    errorContainer: { position: 'absolute', bottom: 40, left: 20, right: 20, padding: 15, backgroundColor: isDark ? '#5c1f1f' : '#fdecea', borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#993333' : '#f5c6cb' },
    errorText: { color: isDark ? '#ffb3b3' : '#721c24', textAlign: 'center', fontSize: 16 },
    listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: { padding: 5 },
    deviceButton: { backgroundColor: isDark ? '#1e1e1e' : '#fff', padding: 20, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: isDark ? '#333' : '#ddd' },
    deviceText: { fontSize: 16, fontWeight: '600', color: isDark ? '#eee' : '#222' },
    deviceSubtext: { fontSize: 12, color: isDark ? '#999' : '#555', marginTop: 4 },
    centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    iosWarningContainer: { marginTop: 10, padding: 15, backgroundColor: isDark ? '#2a2a2a' : '#fff3cd', borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#444' : '#ffc107' },
    iosWarningText: { fontSize: 14, color: isDark ? '#ffd700' : '#856404', textAlign: 'center', lineHeight: 18 },
});