import { Sentry } from '../src/services/sentry';
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { Stack, useRouter, usePathname, useGlobalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Platform, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  syncPushRegistrationFromPreference,
  addNotificationResponseListener,
} from '../src/services/notifications';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '../src/config/posthog';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: Error) => {
        if (error?.message?.includes('Too many requests')) {
          return failureCount < 3;
        }
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 60000),
      staleTime: 5000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);
  const responseListener = useRef<ReturnType<typeof addNotificationResponseListener> | undefined>(
    undefined
  );

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    syncPushRegistrationFromPreference();
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncPushRegistrationFromPreference();
      }
    });

    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, string | undefined>;
      if (data?.type === 'close_game' && data?.gameId) {
        posthog.capture('notification_tapped', { type: 'close_game', game_id: data.gameId });
        router.push(`/game/${data.gameId}`);
      } else if (data?.type === 'mvp_performance' && data?.gameId) {
        posthog.capture('notification_tapped', {
          type: 'mvp_performance',
          game_id: data.gameId,
          player_id: data.playerId ?? null,
        });
        if (data.playerId) {
          router.push(`/game/${data.gameId}/player/${data.playerId}`);
        } else {
          router.push(`/game/${data.gameId}`);
        }
      }
    });

    return () => {
      appStateSub.remove();
      responseListener.current?.remove();
    };
  }, [router]);

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        captureScreens: false,
        captureTouches: false,
        propsToCapture: ['testID'],
        maxElementsCaptured: 20,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="fullgames" />
          <Stack.Screen name="game/[id]" />
          <Stack.Screen name="game/[id]/player/[playerId]" />
          <Stack.Screen name="player/[id]" />
          <Stack.Screen name="playerComparison/[id1]/[id2]" />
          <Stack.Screen name="team/[id]" />
          <Stack.Screen name="news" />
        </Stack>
      </QueryClientProvider>
    </PostHogProvider>
  );
}

export default Sentry.wrap(RootLayout);
