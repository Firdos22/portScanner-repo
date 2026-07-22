import { StyleSheet, View, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Moon, Sun, Volume2, VolumeX, Vibrate, VibrateOff, Sparkles, Info, Github, LogOut, FileText, ChevronRight, Shield } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/utils/settings';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { AnimatedShield } from '@/components/AnimatedShield';
import { haptic } from '@/utils/haptics';
import { DEVELOPER, DISCLAIMER } from '@/constants/theme';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function SettingsScreen() {
  const { colors, settings, update } = useSettings();
  const { signOut, user } = useAuth();
  const { progress } = useProgress();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { haptic('warning'); signOut(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <CyberBackground />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Settings</Text>
        <Text style={[styles.screenSub, { color: colors.textSecondary }]}>Customize your experience.</Text>

        {user && (
          <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.userAvatar, { backgroundColor: `${colors.primary}1a` }]}>
              <Text style={[styles.userInitial, { color: colors.primaryGlow }]}>{user.email?.[0]?.toUpperCase() ?? 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={[styles.userMeta, { color: colors.textSecondary }]}>Signed in</Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <ToggleRow colors={colors} icon={settings.darkMode ? <Moon size={18} color={colors.primaryGlow} /> : <Sun size={18} color={colors.warning} />} label="Dark Mode" value={settings.darkMode} onToggle={() => { haptic('light'); update({ darkMode: !settings.darkMode }); }} />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FEEDBACK</Text>
        <ToggleRow colors={colors} icon={settings.soundEnabled ? <Volume2 size={18} color={colors.accentGlow} /> : <VolumeX size={18} color={colors.textMuted} />} label="Sound Effects" value={settings.soundEnabled} onToggle={() => { haptic('light'); update({ soundEnabled: !settings.soundEnabled }); }} />
        <ToggleRow colors={colors} icon={settings.hapticsEnabled ? <Vibrate size={18} color={colors.accentGlow} /> : <VibrateOff size={18} color={colors.textMuted} />} label="Haptic Feedback" value={settings.hapticsEnabled} onToggle={() => { haptic('light'); update({ hapticsEnabled: !settings.hapticsEnabled }); }} />
        <ToggleRow colors={colors} icon={settings.animationsEnabled ? <Sparkles size={18} color={colors.accentGlow} /> : <Sparkles size={18} color={colors.textMuted} />} label="Animations" value={settings.animationsEnabled} onToggle={() => { haptic('light'); update({ animationsEnabled: !settings.animationsEnabled }); }} />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TOOLS</Text>
        <NavRow colors={colors} icon={<FileText size={18} color={colors.accentGlow} />} label="Reports" onPress={() => { haptic('light'); router.push('/reports'); }} />
        <NavRow colors={colors} icon={<Info size={18} color={colors.accentGlow} />} label="About" onPress={() => { haptic('light'); router.push('/about'); }} />

        <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.signOutBtn, { borderColor: colors.error, opacity: pressed ? 0.7 : 1 }]}>
          <LogOut size={18} color={colors.errorGlow} />
          <Text style={[styles.signOutText, { color: colors.errorGlow }]}>Sign Out</Text>
        </Pressable>

        <Animated.View entering={FadeIn.springify()} style={[styles.disclaimerBox, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}44` }]}>
          <Shield size={16} color={colors.warning} />
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>{DISCLAIMER}</Text>
        </Animated.View>

        <View style={styles.footer}>
          <AnimatedShield size={48} />
          <Text style={[styles.footerName, { color: colors.textPrimary }]}>{DEVELOPER.name}</Text>
          <Text style={[styles.footerRole, { color: colors.textSecondary }]}>{DEVELOPER.role}</Text>
          <Pressable onPress={() => { haptic('light'); Linking.openURL(DEVELOPER.github); }} style={({ pressed }) => [styles.githubBtn, { borderColor: colors.borderStrong, opacity: pressed ? 0.7 : 1 }]}>
            <Github size={16} color={colors.accentGlow} />
            <Text style={[styles.githubText, { color: colors.accentGlow }]}>{DEVELOPER.github}</Text>
          </Pressable>
          <Text style={[styles.footerCopy, { color: colors.textMuted }]}>© {new Date().getFullYear()} {DEVELOPER.name}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ToggleRow({ colors, icon, label, value, onToggle }: { colors: ReturnType<typeof useSettings>['colors']; icon: React.ReactNode; label: string; value: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
      {icon}
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.toggleTrack, { backgroundColor: value ? colors.primary : colors.border }]}>
        <View style={[styles.toggleThumb, { backgroundColor: '#fff', transform: [{ translateX: value ? 20 : 0 }] }]} />
      </View>
    </Pressable>
  );
}

function NavRow({ colors, icon, label, onPress }: { colors: ReturnType<typeof useSettings>['colors']; icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
      {icon}
      <Text style={styles.rowLabel}>{label}</Text>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  screenSub: { fontSize: 13, marginBottom: 18 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20 },
  userAvatar: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  userInitial: { fontSize: 20, fontWeight: '800' },
  userEmail: { fontSize: 14, fontWeight: '700' },
  userMeta: { fontSize: 12, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 18, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 14, marginTop: 24 },
  signOutText: { fontSize: 14, fontWeight: '700' },
  disclaimerBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 20 },
  disclaimerText: { fontSize: 11, lineHeight: 17, flex: 1 },
  footer: { alignItems: 'center', gap: 6, marginTop: 32 },
  footerName: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  footerRole: { fontSize: 12, textAlign: 'center' },
  githubBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginTop: 10 },
  githubText: { fontSize: 12, fontWeight: '700' },
  footerCopy: { fontSize: 11, marginTop: 12 },
});
