//root layout
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '../store/index';

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

              <Stack.Screen
                name="fraud-detection"
                options={{
                  title: 'Fraud Detection',
                  presentation: 'modal',
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