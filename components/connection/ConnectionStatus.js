import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConnectionStatus = ({ 
  isConnected, 
  deviceName, 
  connectionType,
  signalStrength,
  onReconnect,
  onDisconnect,
  lastConnectionTime 
}) => {
  const getStatusColor = () => {
    if (isConnected) return '#4CAF50';
    return '#F44336';
  };

  const getStatusIcon = () => {
    if (isConnected) {
      return connectionType === 'bluetooth' ? 'bluetooth' : 'wifi';
    }
    return connectionType === 'bluetooth' ? 'bluetooth-outline' : 'wifi-outline';
  };

  const getSignalBars = () => {
    if (!isConnected || !signalStrength) return null;
    
    const bars = [];
    const strength = Math.min(Math.max(signalStrength, 0), 100);
    const numBars = Math.ceil(strength / 25);
    
    for (let i = 0; i < 4; i++) {
      bars.push(
        <View
          key={i}
          style={[
            styles.signalBar,
            {
              backgroundColor: i < numBars ? getStatusColor() : '#E0E0E0',
              height: 8 + (i * 3)
            }
          ]}
        />
      );
    }
    
    return bars;
  };

  const formatLastConnection = () => {
    if (!lastConnectionTime) return 'Never connected';
    
    const now = new Date();
    const lastConnection = new Date(lastConnectionTime);
    const diffMinutes = Math.floor((now - lastConnection) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusHeader}>
        <View style={styles.statusInfo}>
          <Ionicons 
            name={getStatusIcon()} 
            size={24} 
            color={getStatusColor()} 
          />
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
            <Text style={styles.deviceName}>
              {deviceName || 'No device selected'}
            </Text>
          </View>
        </View>
        
        {isConnected && (
          <View style={styles.signalContainer}>
            <View style={styles.signalBars}>
              {getSignalBars()}
            </View>
            <Text style={styles.signalText}>
              {signalStrength}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statusDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Connection Type:</Text>
          <Text style={styles.detailValue}>
            {connectionType === 'bluetooth' ? 'Classic Bluetooth' : 'Wi-Fi'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Connection:</Text>
          <Text style={styles.detailValue}>
            {formatLastConnection()}
          </Text>
        </View>
        
        {isConnected && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Data Rate:</Text>
            <Text style={styles.detailValue}>Active</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        {isConnected ? (
          <TouchableOpacity 
            style={[styles.button, styles.disconnectButton]}
            onPress={onDisconnect}
          >
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.connectButton]}
            onPress={onReconnect}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Reconnect</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deviceName: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  signalContainer: {
    alignItems: 'center',
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 20,
  },
  signalBar: {
    width: 4,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  signalText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  statusDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  connectButton: {
    backgroundColor: '#2196F3',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ConnectionStatus;