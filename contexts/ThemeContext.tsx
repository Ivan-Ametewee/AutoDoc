import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import SettingsService from '../services/settings/SettingsService';

export interface Theme {
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    notification: string;
    surface: string;
    onSurface: string;
    accent: string;
    error: string;
    warning: string;
    success: string;
    info: string;
    disabled: string;
    shadow: string;
    overlay: string;
    // Semantic colors
    headerBackground: string;
    headerText: string;
    tabBarBackground: string;
    tabBarActive: string;
    tabBarInactive: string;
    tabBarBorder: string;
    // Component specific colors
    gaugeBackground: string;
    chartGrid: string;
    inputBackground: string;
    inputBorder: string;
    inputText: string;
    buttonPrimary: string;
    buttonSecondary: string;
    buttonDanger: string;
    buttonSuccess: string;
    buttonText: string;
    statusConnected: string;
    statusDisconnected: string;
    statusWarning: string;
    modalBackground: string;
    divider: string;
    placeholder: string;
  };
  dark: boolean;
}

const lightTheme: Theme = {
  colors: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    secondary: '#64748b',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    notification: '#ef4444',
    surface: '#ffffff',
    onSurface: '#1e293b',
    accent: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
    disabled: '#cbd5e1',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    // Semantic colors
    headerBackground: '#ffffff',
    headerText: '#1e293b',
    tabBarBackground: '#ffffff',
    tabBarActive: '#3b82f6',
    tabBarInactive: '#94a3b8',
    tabBarBorder: '#e2e8f0',
    // Component specific colors
    gaugeBackground: '#f1f5f9',
    chartGrid: '#e2e8f0',
    inputBackground: '#ffffff',
    inputBorder: '#d1d5db',
    inputText: '#1e293b',
    buttonPrimary: '#3b82f6',
    buttonSecondary: '#6b7280',
    buttonDanger: '#ef4444',
    buttonSuccess: '#10b981',
    buttonText: '#ffffff',
    statusConnected: '#10b981',
    statusDisconnected: '#ef4444',
    statusWarning: '#f59e0b',
    modalBackground: 'rgba(0, 0, 0, 0.5)',
    divider: '#e2e8f0',
    placeholder: '#9ca3af',
  },
  dark: false,
};

const darkTheme: Theme = {
  colors: {
    primary: '#60a5fa',
    primaryDark: '#3b82f6',
    secondary: '#94a3b8',
    background: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    border: '#334155',
    borderLight: '#475569',
    notification: '#f87171',
    surface: '#1e293b',
    onSurface: '#f8fafc',
    accent: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    success: '#34d399',
    info: '#60a5fa',
    disabled: '#475569',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
    // Semantic colors
    headerBackground: '#1e293b',
    headerText: '#f8fafc',
    tabBarBackground: '#1e293b',
    tabBarActive: '#60a5fa',
    tabBarInactive: '#64748b',
    tabBarBorder: '#334155',
    // Component specific colors
    gaugeBackground: '#334155',
    chartGrid: '#475569',
    inputBackground: '#334155',
    inputBorder: '#475569',
    inputText: '#f8fafc',
    buttonPrimary: '#3b82f6',
    buttonSecondary: '#6b7280',
    buttonDanger: '#ef4444',
    buttonSuccess: '#10b981',
    buttonText: '#ffffff',
    statusConnected: '#34d399',
    statusDisconnected: '#f87171',
    statusWarning: '#fbbf24',
    modalBackground: 'rgba(0, 0, 0, 0.8)',
    divider: '#334155',
    placeholder: '#6b7280',
  },
  dark: true,
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  themeMode: 'light' | 'dark' | 'auto';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'auto'>('auto');
  const [currentTheme, setCurrentTheme] = useState<Theme>(lightTheme);

  useEffect(() => {
    // Load theme preference from settings
    const loadThemePreference = async () => {
      const savedTheme = SettingsService.getTheme();
      setThemeModeState(savedTheme);
      updateTheme(savedTheme, systemColorScheme);
    };

    loadThemePreference();

    // Listen for theme changes
    const handleThemeChange = (value: any) => {
      if (value === 'light' || value === 'dark' || value === 'auto') {
        setThemeModeState(value);
        updateTheme(value, systemColorScheme);
      }
    };

    SettingsService.on('settingChanged:theme', handleThemeChange);

    return () => {
      SettingsService.removeListener('settingChanged:theme', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    // Update theme when system color scheme changes (for auto mode)
    if (themeMode === 'auto') {
      updateTheme(themeMode, systemColorScheme);
    }
  }, [systemColorScheme, themeMode]);

  const updateTheme = (mode: 'light' | 'dark' | 'auto', systemScheme: any) => {
    let shouldUseDark = false;

    switch (mode) {
      case 'dark':
        shouldUseDark = true;
        break;
      case 'light':
        shouldUseDark = false;
        break;
      case 'auto':
        shouldUseDark = systemScheme === 'dark';
        break;
    }

    setCurrentTheme(shouldUseDark ? darkTheme : lightTheme);
  };

  const toggleTheme = async () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    await SettingsService.updateSetting('theme', newMode);
  };

  const setThemeMode = async (mode: 'light' | 'dark' | 'auto') => {
    await SettingsService.updateSetting('theme', mode);
  };

  const value: ThemeContextType = {
    theme: currentTheme,
    isDark: currentTheme.dark,
    toggleTheme,
    setThemeMode,
    themeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Helper hook for getting themed styles
export const useThemedStyles = <T extends Record<string, any>>(
  createStyles: (theme: Theme) => T
): T => {
  const { theme } = useTheme();
  return createStyles(theme);
};

// Common themed components
export const getThemedStatusBarStyle = (isDark: boolean) => ({
  barStyle: isDark ? 'light-content' as const : 'dark-content' as const,
  backgroundColor: isDark ? '#000000' : '#ffffff',
});

export default ThemeContext;