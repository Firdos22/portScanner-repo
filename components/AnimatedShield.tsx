import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Shield } from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, cancelAnimation,
} from 'react-native-reanimated';
import { useSettings } from '@/utils/settings';

export function AnimatedShield({ size = 72 }: { size?: number }) {
  const { colors, settings } = useSettings();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.4);
  useEffect(() => {
    if (settings.animationsEnabled) {
      scale.value = withRepeat(withSequence(withTiming(1.06, { duration: 1800, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })), -1, false);
      glow.value = withRepeat(withSequence(withTiming(0.8, { duration: 1800, easing: Easing.inOut(Easing.ease) }), withTiming(0.4, { duration: 1800, easing: Easing.inOut(Easing.ease) })), -1, false);
    }
    return () => { cancelAnimation(scale); cancelAnimation(glow); };
  }, [settings.animationsEnabled, scale, glow]);
  const shieldStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={[styles.aura, { width: size * 1.6, height: size * 1.6, borderRadius: (size * 1.6) / 2, backgroundColor: colors.primary }, glowStyle]} />
      <Animated.View style={shieldStyle}>
        <Shield size={size} color={colors.primaryGlow} strokeWidth={1.8} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { justifyContent: 'center', alignItems: 'center' }, aura: { position: 'absolute', opacity: 0.4 } });
