import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LinearGauge = ({
  value = 0,
  minValue = 0,
  maxValue = 100,
  unit = '',
  label = '',
  icon,
  warningThreshold,
  criticalThreshold,
  orientation = 'horizontal', // 'horizontal' or 'vertical'
  showValue = true,
  showScale = true,
  animateChanges = true,
  segments = 5,
  gaugeColor = '#2196F3',
  warningColor = '#FF9800',
  criticalColor = '#F44336',
  backgroundColor = '#E0E0E0',
  style,
  height = 40,
  width,
}) => {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { width: screenWidth } = Dimensions.get('window');

  useEffect(() => {
    if (animateChanges) {
      Animated.timing(animatedValue, {
        toValue: value,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(value);
    }
  }, [value, animateChanges]);

  useEffect(() => {
    // Pulse animation for critical values
    if (isCritical()) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
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

  const normalizeValue = (val) => {
    return Math.max(0, Math.min(1, (val - minValue) / (maxValue - minValue)));
  };

  const isCritical = () => {
    return criticalThreshold !== undefined && value >= criticalThreshold;
  };

  const isWarning = () => {
    return warningThreshold !== undefined && 
           value >= warningThreshold && 
           !isCritical();
  };

  const getCurrentColor = () => {
    if (isCritical()) return criticalColor;
    if (isWarning()) return warningColor;
    return gaugeColor;
  };

  const getScaleMarks = () => {
    const marks = [];
    for (let i = 0; i <= segments; i++) {
      const markValue = minValue + (maxValue - minValue) * (i / segments);
      marks.push({
        value: markValue,
        position: i / segments,
      });
    }
    return marks;
  };

  const getThresholdPosition = (threshold) => {
    if (threshold === undefined) return null;
    return normalizeValue(threshold);
  };

  const formatValue = (val) => {
    if (Number.isInteger(val)) return val.toString();
    return val.toFixed(1);
  };

  const renderHorizontalGauge = () => {
    const gaugeWidth = width || screenWidth - 60;
    const normalizedValue = normalizeValue(value);
    const warningPos = getThresholdPosition(warningThreshold);
    const criticalPos = getThresholdPosition(criticalThreshold);

    return (
      <View style={[styles.container, style]}>
        {/* Header */}
        {(icon || label) && (
          <View style={styles.header}>
            {icon && (
              <Ionicons name={icon} size={20} color={getCurrentColor()} />
            )}
            {label && (
              <Text style={[styles.label, { color: getCurrentColor() }]}>
                {label}
              </Text>
            )}
          </View>
        )}

        {/* Gauge container */}
        <Animated.View 
          style={[
            styles.gaugeContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          {/* Background track */}
          <View
            style={[
              styles.track,
              {
                width: gaugeWidth,
                height: height,
                backgroundColor,
                borderRadius: height / 2,
              },
            ]}
          >
            {/* Threshold markers */}
            {warningPos && (
              <View
                style={[
                  styles.thresholdMarker,
                  {
                    left: warningPos * gaugeWidth - 1,
                    height: height,
                    backgroundColor: warningColor,
                  },
                ]}
              />
            )}
            {criticalPos && (
              <View
                style={[
                  styles.thresholdMarker,
                  {
                    left: criticalPos * gaugeWidth - 1,
                    height: height,
                    backgroundColor: criticalColor,
                  },
                ]}
              />
            )}

            {/* Filled portion */}
            <Animated.View
              style={[
                styles.fill,
                {
                  width: animatedValue.interpolate({
                    inputRange: [minValue, maxValue],
                    outputRange: [0, gaugeWidth],
                    extrapolate: 'clamp',
                  }),
                  height: height,
                  backgroundColor: getCurrentColor(),
                  borderRadius: height / 2,
                },
              ]}
            />

            {/* Value indicator */}
            <Animated.View
              style={[
                styles.indicator,
                {
                  left: animatedValue.interpolate({
                    inputRange: [minValue, maxValue],
                    outputRange: [0, gaugeWidth - 4],
                    extrapolate: 'clamp',
                  }),
                  height: height + 8,
                  top: -4,
                },
              ]}
            />
          </View>

          {/* Scale marks */}
          {showScale && (
            <View style={[styles.scaleContainer, { width: gaugeWidth }]}>
              {getScaleMarks().map((mark, index) => (
                <View
                  key={index}
                  style={[
                    styles.scaleMark,
                    { left: mark.position * gaugeWidth - 0.5 },
                  ]}
                >
                  <View style={styles.scaleTickHorizontal} />
                  <Text style={styles.scaleText}>
                    {formatValue(mark.value)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Value display */}
        {showValue && (
          <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: getCurrentColor() }]}>
              {formatValue(value)} {unit}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderVerticalGauge = () => {
    const gaugeHeight = height || 200;
    const normalizedValue = normalizeValue(value);
    const warningPos = getThresholdPosition(warningThreshold);
    const criticalPos = getThresholdPosition(criticalThreshold);

    return (
      <View style={[styles.container, styles.verticalContainer, style]}>
        <View style={styles.verticalContent}>
          {/* Value display */}
          {showValue && (
            <View style={styles.verticalValueContainer}>
              <Text style={[styles.value, { color: getCurrentColor() }]}>
                {formatValue(value)}
              </Text>
              <Text style={[styles.unit, { color: getCurrentColor() }]}>
                {unit}
              </Text>
            </View>
          )}

          {/* Gauge container */}
          <Animated.View 
            style={[
              styles.verticalGaugeContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            {/* Background track */}
            <View
              style={[
                styles.verticalTrack,
                {
                  width: 20,
                  height: gaugeHeight,
                  backgroundColor,
                  borderRadius: 10,
                },
              ]}
            >
              {/* Threshold markers */}
              {warningPos && (
                <View
                  style={[
                    styles.verticalThresholdMarker,
                    {
                      bottom: warningPos * gaugeHeight - 1,
                      width: 20,
                      backgroundColor: warningColor,
                    },
                  ]}
                />
              )}
              {criticalPos && (
                <View
                  style={[
                    styles.verticalThresholdMarker,
                    {
                      bottom: criticalPos * gaugeHeight - 1,
                      width: 20,
                      backgroundColor: criticalColor,
                    },
                  ]}
                />
              )}

              {/* Filled portion */}
              <Animated.View
                style={[
                  styles.verticalFill,
                  {
                    width: 20,
                    height: animatedValue.interpolate({
                      inputRange: [minValue, maxValue],
                      outputRange: [0, gaugeHeight],
                      extrapolate: 'clamp',
                    }),
                    backgroundColor: getCurrentColor(),
                    borderRadius: 10,
                  },
                ]}
              />
            </View>

            {/* Scale marks */}
            {showScale && (
              <View style={[styles.verticalScaleContainer, { height: gaugeHeight }]}>
                {getScaleMarks().map((mark, index) => (
                  <View
                    key={index}
                    style={[
                      styles.verticalScaleMark,
                      { bottom: mark.position * gaugeHeight - 6 },
                    ]}
                  >
                    <View style={styles.scaleTickVertical} />
                    <Text style={styles.scaleText}>
                      {formatValue(mark.value)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Header */}
          {(icon || label) && (
            <View style={styles.verticalHeader}>
              {icon && (
                <Ionicons name={icon} size={20} color={getCurrentColor()} />
              )}
              {label && (
                <Text style={[styles.label, { color: getCurrentColor() }]}>
                  {label}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return orientation === 'vertical' ? renderVerticalGauge() : renderHorizontalGauge();
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verticalContainer: {
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verticalHeader: {
    alignItems: 'center',
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  gaugeContainer: {
    alignItems: 'center',
  },
  verticalGaugeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  verticalContent: {
    alignItems: 'center',
  },
  track: {
    position: 'relative',
    overflow: 'hidden',
  },
  verticalTrack: {
    position: 'relative',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  verticalFill: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  indicator: {
    position: 'absolute',
    width: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  thresholdMarker: {
    position: 'absolute',
    width: 2,
    top: 0,
    zIndex: 1,
  },
  verticalThresholdMarker: {
    position: 'absolute',
    height: 2,
    left: 0,
    zIndex: 1,
  },
  scaleContainer: {
    position: 'relative',
    height: 30,
    marginTop: 8,
  },
  verticalScaleContainer: {
    position: 'relative',
    width: 50,
    marginLeft: 8,
  },
  scaleMark: {
    position: 'absolute',
    alignItems: 'center',
  },
  verticalScaleMark: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  scaleTickHorizontal: {
    width: 1,
    height: 8,
    backgroundColor: '#666666',
    marginBottom: 4,
  },
  scaleTickVertical: {
    width: 8,
    height: 1,
    backgroundColor: '#666666',
    marginRight: 4,
  },
  scaleText: {
    fontSize: 10,
    color: '#666666',
  },
  valueContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  verticalValueContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default LinearGauge;