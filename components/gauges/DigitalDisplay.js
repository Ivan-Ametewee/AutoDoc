import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DigitalDisplay = ({
  value,
  unit = '',
  label = '',
  icon,
  precision = 1,
  minValue,
  maxValue,
  warningThreshold,
  criticalThreshold,
  size = 'medium',
  style,
  animateChanges = true,
  showTrend = false,
  trendDirection = 'stable', // 'up', 'down', 'stable'
  backgroundColor = '#FFFFFF',
  textColor,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const previousValue = useRef(value);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animateChanges && typeof value === 'number') {
      Animated.timing(animatedValue, {
        toValue: value,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
    previousValue.current = value;
  }, [value, animateChanges]);

  useEffect(() => {
    // Pulse animation for critical values
    if (isCritical()) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [value, criticalThreshold]);

  const formatValue = (val) => {
    if (val === null || val === undefined) return '--';
    if (typeof val === 'number') {
      return val.toFixed(precision);
    }
    return val.toString();
  };

  const getValueColor = () => {
    if (textColor) return textColor;
    
    if (typeof value !== 'number') return '#333333';
    
    if (criticalThreshold !== undefined) {
      if (value >= criticalThreshold) return '#F44336';
    }
    
    if (warningThreshold !== undefined) {
      if (value >= warningThreshold) return '#FF9800';
    }
    
    return '#333333';
  };

  const isCritical = () => {
    return typeof value === 'number' && 
           criticalThreshold !== undefined && 
           value >= criticalThreshold;
  };

  const isWarning = () => {
    return typeof value === 'number' && 
           warningThreshold !== undefined && 
           value >= warningThreshold &&
           !isCritical();
  };

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return '#4CAF50';
      case 'down':
        return '#F44336';
      default:
        return '#666666';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          value: styles.smallValue,
          unit: styles.smallUnit,
          label: styles.smallLabel,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          value: styles.largeValue,
          unit: styles.largeUnit,
          label: styles.largeLabel,
        };
      default:
        return {
          container: styles.mediumContainer,
          value: styles.mediumValue,
          unit: styles.mediumUnit,
          label: styles.mediumLabel,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const valueColor = getValueColor();

  const renderValue = () => {
    if (animateChanges && typeof value === 'number') {
      return (
        <Animated.Text
          style={[
            sizeStyles.value,
            { color: valueColor },
            isCritical() && styles.criticalText,
          ]}
        >
          {animatedValue._value?.toFixed(precision) || formatValue(value)}
        </Animated.Text>
      );
    }

    return (
      <Text
        style={[
          sizeStyles.value,
          { color: valueColor },
          isCritical() && styles.criticalText,
        ]}
      >
        {formatValue(value)}
      </Text>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor },
        isCritical() && styles.criticalContainer,
        isWarning() && styles.warningContainer,
        { transform: [{ scale: pulseAnim }] },
        style,
      ]}
    >
      {/* Header with icon and label */}
      {(icon || label) && (
        <View style={styles.header}>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
              color={valueColor}
              style={styles.headerIcon}
            />
          )}
          {label && (
            <Text style={[sizeStyles.label, { color: valueColor }]}>
              {label}
            </Text>
          )}
        </View>
      )}

      {/* Main value display */}
      <View style={styles.valueContainer}>
        {renderValue()}
        {unit && (
          <Text style={[sizeStyles.unit, { color: valueColor }]}>
            {unit}
          </Text>
        )}
      </View>

      {/* Trend indicator */}
      {showTrend && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={getTrendIcon()}
            size={size === 'small' ? 12 : size === 'large' ? 18 : 14}
            color={getTrendColor()}
          />
        </View>
      )}

      {/* Range indicator */}
      {minValue !== undefined && maxValue !== undefined && (
        <View style={styles.rangeContainer}>
          <Text style={styles.rangeText}>
            {minValue} - {maxValue} {unit}
          </Text>
        </View>
      )}

      {/* Status indicators */}
      {(isCritical() || isWarning()) && (
        <View style={styles.statusIndicator}>
          <Ionicons
            name={isCritical() ? 'warning' : 'alert-circle'}
            size={size === 'small' ? 12 : size === 'large' ? 18 : 14}
            color={isCritical() ? '#F44336' : '#FF9800'}
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  smallContainer: {
    minWidth: 80,
    minHeight: 60,
  },
  mediumContainer: {
    minWidth: 120,
    minHeight: 80,
  },
  largeContainer: {
    minWidth: 160,
    minHeight: 100,
  },
  criticalContainer: {
    borderWidth: 2,
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  warningContainer: {
    borderWidth: 1,
    borderColor: '#FF9800',
    backgroundColor: '#FFF8E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    marginRight: 6,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flex: 1,
  },
  smallValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  mediumValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  largeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  criticalText: {
    textShadowColor: '#F44336',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  smallUnit: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666666',
  },
  mediumUnit: {
    fontSize: 14,
    marginLeft: 4,
    color: '#666666',
  },
  largeUnit: {
    fontSize: 16,
    marginLeft: 4,
    color: '#666666',
  },
  smallLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  mediumLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  largeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  trendContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  rangeContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  rangeText: {
    fontSize: 10,
    color: '#999999',
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
});

export default DigitalDisplay;