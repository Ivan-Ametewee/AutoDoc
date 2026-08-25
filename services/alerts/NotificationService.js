// src/services/alerts/NotificationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Vibration } from 'react-native';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import PushNotification from 'react-native-push-notification';

export class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.notificationSettings = {
      enabled: true,
      sound: true,
      vibration: true,
      badge: true,
      criticalAlertsOnly: false,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00'
      }
    };
    this.channelId = 'obdii_alerts';
    this.soundName = 'alert_sound.mp3';
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.requestPermissions();
      await this.loadSettings();
      this.createNotificationChannel();
      this.configurePushNotification();
      this.isInitialized = true;

    } catch (error) {

      throw error;
    }
  }

  // Request notification permissions
  async requestPermissions() {
    try {
      if (Platform.OS === 'android') {
        const permission = Platform.Version >= 33
          ? PERMISSIONS.ANDROID.POST_NOTIFICATIONS
          : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;

        const result = await check(permission);
        if (result !== RESULTS.GRANTED) {
          await request(permission);
        }
      } else {
        // iOS permissions are handled by PushNotification
        PushNotification.requestPermissions({
          alert: true,
          badge: true,
          sound: true
        });
      }
    } catch (error) {

    }
  }

  // Load notification settings
  async loadSettings() {
    try {
      const saved = await AsyncStorage.getItem('notification_settings');
      if (saved) {
        this.notificationSettings = { ...this.notificationSettings, ...JSON.parse(saved) };
      }
    } catch (error) {

    }
  }

  // Save notification settings
  async saveSettings() {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(this.notificationSettings));
    } catch (error) {

    }
  }

  // Create notification channel (Android)
  createNotificationChannel() {
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: this.channelId,
          channelName: 'OBDII Alerts',
          channelDescription: 'Vehicle diagnostic alerts and notifications',
          playSound: this.notificationSettings.sound,
          soundName: this.soundName,
          importance: 4, // High importance
          vibrate: this.notificationSettings.vibration,
          vibration: 300
        },
        () => { }
      );
    }
  }

  // Configure push notification
  configurePushNotification() {
    PushNotification.configure({
      onRegister: (token) => {

      },

      onNotification: (notification) => {


        // Handle notification tap
        if (notification.userInteraction) {
          this.handleNotificationTap(notification);
        }
      },

      onAction: (notification) => {

      },

      onRegistrationError: (err) => {

      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios'
    });
  }

  // Send alert notification
  async sendAlert(alert) {
    if (!this.shouldSendNotification(alert)) {
      return;
    }

    try {
      const notificationData = this.buildNotificationData(alert);

      // Send local notification
      PushNotification.localNotification(notificationData);

      // Handle additional alert actions
      await this.handleAlertActions(alert);


    } catch (error) {

    }
  }

  // Check if notification should be sent
  shouldSendNotification(alert) {
    // Check if notifications are enabled
    if (!this.notificationSettings.enabled) {
      return false;
    }

    // Check if only critical alerts should be shown
    if (this.notificationSettings.criticalAlertsOnly && alert.priority !== 'high') {
      return false;
    }

    // Check quiet hours
    if (this.notificationSettings.quietHours.enabled) {
      if (this.isInQuietHours()) {
        return alert.priority === 'high'; // Only send high priority during quiet hours
      }
    }

    return true;
  }

  // Check if current time is in quiet hours
  isInQuietHours() {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const startTime = this.parseTime(this.notificationSettings.quietHours.startTime);
    const endTime = this.parseTime(this.notificationSettings.quietHours.endTime);

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Parse time string to minutes
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  // Build notification data
  buildNotificationData(alert) {
    const title = this.getNotificationTitle(alert);
    const message = alert.message;
    const priority = this.getNotificationPriority(alert.priority);

    return {
      channelId: this.channelId,
      title,
      message,
      playSound: this.notificationSettings.sound,
      soundName: this.soundName,
      vibrate: this.notificationSettings.vibration,
      vibration: this.getVibrationPattern(alert.priority),
      priority,
      importance: priority,
      autoCancel: true,
      // largeIcon: 'ic_launcher',
      // smallIcon: 'ic_notification',
      bigText: message,
      color: this.getNotificationColor(alert.priority),
      group: 'obdii_alerts',
      userInfo: {
        alertId: alert.id,
        parameter: alert.parameter,
        priority: alert.priority,
        type: 'vehicle_alert'
      },
      actions: this.getNotificationActions(alert)
    };
  }

  // Get notification title based on alert
  getNotificationTitle(alert) {
    const priorityText = alert.priority === 'high' ? '🚨 CRITICAL' :
      alert.priority === 'medium' ? '⚠️ WARNING' :
        '💡 NOTICE';

    return `${priorityText} Vehicle Alert`;
  }

  // Get notification priority
  getNotificationPriority(alertPriority) {
    switch (alertPriority) {
      case 'high': return 'high';
      case 'medium': return 'default';
      case 'low': return 'low';
      default: return 'default';
    }
  }

  // Get vibration pattern
  getVibrationPattern(priority) {
    switch (priority) {
      case 'high': return [0, 500, 200, 500]; // Long vibrations
      case 'medium': return [0, 300, 100, 300]; // Medium vibrations
      case 'low': return [0, 200]; // Short vibration
      default: return [0, 300];
    }
  }

  // Get notification color
  getNotificationColor(priority) {
    switch (priority) {
      case 'high': return '#FF4444'; // Red
      case 'medium': return '#FF8800'; // Orange
      case 'low': return '#4488FF'; // Blue
      default: return '#4488FF';
    }
  }

  // Get notification actions
  getNotificationActions(alert) {
    const actions = ['Acknowledge', 'View Details'];

    if (alert.priority === 'high') {
      actions.unshift('Dismiss');
    }

    return actions;
  }

  // Handle additional alert actions
  async handleAlertActions(alert) {
    // Vibrate device if enabled
    if (this.notificationSettings.vibration) {
      Vibration.vibrate(this.getVibrationPattern(alert.priority));
    }

    // Show system alert for critical issues
    if (alert.priority === 'high' && Platform.OS === 'ios') {
      Alert.alert(
        'Critical Vehicle Alert',
        alert.message,
        [
          { text: 'Acknowledge', onPress: () => this.acknowledgeAlert(alert.id) },
          { text: 'View Details', onPress: () => this.viewAlertDetails(alert.id) }
        ],
        { cancelable: false }
      );
    }
  }

  // Handle notification tap
  handleNotificationTap(notification) {
    const { userInfo } = notification;

    if (userInfo && userInfo.type === 'vehicle_alert') {
      this.viewAlertDetails(userInfo.alertId);
    }
  }

  // Acknowledge alert
  acknowledgeAlert(alertId) {
    // This would typically dispatch an action or call a service method

  }

  // View alert details
  viewAlertDetails(alertId) {
    // This would typically navigate to alert details screen

  }

  // Send connection status notification
  async sendConnectionNotification(status, deviceName) {
    if (!this.notificationSettings.enabled) return;

    const title = status === 'connected' ? 'Device Connected' : 'Device Disconnected';
    const message = `${deviceName} ${status === 'connected' ? 'is now connected' : 'has been disconnected'}`;

    PushNotification.localNotification({
      channelId: this.channelId,
      title,
      message,
      playSound: false,
      vibrate: false,
      priority: 'low',
      autoCancel: true,
      userInfo: {
        type: 'connection_status',
        status,
        deviceName
      }
    });
  }

  // Send diagnostic notification
  async sendDiagnosticNotification(dtcCount, newCodes) {
    if (!this.notificationSettings.enabled || dtcCount === 0) return;

    const title = dtcCount === 1 ? 'Diagnostic Code Detected' : 'Diagnostic Codes Detected';
    const message = `${dtcCount} diagnostic trouble code${dtcCount > 1 ? 's' : ''} found`;

    PushNotification.localNotification({
      channelId: this.channelId,
      title,
      message,
      playSound: this.notificationSettings.sound,
      vibrate: this.notificationSettings.vibration,
      priority: 'high',
      importance: 'high',
      color: '#FF8800',
      userInfo: {
        type: 'diagnostic_codes',
        count: dtcCount,
        codes: newCodes
      }
    });
  }

  // Clear all notifications
  clearAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  // Clear specific notification
  clearNotification(notificationId) {
    PushNotification.cancelLocalNotifications({ id: notificationId });
  }

  // Update settings
  async updateSettings(newSettings) {
    this.notificationSettings = { ...this.notificationSettings, ...newSettings };
    await this.saveSettings();

    // Recreate channel if sound/vibration settings changed
    if (newSettings.sound !== undefined || newSettings.vibration !== undefined) {
      this.createNotificationChannel();
    }
  }

  // Get current settings
  getSettings() {
    return { ...this.notificationSettings };
  }

  // Test notification
  async testNotification() {
    const testAlert = {
      id: 'test_alert',
      parameter: 'engineTemp',
      currentValue: 110,
      threshold: { min: 70, max: 105, unit: '°C' },
      priority: 'high',
      message: 'This is a test notification for your OBDII diagnostic app'
    };

    await this.sendAlert(testAlert);
  }

  // Get notification statistics
  getStatistics() {
    // This would typically be implemented with proper tracking
    return {
      totalSent: 0,
      acknowledged: 0,
      dismissed: 0,
      lastSent: null
    };
  }

  // Dispose
  dispose() {
    this.isInitialized = false;
    this.clearAllNotifications();
  }
}