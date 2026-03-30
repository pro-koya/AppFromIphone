import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

interface StarDisplayProps {
  stars: number; // 1-3
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { star: 20, gap: 4 },
  md: { star: 32, gap: 6 },
  lg: { star: 44, gap: 8 },
};

/**
 * Displays 1-3 stars with optional sequential pop-in animation.
 * Empty stars shown as outlines; earned stars shown filled.
 */
export function StarDisplay({ stars, animate = false, size = 'md' }: StarDisplayProps) {
  const scale1 = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const scale2 = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const scale3 = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const scales = [scale1, scale2, scale3];

  useEffect(() => {
    if (!animate) return;

    const animations = scales.map((scale, i) =>
      Animated.sequence([
        Animated.delay(i * 250),
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 160,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.parallel(animations).start();
  }, [animate]);

  const { star: starSize, gap } = SIZES[size];

  return (
    <View style={[styles.container, { gap }]}>
      {[1, 2, 3].map((n) => {
        const earned = n <= stars;
        return (
          <Animated.Text
            key={n}
            style={[
              styles.star,
              {
                fontSize: starSize,
                color: earned ? Colors.warning : Colors.border,
                transform: [{ scale: scales[n - 1] }],
              },
            ]}
          >
            {earned ? '\u2605' : '\u2606'}
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    textAlign: 'center',
  },
});
