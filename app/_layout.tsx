import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store/index';
// Note: Add these imports when the files are created:
// import { ThemeProvider } from '../src/contexts/ThemeContext';
// import { LoadingScreen } from '../src/components/common/LoadingScreen';

export default function RootLayout() {
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
                
                {/* Tab navigation group */}
                <Stack.Screen 
                  name="(tabs)" 
                  options={{ 
                    headerShown: false,
                    gestureEnabled: false 
                  }} 
                />
                
                {/* Modal/Detail screens */}
                <Stack.Screen 
                  name="vehicle-profile" 
                  options={{ 
                    title: 'Vehicle Profile',
                    presentation: 'modal',
                    headerStyle: {
                      backgroundColor: '#2a2a2a',
                    },
                  }} 
                />
                
                <Stack.Screen 
                  name="alerts" 
                  options={{ 
                    title: 'Active Alerts',
                    headerStyle: {
                      backgroundColor: '#dc2626',
                    },
                  }} 
                />
                
                <Stack.Screen 
                  name="reports" 
                  options={{ 
                    title: 'Diagnostic Reports',
                    headerStyle: {
                      backgroundColor: '#1e40af',
                    },
                  }} 
                />
                
                {/* Standalone screens */}
                <Stack.Screen 
                  name="dashboard" 
                  options={{ 
                    title: 'Dashboard',
                    headerShown: false 
                  }} 
                />
                
                <Stack.Screen 
                  name="diagnostics" 
                  options={{ 
                    title: 'Diagnostics',
                    headerShown: false 
                  }} 
                />
                
                <Stack.Screen 
                  name="history" 
                  options={{ 
                    title: 'History',
                    headerShown: false 
                  }} 
                />
                
                <Stack.Screen 
                  name="settings" 
                  options={{ 
                    title: 'Settings',
                    headerShown: false 
                  }} 
                />
              </Stack>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}