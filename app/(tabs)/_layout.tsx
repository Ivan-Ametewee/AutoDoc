//tabs/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { theme, isDark } = useTheme();

  const tabBarStyle = {
    backgroundColor: theme.colors.tabBarBackground,
    borderTopColor: theme.colors.tabBarBorder,
    borderTopWidth: 1,
    height: 85,
    paddingBottom: 8,
    paddingTop: 8,
  };

  const activeColor = theme.colors.tabBarActive;
  const inactiveColor = theme.colors.tabBarInactive;

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
          backgroundColor: theme.colors.headerBackground,
          borderBottomColor: theme.colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.headerText,
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
            <Ionicons
              name="speedometer"
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
          headerRight: () => (
            <Ionicons
              name="warning"
              size={24}
              color={activeColor}
              style={{ marginRight: 16 }}
            />
          ),
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="diagnostics"
        options={{
          title: 'Diagnostics',
          headerTitle: 'System Diagnostics',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="search"
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
          headerShown: false,
        }}
      />

      {/* <Tabs.Screen
        name="terminal"
        options={{
          title: 'Terminal',
          headerTitle: 'ELM327 Terminal',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="terminal"
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
          headerShown: false
        }}
      />

      <Tabs.Screen
        name="pid-test"
        options={{
          title: 'PID Test',
          headerTitle: 'PID Discovery',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="flask"
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
        }}
      /> */}

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerTitle: 'Diagnostic History',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="time"
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'App Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="settings"
              size={focused ? size + 2 : size}
              color={color}
            />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}