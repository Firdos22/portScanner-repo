import { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/utils/settings';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { AnimatedShield } from '@/components/AnimatedShield';
import { haptic } from '@/utils/haptics';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors, settings } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    haptic('light');
    setError(null);
    if (!email.trim() || !password) { setError('Please enter your email and a password.'); haptic('error'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); haptic('error'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); haptic('error'); return; }
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) { setError(error); haptic('error'); }
    else { haptic('success'); router.replace('/(tabs)'); }
  };

  return (
    <View style={styles.container}>
      <CyberBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backBtn} onPress={() => { haptic('light'); router.back(); }} hitSlop={12}>
            <ArrowLeft size={20} color={colors.textSecondary} />
            <Text style={[styles.backText, { color: colors.textSecondary }]}>Back to sign in</Text>
          </Pressable>

          <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(100).springify() : undefined} style={styles.header}>
            <AnimatedShield size={72} />
            <Text style={styles.title}>Create your account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Start your cybersecurity learning journey.</Text>
          </Animated.View>

          <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(250).springify() : undefined} style={styles.formCard}>
            <FieldRow icon={<Mail size={16} color={colors.primaryGlow} />} label="Email" />
            <InputBox colors={colors}>
              <TextInput style={[styles.input, { color: colors.textPrimary }]} placeholder="you@example.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" />
            </InputBox>

            <FieldRow icon={<Lock size={16} color={colors.primaryGlow} />} label="Password" />
            <InputBox colors={colors}>
              <TextInput style={[styles.input, { color: colors.textPrimary, flex: 1 }]} placeholder="At least 6 characters" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPass} textContentType="newPassword" />
              <Pressable onPress={() => { setShowPass((v) => !v); haptic('light'); }} hitSlop={12}>
                {showPass ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
              </Pressable>
            </InputBox>

            <FieldRow icon={<Lock size={16} color={colors.primaryGlow} />} label="Confirm Password" />
            <InputBox colors={colors}>
              <TextInput style={[styles.input, { color: colors.textPrimary, flex: 1 }]} placeholder="Re-enter password" placeholderTextColor={colors.textMuted} value={confirm} onChangeText={setConfirm} secureTextEntry={!showPass} textContentType="newPassword" />
            </InputBox>

            {error && (
              <Animated.View entering={settings.animationsEnabled ? FadeInUp.springify() : undefined} style={[styles.errorBox, { backgroundColor: `${colors.error}18`, borderColor: `${colors.error}55` }]}>
                <Text style={[styles.errorText, { color: colors.errorGlow }]}>{error}</Text>
              </Animated.View>
            )}

            <Pressable onPress={handleSignUp} disabled={loading} style={({ pressed }) => [styles.btnWrap, { opacity: loading ? 0.7 : pressed ? 0.9 : 1 }]}>
              <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnInner}>
                <UserPlus size={18} color="#fff" />
                <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
              <Pressable onPress={() => { haptic('light'); router.replace('/login'); }}>
                <Text style={[styles.link, { color: colors.accentGlow }]}>Sign in</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FieldRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { colors } = useSettings();
  return <View style={styles.labelRow}>{icon}<Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text></View>;
}

function InputBox({ colors, children }: { colors: ReturnType<typeof useSettings>['colors']; children: React.ReactNode }) {
  return <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingVertical: 48 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 13, fontWeight: '600' },
  header: { alignItems: 'center', gap: 10, marginBottom: 28 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  formCard: { borderRadius: 24, borderWidth: 1, padding: 24, gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4 },
  input: { paddingVertical: 14, fontSize: 15 },
  errorBox: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 },
  errorText: { fontSize: 13, fontWeight: '600' },
  btnWrap: { marginTop: 18, borderRadius: 14, overflow: 'hidden' },
  btnInner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 15 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' },
  footerText: { fontSize: 13 },
  link: { fontSize: 13, fontWeight: '700' },
});
