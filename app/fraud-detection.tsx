import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import FraudDetectionDashboard from '../components/fraud/FraudDetectionDashboard';

export default function FraudDetectionScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Fraud Detection',
          presentation: 'modal',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <FraudDetectionDashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});