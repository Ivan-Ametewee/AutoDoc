import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface DiagnosticTroubleCode {
  code: string;
  description: string;
  severity: 'critical' | 'moderate' | 'minor';
  status: 'active' | 'pending' | 'cleared';
  system: 'engine' | 'transmission' | 'abs' | 'airbag' | 'emissions' | 'electrical';
  freezeFrameData?: {
    rpm: number;
    speed: number;
    engineLoad: number;
    coolantTemp: number;
    timestamp: Date;
  };
}

interface SystemStatus {
  system: string;
  status: 'ready' | 'not_ready' | 'unsupported' | 'incomplete';
  icon: keyof typeof Ionicons.glyphMap;
}

interface LiveData {
  parameter: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  icon: keyof typeof Ionicons.glyphMap;
}

export default function DiagnosticsScreen() {
  const [dtcCodes, setDtcCodes] = useState<DiagnosticTroubleCode[]>([
    {
      code: 'P0171',
      description: 'System Too Lean (Bank 1)',
      severity: 'moderate',
      status: 'active',
      system: 'engine',
      freezeFrameData: {
        rpm: 2150,
        speed: 45,
        engineLoad: 35,
        coolantTemp: 92,
        timestamp: new Date(Date.now() - 3600000),
      },
    },
    {
      code: 'P0420',
      description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
      severity: 'moderate',
      status: 'pending',
      system: 'emissions',
    },
    {
      code: 'B1342',
      description: 'ECM/PCM Internal Engine Off Timer Performance',
      severity: 'minor',
      status: 'cleared',
      system: 'electrical',
    },
  ]);

  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([
    { system: 'Misfire Monitor', status: 'ready', icon: 'flash' },
    { system: 'Fuel System Monitor', status: 'ready', icon: 'water' },
    { system: 'Comprehensive Component Monitor', status: 'ready', icon: 'checkmark-circle' },
    { system: 'Catalyst Monitor', status: 'not_ready', icon: 'leaf' },
    { system: 'Heated Catalyst Monitor', status: 'ready', icon: 'thermometer' },
    { system: 'Evaporative Emission Monitor', status: 'incomplete', icon: 'cloud' },
    { system: 'Secondary Air System Monitor', status: 'unsupported', icon: 'radio' },
    { system: 'A/C System Refrigerant Monitor', status: 'ready', icon: 'snow' },
    { system: 'Oxygen Sensor Monitor', status: 'ready', icon: 'analytics' },
    { system: 'Oxygen Sensor Heater Monitor', status: 'ready', icon: 'thermometer-outline' },
    { system: 'EGR System Monitor', status: 'ready', icon: 'repeat' },
  ]);

  const [liveData, setLiveData] = useState<LiveData[]>([
    { parameter: 'Engine RPM', value: '850', unit: 'rpm', status: 'normal', icon: 'speedometer' },
    { parameter: 'Vehicle Speed', value: '0', unit: 'mph', status: 'normal', icon: 'car' },
    { parameter: 'Engine Load', value: '15', unit: '%', status: 'normal', icon: 'bar-chart' },
    { parameter: 'Coolant Temperature', value: '89', unit: '°C', status: 'normal', icon: 'thermometer' },
    { parameter: 'Intake Air Temperature', value: '23', unit: '°C', status: 'normal', icon: 'thermometer-outline' },
    { parameter: 'Throttle Position', value: '0', unit: '%', status: 'normal', icon: 'options' },
    { parameter: 'Fuel Pressure', value: '3.2', unit: 'bar', status: 'normal', icon: 'water' },
    { parameter: 'Manifold Pressure', value: '1.0', unit: 'bar', status: 'normal', icon: 'resize' },
  ]);

  const [selectedTab, setSelectedTab] = useState<'dtc' | 'systems' | 'live'>('dtc');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDTC, setSelectedDTC] = useState<DiagnosticTroubleCode | null>(null);
  const [showDTCModal, setShowDTCModal] = useState(false);

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev =>
        prev.map(item => {
          let newValue = parseFloat(item.value);
          let newStatus = item.status;

          switch (item.parameter) {
            case 'Engine RPM':
              newValue = Math.max(700, newValue + (Math.random() - 0.5) * 50);
              break;
            case 'Engine Load':
              newValue = Math.max(0, Math.min(100, newValue + (Math.random() - 0.5) * 10));
              break;
            case 'Coolant Temperature':
              newValue = Math.max(70, Math.min(110, newValue + (Math.random() - 0.5) * 2));
              newStatus = newValue > 95 ? 'warning' : newValue > 105 ? 'critical' : 'normal';
              break;
            case 'Fuel Pressure':
              newValue = Math.max(2.5, Math.min(4.0, newValue + (Math.random() - 0.5) * 0.2));
              newStatus = newValue < 2.8 ? 'warning' : newValue < 2.5 ? 'critical' : 'normal';
              break;
            default:
              return item;
          }

          return {
            ...item,
            value: newValue.toFixed(item.parameter === 'Engine RPM' ? 0 : 1),
            status: newStatus,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleScanDTC = async () => {
    setIsScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert(
        'Scan Complete',
        `Found ${dtcCodes.filter(code => code.status === 'active').length} active codes`,
        [{ text: 'OK' }]
      );
    }, 3000);
  };

  const handleClearDTC = () => {
    Alert.alert(
      'Clear Diagnostic Codes',
      'Are you sure you want to clear all diagnostic trouble codes? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setDtcCodes(prev =>
              prev.map(code => ({ ...code, status: 'cleared' as const }))
            );
            Alert.alert('Success', 'All diagnostic codes have been cleared.');
          },
        },
      ]
    );
  };

  const getSeverityColor = (severity: DiagnosticTroubleCode['severity']) => {
    switch (severity) {
      case 'critical': return '#FF4444';
      case 'moderate': return '#FF8800';
      case 'minor': return '#FFAA00';
      default: return '#666';
    }
  };

  const getStatusColor = (status: DiagnosticTroubleCode['status']) => {
    switch (status) {
      case 'active': return '#FF4444';
      case 'pending': return '#FF8800';
      case 'cleared': return '#4CAF50';
      default: return '#666';
    }
  };

  const getSystemStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'ready': return '#4CAF50';
      case 'not_ready': return '#FF8800';
      case 'incomplete': return '#FF8800';
      case 'unsupported': return '#666';
      default: return '#666';
    }
  };

  const getLiveDataStatusColor = (status: LiveData['status']) => {
    switch (status) {
      case 'normal': return '#4CAF50';
      case 'warning': return '#FF8800';
      case 'critical': return '#FF4444';
      default: return '#666';
    }
  };

  const renderDTCTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
          onPress={handleScanDTC}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Ionicons name="scan" size={20} color="#FFF" />
          )}
          <Text style={styles.actionButtonText}>
            {isScanning ? 'Scanning...' : 'Scan DTC'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF4444' }]}
          onPress={handleClearDTC}
          disabled={isScanning}
        >
          <Ionicons name="trash" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Clear DTC</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.codesList}>
        {dtcCodes.map((code, index) => (
          <TouchableOpacity
            key={index}
            style={styles.codeItem}
            onPress={() => {
              setSelectedDTC(code);
              setShowDTCModal(true);
            }}
          >
            <View style={styles.codeHeader}>
              <Text style={styles.codeNumber}>{code.code}</Text>
              <View style={styles.codeStatus}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getSeverityColor(code.severity) },
                  ]}
                />
                <Text style={[styles.statusText, { color: getStatusColor(code.status) }]}>
                  {code.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.codeDescription}>{code.description}</Text>
            <View style={styles.codeFooter}>
              <Text style={styles.codeSystem}>{code.system.toUpperCase()}</Text>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSystemsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>System Readiness Status</Text>
      <ScrollView style={styles.systemsList}>
        {systemStatuses.map((system, index) => (
          <View key={index} style={styles.systemItem}>
            <Ionicons
              name={system.icon}
              size={24}
              color={getSystemStatusColor(system.status)}
            />
            <View style={styles.systemInfo}>
              <Text style={styles.systemName}>{system.system}</Text>
              <Text
                style={[
                  styles.systemStatus,
                  { color: getSystemStatusColor(system.status) },
                ]}
              >
                {system.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderLiveTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Live Data Stream</Text>
      <ScrollView style={styles.liveDataList}>
        {liveData.map((data, index) => (
          <View key={index} style={styles.liveDataItem}>
            <Ionicons
              name={data.icon}
              size={24}
              color={getLiveDataStatusColor(data.status)}
            />
            <View style={styles.liveDataInfo}>
              <Text style={styles.liveDataParameter}>{data.parameter}</Text>
              <View style={styles.liveDataValue}>
                <Text style={[styles.liveDataNumber, { color: getLiveDataStatusColor(data.status) }]}>
                  {data.value}
                </Text>
                <Text style={styles.liveDataUnit}>{data.unit}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Diagnostics</Text>
        <TouchableOpacity onPress={() => router.push('/reports')}>
          <Ionicons name="document-text" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'dtc' && styles.activeTab]}
          onPress={() => setSelectedTab('dtc')}
        >
          <Text style={[styles.tabText, selectedTab === 'dtc' && styles.activeTabText]}>
            DTC Codes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'systems' && styles.activeTab]}
          onPress={() => setSelectedTab('systems')}
        >
          <Text style={[styles.tabText, selectedTab === 'systems' && styles.activeTabText]}>
            Systems
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'live' && styles.activeTab]}
          onPress={() => setSelectedTab('live')}
        >
          <Text style={[styles.tabText, selectedTab === 'live' && styles.activeTabText]}>
            Live Data
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'dtc' && renderDTCTab()}
      {selectedTab === 'systems' && renderSystemsTab()}
      {selectedTab === 'live' && renderLiveTab()}

      <Modal
        visible={showDTCModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>DTC Details</Text>
            <TouchableOpacity onPress={() => setShowDTCModal(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {selectedDTC && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.dtcDetailHeader}>
                <Text style={styles.dtcDetailCode}>{selectedDTC.code}</Text>
                <View style={[styles.dtcDetailSeverity, { backgroundColor: getSeverityColor(selectedDTC.severity) }]}>
                  <Text style={styles.dtcDetailSeverityText}>{selectedDTC.severity.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.dtcDetailDescription}>{selectedDTC.description}</Text>
              
              <View style={styles.dtcDetailSection}>
                <Text style={styles.dtcDetailSectionTitle}>System</Text>
                <Text style={styles.dtcDetailSectionValue}>{selectedDTC.system.toUpperCase()}</Text>
              </View>
              
              <View style={styles.dtcDetailSection}>
                <Text style={styles.dtcDetailSectionTitle}>Status</Text>
                <Text style={[styles.dtcDetailSectionValue, { color: getStatusColor(selectedDTC.status) }]}>
                  {selectedDTC.status.toUpperCase()}
                </Text>
              </View>
              
              {selectedDTC.freezeFrameData && (
                <View style={styles.freezeFrameSection}>
                  <Text style={styles.dtcDetailSectionTitle}>Freeze Frame Data</Text>
                  <View style={styles.freezeFrameGrid}>
                    <View style={styles.freezeFrameItem}>
                      <Text style={styles.freezeFrameLabel}>RPM</Text>
                      <Text style={styles.freezeFrameValue}>{selectedDTC.freezeFrameData.rpm}</Text>
                    </View>
                    <View style={styles.freezeFrameItem}>
                      <Text style={styles.freezeFrameLabel}>Speed</Text>
                      <Text style={styles.freezeFrameValue}>{selectedDTC.freezeFrameData.speed} mph</Text>
                    </View>
                    <View style={styles.freezeFrameItem}>
                      <Text style={styles.freezeFrameLabel}>Load</Text>
                      <Text style={styles.freezeFrameValue}>{selectedDTC.freezeFrameData.engineLoad}%</Text>
                    </View>
                    <View style={styles.freezeFrameItem}>
                      <Text style={styles.freezeFrameLabel}>Coolant</Text>
                      <Text style={styles.freezeFrameValue}>{selectedDTC.freezeFrameData.coolantTemp}°C</Text>
                    </View>
                  </View>
                  <Text style={styles.freezeFrameTimestamp}>
                    Recorded: {selectedDTC.freezeFrameData.timestamp.toLocaleString()}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  codesList: {
    flex: 1,
  },
  codeItem: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  codeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  codeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  codeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeSystem: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  systemsList: {
    flex: 1,
  },
  systemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    gap: 15,
  },
  systemInfo: {
    flex: 1,
  },
  systemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  systemStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  liveDataList: {
    flex: 1,
  },
  liveDataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    gap: 15,
  },
  liveDataInfo: {
    flex: 1,
  },
  liveDataParameter: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  liveDataValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  liveDataNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  liveDataUnit: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  dtcDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dtcDetailCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  dtcDetailSeverity: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dtcDetailSeverityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dtcDetailDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  dtcDetailSection: {
    marginBottom: 15,
  },
  dtcDetailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  dtcDetailSectionValue: {
    fontSize: 16,
    color: '#333',
  },
  freezeFrameSection: {
    marginTop: 10,
  },
  freezeFrameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
  },
  freezeFrameItem: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  freezeFrameLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  freezeFrameValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  freezeFrameTimestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
});