import { StyleSheet, View, ScrollView, Pressable, Linking } from 'react-native';
import { ArrowLeft, Github, Shield, BookOpen, Code, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/utils/settings';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { AnimatedShield } from '@/components/AnimatedShield';
import { haptic } from '@/utils/haptics';
import { DEVELOPER, DISCLAIMER } from '@/constants/theme';

export default function AboutScreen() {
  const { colors } = useSettings();
  const insets = useSafeAreaInsets();

  const features = [
    { icon: <Shield size={18} color={colors.accentGlow} />, title: 'Educational Simulator', desc: 'Simulates port scanning with predefined data — never performs real network scanning.' },
    { icon: <BookOpen size={18} color={colors.accentGlow} />, title: 'Learn Networking', desc: 'Explore ports, protocols, TCP vs UDP, and common security risks interactively.' },
    { icon: <Lock size={18} color={colors.accentGlow} />, title: 'Security Awareness', desc: 'Understand attack surfaces and mitigation best practices for common ports.' },
    { icon: <Code size={18} color={colors.accentGlow} />, title: 'Modern Stack', desc: 'Built with React Native, Expo, Reanimated, and Supabase auth.' },
  ];

  return (
    <View style={styles.container}>
      <CyberBackground />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => { haptic('light'); }} hitSlop={12}><ArrowLeft size={22} color={colors.textSecondary} /></Pressable>
          <Text style={styles.headerTitle}>About</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.hero}>
          <AnimatedShield size={80} />
          <Text style={styles.appName}>Port Scanner Dashboard</Text>
          <Text style={[styles.appTagline, { color: colors.textSecondary }]}>Educational Network Port Scanner Simulator</Text>
        </View>

        <View style={[styles.disclaimerBox, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}44` }]}>
          <Shield size={18} color={colors.warning} />
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>{DISCLAIMER}</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FEATURES</Text>
        {features.map((f) => (
          <View key={f.title} style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.featureIcon, { backgroundColor: `${colors.accent}1a` }]}>{f.icon}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.desc}</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DEVELOPER</Text>
        <View style={[styles.devCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.devAvatar, { backgroundColor: `${colors.primary}1a` }]}>
            <Text style={[styles.devInitial, { color: colors.primaryGlow }]}>F</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.devName}>{DEVELOPER.name}</Text>
            <Text style={[styles.devRole, { color: colors.textSecondary }]}>{DEVELOPER.role}</Text>
          </View>
        </View>
        <Pressable onPress={() => { haptic('light'); Linking.openURL(DEVELOPER.github); }} style={({ pressed }) => [styles.githubBtn, { borderColor: colors.borderStrong, opacity: pressed ? 0.7 : 1 }]}>
          <Github size={18} color={colors.accentGlow} />
          <Text style={[styles.githubText, { color: colors.accentGlow }]}>{DEVELOPER.github}</Text>
        </Pressable>

        <Text style={[styles.footerCopy, { color: colors.textMuted }]}>© {new Date().getFullYear()} {DEVELOPER.name}. All rights reserved.</Text>
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>Built for educational and portfolio purposes.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  hero: { alignItems: 'center', gap: 8, marginVertical: 24 },
  appName: { fontSize: 22, fontWeight: '800' },
  appTagline: { fontSize: 13, textAlign: 'center' },
  disclaimerBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 20 },
  disclaimerText: { fontSize: 12, lineHeight: 18, flex: 1 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 16, marginBottom: 10 },
  featureCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 10 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureTitle: { fontSize: 14, fontWeight: '700' },
  featureDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  devCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, padding: 16 },
  devAvatar: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  devInitial: { fontSize: 22, fontWeight: '800' },
  devName: { fontSize: 16, fontWeight: '800' },
  devRole: { fontSize: 12, marginTop: 2 },
  githubBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 13, marginTop: 10 },
  githubText: { fontSize: 13, fontWeight: '700' },
  footerCopy: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 28 },
  footerNote: { fontSize: 11, textAlign: 'center', marginTop: 4 },
});
