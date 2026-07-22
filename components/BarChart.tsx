import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './ThemedText';
import { useSettings } from '@/utils/settings';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
Animated.addWhitelistedNativeProps({ height: true, y: true });

export function BarChart({ data, width = 300, height = 200 }: {
  data: { label: string; value: number; color: string }[]; width?: number; height?: number;
}) {
  const { colors } = useSettings();
  const max = Math.max(...data.map((d) => d.value), 1);
  const labelH = 28;
  const chartH = height - labelH - 10;
  const barGap = 16;
  const barWidth = (width - barGap * (data.length + 1)) / data.length;
  const baseY = chartH;
  return (
    <View style={styles.wrap}>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const h = (d.value / max) * chartH;
          const x = barGap + i * (barWidth + barGap);
          return <Bar key={i} x={x} baseY={baseY} width={barWidth} height={h} color={d.color} />;
        })}
        {data.map((d, i) => {
          const x = barGap + i * (barWidth + barGap) + barWidth / 2;
          return <SvgText key={`l${i}`} x={x} y={height - 8} fontSize={11} fontWeight="700" fill={colors.textSecondary} textAnchor="middle">{d.label}</SvgText>;
        })}
      </Svg>
    </View>
  );
}

function Bar({ x, baseY, width, height, color }: { x: number; baseY: number; width: number; height: number; color: string }) {
  const h = useSharedValue(0);
  useEffect(() => { h.value = withTiming(height, { duration: 800, easing: Easing.out(Easing.cubic) }); }, [height, h]);
  const props = useAnimatedProps(() => ({ height: h.value, y: baseY - h.value }));
  return <AnimatedRect x={x} width={width} rx={6} fill={color} animatedProps={props} />;
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center' } });
