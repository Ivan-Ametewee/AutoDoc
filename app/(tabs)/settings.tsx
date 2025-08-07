import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  Platform,
  StatusBar,
  Share,
} from 'react-native';
// SafeAreaView removed - using View instead
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SettingsService, { AppSettings, SettingKey } from '../../services/settings/SettingsService';
import ExportService from '../../services/export/ExportService';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigation' | 'selection' | 'input' | 'action';
  value?: boolean | string | number;
  icon: string;
  options?: string[];
  action?: () => void;
  destructive?: boolean;
}

const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [settings, setSettings] = useState<SettingsSection[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(SettingsService.getAllSettings());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SettingsItem | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppSettings();
    setupSettingsListeners();
    
    return () => {
      // Cleanup listeners
      SettingsService.removeAllListeners('settingChanged');
      SettingsService.removeAllListeners('settingsLoaded');
    };
  }, []);
  
  useEffect(() => {
    buildSettingsData();
  }, [appSettings]);
  
  const loadAppSettings = async () => {
    try {
      const loadedSettings = await SettingsService.loadSettings();
      setAppSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };
  
  const setupSettingsListeners = () => {
    SettingsService.on('settingChanged', ({ key, value }) => {
      console.log(`Setting ${key} changed to:`, value);
      setAppSettings(SettingsService.getAllSettings());
    });
    
    SettingsService.on('settingsLoaded', (loadedSettings) => {
      setAppSettings(loadedSettings);
    });
  };

  const buildSettingsData = () => {
    const settingsData: SettingsSection[] = [
      {
        title: 'Vehicle',
        items: [
          {
            id: 'vehicle_profile',
            title: 'Vehicle Profile',
            subtitle: getVehicleProfileText(),
            type: 'navigation',
            icon: 'car',
            action: () => router.navigate('/vehicle-profile' as any),
          },
          {
            id: 'auto_connect',
            title: 'Auto Connect',
            subtitle: 'Automatically connect to last used adapter',
            type: 'toggle',
            value: appSettings.auto_connect,
            icon: 'bluetooth',
          },
          {
            id: 'connection_timeout',
            title: 'Connection Timeout',
            subtitle: `${appSettings.connection_timeout} seconds`,
            type: 'selection',
            value: appSettings.connection_timeout.toString(),
            icon: 'time',
            options: ['10', '20', '30', '60', '120'],
          },
        ],
      },
      {
        title: 'Data & Monitoring',
        items: [
          {
            id: 'data_collection',
            title: 'Real-time Data Collection',
            subtitle: 'Continuously monitor vehicle parameters',
            type: 'toggle',
            value: appSettings.data_collection,
            icon: 'pulse',
          },
          {
            id: 'logging_frequency',
            title: 'Data Logging Frequency',
            subtitle: `Every ${appSettings.logging_frequency} seconds`,
            type: 'selection',
            value: appSettings.logging_frequency.toString(),
            icon: 'timer',
            options: ['1', '2', '5', '10', '15', '30'],
          },
          {
            id: 'storage_limit',
            title: 'Local Storage Limit',
            subtitle: `${appSettings.storage_limit} MB`,
            type: 'selection',
            value: appSettings.storage_limit.toString(),
            icon: 'server',
            options: ['100', '250', '500', '1000', '2000'],
          },
          {
            id: 'auto_backup',
            title: 'Auto Backup Data',
            subtitle: 'Backup data to cloud storage',
            type: 'toggle',
            value: appSettings.auto_backup,
            icon: 'cloud-upload',
          },
        ],
      },
      {
        title: 'Alerts & Notifications',
        items: [
          {
            id: 'push_notifications',
            title: 'Push Notifications',
            subtitle: 'Receive alerts on your device',
            type: 'toggle',
            value: appSettings.push_notifications,
            icon: 'notifications',
          },
          {
            id: 'dtc_alerts',
            title: 'DTC Code Alerts',
            subtitle: 'Immediate notification for new error codes',
            type: 'toggle',
            value: appSettings.dtc_alerts,
            icon: 'warning',
          },
          {
            id: 'performance_alerts',
            title: 'Performance Alerts',
            subtitle: 'Notify when parameters exceed thresholds',
            type: 'toggle',
            value: appSettings.performance_alerts,
            icon: 'speedometer',
          },
          {
            id: 'maintenance_reminders',
            title: 'Maintenance Reminders',
            subtitle: 'Scheduled maintenance notifications',
            type: 'toggle',
            value: appSettings.maintenance_reminders,
            icon: 'construct',
          },
        ],
      },
      {
        title: 'Display & Interface',
        items: [
          {
            id: 'theme',
            title: 'Theme',
            subtitle: appSettings.theme.charAt(0).toUpperCase() + appSettings.theme.slice(1),
            type: 'selection',
            value: appSettings.theme,
            icon: 'color-palette',
            options: ['light', 'dark', 'auto'],
          },
          {
            id: 'temperature_unit',
            title: 'Temperature Unit',
            subtitle: appSettings.temperature_unit === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)',
            type: 'selection',
            value: appSettings.temperature_unit,
            icon: 'thermometer',
            options: ['celsius', 'fahrenheit'],
          },
          {
            id: 'distance_unit',
            title: 'Distance Unit',
            subtitle: appSettings.distance_unit === 'km' ? 'Kilometers' : 'Miles',
            type: 'selection',
            value: appSettings.distance_unit,
            icon: 'speedometer',
            options: ['km', 'miles'],
          },
          {
            id: 'language',
            title: 'Language',
            subtitle: getLanguageName(appSettings.language),
            type: 'selection',
            value: appSettings.language,
            icon: 'language',
            options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja'],
          },
        ],
      },
      {
        title: 'Advanced',
        items: [
          {
            id: 'diagnostic_mode',
            title: 'Advanced Diagnostic Mode',
            subtitle: 'Enable professional diagnostic features',
            type: 'toggle',
            value: appSettings.diagnostic_mode,
            icon: 'settings-outline',
          },
          {
            id: 'debug_mode',
            title: 'Debug Mode',
            subtitle: 'Show technical diagnostic information',
            type: 'toggle',
            value: appSettings.debug_mode,
            icon: 'bug',
          },
          {
            id: 'export_format',
            title: 'Export Format',
            subtitle: appSettings.export_format.toUpperCase(),
            type: 'selection',
            value: appSettings.export_format,
            icon: 'document-text',
            options: ['csv', 'json', 'pdf'],
          },
          {
            id: 'simulation_mode',
            title: 'Demo/Simulation Mode',
            subtitle: 'Use simulated data for testing',
            type: 'toggle',
            value: appSettings.simulation_mode,
            icon: 'flask',
          },
        ],
      },
      {
        title: 'Support & Information',
        items: [
          {
            id: 'help',
            title: 'Help & FAQ',
            type: 'navigation',
            icon: 'help-circle',
            action: () => Alert.alert('Help', 'Help documentation coming soon!'),
          },
          {
            id: 'contact',
            title: 'Contact Support',
            type: 'navigation',
            icon: 'mail',
            action: () => Alert.alert('Contact', 'Support contact form coming soon!'),
          },
          {
            id: 'privacy',
            title: 'Privacy Policy',
            type: 'navigation',
            icon: 'shield-checkmark',
            action: () => Alert.alert('Privacy', 'Privacy policy coming soon!'),
          },
          {
            id: 'version',
            title: 'App Version',
            subtitle: '1.0.0 (Build 1)',
            type: 'navigation',
            icon: 'information-circle',
          },
        ],
      },
      {
        title: 'Data Management',
        items: [
          {
            id: 'clear_cache',
            title: 'Clear Cache',
            subtitle: 'Free up storage space',
            type: 'action',
            icon: 'trash',
            action: () => confirmClearCache(),
          },
          {
            id: 'export_data',
            title: 'Export All Data',
            subtitle: 'Export diagnostic history and settings',
            type: 'action',
            icon: 'download',
            action: () => exportData(),
          },
          {
            id: 'reset_settings',
            title: 'Reset to Defaults',
            subtitle: 'Restore all settings to default values',
            type: 'action',
            icon: 'refresh',
            destructive: true,
            action: () => confirmResetSettings(),
          },
        ],
      },
    ];

    setSettings(settingsData);
  };
  
  const getVehicleProfileText = (): string => {
    const profile = appSettings.vehicle_profile;
    if (profile.make && profile.model && profile.year) {
      return `${profile.year} ${profile.make} ${profile.model}`;
    } else if (profile.make && profile.model) {
      return `${profile.make} ${profile.model}`;
    } else if (profile.make) {
      return profile.make;
    }
    return 'Not configured';
  };
  
  const getLanguageName = (code: string): string => {
    const languages: { [key: string]: string } = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German',
      it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese'
    };
    return languages[code] || code;
  };

  const updateSetting = async (sectionIndex: number, itemIndex: number, newValue: any) => {
    const settingId = settings[sectionIndex].items[itemIndex].id as SettingKey;
    
    try {
      setLoading(true);
      
      // Convert string values to appropriate types
      let convertedValue: any = newValue;
      if (settingId === 'connection_timeout' || settingId === 'logging_frequency' || settingId === 'storage_limit') {
        convertedValue = parseInt(newValue, 10);
      }
      
      const success = await SettingsService.updateSetting(settingId, convertedValue);
      
      if (success) {
        console.log(`Setting ${settingId} updated to:`, convertedValue);
        // Settings will be updated via the listener
      } else {
        Alert.alert('Error', 'Failed to update setting. Please try again.');
      }
    } catch (error: any) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', `Failed to update ${settingId}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingPress = (setting: SettingsItem, sectionIndex: number, itemIndex: number) => {
    if (setting.action) {
      setting.action();
      return;
    }

    if (setting.type === 'selection') {
      setSelectedSetting(setting);
      setModalVisible(true);
    } else if (setting.type === 'input') {
      setSelectedSetting(setting);
      setInputValue(setting.value as string || '');
      setModalVisible(true);
    }
  };

  const handleSelectionChange = async (value: string) => {
    if (selectedSetting) {
      const sectionIndex = settings.findIndex(section =>
        section.items.some(item => item.id === selectedSetting.id)
      );
      const itemIndex = settings[sectionIndex].items.findIndex(
        item => item.id === selectedSetting.id
      );
      await updateSetting(sectionIndex, itemIndex, value);
    }
    setModalVisible(false);
    setSelectedSetting(null);
  };

  const confirmClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached data and temporary files. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const success = await SettingsService.clearCache();
              if (success) {
                Alert.alert('Success', 'Cache cleared successfully!');
              } else {
                Alert.alert('Error', 'Failed to clear cache.');
              }
            } catch (error: any) {
              Alert.alert('Error', `Failed to clear cache: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const exportData = () => {
    Alert.alert(
      'Export Data',
      'This will export all your diagnostic data and settings. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Show options for export type
              Alert.alert(
                'Export Data',
                'What would you like to export?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Settings Only',
                    onPress: async () => {
                      try {
                        const settingsData = await ExportService.exportSettings();
                        const filename = ExportService.generateFilename('settings', 'json');
                        await ExportService.shareExportedData(settingsData, filename);
                        Alert.alert('Success', 'Settings exported successfully!');
                      } catch (error: any) {
                        Alert.alert('Error', `Failed to export settings: ${error.message}`);
                      }
                    },
                  },
                  {
                    text: 'Complete Data',
                    onPress: async () => {
                      try {
                        const completeData = await ExportService.exportCompleteData();
                        const filename = ExportService.generateFilename('complete', 'json');
                        await ExportService.shareExportedData(completeData, filename);
                        Alert.alert('Success', 'Complete data exported successfully!');
                      } catch (error: any) {
                        Alert.alert('Error', `Failed to export complete data: ${error.message}`);
                      }
                    },
                  },
                ],
              );
            } catch (error: any) {
              Alert.alert('Error', `Export failed: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const confirmResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will restore all settings to their default values. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const success = await SettingsService.resetToDefaults();
              if (success) {
                Alert.alert('Success', 'Settings reset to defaults!');
              } else {
                Alert.alert('Error', 'Failed to reset settings.');
              }
            } catch (error: any) {
              Alert.alert('Error', `Failed to reset settings: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getSelectionSubtitle = (setting: SettingsItem) => {
    const value = setting.value as string;
    switch (setting.id) {
      case 'connection_timeout':
        return `${value} seconds`;
      case 'logging_frequency':
        return `Every ${value} seconds`;
      case 'storage_limit':
        return `${value} MB`;
      case 'theme':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'temperature_unit':
        return value === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)';
      case 'distance_unit':
        return value === 'km' ? 'Kilometers' : 'Miles';
      case 'language':
        const languages: { [key: string]: string } = {
          en: 'English', es: 'Spanish', fr: 'French', de: 'German',
          it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese'
        };
        return languages[value] || value;
      case 'export_format':
        return value.toUpperCase();
      default:
        return setting.subtitle;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.headerBackground} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settings.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem
                  ]}
                  onPress={() => handleSettingPress(item, sectionIndex, itemIndex)}
                  disabled={item.type === 'toggle'}
                >
                  <View style={styles.settingIcon}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={item.destructive ? theme.colors.error : theme.colors.primary} 
                    />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={[
                      styles.settingTitle,
                      item.destructive && styles.destructiveText
                    ]}>
                      {item.title}
                    </Text>
                    {(item.subtitle || (item.type === 'selection' && item.value)) && (
                      <Text style={styles.settingSubtitle}>
                        {item.type === 'selection' ? getSelectionSubtitle(item) : item.subtitle}
                      </Text>
                    )}
                  </View>
                  <View style={styles.settingControl}>
                    {item.type === 'toggle' && (
                      <Switch
                        value={item.value as boolean}
                        onValueChange={(value) => updateSetting(sectionIndex, itemIndex, value)}
                        trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
                        thumbColor={Platform.OS === 'android' ? theme.colors.surface : ''}
                        disabled={loading}
                      />
                    )}
                    {(item.type === 'navigation' || item.type === 'selection' || item.type === 'action') && (
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedSetting?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {selectedSetting?.type === 'selection' && (
              <ScrollView style={styles.optionsList}>
                {selectedSetting.options?.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionItem,
                      selectedSetting.value === option && styles.selectedOption
                    ]}
                    onPress={() => handleSelectionChange(option)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedSetting.value === option && styles.selectedOptionText
                    ]}>
                      {getOptionDisplayText(selectedSetting.id, option)}
                    </Text>
                    {selectedSetting.value === option && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedSetting?.type === 'input' && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={`Enter ${selectedSetting.title.toLowerCase()}`}
                  autoFocus={true}
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => handleSelectionChange(inputValue)}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  function getOptionDisplayText(settingId: string, option: string): string {
    switch (settingId) {
      case 'connection_timeout':
        return `${option} seconds`;
      case 'logging_frequency':
        return `Every ${option} seconds`;
      case 'storage_limit':
        return `${option} MB`;
      case 'theme':
        return option.charAt(0).toUpperCase() + option.slice(1);
      case 'temperature_unit':
        return option === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)';
      case 'distance_unit':
        return option === 'km' ? 'Kilometers' : 'Miles';
      case 'language':
        const languages: { [key: string]: string } = {
          en: 'English', es: 'Spanish', fr: 'French', de: 'German',
          it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese'
        };
        return languages[option] || option;
      case 'export_format':
        return option.toUpperCase();
      default:
        return option;
    }
  }
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.headerText,
    marginLeft: 16,
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.dark ? 0.3 : 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.gaugeBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  destructiveText: {
    color: theme.colors.error,
  },
  settingSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  settingControl: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.modalBackground,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 8,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  selectedOption: {
    backgroundColor: theme.colors.gaugeBackground,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  inputContainer: {
    padding: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.inputText,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;