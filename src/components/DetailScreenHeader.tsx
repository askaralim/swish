import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export interface DetailScreenHeaderProps {
  onBack: () => void;
  center?: React.ReactNode;
  leading?: React.ReactNode;
  right?: React.ReactNode;
  backgroundColor?: string;
  paddingTop: number;
  navBarHeight?: number;
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
  leading,
  right,
  backgroundColor = COLORS.header,
  paddingTop,
  navBarHeight = 44,
  style,
  children,
}) => (
  <View style={[styles.header, { paddingTop, backgroundColor }, style]}>
    <View style={[styles.navBar, { height: navBarHeight }]}>
      <TouchableOpacity onPress={onBack} style={styles.iconButton}>
        <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
      </TouchableOpacity>
      {leading ? <View style={styles.leading}>{leading}</View> : center ? <View style={styles.center}>{center}</View> : null}
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
  leading: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  right: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
