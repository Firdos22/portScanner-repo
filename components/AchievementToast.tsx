import { useEffect, useState } from 'react';
import { StyleSheet, View, Modal, Pressable } from 'react-native';
import { Crown } from 'lucide-react-native';
import Animated, {
  SlideInDown, SlideOutDown, withSequence, withTiming, useSharedValue, useAnimatedStyle, withRepeat, Easing,
} from 'react-native-reanimated';
import { useSettings } from '@/utils/settings';
import { Text } from './ThemedText';
import { ACHIEVEMENTS } from '@/data/ports';
import { haptic } from '@/utils/haptics';

export function AchievementToast({ toastId, onDismiss }: { toastId: string | null; onDismiss: () => void }) {
  const { colors, settings } = useSettings();
  const [visible, setVisible] = useState(false);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    if (toastId) {
      setVisible(true);
      haptic('success');
      const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 2800);
      return () => clearTimeout(t);
    }
  }, [toastId, onDismiss]);

  useEffect(() => {
    if (visible && settings.animationsEnabled) {
      ringScale.value = withRepeat(withSequence(
        withTiming(1.15, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ), -1, false);
    }
  }, [visible, settings.animationsEnabled, ringScale]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: ringScale.value }] }));
  if (!toastId) return null;
  const achievement = ACHIEVEMENTS.find((a) => a.id === toastId);
  if (!achievement) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={() => { setVisible(false); setTimeout(onDismiss, 200); }}>
        <Animated.View
          entering={settings.animationsEnabled ? SlideInDown.springify() : undefined}
          exiting={settings.animationsEnabled ? SlideOutDown : undefined}
          style={[styles.card, { backgroundColor: colors.surfaceSolid, borderColor: colors.accent }]}
        >
          <Animated.View style={ringStyle}>
            <Crown size={44} color={colors.accentGlow} />
          </Animated.View>
          <Text style={[styles.label, { color: colors.accentGlow }]}>ACHIEVEMENT UNLOCKED</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{achievement.description}</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 24 },
  card: { width: '100%', maxWidth: 340, borderRadius: 24, borderWidth: 1.5, padding: 28, alignItems: 'center', gap: 8 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  desc: { fontSize: 14, textAlign: 'center' },
});
