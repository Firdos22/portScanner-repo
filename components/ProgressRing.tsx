import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './ThemedText';
import { useSettings } from '@/utils/settings';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
Animated.addWhitelistedNativeProps({ strokeDasharray: true });

export function ProgressRing({ progress: percent, size = 140, strokeWidth = 12, color, label }: {
  progress: number; size?: number; strokeWidth?: number; color: string; label?: string;
}) {
  const { colors } = useSettings();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const len = (percent / 100) * circumference;
  const progress = useSharedValue(0);
  useEffect(() => { progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }); }, [progress]);
  const animatedProps = useAnimatedProps(() => ({ strokeDasharray: `${len * progress.value} ${circumference}` }));
  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" animatedProps={animatedProps} />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.percent}>{Math.round(percent)}%</Text>
        {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center', alignItems: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  percent: { fontSize: 24, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '600' },
});
