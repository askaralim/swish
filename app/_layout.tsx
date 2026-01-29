import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  console.log('RootLayout rendered');
  
  return (
    <QueryClientProvider client={queryClient}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1d9bf0',
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
            title: '比赛',
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
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="newspaper-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="game/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="player/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="team/[id]"
          options={{
            href: null,
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
  );
}
