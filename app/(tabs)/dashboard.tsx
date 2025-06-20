import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import {
  Car,
  Gauge,
  Thermometer,
  Fuel,
  AlertTriangle,
  Activity,
  Zap,
  Navigation,
} from 'lucide-react-native';

export default function TabsDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Mock real-time data
  const [vehicleData, setVehicleData] = useState({
    speed: 65,
    rpm: 2100,
    engineTemp: 195,
    fuelLevel: 78,
    batteryVoltage: 12.4,
    mileage: 45230,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setVehicleData(prev => ({
        ...prev,
        speed: Math.floor(Math.random() * 80),
        rpm: Math.floor(Math.random() * 3000) + 1000,
      }));
      setRefreshing(false);
    }, 1000);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111111' : '#f5f5f5',
    },
    scrollContent: {
      padding: 16,
    },
    connectionCard: {
      backgroundColor: isDark ? '#1e40af' : '#3b82f6',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    connectionText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 12,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    metricCard: {
      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1f1f1f',
      marginTop: 8,
    },
    metricLabel: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 4,
      textAlign: 'center',
    },
    quickActionsCard: {
      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1f1f1f',
      marginBottom: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    actionText: {
      fontSize: 16,
      color: isDark ? '#ffffff' : '#1f1f1f',
      marginLeft: 12,
      flex: 1,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#10b981',
    },
  });

  type MetricCardProps = {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    value: string | number;
    label: string;
    color?: string;
  };

  const MetricCard = ({
    icon: Icon,
    value,
    label,
    color = isDark ? '#3b82f6' : '#2563eb',
  }: MetricCardProps) => (
    <View style={styles.metricCard}>
      <Icon size={24} color={color} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  type ActionButtonProps = {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    title: string;
    onPress: () => void;
    color?: string;
  };

  const ActionButton = ({
    icon: Icon,
    title,
    onPress,
    color = isDark ? '#6b7280' : '#4b5563',
  }: ActionButtonProps) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Icon size={20} color={color} />
      <Text style={styles.actionText}>{title}</Text>
      <View style={styles.statusIndicator} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Connection Status */}
        <View style={styles.connectionCard}>
          <Car size={24} color="white" />
          <Text style={styles.connectionText}>
            Connected to Vehicle • Live Data
          </Text>
        </View>

        {/* Real-time Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={Gauge}
            value={`${vehicleData.speed} mph`}
            label="Current Speed"
          />
          <MetricCard
            icon={Activity}
            value={`${vehicleData.rpm}`}
            label="Engine RPM"
          />
          <MetricCard
            icon={Thermometer}
            value={`${vehicleData.engineTemp}°F`}
            label="Engine Temp"
            color={vehicleData.engineTemp > 220 ? '#ef4444' : '#10b981'}
          />
          <MetricCard
            icon={Fuel}
            value={`${vehicleData.fuelLevel}%`}
            label="Fuel Level"
            color={vehicleData.fuelLevel < 20 ? '#f59e0b' : '#10b981'}
          />
          <MetricCard
            icon={Zap}
            value={`${vehicleData.batteryVoltage}V`}
            label="Battery"
          />
          <MetricCard
            icon={Navigation}
            value={vehicleData.mileage.toLocaleString()}
            label="Odometer"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <ActionButton
            icon={AlertTriangle}
            title="Check Error Codes"
            onPress={() => router.push('/(tabs)/diagnostics')}
            color="#ef4444"
          />
          
          <ActionButton
            icon={Activity}
            title="View Live Parameters"
            onPress={() => router.push('/dashboard')}
          />
          
          <ActionButton
            icon={Car}
            title="Vehicle Profile"
            onPress={() => router.push('/vehicle-profile')}
          />
        </View>
      </ScrollView>
    </View>
  );
}