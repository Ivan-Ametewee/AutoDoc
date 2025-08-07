// hooks/useLiveOBDData.ts

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updatePIDData, 
  mapPIDToVehicleData, 
  VehicleData, 
  createOdometerReading,
  hasOdometerData,
  hasFraudDetectionData 
} from '../store/actions/dataActions';
import { validateOdometerReading } from '../store/actions/fraudDetectionActions';
import OBDIIService from '../services/obdii/OBDIIService';
import { ParsedPIDData } from '../services/obdii/OBDIIParser';
import store from '../store';
import { simulationService } from '../services/simulation/SimulationService';

type RootState = ReturnType<typeof store.getState>;

export function useLiveOBDData() {
  const dispatch = useDispatch();
  const [accumulatedData, setAccumulatedData] = useState<Partial<VehicleData>>({});
  const [lastOdometerReading, setLastOdometerReading] = useState<number | null>(null);
  const isConnected = useSelector((state: RootState) => state.connection?.isConnected);
  const connectionType = useSelector((state: RootState) => state.connection?.connectionType);
  const isConnecting = useSelector((state: RootState) => state.connection?.isConnecting);
  const activeVehicleId = useSelector((state: RootState) => state.vehicle?.activeVehicle);
  const vehicles = useSelector((state: RootState) => state.vehicle?.vehicles || []);
  const vehicleInfo = vehicles.find(v => v.id === activeVehicleId);
  
  // Get real-time fraud detection setting from Redux
  const fraudDetectionEnabled = useSelector((state: RootState) => 
    state.vehicle?.fraudDetection?.realTimeMonitoring || false
  );

  const shouldListen = isConnected && (connectionType === 'bluetooth' || connectionType === 'wifi' || connectionType === 'simulation');

  // Set vehicle info in OBD service when it changes
  useEffect(() => {
    if (vehicleInfo && isConnected) {
      OBDIIService.setVehicleInfo({
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        year: vehicleInfo.year ?? undefined,
        vin: vehicleInfo.vin
      });
      console.log('🚗 Vehicle info set in OBD service:', vehicleInfo);
    }
  }, [vehicleInfo, isConnected]);

  useEffect(() => {
    if (!shouldListen) return;

    console.log('Setting up OBD data subscription...');

    const unsubscribe = OBDIIService.subscribe((eventType: string, data: any) => {
      console.log('OBD Service event:', eventType, data);
      
      if (eventType === 'dataUpdate' && data) {
        const pidData = data as ParsedPIDData;
        const vehicleData = mapPIDToVehicleData(pidData);
        
        // Accumulate data locally
        setAccumulatedData(prev => ({
          ...prev,
          ...vehicleData
        }));
        
        // Dispatch the PID data update
        dispatch(updatePIDData({
          pidData,
          vehicleData
        }));
        
        // === ENHANCED FRAUD DETECTION INTEGRATION ===
        
        // Check if we have any fraud detection relevant data
        if (fraudDetectionEnabled && hasFraudDetectionData(vehicleData)) {
          
          // 1. Process odometer readings for fraud detection
          if (hasOdometerData(vehicleData)) {
            const currentOdometer = vehicleData.odometer!;
            
            // Only trigger fraud detection if odometer reading has changed
            if (lastOdometerReading === null || currentOdometer !== lastOdometerReading) {
              console.log(`🔍 New odometer reading detected: ${currentOdometer} km (previous: ${lastOdometerReading || 'none'})`);
              
              const odometerReading = createOdometerReading(vehicleData, 'obd');
              
              // Dispatch fraud validation
              dispatch(validateOdometerReading(odometerReading) as any);
              
              // Update last reading
              setLastOdometerReading(currentOdometer);
              
              console.log(`✅ Fraud detection triggered for odometer reading: ${currentOdometer} km`);
            }
          }
          
          // 2. Process other fraud detection data (even without direct odometer)
          else if (vehicleData.distanceSinceCodesCleared !== undefined || 
                   vehicleData.distanceWithMILOn !== undefined) {
            
            console.log('📊 Processing fraud detection supporting data:', {
              distanceSinceCodesCleared: vehicleData.distanceSinceCodesCleared,
              distanceWithMILOn: vehicleData.distanceWithMILOn,
              engineHours: vehicleData.engineHours
            });
            
            // Create reading with available distance data
            const supportingReading = {
              ...createOdometerReading(vehicleData, 'obd'),
              // Use distance since codes cleared as backup odometer if available
              odometer: vehicleData.distanceSinceCodesCleared || vehicleData.distanceWithMILOn,
              mileage: vehicleData.distanceSinceCodesCleared || vehicleData.distanceWithMILOn
            };
            
            if (supportingReading.odometer && supportingReading.odometer > 0) {
              dispatch(validateOdometerReading(supportingReading) as any);
              console.log('📈 Fraud detection triggered with supporting distance data');
            }
          }
        }
        
        console.log('Processed PID data:', pidData.name, '=', pidData.value, vehicleData);
      } else if (eventType === 'connectionStatus') {
        console.log('Connection status update:', data);
        
        // **FIX**: Dispatch connection status to Redux store for PID test screen
        const { status, type, device, error } = data;
        
        if (status === 'connected') {
          dispatch({
            type: 'CONNECTION_SUCCESS',
            payload: {
              device,
              connectionType: type,
              supportedProtocols: [],
              activeProtocol: null,
              protocolVersion: null
            }
          });
        } else if (status === 'connecting') {
          dispatch({
            type: 'START_CONNECTION'
          });
        } else if (status === 'disconnected') {
          dispatch({
            type: 'DISCONNECT_DEVICE'
          });
        } else if (status === 'error') {
          dispatch({
            type: 'CONNECTION_FAILED',
            payload: { error, device }
          });
        }
        
        // Log odometer PID information when connected
        if (data.status === 'connected') {
          const activeOdometerPID = OBDIIService.getActiveOdometerPID();
          const mode22Supported = OBDIIService.isMode22Supported();
          
          console.log('🔧 OBD Connection Details:', {
            activeOdometerPID,
            mode22Supported,
            vehicleMake: vehicleInfo?.make || 'Unknown'
          });
        }
      }
    });

    // Start live data if we're connected and the service is initialized
    if (OBDIIService.isThisInitialized()) {
      console.log('Starting live data stream...');
      OBDIIService.startLiveData();
      
      // Log polling information
      setTimeout(() => {
        const activePollingPIDs = OBDIIService.getActivePollingPIDs();
        console.log('📡 Active polling PIDs:', activePollingPIDs);
        
        const activeOdometerPID = OBDIIService.getActiveOdometerPID();
        if (activeOdometerPID && activePollingPIDs.includes(activeOdometerPID)) {
          console.log('✅ Odometer PID is being actively polled:', activeOdometerPID);
        } else if (activeOdometerPID) {
          console.log('⚠️ Odometer PID configured but not polling:', activeOdometerPID);
        } else {
          console.log('❌ No odometer PID configured for this vehicle');
        }
      }, 2000);
    }

    return () => {
      console.log('Cleaning up OBD data subscription...');
      unsubscribe?.();
      OBDIIService.stopLiveData();
    };
  }, [shouldListen, dispatch, fraudDetectionEnabled, lastOdometerReading, vehicleInfo, activeVehicleId]);

  useEffect(() => {
    if (connectionType === 'simulation') {
      console.log('Enabling simulation mode...');
      OBDIIService.enableSimulation();
    }

    return () => {
      if (connectionType === 'simulation') {
        console.log('Stopping simulation...');
        simulationService.stopSimulation();
      }
    };
  }, [connectionType]);

  // Monitor connection status changes
  useEffect(() => {
    if (isConnected && OBDIIService.isThisInitialized()) {
      console.log('Connection established, starting live data...');
      OBDIIService.startLiveData();
    } else if (!isConnected && !isConnecting) {
      console.log('Connection lost, stopping live data...');
      OBDIIService.stopLiveData();
      setAccumulatedData({});
      setLastOdometerReading(null);
    }
  }, [isConnected, isConnecting]);

  // Note: Real-time fraud detection is now controlled via Redux store
  // Use the toggle in FraudDetectionDashboard to enable/disable

  // Manual trigger for fraud detection (useful for testing)
  const triggerManualFraudCheck = () => {
    if (hasOdometerData(accumulatedData)) {
      const odometerReading = createOdometerReading(accumulatedData, 'manual');
      dispatch(validateOdometerReading(odometerReading) as any);
      console.log('🔍 Manual fraud check triggered');
    } else {
      console.warn('No odometer data available for manual fraud check');
    }
  };

  return {
    accumulatedData,
    isConnected,
    connectionType,
    isConnecting,
    fraudDetectionEnabled,
    lastOdometerReading,
    activeOdometerPID: OBDIIService.getActiveOdometerPID(),
    mode22Supported: OBDIIService.isMode22Supported(),
    activePollingPIDs: OBDIIService.getActivePollingPIDs(),
    triggerManualFraudCheck,
    hasOdometerData: hasOdometerData(accumulatedData),
    hasFraudDetectionData: hasFraudDetectionData(accumulatedData)
  };
}