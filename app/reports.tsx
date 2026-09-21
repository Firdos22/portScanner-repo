import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Share } from 'react-native';
import { ArrowLeft, FileText, FileJson, Share2, Download } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/utils/settings';
import { useProgress } from '@/context/ProgressContext';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { generateReport, generateJSON, calculateStatistics } from '@/utils/scanner';
import { haptic } from '@/utils/haptics';

export default function ReportsScreen() {
  const { colors } = useSettings();
  const insets = useSafeAreaInsets();
  const { progress, recordReport } = useProgress();
  const last = progress.lastScan;
  const [format, setFormat] = useState<'text' | 'json'>('text');
  const stats = last ? calculateStatistics(last) : null;
  const content = last ? (format === 'text' ? generateReport(last) : generateJSON(last)) : '';

  const handleShare = async () => {
    if (!last) return;
    haptic('light');
    try {
      await Share.share({ message: content, title: 'Port Scanner Dashboard Report' });
      recordReport();
    } catch { /* ignore */ }
  };

  const handleExport = () => {
    haptic('success');
    recordReport();
  };

  return (
    <View style={styles.container}>
      <CyberBackground />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20 }}>
        <View style={styles.header}>
          <Pressable onPress={() => { haptic('light'); }} hitSlop={12}><ArrowLeft size={22} color={colors.textSecondary} onPress={() => {}} /></Pressable>
          <Text style={styles.headerTitle}>Reports</Text>
          <View style={{ width: 22 }} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {!last ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <FileText size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Run a scan first to generate a report.</Text>
          </View>
        ) : (
          <>
            {stats && (
              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.summaryTitle}>Scan Summary</Text>
                <View style={styles.summaryGrid}>
                  <SummaryItem colors={colors} label="Target" value={stats.host} />
                </View>
              </View>
            )}

            <View style={styles.formatRow}>
              <FormatChip colors={colors} label="Text" active={format === 'text'} onPress={() => { haptic('light'); setFormat('text'); }} icon={<FileText size={14} color={format === 'text' ? '#fff' : colors.textSecondary} />} />
              <FormatChip colors={colors} label="JSON" active={format === 'json'} onPress={() => { haptic('light'); setFormat('json'); }} icon={<FileJson size={14} color={format === 'json' ? '#fff' : colors.textSecondary} />} />
            </View>

            <View style={[styles.reportBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView nestedScrollEnabled style={styles.reportScroll}>
                <Text style={[styles.reportText, { color: colors.textSecondary }]}>{content}</Text>
              </ScrollView>
            </View>

            <View style={styles.actionRow}>
              <Pressable onPress={handleExport} style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
                <Download size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Export</Text>
              </Pressable>
              <Pressable onPress={handleShare} style={({ pressed }) => [styles.actionBtn, { borderColor: colors.borderStrong, borderWidth: 1, opacity: pressed ? 0.85 : 1 }]}>
                <Share2 size={16} color={colors.primaryGlow} />
                <Text style={[styles.actionBtnText, { color: colors.primaryGlow }]}>Share</Text>
              </Pressable>
            </View>

            <Text style={[styles.note, { color: colors.textMuted }]}>
              Reports include target host, open/closed/filtered ports, and scan statistics. Only scan systems you own or have permission to test.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryItem({ colors, label, value }: { colors: ReturnType<typeof useSettings>['colors']; label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryItemLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={styles.summaryItemValue}>{value}</Text>
    </View>
  );
}

function FormatChip({ colors, label, active, onPress, icon }: { colors: ReturnType<typeof useSettings>['colors']; label: string; active: boolean; onPress: () => void; icon: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} style={[styles.formatChip, active ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {icon}
      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : colors.textSecondary }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 18, paddingVertical: 56, alignItems: 'center', gap: 12, marginTop: 24 },
  emptyText: { fontSize: 13 },
  summaryCard: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 16 },
  summaryTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  summaryItem: { width: '30%', flexBasis: '30%' },
  summaryItemLabel: { fontSize: 11, fontWeight: '600' },
  summaryItemValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  formatRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  formatChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  reportBox: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16, maxHeight: 360 },
  reportScroll: { maxHeight: 320 },
  reportText: { fontSize: 11, lineHeight: 17, fontFamily: 'monospace' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  note: { fontSize: 11, lineHeight: 17 },
});
