import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ScanningIndicator = ({ 
  isScanning, 
  onStopScan, 
  foundDevicesCount = 0,
  scanDuration = 0,
  connectionType = 'bluetooth' 
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isScanning) {
      // Pulse animation for the main icon
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Rotation animation for scanning effect
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );

      // Wave animations for radar effect
      const waveAnimation1 = Animated.loop(
        Animated.timing(waveAnim1, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );

      const waveAnimation2 = Animated.loop(
        Animated.timing(waveAnim2, {
          toValue: 1,
          duration: 1500,
          delay: 500,
          useNativeDriver: true,
        })
      );

      const waveAnimation3 = Animated.loop(
        Animated.timing(waveAnim3, {
          toValue: 1,
          duration: 1500,
          delay: 1000,
          useNativeDriver: true,
        })
      );

      pulseAnimation.start();
      rotateAnimation.start();
      waveAnimation1.start();
      waveAnimation2.start();
      waveAnimation3.start();

      return () => {
        pulseAnimation.stop();
        rotateAnimation.stop();
        waveAnimation1.stop();
        waveAnimation2.stop();
        waveAnimation3.stop();
      };
    } else {
      // Reset animations when not scanning
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      waveAnim1.setValue(0);
      waveAnim2.setValue(0);
      waveAnim3.setValue(0);
    }
  }, [isScanning]);

  const formatScanDuration = () => {
    const minutes = Math.floor(scanDuration / 60);
    const seconds = scanDuration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getConnectionIcon = () => {
    return connectionType === 'bluetooth' ? 'bluetooth' : 'wifi';
  };

  const renderWaveCircle = (animValue, delay = 0) => {
    const scale = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 2],
    });

    const opacity = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.7, 0.3, 0],
    });

    return (
      <Animated.View
        style={[
          styles.waveCircle,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    );
  };

  if (!isScanning) {
    return null;
  }

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.scanningArea}>
        {/* Radar waves */}
        {renderWaveCircle(waveAnim1)}
        {renderWaveCircle(waveAnim2)}
        {renderWaveCircle(waveAnim3)}
        
        {/* Main scanning icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                { scale: pulseAnim },
                { rotate: spin },
              ],
            },
          ]}
        >
          <Ionicons 
            name={getConnectionIcon()} 
            size={40} 
            color="#2196F3" 
          />
        </Animated.View>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusHeader}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.scanningText}>
            Scanning for {connectionType === 'bluetooth' ? 'Bluetooth' : 'Wi-Fi'} devices...
          </Text>
        </View>

        <View style={styles.scanInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>{formatScanDuration()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Found:</Text>
            <Text style={styles.infoValue}>
              {foundDevicesCount} device{foundDevicesCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.stopButton}
          onPress={onStopScan}
        >
          <Ionicons name="stop" size={16} color="#FFFFFF" />
          <Text style={styles.stopButtonText}>Stop Scanning</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips:</Text>
        <Text style={styles.tipsText}>
          • Make sure your OBD-II adapter is plugged in
        </Text>
        <Text style={styles.tipsText}>
          • Ensure the adapter is in pairing mode
        </Text>
        <Text style={styles.tipsText}>
          • Keep your device close to the adapter
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  scanningArea: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  waveCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  scanInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  infoRow: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  tipsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 16,
  },
});

export default ScanningIndicator;