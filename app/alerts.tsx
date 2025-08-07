import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
// SafeAreaView removed - using View instead
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: Date;
  isRead: boolean;
  category: 'engine' | 'transmission' | 'brakes' | 'electrical' | 'emissions' | 'maintenance';
  dtcCode?: string;
}

interface AlertRule {
  id: string;
  name: string;
  parameter: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  unit: string;
  enabled: boolean;
  severity: 'critical' | 'warning' | 'info';
}

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: '1',
      title: 'Engine Temperature High',
      message: 'Engine coolant temperature has exceeded normal operating range (105°C)',
      severity: 'critical',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      isRead: false,
      category: 'engine',
      dtcCode: 'P0217',
    },
    {
      id: '2',
      title: 'Low Fuel Level',
      message: 'Fuel level is below 15%. Consider refueling soon.',
      severity: 'warning',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      isRead: false,
      category: 'maintenance',
    },
    {
      id: '3',
      title: 'Battery Voltage Low',
      message: 'Battery voltage has dropped to 11.8V. Check charging system.',
      severity: 'warning',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      isRead: true,
      category: 'electrical',
      dtcCode: 'P0562',
    },
    {
      id: '4',
      title: 'Maintenance Reminder',
      message: 'Vehicle has traveled 4,850 miles since last oil change.',
      severity: 'info',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      isRead: true,
      category: 'maintenance',
    },
  ]);

  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: '1',
      name: 'Engine Temperature',
      parameter: 'coolantTemp',
      condition: 'above',
      threshold: 100,
      unit: '°C',
      enabled: true,
      severity: 'critical',
    },
    {
      id: '2',
      name: 'RPM Limit',
      parameter: 'rpm',
      condition: 'above',
      threshold: 6000,
      unit: 'rpm',
      enabled: true,
      severity: 'warning',
    },
    {
      id: '3',
      name: 'Low Fuel',
      parameter: 'fuelLevel',
      condition: 'below',
      threshold: 15,
      unit: '%',
      enabled: true,
      severity: 'warning',
    },
    {
      id: '4',
      name: 'Battery Voltage',
      parameter: 'batteryVoltage',
      condition: 'below',
      threshold: 12.0,
      unit: 'V',
      enabled: true,
      severity: 'warning',
    },
  ]);

  const [selectedTab, setSelectedTab] = useState<'alerts' | 'rules'>('alerts');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  const getSeverityColor = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'critical':
        return '#FF3B30';
      case 'warning':
        return '#FF9500';
      case 'info':
        return '#007AFF';
    }
  };

  const getSeverityIcon = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
    }
  };

  const getCategoryIcon = (category: AlertItem['category']) => {
    switch (category) {
      case 'engine':
        return 'car-sport';
      case 'transmission':
        return 'settings';
      case 'brakes':
        return 'stop-circle';
      case 'electrical':
        return 'flash';
      case 'emissions':
        return 'leaf';
      case 'maintenance':
        return 'construct';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const handleMarkAsRead = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  };

  const handleDeleteAlert = (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAlerts(prev => prev.filter(alert => alert.id !== alertId));
          },
        },
      ]
    );
  };

  const handleClearAllAlerts = () => {
    Alert.alert(
      'Clear All Alerts',
      'Are you sure you want to clear all alerts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setAlerts([]);
          },
        },
      ]
    );
  };

  const handleToggleRule = (ruleId: string) => {
    setAlertRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setShowRuleModal(true);
  };

  const handleSaveRule = () => {
    if (editingRule) {
      setAlertRules(prev =>
        prev.map(rule =>
          rule.id === editingRule.id ? editingRule : rule
        )
      );
      setShowRuleModal(false);
      setEditingRule(null);
    }
  };

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Alerts</Text>
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleClearAllAlerts}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'alerts' && styles.activeTab]}
          onPress={() => setSelectedTab('alerts')}
        >
          <Text style={[styles.tabText, selectedTab === 'alerts' && styles.activeTabText]}>
            Active Alerts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'rules' && styles.activeTab]}
          onPress={() => setSelectedTab('rules')}
        >
          <Text style={[styles.tabText, selectedTab === 'rules' && styles.activeTabText]}>
            Alert Rules
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'alerts' ? (
          <View style={styles.alertsContainer}>
            {alerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={64} color="#34C759" />
                <Text style={styles.emptyTitle}>No Active Alerts</Text>
                <Text style={styles.emptyMessage}>
                  Your vehicle is running smoothly with no alerts to display.
                </Text>
              </View>
            ) : (
              alerts.map((alert) => (
                <View
                  key={alert.id}
                  style={[
                    styles.alertCard,
                    !alert.isRead && styles.unreadAlert,
                    { borderLeftColor: getSeverityColor(alert.severity) },
                  ]}
                >
                  <View style={styles.alertHeader}>
                    <View style={styles.alertIconContainer}>
                      <Ionicons
                        name={getCategoryIcon(alert.category)}
                        size={20}
                        color={getSeverityColor(alert.severity)}
                      />
                    </View>
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      {alert.dtcCode && (
                        <Text style={styles.dtcCode}>Code: {alert.dtcCode}</Text>
                      )}
                    </View>
                    <View style={styles.alertActions}>
                      <Ionicons
                        name={getSeverityIcon(alert.severity)}
                        size={16}
                        color={getSeverityColor(alert.severity)}
                      />
                      <Text style={styles.alertTime}>
                        {formatTimestamp(alert.timestamp)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  
                  <View style={styles.alertFooter}>
                    {!alert.isRead && (
                      <TouchableOpacity
                        style={styles.markReadButton}
                        onPress={() => handleMarkAsRead(alert.id)}
                      >
                        <Text style={styles.markReadText}>Mark as Read</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAlert(alert.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.rulesContainer}>
            {alertRules.map((rule) => (
              <View key={rule.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <Text style={styles.ruleName}>{rule.name}</Text>
                  <Switch
                    value={rule.enabled}
                    onValueChange={() => handleToggleRule(rule.id)}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.ruleCondition}>
                  Alert when {rule.parameter} is {rule.condition} {rule.threshold} {rule.unit}
                </Text>
                <View style={styles.ruleFooter}>
                  <View style={[styles.severityBadge, { backgroundColor: `${getSeverityColor(rule.severity)}20` }]}>
                    <Text style={[styles.severityText, { color: getSeverityColor(rule.severity) }]}>
                      {rule.severity.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditRule(rule)}
                  >
                    <Ionicons name="pencil" size={16} color="#007AFF" />
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Rule Edit Modal */}
      <Modal
        visible={showRuleModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRuleModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Alert Rule</Text>
            <TouchableOpacity onPress={handleSaveRule}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          {editingRule && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rule Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editingRule.name}
                  onChangeText={(text) => setEditingRule({ ...editingRule, name: text })}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Threshold Value</Text>
                <TextInput
                  style={styles.textInput}
                  value={editingRule.threshold.toString()}
                  onChangeText={(text) => setEditingRule({ ...editingRule, threshold: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Severity</Text>
                <View style={styles.severitySelector}>
                  {(['critical', 'warning', 'info'] as const).map((severity) => (
                    <TouchableOpacity
                      key={severity}
                      style={[
                        styles.severityOption,
                        editingRule.severity === severity && styles.selectedSeverity,
                        { borderColor: getSeverityColor(severity) },
                      ]}
                      onPress={() => setEditingRule({ ...editingRule, severity })}
                    >
                      <Text
                        style={[
                          styles.severityOptionText,
                          editingRule.severity === severity && { color: getSeverityColor(severity) },
                        ]}
                      >
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  badgeContainer: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearAllText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  alertsContainer: {
    paddingTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadAlert: {
    backgroundColor: '#F8F9FA',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  dtcCode: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  alertActions: {
    alignItems: 'flex-end',
  },
  alertTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  markReadButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  markReadText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  rulesContainer: {
    paddingTop: 20,
  },
  ruleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  ruleCondition: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 12,
  },
  ruleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  severitySelector: {
    flexDirection: 'row',
    gap: 12,
  },
  severityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedSeverity: {
    backgroundColor: '#F8F9FA',
  },
  severityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
});