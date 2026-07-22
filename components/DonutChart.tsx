import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './ThemedText';
import { useSettings } from '@/utils/settings';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, type SharedValue } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
Animated.addWhitelistedNativeProps({ strokeDasharray: true });

export function DonutChart({ segments, size = 180, strokeWidth = 22 }: {
  segments: { value: number; color: string; label: string }[]; size?: number; strokeWidth?: number;
}) {
  const { colors } = useSettings();
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress]);
  let offset = 0;
  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
          {segments.map((seg, i) => {
            const len = (seg.value / total) * circumference;
            const start = offset;
            offset += len;
            return <Segment key={i} size={size} radius={radius} strokeWidth={strokeWidth} color={seg.color} len={len} circumference={circumference} startOffset={start} progress={progress} />;
          })}
        </G>
      </Svg>
      <View style={styles.center}>
        <Text style={styles.centerValue}>{total}</Text>
        <Text style={[styles.centerLabel, { color: colors.textSecondary }]}>Ports</Text>
      </View>
    </View>
  );
}

function Segment({ size, radius, strokeWidth, color, len, circumference, startOffset, progress }: {
  size: number; radius: number; strokeWidth: number; color: string; len: number; circumference: number; startOffset: number; progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => ({ strokeDasharray: `${len * progress.value} ${circumference}` }));
  return <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} strokeLinecap="butt" fill="none" strokeDashoffset={-startOffset} animatedProps={animatedProps} />;
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center', alignItems: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  centerValue: { fontSize: 28, fontWeight: '800' },
  centerLabel: { fontSize: 11, fontWeight: '600' },
});
