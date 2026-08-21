import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  SafeAreaView,
} from 'react-native';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';

interface DiagnosticSession {
  id: string;
  timestamp: Date;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    vin: string;
  };
  dtcCodes: {
    code: string;
    description: string;
    severity: 'critical' | 'moderate' | 'minor';
    status: 'active' | 'pending' | 'cleared';
    system: string;
  }[];
  readinessMonitors: {
    total: number;
    ready: number;
    notReady: number;
  };
  liveDataSnapshot: {
    rpm: number;
    speed: number;
    engineLoad: number;
    coolantTemp: number;
    fuelLevel: number;
  };
  duration: number; // in minutes
  notes?: string;
}

interface HistoryFilter {
  dateRange: 'all' | 'week' | 'month' | 'quarter';
  severity: 'all' | 'critical' | 'moderate' | 'minor';
  status: 'all' | 'active' | 'pending' | 'cleared';
  system: 'all' | 'engine' | 'transmission' | 'abs' | 'airbag' | 'emissions' | 'electrical';
}

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  searchContainer: ViewStyle;
  searchInput: TextStyle;
  statsContainer: ViewStyle;
  statItem: ViewStyle;
  statNumber: TextStyle;
  statLabel: TextStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  sessionsList: ViewStyle;
  sessionItem: ViewStyle;
  sessionHeader: ViewStyle;
  sessionDate: TextStyle;
  sessionDuration: TextStyle;
  sessionVehicle: TextStyle;
  sessionSummary: TextStyle;
  sessionFooter: ViewStyle;
  sessionTags: ViewStyle;
  sessionTag: ViewStyle;
  sessionTagText: TextStyle;
  emptyState: ViewStyle;
  emptyStateTitle: TextStyle;
  emptyStateMessage: TextStyle;
  modalContainer: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  modalContent: ViewStyle;
  modalFooter: ViewStyle;
  filterSection: ViewStyle;
  filterSectionTitle: TextStyle;
  filterOptions: ViewStyle;
  filterOption: ViewStyle;
  activeFilterOption: ViewStyle;
  filterOptionText: TextStyle;
  activeFilterOptionText: TextStyle;
  clearFiltersButton: ViewStyle;
  clearFiltersButtonText: TextStyle;
  notesInput: ViewStyle & TextStyle;
  saveNotesButton: ViewStyle;
  saveNotesButtonText: TextStyle;
  sessionDetailHeader: ViewStyle;
  sessionDetailDate: TextStyle;
  sessionDetailVehicle: TextStyle;
  sessionDetailSection: ViewStyle;
  sessionDetailSectionTitle: TextStyle;
  vehicleInfoGrid: ViewStyle;
  vehicleInfoItem: ViewStyle;
  vehicleInfoLabel: TextStyle;
  vehicleInfoValue: TextStyle;
  dtcCodeItem: ViewStyle;
  dtcCodeHeader: ViewStyle;
  dtcCodeNumber: TextStyle;
  dtcCodeStatus: ViewStyle;
  statusDot: ViewStyle;
  statusText: TextStyle;
  dtcCodeDescription: TextStyle;
  dtcCodeSystem: TextStyle;
  noDtcCodes: TextStyle;
  readinessGrid: ViewStyle;
  readinessItem: ViewStyle;
  readinessLabel: TextStyle;
  readinessValue: TextStyle;
  liveDataGrid: ViewStyle;
  liveDataItem: ViewStyle;
  liveDataLabel: TextStyle;
  liveDataValue: TextStyle;
  notesHeader: ViewStyle;
  notesText: TextStyle;
  exportButton: ViewStyle;
  exportButtonText: TextStyle;
  deleteButton: ViewStyle;
  deleteButtonText: TextStyle;
}

export default function HistoryScreen() {
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [sessions, setSessions] = useState<DiagnosticSession[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        year: 2018,
        vin: '1HGBH41JXMN109186',
      },
      dtcCodes: [
        {
          code: 'P0171',
          description: 'System Too Lean (Bank 1)',
          severity: 'moderate',
          status: 'active',
          system: 'engine',
        },
        {
          code: 'P0420',
          description: 'Catalyst System Efficiency Below Threshold',
          severity: 'moderate',
          status: 'pending',
          system: 'emissions',
        },
      ],
      readinessMonitors: {
        total: 11,
        ready: 11,
        notReady: 0,
      },
      liveDataSnapshot: {
        rpm: 820,
        speed: 0,
        engineLoad: 15,
        coolantTemp: 88,
        fuelLevel: 78,
      },
      duration: 8,
      notes: 'Routine maintenance check after oil change.',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 604800000), // 1 week ago
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        year: 2018,
        vin: '1HGBH41JXMN109186',
      },
      dtcCodes: [
        {
          code: 'P0300',
          description: 'Random/Multiple Cylinder Misfire Detected',
          severity: 'critical',
          status: 'cleared',
          system: 'engine',
        },
        {
          code: 'P0171',
          description: 'System Too Lean (Bank 1)',
          severity: 'moderate',
          status: 'cleared',
          system: 'engine',
        },
      ],
      readinessMonitors: {
        total: 11,
        ready: 10,
        notReady: 1,
      },
      liveDataSnapshot: {
        rpm: 750,
        speed: 0,
        engineLoad: 20,
        coolantTemp: 85,
        fuelLevel: 45,
      },
      duration: 15,
      notes: 'Engine was running rough. Replaced spark plugs and cleared codes.',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1209600000), // 2 weeks ago
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        year: 2018,
        vin: '1HGBH41JXMN109186',
      },
      dtcCodes: [],
      readinessMonitors: {
        total: 11,
        ready: 11,
        notReady: 0,
      },
      liveDataSnapshot: {
        rpm: 800,
        speed: 0,
        engineLoad: 12,
        coolantTemp: 87,
        fuelLevel: 92,
      },
      duration: 5,
      notes: 'Pre-inspection diagnostic scan. All systems normal.',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 259200000), // 3 days ago
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        year: 2018,
        vin: '1HGBH41JXMN109186',
      },
      dtcCodes: [
        {
          code: 'B1342',
          description: 'ECM/PCM Internal Engine Off Timer Performance',
          severity: 'minor',
          status: 'cleared',
          system: 'electrical',
        },
      ],
      readinessMonitors: {
        total: 11,
        ready: 9,
        notReady: 2,
      },
      liveDataSnapshot: {
        rpm: 875,
        speed: 0,
        engineLoad: 18,
        coolantTemp: 91,
        fuelLevel: 65,
      },
      duration: 12,
      notes: 'Check engine light came on during highway driving. Performance seems normal.',
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 259200000), // 3 days ago
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        year: 2018,
        vin: '1HGBH41JXMN109186',
      },
      dtcCodes: [
        {
          code: 'B1342',
          description: 'ECM/PCM Internal Engine Off Timer Performance',
          severity: 'minor',
          status: 'cleared',
          system: 'electrical',
        },
      ],
      readinessMonitors: {
        total: 11,
        ready: 11,
        notReady: 0,
      },
      liveDataSnapshot: {
        rpm: 800,
        speed: 0,
        engineLoad: 14,
        coolantTemp: 89,
        fuelLevel: 82,
      },
      duration: 6,
      notes: 'Regular maintenance checkup. All systems functioning normally.',
    },
  ]);

  const [filteredSessions, setFilteredSessions] = useState<DiagnosticSession[]>(sessions);
  const [selectedSession, setSelectedSession] = useState<DiagnosticSession | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState<HistoryFilter>({
    dateRange: 'all',
    severity: 'all',
    status: 'all',
    system: 'all',
  });

  useEffect(() => {
    applyFilters();
  }, [filters, searchQuery, sessions]);

  const applyFilters = () => {
    let filtered = [...sessions];

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filters.dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(session => session.timestamp >= cutoffDate);
    }

    // DTC-based filters
    if (filters.severity !== 'all' || filters.status !== 'all' || filters.system !== 'all') {
      filtered = filtered.filter(session =>
        session.dtcCodes.some(code =>
          (filters.severity === 'all' || code.severity === filters.severity) &&
          (filters.status === 'all' || code.status === filters.status) &&
          (filters.system === 'all' || code.system === filters.system)
        )
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.dtcCodes.some(code =>
          code.code.toLowerCase().includes(query) ||
          code.description.toLowerCase().includes(query)
        ) ||
        session.notes?.toLowerCase().includes(query) ||
        session.vehicleInfo.make.toLowerCase().includes(query) ||
        session.vehicleInfo.model.toLowerCase().includes(query)
      );
    }

    setFilteredSessions(filtered);
  };

  const getSeverityColor = (severity: 'critical' | 'moderate' | 'minor') => {
    switch (severity) {
      case 'critical': return '#FF4444';
      case 'moderate': return '#FF8800';
      case 'minor': return '#FFAA00';
      default: return '#666';
    }
  };

  const getStatusColor = (status: 'active' | 'pending' | 'cleared') => {
    switch (status) {
      case 'active': return '#FF4444';
      case 'pending': return '#FF8800';
      case 'cleared': return '#4CAF50';
      default: return '#666';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSessionSummary = (session: DiagnosticSession) => {
    const activeCodes = session.dtcCodes.filter(code => code.status === 'active').length;
    const pendingCodes = session.dtcCodes.filter(code => code.status === 'pending').length;
    const clearedCodes = session.dtcCodes.filter(code => code.status === 'cleared').length;

    if (activeCodes > 0) return `${activeCodes} Active Issue${activeCodes > 1 ? 's' : ''}`;
    if (pendingCodes > 0) return `${pendingCodes} Pending Issue${pendingCodes > 1 ? 's' : ''}`;
    if (clearedCodes > 0) return `${clearedCodes} Cleared Code${clearedCodes > 1 ? 's' : ''}`;
    return 'No Issues Found';
  };

  const getSessionSeverity = (session: DiagnosticSession) => {
    const severities = session.dtcCodes.map(code => code.severity);
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('moderate')) return 'moderate';
    if (severities.includes('minor')) return 'minor';
    return 'normal';
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this diagnostic session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSessions(prev => prev.filter(session => session.id !== sessionId));
            setShowSessionModal(false);
          },
        },
      ]
    );
  };

  const handleExportSession = async (session: DiagnosticSession) => {
    const exportData = {
      timestamp: session.timestamp.toISOString(),
      vehicle: `${session.vehicleInfo.year} ${session.vehicleInfo.make} ${session.vehicleInfo.model}`,
      vin: session.vehicleInfo.vin,
      dtcCodes: session.dtcCodes,
      readinessMonitors: session.readinessMonitors,
      liveData: session.liveDataSnapshot,
      duration: session.duration,
      notes: session.notes || 'No notes',
    };

    try {
      await Share.share({
        message: `Diagnostic Report\n\n${JSON.stringify(exportData, null, 2)}`,
        title: `Diagnostic Report - ${formatDate(session.timestamp)}`,
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to share the diagnostic report.');
    }
  };

  const handleSaveNotes = () => {
    if (selectedSession) {
      setSessions(prev =>
        prev.map(session =>
          session.id === selectedSession.id
            ? { ...session, notes: editingNotes }
            : session
        )
      );
      setShowNotesModal(false);
      setEditingNotes('');
    }
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter History</Text>
          <TouchableOpacity onPress={() => setShowFilterModal(false)}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Date Range</Text>
            <View style={styles.filterOptions}>
              {['all', 'week', 'month', 'quarter'].map((option, index) => (
                <TouchableOpacity
                  key={`dateRange-${option}-${index}`}
                  style={[
                    styles.filterOption,
                    filters.dateRange === option && styles.activeFilterOption
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, dateRange: option as any }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.dateRange === option && styles.activeFilterOptionText
                  ]}>
                    {option === 'all' ? 'All Time' : `Last ${option}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Severity</Text>
            <View style={styles.filterOptions}>
              {['all', 'critical', 'moderate', 'minor'].map((option, index) => (
                <TouchableOpacity
                  key={`severity-${option}-${index}`}
                  style={[
                    styles.filterOption,
                    filters.severity === option && styles.activeFilterOption
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, severity: option as any }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.severity === option && styles.activeFilterOptionText
                  ]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterOptions}>
              {['all', 'active', 'pending', 'cleared'].map((option, index) => (
                <TouchableOpacity
                  key={`status-${option}-${index}`}
                  style={[
                    styles.filterOption,
                    filters.status === option && styles.activeFilterOption
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, status: option as any }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.status === option && styles.activeFilterOptionText
                  ]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>System</Text>
            <View style={styles.filterOptions}>
              {['all', 'engine', 'transmission', 'abs', 'airbag', 'emissions', 'electrical'].map((option, index) => (
                <TouchableOpacity
                  key={`system-${option}-${index}`}
                  style={[
                    styles.filterOption,
                    filters.system === option && styles.activeFilterOption
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, system: option as any }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.system === option && styles.activeFilterOptionText
                  ]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => setFilters({
              dateRange: 'all',
              severity: 'all',
              status: 'all',
              system: 'all',
            })}
          >
            <Text style={styles.clearFiltersButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderNotesModal = () => (
    <Modal
      visible={showNotesModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Notes</Text>
          <TouchableOpacity onPress={() => setShowNotesModal(false)}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="Add notes about this diagnostic session..."
            value={editingNotes}
            onChangeText={setEditingNotes}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.saveNotesButton}
            onPress={handleSaveNotes}
          >
            <Text style={styles.saveNotesButtonText}>Save Notes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSessionModal = () => (
    <Modal
      visible={showSessionModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Session Details</Text>
          <TouchableOpacity onPress={() => setShowSessionModal(false)}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {selectedSession && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.sessionDetailHeader}>
              <Text style={styles.sessionDetailDate}>
                {formatDate(selectedSession.timestamp)}
              </Text>
              <Text style={styles.sessionDetailVehicle}>
                {selectedSession.vehicleInfo.year} {selectedSession.vehicleInfo.make} {selectedSession.vehicleInfo.model}
              </Text>
            </View>

            <View style={styles.sessionDetailSection}>
              <Text style={styles.sessionDetailSectionTitle}>Vehicle Information</Text>
              <View style={styles.vehicleInfoGrid}>
                <View style={styles.vehicleInfoItem}>
                  <Text style={styles.vehicleInfoLabel}>VIN</Text>
                  <Text style={styles.vehicleInfoValue}>{selectedSession.vehicleInfo.vin}</Text>
                </View>
                <View style={styles.vehicleInfoItem}>
                  <Text style={styles.vehicleInfoLabel}>Duration</Text>
                  <Text style={styles.vehicleInfoValue}>{selectedSession.duration} min</Text>
                </View>
              </View>
            </View>

            <View style={styles.sessionDetailSection}>
              <Text style={styles.sessionDetailSectionTitle}>Diagnostic Trouble Codes</Text>
              {selectedSession.dtcCodes.length > 0 ? (
                selectedSession.dtcCodes.map((code, index) => (
                  <View key={`dtc-${code.code}-${index}`} style={styles.dtcCodeItem}>
                    <View style={styles.dtcCodeHeader}>
                      <Text style={styles.dtcCodeNumber}>{code.code}</Text>
                      <View style={styles.dtcCodeStatus}>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: getSeverityColor(code.severity) }
                        ]} />
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(code.status) }
                        ]}>
                          {code.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.dtcCodeDescription}>{code.description}</Text>
                    <Text style={styles.dtcCodeSystem}>{code.system.toUpperCase()}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDtcCodes}>No diagnostic trouble codes found</Text>
              )}
            </View>

            <View style={styles.sessionDetailSection}>
              <Text style={styles.sessionDetailSectionTitle}>Readiness Monitors</Text>
              <View style={styles.readinessGrid}>
                <View style={styles.readinessItem}>
                  <Text style={styles.readinessLabel}>Total</Text>
                  <Text style={styles.readinessValue}>{selectedSession.readinessMonitors.total}</Text>
                </View>
                <View style={styles.readinessItem}>
                  <Text style={styles.readinessLabel}>Ready</Text>
                  <Text style={[styles.readinessValue, { color: '#4CAF50' }]}>
                    {selectedSession.readinessMonitors.ready}
                  </Text>
                </View>
                <View style={styles.readinessItem}>
                  <Text style={styles.readinessLabel}>Not Ready</Text>
                  <Text style={[styles.readinessValue, { color: '#FF8800' }]}>
                    {selectedSession.readinessMonitors.notReady}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sessionDetailSection}>
              <Text style={styles.sessionDetailSectionTitle}>Live Data Snapshot</Text>
              <View style={styles.liveDataGrid}>
                <View style={styles.liveDataItem}>
                  <Text style={styles.liveDataLabel}>RPM</Text>
                  <Text style={styles.liveDataValue}>{selectedSession.liveDataSnapshot.rpm}</Text>
                </View>
                <View style={styles.liveDataItem}>
                  <Text style={styles.liveDataLabel}>Speed</Text>
                  <Text style={styles.liveDataValue}>{selectedSession.liveDataSnapshot.speed} mph</Text>
                </View>
                <View style={styles.liveDataItem}>
                  <Text style={styles.liveDataLabel}>Load</Text>
                  <Text style={styles.liveDataValue}>{selectedSession.liveDataSnapshot.engineLoad}%</Text>
                </View>
                <View style={styles.liveDataItem}>
                  <Text style={styles.liveDataLabel}>Coolant</Text>
                  <Text style={styles.liveDataValue}>{selectedSession.liveDataSnapshot.coolantTemp}°C</Text>
                </View>
                <View style={styles.liveDataItem}>
                  <Text style={styles.liveDataLabel}>Fuel</Text>
                  <Text style={styles.liveDataValue}>{selectedSession.liveDataSnapshot.fuelLevel}%</Text>
                </View>
              </View>
            </View>

            <View style={styles.sessionDetailSection}>
              <View style={styles.notesHeader}>
                <Text style={styles.sessionDetailSectionTitle}>Notes</Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingNotes(selectedSession.notes || '');
                    setShowNotesModal(true);
                  }}
                >
                  <Ionicons name="create" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.notesText}>
                {selectedSession.notes || 'No notes added'}
              </Text>
            </View>
          </ScrollView>
        )}

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => selectedSession && handleExportSession(selectedSession)}
          >
            <Ionicons name="share" size={20} color="#007AFF" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => selectedSession && handleDeleteSession(selectedSession.id)}
          >
            <Ionicons name="trash" size={20} color="#FF4444" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Diagnostic History</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <Ionicons name="filter" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search codes, descriptions, or notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Total Sessions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {sessions.reduce((sum, session) => sum + session.dtcCodes.filter(code => code.status === 'active').length, 0)}
          </Text>
          <Text style={styles.statLabel}>Active Issues</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {Math.round(sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length) || 0}
          </Text>
          <Text style={styles.statLabel}>Avg Duration (min)</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : (
        <ScrollView style={styles.sessionsList}>
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionItem,
                  { borderLeftColor: getSeverityColor(getSessionSeverity(session) as any) }
                ]}
                onPress={() => {
                  setSelectedSession(session);
                  setShowSessionModal(true);
                }}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionDate}>{formatDate(session.timestamp)}</Text>
                  <Text style={styles.sessionDuration}>{session.duration} min</Text>
                </View>

                <Text style={styles.sessionVehicle}>
                  {session.vehicleInfo.year} {session.vehicleInfo.make} {session.vehicleInfo.model}
                </Text>

                <Text style={styles.sessionSummary}>{getSessionSummary(session)}</Text>

                <View style={styles.sessionFooter}>
                  <View style={styles.sessionTags}>
                    {session.dtcCodes.length > 0 && (
                      <View style={styles.sessionTag}>
                        <Text style={styles.sessionTagText}>{session.dtcCodes.length} DTC</Text>
                      </View>
                    )}
                    <View style={[
                      styles.sessionTag,
                      { backgroundColor: session.readinessMonitors.notReady > 0 ? '#FFE5CC' : '#E5F5E5' }
                    ]}>
                      <Text style={[
                        styles.sessionTagText,
                        { color: session.readinessMonitors.notReady > 0 ? '#FF8800' : '#4CAF50' }
                      ]}>
                        {session.readinessMonitors.ready}/{session.readinessMonitors.total} Ready
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text" size={64} color="#CCC" />
              <Text style={styles.emptyStateTitle}>No Sessions Found</Text>
              <Text style={styles.emptyStateMessage}>
                {searchQuery || Object.values(filters).some(f => f !== 'all')
                  ? 'Try adjusting your search or filters'
                  : 'Your diagnostic history will appear here'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {renderFilterModal()}
      {renderSessionModal()}
      {renderNotesModal()}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 10,
  },
  sessionsList: {
    flex: 1,
    padding: 20,
  },
  sessionItem: {
    backgroundColor: theme.colors.card,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sessionDuration: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  sessionVehicle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sessionSummary: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTags: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionTag: {
    backgroundColor: theme.colors.cardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sessionTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 20,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.cardSecondary,
  },
  activeFilterOption: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  activeFilterOptionText: {
    color: '#FFF',
  },
  clearFiltersButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.cardSecondary,
  },
  clearFiltersButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  notesInput: {
    flex: 1,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 200,
  },
  saveNotesButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveNotesButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  sessionDetailHeader: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  sessionDetailDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  sessionDetailVehicle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sessionDetailSection: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  sessionDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  vehicleInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  vehicleInfoItem: {
    flex: 1,
    minWidth: '45%',
  },
  vehicleInfoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  vehicleInfoValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  dtcCodeItem: {
    backgroundColor: theme.colors.cardSecondary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dtcCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dtcCodeNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dtcCodeStatus: {
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
    fontWeight: '500',
  },
  dtcCodeDescription: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  dtcCodeSystem: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  noDtcCodes: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  readinessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  readinessItem: {
    flex: 1,
    backgroundColor: theme.colors.cardSecondary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  readinessLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  readinessValue: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  liveDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  liveDataItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.cardSecondary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  liveDataLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  liveDataValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.cardSecondary,
  },
  exportButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FF4444',
    fontWeight: '500',
  },
});