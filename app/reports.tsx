import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mock data types
interface ReportData {
  id: string;
  title: string;
  date: string;
  type: 'diagnostic' | 'performance' | 'maintenance' | 'dtc';
  status: 'completed' | 'generating' | 'failed';
  size: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    mileage: number;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedTime: string;
}

const ReportsScreen: React.FC = () => {
  const router = useRouter();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReports, setGeneratingReports] = useState<string[]>([]);

  useEffect(() => {
    loadReports();
    loadTemplates();
  }, []);

  const loadReports = async () => {
    // Mock API call
    setTimeout(() => {
      setReports([
        {
          id: '1',
          title: 'Comprehensive Diagnostic Report',
          date: '2024-06-10',
          type: 'diagnostic',
          status: 'completed',
          size: '2.3 MB',
          vehicleInfo: {
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            mileage: 45000,
          },
        },
        {
          id: '2',
          title: 'Performance Analysis',
          date: '2024-06-08',
          type: 'performance',
          status: 'completed',
          size: '1.8 MB',
          vehicleInfo: {
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            mileage: 44950,
          },
        },
        {
          id: '3',
          title: 'DTC Code Analysis',
          date: '2024-06-05',
          type: 'dtc',
          status: 'generating',
          size: '---',
          vehicleInfo: {
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            mileage: 44900,
          },
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  const loadTemplates = () => {
    setTemplates([
      {
        id: '1',
        name: 'Full Diagnostic Report',
        description: 'Complete vehicle health assessment with all systems',
        icon: 'document-text',
        estimatedTime: '5-10 min',
      },
      {
        id: '2',
        name: 'Performance Report',
        description: 'Engine performance metrics and fuel efficiency analysis',
        icon: 'speedometer',
        estimatedTime: '3-5 min',
      },
      {
        id: '3',
        name: 'DTC Analysis',
        description: 'Detailed diagnostic trouble codes report',
        icon: 'warning',
        estimatedTime: '2-3 min',
      },
      {
        id: '4',
        name: 'Maintenance Schedule',
        description: 'Recommended maintenance based on vehicle data',
        icon: 'calendar',
        estimatedTime: '1-2 min',
      },
    ]);
  };

  const generateReport = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setGeneratingReports(prev => [...prev, templateId]);

    // Mock report generation
    setTimeout(() => {
      const newReport: ReportData = {
        id: Date.now().toString(),
        title: template.name,
        date: new Date().toISOString().split('T')[0],
        type: templateId === '1' ? 'diagnostic' : 
              templateId === '2' ? 'performance' : 
              templateId === '3' ? 'dtc' : 'maintenance',
        status: 'completed',
        size: '1.5 MB',
        vehicleInfo: {
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          mileage: 45000,
        },
      };

      setReports(prev => [newReport, ...prev]);
      setGeneratingReports(prev => prev.filter(id => id !== templateId));
      
      Alert.alert(
        'Report Generated',
        `${template.name} has been generated successfully!`,
        [{ text: 'OK' }]
      );
    }, 3000);
  };

  const shareReport = async (report: ReportData) => {
    try {
      await Share.share({
        message: `OBDII Diagnostic Report - ${report.title}\nGenerated: ${report.date}\nVehicle: ${report.vehicleInfo.year} ${report.vehicleInfo.make} ${report.vehicleInfo.model}`,
        title: report.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const deleteReport = (reportId: string) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setReports(prev => prev.filter(r => r.id !== reportId));
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'generating': return '#ffc107';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'diagnostic': return 'medical';
      case 'performance': return 'speedometer';
      case 'maintenance': return 'construct';
      case 'dtc': return 'warning';
      default: return 'document';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Report Templates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generate New Report</Text>
          <View style={styles.templatesGrid}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  generatingReports.includes(template.id) && styles.templateCardGenerating
                ]}
                onPress={() => generateReport(template.id)}
                disabled={generatingReports.includes(template.id)}
              >
                <View style={styles.templateIcon}>
                  {generatingReports.includes(template.id) ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Ionicons name={template.icon as any} size={24} color="#007AFF" />
                  )}
                </View>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
                <Text style={styles.templateTime}>
                  {generatingReports.includes(template.id) ? 'Generating...' : template.estimatedTime}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generated Reports Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generated Reports</Text>
          {reports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No reports generated yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Generate your first report using the templates above
              </Text>
            </View>
          ) : (
            reports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportIconContainer}>
                    <Ionicons 
                      name={getTypeIcon(report.type) as any} 
                      size={20} 
                      color="#007AFF" 
                    />
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <Text style={styles.reportDate}>{report.date}</Text>
                    <Text style={styles.reportVehicle}>
                      {report.vehicleInfo.year} {report.vehicleInfo.make} {report.vehicleInfo.model}
                    </Text>
                  </View>
                  <View style={styles.reportActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => shareReport(report)}
                      disabled={report.status !== 'completed'}
                    >
                      <Ionicons name="share-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteReport(report.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.reportFooter}>
                  <View style={styles.reportStatus}>
                    <View 
                      style={[
                        styles.statusIndicator, 
                        { backgroundColor: getStatusColor(report.status) }
                      ]} 
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.reportSize}>{report.size}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  helpButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  templateCardGenerating: {
    opacity: 0.7,
  },
  templateIcon: {
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  templateDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  templateTime: {
    fontSize: 11,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  reportVehicle: {
    fontSize: 12,
    color: '#666',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportSize: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});

export default ReportsScreen;