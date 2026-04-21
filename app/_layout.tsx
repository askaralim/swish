import { Sentry } from '../src/services/sentry';
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { Tabs, useRouter, usePathname, useGlobalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants/theme';
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
  const insets = useSafeAreaInsets();
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
        {/*
          This is a common pattern for "tabs-first" apps with Expo Router.
          The Tabs component effectively acts as the root of the app, and any
          routes that should appear "over" the tabs (like detail screens)
          will be automatically pushed onto a stack managed by Expo Router.

          We also explicitly include the detail screens here with href: null
          to ensure they are recognized by the router and can be navigated to,
          but don't appear as tabs.
        */}
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: COLORS.accent,
            tabBarInactiveTintColor: '#71767a',
            tabBarStyle: {
              backgroundColor: '#000000',
              borderTopColor: '#2f3336',
              borderTopWidth: 1,
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 8),
              height: 60 + Math.max(insets.bottom, 0),
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: '主页',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="basketball-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="teams"
            options={{
              title: '球队',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="people-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="players"
            options={{
              title: '数据榜',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="stats-chart-outline" size={size} color={color} />
              ),
            }}
          />
          {/* TEMP (App Store submission): hide 新闻 tab. Remove `href: null` to show again. */}
          <Tabs.Screen
            name="news"
            options={{
              href: null,
              title: '新闻',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="newspaper-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="about"
            options={{
              title: '关于',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="information-circle-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="fullgames"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="playerComparison/[id1]/[id2]"
            options={{
              href: null,
            }}
          />
          {/* Detail screens must be defined here with href: null */}
          <Tabs.Screen
            name="game/[id]"
            options={{
              href: null,
              // presentation: 'modal' // Can uncomment if you want modal presentation for detail
            }}
          />
          <Tabs.Screen
            name="player/[id]"
            options={{
              href: null,
              // presentation: 'modal'
            }}
          />
          <Tabs.Screen
            name="team/[id]"
            options={{
              href: null,
              // presentation: 'modal'
            }}
          />
          <Tabs.Screen
            name="game/[id]/player/[playerId]"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </QueryClientProvider>
    </PostHogProvider>
  );
}

export default Sentry.wrap(RootLayout);
