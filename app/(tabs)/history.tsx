import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Filter,
  Search,
} from 'lucide-react-native';

export default function TabsHistory() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock history data
  const [historyData] = useState([
    {
      id: 1,
      date: '2024-06-10',
      time: '09:15 AM',
      type: 'diagnostic_scan',
      title: 'Full System Scan',
      status: 'completed',
      issues_found: 2,
      description: 'Routine diagnostic scan completed',
    },
    {
      id: 2,
      date: '2024-06-09',
      time: '03:30 PM',
      type: 'error_cleared',
      title: 'Error Code Cleared',
      status: 'completed',
      issues_found: 0,
      description: 'P0301 - Cylinder 1 Misfire cleared after repair',
    },
    {
      id: 3,
      date: '2024-06-08',
      time: '11:45 AM',
      type: 'live_data',
      title: 'Live Data Session',
      status: 'completed',
      issues_found: 1,
      description: '45-minute monitoring session',
    },
    {
      id: 4,
      date: '2024-06-07',
      time: '02:20 PM',
      type: 'diagnostic_scan',
      title: 'Quick Scan',
      status: 'interrupted',
      issues_found: 3,
      description: 'Scan interrupted - connection lost',
    },
    {
      id: 5,
      date: '2024-06-06',
      time: '10:00 AM',
      type: 'report_generated',
      title: 'Monthly Report',
      status: 'completed',
      issues_found: 0,
      description: 'Monthly diagnostic report generated',
    },
  ]);

  const filters = [
    { key: 'all', label: 'All', count: historyData.length },
    { key: 'diagnostic_scan', label: 'Scans', count: 2 },
    { key: 'error_cleared', label: 'Repairs', count: 1 },
    { key: 'live_data', label: 'Sessions', count: 1 },
    { key: 'report_generated', label: 'Reports', count: 1 },
  ];

  const filteredData = selectedFilter === 'all' 
    ? historyData 
    : historyData.filter(item => item.type === selectedFilter);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111111' : '#f5f5f5',
    },
    scrollContent: {
      padding: 16,
    },
    filterContainer: {
      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#d1d5db',
    },
    filterChipActive: {
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
    },
    filterText: {
      fontSize: 14,
      color: isDark ? '#d1d5db' : '#4b5563',
    },
    filterTextActive: {
      color: 'white',
      fontWeight: '600',
    },
    historyCard: {
      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1f1f1f',
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    metaText: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginLeft: 4,
    },
    cardDescription: {
      fontSize: 14,
      color: isDark ? '#d1d5db' : '#4b5563',
      lineHeight: 20,
      marginBottom: 8,
    },
    issuesFound: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    actionButton: {
      flex: 1,
      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {
      fontSize: 14,
      color: isDark ? '#ffffff' : '#1f1f1f',
      marginLeft: 8,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#9ca3af' : '#6b7280',
      textAlign: 'center',
      marginTop: 16,
    },
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'diagnostic_scan': return '#3b82f6';
      case 'error_cleared': return '#10b981';
      case 'live_data': return '#f59e0b';
      case 'report_generated': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'interrupted': return '#ef4444';
      case 'in_progress': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getIssuesColor = (count: number) => {
    if (count === 0) return '#10b981';
    if (count <= 2) return '#f59e0b';
    return '#ef4444';
  };

  type FilterType = {
    key: string;
    label: string;
    count: number;
  };

  const FilterChip = ({ filter }: { filter: FilterType }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilter === filter.key && styles.filterChipActive
      ]}
      onPress={() => setSelectedFilter(filter.key)}
    >
      <Text style={[
        styles.filterText,
        selectedFilter === filter.key && styles.filterTextActive
      ]}>
        {filter.label} ({filter.count})
      </Text>
    </TouchableOpacity>
  );

  type HistoryItem = {
    id: number;
    date: string;
    time: string;
    type: string;
    title: string;
    status: string;
    issues_found: number;
    description: string;
  };

  const HistoryCard = ({ item }: { item: HistoryItem }) => (
    <View style={[
      styles.historyCard,
      { borderLeftColor: getTypeColor(item.type) }
    ]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) + '20' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item.status) }
          ]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <Calendar size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
        <Text style={styles.metaText}>{item.date}</Text>
        <Clock size={12} color={isDark ? '#9ca3af' : '#6b7280'} style={{ marginLeft: 12 }} />
        <Text style={styles.metaText}>{item.time}</Text>
      </View>

      <Text style={styles.cardDescription}>{item.description}</Text>

      <View style={styles.cardMeta}>
        <AlertTriangle size={12} color={getIssuesColor(item.issues_found)} />
        <Text style={[
          styles.issuesFound,
          { color: getIssuesColor(item.issues_found) }
        ]}>
          {item.issues_found} issues found
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Filters */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            {filters.map((filter) => (
              <FilterChip key={filter.key} filter={filter} />
            ))}
          </View>
        </View>

        {/* History Items */}
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FileText size={48} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text style={styles.emptyText}>
              No history items found for the selected filter
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/history')}
          >
            <Search size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={styles.actionText}>Advanced Search</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/reports')}
          >
            <FileText size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={styles.actionText}>Export History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}