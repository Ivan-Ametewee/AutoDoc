// src/hooks/useLiveOBDData.ts
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePIDData, mapPIDToVehicleData, VehicleData } from '../store/actions/dataActions';
import { validateOdometerReading } from '../store/actions/fraudDetectionActions';
import OBDIIService from '../services/obdii/OBDIIService';
import { ParsedPIDData } from '../services/obdii/OBDIIParser';
import store from '../store';
import { simulationService } from '../services/simulation/SimulationService';

type RootState = ReturnType<typeof store.getState>;

export function useLiveOBDData() {
  const dispatch = useDispatch();
  const [accumulatedData, setAccumulatedData] = useState<Partial<VehicleData>>({});

  const isConnected = useSelector((state: RootState) => state.connection?.isConnected);
  const connectionType = useSelector((state: RootState) => state.connection?.connectionType);
  const isConnecting = useSelector((state: RootState) => state.connection?.isConnecting);

  const shouldListen = isConnected && (connectionType === 'bluetooth' || connectionType === 'wifi' || connectionType === 'simulation');

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
        
        // Trigger fraud detection if odometer data is received
        if (vehicleData.odometer !== undefined || vehicleData.tripOdometer !== undefined) {
          const odometerReading = {
            odometer: vehicleData.odometer,
            mileage: vehicleData.odometer, // Use odometer as mileage for compatibility
            timestamp: new Date().toISOString(),
            source: 'obd' as const,
            vehicleSpeed: vehicleData.speed,
            engineHours: vehicleData.engineHours,
            fuelLevel: vehicleData.fuelLevel,
            engineRPM: vehicleData.rpm,
          };
          
          // Only dispatch if we have valid odometer data
          if (odometerReading.odometer && odometerReading.odometer > 0) {
            dispatch(validateOdometerReading(odometerReading) as any);
          }
        }
        
        console.log('Processed PID data:', pidData.name, '=', pidData.value, vehicleData);
      } else if (eventType === 'connectionStatus') {
        console.log('Connection status update:', data);
      }
    });

    // Start live data if we're connected and the service is initialized
    if (OBDIIService.isThisInitialized()) {
      console.log('Starting live data stream...');
      OBDIIService.startLiveData();
    }

    return () => {
      console.log('Cleaning up OBD data subscription...');
      unsubscribe?.();
      OBDIIService.stopLiveData();
    };
  }, [shouldListen, dispatch]);

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
    }
  }, [isConnected, isConnecting]);

  return {
    accumulatedData,
    isConnected,
    connectionType,
    isConnecting
  };
}
