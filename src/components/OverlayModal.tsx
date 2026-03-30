import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, StyleSheet } from 'react-native';

interface OverlayModalProps {
  visible: boolean;
  children: React.ReactNode;
  onRequestClose?: () => void;
}

/**
 * OverlayModal — A React-Native-only alternative to <Modal>.
 *
 * Replaces the native iOS ViewController-based <Modal> with a plain
 * Animated.View overlay. This avoids the iOS concurrent-VC-transition
 * bug where dismissing a Modal VC and immediately calling
 * InterstitialAd.show() causes a frozen transparent overlay.
 *
 * - Fades in over 200 ms when visible becomes true
 * - Fades out over 200 ms when visible becomes false, then unmounts children
 * - Handles the Android hardware back button when visible
 */
export function OverlayModal({ visible, children, onRequestClose }: OverlayModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [visible, fadeAnim]);

  useEffect(() => {
    if (!visible) return;

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onRequestClose) {
        onRequestClose();
        return true;
      }
      return false;
    });

    return () => handler.remove();
  }, [visible, onRequestClose]);

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, { opacity: fadeAnim }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
});
