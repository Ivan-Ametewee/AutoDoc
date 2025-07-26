//tabs/_layout.tsx
import { Tabs } from 'expo-router';
import {
  AlertTriangle,
  Gauge,
  History,
  Search,
  Settings,
  IceCream,
  Terminal,
} from 'lucide-react-native';
import React from 'react';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';

  const tabBarStyle = {
    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    borderTopColor: isDark ? '#2a2a2a' : '#e5e5e5',
    borderTopWidth: 1,
    height: 85,
    paddingBottom: 8,
    paddingTop: 8,
  };

  const activeColor = '#3b82f6';
  const inactiveColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderBottomColor: isDark ? '#2a2a2a' : '#e5e5e5',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: isDark ? '#ffffff' : '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: 'Vehicle Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <Gauge
              size={focused ? size + 2 : size}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          headerRight: () => (
            <AlertTriangle
              size={24}
              color={activeColor}
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="diagnostics"
        options={{
          title: 'Diagnostics',
          headerTitle: 'System Diagnostics',
          tabBarIcon: ({ color, size, focused }) => (
            <Search
              size={focused ? size + 2 : size}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="terminal"
        options={{
          title: 'Terminal',
          headerTitle: 'ELM327 Terminal',
          tabBarIcon: ({ color, size, focused }) => (
            <Terminal
              size={focused ? size + 2 : size}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerTitle: 'Diagnostic History',
          tabBarIcon: ({ color, size, focused }) => (
            <History
              size={focused ? size + 2 : size}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'App Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Settings
              size={focused ? size + 2 : size}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}