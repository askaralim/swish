import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { COLORS } from '../src/constants/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  const appVersion = Application.nativeApplicationVersion || '1.0.0'; // Fallback for web or dev
  const buildVersion = Application.nativeBuildVersion || '1';

  const handlePressLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
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
              <Text style={styles.value}>{appVersion} ({buildVersion})</Text>
            </View>
            {/* <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>开发者</Text>
              <Text style={styles.value}>AskArDev</Text>
            </View> */}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>法律声明</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => handlePressLink('https://askaralim.github.io/swish-privacy/privacy.html')}>
              <Text style={styles.label}>隐私政策</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            {/* <TouchableOpacity style={styles.row} onPress={() => handlePressLink('https://www.example.com/terms')}>
              <Text style={styles.label}>服务条款</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity> */}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据来源</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              {/* <Text style={styles.label}>数据</Text> */}
              <Text style={styles.value}>本应用为非官方统计展示工具，与 ESPN 或 NBA 无官方关联。</Text>
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
  label: {
    color: COLORS.textMain,
    fontSize: 16,
  },
  value: {
    color: COLORS.textSecondary,
    fontSize: 16,
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