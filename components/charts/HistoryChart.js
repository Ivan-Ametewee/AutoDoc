/**
 * HistoryChart Component
 * Specialized chart for displaying historical OBDII data over time
 * Supports multiple parameters, time range selection, and interactive features
 */

import { useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

const HistoryChart = ({
  data = [],
  title = 'Historical Data',
  parameters = ['rpm', 'speed', 'coolantTemp'],
  timeRange = '24h',
  showControls = true,
  showStats = true,
  showGrid = true,
  animated = true,
  colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5AC8FA'],
  style = {},
  height = 300,
  theme = 'light',
  onTimeRangeChange = null,
  onParameterToggle = null,
  onDataPointPress = null,
  aggregationType = 'average', // 'average', 'max', 'min', 'sum'
  showLegend = true,
  exportable = false,
  onExport = null,
  ...props
}) => {
  // State management
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedParameters, setSelectedParameters] = useState(parameters);
  const [showParameterModal, setShowParameterModal] = useState(false);
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);

  // Available time ranges
  const timeRanges = [
    { key: '1h', label: 'Last Hour', hours: 1 },
    { key: '6h', label: 'Last 6 Hours', hours: 6 },
    { key: '24h', label: 'Last 24 Hours', hours: 24 },
    { key: '7d', label: 'Last 7 Days', hours: 168 },
    { key: '30d', label: 'Last 30 Days', hours: 720 },
    { key: '90d', label: 'Last 90 Days', hours: 2160 }
  ];

  // Available parameters with display names and units
  const availableParameters = {
    rpm: { label: 'RPM', unit: 'rpm', color: '#007AFF' },
    speed: { label: 'Speed', unit: 'km/h', color: '#34C759' },
    coolantTemp: { label: 'Coolant Temp', unit: '°C', color: '#FF9500' },
    engineLoad: { label: 'Engine Load', unit: '%', color: '#FF3B30' },
    throttlePos: { label: 'Throttle Position', unit: '%', color: '#AF52DE' },
    fuelLevel: { label: 'Fuel Level', unit: '%', color: '#5AC8FA' },
    oilTemp: { label: 'Oil Temperature', unit: '°C', color: '#FF2D92' },
    batteryVoltage: { label: 'Battery Voltage', unit: 'V', color: '#30D158' },
    airIntakeTemp: { label: 'Air Intake Temp', unit: '°C', color: '#64D2FF' },
    manifoldPressure: { label: 'Manifold Pressure', unit: 'kPa', color: '#BF5AF2' }
  };

  // Process and filter data based on time range and parameters
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [],
        isEmpty: true
      };
    }

    // Filter data by time range
    const now = new Date();
    const timeRangeConfig = timeRanges.find(tr => tr.key === selectedTimeRange);
    const hoursBack = timeRangeConfig ? timeRangeConfig.hours : 24;
    const cutoffTime = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000));

    const filteredData = data.filter(item => {
      const itemTime = new Date(item.timestamp || item.time);
      return itemTime >= cutoffTime;
    });

    if (filteredData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [],
        isEmpty: true
      };
    }

    // Group data by time intervals for better visualization
    const groupedData = groupDataByInterval(filteredData, selectedTimeRange);

    // Generate labels based on grouped data
    const labels = groupedData.map(item => formatTimeLabel(item.timestamp, selectedTimeRange));

    // Create datasets for each selected parameter
    const datasets = selectedParameters.map((param, index) => {
      const paramConfig = availableParameters[param];
      if (!paramConfig) return null;

      const paramData = groupedData.map(item => {
        const values = item.data.map(d => parseFloat(d[param]) || 0).filter(v => !isNaN(v));
        if (values.length === 0) return 0;

        switch (aggregationType) {
          case 'max': return Math.max(...values);
          case 'min': return Math.min(...values);
          case 'sum': return values.reduce((a, b) => a + b, 0);
          case 'average':
          default: return values.reduce((a, b) => a + b, 0) / values.length;
        }
      });

      return {
        data: paramData,
        color: (opacity = 1) => paramConfig.color + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
        strokeWidth: 2,
        withDots: groupedData.length <= 20,
        withScrollableDot: true,
        label: paramConfig.label,
        unit: paramConfig.unit
      };
    }).filter(Boolean);

    return {
      labels,
      datasets,
      isEmpty: false,
      rawData: groupedData
    };
  }, [data, selectedTimeRange, selectedParameters, aggregationType]);

  // Group data by appropriate intervals based on time range
  const groupDataByInterval = (data, timeRange) => {
    const intervals = {
      '1h': 5, // 5 minute intervals
      '6h': 30, // 30 minute intervals
      '24h': 60, // 1 hour intervals
      '7d': 360, // 6 hour intervals
      '30d': 1440, // 1 day intervals
      '90d': 4320 // 3 day intervals
    };

    const intervalMinutes = intervals[timeRange] || 60;
    const intervalMs = intervalMinutes * 60 * 1000;

    const grouped = [];
    const sortedData = [...data].sort((a, b) => 
      new Date(a.timestamp || a.time) - new Date(b.timestamp || b.time)
    );

    if (sortedData.length === 0) return [];

    let currentGroup = {
      timestamp: new Date(Math.floor(new Date(sortedData[0].timestamp || sortedData[0].time).getTime() / intervalMs) * intervalMs),
      data: []
    };

    sortedData.forEach(item => {
      const itemTime = new Date(item.timestamp || item.time);
      const groupTime = new Date(Math.floor(itemTime.getTime() / intervalMs) * intervalMs);

      if (groupTime.getTime() === currentGroup.timestamp.getTime()) {
        currentGroup.data.push(item);
      } else {
        if (currentGroup.data.length > 0) {
          grouped.push(currentGroup);
        }
        currentGroup = {
          timestamp: groupTime,
          data: [item]
        };
      }
    });

    if (currentGroup.data.length > 0) {
      grouped.push(currentGroup);
    }

    return grouped;
  };

  // Format time labels based on time range
  const formatTimeLabel = (timestamp, timeRange) => {
    const date = new Date(timestamp);
    
    switch (timeRange) {
      case '1h':
      case '6h':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      case '24h':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit',
          hour12: false 
        });
      case '7d':
        return date.toLocaleDateString('en-US', { 
          weekday: 'short',
          hour: '2-digit',
          hour12: false 
        });
      case '30d':
      case '90d':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      default:
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
    }
  };

  // Chart configuration
  const chartConfig = useMemo(() => ({
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
      r: '4',
      strokeWidth: '2',
    },
    propsForBackgroundLines: {
      strokeDasharray: showGrid ? '5,5' : '0,0',
      stroke: theme === 'dark' ? '#333' : '#e0e0e0',
      strokeWidth: 1
    },
    strokeWidth: 2,
    useShadowColorFromDataset: false,
    ...props.chartConfig
  }), [theme, showGrid, props.chartConfig]);

  // Handle time range change
  const handleTimeRangeChange = (newRange) => {
    setSelectedTimeRange(newRange);
    setShowTimeRangeModal(false);
    if (onTimeRangeChange) {
      onTimeRangeChange(newRange);
    }
  };

  // Handle parameter toggle
  const handleParameterToggle = (parameter) => {
    const newParameters = selectedParameters.includes(parameter)
      ? selectedParameters.filter(p => p !== parameter)
      : [...selectedParameters, parameter];
    
    if (newParameters.length === 0) {
      Alert.alert('Error', 'At least one parameter must be selected');
      return;
    }

    setSelectedParameters(newParameters);
    if (onParameterToggle) {
      onParameterToggle(newParameters);
    }
  };

  // Handle data point press
  const handleDataPointPress = (data) => {
    setSelectedDataPoint(data);
    if (onDataPointPress) {
      onDataPointPress(data);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    if (processedData.isEmpty || !processedData.datasets.length) return null;

    return processedData.datasets.map(dataset => {
      const values = dataset.data.filter(v => !isNaN(v) && v !== null);
      if (values.length === 0) return null;

      const total = values.reduce((sum, val) => sum + val, 0);
      const average = total / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);

      return {
        label: dataset.label,
        unit: dataset.unit,
        average: average.toFixed(1),
        max: max.toFixed(1),
        min: min.toFixed(1),
        color: dataset.color()
      };
    }).filter(Boolean);
  };

  // Render controls
  const renderControls = () => {
    if (!showControls) return null;

    return (
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowTimeRangeModal(true)}
        >
          <Text style={[styles.controlButtonText, theme === 'dark' && styles.darkText]}>
            {timeRanges.find(tr => tr.key === selectedTimeRange)?.label || 'Time Range'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowParameterModal(true)}
        >
          <Text style={[styles.controlButtonText, theme === 'dark' && styles.darkText]}>
            Parameters ({selectedParameters.length})
          </Text>
        </TouchableOpacity>

        {exportable && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onExport}
          >
            <Text style={[styles.controlButtonText, theme === 'dark' && styles.darkText]}>
              Export
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render legend
  const renderLegend = () => {
    if (!showLegend || processedData.isEmpty) return null;

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.legendScrollContainer}
      >
        <View style={styles.legendContainer}>
          {processedData.datasets.map((dataset, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[
                styles.legendColor,
                { backgroundColor: dataset.color() }
              ]} />
              <Text style={[
                styles.legendText,
                theme === 'dark' && styles.darkText
              ]}>
                {dataset.label} ({dataset.unit})
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Render statistics
  const renderStatistics = () => {
    if (!showStats) return null;

    const stats = calculateStats();
    if (!stats || stats.length === 0) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={[styles.statsTitle, theme === 'dark' && styles.darkText]}>
          Statistics ({aggregationType})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <View style={[styles.statColorBar, { backgroundColor: stat.color }]} />
                  <Text style={[styles.statLabel, theme === 'dark' && styles.darkText]}>
                    {stat.label}
                  </Text>
                </View>
                <View style={styles.statValues}>
                  <Text style={[styles.statValue, theme === 'dark' && styles.darkText]}>
                    Avg: {stat.average} {stat.unit}
                  </Text>
                  <Text style={[styles.statValue, theme === 'dark' && styles.darkText]}>
                    Max: {stat.max} {stat.unit}
                  </Text>
                  <Text style={[styles.statValue, theme === 'dark' && styles.darkText]}>
                    Min: {stat.min} {stat.unit}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render parameter selection modal
  const renderParameterModal = () => (
    <Modal
      visible={showParameterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowParameterModal(false)}
    >
      <View style={[styles.modalContainer, theme === 'dark' && styles.darkModalContainer]}>
        <View style={[styles.modalContent, theme === 'dark' && styles.darkModalContent]}>
          <Text style={[styles.modalTitle, theme === 'dark' && styles.darkText]}>
            Select Parameters
          </Text>
          <ScrollView style={styles.modalScroll}>
            {Object.entries(availableParameters).map(([key, param]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.parameterItem,
                  selectedParameters.includes(key) && styles.selectedParameterItem,
                  theme === 'dark' && styles.darkParameterItem
                ]}
                onPress={() => handleParameterToggle(key)}
              >
                <View style={[styles.parameterColor, { backgroundColor: param.color }]} />
                <Text style={[styles.parameterText, theme === 'dark' && styles.darkText]}>
                  {param.label} ({param.unit})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowParameterModal(false)}
          >
            <Text style={styles.modalButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Render time range selection modal
  const renderTimeRangeModal = () => (
    <Modal
      visible={showTimeRangeModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTimeRangeModal(false)}
    >
      <View style={[styles.modalContainer, theme === 'dark' && styles.darkModalContainer]}>
        <View style={[styles.modalContent, theme === 'dark' && styles.darkModalContent]}>
          <Text style={[styles.modalTitle, theme === 'dark' && styles.darkText]}>
            Select Time Range
          </Text>
          <ScrollView style={styles.modalScroll}>
            {timeRanges.map(range => (
              <TouchableOpacity
                key={range.key}
                style={[
                  styles.timeRangeItem,
                  selectedTimeRange === range.key && styles.selectedTimeRangeItem,
                  theme === 'dark' && styles.darkTimeRangeItem
                ]}
                onPress={() => handleTimeRangeChange(range.key)}
              >
                <Text style={[styles.timeRangeText, theme === 'dark' && styles.darkText]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowTimeRangeModal(false)}
          >
            <Text style={styles.modalButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Main render
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, theme === 'dark' && styles.darkText]}>{title}</Text>
      {renderControls()}
      <View>
        {renderLegend()}
      </View>
      
      {processedData.isEmpty ? (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, theme === 'dark' && styles.darkText]}>
            No data available for the selected time range
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={processedData}
            width={Math.max(screenWidth, processedData.labels.length * 50)}
            height={height}
            chartConfig={chartConfig}
            bezier
            withVerticalLabels
            withHorizontalLines={showGrid}
            withVerticalLines={showGrid}
            withInnerLines={showGrid}
            onDataPointClick={handleDataPointPress}
            style={styles.chart}
          />
        </ScrollView>
      )}

      {renderStatistics()}
      {renderParameterModal()}
      {renderTimeRangeModal()}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  controlsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  controlButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
  legendScrollContainer: {
    marginBottom: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
  statsContainer: {
    marginTop: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
    minWidth: 150,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statColorBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statValues: {
    gap: 2,
  },
  statValue: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalScroll: {
    marginBottom: 16,
  },
  parameterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedParameterItem: {
    backgroundColor: '#f0f0f0',
  },
  parameterColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  parameterText: {
    fontSize: 16,
  },
  timeRangeItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedTimeRangeItem: {
    backgroundColor: '#f0f0f0',
  },
  timeRangeText: {
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  darkText: {
    color: '#fff',
  },
  darkModalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  darkModalContent: {
    backgroundColor: '#1a1a1a',
  },
  darkParameterItem: {
    borderColor: '#333',
  },
  darkTimeRangeItem: {
    borderColor: '#333',
  },
});

export default HistoryChart;