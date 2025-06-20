import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { DatabaseService } from './src/services/database/DatabaseService';
import { NotificationService } from './src/services/alerts/NotificationService';

const App = () => {
  useEffect(() => {
    // Initialize database on app start
    DatabaseService.initialize();
    
    // Initialize notification service
    NotificationService.initialize();
    
    // Clean up old data periodically
    DatabaseService.cleanupOldData();
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default App;