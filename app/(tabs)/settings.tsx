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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
  const [settings, setSettings] = useState<SettingsSection[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SettingsItem | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const settingsData: SettingsSection[] = [
      {
        title: 'Vehicle',
        items: [
          {
            id: 'vehicle_profile',
            title: 'Vehicle Profile',
            subtitle: '2020 Toyota Camry',
            type: 'navigation',
            icon: 'car',
            action: () => router.push('/vehicle-profile'),
          },
          {
            id: 'auto_connect',
            title: 'Auto Connect',
            subtitle: 'Automatically connect to last used adapter',
            type: 'toggle',
            value: true,
            icon: 'bluetooth',
          },
          {
            id: 'connection_timeout',
            title: 'Connection Timeout',
            subtitle: '30 seconds',
            type: 'selection',
            value: '30',
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
            value: true,
            icon: 'pulse',
          },
          {
            id: 'logging_frequency',
            title: 'Data Logging Frequency',
            subtitle: 'Every 5 seconds',
            type: 'selection',
            value: '5',
            icon: 'timer',
            options: ['1', '2', '5', '10', '15', '30'],
          },
          {
            id: 'storage_limit',
            title: 'Local Storage Limit',
            subtitle: '500 MB',
            type: 'selection',
            value: '500',
            icon: 'server',
            options: ['100', '250', '500', '1000', '2000'],
          },
          {
            id: 'auto_backup',
            title: 'Auto Backup Data',
            subtitle: 'Backup data to cloud storage',
            type: 'toggle',
            value: false,
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
            value: true,
            icon: 'notifications',
          },
          {
            id: 'dtc_alerts',
            title: 'DTC Code Alerts',
            subtitle: 'Immediate notification for new error codes',
            type: 'toggle',
            value: true,
            icon: 'warning',
          },
          {
            id: 'performance_alerts',
            title: 'Performance Alerts',
            subtitle: 'Notify when parameters exceed thresholds',
            type: 'toggle',
            value: false,
            icon: 'speedometer',
          },
          {
            id: 'maintenance_reminders',
            title: 'Maintenance Reminders',
            subtitle: 'Scheduled maintenance notifications',
            type: 'toggle',
            value: true,
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
            subtitle: 'Light',
            type: 'selection',
            value: 'light',
            icon: 'color-palette',
            options: ['light', 'dark', 'auto'],
          },
          {
            id: 'temperature_unit',
            title: 'Temperature Unit',
            subtitle: 'Celsius (°C)',
            type: 'selection',
            value: 'celsius',
            icon: 'thermometer',
            options: ['celsius', 'fahrenheit'],
          },
          {
            id: 'distance_unit',
            title: 'Distance Unit',
            subtitle: 'Kilometers',
            type: 'selection',
            value: 'km',
            icon: 'speedometer',
            options: ['km', 'miles'],
          },
          {
            id: 'language',
            title: 'Language',
            subtitle: 'English',
            type: 'selection',
            value: 'en',
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
            value: false,
            icon: 'settings-outline',
          },
          {
            id: 'debug_mode',
            title: 'Debug Mode',
            subtitle: 'Show technical diagnostic information',
            type: 'toggle',
            value: false,
            icon: 'bug',
          },
          {
            id: 'export_format',
            title: 'Export Format',
            subtitle: 'CSV',
            type: 'selection',
            value: 'csv',
            icon: 'document-text',
            options: ['csv', 'json', 'pdf'],
          },
          {
            id: 'simulation_mode',
            title: 'Demo/Simulation Mode',
            subtitle: 'Use simulated data for testing',
            type: 'toggle',
            value: false,
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

  const updateSetting = (sectionIndex: number, itemIndex: number, newValue: any) => {
    const updatedSettings = [...settings];
    updatedSettings[sectionIndex].items[itemIndex].value = newValue;
    setSettings(updatedSettings);
    
    // Here you would typically save to persistent storage
    // await AsyncStorage.setItem('settings', JSON.stringify(updatedSettings));
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

  const handleSelectionChange = (value: string) => {
    if (selectedSetting) {
      const sectionIndex = settings.findIndex(section =>
        section.items.some(item => item.id === selectedSetting.id)
      );
      const itemIndex = settings[sectionIndex].items.findIndex(
        item => item.id === selectedSetting.id
      );
      updateSetting(sectionIndex, itemIndex, value);
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
          onPress: () => {
            // Implement cache clearing logic
            Alert.alert('Success', 'Cache cleared successfully!');
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
          onPress: () => {
            // Implement data export logic
            Alert.alert('Success', 'Data exported successfully!');
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
          onPress: () => {
            loadSettings(); // Reload default settings
            Alert.alert('Success', 'Settings reset to defaults!');
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
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
                      color={item.destructive ? "#dc3545" : "#007AFF"} 
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
                        trackColor={{ false: '#e9ecef', true: '#007AFF' }}
                        thumbColor={Platform.OS === 'android' ? '#fff' : ''}
                      />
                    )}
                    {(item.type === 'navigation' || item.type === 'selection' || item.type === 'action') && (
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
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
                <Ionicons name="close" size={24} color="#666" />
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
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
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
    </SafeAreaView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
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
    color: '#333',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#dc3545',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  settingControl: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  inputContainer: {
    padding: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;