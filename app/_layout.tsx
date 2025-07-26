//root layout
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '../store/index';
import DatabaseService from '../services/database/DatabaseService';

export default function RootLayout() {
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await DatabaseService.initialize();
        console.log('✅ Database initialized successfully');
        
        // Create default vehicle profile if none exists
        const activeVehicle = await DatabaseService.getActiveVehicle();
        if (!activeVehicle) {
          console.log('Creating default vehicle profile...');
          const defaultProfileId = await DatabaseService.createVehicleProfile({
            name: 'Default Vehicle',
            make: 'Unknown',
            model: 'Unknown',
            year: 2020,
            vin: 'DEMO-VIN-12345',
            engine_type: 'Unknown',
            transmission: 'Unknown',
            fuel_type: 'Unknown'
          });
          await DatabaseService.setActiveVehicle(defaultProfileId);
          console.log('✅ Default vehicle profile created and activated');
        }
      } catch (error) {
        console.error('❌ Database initialization failed:', error);
      }
    };

    initializeDatabase();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#1a1a1a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                headerShadowVisible: false,
                animation: 'slide_from_right',
              }}
            >
              {/* Initial connection screen */}
              <Stack.Screen
                name="index"
                options={{
                  title: 'OBDII Diagnostic',
                  headerShown: false
                }}
              />

              {/* Tab navigation group - this contains dashboard, diagnostics, etc. */}
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  gestureEnabled: false
                }}
              />

              {/* Modal/Detail screens - these are outside the tabs */}
              <Stack.Screen
                name="vehicle-profile"
                options={{
                  title: 'Vehicle Profile',
                  presentation: 'modal',
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="alerts"
                options={{
                  title: 'Active Alerts',
                  headerShown: false
                }}
              />

              <Stack.Screen
                name="reports"
                options={{
                  title: 'Diagnostic Reports',
                  headerShown: false,
                }}
              />

            </Stack>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}