import React, { useRef, useEffect, ReactNode } from 'react';
import { Animated } from 'react-native';
import { MOTION } from '../constants/theme';

interface AnimatedSectionProps {
  children: ReactNode;
  index: number;
  visible: boolean;
  delay?: number;
}

export const AnimatedSection = ({ children, index, visible, delay = 40 }: AnimatedSectionProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: MOTION.Standard,
        delay: index * delay,
        easing: MOTION.AppleEasing,
        useNativeDriver: true,
      }).start();
    } else {
      animatedValue.setValue(0);
    }
  }, [visible, index, delay]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <Animated.View style={{ opacity: animatedValue, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};
