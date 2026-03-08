import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  insetsTop: number;
  rightElement?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  insetsTop,
  rightElement,
}) => (
  <View style={[styles.header, { paddingTop: insetsTop }]}>
    <View style={styles.titleBlock}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.header,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  right: {
    marginLeft: 12,
  },
});
