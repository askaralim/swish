import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URL } from './api';
import { getPushOptIn } from './pushPreferences';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) {
      console.log('Push notifications require a physical device');
    }
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    if (__DEV__) {
      console.warn('Missing EAS project ID for push notifications');
    }
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return tokenData.data;
}

async function postRegisterToken(token: string): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/v1/notifications/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform: Platform.OS }),
  });
}

export async function sendPushTokenToServer(token: string): Promise<boolean> {
  try {
    let res = await postRegisterToken(token);
    if (!res.ok && res.status >= 500) {
      await sleep(2000);
      res = await postRegisterToken(token);
    }
    if (!res.ok) {
      const snippet = await res.text().catch(() => '');
      if (__DEV__) {
        console.warn(
          'Push token register failed:',
          res.status,
          snippet.slice(0, 120)
        );
      }
      return false;
    }
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to register push token:', error);
    }
    return false;
  }
}

/**
 * If user opted in (About → 比赛提醒), request token and register with API.
 * Call on cold start and when app returns to foreground.
 */
export async function syncPushRegistrationFromPreference(): Promise<void> {
  const optedIn = await getPushOptIn();
  if (!optedIn) return;
  const token = await registerForPushNotifications();
  if (token) await sendPushTokenToServer(token);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
