import { useMemo, useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Radar, Eraser, ClipboardPaste, Search, X, CircleAlert, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/utils/settings';
import { useProgress } from '@/context/ProgressContext';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { RadarSweep } from '@/components/RadarSweep';
import { PortCard } from '@/components/PortCard';
import { validateIPAddress, simulateScan, searchPorts, filterPorts, sortPorts, type ScanResult, type FilterType } from '@/utils/scanner';
import { haptic } from '@/utils/haptics';
import { playSound } from '@/utils/audio';

const SCAN_STEPS = ['Initializing Scanner…', 'Checking Target…', 'Scanning Ports…', 'Analyzing Services…', 'Generating Report…'];
const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'open', label: 'Open' }, { key: 'closed', label: 'Closed' },
  { key: 'tcp', label: 'TCP' }, { key: 'udp', label: 'UDP' }, { key: 'favorites', label: 'Favorites' },
];

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, settings } = useSettings();
  const { progress, toggleFavorite, recordScan, recordViewedPort } = useProgress();

  const [ip, setIp] = useState('192.168.1.10');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(progress.lastScan);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const favorites = useMemo(() => new Set(progress.favorites), [progress.favorites]);
  const visiblePorts = useMemo(() => {
    if (!result) return [];
    return sortPorts(filterPorts(filter, searchPorts(query, result.ports), favorites));
  }, [result, query, filter, favorites]);

  const startScan = async () => {
    haptic('medium');
    setError(null);
    if (!validateIPAddress(ip)) { setError('Enter a valid IPv4 address, e.g. 192.168.1.10'); haptic('error'); return; }
    setScanning(true);
    setStepIndex(0);
    setResult(null);
    playSound('scan', settings.soundEnabled);
    const stepTimer = setInterval(() => { setStepIndex((i) => Math.min(i + 1, SCAN_STEPS.length - 1)); }, 440);
    const res = await simulateScan(ip);
    clearInterval(stepTimer);
    setStepIndex(SCAN_STEPS.length - 1);
    setScanning(false);
    setResult(res);
    recordScan(res);
    playSound('complete', settings.soundEnabled);
    haptic('success');
  };

  const clearAll = () => { haptic('light'); setIp(''); setError(null); setResult(null); setQuery(''); setFilter('all'); };
  const pasteIP = () => { haptic('light'); setIp('192.168.1.10'); };
  const openPort = (port: number) => { haptic('light'); recordViewedPort(port); router.push(`/port/${port}`); };

  return (
    <View style={styles.container}>
      <CyberBackground />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Scanner</Text>
        <Text style={[styles.screenSub, { color: colors.textSecondary }]}>Enter a target IP to simulate a port scan.</Text>

        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border }]}>
          <Radar size={18} color={colors.primaryGlow} />
          <TextInput style={[styles.input, { color: colors.textPrimary }]} placeholder="192.168.1.10" placeholderTextColor={colors.textMuted} value={ip} onChangeText={setIp} autoCapitalize="none" autoCorrect={false} keyboardType="decimal-pad" />
          {ip.length > 0 && <Pressable onPress={() => setIp('')} hitSlop={10}><X size={16} color={colors.textMuted} /></Pressable>}
        </View>

        {error && (
          <Animated.View entering={FadeIn.springify()} style={[styles.errorRow, { backgroundColor: `${colors.error}18`, borderColor: `${colors.error}55` }]}>
            <CircleAlert size={15} color={colors.errorGlow} />
            <Text style={[styles.errorText, { color: colors.errorGlow }]}>{error}</Text>
          </Animated.View>
        )}

        <View style={styles.btnRow}>
          <Pressable onPress={startScan} disabled={scanning} style={({ pressed }) => [styles.scanBtnWrap, { opacity: scanning ? 0.8 : pressed ? 0.92 : 1 }]}>
            <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scanBtnInner}>
              {scanning ? <ActivityIndicator size="small" color="#fff" /> : <Radar size={18} color="#fff" />}
              <Text style={styles.scanBtnText}>{scanning ? 'Scanning…' : 'Scan'}</Text>
            </LinearGradient>
          </Pressable>
          <SecondaryButton colors={colors} label="Clear" icon={<Eraser size={16} color={colors.textSecondary} />} onPress={clearAll} />
          <SecondaryButton colors={colors} label="Paste" icon={<ClipboardPaste size={16} color={colors.textSecondary} />} onPress={pasteIP} />
        </View>

        {scanning && (
          <Animated.View entering={FadeIn.springify()} exiting={FadeOut} style={[styles.scanPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.radarWrap}><RadarSweep size={200} /></View>
            <View style={styles.steps}>
              {SCAN_STEPS.map((s, i) => (
                <View key={s} style={[styles.stepRow, { opacity: i <= stepIndex ? 1 : 0.4 }]}>
                  <View style={[styles.stepDot, { backgroundColor: i < stepIndex ? colors.success : i === stepIndex ? colors.accentGlow : colors.textMuted }]} />
                  <Text style={[styles.stepText, { color: i <= stepIndex ? colors.textPrimary : colors.textMuted }]}>{s}</Text>
                  {i === stepIndex && <ActivityIndicator size="small" color={colors.accentGlow} style={{ marginLeft: 6 }} />}
                </View>
              ))}
            </View>
            <Text style={[styles.scanTarget, { color: colors.textSecondary }]}>Target: {ip}</Text>
          </Animated.View>
        )}

        {result && !scanning && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Results · {result.ip}</Text>
              <Pressable onPress={startScan} style={({ pressed }) => [styles.replay, { borderColor: colors.borderStrong, opacity: pressed ? 0.7 : 1 }]}>
                <RefreshCw size={14} color={colors.primaryGlow} />
                <Text style={[styles.replayText, { color: colors.primaryGlow }]}>Rescan</Text>
              </Pressable>
            </View>

            <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search size={16} color={colors.textMuted} />
              <TextInput style={[styles.searchInput, { color: colors.textPrimary }]} placeholder="Search port, service, protocol…" placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} />
              {query.length > 0 && <Pressable onPress={() => setQuery('')} hitSlop={10}><X size={14} color={colors.textMuted} /></Pressable>}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
              {FILTERS.map((f) => (
                <Pressable key={f.key} onPress={() => { haptic('light'); setFilter(f.key); }} style={[styles.filterChip, filter === f.key ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: filter === f.key ? '#fff' : colors.textSecondary }}>{f.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <FlatList
              data={visiblePorts} keyExtractor={(item) => String(item.port)} scrollEnabled={false} contentContainerStyle={{ paddingBottom: 8 }}
              ListEmptyComponent={<View style={styles.emptyState}><Text style={[styles.emptyText, { color: colors.textMuted }]}>No ports match your search or filter.</Text></View>}
              renderItem={({ item, index }) => <PortCard port={item} index={index} isFavorite={favorites.has(item.port)} onPress={() => openPort(item.port)} onToggleFavorite={() => { haptic('light'); toggleFavorite(item.port); }} />}
            />
          </Animated.View>
        )}

        {!result && !scanning && (
          <View style={[styles.placeholder, { borderColor: colors.border }]}>
            <Radar size={40} color={colors.textMuted} />
            <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Run a scan to see simulated results.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SecondaryButton({ colors, label, icon, onPress }: { colors: ReturnType<typeof useSettings>['colors']; label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
      {icon}<Text style={[styles.secondaryText, { color: colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  screenSub: { fontSize: 13, marginBottom: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, fontWeight: '600', letterSpacing: 0.4 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12 },
  errorText: { fontSize: 13, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 8 },
  scanBtnWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  scanBtnInner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 15 },
  scanBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
  secondaryText: { fontSize: 13, fontWeight: '600' },
  scanPanel: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 16, gap: 18 },
  radarWrap: { marginBottom: 4 },
  steps: { width: '100%', gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepText: { fontSize: 13, fontWeight: '600' },
  scanTarget: { fontSize: 12, fontWeight: '600' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  resultsTitle: { fontSize: 17, fontWeight: '700' },
  replay: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  replayText: { fontSize: 12, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  filterRow: { marginBottom: 16 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  placeholder: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 18, paddingVertical: 48, alignItems: 'center', gap: 12, marginTop: 24 },
  placeholderText: { fontSize: 13 },
});
