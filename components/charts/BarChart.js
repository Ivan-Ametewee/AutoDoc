/**
 * BarChart Component
 * Reusable bar chart for displaying OBDII diagnostic data
 * Used for displaying statistical data, comparisons, and distributions
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

const BarChart = ({
  data = [],
  title = '',
  yAxisLabel = '',
  xAxisLabel = '',
  showValues = true,
  showGrid = true,
  animated = true,
  colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5AC8FA'],
  style = {},
  height = 220,
  onBarPress = null,
  formatValue = (value) => value.toString(),
  formatLabel = (label) => label,
  theme = 'light',
  showLegend = false,
  legendPosition = 'bottom',
  maxBars = 10,
  scrollable = false,
  ...props
}) => {
  // Process and validate data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [0],
          colors: [() => '#E0E0E0']
        }]
      };
    }

    // Limit number of bars if specified
    const limitedData = maxBars ? data.slice(0, maxBars) : data;

    // Handle different data formats
    let chartData;
    if (Array.isArray(limitedData[0])) {
      // Multi-dataset format: [[label, value1, value2], ...]
      const labels = limitedData.map(item => formatLabel(item[0]));
      const datasets = [];
      
      // Determine number of datasets
      const datasetCount = limitedData[0].length - 1;
      
      for (let i = 1; i <= datasetCount; i++) {
        datasets.push({
          data: limitedData.map(item => parseFloat(item[i]) || 0),
          color: (opacity = 1) => colors[(i - 1) % colors.length] + Math.floor(opacity * 255).toString(16).padStart(2, '0')
        });
      }
      
      chartData = { labels, datasets };
    } else if (typeof limitedData[0] === 'object') {
      // Object format: [{label: 'A', value: 10}, ...]
      chartData = {
        labels: limitedData.map(item => formatLabel(item.label || item.name || item.x)),
        datasets: [{
          data: limitedData.map(item => parseFloat(item.value || item.y) || 0),
          colors: limitedData.map((_, index) => () => colors[index % colors.length])
        }]
      };
    } else {
      // Simple array format: [10, 20, 30, ...]
      chartData = {
        labels: limitedData.map((_, index) => formatLabel(`Item ${index + 1}`)),
        datasets: [{
          data: limitedData.map(value => parseFloat(value) || 0),
          colors: limitedData.map((_, index) => () => colors[index % colors.length])
        }]
      };
    }

    return chartData;
  }, [data, maxBars, colors, formatLabel]);

  // Chart configuration
  const chartConfig = useMemo(() => {
    const baseConfig = {
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
      backgroundGradientFrom: theme === 'dark' ? '#1a1a1a' : '#ffffff',
      backgroundGradientTo: theme === 'dark' ? '#1a1a1a' : '#ffffff',
      decimalPlaces: 1,
      color: (opacity = 1) => theme === 'dark' ? 
        `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
      labelColor: (opacity = 1) => theme === 'dark' ? 
        `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: colors[0]
      },
      propsForBackgroundLines: {
        strokeDasharray: showGrid ? '5,5' : '0,0',
        stroke: theme === 'dark' ? '#333' : '#e0e0e0',
        strokeWidth: 1
      },
      propsForLabels: {
        fontSize: 12,
        fontFamily: 'System'
      },
      barPercentage: 0.7,
      fillShadowGradient: colors[0],
      fillShadowGradientOpacity: 0.8,
      ...props.chartConfig
    };

    return baseConfig;
  }, [theme, showGrid, colors, props.chartConfig]);

  // Calculate chart width for scrollable charts
  const chartWidth = useMemo(() => {
    if (!scrollable) return screenWidth - 32;
    
    const minBarWidth = 60;
    const padding = 80;
    const calculatedWidth = (processedData.labels.length * minBarWidth) + padding;
    
    return Math.max(screenWidth - 32, calculatedWidth);
  }, [scrollable, processedData.labels.length]);

  // Handle bar press
  const handleBarPress = (data) => {
    if (onBarPress && typeof onBarPress === 'function') {
      onBarPress(data);
    }
  };

  // Render statistics
  const renderStatistics = () => {
    if (!showValues || !processedData.datasets[0]) return null;

    const values = processedData.datasets[0].data;
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return (
      <View style={styles.statisticsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, theme === 'dark' && styles.darkText]}>Total</Text>
          <Text style={[styles.statValue, theme === 'dark' && styles.darkText]}>
            {formatValue(total)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, theme === 'dark' && styles.darkText]}>Average</Text>
          <Text style={[styles.statValue, theme === 'dark' && styles.darkText]}>
            {formatValue(average)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, theme === 'dark' && styles.darkText]}>Max</Text>
          <Text style={[styles.statValue, theme === 'dark' && styles.darkText]}>
            {formatValue(max)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, theme === 'dark' && styles.darkText]}>Min</Text>
          <Text style={[styles.statValue, theme === 'dark' && styles.darkText]}>
            {formatValue(min)}
          </Text>
        </View>
      </View>
    );
  };

  // Render legend
  const renderLegend = () => {
    if (!showLegend || processedData.datasets.length <= 1) return null;

    return (
      <View style={[
        styles.legendContainer,
        legendPosition === 'top' && styles.legendTop
      ]}>
        {processedData.datasets.map((dataset, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[
              styles.legendColor,
              { backgroundColor: colors[index % colors.length] }
            ]} />
            <Text style={[
              styles.legendText,
              theme === 'dark' && styles.darkText
            ]}>
              Dataset {index + 1}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, theme === 'dark' && styles.darkText]}>
        No data available
      </Text>
      <Text style={[styles.emptySubtext, theme === 'dark' && styles.darkText]}>
        Chart will appear when data is loaded
      </Text>
    </View>
  );

  // Main render
  const renderChart = () => (
    <View style={[styles.container, style, theme === 'dark' && styles.darkContainer]}>
      {title && (
        <Text style={[styles.title, theme === 'dark' && styles.darkText]}>
          {title}
        </Text>
      )}
      
      {showLegend && legendPosition === 'top' && renderLegend()}
      
      {processedData.labels[0] === 'No Data' ? renderEmptyState() : (
        <View style={styles.chartContainer}>
          {scrollable ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.scrollContainer}
            >
              <RNBarChart
                data={processedData}
                width={chartWidth}
                height={height}
                chartConfig={chartConfig}
                style={styles.chart}
                verticalLabelRotation={45}
                horizontalLabelRotation={0}
                showValuesOnTopOfBars={showValues}
                fromZero={true}
                onDataPointClick={handleBarPress}
                withInnerLines={showGrid}
                withOuterLines={showGrid}
                yAxisLabel={yAxisLabel}
                yAxisSuffix=""
                withHorizontalLabels={true}
                withVerticalLabels={true}
                {...props}
              />
            </ScrollView>
          ) : (
            <RNBarChart
              data={processedData}
              width={chartWidth}
              height={height}
              chartConfig={chartConfig}
              style={styles.chart}
              verticalLabelRotation={45}
              horizontalLabelRotation={0}
              showValuesOnTopOfBars={showValues}
              fromZero={true}
              onDataPointClick={handleBarPress}
              withInnerLines={showGrid}
              withOuterLines={showGrid}
              yAxisLabel={yAxisLabel}
              yAxisSuffix=""
              withHorizontalLabels={true}
              withVerticalLabels={true}
              {...props}
            />
          )}
          
          {xAxisLabel && (
            <Text style={[styles.xAxisLabel, theme === 'dark' && styles.darkText]}>
              {xAxisLabel}
            </Text>
          )}
        </View>
      )}
      
      {showLegend && legendPosition === 'bottom' && renderLegend()}
      {renderStatistics()}
    </View>
  );

  return renderChart();
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  chartContainer: {
    alignItems: 'center',
  },
  scrollContainer: {
    maxHeight: 300,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  xAxisLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 12,
  },
  legendTop: {
    marginTop: 0,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default BarChart;