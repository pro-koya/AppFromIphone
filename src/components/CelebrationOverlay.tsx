import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PARTICLE_COUNT = 24;

interface Particle {
  x: number;      // destination offset from center
  y: number;
  rotation: number;
  color: string;
  size: number;
}

interface CelebrationOverlayProps {
  visible: boolean;
}

function generateParticles(): Particle[] {
  const colors = [...Colors.pieces, Colors.warning, Colors.success, Colors.accent];
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 180;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 100, // bias upward
      rotation: Math.random() * 720 - 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
    };
  });
}

/**
 * Burst of animated particles from center screen.
 * Renders when visible=true; auto-fades after ~1 second.
 */
export function CelebrationOverlay({ visible }: CelebrationOverlayProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const particles = useMemo(() => generateParticles(), [visible]);

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  if (!visible) return null;

  const centerX = SCREEN_W / 2;
  const centerY = SCREEN_H * 0.38;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.x],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, p.y * 0.4, p.y + 120], // gravity effect
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.1, 0.7, 1],
          outputRange: [0, 1, 0.8, 0],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0, 1.2, 0.4],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.rotation}deg`],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: centerX,
                top: centerY,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity,
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                  { rotate },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
});
