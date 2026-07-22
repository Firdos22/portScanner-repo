import { Pressable, StyleSheet, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSettings } from '@/utils/settings';
import { Text } from './ThemedText';
import { StatusBadge } from './StatusBadge';
import type { PortInfo } from '@/data/ports';

export function PortCard({ port, index, isFavorite, onPress, onToggleFavorite }: {
  port: PortInfo; index: number; isFavorite: boolean; onPress: () => void; onToggleFavorite: () => void;
}) {
  const { colors, settings } = useSettings();
  const glow = port.status === 'open' ? colors.successGlow : port.status === 'closed' ? colors.errorGlow : colors.warning;
  return (
    <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(index * 70).springify() : undefined}>
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: `${glow}44`, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <View style={[styles.glowBar, { backgroundColor: glow }]} />
            <View style={styles.row}>
              <View style={styles.left}>
                <View style={[styles.portCircle, { borderColor: `${glow}66`, backgroundColor: `${glow}14` }]}>
                  <Text style={[styles.portNum, { color: glow }]}>{port.port}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.service}>{port.service}</Text>
                  <Text style={[styles.proto, { color: colors.textSecondary }]}>{port.protocol} · {port.description}</Text>
                </View>
              </View>
              <View style={styles.right}>
                <StatusBadge status={port.status} />
                <Pressable onPress={onToggleFavorite} hitSlop={10} style={styles.favBtn}>
                  {isFavorite ? <Heart size={18} color={colors.error} fill={colors.error} /> : <Heart size={18} color={colors.textMuted} />}
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, marginBottom: 12, padding: 16, overflow: 'hidden' },
  glowBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  portCircle: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  portNum: { fontSize: 16, fontWeight: '800' },
  info: { flexShrink: 1 },
  service: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  proto: { fontSize: 12 },
  right: { alignItems: 'flex-end', gap: 8 },
  favBtn: { padding: 4 },
});
