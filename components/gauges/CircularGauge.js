import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

const CircularGauge = ({
  value = 0,
  maxValue = 100,
  minValue = 0,
  unit = '',
  title = '',
  size = 120,
  strokeWidth = 8,
  color = '#2196F3',
  backgroundColor = '#e0e0e0',
  warningZone = null,
  dangerZone = null,
  style = {}
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  // Calculate percentage and clamp between 0 and 1
  const normalizedValue = Math.max(0, Math.min(maxValue, value));
  const percentage = (normalizedValue - minValue) / (maxValue - minValue);
  const strokeDashoffset = circumference * (1 - percentage);
  
  // Determine color based on warning/danger zones
  let currentColor = color;
  if (dangerZone && value >= dangerZone) {
    currentColor = '#F44336'; // Red
  } else if (warningZone && value >= warningZone) {
    currentColor = '#FF9800'; // Orange
  }

  // Create tick marks
  const createTickMarks = () => {
    const ticks = [];
    const numTicks = 8;
    const angleStep = (2 * Math.PI) / numTicks;
    
    for (let i = 0; i <= numTicks; i++) {
      const angle = -Math.PI / 2 + (i * angleStep * 0.75); // 270 degree arc
      const isMainTick = i % 2 === 0;
      const tickLength = isMainTick ? 12 : 6;
      const tickWidth = isMainTick ? 2 : 1;
      
      const x1 = center + (radius - strokeWidth / 2) * Math.cos(angle);
      const y1 = center + (radius - strokeWidth / 2) * Math.sin(angle);
      const x2 = center + (radius - strokeWidth / 2 - tickLength) * Math.cos(angle);
      const y2 = center + (radius - strokeWidth / 2 - tickLength) * Math.sin(angle);
      
      ticks.push(
        <Path
          key={i}
          d={`M ${x1} ${y1} L ${x2} ${y2}`}
          stroke="#666"
          strokeWidth={tickWidth}
          strokeLinecap="round"
        />
      );
      
      // Add labels for main ticks
      if (isMainTick && i <= numTicks * 0.75) {
        const labelValue = Math.round((i / (numTicks * 0.75)) * maxValue);
        const textX = center + (radius - strokeWidth / 2 - tickLength - 15) * Math.cos(angle);
        const textY = center + (radius - strokeWidth / 2 - tickLength - 15) * Math.sin(angle);
        
        ticks.push(
          <SvgText
            key={`label-${i}`}
            x={textX}
            y={textY}
            fontSize="10"
            fill="#666"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {labelValue}
          </SvgText>
        );
      }
    }
    
    return ticks;
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={-circumference * 0.125}
          strokeLinecap="round"
        />
        
        {/* Warning zone */}
        {warningZone && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#FF9800"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.75 * (dangerZone - warningZone) / maxValue} ${circumference}`}
            strokeDashoffset={-circumference * (0.125 + 0.75 * warningZone / maxValue)}
            strokeLinecap="round"
            opacity={0.3}
          />
        )}
        
        {/* Danger zone */}
        {dangerZone && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#F44336"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.75 * (maxValue - dangerZone) / maxValue} ${circumference}`}
            strokeDashoffset={-circumference * (0.125 + 0.75 * dangerZone / maxValue)}
            strokeLinecap="round"
            opacity={0.3}
          />
        )}
        
        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={currentColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={-circumference * 0.125 + strokeDashoffset * 0.75}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        
        {/* Tick marks */}
        {createTickMarks()}
        
        {/* Center dot */}
        <Circle
          cx={center}
          cy={center}
          r={4}
          fill={currentColor}
        />
      </Svg>
      
      {/* Value display */}
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: currentColor }]}>
          {typeof value === 'number' ? value.toFixed(0) : value}
        </Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      
      {/* Title */}
      {title && <Text style={styles.title}>{title}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  valueContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 10,
    color: '#666',
    marginTop: -2,
  },
  title: {
    position: 'absolute',
    bottom: -25,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default CircularGauge;