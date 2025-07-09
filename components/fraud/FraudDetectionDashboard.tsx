import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';

// Import fraud detection actions
import {
  runFraudDetection,
  clearFraudAlerts,
  toggleFraudDetection,
  exportFraudDetectionReport,
} from '../../store/actions/fraudDetectionActions';

// Types
interface FraudAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  checkType: string;
  riskLevel: number;
}

interface FraudAnomaly {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  data: Record<string, any>;
}

interface FraudDetectionState {
  isEnabled: boolean;
  riskScore: number;
  overallStatus: 'clean' | 'suspicious' | 'high_risk';
  lastCheck: string | null;
  alerts: FraudAlert[];
  checks: {
    odometerRollback: {
      enabled: boolean;
      anomalies: FraudAnomaly[];
      riskLevel: string;
    };
    inconsistentReporting: {
      enabled: boolean;
      anomalies: FraudAnomaly[];
      riskLevel: string;
    };
    digitalTampering: {
      enabled: boolean;
      anomalies: FraudAnomaly[];
      riskLevel: string;
    };
    dataIntegrity: {
      enabled: boolean;
      anomalies: FraudAnomaly[];
      riskLevel: string;
    };
  };
}

const FraudDetectionDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const fraudData = useSelector((state: any) => state.vehicle?.fraudDetection || {
    isEnabled: true,
    riskScore: 0,
    overallStatus: 'clean',
    lastCheck: null,
    alerts: [],
    checks: {
      odometerRollback: {
        enabled: true,
        anomalies: [],
        riskLevel: 'low',
      },
      inconsistentReporting: {
        enabled: true,
        anomalies: [],
        riskLevel: 'low',
      },
      digitalTampering: {
        enabled: true,
        anomalies: [],
        riskLevel: 'low',
      },
      dataIntegrity: {
        enabled: true,
        anomalies: [],
        riskLevel: 'low',
      },
    },
  }) as FraudDetectionState;
  const historicalData = useSelector((state: any) => state.data?.historicalData || []);
  
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'settings'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Mock function to run fraud check
  const handleRunFraudCheck = async () => {
    if (!historicalData || historicalData.length === 0) {
      Alert.alert('No Data', 'No historical data available for fraud detection.');
      return;
    }

    setIsRunningCheck(true);
    
    try {
      const latestReading = historicalData[historicalData.length - 1];
      await dispatch(runFraudDetection(latestReading) as any);
      Alert.alert('Check Complete', 'Fraud detection check completed successfully.');
    } catch (error: any) {
      Alert.alert('Error', `Fraud detection failed: ${error.message}`);
    } finally {
      setIsRunningCheck(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await handleRunFraudCheck();
    setRefreshing(false);
  };

  const handleExportReport = async () => {
    try {
      const report = await dispatch(exportFraudDetectionReport() as any);
      
      // Share the report using React Native's Share API
      await Share.share({
        message: `Fraud Detection Report\n\nRisk Score: ${fraudData.riskScore}/100\nStatus: ${fraudData.overallStatus}\nAlerts: ${fraudData.alerts.length}\n\nGenerated on: ${new Date().toLocaleDateString()}`,
        title: 'Fraud Detection Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export fraud detection report');
    }
  };

  const getRiskColor = (riskLevel: string | number): string => {
    if (typeof riskLevel === 'number') {
      if (riskLevel >= 70) return '#dc2626';
      if (riskLevel >= 40) return '#d97706';
      return '#059669';
    }
    
    switch (riskLevel) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRiskBgColor = (riskLevel: string | number): string => {
    if (typeof riskLevel === 'number') {
      if (riskLevel >= 70) return '#fef2f2';
      if (riskLevel >= 40) return '#fffbeb';
      return '#f0fdf4';
    }
    
    switch (riskLevel) {
      case 'critical': return '#fef2f2';
      case 'high': return '#fef5f5';
      case 'medium': return '#fffbeb';
      case 'low': return '#f0fdf4';
      default: return '#f9fafb';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const formatCheckName = (checkType: string): string => {
    return checkType
      .charAt(0).toUpperCase() + 
      checkType.slice(1).replace(/([A-Z])/g, ' $1');
  };

  const StatusCard = ({ title, value, icon, color, bgColor }: any) => (
    <View style={[styles.statusCard, { backgroundColor: bgColor }]}>
      <View style={styles.statusCardContent}>
        <View style={[styles.statusIcon, { backgroundColor: color + '20' }]}>
          <MaterialIcons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>{title}</Text>
          <Text style={[styles.statusValue, { color }]}>{value}</Text>
        </View>
      </View>
    </View>
  );

  const TabButton = ({ title, isActive, onPress, icon }: any) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTab]}
      onPress={onPress}
    >
      <MaterialIcons 
        name={icon} 
        size={20} 
        color={isActive ? '#3b82f6' : '#6b7280'} 
      />
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="security" size={32} color="#3b82f6" />
            <View style={styles.headerText}>
              <Text style={styles.title}>Odometer Fraud Detection</Text>
              <Text style={styles.subtitle}>Real-time monitoring and analysis</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { marginRight: 8 }]}
              onPress={handleRunFraudCheck}
              disabled={isRunningCheck}
            >
              <MaterialIcons 
                name="refresh" 
                size={20} 
                color="white" 
                style={isRunningCheck ? styles.spinning : undefined}
              />
              <Text style={styles.actionButtonText}>
                {isRunningCheck ? 'Scanning...' : 'Run Check'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleExportReport}
            >
              <MaterialIcons name="file-download" size={20} color="white" />
              <Text style={styles.actionButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Status Overview */}
      <View style={styles.statusGrid}>
        <StatusCard
          title="Overall Status"
          value={(fraudData.overallStatus || 'clean').charAt(0).toUpperCase() + 
                 (fraudData.overallStatus || 'clean').slice(1).replace('_', ' ')}
          icon="shield"
          color={getRiskColor(fraudData.overallStatus || 'clean')}
          bgColor={getRiskBgColor(fraudData.overallStatus || 'clean')}
        />
        <StatusCard
          title="Risk Score"
          value={`${fraudData.riskScore || 0}/100`}
          icon="visibility"
          color={getRiskColor(fraudData.riskScore || 0)}
          bgColor={getRiskBgColor(fraudData.riskScore || 0)}
        />
        <StatusCard
          title="Active Alerts"
          value={(fraudData.alerts || []).length.toString()}
          icon="warning"
          color="#8b5cf6"
          bgColor="#f5f3ff"
        />
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TabButton
          title="Overview"
          icon="visibility"
          isActive={selectedTab === 'overview'}
          onPress={() => setSelectedTab('overview')}
        />
        <TabButton
          title="Alerts"
          icon="warning"
          isActive={selectedTab === 'alerts'}
          onPress={() => setSelectedTab('alerts')}
        />
        <TabButton
          title="Settings"
          icon="settings"
          isActive={selectedTab === 'settings'}
          onPress={() => setSelectedTab('settings')}
        />
      </View>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <View style={styles.tabContent}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Detection Results</Text>
              <Text style={styles.cardSubtitle}>
                Last check: {fraudData.lastCheck ? formatTimestamp(fraudData.lastCheck) : 'Never'}
              </Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.checksGrid}>
                {Object.entries(fraudData.checks || {}).map(([checkType, result]) => (
                  <View
                    key={checkType}
                    style={[
                      styles.checkCard,
                      { backgroundColor: getRiskBgColor(result?.riskLevel || 'low') }
                    ]}
                  >
                    <View style={styles.checkHeader}>
                      <Text style={styles.checkTitle}>
                        {formatCheckName(checkType)}
                      </Text>
                      <View style={[
                        styles.riskBadge,
                        { backgroundColor: getRiskColor(result?.riskLevel || 'low') }
                      ]}>
                        <Text style={styles.riskBadgeText}>{result?.riskLevel || 'low'}</Text>
                      </View>
                    </View>
                    <Text style={styles.checkDescription}>
                      {(result?.anomalies || []).length === 0
                        ? 'No anomalies detected'
                        : `${(result?.anomalies || []).length} anomal${(result?.anomalies || []).length === 1 ? 'y' : 'ies'} found`
                      }
                    </Text>
                    {(result?.anomalies || []).length > 0 && (
                      <View style={styles.anomaliesList}>
                        {(result?.anomalies || []).slice(0, 2).map((anomaly) => (
                          <View key={anomaly.id} style={styles.anomalyItem}>
                            <Text style={styles.anomalyText}>{anomaly.description}</Text>
                          </View>
                        ))}
                        {(result?.anomalies || []).length > 2 && (
                          <Text style={styles.moreAnomalies}>
                            +{(result?.anomalies || []).length - 2} more
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      {selectedTab === 'alerts' && (
        <View style={styles.tabContent}>
          <View style={styles.alertsHeader}>
            <Text style={styles.cardTitle}>Active Alerts</Text>
            <TouchableOpacity onPress={() => dispatch(clearFraudAlerts())}>
              <Text style={styles.clearButton}>Clear All</Text>
            </TouchableOpacity>
          </View>
          
          {(fraudData.alerts || []).length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="warning" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No active alerts</Text>
            </View>
          ) : (
            <View style={styles.alertsList}>
              {(fraudData.alerts || []).map((alert) => (
                <View
                  key={alert.id}
                  style={[
                    styles.alertCard,
                    { borderLeftColor: getRiskColor(alert.type) }
                  ]}
                >
                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <MaterialIcons 
                        name="warning" 
                        size={20} 
                        color={getRiskColor(alert.type)} 
                      />
                      <Text style={[styles.alertType, { color: getRiskColor(alert.type) }]}>
                        {alert.type.toUpperCase()}
                      </Text>
                      <Text style={styles.alertCheckType}>{alert.checkType}</Text>
                    </View>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertTimestamp}>
                      {formatTimestamp(alert.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {selectedTab === 'settings' && (
        <View style={styles.tabContent}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Detection Settings</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Enable Fraud Detection</Text>
                  <Text style={styles.settingDescription}>
                    Monitor odometer readings for potential fraud
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    (fraudData.isEnabled || false) && styles.toggleActive
                  ]}
                  onPress={() => dispatch(toggleFraudDetection(!(fraudData.isEnabled || false)))}
                >
                  <View style={[
                    styles.toggleThumb,
                    (fraudData.isEnabled || false) && styles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
              </View>

              {Object.entries(fraudData.checks || {}).map(([checkType, check]) => (
                <View key={checkType} style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>
                      {formatCheckName(checkType)}
                    </Text>
                    <Text style={styles.settingDescription}>
                      {checkType === 'odometerRollback' && 'Detect when odometer reading decreases'}
                      {checkType === 'inconsistentReporting' && 'Identify unusual mileage patterns'}
                      {checkType === 'digitalTampering' && 'Check for ECU data manipulation'}
                      {checkType === 'dataIntegrity' && 'Validate data completeness and accuracy'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      (check?.enabled || false) && styles.toggleActive
                    ]}
                  >
                    <View style={[
                      styles.toggleThumb,
                      (check?.enabled || false) && styles.toggleThumbActive
                    ]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 14,
  },
  spinning: {
    // Add rotation animation if needed
  },
  statusGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 24,
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  tabContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  cardContent: {
    padding: 16,
  },
  checksGrid: {
    gap: 12,
  },
  checkCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  checkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  riskBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  checkDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  anomaliesList: {
    marginTop: 8,
  },
  anomalyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  anomalyText: {
    fontSize: 12,
    color: '#374151',
  },
  moreAnomalies: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  alertsList: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  alertCheckType: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  alertTimestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#3b82f6',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default FraudDetectionDashboard;