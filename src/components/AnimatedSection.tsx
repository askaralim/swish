import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, Platform } from 'react-native';
import { MOTION } from '../constants/theme';

interface AnimatedSectionProps {
  children: React.ReactNode;
  index?: number;
  visible?: boolean;
  style?: ViewStyle;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({ 
  children, 
  index = 0, 
  visible = true,
  style 
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: MOTION.Standard,
          delay: index * 50, // Stagger effect
          useNativeDriver: Platform.OS !== 'web',
          easing: MOTION.AppleEasing,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: MOTION.Standard,
          delay: index * 50,
          useNativeDriver: Platform.OS !== 'web',
          easing: MOTION.AppleEasing,
        }),
      ]).start();
    }
  }, [visible, index]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};
