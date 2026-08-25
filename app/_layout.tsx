//root layout
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '../store/index';
import DatabaseService from '../services/database/DatabaseService';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function RootLayout() {
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        
        await DatabaseService.initialize();
        
        
        // Create default vehicle profile if none exists
        try {
          const activeVehicle = await DatabaseService.getActiveVehicle();
          if (!activeVehicle) {
            
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
            
          }
        } catch (profileError) {
          
          // Continue anyway - this is not critical for app startup
        }
      } catch (error) {
        
        // Don't throw here - let the app continue without database
      }
    };

    initializeDatabase();
  }, []);

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <ThemedStatusBar />
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
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}