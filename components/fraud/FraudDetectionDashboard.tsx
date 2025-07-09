import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Share,
  Dimensions,
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
  
  // Memoized selectors to prevent unnecessary re-renders
  const fraudDataFromStore = useSelector((state: any) => state.vehicle?.fraudDetection);
  const historicalDataFromStore = useSelector((state: any) => state.data?.historicalData);
  
  // Use useMemo to create stable default values
  const fraudData = useMemo(() => {
    return fraudDataFromStore || {
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
    };
  }, [fraudDataFromStore]) as FraudDetectionState;
  
  const historicalData = useMemo(() => {
    return historicalDataFromStore || [];
  }, [historicalDataFromStore]);
  
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'settings'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // Responsive helpers - memoized to prevent unnecessary recalculations
  const isTablet = useMemo(() => screenWidth >= 768, [screenWidth]);
  const isSmallScreen = useMemo(() => screenWidth < 375, [screenWidth]);
  
  const getResponsiveValue = useMemo(() => {
    return (small: number, normal: number, large: number) => {
      if (isSmallScreen) return small;
      if (isTablet) return large;
      return normal;
    };
  }, [isSmallScreen, isTablet]);

  const statusCardLayout = useMemo(() => {
    if (isTablet) return { flexDirection: 'row' as const, gap: 16 };
    if (isSmallScreen) return { flexDirection: 'column' as const, gap: 8 };
    return { flexDirection: 'row' as const, gap: 12 };
  }, [isTablet, isSmallScreen]);

  const checkCardColumns = useMemo(() => {
    if (isTablet) return 2;
    return 1;
  }, [isTablet]);

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

  const getRiskColor = useMemo(() => {
    return (riskLevel: string | number): string => {
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
  }, []);

  const getRiskBgColor = useMemo(() => {
    return (riskLevel: string | number): string => {
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
  }, []);

  const formatTimestamp = useMemo(() => {
    return (timestamp: string): string => {
      return new Date(timestamp).toLocaleString();
    };
  }, []);

  const formatCheckName = useMemo(() => {
    return (checkType: string): string => {
      return checkType
        .charAt(0).toUpperCase() + 
        checkType.slice(1).replace(/([A-Z])/g, ' $1');
    };
  }, []);

  const StatusCard = ({ title, value, icon, color, bgColor, screenWidth }: any) => {
    const isSmall = screenWidth < 375;
    const isTablet = screenWidth >= 768;
    
    return (
      <View style={[
        styles.statusCard, 
        { backgroundColor: bgColor },
        isSmall && styles.statusCardSmall,
        isTablet && styles.statusCardTablet
      ]}>
        <View style={styles.statusCardContent}>
          <View style={[styles.statusIcon, { backgroundColor: color + '20' }]}>
            <MaterialIcons 
              name={icon} 
              size={isSmall ? 20 : isTablet ? 32 : 28} 
              color={color} 
            />
          </View>
          <View style={styles.statusText}>
            <Text style={[
              styles.statusTitle,
              isSmall && styles.statusTitleSmall,
              isTablet && styles.statusTitleTablet
            ]}>
              {title}
            </Text>
            <Text style={[
              styles.statusValue, 
              { color },
              isSmall && styles.statusValueSmall,
              isTablet && styles.statusValueTablet
            ]}>
              {value}
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
          <View style={[
            styles.headerActions,
            isSmallScreen && styles.headerActionsSmall
          ]}>
            <TouchableOpacity
              style={[
                styles.actionButton, 
                { marginRight: 8 },
                isSmallScreen && styles.actionButtonSmall
              ]}
              onPress={handleRunFraudCheck}
              disabled={isRunningCheck}
            >
              <MaterialIcons 
                name="refresh" 
                size={isSmallScreen ? 16 : 20} 
                color="white" 
                style={isRunningCheck ? styles.spinning : undefined}
              />
              {!isSmallScreen && (
                <Text style={styles.actionButtonText}>
                  {isRunningCheck ? 'Scanning...' : 'Run Check'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton, 
                styles.secondaryButton,
                isSmallScreen && styles.actionButtonSmall
              ]}
              onPress={handleExportReport}
            >
              <MaterialIcons name="file-download" size={isSmallScreen ? 16 : 20} color="white" />
              {!isSmallScreen && (
                <Text style={styles.actionButtonText}>Export</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Status Overview */}
      <View style={[styles.statusGrid, statusCardLayout]}>
        <StatusCard
          title="Overall Status"
          value={(fraudData.overallStatus || 'clean').charAt(0).toUpperCase() + 
                 (fraudData.overallStatus || 'clean').slice(1).replace('_', ' ')}
          icon="shield"
          color={getRiskColor(fraudData.overallStatus || 'clean')}
          bgColor={getRiskBgColor(fraudData.overallStatus || 'clean')}
          screenWidth={screenWidth}
        />
        <StatusCard
          title="Risk Score"
          value={`${fraudData.riskScore || 0}/100`}
          icon="visibility"
          color={getRiskColor(fraudData.riskScore || 0)}
          bgColor={getRiskBgColor(fraudData.riskScore || 0)}
          screenWidth={screenWidth}
        />
        <StatusCard
          title="Active Alerts"
          value={(fraudData.alerts || []).length.toString()}
          icon="warning"
          color="#8b5cf6"
          bgColor="#f5f3ff"
          screenWidth={screenWidth}
        />
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
          style={styles.tabScrollView}
        >
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
        </ScrollView>
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
              <View style={[
                styles.checksGrid,
                isTablet && styles.checksGridTablet,
                isSmallScreen && styles.checksGridSmall
              ]}>
                {Object.entries(fraudData.checks || {}).map(([checkType, result]) => (
                  <View
                    key={checkType}
                    style={[
                      styles.checkCard,
                      { backgroundColor: getRiskBgColor(result?.riskLevel || 'low') },
                      isTablet && styles.checkCardTablet,
                      isSmallScreen && styles.checkCardSmall
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
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: Math.max(16, Math.min(20, Dimensions.get('window').width * 0.05)),
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionsSmall: {
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  secondaryButton: {
    backgroundColor: '#64748b',
    shadowColor: '#64748b',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  spinning: {
    // Add rotation animation if needed
  },
  statusGrid: {
    paddingHorizontal: Math.max(16, Math.min(20, Dimensions.get('window').width * 0.05)),
    paddingVertical: 20,
  },
  statusCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusCardSmall: {
    padding: 16,
    borderRadius: 8,
  },
  statusCardTablet: {
    padding: 24,
    borderRadius: 16,
  },
  statusCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTitleSmall: {
    fontSize: 11,
    marginBottom: 2,
  },
  statusTitleTablet: {
    fontSize: 15,
    marginBottom: 6,
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },
  statusValueSmall: {
    fontSize: 18,
    lineHeight: 22,
  },
  statusValueTablet: {
    fontSize: 28,
    lineHeight: 32,
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabScrollView: {
    flex: 1,
  },
  tabScrollContent: {
    paddingHorizontal: Math.max(16, Math.min(20, Dimensions.get('window').width * 0.05)),
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginRight: 24,
    minWidth: 120,
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  tabContent: {
    padding: Math.max(16, Math.min(20, Dimensions.get('window').width * 0.05)),
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    paddingHorizontal: Math.max(16, Math.min(20, Dimensions.get('window').width * 0.05)),
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 20,
  },
  cardContent: {
    padding: Math.max(16, Math.min(20, Dimensions.get('window').width * 0.05)),
  },
  checksGrid: {
    gap: 16,
  },
  checksGridSmall: {
    gap: 12,
  },
  checksGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  checkCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  checkCardSmall: {
    padding: 16,
    borderRadius: 8,
  },
  checkCardTablet: {
    flex: 1,
    minWidth: 300,
    padding: 24,
    borderRadius: 16,
  },
  checkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    letterSpacing: -0.2,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  riskBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 20,
  },
  anomaliesList: {
    marginTop: 12,
  },
  anomalyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  anomalyText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  moreAnomalies: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  clearButton: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 17,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  alertsList: {
    gap: 16,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertType: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertCheckType: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  alertMessage: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  alertTimestamp: {
    fontSize: 13,
    color: '#64748b',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flex: 1,
    marginRight: 20,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  settingDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 20,
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#3b82f6',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default FraudDetectionDashboard;