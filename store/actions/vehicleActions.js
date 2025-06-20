// store/actions/vehicleActions.js
import OBDIIService from '../../services/obdii/OBDIIService';
import DatabaseService from '../../services/database/DatabaseService';
import SimulationService from '../../services/simulation/SimulationService';

// Action Types
export const VEHICLE_TYPES = {
  // Vehicle Profile
  CREATE_VEHICLE_PROFILE: 'CREATE_VEHICLE_PROFILE',
  UPDATE_VEHICLE_PROFILE: 'UPDATE_VEHICLE_PROFILE',
  DELETE_VEHICLE_PROFILE: 'DELETE_VEHICLE_PROFILE',
  SET_ACTIVE_VEHICLE: 'SET_ACTIVE_VEHICLE',
  LOAD_VEHICLE_PROFILES: 'LOAD_VEHICLE_PROFILES',
  
  // Vehicle Information
  UPDATE_VEHICLE_INFO: 'UPDATE_VEHICLE_INFO',
  SET_VEHICLE_IDENTIFICATION: 'SET_VEHICLE_IDENTIFICATION',
  UPDATE_ENGINE_SPECS: 'UPDATE_ENGINE_SPECS',
  SET_VEHICLE_YEAR: 'SET_VEHICLE_YEAR',
  
  // OBDII Protocol
  SET_OBDII_PROTOCOL: 'SET_OBDII_PROTOCOL',
  UPDATE_SUPPORTED_PIDS: 'UPDATE_SUPPORTED_PIDS',
  SET_PROTOCOL_VERSION: 'SET_PROTOCOL_VERSION',
  UPDATE_PROTOCOL_CAPABILITIES: 'UPDATE_PROTOCOL_CAPABILITIES',
  
  // Vehicle Status
  UPDATE_VEHICLE_STATUS: 'UPDATE_VEHICLE_STATUS',
  SET_READINESS_STATUS: 'SET_READINESS_STATUS',
  UPDATE_EMISSION_STATUS: 'UPDATE_EMISSION_STATUS',
  SET_FUEL_SYSTEM_STATUS: 'SET_FUEL_SYSTEM_STATUS',
  
  // Maintenance
  ADD_MAINTENANCE_RECORD: 'ADD_MAINTENANCE_RECORD',
  UPDATE_MAINTENANCE_RECORD: 'UPDATE_MAINTENANCE_RECORD',
  DELETE_MAINTENANCE_RECORD: 'DELETE_MAINTENANCE_RECORD',
  SET_MAINTENANCE_REMINDERS: 'SET_MAINTENANCE_REMINDERS',
  
  // Vehicle Statistics
  UPDATE_VEHICLE_STATS: 'UPDATE_VEHICLE_STATS',
  RESET_TRIP_DATA: 'RESET_TRIP_DATA',
  UPDATE_LIFETIME_STATS: 'UPDATE_LIFETIME_STATS',
  
  // Errors
  VEHICLE_ERROR: 'VEHICLE_ERROR',
  CLEAR_VEHICLE_ERROR: 'CLEAR_VEHICLE_ERROR',
};

// Vehicle Profile Actions
export const createVehicleProfile = (profileData) => async (dispatch) => {
  try {
    const vehicleProfile = {
      id: Date.now().toString(),
      name: profileData.name || 'New Vehicle',
      make: profileData.make || '',
      model: profileData.model || '',
      year: profileData.year || new Date().getFullYear(),
      engine: profileData.engine || '',
      transmission: profileData.transmission || 'automatic',
      fuelType: profileData.fuelType || 'gasoline',
      vin: profileData.vin || '',
      licensePlate: profileData.licensePlate || '',
      color: profileData.color || '',
      odometer: profileData.odometer || 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: false,
      ...profileData
    };
    
    // Save to database
    await DatabaseService.saveVehicleProfile(vehicleProfile);
    
    dispatch({
      type: VEHICLE_TYPES.CREATE_VEHICLE_PROFILE,
      payload: { profile: vehicleProfile }
    });
    
    return vehicleProfile;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const updateVehicleProfile = (profileId, updates) => async (dispatch) => {
  try {
    const updatedProfile = {
      ...updates,
      updatedAt: Date.now()
    };
    
    await DatabaseService.updateVehicleProfile(profileId, updatedProfile);
    
    dispatch({
      type: VEHICLE_TYPES.UPDATE_VEHICLE_PROFILE,
      payload: { profileId, updates: updatedProfile }
    });
    
    return updatedProfile;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const deleteVehicleProfile = (profileId) => async (dispatch) => {
  try {
    await DatabaseService.deleteVehicleProfile(profileId);
    
    dispatch({
      type: VEHICLE_TYPES.DELETE_VEHICLE_PROFILE,
      payload: { profileId }
    });
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const setActiveVehicle = (profileId) => async (dispatch) => {
  try {
    await DatabaseService.setActiveVehicle(profileId);
    
    dispatch({
      type: VEHICLE_TYPES.SET_ACTIVE_VEHICLE,
      payload: { profileId }
    });
    
    // Load vehicle-specific data
    dispatch(loadVehicleData(profileId));
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const loadVehicleProfiles = () => async (dispatch) => {
  try {
    const profiles = await DatabaseService.getVehicleProfiles();
    
    dispatch({
      type: VEHICLE_TYPES.LOAD_VEHICLE_PROFILES,
      payload: { profiles }
    });
    
    return profiles;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

// Vehicle Information Actions
export const readVehicleIdentification = () => async (dispatch, getState) => {
  const { connection } = getState();
  
  try {
    let vehicleInfo;
    
    if (connection.simulationMode) {
      vehicleInfo = await SimulationService.getVehicleIdentification();
    } else {
      vehicleInfo = await OBDIIService.getVehicleIdentification();
    }
    
    dispatch({
      type: VEHICLE_TYPES.SET_VEHICLE_IDENTIFICATION,
      payload: { vehicleInfo }
    });
    
    return vehicleInfo;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const updateVehicleInfo = (vehicleInfo) => async (dispatch, getState) => {
  const { vehicle } = getState();
  
  try {
    // Update active vehicle profile with new info
    if (vehicle.activeProfile) {
      await dispatch(updateVehicleProfile(vehicle.activeProfile.id, vehicleInfo));
    }
    
    dispatch({
      type: VEHICLE_TYPES.UPDATE_VEHICLE_INFO,
      payload: { vehicleInfo }
    });
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const updateEngineSpecs = (engineSpecs) => ({
  type: VEHICLE_TYPES.UPDATE_ENGINE_SPECS,
  payload: { engineSpecs }
});

export const setVehicleYear = (year) => ({
  type: VEHICLE_TYPES.SET_VEHICLE_YEAR,
  payload: { year }
});

// OBDII Protocol Actions
export const detectOBDIIProtocol = () => async (dispatch, getState) => {
  const { connection } = getState();
  
  try {
    let protocolInfo;
    
    if (connection.simulationMode) {
      protocolInfo = await SimulationService.getProtocolInfo();
    } else {
      protocolInfo = await OBDIIService.detectProtocol();
    }
    
    dispatch({
      type: VEHICLE_TYPES.SET_OBDII_PROTOCOL,
      payload: { protocol: protocolInfo }
    });
    
    // Read supported PIDs after protocol detection
    dispatch(readSupportedPIDs());
    
    return protocolInfo;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const readSupportedPIDs = () => async (dispatch, getState) => {
  const { connection } = getState();
  
  try {
    let supportedPIDs;
    
    if (connection.simulationMode) {
      supportedPIDs = await SimulationService.getSupportedPIDs();
    } else {
      supportedPIDs = await OBDIIService.getSupportedPIDs();
    }
    
    dispatch({
      type: VEHICLE_TYPES.UPDATE_SUPPORTED_PIDS,
      payload: { supportedPIDs }
    });
    
    return supportedPIDs;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const setProtocolVersion = (version) => ({
  type: VEHICLE_TYPES.SET_PROTOCOL_VERSION,
  payload: { version }
});

export const updateProtocolCapabilities = (capabilities) => ({
  type: VEHICLE_TYPES.UPDATE_PROTOCOL_CAPABILITIES,
  payload: { capabilities }
});

// Vehicle Status Actions
export const readVehicleStatus = () => async (dispatch, getState) => {
  const { connection } = getState();
  
  try {
    let statusData;
    
    if (connection.simulationMode) {
      statusData = await SimulationService.getVehicleStatus();
    } else {
      statusData = await OBDIIService.getVehicleStatus();
    }
    
    dispatch({
      type: VEHICLE_TYPES.UPDATE_VEHICLE_STATUS,
      payload: { status: statusData }
    });
    
    return statusData;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const readReadinessStatus = () => async (dispatch, getState) => {
  const { connection } = getState();
  
  try {
    let readinessData;
    
    if (connection.simulationMode) {
      readinessData = await SimulationService.getReadinessStatus();
    } else {
      readinessData = await OBDIIService.getReadinessStatus();
    }
    
    dispatch({
      type: VEHICLE_TYPES.SET_READINESS_STATUS,
      payload: { readiness: readinessData }
    });
    
    return readinessData;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const updateEmissionStatus = (emissionStatus) => ({
  type: VEHICLE_TYPES.UPDATE_EMISSION_STATUS,
  payload: { emissionStatus }
});

export const setFuelSystemStatus = (fuelSystemStatus) => ({
  type: VEHICLE_TYPES.SET_FUEL_SYSTEM_STATUS,
  payload: { fuelSystemStatus }
});

// Maintenance Actions
export const addMaintenanceRecord = (maintenanceData) => async (dispatch, getState) => {
  const { vehicle } = getState();
  
  try {
    const maintenanceRecord = {
      id: Date.now().toString(),
      vehicleId: vehicle.activeProfile?.id,
      type: maintenanceData.type,
      description: maintenanceData.description,
      date: maintenanceData.date || Date.now(),
      odometer: maintenanceData.odometer || 0,
      cost: maintenanceData.cost || 0,
      location: maintenanceData.location || '',
      notes: maintenanceData.notes || '',
      nextDueOdometer: maintenanceData.nextDueOdometer || null,
      nextDueDate: maintenanceData.nextDueDate || null,
      createdAt: Date.now(),
      ...maintenanceData
    };
    
    await DatabaseService.saveMaintenanceRecord(maintenanceRecord);
    
    dispatch({
      type: VEHICLE_TYPES.ADD_MAINTENANCE_RECORD,
      payload: { record: maintenanceRecord }
    });
    
    return maintenanceRecord;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const updateMaintenanceRecord = (recordId, updates) => async (dispatch) => {
  try {
    const updatedRecord = {
      ...updates,
      updatedAt: Date.now()
    };
    
    await DatabaseService.updateMaintenanceRecord(recordId, updatedRecord);
    
    dispatch({
      type: VEHICLE_TYPES.UPDATE_MAINTENANCE_RECORD,
      payload: { recordId, updates: updatedRecord }
    });
    
    return updatedRecord;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const deleteMaintenanceRecord = (recordId) => async (dispatch) => {
  try {
    await DatabaseService.deleteMaintenanceRecord(recordId);
    
    dispatch({
      type: VEHICLE_TYPES.DELETE_MAINTENANCE_RECORD,
      payload: { recordId }
    });
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const setMaintenanceReminders = (reminders) => async (dispatch) => {
  try {
    await DatabaseService.saveMaintenanceReminders(reminders);
    
    dispatch({
      type: VEHICLE_TYPES.SET_MAINTENANCE_REMINDERS,
      payload: { reminders }
    });
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

// Vehicle Statistics Actions
export const updateVehicleStats = (stats) => async (dispatch, getState) => {
  const { vehicle } = getState();
  
  try {
    // Update database
    if (vehicle.activeProfile) {
      await DatabaseService.updateVehicleStats(vehicle.activeProfile.id, stats);
    }
    
    dispatch({
      type: VEHICLE_TYPES.UPDATE_VEHICLE_STATS,
      payload: { stats }
    });
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const resetTripData = () => async (dispatch, getState) => {
  const { vehicle } = getState();
  
  try {
    const resetData = {
      tripDistance: 0,
      tripFuelUsed: 0,
      tripStartTime: Date.now(),
      tripAverageSpeed: 0,
      tripMaxSpeed: 0,
      tripIdleTime: 0,
    };
    
    if (vehicle.activeProfile) {
      await DatabaseService.updateVehicleStats(vehicle.activeProfile.id, resetData);
    }
    
    dispatch({
      type: VEHICLE_TYPES.RESET_TRIP_DATA,
      payload: { resetData }
    });
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const updateLifetimeStats = (stats) => ({
  type: VEHICLE_TYPES.UPDATE_LIFETIME_STATS,
  payload: { stats }
});

// Utility Actions
export const loadVehicleData = (profileId) => async (dispatch) => {
  try {
    // Load vehicle profile data
    const profile = await DatabaseService.getVehicleProfile(profileId);
    const maintenanceRecords = await DatabaseService.getMaintenanceRecords(profileId);
    const vehicleStats = await DatabaseService.getVehicleStats(profileId);
    
    dispatch({
      type: VEHICLE_TYPES.UPDATE_VEHICLE_PROFILE,
      payload: { 
        profileId, 
        updates: {
          ...profile,
          maintenanceRecords,
          stats: vehicleStats
        }
      }
    });
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const performVehicleHealthCheck = () => async (dispatch, getState) => {
  const { connection } = getState();
  
  try {
    let healthData = {
      dtcCodes: [],
      readinessStatus: {},
      vehicleStatus: {},
      supportedTests: [],
      lastChecked: Date.now()
    };
    
    if (connection.simulationMode) {
      healthData = await SimulationService.getVehicleHealthData();
    } else {
      // Read DTC codes
      healthData.dtcCodes = await OBDIIService.readDTCCodes();
      
      // Check readiness status
      healthData.readinessStatus = await OBDIIService.getReadinessStatus();
      
      // Get vehicle status
      healthData.vehicleStatus = await OBDIIService.getVehicleStatus();
      
      // Get supported tests
      healthData.supportedTests = await OBDIIService.getSupportedTests();
    }
    
    // Update vehicle status with health data
    dispatch({
      type: VEHICLE_TYPES.UPDATE_VEHICLE_STATUS,
      payload: { status: healthData }
    });
    
    return healthData;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

export const calculateFuelEconomy = (distance, fuelUsed) => (dispatch) => {
  try {
    const fuelEconomy = distance / fuelUsed; // km/L or mpg
    
    dispatch(updateVehicleStats({
      currentFuelEconomy: fuelEconomy,
      lastCalculated: Date.now()
    }));
    
    return fuelEconomy;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: 'Failed to calculate fuel economy' }
    });
    throw error;
  }
};

export const updateOdometer = (newReading) => async (dispatch, getState) => {
  const { vehicle } = getState();
  
  try {
    if (vehicle.activeProfile) {
      await dispatch(updateVehicleProfile(vehicle.activeProfile.id, {
        odometer: newReading,
        lastOdometerUpdate: Date.now()
      }));
    }
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

// Error Management
export const clearVehicleError = () => ({
  type: VEHICLE_TYPES.CLEAR_VEHICLE_ERROR
});

// Vehicle Comparison
export const compareVehicles = (vehicleIds) => async (dispatch) => {
  try {
    const comparisonData = await DatabaseService.compareVehicles(vehicleIds);
    return comparisonData;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};

// Export Vehicle Data
export const exportVehicleData = (profileId, format = 'json') => async (dispatch) => {
  try {
    const ExportService = require('../../services/export/ExportService').default;
    const exportedData = await ExportService.exportVehicleData(profileId, format);
    
    return exportedData;
  } catch (error) {
    dispatch({
      type: VEHICLE_TYPES.VEHICLE_ERROR,
      payload: { error: error.message }
    });
    throw error;
  }
};