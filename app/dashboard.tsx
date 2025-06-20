import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface VehicleData {
  rpm: number;
  speed: number;
  engineTemp: number;
  fuelLevel: number;
  batteryVoltage: number;
  engineLoad: number;
  maf: number; // Mass Air Flow
  throttlePosition: number;
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

export default function DashboardScreen() {
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    rpm: 850,
    speed: 0,
    engineTemp: 89,
    fuelLevel: 78,
    batteryVoltage: 12.4,
    engineLoad: 15,
    maf: 2.8,
    throttlePosition: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');

  const quickActions: QuickAction[] = [
    {
      id: 'diagnostics',
      title: 'Diagnostics',
      icon: 'medical',
      route: '/diagnostics',
      color: '#FF3B30',
    },
    {
      id: 'history',
      title: 'History',
      icon: 'time',
      route: '/history',
      color: '#007AFF',
    },
    {
      id: 'alerts',
      title: 'Alerts',
      icon: 'notifications',
      route: '/alerts',
      color: '#FF9500',
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: 'document-text',
      route: '/reports',
      color: '#34C759',
    },
  ];

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicleData(prev => ({
        ...prev,
        rpm: Math.max(700, prev.rpm + (Math.random() - 0.5) * 100),
        speed: Math.max(0, prev.speed + (Math.random() - 0.5) * 5),
        engineTemp: Math.max(80, Math.min(110, prev.engineTemp + (Math.random() - 0.5) * 2)),
        engineLoad: Math.max(10, Math.min(90, prev.engineLoad + (Math.random() - 0.5) * 10)),
        maf: Math.max(1, Math.min(10, prev.maf + (Math.random() - 0.5) * 0.5)),
        throttlePosition: Math.max(0, Math.min(100, prev.throttlePosition + (Math.random() - 0.5) * 10)),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Reset some values to simulate fresh data
    setVehicleData(prev => ({
      ...prev,
      rpm: 850,
      speed: 0,
      engineLoad: 15,
      throttlePosition: 0,
    }));
    
    setIsRefreshing(false);
  };

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  const handleDisconnect = () => {
    router.replace('/');
  };

  const formatValue = (value: number, decimals: number = 0): string => {
    return value.toFixed(decimals);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#34C759';
      case 'disconnected':
        return '#8E8E93';
      case 'error':
        return '#FF3B30';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Dashboard</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
          <Ionicons name="power" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Primary Gauges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engine Status</Text>
          <View style={styles.primaryGauges}>
            <View style={styles.gaugeCard}>
              <Text style={styles.gaugeLabel}>RPM</Text>
              <Text style={styles.gaugeValue}>{formatValue(vehicleData.rpm)}</Text>
              <Text style={styles.gaugeUnit}>rpm</Text>
            </View>
            <View style={styles.gaugeCard}>
              <Text style={styles.gaugeLabel}>Speed</Text>
              <Text style={styles.gaugeValue}>{formatValue(vehicleData.speed)}</Text>
              <Text style={styles.gaugeUnit}>mph</Text>
            </View>
          </View>
        </View>

        {/* Secondary Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Ionicons name="thermometer" size={20} color="#FF6B35" />
              <Text style={styles.metricLabel}>Engine Temp</Text>
              <Text style={styles.metricValue}>{formatValue(vehicleData.engineTemp)}°C</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Ionicons name="car" size={20} color="#007AFF" />
              <Text style={styles.metricLabel}>Engine Load</Text>
              <Text style={styles.metricValue}>{formatValue(vehicleData.engineLoad)}%</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Ionicons name="battery-half" size={20} color="#34C759" />
              <Text style={styles.metricLabel}>Battery</Text>
              <Text style={styles.metricValue}>{formatValue(vehicleData.batteryVoltage, 1)}V</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Ionicons name="water" size={20} color="#5AC8FA" />
              <Text style={styles.metricLabel}>Fuel Level</Text>
              <Text style={styles.metricValue}>{formatValue(vehicleData.fuelLevel)}%</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Ionicons name="speedometer" size={20} color="#FF9500" />
              <Text style={styles.metricLabel}>Throttle</Text>
              <Text style={styles.metricValue}>{formatValue(vehicleData.throttlePosition)}%</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Ionicons name="logo-buffer" size={20} color="#AF52DE" />
              <Text style={styles.metricLabel}>MAF</Text>
              <Text style={styles.metricValue}>{formatValue(vehicleData.maf, 1)} g/s</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { borderColor: action.color }]}
                onPress={() => handleQuickAction(action.route)}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.activityText}>System scan completed - No issues found</Text>
              <Text style={styles.activityTime}>2 min ago</Text>
            </View>
            
            <View style={styles.activityItem}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.activityText}>Engine temperature within normal range</Text>
              <Text style={styles.activityTime}>5 min ago</Text>
            </View>
            
            <View style={styles.activityItem}>
              <Ionicons name="warning" size={20} color="#FF9500" />
              <Text style={styles.activityText}>Low fuel level detected (78%)</Text>
              <Text style={styles.activityTime}>1 hour ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disconnectButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  primaryGauges: {
    flexDirection: 'row',
    gap: 12,
  },
  gaugeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  gaugeLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  gaugeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  gaugeUnit: {
    fontSize: 12,
    color: '#8E8E93',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
});