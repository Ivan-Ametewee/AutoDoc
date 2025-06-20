import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DeviceList = ({
  devices = [],
  connectedDevice = null,
  isScanning = false,
  onDeviceSelect,
  onDeviceConnect,
  onDeviceForget,
  onRefresh,
  showPairedOnly = false,
}) => {
  const [selectedDevice, setSelectedDevice] = useState(null);

  const getDeviceIcon = (device) => {
    if (device.type === 'obd') return 'car-outline';
    if (device.type === 'adapter') return 'hardware-chip-outline';
    return 'bluetooth-outline';
  };

  const getSignalStrengthIcon = (rssi) => {
    if (!rssi) return 'signal-outline';
    if (rssi > -50) return 'signal';
    if (rssi > -70) return 'signal-outline';
    return 'cellular-outline';
  };

  const formatRSSI = (rssi) => {
    if (!rssi) return 'Unknown';
    return `${rssi} dBm`;
  };

  const getDeviceStatus = (device) => {
    if (connectedDevice && connectedDevice.id === device.id) {
      return { text: 'Connected', color: '#4CAF50' };
    }
    if (device.isPaired) {
      return { text: 'Paired', color: '#2196F3' };
    }
    if (device.isConnecting) {
      return { text: 'Connecting...', color: '#FF9800' };
    }
    return { text: 'Available', color: '#666666' };
  };

  const handleDevicePress = (device) => {
    setSelectedDevice(device);
    if (onDeviceSelect) {
      onDeviceSelect(device);
    }
  };

  const handleConnectPress = (device) => {
    if (connectedDevice && connectedDevice.id === device.id) {
      // Already connected, show options
      Alert.alert(
        'Device Connected',
        `You are currently connected to ${device.name}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => onDeviceConnect(device, 'disconnect'),
          },
        ]
      );
    } else if (device.isPaired) {
      // Paired device, connect directly
      onDeviceConnect(device, 'connect');
    } else {
      // New device, pair and connect
      Alert.alert(
        'Pair Device',
        `Do you want to pair and connect to ${device.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pair & Connect',
            onPress: () => onDeviceConnect(device, 'pair'),
          },
        ]
      );
    }
  };

  const handleLongPress = (device) => {
    const options = [
      { text: 'Cancel', style: 'cancel' },
    ];

    if (device.isPaired) {
      options.push({
        text: 'Forget Device',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Forget Device',
            `Are you sure you want to forget ${device.name}? You will need to pair it again.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Forget',
                style: 'destructive',
                onPress: () => onDeviceForget(device),
              },
            ]
          );
        },
      });
    }

    if (options.length > 1) {
      Alert.alert('Device Options', '', options);
    }
  };

  const renderDeviceItem = ({ item: device }) => {
    const status = getDeviceStatus(device);
    const isSelected = selectedDevice && selectedDevice.id === device.id;
    const isConnected = connectedDevice && connectedDevice.id === device.id;

    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          isSelected && styles.selectedDevice,
          isConnected && styles.connectedDevice,
        ]}
        onPress={() => handleDevicePress(device)}
        onLongPress={() => handleLongPress(device)}
        activeOpacity={0.7}
      >
        <View style={styles.deviceIcon}>
          <Ionicons
            name={getDeviceIcon(device)}
            size={24}
            color={isConnected ? '#4CAF50' : '#2196F3'}
          />
        </View>

        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {device.name || 'Unknown Device'}
          </Text>
          <Text style={styles.deviceId} numberOfLines={1}>
            {device.id}
          </Text>
          <View style={styles.deviceMeta}>
            <Text style={[styles.deviceStatus, { color: status.color }]}>
              {status.text}
            </Text>
            {device.rssi && (
              <View style={styles.signalInfo}>
                <Ionicons
                  name={getSignalStrengthIcon(device.rssi)}
                  size={12}
                  color="#666666"
                />
                <Text style={styles.rssiText}>
                  {formatRSSI(device.rssi)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.deviceActions}>
          {device.isConnecting ? (
            <View style={styles.connectingIndicator}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#FF9800" />
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.connectButton,
                isConnected && styles.connectedButton,
              ]}
              onPress={() => handleConnectPress(device)}
            >
              <Ionicons
                name={isConnected ? 'checkmark-circle' : 'add-circle-outline'}
                size={20}
                color={isConnected ? '#4CAF50' : '#2196F3'}
              />
            </TouchableOpacity>
          )}

          {device.isPaired && (
            <View style={styles.pairedIndicator}>
              <Ionicons name="link" size={16} color="#2196F3" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bluetooth-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>
        {showPairedOnly ? 'No Paired Devices' : 'No Devices Found'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {showPairedOnly
          ? 'Pair some devices first to see them here'
          : isScanning
          ? 'Scanning for devices...'
          : 'Pull down to scan for devices'}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        {showPairedOnly ? 'Paired Devices' : 'Available Devices'}
      </Text>
      <Text style={styles.headerSubtitle}>
        {devices.length} device{devices.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDeviceItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isScanning}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          devices.length === 0 && styles.emptyContainer,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  deviceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDevice: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  connectedDevice: {
    backgroundColor: '#E8F5E8',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  signalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rssiText: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 4,
  },
  deviceActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButton: {
    padding: 8,
  },
  connectedButton: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
  },
  connectingIndicator: {
    padding: 8,
  },
  pairedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DeviceList;