import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
// SafeAreaView removed - using View instead
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';

// Import OBD service
import OBDIIService from '../../services/obdii/OBDIIService';

interface PIDTestCandidate {
  id: string;
  name: string;
  mode: string;
  pid: string;
  description: string;
  expectedBytes: number;
  parseFunction: (bytes: number[]) => number;
  manufacturer?: string;
  notes?: string;
}

interface PIDTestResult {
  id: string;
  command: string;
  success: boolean;
  response: string;
  parsedValue?: number;
  error?: string;
  timestamp: string;
  duration: number;
}

export default function PIDTestScreen() {
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const connectionState = useSelector((state: any) => state.connection);
  const [testCandidates, setTestCandidates] = useState<PIDTestCandidate[]>([]);
  const [testResults, setTestResults] = useState<PIDTestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);
  const [autoTest, setAutoTest] = useState(false);
  const [delayBetweenTests, setDelayBetweenTests] = useState('1000');
  const [customPID, setCustomPID] = useState({ mode: '22', pid: '', name: '' });

  // Predefined PID candidates for Toyota odometer testing
  const defaultCandidates: PIDTestCandidate[] = [
    {
      id: 'toyota_25ae',
      name: 'ODOMETER_TOYOTA_25AE',
      mode: '22',
      pid: '25AE',
      description: 'Toyota Odometer (commonly referenced)',
      expectedBytes: 4,
      parseFunction: (bytes) => bytes.length >= 4 ? (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3] : 0,
      manufacturer: 'Toyota',
      notes: 'Most commonly referenced Toyota PID'
    },
    {
      id: 'toyota_25a6',
      name: 'ODOMETER_TOYOTA_25A6',
      mode: '22',
      pid: '25A6',
      description: 'Toyota Odometer (alternative)',
      expectedBytes: 4,
      parseFunction: (bytes) => bytes.length >= 4 ? (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3] : 0,
      manufacturer: 'Toyota'
    },
    {
      id: 'toyota_2580',
      name: 'ODOMETER_TOYOTA_2580',
      mode: '22',
      pid: '2580',
      description: 'Toyota Odometer (variant)',
      expectedBytes: 3,
      parseFunction: (bytes) => bytes.length >= 3 ? (bytes[0] * 65536) + (bytes[1] * 256) + bytes[2] : 0,
      manufacturer: 'Toyota'
    },
    {
      id: 'toyota_0166',
      name: 'ODOMETER_TOYOTA_0166',
      mode: '22',
      pid: '0166',
      description: 'Toyota Total Distance',
      expectedBytes: 4,
      parseFunction: (bytes) => bytes.length >= 4 ? (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3] : 0,
      manufacturer: 'Toyota'
    },
    {
      id: 'standard_a6',
      name: 'ODOMETER_STANDARD',
      mode: '01',
      pid: 'A6',
      description: 'Standard OBD-II Odometer',
      expectedBytes: 4,
      parseFunction: (bytes) => bytes.length >= 4 ? (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3] : 0,
      notes: 'Standard PID for newer vehicles'
    },
    {
      id: 'toyota_21',
      name: 'DISTANCE_WITH_MIL_ON',
      mode: '01',
      pid: '21',
      description: 'Distance with MIL on (reference)',
      expectedBytes: 2,
      parseFunction: (bytes) => bytes.length >= 2 ? (bytes[0] * 256) + bytes[1] : 0,
      notes: 'For comparison - should work on most vehicles'
    },
    {
      id: 'toyota_31',
      name: 'DISTANCE_SINCE_CODES_CLEARED',
      mode: '01',
      pid: '31',
      description: 'Distance since codes cleared (reference)',
      expectedBytes: 2,
      parseFunction: (bytes) => bytes.length >= 2 ? (bytes[0] * 256) + bytes[1] : 0,
      notes: 'For comparison - should work on most vehicles'
    }
  ];

  useEffect(() => {
    // Initialize with default candidates
    setTestCandidates(defaultCandidates);
  }, []);

  const formatCommand = (mode: string, pid: string): string => {
    return `${mode}${pid}`;
  };

  const parseResponse = (response: string): number[] => {
    // Remove spaces and convert hex string to byte array
    const cleanResponse = response.replace(/\s+/g, '');
    const bytes: number[] = [];
    
    // Skip the response header (first 6 characters for Mode 22: "6222XX")
    const dataStart = response.startsWith('62') ? 6 : 4;
    
    for (let i = dataStart; i < cleanResponse.length; i += 2) {
      const hexByte = cleanResponse.substr(i, 2);
      if (hexByte.length === 2) {
        bytes.push(parseInt(hexByte, 16));
      }
    }
    
    return bytes;
  };

  const testSinglePID = async (candidate: PIDTestCandidate): Promise<PIDTestResult> => {
    const startTime = Date.now();
    const command = formatCommand(candidate.mode, candidate.pid);
    
    try {
      console.log(`Testing PID: ${command} (${candidate.name})`);
      
      // Send command via OBD service
      const response = await OBDIIService.sendCommand(command);
      const duration = Date.now() - startTime;
      
      if (response && !response.includes('NO DATA') && !response.includes('ERROR')) {
        // Parse the response
        const bytes = parseResponse(response);
        const parsedValue = candidate.parseFunction(bytes);
        
        return {
          id: candidate.id,
          command,
          success: true,
          response,
          parsedValue,
          timestamp: new Date().toISOString(),
          duration
        };
      } else {
        return {
          id: candidate.id,
          command,
          success: false,
          response: response || 'NO RESPONSE',
          error: 'No data or error response',
          timestamp: new Date().toISOString(),
          duration
        };
      }
    } catch (error) {
      return {
        id: candidate.id,
        command,
        success: false,
        response: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  };

  const testAllPIDs = async () => {
    if (!connectionState.isConnected) {
      Alert.alert('Error', 'Please connect to an OBD-II adapter first');
      return;
    }

    // Check if connected to actual device (not simulation)
    if (connectionState.connectionType === 'simulation') {
      Alert.alert('Error', 'PID testing requires connection to an actual OBD-II device. Simulation mode is not supported for PID discovery.');
      return;
    }

    setIsTestingAll(true);
    setTestResults([]);
    setCurrentTestIndex(0);

    for (let i = 0; i < testCandidates.length; i++) {
      setCurrentTestIndex(i);
      const candidate = testCandidates[i];
      
      console.log(`Testing ${i + 1}/${testCandidates.length}: ${candidate.name}`);
      
      const result = await testSinglePID(candidate);
      setTestResults(prev => [...prev, result]);
      
      // Add delay between tests if specified
      if (autoTest && i < testCandidates.length - 1) {
        const delay = parseInt(delayBetweenTests) || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setCurrentTestIndex(-1);
    setIsTestingAll(false);
    
    Alert.alert('Test Complete', `Tested ${testCandidates.length} PID candidates. Check results below.`);
  };

  const testSingleCandidate = async (candidate: PIDTestCandidate) => {
    if (!connectionState.isConnected) {
      Alert.alert('Error', 'Please connect to an OBD-II adapter first');
      return;
    }

    // Check if connected to actual device (not simulation)
    if (connectionState.connectionType === 'simulation') {
      Alert.alert('Error', 'PID testing requires connection to an actual OBD-II device. Simulation mode is not supported for PID discovery.');
      return;
    }

    const result = await testSinglePID(candidate);
    setTestResults(prev => {
      const filtered = prev.filter(r => r.id !== candidate.id);
      return [...filtered, result];
    });
  };

  const addCustomPID = () => {
    if (!customPID.mode || !customPID.pid || !customPID.name) {
      Alert.alert('Error', 'Please fill in all custom PID fields');
      return;
    }

    const newCandidate: PIDTestCandidate = {
      id: `custom_${Date.now()}`,
      name: customPID.name,
      mode: customPID.mode,
      pid: customPID.pid.toUpperCase(),
      description: 'Custom PID',
      expectedBytes: 4,
      parseFunction: (bytes) => bytes.length >= 4 ? (bytes[0] * 16777216) + (bytes[1] * 65536) + (bytes[2] * 256) + bytes[3] : 0,
      notes: 'User added'
    };

    setTestCandidates(prev => [...prev, newCandidate]);
    setCustomPID({ mode: '22', pid: '', name: '' });
  };

  const removeCandidate = (id: string) => {
    setTestCandidates(prev => prev.filter(c => c.id !== id));
    setTestResults(prev => prev.filter(r => r.id !== id));
  };

  const getResultForCandidate = (id: string): PIDTestResult | undefined => {
    return testResults.find(r => r.id === id);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const exportResults = () => {
    const successfulResults = testResults.filter(r => r.success);
    if (successfulResults.length === 0) {
      Alert.alert('No Results', 'No successful PID responses to export');
      return;
    }

    let exportText = 'Toyota Odometer PID Test Results\n';
    exportText += '=====================================\n\n';
    
    successfulResults.forEach(result => {
      const candidate = testCandidates.find(c => c.id === result.id);
      exportText += `PID: ${result.command}\n`;
      exportText += `Name: ${candidate?.name || 'Unknown'}\n`;
      exportText += `Response: ${result.response}\n`;
      exportText += `Parsed Value: ${result.parsedValue} km\n`;
      exportText += `Duration: ${result.duration}ms\n`;
      exportText += `Notes: ${candidate?.notes || 'None'}\n`;
      exportText += '---\n';
    });

    console.log('PID Test Results:', exportText);
    Alert.alert('Results Exported', 'Check console logs for full results');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Toyota Odometer PID Discovery</Text>
          <Text style={styles.subtitle}>
            Test multiple PID combinations to find the correct Toyota odometer reading
          </Text>
        </View>

        {/* Connection Status */}
        <View style={[styles.card, { backgroundColor: connectionState.isConnected ? '#e8f5e8' : '#ffeaea' }]}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={connectionState.isConnected ? 'checkmark-circle' : 'close-circle'} 
              size={24} 
              color={connectionState.isConnected ? '#4CAF50' : '#f44336'} 
            />
            <Text style={styles.statusText}>
              {connectionState.isConnected ? 'Connected to OBD-II Adapter' : 'Not Connected'}
            </Text>
          </View>
          {connectionState.isConnected && (
            <Text style={styles.connectionDetails}>
              {connectionState.deviceName} via {connectionState.connectionType}
              {connectionState.connectionType === 'simulation' && (
                <Text style={styles.warningText}> (PID testing not available in simulation)</Text>
              )}
            </Text>
          )}
        </View>

        {/* Test Controls */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Test Controls</Text>
          
          <View style={styles.controlRow}>
            <Text>Auto delay between tests:</Text>
            <Switch value={autoTest} onValueChange={setAutoTest} />
          </View>
          
          {autoTest && (
            <View style={styles.inputGroup}>
              <Text>Delay (ms):</Text>
              <TextInput
                style={styles.smallInput}
                value={delayBetweenTests}
                onChangeText={setDelayBetweenTests}
                keyboardType="numeric"
                placeholder="1000"
              />
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={testAllPIDs}
              disabled={isTestingAll || !connectionState.isConnected || connectionState.connectionType === 'simulation'}
            >
              <Text style={styles.buttonText}>
                {isTestingAll ? `Testing ${currentTestIndex + 1}/${testCandidates.length}` : 'Test All PIDs'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={clearResults}
            >
              <Text style={styles.buttonText}>Clear Results</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.accentButton]} 
            onPress={exportResults}
            disabled={testResults.length === 0}
          >
            <Text style={styles.buttonText}>Export Results</Text>
          </TouchableOpacity>
        </View>

        {/* Add Custom PID */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add Custom PID</Text>
          <View style={styles.inputGroup}>
            <Text>Mode:</Text>
            <TextInput
              style={styles.input}
              value={customPID.mode}
              onChangeText={(text) => setCustomPID(prev => ({ ...prev, mode: text }))}
              placeholder="22"
              maxLength={2}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text>PID:</Text>
            <TextInput
              style={styles.input}
              value={customPID.pid}
              onChangeText={(text) => setCustomPID(prev => ({ ...prev, pid: text.toUpperCase() }))}
              placeholder="25AE"
              maxLength={4}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text>Name:</Text>
            <TextInput
              style={styles.input}
              value={customPID.name}
              onChangeText={(text) => setCustomPID(prev => ({ ...prev, name: text }))}
              placeholder="CUSTOM_ODOMETER"
            />
          </View>
          <TouchableOpacity style={[styles.button, styles.accentButton]} onPress={addCustomPID}>
            <Text style={styles.buttonText}>Add PID</Text>
          </TouchableOpacity>
        </View>

        {/* PID Candidates */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PID Candidates ({testCandidates.length})</Text>
          {testCandidates.map((candidate, index) => {
            const result = getResultForCandidate(candidate.id);
            const isCurrentTest = currentTestIndex === index;
            
            return (
              <View key={candidate.id} style={[
                styles.candidateCard,
                isCurrentTest && styles.currentTestCard,
                result?.success && styles.successCard,
                result && !result.success && styles.errorCard
              ]}>
                <View style={styles.candidateHeader}>
                  <Text style={styles.candidateName}>{candidate.name}</Text>
                  <TouchableOpacity onPress={() => removeCandidate(candidate.id)}>
                    <Ionicons name="trash-outline" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.candidateCommand}>Command: {formatCommand(candidate.mode, candidate.pid)}</Text>
                <Text style={styles.candidateDescription}>{candidate.description}</Text>
                
                {candidate.manufacturer && (
                  <Text style={styles.candidateManufacturer}>Manufacturer: {candidate.manufacturer}</Text>
                )}
                
                {candidate.notes && (
                  <Text style={styles.candidateNotes}>Notes: {candidate.notes}</Text>
                )}

                {result && (
                  <View style={styles.resultSection}>
                    <Text style={[styles.resultStatus, result.success ? styles.successText : styles.errorText]}>
                      {result.success ? '✓ SUCCESS' : '✗ FAILED'}
                    </Text>
                    
                    {result.success ? (
                      <>
                        <Text style={styles.resultText}>Response: {result.response}</Text>
                        <Text style={styles.resultValue}>Parsed Value: {result.parsedValue} km</Text>
                        <Text style={styles.resultTime}>Duration: {result.duration}ms</Text>
                      </>
                    ) : (
                      <Text style={styles.errorText}>Error: {result.error}</Text>
                    )}
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.button, styles.testButton]} 
                  onPress={() => testSingleCandidate(candidate)}
                  disabled={isTestingAll || !connectionState.isConnected || connectionState.connectionType === 'simulation'}
                >
                  <Text style={styles.buttonText}>Test This PID</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        {testResults.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Test Summary</Text>
            <Text style={styles.summaryText}>
              Total Tests: {testResults.length}
            </Text>
            <Text style={styles.summaryText}>
              Successful: {testResults.filter(r => r.success).length}
            </Text>
            <Text style={styles.summaryText}>
              Failed: {testResults.filter(r => !r.success).length}
            </Text>
            
            {testResults.filter(r => r.success).length > 0 && (
              <View style={styles.successSummary}>
                <Text style={styles.successTitle}>✓ Working PIDs Found:</Text>
                {testResults.filter(r => r.success).map(result => {
                  const candidate = testCandidates.find(c => c.id === result.id);
                  return (
                    <Text key={result.id} style={styles.workingPID}>
                      • {result.command} ({candidate?.name}) = {result.parsedValue} km
                    </Text>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.dark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: theme.colors.text,
  },
  connectionDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 32,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.inputText,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 4,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.inputText,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    width: 80,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: theme.colors.buttonPrimary,
    flex: 1,
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: theme.colors.buttonSecondary,
    flex: 1,
    marginLeft: 8,
  },
  accentButton: {
    backgroundColor: theme.colors.buttonSuccess,
  },
  testButton: {
    backgroundColor: theme.colors.warning,
    marginTop: 12,
  },
  buttonText: {
    color: theme.colors.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
  candidateCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: theme.colors.card,
  },
  currentTestCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.gaugeBackground,
  },
  successCard: {
    borderColor: theme.colors.success,
    backgroundColor: theme.dark ? theme.colors.surface : '#e8f5e8',
  },
  errorCard: {
    borderColor: theme.colors.error,
    backgroundColor: theme.dark ? theme.colors.surface : '#ffeaea',
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  candidateCommand: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  candidateDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  candidateManufacturer: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  candidateNotes: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  resultSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  successText: {
    color: theme.colors.success,
  },
  errorText: {
    color: theme.colors.error,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  resultTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 8,
    color: theme.colors.text,
  },
  successSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: theme.dark ? theme.colors.surface : '#e8f5e8',
    borderRadius: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: 8,
  },
  workingPID: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  warningText: {
    color: theme.colors.warning || '#ff9800',
    fontWeight: 'bold',
  },
});