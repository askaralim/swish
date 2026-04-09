import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { COLORS } from '../src/constants/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { getPushOptIn, setPushOptIn } from '../src/services/pushPreferences';
import {
  registerForPushNotifications,
  sendPushTokenToServer,
} from '../src/services/notifications';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(true);
  const [pushBusy, setPushBusy] = useState(false);

  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildVersion = Application.nativeBuildVersion || '1';

  const loadPushPref = useCallback(async () => {
    setPushLoading(true);
    try {
      const on = await getPushOptIn();
      setPushEnabled(on);
    } finally {
      setPushLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPushPref();
  }, [loadPushPref]);

  const handlePressLink = (url: string) => {
    Linking.openURL(url).catch((err) => {
      if (__DEV__) console.error('Failed to open URL:', err);
    });
  };

  const onTogglePush = async (value: boolean) => {
    setPushBusy(true);
    try {
      if (value) {
        const token = await registerForPushNotifications();
        if (token) {
          const ok = await sendPushTokenToServer(token);
          if (ok) {
            await setPushOptIn(true);
            setPushEnabled(true);
          }
        }
        const stillOn = await getPushOptIn();
        setPushEnabled(stillOn);
      } else {
        await setPushOptIn(false);
        setPushEnabled(false);
      }
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="关于" subtitle="Swish" insetsTop={insets.top} />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>应用信息</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>版本</Text>
              <Text style={styles.value}>
                {appVersion} ({buildVersion})
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>提醒</Text>
          <View style={styles.card}>
            <View style={styles.rowMultiline}>
              <View style={styles.pushTextCol}>
                <Text style={styles.label}>开启比赛提醒</Text>
                <Text style={styles.pushHint}>
                  末节关键时刻、本场 GIS 表现推送。可随时关闭。
                </Text>
              </View>
              {pushLoading ? (
                <ActivityIndicator color={COLORS.accent} />
              ) : (
                <Switch
                  value={pushEnabled}
                  onValueChange={onTogglePush}
                  disabled={pushBusy}
                  trackColor={{ false: COLORS.divider, true: COLORS.accent + '88' }}
                  thumbColor={pushEnabled ? COLORS.accent : '#888'}
                />
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>法律声明</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                handlePressLink('https://askaralim.github.io/swish-privacy/privacy.html')
              }
            >
              <Text style={styles.label}>隐私政策</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据来源</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.value}>
                本应用为非官方统计展示工具，与 ESPN 或 NBA 无官方关联。
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerText}>
          Swish - 您的NBA伴侣。所有版权归属其各自所有者。
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowMultiline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  pushTextCol: {
    flex: 1,
  },
  pushHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  label: {
    color: COLORS.textMain,
    fontSize: 16,
  },
  value: {
    color: COLORS.textSecondary,
    fontSize: 16,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.divider,
    marginLeft: 16,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
});
