// hooks/useLiveOBDData.ts

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updatePIDData, 
  mapPIDToVehicleData, 
  VehicleData, 
  createOdometerReading,
  hasOdometerData,
  hasFraudDetectionData,
  SerializedPIDData
} from '../store/actions/dataActions';
import { validateOdometerReading } from '../store/actions/fraudDetectionActions';
import OBDIIService from '../services/obdii/OBDIIService';
import { ParsedPIDData } from '../services/obdii/OBDIIParser';
import store from '../store';
import { simulationService } from '../services/simulation/SimulationService';

// Helper function to serialize PID data for Redux
function serializePIDData(pidData: ParsedPIDData): SerializedPIDData {
  return {
    ...pidData,
    timestamp: pidData.timestamp instanceof Date ? pidData.timestamp.toISOString() : String(pidData.timestamp)
  };
}

type RootState = ReturnType<typeof store.getState>;

export function useLiveOBDData() {
  const dispatch = useDispatch();
  const [accumulatedData, setAccumulatedData] = useState<Partial<VehicleData>>({});
  const [lastOdometerReading, setLastOdometerReading] = useState<number | null>(null);
  const isConnected = useSelector((state: RootState) => state.connection?.isConnected);
  const connectionType = useSelector((state: RootState) => state.connection?.connectionType);
  const isConnecting = useSelector((state: RootState) => state.connection?.isConnecting);
  const activeVehicleId = useSelector((state: RootState) => state.vehicle?.activeVehicle);
  const vehicles = useSelector((state: RootState) => {
    const vehicleArray = state.vehicle?.vehicles;
    return Array.isArray(vehicleArray) ? vehicleArray : [];
  });
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
      
    }
  }, [vehicleInfo, isConnected]);

  useEffect(() => {
    if (!shouldListen) return;

    

    const unsubscribe = OBDIIService.subscribe((eventType: string, data: any) => {
      
      
      if (eventType === 'dataUpdate' && data) {
        const pidData = data as ParsedPIDData;
        const vehicleData = mapPIDToVehicleData(pidData);
        
        // Accumulate data locally
        setAccumulatedData(prev => ({
          ...prev,
          ...vehicleData
        }));
        
        // Dispatch the PID data update with serialized timestamps
        dispatch(updatePIDData({
          pidData: serializePIDData(pidData),
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
              
              
              const odometerReading = createOdometerReading(vehicleData, 'obd');
              
              // Dispatch fraud validation
              dispatch(validateOdometerReading(odometerReading) as any);
              
              // Update last reading
              setLastOdometerReading(currentOdometer);
              
              
            }
          }
          
          // 2. Process other fraud detection data (even without direct odometer)
          else if (vehicleData.distanceSinceCodesCleared !== undefined || 
                   vehicleData.distanceWithMILOn !== undefined) {
            
            
            
            // Create reading with available distance data
            const supportingReading = {
              ...createOdometerReading(vehicleData, 'obd'),
              // Use distance since codes cleared as backup odometer if available
              odometer: vehicleData.distanceSinceCodesCleared || vehicleData.distanceWithMILOn,
              mileage: vehicleData.distanceSinceCodesCleared || vehicleData.distanceWithMILOn
            };
            
            if (supportingReading.odometer && supportingReading.odometer > 0) {
              dispatch(validateOdometerReading(supportingReading) as any);
              
            }
          }
        }
        
        
      } else if (eventType === 'connectionStatus') {
        
        
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
          
          
        }
      }
    });

    // Start live data if we're connected and the service is initialized
    if (OBDIIService.isThisInitialized()) {
      
      OBDIIService.startLiveData();
      
      // Log polling information
      setTimeout(() => {
        const activePollingPIDs = OBDIIService.getActivePollingPIDs();
        
        
        const activeOdometerPID = OBDIIService.getActiveOdometerPID();
        if (activeOdometerPID && activePollingPIDs.includes(activeOdometerPID)) {
          
        } else if (activeOdometerPID) {
          
        } else {
          
        }
      }, 2000);
    }

    return () => {
      
      unsubscribe?.();
      OBDIIService.stopLiveData();
    };
  }, [shouldListen, dispatch, fraudDetectionEnabled, lastOdometerReading, vehicleInfo, activeVehicleId]);

  useEffect(() => {
    if (connectionType === 'simulation') {
      
      OBDIIService.enableSimulation();
    }

    return () => {
      if (connectionType === 'simulation') {
        
        simulationService.stopSimulation();
      }
    };
  }, [connectionType]);

  // Monitor connection status changes
  useEffect(() => {
    if (isConnected && OBDIIService.isThisInitialized()) {
      
      OBDIIService.startLiveData();
    } else if (!isConnected && !isConnecting) {
      
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
      
    } else {
      
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