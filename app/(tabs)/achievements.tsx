import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { Lock, RotateCcw } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/utils/settings';
import { useProgress } from '@/context/ProgressContext';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { ACHIEVEMENTS } from '@/data/ports';
import { getIcon } from '@/utils/iconMap';
import { haptic } from '@/utils/haptics';

export default function AchievementsScreen() {
  const { colors, settings } = useSettings();
  const insets = useSafeAreaInsets();
  const { progress, reset } = useProgress();
  const unlocked = new Set(progress.achievements);
  const unlockedCount = progress.achievements.length;

  return (
    <View style={styles.container}>
      <CyberBackground />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Achievements</Text>
        <Text style={[styles.screenSub, { color: colors.textSecondary }]}>Unlock badges as you learn and scan.</Text>

        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.progressValue}>{unlockedCount} / {ACHIEVEMENTS.length}</Text>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Badges unlocked</Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.accent, width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.grid}>
          {ACHIEVEMENTS.map((a, i) => {
            const Icon = getIcon(a.icon);
            const isUnlocked = unlocked.has(a.id);
            return (
              <Animated.View key={a.id} entering={settings.animationsEnabled ? FadeInDown.delay(i * 70).springify() : undefined} style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: isUnlocked ? `${colors.accent}66` : colors.border }]}>
                <View style={[styles.badgeIcon, { backgroundColor: isUnlocked ? `${colors.accent}1a` : `${colors.textMuted}14` }]}>
                  {isUnlocked ? <Icon size={26} color={colors.accentGlow} /> : <Lock size={22} color={colors.textMuted} />}
                </View>
                <Text style={[styles.badgeTitle, { color: isUnlocked ? colors.textPrimary : colors.textMuted }]}>{a.title}</Text>
                <Text style={[styles.badgeDesc, { color: colors.textSecondary }]}>{a.description}</Text>
                <Text style={[styles.badgeStatus, { color: isUnlocked ? colors.successGlow : colors.textMuted }]}>{isUnlocked ? 'UNLOCKED' : 'LOCKED'}</Text>
              </Animated.View>
            );
          })}
        </View>

        <Pressable onPress={() => { haptic('warning'); reset(); }} style={({ pressed }) => [styles.resetBtn, { borderColor: colors.error, opacity: pressed ? 0.7 : 1 }]}>
          <RotateCcw size={16} color={colors.errorGlow} />
          <Text style={[styles.resetText, { color: colors.errorGlow }]}>Reset all progress</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  screenSub: { fontSize: 13, marginBottom: 18 },
  progressCard: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 18 },
  progressValue: { fontSize: 28, fontWeight: '800' },
  progressLabel: { fontSize: 13, marginTop: 2 },
  progressBar: { width: '100%', height: 6, borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '48%', flexBasis: '48%', borderWidth: 1, borderRadius: 18, padding: 18, alignItems: 'center', gap: 6 },
  badgeIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  badgeTitle: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  badgeDesc: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  badgeStatus: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 14, marginTop: 28 },
  resetText: { fontSize: 13, fontWeight: '700' },
});
