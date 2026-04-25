import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification appearance
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

/**
 * Register for push notifications and return the Expo push token.
 * Returns null if running on a simulator or permissions are denied.
 */
export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.info('Push notifications require a physical device');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('debate_ai', {
      name:       'DebateAI',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-eas-project-id', // Replace with your EAS project ID
    });
    return token.data;
  } catch {
    return null;
  }
};

/**
 * Schedule a local notification immediately
 */
export const showLocalNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null, // null = show immediately
  });
};

/**
 * Notify user it's their debate turn
 */
export const notifyYourTurn = () =>
  showLocalNotification('⚡ Your Turn!', 'Make your argument in 30 seconds', { type: 'turn' });

/**
 * Notify opponent found for PvP
 */
export const notifyMatchFound = (opponentName) =>
  showLocalNotification('⚔️ Match Found!', `You're debating ${opponentName}`, { type: 'match' });

/**
 * Notify debate result
 */
export const notifyDebateResult = (won, score) =>
  showLocalNotification(
    won ? '🏆 You Won!' : '📚 Debate Complete',
    `Your score: ${score}`,
    { type: 'result' }
  );

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = () =>
  Notifications.cancelAllScheduledNotificationsAsync();
