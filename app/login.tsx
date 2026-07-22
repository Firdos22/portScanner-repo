import { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/utils/settings';
import { Text } from '@/components/ThemedText';
import { CyberBackground } from '@/components/CyberBackground';
import { AnimatedShield } from '@/components/AnimatedShield';
import { haptic } from '@/utils/haptics';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, settings } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    haptic('light');
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      haptic('error');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) { setError(error); haptic('error'); }
    else { haptic('success'); router.replace('/(tabs)'); }
  };

  return (
    <View style={styles.container}>
      <CyberBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(100).springify() : undefined} style={styles.header}>
            <AnimatedShield size={76} />
            <Text style={styles.title}>Port Scanner Dashboard</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Educational Network Port Scanner Simulator</Text>
          </Animated.View>

          <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(250).springify() : undefined} style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={[styles.formSub, { color: colors.textSecondary }]}>Sign in to continue your cybersecurity learning.</Text>

            <FieldLabel icon={<Mail size={16} color={colors.primaryGlow} />} label="Email" />
            <InputBox colors={colors}>
              <TextInput style={[styles.input, { color: colors.textPrimary }]} placeholder="you@example.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" />
            </InputBox>

            <FieldLabel icon={<Lock size={16} color={colors.primaryGlow} />} label="Password" />
            <InputBox colors={colors}>
              <TextInput style={[styles.input, { color: colors.textPrimary, flex: 1 }]} placeholder="••••••••" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPass} textContentType="password" />
              <Pressable onPress={() => { setShowPass((v) => !v); haptic('light'); }} hitSlop={12}>
                {showPass ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
              </Pressable>
            </InputBox>

            {error && (
              <Animated.View entering={settings.animationsEnabled ? FadeInUp.springify() : undefined} style={[styles.errorBox, { backgroundColor: `${colors.error}18`, borderColor: `${colors.error}55` }]}>
                <Text style={[styles.errorText, { color: colors.errorGlow }]}>{error}</Text>
              </Animated.View>
            )}

            <Pressable onPress={handleSignIn} disabled={loading} style={({ pressed }) => [styles.btnWrap, { opacity: loading ? 0.7 : pressed ? 0.9 : 1 }]}>
              <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnInner}>
                {loading ? <View style={styles.spinner} /> : <><Text style={styles.btnText}>Sign In</Text><ArrowRight size={18} color="#fff" /></>}
              </LinearGradient>
            </Pressable>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
              <Pressable onPress={() => { haptic('light'); router.push('/sign-up'); }}>
                <Text style={[styles.link, { color: colors.accentGlow }]}>Create one</Text>
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={settings.animationsEnabled ? FadeInDown.delay(400).springify() : undefined} style={styles.disclaimer}>
            <Shield size={14} color={colors.textMuted} />
            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>Educational simulator only. No real network scanning.</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FieldLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { colors } = useSettings();
  return <View style={styles.labelRow}>{icon}<Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text></View>;
}

function InputBox({ colors, children }: { colors: ReturnType<typeof useSettings>['colors']; children: React.ReactNode }) {
  return <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 48 },
  header: { alignItems: 'center', gap: 10, marginBottom: 28 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 0.3 },
  subtitle: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  formCard: { borderRadius: 24, borderWidth: 1, padding: 24, gap: 6 },
  formTitle: { fontSize: 20, fontWeight: '700' },
  formSub: { fontSize: 13, marginBottom: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4 },
  input: { paddingVertical: 14, fontSize: 15 },
  errorBox: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 },
  errorText: { fontSize: 13, fontWeight: '600' },
  btnWrap: { marginTop: 18, borderRadius: 14, overflow: 'hidden' },
  btnInner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 15 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  spinner: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' },
  footerText: { fontSize: 13 },
  link: { fontSize: 13, fontWeight: '700' },
  disclaimer: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 22 },
  disclaimerText: { fontSize: 11, textAlign: 'center' },
});
