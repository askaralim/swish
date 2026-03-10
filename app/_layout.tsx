import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { Tabs, Stack } from 'expo-router'; // Import Stack for hidden detail screens
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants/theme';
import { useEffect } from 'react';
import { AppState, Platform, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

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

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);
  
  return (
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
        <Tabs.Screen
          name="news"
          options={{
            title: '新闻',
            href: null, // Hidden for App Store resubmission (legal)
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
            // presentation: 'modal'
          }}
        />
      </Tabs>
    </QueryClientProvider>
  );
}