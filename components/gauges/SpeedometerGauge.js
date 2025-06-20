import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';

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
  startAngle = -135,
  endAngle = 135,
  showValue = true,
  showScale = true,
  showNeedle = true,
  animateChanges = true,
  scaleInterval = 10,
  majorTickInterval = 5,
  gaugeColor = '#2196F3',
  warningColor = '#FF9800',
  criticalColor = '#F44336',
  backgroundColor = '#F5F5F5',
  needleColor = '#333333',
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const needleRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const center = size / 2;
  const radius = (size - 40) / 2;
  const needleLength = radius * 0.8;

  useEffect(() => {
    if (animateChanges) {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: value,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(needleRotation, {
          toValue: valueToAngle(value),
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      animatedValue.setValue(value);
      needleRotation.setValue(valueToAngle(value));
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

  const valueToAngle = (val) => {
    const normalizedValue = Math.max(0, Math.min(1, (val - minValue) / (maxValue - minValue)));
    return startAngle + normalizedValue * (endAngle - startAngle);
  };

  const angleToRadians = (angle) => (angle * Math.PI) / 180;

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = angleToRadians(angleInDegrees - 90);
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
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

  const formatValue = (val) => {
    if (Number.isInteger(val)) return val.toString();
    return val.toFixed(1);
  };

  const createArcPath = (centerX, centerY, radius, startAngle, endAngle) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  const getScaleMarks = () => {
    const marks = [];
    const totalRange = maxValue - minValue;
    const numMarks = Math.floor(totalRange / scaleInterval) + 1;
    
    for (let i = 0; i < numMarks; i++) {
      const markValue = minValue + i * scaleInterval;
      if (markValue <= maxValue) {
        const angle = valueToAngle(markValue);
        const isMajor = i % majorTickInterval === 0;
        marks.push({
          value: markValue,
          angle,
          isMajor,
        });
      }
    }
    return marks;
  };

  const getThresholdArcs = () => {
    const arcs = [];
    
    // Warning arc
    if (warningThreshold !== undefined && warningThreshold <= maxValue) {
      const warningStart = Math.max(warningThreshold, minValue);
      const warningEnd = criticalThreshold !== undefined ? 
        Math.min(criticalThreshold, maxValue) : maxValue;
      
      if (warningStart < warningEnd) {
        arcs.push({
          startAngle: valueToAngle(warningStart),
          endAngle: valueToAngle(warningEnd),
          color: warningColor,
          opacity: 0.3,
        });
      }
    }
    
    // Critical arc
    if (criticalThreshold !== undefined && criticalThreshold <= maxValue) {
      const criticalStart = Math.max(criticalThreshold, minValue);
      const criticalEnd = maxValue;
      
      if (criticalStart < criticalEnd) {
        arcs.push({
          startAngle: valueToAngle(criticalStart),
          endAngle: valueToAngle(criticalEnd),
          color: criticalColor,
          opacity: 0.3,
        });
      }
    }
    
    return arcs;
  };

  const renderNeedle = () => {
    const needleAngle = valueToAngle(value);
    const needleEnd = polarToCartesian(center, center, needleLength, needleAngle);
    const needleBase = polarToCartesian(center, center, 10, needleAngle + 180);
    
    return (
      <G>
        {/* Needle shadow */}
        <Path
          d={`M ${center + 1} ${center + 1} L ${needleEnd.x + 1} ${needleEnd.y + 1}`}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Needle */}
        <Path
          d={`M ${center} ${center} L ${needleEnd.x} ${needleEnd.y}`}
          stroke={needleColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Center dot */}
        <Circle
          cx={center}
          cy={center}
          r="8"
          fill={needleColor}
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        
        {/* Center highlight */}
        <Circle
          cx={center}
          cy={center}
          r="4"
          fill="rgba(255,255,255,0.3)"
        />
      </G>
    );
  };

  const renderScale = () => {
    const marks = getScaleMarks();
    
    return (
      <G>
        {marks.map((mark, index) => {
          const tickStart = polarToCartesian(center, center, radius - 5, mark.angle);
          const tickEnd = polarToCartesian(
            center, 
            center, 
            radius - (mark.isMajor ? 20 : 10), 
            mark.angle
          );
          const textPos = polarToCartesian(center, center, radius - 30, mark.angle);
          
          return (
            <G key={index}>
              {/* Tick mark */}
              <Path
                d={`M ${tickStart.x} ${tickStart.y} L ${tickEnd.x} ${tickEnd.y}`}
                stroke="#666666"
                strokeWidth={mark.isMajor ? 2 : 1}
                strokeLinecap="round"
              />
              
              {/* Scale number */}
              {mark.isMajor && (
                <SvgText
                  x={textPos.x}
                  y={textPos.y}
                  fontSize="12"
                  fill="#666666"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontWeight="500"
                >
                  {formatValue(mark.value)}
                </SvgText>
              )}
            </G>
          );
        })}
      </G>
    );
  };

  const renderThresholdArcs = () => {
    const arcs = getThresholdArcs();
    
    return (
      <G>
        {arcs.map((arc, index) => (
          <Path
            key={index}
            d={createArcPath(center, center, radius - 2, arc.startAngle, arc.endAngle)}
            stroke={arc.color}
            strokeWidth="8"
            strokeOpacity={arc.opacity}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </G>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { width: size, height: size },
        { transform: [{ scale: pulseAnim }] },
        style
      ]}
    >
      {/* Header */}
      {(icon || label) && (
        <View style={styles.header}>
          {icon && (
            <Ionicons name={icon} size={24} color={getCurrentColor()} />
          )}
          {label && (
            <Text style={[styles.label, { color: getCurrentColor() }]}>
              {label}
            </Text>
          )}
        </View>
      )}

      {/* SVG Gauge */}
      <View style={styles.gaugeContainer}>
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <LinearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={getCurrentColor()} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={getCurrentColor()} stopOpacity="0.4" />
            </LinearGradient>
          </Defs>
          
          {/* Background arc */}
          <Path
            d={createArcPath(center, center, radius, startAngle, endAngle)}
            stroke={backgroundColor}
            strokeWidth="20"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <Path
            d={createArcPath(center, center, radius, startAngle, valueToAngle(value))}
            stroke="url(#gaugeGradient)"
            strokeWidth="20"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Threshold arcs */}
          {renderThresholdArcs()}
          
          {/* Scale marks */}
          {showScale && renderScale()}
          
          {/* Needle */}
          {showNeedle && renderNeedle()}
        </Svg>
      </View>

      {/* Value display */}
      {showValue && (
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: getCurrentColor() }]}>
            {formatValue(value)}
          </Text>
          <Text style={[styles.unit, { color: getCurrentColor() }]}>
            {unit}
          </Text>
        </View>
      )}

      {/* Status indicator */}
      {(isCritical() || isWarning()) && (
        <View style={styles.statusIndicator}>
          <Ionicons
            name={isCritical() ? 'warning' : 'alert-circle'}
            size={20}
            color={isCritical() ? criticalColor : warningColor}
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  gaugeContainer: {
    position: 'relative',
  },
  svg: {
    backgroundColor: 'transparent',
  },
  valueContainer: {
    position: 'absolute',
    bottom: '30%',
    alignItems: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});

export default SpeedometerGauge;