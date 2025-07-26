import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';

// Import reducers
import connectionReducer from './reducers/connectionReducer';
import type { ConnectionState } from './reducers/connectionReducer.d';
import dataReducer from './reducers/dataReducer';
import type { DataState } from './reducers/dataReducer.d';
import settingsReducer from './reducers/settingsReducer';
import vehicleReducer from './reducers/vehicleReducer';
import type { VehicleState } from './reducers/vehicleReducer.d';

// Settings persist config
const settingsPersistConfig = {
  key: 'settings',
  storage: AsyncStorage,
};

// Vehicle persist config - exclude alerts from persistence
const vehiclePersistConfig = {
  key: 'vehicle',
  storage: AsyncStorage,
  transforms: [
    // Transform to exclude alerts from being persisted
    {
      in: (inboundState: any) => {
        if (!inboundState) return inboundState;
        return {
          ...inboundState,
          fraudDetection: inboundState.fraudDetection ? {
            ...inboundState.fraudDetection,
            // Reset alerts on app startup but preserve other fraud detection data
            alerts: [],
            // Clear anomalies on app startup to prevent accumulation
            checks: inboundState.fraudDetection.checks ? 
              Object.keys(inboundState.fraudDetection.checks).reduce((acc, key) => {
                acc[key] = {
                  ...inboundState.fraudDetection.checks[key],
                  anomalies: []
                };
                return acc;
              }, {} as any) : inboundState.fraudDetection.checks
          } : inboundState.fraudDetection
        };
      },
      out: (outboundState: any) => outboundState,
      config: {}
    }
  ]
};

// Combine all reducers with explicit types
const rootReducer = combineReducers({
  connection: connectionReducer as unknown as (state: ConnectionState | undefined, action: any) => ConnectionState,
  data: dataReducer as unknown as (state: DataState | undefined, action: any) => DataState,
  settings: persistReducer(settingsPersistConfig, settingsReducer),
  vehicle: persistReducer(vehiclePersistConfig, vehicleReducer as unknown as (state: VehicleState | undefined, action: any) => VehicleState),
});

// Main persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Only persist certain reducers
  whitelist: ['settings', 'vehicle'],
  // Don't persist connection state and real-time data
  blacklist: ['connection', 'data']
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with Redux Toolkit (no need for manual thunk setup)
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
      // Disable immutable state check in development to improve performance
      // with large fraud detection state objects
      immutableCheck: false,
    }),
  devTools: __DEV__, // Enable Redux DevTools in development
});

// Create persistor
const persistor = persistStore(store);

// Export types for TypeScript
export type RootState = ReturnType<typeof rootReducer>;

export { persistor, store };
export default store;