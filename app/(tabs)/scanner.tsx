import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Radar, Eraser, Search, X, CircleAlert, RefreshCw, Square, Zap, ListChecks, Layers, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/utils/settings';
import { useProgress } from '@/context/ProgressContext';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { RadarSweep } from '@/components/RadarSweep';
import { PortCard } from '@/components/PortCard';
import {
  validateHost,
  performRealScan,
  searchPorts,
  filterPorts,
  sortPorts,
  type ScanResult,
  type ScanProgress,
  type FilterType,
  type ScanProfile,
  type ScannedPort,
} from '@/utils/scanner';
import { haptic } from '@/utils/haptics';
import { playSound } from '@/utils/audio';

const PROFILES: { key: ScanProfile; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'quick', label: 'Quick', desc: '8 key ports', icon: <Zap size={14} color="#fff" /> },
  { key: 'common', label: 'Common', desc: '28 well-known', icon: <ListChecks size={14} color="#fff" /> },
  { key: 'top100', label: 'Top 100', desc: 'Nmap top 100', icon: <Layers size={14} color="#fff" /> },
];

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
  { key: 'filtered', label: 'Filtered' },
  { key: 'tcp', label: 'TCP' },
  { key: 'favorites', label: 'Favorites' },
];

const SCAN_STEPS = ['Connecting to target…', 'Scanning ports…', 'Analyzing responses…', 'Compiling results…'];

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, settings } = useSettings();
  const { progress, toggleFavorite, recordScan, recordViewedPort } = useProgress();

  const [host, setHost] = useState('scanme.nmap.org');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(progress.lastScan);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [profile, setProfile] = useState<ScanProfile>('common');
  const [liveProgress, setLiveProgress] = useState<ScanProgress | null>(null);
  const [livePorts, setLivePorts] = useState<ScannedPort[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const favorites = useMemo(() => new Set(progress.favorites), [progress.favorites]);
  const visiblePorts = useMemo(() => {
    if (!result) return [];
    return sortPorts(filterPorts(filter, searchPorts(query, result.ports), favorites));
  }, [result, query, filter, favorites]);

  const startScan = useCallback(async () => {
    haptic('medium');
    setError(null);
    if (!validateHost(host)) {
      setError('Enter a valid IP address or hostname (e.g. scanme.nmap.org or 192.168.1.1)');
      haptic('error');
      return;
    }

    setScanning(true);
    setStepIndex(0);
    setResult(null);
    setLivePorts([]);
    setLiveProgress(null);
    playSound('scan', settings.soundEnabled);

    abortControllerRef.current = new AbortController();

    const stepTimer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, SCAN_STEPS.length - 1));
    }, 800);

    const scanResult = await performRealScan(
      host,
      profile,
      {
        onStart: (_h, total) => {
          setStepIndex(1);
          setLiveProgress({ port: 0, status: 'open', service: '', scanned: 0, total });
        },
        onPort: (p) => {
          setLiveProgress(p);
          setLivePorts((prev) => [...prev, { port: p.port, status: p.status, service: p.service, protocol: 'TCP' }]);
          setStepIndex(2);
        },
        onComplete: (res) => {
          clearInterval(stepTimer);
          setStepIndex(SCAN_STEPS.length - 1);
          setScanning(false);
          setResult(res);
          recordScan(res);
          setLivePorts([]);
          setLiveProgress(null);
          playSound('complete', settings.soundEnabled);
          haptic('success');
        },
        onError: (msg) => {
          clearInterval(stepTimer);
          setScanning(false);
          setLivePorts([]);
          setLiveProgress(null);
          setError(msg);
          haptic('error');
        },
        onCancelled: () => {
          clearInterval(stepTimer);
          setScanning(false);
          setLivePorts([]);
          setLiveProgress(null);
          haptic('light');
        },
      },
      abortControllerRef.current.signal,
    );

    clearInterval(stepTimer);
    if (!scanResult) setScanning(false);
  }, [host, profile, settings.soundEnabled, recordScan]);

  const cancelScan = useCallback(() => {
    haptic('light');
    abortControllerRef.current?.abort();
  }, []);

  const clearAll = () => {
    haptic('light');
    setHost('');
    setError(null);
    setResult(null);
    setQuery('');
    setFilter('all');
    setLivePorts([]);
    setLiveProgress(null);
  };

  const openPort = (port: number) => {
    haptic('light');
    recordViewedPort(port);
    router.push(`/port/${port}`);
  };

  const progressPct = liveProgress ? Math.round((liveProgress.scanned / liveProgress.total) * 100) : 0;

  // Show live ports during scanning, or final result after completion
  const displayPorts = scanning ? sortPorts(livePorts) : visiblePorts;

  return (
    <View style={styles.container}>
      <CyberBackground />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Scanner</Text>
        <Text style={[styles.screenSub, { color: colors.textSecondary }]}>Real TCP port scan — authorized targets only.</Text>

        {/* Host input */}
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border }]}>
          <Radar size={18} color={colors.primaryGlow} />
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="scanme.nmap.org or 192.168.1.1"
            placeholderTextColor={colors.textMuted}
            value={host}
            onChangeText={setHost}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {host.length > 0 && <Pressable onPress={() => setHost('')} hitSlop={10}><X size={16} color={colors.textMuted} /></Pressable>}
        </View>

        {error && (
          <Animated.View entering={FadeIn.springify()} style={[styles.errorRow, { backgroundColor: `${colors.error}18`, borderColor: `${colors.error}55` }]}>
            <CircleAlert size={15} color={colors.errorGlow} />
            <Text style={[styles.errorText, { color: colors.errorGlow }]}>{error}</Text>
          </Animated.View>
        )}

        {/* Scan profile selector */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SCAN PROFILE</Text>
        <View style={styles.profileRow}>
          {PROFILES.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => { haptic('light'); setProfile(p.key); }}
              style={({ pressed }) => [
                styles.profileChip,
                profile === p.key
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              {p.icon}
              <View style={styles.profileText}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: profile === p.key ? '#fff' : colors.textPrimary }}>{p.label}</Text>
                <Text style={{ fontSize: 9, fontWeight: '500', color: profile === p.key ? 'rgba(255,255,255,0.7)' : colors.textMuted }}>{p.desc}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.btnRow}>
          {scanning ? (
            <Pressable onPress={cancelScan} style={({ pressed }) => [styles.cancelBtnWrap, { opacity: pressed ? 0.85 : 1 }]}>
              <View style={[styles.cancelBtnInner, { backgroundColor: colors.error }]}>
                <Square size={16} color="#fff" />
                <Text style={styles.cancelBtnText}>Cancel Scan</Text>
              </View>
            </Pressable>
          ) : (
            <Pressable onPress={startScan} disabled={scanning} style={({ pressed }) => [styles.scanBtnWrap, { opacity: pressed ? 0.92 : 1 }]}>
              <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scanBtnInner}>
                <Radar size={18} color="#fff" />
                <Text style={styles.scanBtnText}>Start Scan</Text>
              </LinearGradient>
            </Pressable>
          )}
          <SecondaryButton colors={colors} label="Clear" icon={<Eraser size={16} color={colors.textSecondary} />} onPress={clearAll} />
        </View>

        {/* Scanning progress */}
        {scanning && (
          <Animated.View entering={FadeIn.springify()} exiting={FadeOut} style={[styles.scanPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.radarWrap}><RadarSweep size={180} /></View>

            {/* Progress bar */}
            {liveProgress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                    {liveProgress.scanned} / {liveProgress.total} ports
                  </Text>
                  <Text style={[styles.progressPct, { color: colors.accentGlow }]}>{progressPct}%</Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: `${colors.border}` }]}>
                  <Animated.View
                    style={[styles.progressFill, { backgroundColor: colors.accent, width: `${progressPct}%` }]}
                  />
                </View>
              </View>
            )}

            {/* Steps */}
            <View style={styles.steps}>
              {SCAN_STEPS.map((s, i) => (
                <View key={s} style={[styles.stepRow, { opacity: i <= stepIndex ? 1 : 0.4 }]}>
                  <View style={[styles.stepDot, { backgroundColor: i < stepIndex ? colors.success : i === stepIndex ? colors.accentGlow : colors.textMuted }]} />
                  <Text style={[styles.stepText, { color: i <= stepIndex ? colors.textPrimary : colors.textMuted }]}>{s}</Text>
                  {i === stepIndex && <ActivityIndicator size="small" color={colors.accentGlow} style={{ marginLeft: 6 }} />}
                </View>
              ))}
            </View>

            <Text style={[styles.scanTarget, { color: colors.textSecondary }]}>Target: {host} · Profile: {profile}</Text>

            {/* Live results */}
            {livePorts.length > 0 && (
              <View style={styles.liveResults}>
                <Text style={[styles.liveTitle, { color: colors.textSecondary }]}>LIVE RESULTS ({livePorts.length})</Text>
                <ScrollView style={styles.liveScroll} nestedScrollEnabled>
                  {sortPorts(livePorts).map((p) => (
                    <LivePortRow key={p.port} port={p} colors={colors} />
                  ))}
                </ScrollView>
              </View>
            )}
          </Animated.View>
        )}

        {/* Final results */}
        {result && !scanning && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Results · {result.host}</Text>
              <Pressable onPress={startScan} style={({ pressed }) => [styles.replay, { borderColor: colors.borderStrong, opacity: pressed ? 0.7 : 1 }]}>
                <RefreshCw size={14} color={colors.primaryGlow} />
                <Text style={[styles.replayText, { color: colors.primaryGlow }]}>Rescan</Text>
              </Pressable>
            </View>

            {/* Summary chips */}
            <View style={styles.summaryRow}>
              <SummaryChip colors={colors} label="Open" value={result.openCount} bg={colors.success} glow={colors.successGlow} />
              <SummaryChip colors={colors} label="Closed" value={result.closedCount} bg={colors.error} glow={colors.errorGlow} />
              <SummaryChip colors={colors} label="Filtered" value={result.filteredCount} bg={colors.warning} glow={colors.warning} />
            </View>

            {/* Search + filters */}
            <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search port, service…"
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 && <Pressable onPress={() => setQuery('')} hitSlop={10}><X size={14} color={colors.textMuted} /></Pressable>}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => { haptic('light'); setFilter(f.key); }}
                  style={[styles.filterChip, filter === f.key ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: filter === f.key ? '#fff' : colors.textSecondary }}>{f.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <FlatList
              data={displayPorts}
              keyExtractor={(item) => String(item.port)}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 8 }}
              ListEmptyComponent={<View style={styles.emptyState}><Text style={[styles.emptyText, { color: colors.textMuted }]}>No ports match your search or filter.</Text></View>}
              renderItem={({ item, index }) => (
                <PortCard
                  port={item}
                  index={index}
                  isFavorite={favorites.has(item.port)}
                  onPress={() => openPort(item.port)}
                  onToggleFavorite={() => { haptic('light'); toggleFavorite(item.port); }}
                />
              )}
            />
          </Animated.View>
        )}

        {!result && !scanning && (
          <View style={[styles.placeholder, { borderColor: colors.border }]}>
            <Radar size={40} color={colors.textMuted} />
            <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Enter a target and start a real scan.</Text>
            <View style={[styles.authBanner, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}44` }]}>
              <Globe size={14} color={colors.warning} />
              <Text style={[styles.authText, { color: colors.textSecondary }]}>Only scan systems you own or have permission to test. Try scanme.nmap.org for practice.</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function LivePortRow({ port, colors }: { port: ScannedPort; colors: ReturnType<typeof useSettings>['colors'] }) {
  const glow = port.status === 'open' ? colors.successGlow : port.status === 'closed' ? colors.errorGlow : colors.warning;
  return (
    <View style={styles.liveRow}>
      <View style={[styles.liveDot, { backgroundColor: glow }]} />
      <Text style={[styles.livePort, { color: colors.textPrimary }]}>{port.port}/TCP</Text>
      <Text style={[styles.liveService, { color: colors.textSecondary }]}>{port.service}</Text>
      <Text style={[styles.liveStatus, { color: glow }]}>{port.status.toUpperCase()}</Text>
    </View>
  );
}

function SummaryChip({ colors, label, value, bg, glow }: { colors: ReturnType<typeof useSettings>['colors']; label: string; value: number; bg: string; glow: string }) {
  return (
    <View style={[styles.summaryChip, { backgroundColor: `${bg}14`, borderColor: `${bg}44` }]}>
      <Text style={[styles.summaryValue, { color: glow }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function SecondaryButton({ colors, label, icon, onPress }: { colors: ReturnType<typeof useSettings>['colors']; label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
      {icon}
      <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  screenSub: { fontSize: 13, marginBottom: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, fontWeight: '600' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12 },
  errorText: { fontSize: 13, fontWeight: '600', flex: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 },
  profileRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  profileChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  profileText: { gap: 1 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  scanBtnWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  scanBtnInner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 15 },
  scanBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtnWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  cancelBtnInner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 15, borderRadius: 14 },
  cancelBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
  secondaryText: { fontSize: 13, fontWeight: '600' },
  scanPanel: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 16, gap: 16 },
  radarWrap: { marginBottom: 4 },
  progressContainer: { width: '100%', gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressPct: { fontSize: 14, fontWeight: '800' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  steps: { width: '100%', gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepText: { fontSize: 13, fontWeight: '600' },
  scanTarget: { fontSize: 12, fontWeight: '600' },
  liveResults: { width: '100%', marginTop: 4 },
  liveTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  liveScroll: { maxHeight: 200 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: 'rgba(80,120,220,0.15)' },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  livePort: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace', width: 70 },
  liveService: { fontSize: 12, flex: 1 },
  liveStatus: { fontSize: 10, fontWeight: '800' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  resultsTitle: { fontSize: 17, fontWeight: '700' },
  replay: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  replayText: { fontSize: 12, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryChip: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  filterRow: { marginBottom: 16 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  placeholder: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 18, paddingVertical: 48, alignItems: 'center', gap: 12, marginTop: 24 },
  placeholderText: { fontSize: 13 },
  authBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8, marginHorizontal: 16 },
  authText: { fontSize: 11, lineHeight: 16, flex: 1 },
});
