import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import OBDIIService from '../../services/obdii/OBDIIService';
import { unifiedDTCService } from '../../services/obdii/UnifiedDTCService';
import SettingsService from '../../services/settings/SettingsService';
import { UnitConverter } from '../../utils/unitConversion';
import { DataProcessor } from '../../utils/dataProcessing';

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
    throttlePosition?: number;
    fuelLevel?: number;
    intakeAirTemp?: number;
    maf?: number;
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
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [dtcCodes, setDtcCodes] = useState<DiagnosticTroubleCode[]>([]);
  
  // Unit preferences state
  const [tempUnit, setTempUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>('km');

  // Initialize with default states - will be updated from OBD-II data
  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([
    { system: 'Misfire Monitor', status: 'not_ready', icon: 'flash' },
    { system: 'Fuel System Monitor', status: 'not_ready', icon: 'water' },
    { system: 'Catalyst Monitor', status: 'not_ready', icon: 'leaf' },
    { system: 'Heated Catalyst Monitor', status: 'not_ready', icon: 'thermometer' },
    { system: 'Evaporative System Monitor', status: 'not_ready', icon: 'cloud' },
    { system: 'Secondary Air System Monitor', status: 'unsupported', icon: 'radio' },
    { system: 'Oxygen Sensor Monitor', status: 'not_ready', icon: 'analytics' },
    { system: 'Oxygen Sensor Heater Monitor', status: 'not_ready', icon: 'thermometer-outline' },
    { system: 'EGR System Monitor', status: 'not_ready', icon: 'repeat' },
  ]);

  // Initialize live data with default values - will be updated from OBD service
  const [liveData, setLiveData] = useState<LiveData[]>([
    { parameter: 'Engine RPM', value: '0', unit: 'rpm', status: 'normal', icon: 'speedometer' },
    { parameter: 'Vehicle Speed', value: '0', unit: 'km/h', status: 'normal', icon: 'car' },
    { parameter: 'Engine Load', value: '15', unit: '%', status: 'normal', icon: 'bar-chart' },
    { parameter: 'Coolant Temperature', value: '89', unit: '°C', status: 'normal', icon: 'thermometer' },
    { parameter: 'Intake Air Temperature', value: '23', unit: '°C', status: 'normal', icon: 'thermometer-outline' },
    { parameter: 'Throttle Position', value: '0', unit: '%', status: 'normal', icon: 'options' },
    { parameter: 'Fuel Level', value: '0', unit: '%', status: 'normal', icon: 'battery-charging' },
    { parameter: 'MAF Rate', value: '0', unit: 'g/s', status: 'normal', icon: 'logo-buffer' },
    { parameter: 'Battery Voltage', value: '0', unit: 'V', status: 'normal', icon: 'battery-half' },
    { parameter: 'Odometer', value: '0', unit: 'km', status: 'normal', icon: 'speedometer-outline' },
  ]);

  const [selectedTab, setSelectedTab] = useState<'dtc' | 'systems' | 'live' | 'search'>('dtc');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDTC, setSelectedDTC] = useState<DiagnosticTroubleCode | null>(null);
  const [showDTCModal, setShowDTCModal] = useState(false);
  const [loadingFreezeFrame, setLoadingFreezeFrame] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  // Helper function to convert Mode 05/06 readiness data to UI system status format
  const convertReadinessToSystemStatus = (readiness: any): SystemStatus[] => {
    const monitorMapping = [
      { key: 'misfireMonitor', name: 'Misfire Monitor', icon: 'flash' as const },
      { key: 'fuelSystemMonitor', name: 'Fuel System Monitor', icon: 'water' as const },
      { key: 'catalystMonitor', name: 'Catalyst Monitor', icon: 'leaf' as const },
      { key: 'heatedCatalystMonitor', name: 'Heated Catalyst Monitor', icon: 'thermometer' as const },
      { key: 'evaporativeSystemMonitor', name: 'Evaporative System Monitor', icon: 'cloud' as const },
      { key: 'secondaryAirSystemMonitor', name: 'Secondary Air System Monitor', icon: 'radio' as const },
      { key: 'oxygenSensorMonitor', name: 'Oxygen Sensor Monitor', icon: 'analytics' as const },
      { key: 'oxygenSensorHeaterMonitor', name: 'Oxygen Sensor Heater Monitor', icon: 'thermometer-outline' as const },
      { key: 'egrSystemMonitor', name: 'EGR System Monitor', icon: 'repeat' as const },
    ];

    return monitorMapping.map(monitor => {
      const monitorData = readiness[monitor.key];
      let status: SystemStatus['status'] = 'not_ready';
      let displayName = monitor.name;

      if (monitorData) {
        // Use the description from Mode 05/06 if available
        if (monitorData.description) {
          displayName = monitorData.description;
        }
        
        if (!monitorData.supported) {
          status = 'unsupported';
        } else if (monitorData.ready) {
          status = 'ready';
        } else {
          // Monitor is supported but test not complete or failed
          status = 'not_ready';
        }

        // For Mode 06 monitors with test results, check if test passed
        if (monitorData.testResults && typeof monitorData.testResults === 'object') {
          if (monitorData.testResults.passed) {
            status = 'ready';
          } else {
            status = 'incomplete'; // Test ran but failed
          }
        }
      }

      return {
        system: displayName,
        status,
        icon: monitor.icon
      };
    });
  };

  // Helper function to determine parameter status based on value
  // Note: Parameter status calculation is now handled by DataProcessor
  // This ensures consistent status determination across all screens

  // Load DTCs on component mount and manage live data
  useEffect(() => {
    loadDTCs();
    
    // Initialize unit preferences from settings
    const initializeSettings = async () => {
      const loadedSettings = await SettingsService.loadSettings();
      setTempUnit(loadedSettings.temperature_unit);
      setDistanceUnit(loadedSettings.distance_unit);
      
      // Update live data units based on settings
      setLiveData(prev => prev.map(item => {
        switch (item.parameter) {
          case 'Vehicle Speed':
            return { ...item, unit: loadedSettings.distance_unit === 'miles' ? 'mph' : 'km/h' };
          case 'Coolant Temperature':
          case 'Intake Air Temperature':
            return { ...item, unit: loadedSettings.temperature_unit === 'fahrenheit' ? '°F' : '°C' };
          case 'Odometer':
            return { ...item, unit: loadedSettings.distance_unit === 'miles' ? 'mi' : 'km' };
          default:
            return item;
        }
      }));
    };
    
    initializeSettings();
    
    // Start live data polling if connected
    const connectionStatus = OBDIIService.getConnectionStatus();
    if (connectionStatus.status === 'connected') {
      OBDIIService.startLiveData();
      
      // Query initial system readiness status using Mode 05/06
      const initialReadinessQuery = async () => {
        try {
          console.log('Diagnostics: Querying initial system readiness status using Mode 05/06...');
          await OBDIIService.querySystemReadiness();
        } catch (error) {
          console.error('Diagnostics: Failed to query initial system readiness:', error);
        }
      };
      
      initialReadinessQuery();
    }
    
    // Listen for settings changes
    const handleSettingsChange = () => {
      const newTempUnit = SettingsService.getTemperatureUnit();
      const newDistanceUnit = SettingsService.getDistanceUnit();
      setTempUnit(newTempUnit);
      setDistanceUnit(newDistanceUnit);
      
      // Update live data units
      setLiveData(prev => prev.map(item => {
        switch (item.parameter) {
          case 'Vehicle Speed':
            return { ...item, unit: newDistanceUnit === 'miles' ? 'mph' : 'km/h' };
          case 'Coolant Temperature':
          case 'Intake Air Temperature':
            return { ...item, unit: newTempUnit === 'fahrenheit' ? '°F' : '°C' };
          case 'Odometer':
            return { ...item, unit: newDistanceUnit === 'miles' ? 'mi' : 'km' };
          default:
            return item;
        }
      }));
    };
    
    SettingsService.on('settingChanged:temperature_unit', handleSettingsChange);
    SettingsService.on('settingChanged:distance_unit', handleSettingsChange);
    
    // Subscribe to DTC events and live data from OBDIIService
    const unsubscribe = OBDIIService.subscribe((event, data) => {
      if (event === 'dtcScanComplete') {
        setDtcCodes(data);
        setIsScanning(false);
      } else if (event === 'dtcCleared') {
        if (data.success) {
          setDtcCodes(prev => prev.map(code => ({ ...code, status: 'cleared' as const })));
        }
      } else if (event === 'dataUpdate') {
        // Update live data based on OBD-II data updates
        console.log('Diagnostics: Received dataUpdate:', data.name, '=', data.value);
        
        const processedData = DataProcessor.processOBDData(data.name, data.value);
        console.log('Diagnostics: Processed data:', processedData);
        
        setLiveData(prev => prev.map(item => {
          // Map OBD-II PID names to display parameter names
          const parameterMap: { [key: string]: string } = {
            'ENGINE_RPM': 'Engine RPM',
            'VEHICLE_SPEED': 'Vehicle Speed',
            'ENGINE_COOLANT_TEMP': 'Coolant Temperature',
            'INTAKE_AIR_TEMP': 'Intake Air Temperature',
            'AIR_INTAKE_TEMP': 'Intake Air Temperature',
            'ENGINE_LOAD': 'Engine Load',
            'THROTTLE_POSITION': 'Throttle Position',
            'FUEL_LEVEL': 'Fuel Level',
            'MAF_RATE': 'MAF Rate',
            'CONTROL_MODULE_VOLTAGE': 'Battery Voltage',
            'TOTAL_DISTANCE': 'Odometer',
            'ODOMETER': 'Odometer',
            'VEHICLE_ODOMETER': 'Odometer',
            'TOTAL_DISTANCE_TRAVELED': 'Odometer'
          };
          
          const matchingParameter = parameterMap[data.name];
          
          if (item.parameter === matchingParameter) {
            return {
              ...item,
              value: processedData.displayValue,
              unit: processedData.unit,
              status: processedData.status
            };
          }
          
          return item;
        }));
      } else if (event === 'connectionStatus') {
        setConnectionStatus(data.status);
      } else if (event === 'systemReadiness') {
        // Update system readiness status from OBD-II data
        console.log('Diagnostics: Received system readiness update:', data);
        const updatedSystemStatuses = convertReadinessToSystemStatus(data);
        setSystemStatuses(updatedSystemStatuses);
      }
    });
    
    return () => {
      // Remove settings listeners
      SettingsService.removeListener('settingChanged:temperature_unit', handleSettingsChange);
      SettingsService.removeListener('settingChanged:distance_unit', handleSettingsChange);
      
      if (unsubscribe) unsubscribe();
      OBDIIService.stopLiveData();
    };
  }, []);

  // Ensure live data is running when screen is focused and live tab is selected
  useFocusEffect(
    useCallback(() => {
      const connectionStatus = OBDIIService.getConnectionStatus();
      console.log('Diagnostics: Connection status:', connectionStatus);
      
      if (connectionStatus.status === 'connected') {
        // Always ensure live data is running when this screen is focused
        console.log('Diagnostics: Starting live data...');
        OBDIIService.startLiveData();
        
        // Query system readiness status using proper Mode 05/06 methods
        const querySystemReadiness = async () => {
          try {
            console.log('Diagnostics: Querying system readiness status using Mode 05/06...');
            await OBDIIService.querySystemReadiness();
          } catch (error) {
            console.error('Diagnostics: Failed to query system readiness:', error);
          }
        };
        
        // Query immediately and then periodically
        querySystemReadiness();
        const readinessInterval = setInterval(querySystemReadiness, 10000); // Every 10 seconds
        
        // Check which PIDs are being polled
        setTimeout(() => {
          const activePIDs = OBDIIService.getActivePollingPIDs();
          console.log('Diagnostics: Active polling PIDs:', activePIDs);
        }, 1000);
        
        // Store interval ID for cleanup
        (useFocusEffect as any).readinessInterval = readinessInterval;
      }
      
      return () => {
        // Clean up readiness query interval
        if ((useFocusEffect as any).readinessInterval) {
          clearInterval((useFocusEffect as any).readinessInterval);
        }
        
        // Don't stop live data here as other screens might need it
        // The dashboard will manage the global live data state
      };
    }, [selectedTab])
  );

  const loadDTCs = async () => {
    try {
      const connectionStatus = OBDIIService.getConnectionStatus();
      if (connectionStatus.status === 'connected') {
        const dtcs = await OBDIIService.scanDTC();
        setDtcCodes(dtcs);
      }
    } catch (error) {
      console.error('Error loading DTCs:', error);
    }
  };


  const handleScanDTC = async () => {
    setIsScanning(true);
    
    try {
      const connectionStatus = OBDIIService.getConnectionStatus();
      if (connectionStatus.status !== 'connected') {
        Alert.alert(
          'Not Connected',
          'Please connect to an OBD-II adapter or enable simulation mode to scan for DTCs.',
          [{ text: 'OK' }]
        );
        setIsScanning(false);
        return;
      }

      // Step 1: Query MIL status (Mode 01 PID 01) to determine number of stored DTCs
      console.log('📡 Step 1: Querying MIL status to determine DTC count...');
      const milStatus = await OBDIIService.queryMILStatus();
      console.log('📊 MIL Status Result:', milStatus);
      
      // Step 2: If DTCs are present, scan for actual codes (Mode 03)
      let dtcs = [];
      if (milStatus.dtcCount > 0) {
        console.log(`📡 Step 2: ${milStatus.dtcCount} DTCs detected, scanning for actual codes...`);
        dtcs = await OBDIIService.scanDTC();
        setDtcCodes(dtcs);
      } else {
        console.log('✅ No DTCs stored, skipping Mode 03 scan');
        setDtcCodes([]);
      }
      
      // Show comprehensive scan results
      const milStatusText = milStatus.milActive ? 'MIL ON' : 'MIL OFF';
      const activeCodes = dtcs.filter(code => code.status === 'active').length;
      
      Alert.alert(
        'Scan Complete',
        `${milStatusText}\n` +
        `Stored DTCs: ${milStatus.dtcCount}\n` +
        `Active DTCs Found: ${activeCodes}\n\n` +
        `${milStatus.dtcCount === 0 ? 'No diagnostic trouble codes found.' : 
          `Found ${activeCodes} active diagnostic trouble code${activeCodes !== 1 ? 's' : ''} out of ${milStatus.dtcCount} stored.`}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('DTC scan failed:', error);
      Alert.alert(
        'Scan Failed',
        'Failed to scan for diagnostic trouble codes. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearDTC = () => {
    const connectionStatus = OBDIIService.getConnectionStatus();
    if (connectionStatus.status !== 'connected') {
      Alert.alert(
        'Not Connected',
        'Please connect to an OBD-II adapter or enable simulation mode to clear DTCs.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Clear Diagnostic Codes',
      'Are you sure you want to clear all diagnostic trouble codes? This will also turn off the Check Engine Light.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await OBDIIService.clearDTC();
              
              if (success) {
                setDtcCodes((prev: DiagnosticTroubleCode[]) =>
                  prev.map((code: DiagnosticTroubleCode) => ({ ...code, status: 'cleared' as const }))
                );
                Alert.alert(
                  'Success', 
                  'All diagnostic codes have been cleared and the Check Engine Light should turn off.'
                );
              } else {
                Alert.alert(
                  'Failed',
                  'Failed to clear diagnostic codes. Please try again.'
                );
              }
            } catch (error) {
              console.error('Clear DTC failed:', error);
              Alert.alert(
                'Error',
                'An error occurred while clearing diagnostic codes.'
              );
            }
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

  // const getSystemStatusColor = (status: SystemStatus['status']) => {
  //   switch (status) {
  //     case 'ready': return '#4CAF50';
  //     case 'not_ready': return '#FF8800';
  //     case 'incomplete': return '#FF4444';
  //     case 'unsupported': return '#666';
  //     default: return '#666';
  //   }
  // };

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
        {dtcCodes.map((code: DiagnosticTroubleCode, index: number) => (
          <TouchableOpacity
            key={`dtc-${code.code}-${index}`}
            style={styles.codeItem}
            onPress={async () => {
              setSelectedDTC(code);
              setShowDTCModal(true);
              
              // Refresh freeze frame data when DTC is selected
              if (code.code) {
                setLoadingFreezeFrame(true);
                try {
                  const connectionStatus = OBDIIService.getConnectionStatus();
                  if (connectionStatus.status === 'connected') {
                    const freezeFrameData = await OBDIIService.queryFreezeFrameData(code.code);
                    
                    // Update the selected DTC with fresh freeze frame data
                    setSelectedDTC((prev: DiagnosticTroubleCode | null) => prev ? {
                      ...prev,
                      freezeFrameData: {
                        ...freezeFrameData,
                        timestamp: freezeFrameData.timestamp || new Date()
                      }
                    } : null);
                  }
                } catch (error) {
                  console.error('Failed to refresh freeze frame data:', error);
                } finally {
                  setLoadingFreezeFrame(false);
                }
              }
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
        {systemStatuses.map((system: SystemStatus, index: number) => (
          <View key={`system-${system.system}-${index}`} style={styles.systemItem}>
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
        {liveData.map((data: LiveData, index: number) => (
          <View key={`live-${data.parameter}-${index}`} style={styles.liveDataItem}>
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    try {
      const results = unifiedDTCService.searchCodes(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const renderSearchTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Text style={styles.sectionTitle}>DTC Code Search</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter DTC code or search description..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>
      
      <ScrollView style={styles.searchResults}>
        {searchQuery.trim() === '' ? (
          <View style={styles.searchInstructions}>
            <Ionicons name="search" size={48} color="#CCC" />
            <Text style={styles.instructionText}>
              Search the comprehensive DTC database
            </Text>
            <Text style={styles.instructionSubtext}>
              Enter a DTC code (e.g., P0171) or search by keywords like "lean", "misfire", "catalyst"
            </Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.noResults}>
            <Ionicons name="alert-circle-outline" size={48} color="#999" />
            <Text style={styles.noResultsText}>No codes found for "{searchQuery}"</Text>
            <Text style={styles.noResultsSubtext}>Try a different search term</Text>
          </View>
        ) : (
          searchResults.map((result: any, index: number) => (
            <TouchableOpacity
              key={`search-${result.code}-${index}`}
              style={styles.searchResultItem}
              onPress={() => {
                setSelectedDTC({
                  code: result.code,
                  description: result.description,
                  severity: result.severity === 'critical' ? 'critical' : result.severity === 'high' ? 'critical' : result.severity === 'medium' ? 'moderate' : 'minor',
                  status: 'cleared' as const,
                  system: result.system.toLowerCase() === 'powertrain' ? 'engine' as const :
                          result.system.toLowerCase() === 'body' ? 'airbag' as const :
                          result.system.toLowerCase() === 'chassis' ? 'abs' as const :
                          result.system.toLowerCase() === 'network/communication' ? 'electrical' as const : 'engine' as const
                });
                setShowDTCModal(true);
              }}
            >
              <View style={styles.searchResultHeader}>
                <Text style={styles.searchResultCode}>{result.code}</Text>
                <View style={styles.searchResultSystem}>
                  <Text style={styles.searchResultSystemText}>{result.system}</Text>
                </View>
              </View>
              <Text style={styles.searchResultDescription} numberOfLines={2}>
                {result.description}
              </Text>
              {result.severity && (
                <View style={[styles.searchResultSeverity, { backgroundColor: getSeverityColor(result.severity === 'critical' ? 'critical' : result.severity === 'high' ? 'critical' : result.severity === 'medium' ? 'moderate' : 'minor') }]}>
                  <Text style={styles.searchResultSeverityText}>{result.severity.toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
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
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'search' && styles.activeTab]}
          onPress={() => setSelectedTab('search')}
        >
          <Text style={[styles.tabText, selectedTab === 'search' && styles.activeTabText]}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'dtc' && renderDTCTab()}
      {selectedTab === 'systems' && renderSystemsTab()}
      {selectedTab === 'live' && renderLiveTab()}
      {selectedTab === 'search' && renderSearchTab()}

      <Modal
        visible={showDTCModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
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
              
              {/* Additional DTC Information from unified database */}
              {(() => {
                const dtcInfo = unifiedDTCService.getDTCInfo(selectedDTC.code);
                return dtcInfo ? (
                  <>
                    {dtcInfo.causes && dtcInfo.causes.length > 0 && (
                      <View style={styles.dtcDetailSection}>
                        <Text style={styles.dtcDetailSectionTitle}>Possible Causes</Text>
                        {dtcInfo.causes.map((cause: string, index: number) => (
                          <Text key={index} style={styles.dtcDetailListItem}>• {cause}</Text>
                        ))}
                      </View>
                    )}
                    
                    {dtcInfo.symptoms && dtcInfo.symptoms.length > 0 && (
                      <View style={styles.dtcDetailSection}>
                        <Text style={styles.dtcDetailSectionTitle}>Symptoms</Text>
                        {dtcInfo.symptoms.map((symptom: string, index: number) => (
                          <Text key={index} style={styles.dtcDetailListItem}>• {symptom}</Text>
                        ))}
                      </View>
                    )}
                    
                    {dtcInfo.solutions && dtcInfo.solutions.length > 0 && (
                      <View style={styles.dtcDetailSection}>
                        <Text style={styles.dtcDetailSectionTitle}>Diagnostic Steps</Text>
                        {dtcInfo.solutions.map((solution: string, index: number) => (
                          <Text key={index} style={styles.dtcDetailListItem}>• {solution}</Text>
                        ))}
                      </View>
                    )}
                  </>
                ) : null;
              })()}

              <View style={styles.freezeFrameSection}>
                <Text style={styles.dtcDetailSectionTitle}>Freeze Frame Data</Text>
                {loadingFreezeFrame ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading freeze frame data...</Text>
                  </View>
                ) : selectedDTC.freezeFrameData ? (
                  <>
                    <View style={styles.freezeFrameGrid}>
                      <View style={styles.freezeFrameItem}>
                        <Text style={styles.freezeFrameLabel}>RPM</Text>
                        <Text style={styles.freezeFrameValue}>
                          {selectedDTC.freezeFrameData.rpm !== null && selectedDTC.freezeFrameData.rpm !== undefined ? selectedDTC.freezeFrameData.rpm : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.freezeFrameItem}>
                        <Text style={styles.freezeFrameLabel}>Speed</Text>
                        <Text style={styles.freezeFrameValue}>
                          {selectedDTC.freezeFrameData.speed !== null && selectedDTC.freezeFrameData.speed !== undefined ? 
                            `${Math.round(UnitConverter.convertSpeed(selectedDTC.freezeFrameData.speed, true))} ${distanceUnit === 'miles' ? 'mph' : 'km/h'}` : 
                            'N/A'}
                        </Text>
                      </View>
                      <View style={styles.freezeFrameItem}>
                        <Text style={styles.freezeFrameLabel}>Load</Text>
                        <Text style={styles.freezeFrameValue}>
                          {selectedDTC.freezeFrameData.engineLoad !== null && selectedDTC.freezeFrameData.engineLoad !== undefined ? `${selectedDTC.freezeFrameData.engineLoad}%` : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.freezeFrameItem}>
                        <Text style={styles.freezeFrameLabel}>Coolant</Text>
                        <Text style={styles.freezeFrameValue}>
                          {selectedDTC.freezeFrameData.coolantTemp !== null && selectedDTC.freezeFrameData.coolantTemp !== undefined ? 
                            `${Math.round(UnitConverter.convertTemperature(selectedDTC.freezeFrameData.coolantTemp, true))}${tempUnit === 'fahrenheit' ? '°F' : '°C'}` : 
                            'N/A'}
                        </Text>
                      </View>
                      {selectedDTC.freezeFrameData.throttlePosition !== undefined && selectedDTC.freezeFrameData.throttlePosition !== null && (
                        <View style={styles.freezeFrameItem}>
                          <Text style={styles.freezeFrameLabel}>Throttle</Text>
                          <Text style={styles.freezeFrameValue}>
                            {`${selectedDTC.freezeFrameData.throttlePosition}%`}
                          </Text>
                        </View>
                      )}
                      {selectedDTC.freezeFrameData.fuelLevel !== undefined && selectedDTC.freezeFrameData.fuelLevel !== null && (
                        <View style={styles.freezeFrameItem}>
                          <Text style={styles.freezeFrameLabel}>Fuel Level</Text>
                          <Text style={styles.freezeFrameValue}>
                            {`${selectedDTC.freezeFrameData.fuelLevel}%`}
                          </Text>
                        </View>
                      )}
                      {selectedDTC.freezeFrameData.intakeAirTemp !== undefined && selectedDTC.freezeFrameData.intakeAirTemp !== null && (
                        <View style={styles.freezeFrameItem}>
                          <Text style={styles.freezeFrameLabel}>Intake Air</Text>
                          <Text style={styles.freezeFrameValue}>
                            {`${Math.round(UnitConverter.convertTemperature(selectedDTC.freezeFrameData.intakeAirTemp, true))}${tempUnit === 'fahrenheit' ? '°F' : '°C'}`}
                          </Text>
                        </View>
                      )}
                      {selectedDTC.freezeFrameData.maf !== undefined && selectedDTC.freezeFrameData.maf !== null && (
                        <View style={styles.freezeFrameItem}>
                          <Text style={styles.freezeFrameLabel}>MAF Rate</Text>
                          <Text style={styles.freezeFrameValue}>
                            {`${selectedDTC.freezeFrameData.maf} g/s`}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.freezeFrameTimestamp}>
                      Recorded: {selectedDTC.freezeFrameData.timestamp ? 
                        new Date(selectedDTC.freezeFrameData.timestamp).toLocaleString() : 
                        'Unknown'}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.noDataText}>No freeze frame data available</Text>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 10,
  },
  searchResults: {
    flex: 1,
  },
  searchInstructions: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  searchResultItem: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchResultCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  searchResultSystem: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  searchResultSystemText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  searchResultDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  searchResultSeverity: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  searchResultSeverityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  dtcDetailListItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});