import { StyleSheet, View, ScrollView } from 'react-native';
import { Radar, Activity, Lock, LockOpen, Clock, Globe, Server } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/utils/settings';
import { useProgress } from '@/context/ProgressContext';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { DonutChart } from '@/components/DonutChart';
import { BarChart } from '@/components/BarChart';
import { ProgressRing } from '@/components/ProgressRing';
import { calculateStatistics, formatDuration } from '@/utils/scanner';

export default function StatsScreen() {
  const { colors, settings } = useSettings();
  const insets = useSafeAreaInsets();
  const { progress } = useProgress();
  const last = progress.lastScan;
  const stats = last ? calculateStatistics(last) : null;

  const cards = [
    { label: 'Total Ports', value: stats?.total ?? 0, icon: <Server size={16} color={colors.accentGlow} />, color: colors.primaryGlow },
    { label: 'Open', value: stats?.open ?? 0, icon: <LockOpen size={16} color={colors.successGlow} />, color: colors.successGlow },
    { label: 'Closed', value: stats?.closed ?? 0, icon: <Lock size={16} color={colors.errorGlow} />, color: colors.errorGlow },
    { label: 'Filtered', value: stats?.filtered ?? 0, icon: <Activity size={16} color={colors.warning} />, color: colors.warning },
  ];

  return (
    <View style={styles.container}>
      <CyberBackground />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Statistics</Text>
        <Text style={[styles.screenSub, { color: colors.textSecondary }]}>{last ? `Target ${last.ip}` : 'Run a scan to see statistics.'}</Text>

        <View style={styles.cardsGrid}>
          {cards.map((c, i) => (
            <Animated.View key={c.label} entering={settings.animationsEnabled ? FadeInDown.delay(i * 80).springify() : undefined} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: `${c.color}33` }]}>
              <View style={[styles.statIcon, { backgroundColor: `${c.color}1a` }]}>{c.icon}</View>
              <AnimatedCounter value={c.value} style={[styles.statValue, { color: c.color }]} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{c.label}</Text>
            </Animated.View>
          ))}
        </View>

        {stats && (
          <>
            <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(360).springify() : undefined} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.cardTitle}>Open vs Closed</Text>
              <View style={styles.chartRow}>
                <DonutChart segments={[{ value: stats.open, color: colors.success, label: 'Open' }, { value: stats.closed, color: colors.error, label: 'Closed' }, { value: stats.filtered, color: colors.warning, label: 'Filtered' }]} />
                <View style={styles.legend}>
                  <LegendDot color={colors.success} label="Open" value={stats.open} />
                  <LegendDot color={colors.error} label="Closed" value={stats.closed} />
                  <LegendDot color={colors.warning} label="Filtered" value={stats.filtered} />
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(440).springify() : undefined} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.cardTitle}>Protocol Distribution</Text>
              <BarChart data={[{ label: 'TCP', value: stats.tcp, color: colors.primary }, { label: 'UDP', value: stats.udp, color: colors.accent }, { label: 'Open', value: stats.open, color: colors.success }, { label: 'Closed', value: stats.closed, color: colors.error }]} width={300} height={200} />
            </Animated.View>

            <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(520).springify() : undefined} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.cardTitle}>Scanning Summary</Text>
              <View style={styles.ringRow}>
                <ProgressRing progress={(stats.open / stats.total) * 100} color={colors.success} label="Open ratio" />
                <View style={styles.summaryList}>
                  <SummaryItem icon={<Globe size={15} color={colors.textSecondary} />} label="Target IP" value={stats.ip} colors={colors} />
                  <SummaryItem icon={<Clock size={15} color={colors.textSecondary} />} label="Duration" value={formatDuration(stats.durationMs)} colors={colors} />
                  <SummaryItem icon={<Radar size={15} color={colors.textSecondary} />} label="Total Scans" value={String(progress.scanCount)} colors={colors} />
                  <SummaryItem icon={<Server size={15} color={colors.textSecondary} />} label="Ports Scanned" value={String(stats.total)} colors={colors} />
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(600).springify() : undefined} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.cardTitle}>Weekly Learning</Text>
              <BarChart data={[{ label: 'Mon', value: 2, color: colors.primary }, { label: 'Tue', value: 3, color: colors.accent }, { label: 'Wed', value: 1, color: colors.success }, { label: 'Thu', value: 4, color: colors.warning }, { label: 'Fri', value: 2, color: colors.primary }, { label: 'Sat', value: 5, color: colors.accent }, { label: 'Sun', value: 3, color: colors.success }]} width={300} height={180} />
              <Text style={[styles.chartCaption, { color: colors.textMuted }]}>Simulated learning activity for the week.</Text>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: number }) {
  const { colors } = useSettings();
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{label}</Text><Text style={styles.legendValue}>{value}</Text></View>;
}

function SummaryItem({ icon, label, value, colors }: { icon: React.ReactNode; label: string; value: string; colors: ReturnType<typeof useSettings>['colors'] }) {
  return <View style={styles.summaryItem}>{icon}<Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  screenSub: { fontSize: 13, marginBottom: 18 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '48%', flexBasis: '48%', borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  statIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  card: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap' },
  legend: { gap: 10, flex: 1, minWidth: 120 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, flex: 1 },
  legendValue: { fontSize: 14, fontWeight: '800' },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap' },
  summaryList: { flex: 1, gap: 12, minWidth: 150 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryLabel: { fontSize: 12, flex: 1 },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  chartCaption: { fontSize: 11, marginTop: 10, textAlign: 'center' },
});
