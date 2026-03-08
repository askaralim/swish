import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export interface DetailScreenHeaderProps {
  onBack: () => void;
  center?: React.ReactNode;
  right?: React.ReactNode;
  backgroundColor?: string;
  paddingTop: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * Shared chrome for detail screens: back button, safe area, background, nav bar.
 * Center and right slots allow screen-specific content. Children render below the nav bar.
 */
export const DetailScreenHeader: React.FC<DetailScreenHeaderProps> = ({
  onBack,
  center,
  right,
  backgroundColor = COLORS.header,
  paddingTop,
  style,
  children,
}) => (
  <View style={[styles.header, { paddingTop, backgroundColor }, style]}>
    <View style={styles.navBar}>
      <TouchableOpacity onPress={onBack} style={styles.iconButton}>
        <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
      </TouchableOpacity>
      {center ? <View style={styles.center}>{center}</View> : null}
      {right ? <View style={styles.right}>{right}</View> : <View style={styles.iconButton} />}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 44,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
