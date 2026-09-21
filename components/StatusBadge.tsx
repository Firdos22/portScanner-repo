import { StyleSheet, View } from 'react-native';
import { useSettings } from '@/utils/settings';
import { Text } from './ThemedText';
import type { PortStatus } from '@/utils/scanner';

export function StatusBadge({ status }: { status: PortStatus }) {
  const { colors } = useSettings();
  const cfg = status === 'open'
    ? { label: 'OPEN', bg: colors.success, glow: colors.successGlow }
    : status === 'closed'
      ? { label: 'CLOSED', bg: colors.error, glow: colors.errorGlow }
      : { label: 'FILTERED', bg: colors.warning, glow: colors.warning };
  return (
    <View style={[styles.badge, { backgroundColor: `${cfg.bg}22`, borderColor: `${cfg.bg}77` }]}>
      <View style={[styles.dot, { backgroundColor: cfg.glow }]} />
      <Text style={[styles.text, { color: cfg.glow }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
});
