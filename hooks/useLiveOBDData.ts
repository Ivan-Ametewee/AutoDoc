// src/hooks/useLiveOBDData.ts
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateRealTimeData } from '../store/actions/dataActions';
import OBDIIService from '../services/obdii/OBDIIService';
import store from '../store'; // Fix here
import { simulationService } from '@/services/simulation/SimulationService';

type RootState = ReturnType<typeof store.getState>;

export function useLiveOBDData() {
  const dispatch = useDispatch();

  const isConnected = useSelector((state: RootState) => state.connection!.isConnected);
  const connectionType = useSelector((state: RootState) => state.connection!.connectionType);
  const isSimulation = useSelector((state: RootState) => state.data!.isSimulationMode);

  const shouldListen = isConnected && connectionType !== 'demo';

  useEffect(() => {
    if (!shouldListen) return;

    const unsubscribe = OBDIIService.subscribe((data: any) => {
      if (data) {
        dispatch(updateRealTimeData(data));
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [shouldListen, dispatch]);

  useEffect(() => {
    if (connectionType === 'demo') {
      OBDIIService.enableSimulation();
    }

    return () => {
      if (connectionType === 'demo') {
        simulationService.stopSimulation();
      }
    };
  }, [connectionType]);
}
