import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

const LineChart = ({
  data,
  title = '',
  yAxisSuffix = '',
  color = '#3B82F6',
  backgroundColor = '#1F2937',
  showGrid = true,
  bezier = false,
  height = 220,
  style = {},
  ...props
}) => {
  // Default chart configuration
  const chartConfig = {
    backgroundColor: backgroundColor,
    backgroundGradientFrom: backgroundColor,
    backgroundGradientTo: backgroundColor,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: showGrid ? '5,5' : '0,0',
      stroke: 'rgba(255, 255, 255, 0.1)',
    },
    propsForLabels: {
      fontSize: 12,
    },
    ...props.chartConfig,
  };

  // Format data for chart
  const formatData = (rawData) => {
    if (!rawData || !rawData.length) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [0],
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        }],
      };
    }

    // Extract labels and values
    const labels = rawData.map(item => item.label || item.time || '');
    const values = rawData.map(item => item.value || item.y || 0);

    return {
      labels: labels.slice(-10), // Show last 10 data points
      datasets: [{
        data: values.slice(-10),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const chartData = formatData(data);

  return (
    <View style={[styles.container, style]}>
      <RNLineChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        yAxisSuffix={yAxisSuffix}
        chartConfig={chartConfig}
        bezier={bezier}
        style={styles.chart}
        withInnerLines={showGrid}
        withOuterLines={true}
        withHorizontalLines={showGrid}
        withVerticalLines={false}
        withDots={true}
        withShadow={false}
        segments={4}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default LineChart;