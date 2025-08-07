import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
// SafeAreaView removed - using View instead
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';

// Import the single source of truth for all OBD interactions
import OBDIIService from '../../services/obdii/OBDIIService';
import SettingsService from '../../services/settings/SettingsService';
import { UnitConverter } from '../../utils/unitConversion';

const { width } = Dimensions.get('window');

// Define an interface for our dashboard's live data state
interface LiveDataState {
  rpm: number;
  speed: number;
  coolantTemp: number;
  engineLoad: number;
  batteryVoltage: number; // Note: This requires a specific PID like 'CONTROL_MODULE_VOLTAGE'
  fuelLevel: number;
  throttlePosition: number;
  maf: number;
  intakeAirTemp: number;
  odometer: number; // Odometer reading in miles/km
}

export default function DashboardScreen() {
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  // --- State Management ---
  const [liveData, setLiveData] = useState<LiveDataState>({
    rpm: 0, speed: 0, coolantTemp: 0, engineLoad: 0, batteryVoltage: 0,
    fuelLevel: 0, throttlePosition: 0, maf: 0, intakeAirTemp: 0, odometer: 0,
  });
  
  const [connectionStatus, setConnectionStatus] = useState(OBDIIService.getConnectionStatus().status);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [milActive, setMilActive] = useState(false);
  
  // Unit preferences state
  const [tempUnit, setTempUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>('km');

  const quickActions = [
 {
  id: 'diagnostics',
  title: 'Diagnostics',
  icon: 'medical-outline' as const,
  route: '/(tabs)/diagnostics',
  color: '#FF3B30',
 },
 {
  id: 'fraud-detection',
  title: 'Fraud Detection',
  icon: 'shield-checkmark-outline' as const,
  route: '/fraud-detection',
  color: '#9C27B0',
 },
 {
  id: 'history',
  title: 'History',
  icon: 'time-outline' as const,
  route: '/(tabs)/history',
  color: '#007AFF',
 },
 {
  id: 'alerts',
  title: 'Alerts',
  icon: 'notifications-outline' as const,
  route: '/alerts',
  color: '#FF9500',
 },
 {
  id: 'reports',
  title: 'Reports',
  icon: 'document-text-outline' as const,
  route: '/reports',
  color: '#34C759',
 },

 ];


  // --- Data Subscription and Live Polling ---
  useFocusEffect(
    useCallback(() => {
      // Initialize unit preferences from settings
      const initializeSettings = async () => {
        const loadedSettings = await SettingsService.loadSettings();
        setTempUnit(loadedSettings.temperature_unit);
        setDistanceUnit(loadedSettings.distance_unit);
      };
      
      initializeSettings();
      
      // Listen for settings changes
      const handleSettingsChange = () => {
        setTempUnit(SettingsService.getTemperatureUnit());
        setDistanceUnit(SettingsService.getDistanceUnit());
      };
      
      SettingsService.on('settingChanged:temperature_unit', handleSettingsChange);
      SettingsService.on('settingChanged:distance_unit', handleSettingsChange);
      
      const onDataUpdate = (event: string, data: any) => {
        console.log(`[Dashboard] Received Event: ${event}`, JSON.stringify(data)); 
        if (event === 'connectionStatus') {
          setConnectionStatus(data.status);
          if (data.status !== 'connected') {
            router.replace('/'); // Go back to home if connection is lost
          }
        } else if (event === 'dataUpdate') {
          // Use a functional state update for better performance
          setLiveData(prevData => {
            // Create a mutable copy
            const newData = { ...prevData };
            // Update the copy based on the PID name from the service
            switch (data.name) {
              case 'ENGINE_RPM':
                newData.rpm = data.value;
                break;
              case 'VEHICLE_SPEED':
                newData.speed = data.value;
                break;
              case 'ENGINE_COOLANT_TEMP':
                newData.coolantTemp = data.value;
                break;
              case 'ENGINE_LOAD':
                newData.engineLoad = data.value;
                break;
              case 'FUEL_LEVEL':
                newData.fuelLevel = data.value;
                break;
              case 'THROTTLE_POSITION':
                  newData.throttlePosition = data.value;
                  break;
              case 'MAF_RATE':
                  newData.maf = data.value;
                  break;
              case 'INTAKE_AIR_TEMP':
              case 'AIR_INTAKE_TEMP':
                  newData.intakeAirTemp = data.value;
                  break;
              // Note: A real PID for battery voltage would be needed here
              case 'CONTROL_MODULE_VOLTAGE':
                  newData.batteryVoltage = data.value;
                  break;
              case 'ODOMETER':
              case 'VEHICLE_ODOMETER':
              case 'TOTAL_DISTANCE':
              case 'TOTAL_DISTANCE_TRAVELED':
                  // Convert km to miles for display (MockDataGenerator outputs km)
                  const kmValue = data.value;
                  const milesValue = kmValue * 0.621371; // Convert km to miles
                  newData.odometer = milesValue;
                  
                  // Log odometer updates for debugging fraud detection
                  console.log(`[Dashboard] Odometer update: ${kmValue} km (${milesValue.toFixed(0)} mi) from PID: ${data.name}`);
                  break;
            }
            return newData; // Return the updated state
          });
        } else if (event === 'milStatus') {
          setMilActive(data.active);
        }
      };
      
      const unsubscribe = OBDIIService.subscribe(onDataUpdate);

      // Start the live data stream when the screen is focused
      if (OBDIIService.getConnectionStatus().status === 'connected') {
        OBDIIService.startLiveData();
        
        // Query MIL status initially and then periodically
        const queryMIL = async () => {
          try {
            const milData = await OBDIIService.queryMILStatus();
            setMilActive(milData.milActive);
          } catch (error) {
            console.error('Failed to query MIL status:', error);
          }
        };
        
        // Query immediately
        queryMIL();
        
        // Query every 10 seconds
        const milInterval = setInterval(queryMIL, 10000);
        
        // Store interval ID for cleanup
        (unsubscribe as any).milInterval = milInterval;
      }

      // Cleanup function runs when the screen goes out of focus
      return () => {
        OBDIIService.stopLiveData();
        
        // Clear MIL query interval if it exists
        if ((unsubscribe as any).milInterval) {
          clearInterval((unsubscribe as any).milInterval);
        }
        
        // Remove settings listeners
        SettingsService.removeListener('settingChanged:temperature_unit', handleSettingsChange);
        SettingsService.removeListener('settingChanged:distance_unit', handleSettingsChange);
        
        unsubscribe();
      };
    }, [])
  );

  // --- UI Handlers ---
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // You can add logic to re-fetch static data like VIN here
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const handleDisconnect = async () => {
    await OBDIIService.disconnect();
    router.replace('/');
  };

  const handleQuickAction = (route: string) => router.push(route as any);
  
  const formatValue = (value: number | undefined, decimals = 0): string => {
    return (typeof value === 'number' && !isNaN(value)) ? value.toFixed(decimals) : '--';
  };

  // --- Render Logic ---
  if (connectionStatus !== 'connected') {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.statusText}>Connection lost. Reconnecting...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Dashboard</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
            <Text style={[styles.statusText, { color: '#34C759' }]}>Connected</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
          <Ionicons name="power" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#8E8E93" />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engine Status</Text>
          <View style={styles.primaryGauges}>
            <View style={styles.gaugeCard}>
              <Text style={styles.gaugeLabel}>RPM</Text>
              <Text style={styles.gaugeValue}>{formatValue(liveData.rpm)}</Text>
              <Text style={styles.gaugeUnit}>rpm</Text>
            </View>
            <View style={styles.gaugeCard}>
              <Text style={styles.gaugeLabel}>Speed</Text>
              <Text style={styles.gaugeValue}>{formatValue(UnitConverter.convertSpeed(liveData.speed, true))}</Text>
              <Text style={styles.gaugeUnit}>{distanceUnit === 'miles' ? 'mph' : 'km/h'}</Text>
            </View>
          </View>
        </View>

        {/* Check Engine Light / MIL Indicator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusIndicators}>
            <View style={[styles.statusCard, milActive ? styles.statusCardActive : styles.statusCardInactive]}>
              <Ionicons 
                name="warning" 
                size={24} 
                color={milActive ? '#FF3B30' : '#8E8E93'} 
              />
              <Text style={[styles.statusLabel, { color: milActive ? '#FF3B30' : '#8E8E93' }]}>
                Check Engine
              </Text>
              <Text style={[styles.statusValue, { color: milActive ? '#FF3B30' : '#8E8E93' }]}>
                {milActive ? 'ACTIVE' : 'OFF'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <MaterialIcons name="speed" size={20} color="#8E44AD" />
              <Text style={styles.metricLabel}>Odometer</Text>
              <Text style={styles.metricValue}>{formatValue(UnitConverter.convertDistance(liveData.odometer, true), 0)} {distanceUnit === 'miles' ? 'mi' : 'km'}</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="thermometer" size={20} color="#FF6B35" />
              <Text style={styles.metricLabel}>Coolant Temp</Text>
              <Text style={styles.metricValue}>{formatValue(UnitConverter.convertTemperature(liveData.coolantTemp, true))}{tempUnit === 'fahrenheit' ? '°F' : '°C'}</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="car" size={20} color="#007AFF" />
              <Text style={styles.metricLabel}>Engine Load</Text>
              <Text style={styles.metricValue}>{formatValue(liveData.engineLoad, 1)}%</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="battery-half" size={20} color="#34C759" />
              <Text style={styles.metricLabel}>Battery</Text>
              <Text style={styles.metricValue}>{formatValue(liveData.batteryVoltage, 1)}V</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="water" size={20} color="#5AC8FA" />
              <Text style={styles.metricLabel}>Fuel Level</Text>
              <Text style={styles.metricValue}>{formatValue(liveData.fuelLevel, 1)}%</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="speedometer" size={20} color="#FF9500" />
              <Text style={styles.metricLabel}>Throttle</Text>
              <Text style={styles.metricValue}>{formatValue(liveData.throttlePosition, 1)}%</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="logo-buffer" size={20} color="#AF52DE" />
              <Text style={styles.metricLabel}>MAF</Text>
              <Text style={styles.metricValue}>{formatValue(liveData.maf, 1)} g/s</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="thermometer-outline" size={20} color="#FF6B35" />
              <Text style={styles.metricLabel}>Intake Air Temp</Text>
              <Text style={styles.metricValue}>{formatValue(UnitConverter.convertTemperature(liveData.intakeAirTemp, true))}{tempUnit === 'fahrenheit' ? '°F' : '°C'}</Text>
            </View>
          </View>
        </View>
          <View style={styles.section}>
   <Text style={styles.sectionTitle}>Quick Actions</Text>
   <View style={styles.quickActions}>
   {quickActions.map((action, index) => (
    <TouchableOpacity
    key={`${action.id}-${index}`}
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

  <View style={styles.section}>
   <View style={styles.sectionHeader}>
   <Text style={styles.sectionTitle}>Recent Activity</Text>
   <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
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
    <Text style={styles.activityText}>Low fuel level detected</Text>
    <Text style={styles.activityTime}>1 hour ago</Text>
   </View>
   </View>
  </View>
        
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
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
    color: theme.colors.text,
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
    color: theme.colors.text,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  primaryGauges: {
    flexDirection: 'row',
    gap: 12,
  },
  gaugeCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.dark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  gaugeLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  gaugeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  gaugeUnit: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 52) / 2, // 20 padding on each side, 12 gap
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.dark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
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
  statusIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
  },
  statusCardActive: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  statusCardInactive: {
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },

});