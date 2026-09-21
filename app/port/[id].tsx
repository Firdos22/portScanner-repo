import { useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Globe, Target, ListChecks, ShieldAlert, Swords, ShieldCheck, Lightbulb, GraduationCap, ExternalLink } from 'lucide-react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/utils/settings';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { StatusBadge } from '@/components/StatusBadge';
import { getIcon } from '@/utils/iconMap';
import { PORTS } from '@/data/ports';
import { haptic } from '@/utils/haptics';
import { DEVELOPER } from '@/constants/theme';

export default function PortDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, settings } = useSettings();
  const { isFavorite, toggleFavorite, recordViewedPort } = useProgress();
  const { user } = useAuth();

  const port = useMemo(() => PORTS.find((p) => String(p.port) === String(id)), [id]);

  useEffect(() => {
    if (port) {
      recordViewedPort(port.port);
    }
  }, [port, recordViewedPort]);

  if (!port) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <CyberBackground />
        <Text style={{ fontSize: 16 }}>Port not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primaryGlow, fontWeight: '700' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const Icon = getIcon(port.icon);
  const fav = isFavorite(port.port);
  const glow = port.status === 'open' ? colors.successGlow : port.status === 'closed' ? colors.errorGlow : colors.warning;

  const sections: { icon: React.ReactNode; title: string; items: string[] }[] = [
    { icon: <Target size={16} color={colors.accentGlow} />, title: 'Purpose', items: [port.purpose] },
    { icon: <ListChecks size={16} color={colors.accentGlow} />, title: 'Common Uses', items: port.commonUses },
    { icon: <ShieldAlert size={16} color={colors.errorGlow} />, title: 'Security Risks', items: port.securityRisks },
    { icon: <Swords size={16} color={colors.errorGlow} />, title: 'Attack Examples', items: port.attackExamples },
    { icon: <ShieldCheck size={16} color={colors.successGlow} />, title: 'Best Practices', items: port.bestPractices },
  ];

  return (
    <View style={styles.container}>
      <CyberBackground />
      <Animated.View
        entering={settings.animationsEnabled ? SlideInDown.springify() : undefined}
        style={[styles.sheet, { backgroundColor: colors.bgElevated, borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}
      >
        <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />

        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => { haptic('light'); router.back(); }} hitSlop={12}>
            <ArrowLeft size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>Port Details</Text>
          <Pressable onPress={() => { haptic('light'); toggleFavorite(port.port); }} hitSlop={12}>
            <Heart size={20} color={fav ? colors.error : colors.textMuted} fill={fav ? colors.error : 'transparent'} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: `${glow}44` }]}>
            <View style={styles.heroRow}>
              <View style={[styles.heroIcon, { backgroundColor: `${glow}1a`, borderColor: `${glow}55` }]}>
                <Icon size={30} color={glow} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroService}>{port.service}</Text>
                <Text style={[styles.heroPort, { color: colors.textSecondary }]}>Port {port.port} · {port.protocol}</Text>
              </View>
              <StatusBadge status={port.status} />
            </View>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>{port.description}</Text>
          </View>

          {sections.map((s) => (
            <DetailSection key={s.title} colors={colors} icon={s.icon} title={s.title} items={s.items} />
          ))}

          <DetailSection colors={colors} icon={<Lightbulb size={16} color={colors.warning} />} title="Recommendation" items={[port.recommendations]} />

          <DetailSection colors={colors} icon={<GraduationCap size={16} color={colors.accentGlow} />} title="Educational Notes" items={[port.educationalNotes]} />

          <View style={[styles.eduBanner, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}44` }]}>
            <Globe size={16} color={colors.warning} />
            <Text style={[styles.eduBannerText, { color: colors.textSecondary }]}>
              Learn more about {port.service} from trusted cybersecurity resources online.
            </Text>
          </View>

          <Pressable
            onPress={() => { haptic('light'); Linking.openURL(`https://en.wikipedia.org/wiki/${port.service}`); }}
            style={({ pressed }) => [styles.wikiBtn, { borderColor: colors.borderStrong, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.wikiText, { color: colors.primaryGlow }]}>Read Wikipedia article</Text>
            <ExternalLink size={15} color={colors.primaryGlow} />
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Designed & Developed by {DEVELOPER.name}
            </Text>
            <Pressable onPress={() => { haptic('light'); Linking.openURL(DEVELOPER.github); }}>
              <Text style={[styles.footerLink, { color: colors.accentGlow }]}>{DEVELOPER.github}</Text>
            </Pressable>
            <Text style={[styles.footerCopy, { color: colors.textMuted }]}>© {new Date().getFullYear()} {DEVELOPER.name}. Real TCP port scanner.</Text>
          </View>
          {user && <Text style={[styles.signedInAs, { color: colors.textMuted }]}>Signed in as {user.email}</Text>}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function DetailSection({ colors, icon, title, items }: { colors: ReturnType<typeof useSettings>['colors']; icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map((it, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={[styles.bullet, { backgroundColor: colors.accent }]} />
          <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  sheet: { flex: 1, overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8, opacity: 0.5 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  heroCard: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  heroIcon: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  heroService: { fontSize: 22, fontWeight: '800' },
  heroPort: { fontSize: 13, marginTop: 2 },
  heroDesc: { fontSize: 13, lineHeight: 20 },
  sectionCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 7 },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  bulletText: { fontSize: 13, lineHeight: 19, flex: 1 },
  eduBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  eduBannerText: { fontSize: 12, lineHeight: 18, flex: 1 },
  wikiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 13, marginBottom: 24 },
  wikiText: { fontSize: 13, fontWeight: '700' },
  footer: { alignItems: 'center', gap: 4, marginTop: 8 },
  footerText: { fontSize: 12, fontWeight: '600' },
  footerLink: { fontSize: 12, fontWeight: '700' },
  footerCopy: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  signedInAs: { fontSize: 10, marginTop: 12 },
});
