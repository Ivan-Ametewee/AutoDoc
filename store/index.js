// store/index.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers
import connectionReducer from './reducers/connectionReducer';
import dataReducer from './reducers/dataReducer';
import settingsReducer from './reducers/settingsReducer';
import vehicleReducer from './reducers/vehicleReducer';

// Settings persist config
const settingsPersistConfig = {
  key: 'settings',
  storage: AsyncStorage,
};

// Vehicle persist config
const vehiclePersistConfig = {
  key: 'vehicle',
  storage: AsyncStorage,
};

// Combine all reducers
const rootReducer = combineReducers({
  connection: connectionReducer,
  data: dataReducer,
  settings: persistReducer(settingsPersistConfig, settingsReducer),
  vehicle: persistReducer(vehiclePersistConfig, vehicleReducer),
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
    }),
  devTools: __DEV__, // Enable Redux DevTools in development
});

// Create persistor
const persistor = persistStore(store);

export { store, persistor };
export default store;