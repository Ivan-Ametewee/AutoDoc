import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  useColorScheme,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  Settings,
  Bluetooth,
  Wifi,
  Bell,
  Moon,
  Sun,
  Car,
  Database,
  Share2,
  HelpCircle,
  Shield,
  Info,
  ChevronRight,
  Download,
  Trash2,
} from 'lucide-react-native';

export default function TabsSettings() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Settings state
  const [settings, setSettings] = useState({
    darkMode: isDark,
    notifications: true,
    autoConnect: true,
    dataLogging: true,
    backgroundSync: false,
    soundAlerts: true,
    vibration: true,
    autoScan: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const clearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all diagnostic history and cached data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          Alert.alert('Success', 'All data has been cleared');
        }}
      ]
    );
  };

  const exportData = () => {
    Alert.alert(
      'Export Data',
      'Export your diagnostic history and vehicle data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
          Alert.alert('Success', 'Data exported successfully');
        }}
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111111' : '#f5f5f5',
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
    },
    sectionHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2a2a2a' : '#e5e7eb',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1f1f1f',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2a2a2a' : '#f3f4f6',
    },
    lastSettingRow: {
      borderBottomWidth: 0,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      color: isDark ? '#ffffff' : '#1f1f1f',
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      lineHeight: 16,
    },
    settingValue: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginRight: 8,
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#10b981',
      marginRight: 8,
    },
    statusText: {
      fontSize: 14,
      color: isDark ? '#ffffff' : '#1f1f1f',
      flex: 1,
    },
    dangerRow: {
      borderBottomColor: isDark ? '#371715' : '#fef2f2',
    },
    dangerTitle: {
      color: '#ef4444',
    },
    dangerDescription: {
      color: '#ef4444',
      opacity: 0.8,
    },
    versionInfo: {
      alignItems: 'center',
      padding: 20,
    },
    versionText: {
      fontSize: 12,
      color: isDark ? '#6b7280' : '#9ca3af',
      textAlign: 'center',
      lineHeight: 18,
    },
  });

  type SettingRowProps = {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    title: string;
    description?: string;
    value?: string;
    onPress?: () => void;
    hasSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: () => void;
    isDanger?: boolean;
    isLast?: boolean;
  };

  const SettingRow: React.FC<SettingRowProps> = ({ 
    icon: Icon, 
    title, 
    description, 
    value, 
    onPress, 
    hasSwitch, 
    switchValue, 
    onSwitchChange,
    isDanger = false,
    isLast = false 
  }) => (
    <TouchableOpacity
      style={[
        styles.settingRow,
        isLast && styles.lastSettingRow,
        isDanger && styles.dangerRow
      ]}
      onPress={onPress}
      disabled={hasSwitch}
    >
      <View style={styles.settingIcon}>
        <Icon 
          size={20} 
          color={isDanger ? '#ef4444' : (isDark ? '#9ca3af' : '#6b7280')} 
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[
          styles.settingTitle,
          isDanger && styles.dangerTitle
        ]}>
          {title}
        </Text>
        {description && (
          <Text style={[
            styles.settingDescription,
            isDanger && styles.dangerDescription
          ]}>
            {description}
          </Text>
        )}
      </View>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#767577', true: '#3b82f6' }}
          thumbColor={switchValue ? '#ffffff' : '#f4f3f4'}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          <ChevronRight size={16} color={isDark ? '#6b7280' : '#9ca3af'} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Connected to Vehicle</Text>
          <Bluetooth size={20} color="#10b981" />
        </View>

        {/* Connection Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Connection</Text>
          </View>
          <SettingRow
            icon={Bluetooth}
            title="Bluetooth Settings"
            description="Manage Bluetooth adapter connection"
            onPress={() => router.push('/settings')}
          />
          <SettingRow
            icon={Wifi}
            title="WiFi Settings"
            description="Configure WiFi OBD adapter"
            onPress={() => router.push('/settings')}
          />
          <SettingRow
            icon={Settings}
            title="Auto Connect"
            description="Automatically connect to last used adapter"
            hasSwitch
            switchValue={settings.autoConnect}
            onSwitchChange={() => toggleSetting('autoConnect')}
            isLast
          />
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          <SettingRow
            icon={isDark ? Sun : Moon}
            title="Dark Mode"
            description="Toggle between light and dark theme"
            hasSwitch
            switchValue={settings.darkMode}
            onSwitchChange={() => toggleSetting('darkMode')}
          />
          <SettingRow
            icon={Bell}
            title="Notifications"
            description="Enable push notifications for alerts"
            hasSwitch
            switchValue={settings.notifications}
            onSwitchChange={() => toggleSetting('notifications')}
          />
          <SettingRow
            icon={Database}
            title="Data Logging"
            description="Automatically log diagnostic data"
            hasSwitch
            switchValue={settings.dataLogging}
            onSwitchChange={() => toggleSetting('dataLogging')}
          />
          <SettingRow
            icon={Download}
            title="Background Sync"
            description="Sync data when app is in background"
            hasSwitch
            switchValue={settings.backgroundSync}
            onSwitchChange={() => toggleSetting('backgroundSync')}
            isLast
          />
        </View>

        {/* Vehicle Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
          </View>
          <SettingRow
            icon={Car}
            title="Vehicle Profile"
            description="Manage vehicle information and settings"
            onPress={() => router.push('/vehicle-profile')}
          />
          <SettingRow
            icon={Settings}
            title="Auto Scan"
            description="Automatically scan for errors on connect"
            hasSwitch
            switchValue={settings.autoScan}
            onSwitchChange={() => toggleSetting('autoScan')}
            isLast
          />
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Data Management</Text>
          </View>
          <SettingRow
            icon={Share2}
            title="Export Data"
            description="Export diagnostic history and reports"
            onPress={exportData}
          />
          <SettingRow
            icon={Trash2}
            title="Clear All Data"
            description="Delete all stored diagnostic data"
            onPress={clearData}
            isDanger
            isLast
          />
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Help & Support</Text>
          </View>
          <SettingRow
            icon={HelpCircle}
            title="Help & FAQ"
            description="Get help and view frequently asked questions"
            onPress={() => router.push('/settings')}
          />
          <SettingRow
            icon={Shield}
            title="Privacy Policy"
            description="View our privacy and data usage policy"
            onPress={() => router.push('/settings')}
          />
          <SettingRow
            icon={Info}
            title="About"
            description="App version and legal information"
            onPress={() => router.push('/settings')}
            isLast
          />
        </View>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>
            OBDII Diagnostic App v2.1.0{'\n'}
            Build 12045 • React Native{'\n'}
            © 2024 Your Company Name
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}