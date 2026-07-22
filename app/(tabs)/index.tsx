import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Radar, BookOpen, Zap, ChevronRight, Activity, Clock, GraduationCap } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/utils/settings';
import { useProgress } from '@/context/ProgressContext';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { AnimatedShield } from '@/components/AnimatedShield';
import { formatDuration } from '@/utils/scanner';
import { haptic } from '@/utils/haptics';

const TIP = 'A "filtered" port is hidden behind a firewall — the scanner cannot tell whether a service is actually listening.';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, settings } = useSettings();
  const { progress } = useProgress();
  const insets = useSafeAreaInsets();

  const stats = [
    { label: 'Scans Run', value: String(progress.scanCount), icon: <Activity size={16} color={colors.accentGlow} /> },
    { label: 'Ports Viewed', value: String(progress.viewedPorts.length), icon: <BookOpen size={16} color={colors.accentGlow} /> },
    { label: 'Badges', value: String(progress.achievements.length), icon: <Zap size={16} color={colors.accentGlow} /> },
  ];

  return (
    <View style={styles.container}>
      <CyberBackground />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={settings.animationsEnabled ? FadeInDown.springify() : undefined} style={styles.header}>
          <AnimatedShield size={64} />
          <Text style={styles.title}>Port Scanner Dashboard</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Educational Network Port Scanner Simulator</Text>
        </Animated.View>

        <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(120).springify() : undefined} style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {s.icon}
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(200).springify() : undefined}>
          <SectionCard colors={colors} title="Today's Learning Tip" icon={<BookOpen size={18} color={colors.accentGlow} />}>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>{TIP}</Text>
          </SectionCard>
        </Animated.View>

        {progress.lastScan ? (
          <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(280).springify() : undefined}>
            <SectionCard colors={colors} title="Recent Scan" icon={<Radar size={18} color={colors.accentGlow} />}>
              <View style={styles.scanRow}>
                <View>
                  <Text style={styles.scanIp}>{progress.lastScan.ip}</Text>
                  <Text style={[styles.scanMeta, { color: colors.textSecondary }]}>{progress.lastScan.ports.length} ports · {formatDuration(progress.lastScan.durationMs)}</Text>
                </View>
                <Clock size={18} color={colors.textMuted} />
              </View>
              <Pressable style={[styles.cta, { borderColor: colors.borderStrong }]} onPress={() => { haptic('light'); router.push('/scanner'); }}>
                <Text style={[styles.ctaText, { color: colors.primaryGlow }]}>View Results</Text>
                <ChevronRight size={16} color={colors.primaryGlow} />
              </Pressable>
            </SectionCard>
          </Animated.View>
        ) : (
          <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(280).springify() : undefined}>
            <SectionCard colors={colors} title="Continue Learning" icon={<GraduationCap size={18} color={colors.accentGlow} />}>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>Run your first simulated scan to unlock results, statistics, and learning notes.</Text>
              <Pressable style={[styles.cta, { borderColor: colors.borderStrong }]} onPress={() => { haptic('light'); router.push('/scanner'); }}>
                <Text style={[styles.ctaText, { color: colors.primaryGlow }]}>Start a Scan</Text>
                <ChevronRight size={16} color={colors.primaryGlow} />
              </Pressable>
            </SectionCard>
          </Animated.View>
        )}

        <Animated.View entering={settings.animationsEnabled ? FadeInUp.delay(360).springify() : undefined} style={[styles.disclaimer, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}44` }]}>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>This app is an educational simulator. It does not perform real network scanning. All results are simulated.</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function SectionCard({ colors, title, icon, children }: { colors: ReturnType<typeof useSettings>['colors']; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>{icon}<Text style={styles.cardTitle}>{title}</Text></View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', gap: 8, marginBottom: 22, marginTop: 8 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: 0.3 },
  subtitle: { fontSize: 12, textAlign: 'center', paddingHorizontal: 24 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  card: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  tipText: { fontSize: 13, lineHeight: 20 },
  scanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scanIp: { fontSize: 18, fontWeight: '800' },
  scanMeta: { fontSize: 12, marginTop: 2 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, alignSelf: 'flex-start' },
  ctaText: { fontSize: 13, fontWeight: '700' },
  disclaimer: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 8 },
  disclaimerText: { fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
