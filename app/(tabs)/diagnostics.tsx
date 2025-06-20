import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Zap,
} from 'lucide-react-native';

export default function TabsDiagnostics() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(new Date());

  // Mock diagnostic data
  const [diagnosticCodes] = useState([
    {
      code: 'P0301',
      description: 'Cylinder 1 Misfire Detected',
      severity: 'high',
      status: 'active',
    },
    {
      code: 'P0128',
      description: 'Coolant Thermostat Temperature',
      severity: 'medium',
      status: 'pending',
    },
    {
      code: 'P0171',
      description: 'System Too Lean (Bank 1)',
      severity: 'low',
      status: 'stored',
    },
  ]);

  const [systemStatus] = useState([
    { name: 'Engine', status: 'ready', tests: 8 },
    { name: 'Transmission', status: 'ready', tests: 4 },
    { name: 'ABS', status: 'not_ready', tests: 3 },
    { name: 'Airbag', status: 'ready', tests: 2 },
    { name: 'Emissions', status: 'incomplete', tests: 6 },
  ]);

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setLastScan(new Date());
      Alert.alert('Scan Complete', 'Found 3 diagnostic codes');
    }, 3000);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111111' : '#f5f5f5',
    },
    scrollContent: {
      padding: 16,
    },
    scanCard: {
      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
    },
    scanButton: {
      backgroundColor: scanning ? '#6b7280' : '#3b82f6',
      borderRadius: 25,
      paddingVertical: 12,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    scanButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    lastScanText: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1f1f1f',
      marginBottom: 12,
    },
    codeCard: {
      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 8,
      borderLeftWidth: 4,
    },
    codeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    codeTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1f1f1f',
    },
    codeDescription: {
      fontSize: 14,
      color: isDark ? '#d1d5db' : '#4b5563',
      lineHeight: 20,
    },
    severityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    severityText: {
      fontSize: 12,
      fontWeight: '600',
    },
    systemCard: {
      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    systemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2a2a2a' : '#e5e7eb',
    },
    systemName: {
      fontSize: 16,
      color: isDark ? '#ffffff' : '#1f1f1f',
      flex: 1,
    },
    systemTests: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginRight: 12,
    },
    actionButton: {
      backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionText: {
      fontSize: 16,
      color: isDark ? '#ffffff' : '#1f1f1f',
      marginLeft: 12,
      flex: 1,
    },
  });

  const getSeverityColor = (severity: 'high' | 'medium' | 'low' | string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: 'ready' | 'not_ready' | 'incomplete' | string) => {
    switch (status) {
      case 'ready': return <CheckCircle size={20} color="#10b981" />;
      case 'not_ready': return <XCircle size={20} color="#ef4444" />;
      case 'incomplete': return <AlertTriangle size={20} color="#f59e0b" />;
      default: return <AlertTriangle size={20} color="#6b7280" />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Scan Section */}
        <View style={styles.scanCard}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={startScan}
            disabled={scanning}
          >
            <RefreshCw
              size={20}
              color="white"
              style={{ transform: [{ rotate: scanning ? '360deg' : '0deg' }] }}
            />
            <Text style={styles.scanButtonText}>
              {scanning ? 'Scanning...' : 'Start Diagnostic Scan'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.lastScanText}>
            Last scan: {lastScan.toLocaleTimeString()}
          </Text>
        </View>

        {/* Error Codes */}
        <Text style={styles.sectionTitle}>Diagnostic Codes ({diagnosticCodes.length})</Text>
        {diagnosticCodes.map((code, index) => (
          <View
            key={index}
            style={[
              styles.codeCard,
              { borderLeftColor: getSeverityColor(code.severity) }
            ]}
          >
            <View style={styles.codeHeader}>
              <Text style={styles.codeTitle}>{code.code}</Text>
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(code.severity) + '20' }
                ]}
              >
                <Text
                  style={[
                    styles.severityText,
                    { color: getSeverityColor(code.severity) }
                  ]}
                >
                  {code.severity.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.codeDescription}>{code.description}</Text>
          </View>
        ))}

        {/* System Status */}
        <View style={styles.systemCard}>
          <Text style={styles.sectionTitle}>System Readiness</Text>
          {systemStatus.map((system, index) => (
            <View key={index} style={styles.systemRow}>
              <Text style={styles.systemName}>{system.name}</Text>
              <Text style={styles.systemTests}>{system.tests} tests</Text>
              {getStatusIcon(system.status)}
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/diagnostics')}
        >
          <Search size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          <Text style={styles.actionText}>Advanced Diagnostics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/reports')}
        >
          <FileText size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          <Text style={styles.actionText}>Generate Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/alerts')}
        >
          <Zap size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          <Text style={styles.actionText}>View All Alerts</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}