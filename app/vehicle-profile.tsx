import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface VehicleProfile {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  engineSize: string;
  fuelType: string;
  transmission: string;
  color: string;
  licensePlate: string;
  purchaseDate?: string;
  lastServiceDate?: string;
  nextServiceDue?: number;
  insurance?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  notes?: string;
  photo?: string;
}

interface EditField {
  key: keyof VehicleProfile;
  title: string;
  type: 'text' | 'number' | 'date' | 'selection';
  options?: string[];
  placeholder?: string;
}

const VehicleProfileScreen: React.FC = () => {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<VehicleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedField, setSelectedField] = useState<EditField | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    loadVehicleProfile();
  }, []);

  const loadVehicleProfile = async () => {
    // Mock API call - replace with actual data fetching
    setTimeout(() => {
      setVehicle({
        id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1HGBH41JXMN109186',
        mileage: 45000,
        engineSize: '2.5L I4',
        fuelType: 'Gasoline',
        transmission: 'Automatic',
        color: 'Silver',
        licensePlate: 'ABC-1234',
        purchaseDate: '2020-03-15',
        lastServiceDate: '2024-05-15',
        nextServiceDue: 50000,
        insurance: {
          provider: 'State Farm',
          policyNumber: 'SF-123456789',
          expiryDate: '2024-12-31',
        },
        notes: 'Regular maintenance performed. No major issues.',
      });
      setLoading(false);
    }, 1000);
  };

  const editableFields: EditField[] = [
    { key: 'make', title: 'Make', type: 'selection', options: ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Nissan', 'Hyundai', 'Kia', 'Other'] },
    { key: 'model', title: 'Model', type: 'text', placeholder: 'Enter vehicle model' },
    { key: 'year', title: 'Year', type: 'number', placeholder: 'Enter year' },
    { key: 'vin', title: 'VIN', type: 'text', placeholder: 'Enter VIN number' },
    { key: 'mileage', title: 'Current Mileage', type: 'number', placeholder: 'Enter current mileage' },
    { key: 'engineSize', title: 'Engine Size', type: 'text', placeholder: 'e.g., 2.0L I4' },
    { key: 'fuelType', title: 'Fuel Type', type: 'selection', options: ['Gasoline', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid'] },
    { key: 'transmission', title: 'Transmission', type: 'selection', options: ['Manual', 'Automatic', 'CVT', 'Semi-Automatic'] },
    { key: 'color', title: 'Color', type: 'text', placeholder: 'Enter vehicle color' },
    { key: 'licensePlate', title: 'License Plate', type: 'text', placeholder: 'Enter license plate' },
    { key: 'purchaseDate', title: 'Purchase Date', type: 'date' },
    { key: 'lastServiceDate', title: 'Last Service Date', type: 'date' },
    { key: 'nextServiceDue', title: 'Next Service Due (miles)', type: 'number', placeholder: 'Enter mileage' },
    { key: 'notes', title: 'Notes', type: 'text', placeholder: 'Additional notes about your vehicle' },
  ];

  const handleFieldEdit = (field: EditField) => {
    if (!vehicle) return;
    
    setSelectedField(field);
    const currentValue = vehicle[field.key];
    setInputValue(currentValue?.toString() || '');
    setModalVisible(true);
  };

  const saveFieldValue = () => {
    if (!vehicle || !selectedField) return;

    let newValue: any = inputValue;
    
    if (selectedField.type === 'number') {
      newValue = parseInt(inputValue) || 0;
    }

    setVehicle({
      ...vehicle,
      [selectedField.key]: newValue,
    });

    setModalVisible(false);
    setSelectedField(null);
    setInputValue('');
  };

  const saveProfile = async () => {
    if (!vehicle) return;

    try {
      // Mock API call - replace with actual save logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success',
        'Vehicle profile updated successfully!',
        [{ text: 'OK' }]
      );
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save vehicle profile');
    }
  };

  const scanVIN = () => {
    Alert.alert(
      'VIN Scanner',
      'VIN scanning feature coming soon! You can manually enter your VIN for now.',
      [{ text: 'OK' }]
    );
  };

  const deleteProfile = () => {
    Alert.alert(
      'Delete Vehicle Profile',
      'Are you sure you want to delete this vehicle profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Implement delete logic
            router.back();
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getMaintenanceStatus = () => {
    if (!vehicle) return { text: 'Unknown', color: '#666' };
    
    const mileageUntilService = (vehicle.nextServiceDue || 0) - vehicle.mileage;
    
    if (mileageUntilService <= 0) {
      return { text: 'Service Overdue', color: '#dc3545' };
    } else if (mileageUntilService <= 1000) {
      return { text: 'Service Due Soon', color: '#ffc107' };
    } else {
      return { text: `${mileageUntilService.toLocaleString()} miles until service`, color: '#28a745' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading vehicle profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="car" size={64} color="#ccc" />
          <Text style={styles.errorText}>No vehicle profile found</Text>
          <TouchableOpacity style={styles.createButton}>
            <Text style={styles.createButtonText}>Create New Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const maintenanceStatus = getMaintenanceStatus();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Profile</Text>
        <TouchableOpacity
          onPress={() => setEditing(!editing)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Photo */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {vehicle.photo ? (
              <Image source={{ uri: vehicle.photo }} style={styles.vehiclePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="car" size={48} color="#ccc" />
                <Text style={styles.photoPlaceholderText}>No Photo</Text>
              </View>
            )}
            {editing && (
              <TouchableOpacity style={styles.photoEditButton}>
                <Ionicons name="camera" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Vehicle Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Overview</Text>
          <View style={styles.overviewCard}>
            <Text style={styles.vehicleName}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.vehicleDetails}>
              {vehicle.engineSize} • {vehicle.fuelType} • {vehicle.transmission}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{vehicle.mileage.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Miles</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{vehicle.color}</Text>
                <Text style={styles.statLabel}>Color</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{vehicle.licensePlate}</Text>
                <Text style={styles.statLabel}>License</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Maintenance Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance Status</Text>
          <View style={styles.maintenanceCard}>
            <View style={styles.maintenanceHeader}>
              <Ionicons 
                name="construct" 
                size={24} 
                color={maintenanceStatus.color} 
              />
              <Text style={[styles.maintenanceStatus, { color: maintenanceStatus.color }]}>
                {maintenanceStatus.text}
              </Text>
            </View>
            <Text style={styles.maintenanceDetail}>
              Last Service: {formatDate(vehicle.lastServiceDate)}
            </Text>
          </View>
        </View>

        {/* Vehicle Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.detailsCard}>
            {editableFields.map((field) => {
              const value = vehicle[field.key];
              const displayValue = field.type === 'date' && value ? 
                formatDate(value as string) : 
                value?.toString() || 'Not set';

              return (
                <TouchableOpacity
                  key={field.key}
                  style={styles.detailRow}
                  onPress={() => editing && handleFieldEdit(field)}
                  disabled={!editing}
                >
                  <Text style={styles.detailLabel}>{field.title}</Text>
                  <View style={styles.detailValueContainer}>
                    <Text style={[
                      styles.detailValue,
                      !value && styles.detailValueEmpty
                    ]}>
                      {displayValue}
                    </Text>
                    {editing && (
                      <Ionicons name="chevron-forward" size={16} color="#ccc" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Insurance Information */}
        {vehicle.insurance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insurance Information</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Provider</Text>
                <Text style={styles.detailValue}>{vehicle.insurance.provider}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Policy Number</Text>
                <Text style={styles.detailValue}>{vehicle.insurance.policyNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expiry Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(vehicle.insurance.expiryDate)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={scanVIN}>
            <Ionicons name="qr-code" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Scan VIN</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Export Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]} 
            onPress={deleteProfile}
          >
            <Ionicons name="trash" size={20} color="#dc3545" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>
              Delete Profile
            </Text>
          </TouchableOpacity>
        </View>

        {editing && (
          <View style={styles.saveSection}>
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
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
                Edit {selectedField?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedField?.type === 'selection' ? (
              <ScrollView style={styles.optionsList}>
                {selectedField.options?.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionItem,
                      inputValue === option && styles.selectedOption
                    ]}
                    onPress={() => {
                      setInputValue(option);
                      saveFieldValue();
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      inputValue === option && styles.selectedOptionText
                    ]}>
                      {option}
                    </Text>
                    {inputValue === option && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={selectedField?.placeholder}
                  keyboardType={selectedField?.type === 'number' ? 'numeric' : 'default'}
                  autoFocus={true}
                  multiline={selectedField?.key === 'notes'}
                  numberOfLines={selectedField?.key === 'notes' ? 4 : 1}
                />
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={saveFieldValue}
                >
                  <Text style={styles.modalSaveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
  },
  vehiclePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  overviewCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
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
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  maintenanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
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
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  maintenanceStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  maintenanceDetail: {
    fontSize: 14,
    color: '#666',
  },
  detailsCard: {
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    marginRight: 8,
  },
  detailValueEmpty: {
    color: '#999',
    fontStyle: 'italic',
  },
  actionsSection: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
    fontWeight: '500',
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  dangerText: {
    color: '#dc3545',
  },
  saveSection: {
    margin: 16,
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    textAlignVertical: 'top',
  },
  modalSaveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VehicleProfileScreen;