import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Library, HelpCircle, ChevronRight, Check, X, RotateCcw, Trophy } from 'lucide-react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/utils/settings';
import { useProgress } from '@/context/ProgressContext';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { LEARN_TOPICS, QUIZ_QUESTIONS, PORTS } from '@/data/ports';
import { getIcon } from '@/utils/iconMap';
import { haptic } from '@/utils/haptics';

type Section = 'concepts' | 'library' | 'quiz';

export default function LearnScreen() {
  const { colors, settings } = useSettings();
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<Section>('concepts');

  const tabs: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'concepts', label: 'Concepts', icon: <BookOpen size={15} color={colors.primaryGlow} /> },
    { key: 'library', label: 'Port Library', icon: <Library size={15} color={colors.primaryGlow} /> },
    { key: 'quiz', label: 'Quiz', icon: <HelpCircle size={15} color={colors.primaryGlow} /> },
  ];

  return (
    <View style={styles.container}>
      <CyberBackground />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Learn</Text>
        <Text style={[styles.screenSub, { color: colors.textSecondary }]}>Networking & port scanning concepts, explained visually.</Text>

        <View style={styles.segmentRow}>
          {tabs.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => { haptic('light'); setSection(t.key); }}
              style={[
                styles.segment,
                section === t.key
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {t.icon}
              <Text style={{ fontSize: 12, fontWeight: '700', color: section === t.key ? '#fff' : colors.textSecondary }}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {section === 'concepts' && <ConceptsSection colors={colors} settings={settings} />}
        {section === 'library' && <LibrarySection colors={colors} settings={settings} />}
        {section === 'quiz' && <QuizSection colors={colors} settings={settings} />}
      </ScrollView>
    </View>
  );
}

function ConceptsSection({ colors, settings }: { colors: ReturnType<typeof useSettings>['colors']; settings: ReturnType<typeof useSettings>['settings'] }) {
  return (
    <View style={styles.listWrap}>
      {LEARN_TOPICS.map((topic, i) => {
        const Icon = getIcon(topic.icon);
        return (
          <Animated.View key={topic.id} entering={settings.animationsEnabled ? FadeInDown.delay(i * 60).springify() : undefined}>
            <View style={[styles.topicCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.topicHeader}>
                <View style={[styles.topicIcon, { backgroundColor: `${colors.primary}1a` }]}>
                  <Icon size={20} color={colors.primaryGlow} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={[styles.topicSummary, { color: colors.textSecondary }]}>{topic.summary}</Text>
                </View>
              </View>
              <Text style={[styles.topicBody, { color: colors.textSecondary }]}>{topic.body}</Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

function LibrarySection({ colors, settings }: { colors: ReturnType<typeof useSettings>['colors']; settings: ReturnType<typeof useSettings>['settings'] }) {
  const router = useRouter();
  return (
    <View style={styles.listWrap}>
      <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>Tap any port to open its learning page.</Text>
      {PORTS.map((p, i) => {
        const Icon = getIcon(p.icon);
        return (
          <Animated.View key={p.port} entering={settings.animationsEnabled ? FadeInDown.delay(i * 50).springify() : undefined}>
            <Pressable onPress={() => { haptic('light'); router.push(`/port/${p.port}`); }}>
              {({ pressed }) => (
                <View style={[styles.libCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
                  <View style={[styles.libIcon, { backgroundColor: `${colors.accent}1a` }]}>
                    <Icon size={18} color={colors.accentGlow} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.libTitle}>{p.service}</Text>
                    <Text style={[styles.libSub, { color: colors.textSecondary }]}>Port {p.port} · {p.protocol}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

function QuizSection({ colors, settings }: { colors: ReturnType<typeof useSettings>['colors']; settings: ReturnType<typeof useSettings>['settings'] }) {
  const { recordQuiz, unlockAchievement } = useProgress();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUIZ_QUESTIONS[index];
  const isCorrect = selected === q.correctIndex;

  const choose = (i: number) => {
    if (answered) return;
    haptic('light');
    setSelected(i);
    setAnswered(true);
    if (i === q.correctIndex) {
      haptic('success');
      setScore((s) => s + 1);
    } else {
      haptic('error');
    }
  };

  const next = () => {
    haptic('light');
    if (index + 1 < QUIZ_QUESTIONS.length) {
      setIndex((v) => v + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      const perfect = score === QUIZ_QUESTIONS.length;
      recordQuiz(perfect);
      unlockAchievement('cyber-learner');
      if (perfect) unlockAchievement('quiz-champion');
      setDone(true);
      haptic('success');
    }
  };

  const restart = () => {
    haptic('light');
    setIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const perfect = score === QUIZ_QUESTIONS.length;
    return (
      <Animated.View entering={settings.animationsEnabled ? ZoomIn.springify() : undefined} style={[styles.quizDone, { backgroundColor: colors.surface, borderColor: perfect ? colors.success : colors.border }]}>
        <Trophy size={48} color={perfect ? colors.successGlow : colors.accentGlow} />
        <Text style={styles.doneTitle}>Quiz Complete!</Text>
        <Text style={[styles.doneScore, { color: colors.textSecondary }]}>You scored {score} / {QUIZ_QUESTIONS.length}</Text>
        <Pressable onPress={restart} style={({ pressed }) => [styles.restartBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
          <RotateCcw size={16} color="#fff" />
          <Text style={styles.restartText}>Try Again</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={styles.listWrap}>
      <View style={styles.quizMeta}>
        <Text style={[styles.quizCounter, { color: colors.textSecondary }]}>Question {index + 1} of {QUIZ_QUESTIONS.length}</Text>
        <Text style={[styles.quizScore, { color: colors.accentGlow }]}>Score: {score}</Text>
      </View>
      <View style={[styles.quizProgress, { backgroundColor: colors.border }]}>
        <View style={[styles.quizProgressFill, { backgroundColor: colors.accent, width: `${((index + (answered ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100}%` }]} />
      </View>
      <Animated.View key={q.id} entering={settings.animationsEnabled ? FadeInDown.springify() : undefined} style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.quizQuestion}>{q.question}</Text>
        {q.options.map((opt, i) => {
          const correct = i === q.correctIndex;
          const picked = i === selected;
          const show = answered;
          const bg = show && correct ? `${colors.success}22` : show && picked && !correct ? `${colors.error}22` : 'transparent';
          const border = show && correct ? colors.success : show && picked && !correct ? colors.error : colors.border;
          return (
            <Pressable key={i} onPress={() => choose(i)} disabled={answered}>
              {({ pressed }) => (
                <View style={[styles.quizOption, { backgroundColor: bg, borderColor: border, opacity: pressed && !answered ? 0.8 : 1 }]}>
                  <Text style={[styles.quizOptionText, { color: show && correct ? colors.successGlow : show && picked && !correct ? colors.errorGlow : colors.textPrimary }]}>{opt}</Text>
                  {show && correct && <Check size={18} color={colors.successGlow} />}
                  {show && picked && !correct && <X size={18} color={colors.errorGlow} />}
                </View>
              )}
            </Pressable>
          );
        })}
        {answered && (
          <Animated.View entering={FadeInDown.springify()} style={[styles.quizExplain, { backgroundColor: `${colors.accent}12`, borderColor: `${colors.accent}44` }]}>
            <Text style={[styles.quizExplainLabel, { color: colors.accentGlow }]}>{isCorrect ? 'Correct!' : 'Not quite.'}</Text>
            <Text style={[styles.quizExplainText, { color: colors.textSecondary }]}>{q.explanation}</Text>
          </Animated.View>
        )}
        {answered && (
          <Pressable onPress={next} style={({ pressed }) => [styles.nextBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={styles.nextBtnText}>{index + 1 < QUIZ_QUESTIONS.length ? 'Next Question' : 'Finish Quiz'}</Text>
            <ChevronRight size={16} color="#fff" />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  screenSub: { fontSize: 13, marginBottom: 18 },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 10 },
  listWrap: { gap: 12, paddingBottom: 16 },
  topicCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  topicHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  topicIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  topicTitle: { fontSize: 16, fontWeight: '700' },
  topicSummary: { fontSize: 12, marginTop: 2 },
  topicBody: { fontSize: 13, lineHeight: 20 },
  sectionHint: { fontSize: 12, marginBottom: 4 },
  libCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, padding: 14 },
  libIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  libTitle: { fontSize: 15, fontWeight: '700' },
  libSub: { fontSize: 12, marginTop: 2 },
  quizMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  quizCounter: { fontSize: 12, fontWeight: '600' },
  quizScore: { fontSize: 12, fontWeight: '700' },
  quizProgress: { height: 4, borderRadius: 2, marginBottom: 14, overflow: 'hidden' },
  quizProgressFill: { height: '100%', borderRadius: 2 },
  quizCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  quizQuestion: { fontSize: 17, fontWeight: '700', lineHeight: 24, marginBottom: 6 },
  quizOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  quizOptionText: { fontSize: 14, fontWeight: '600', flex: 1 },
  quizExplain: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 4 },
  quizExplainLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  quizExplainText: { fontSize: 13, lineHeight: 19 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, paddingVertical: 14, marginTop: 6 },
  nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  quizDone: { borderWidth: 1.5, borderRadius: 24, padding: 28, alignItems: 'center', gap: 10, marginTop: 8 },
  doneTitle: { fontSize: 22, fontWeight: '800' },
  doneScore: { fontSize: 14 },
  restartBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, marginTop: 10 },
  restartText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
