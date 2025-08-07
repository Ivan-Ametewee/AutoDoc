import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CircularGauge = ({
  value = 0,
  minValue = 0,
  maxValue = 100,
  unit = '',
  label = '',
  size = 120,
  warningThreshold,
  criticalThreshold,
}) => {
  const getColor = () => {
    if (criticalThreshold && value >= criticalThreshold) return '#FF4444';
    if (warningThreshold && value >= warningThreshold) return '#FF9500';
    return '#007AFF';
  };

  const percentage = Math.max(0, Math.min(100, ((value - minValue) / (maxValue - minValue)) * 100));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.circle}>
        <Text style={[styles.value, { color: getColor() }]}>
          {typeof value === 'number' ? value.toFixed(0) : '--'}
        </Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.progressRing}>
        <View 
          style={[
            styles.progressFill, 
            { 
              borderColor: getColor(),
              transform: [{ rotate: `${(percentage * 3.6) - 90}deg` }]
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circle: {
    backgroundColor: '#F8F9FA',
    borderRadius: 1000,
    width: '80%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 10,
    color: '#6B7280',
  },
  label: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    position: 'absolute',
    bottom: -15,
  },
  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    borderTopColor: '#007AFF',
  },
});

export default CircularGauge;