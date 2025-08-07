import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SpeedometerGauge = ({
  value = 0,
  minValue = 0,
  maxValue = 100,
  unit = '',
  label = '',
  icon,
  warningThreshold,
  criticalThreshold,
  size = 200,
}) => {
  const getColor = () => {
    if (criticalThreshold && value >= criticalThreshold) return '#FF4444';
    if (warningThreshold && value >= warningThreshold) return '#FF9500';
    return '#007AFF';
  };

  const percentage = Math.max(0, Math.min(100, ((value - minValue) / (maxValue - minValue)) * 100));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.content}>
        {icon && <Ionicons name={icon} size={24} color={getColor()} />}
        <Text style={[styles.value, { color: getColor() }]}>
          {typeof value === 'number' ? value.toFixed(0) : '--'}
        </Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${percentage}%`, backgroundColor: getColor() }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  unit: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

export default SpeedometerGauge;