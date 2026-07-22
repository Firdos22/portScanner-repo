export const COLORS = {
  bg: '#050816',
  bgElevated: '#0A0F24',
  surface: 'rgba(18, 26, 56, 0.6)',
  surfaceSolid: '#0F1733',
  border: 'rgba(80, 120, 220, 0.22)',
  borderStrong: 'rgba(99, 179, 237, 0.45)',
  primary: '#3B82F6',
  primaryGlow: '#60A5FA',
  accent: '#06B6D4',
  accentGlow: '#22D3EE',
  success: '#10B981',
  successGlow: '#34D399',
  warning: '#F59E0B',
  error: '#EF4444',
  errorGlow: '#F87171',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
} as const;

export const LIGHT_COLORS = {
  bg: '#F1F5F9',
  bgElevated: '#FFFFFF',
  surface: 'rgba(255, 255, 255, 0.72)',
  surfaceSolid: '#FFFFFF',
  border: 'rgba(59, 130, 246, 0.18)',
  borderStrong: 'rgba(37, 99, 235, 0.4)',
  primary: '#2563EB',
  primaryGlow: '#3B82F6',
  accent: '#0891B2',
  accentGlow: '#06B6D4',
  success: '#059669',
  successGlow: '#10B981',
  warning: '#D97706',
  error: '#DC2626',
  errorGlow: '#EF4444',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
} as const;

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceSolid: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryGlow: string;
  accent: string;
  accentGlow: string;
  success: string;
  successGlow: string;
  warning: string;
  error: string;
  errorGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
};

export const DEVELOPER = {
  name: 'Firdos Kazi',
  role: 'Frontend Developer | Cybersecurity Enthusiast',
  github: 'https://github.com/Firdos22',
} as const;

export const DISCLAIMER =
  'This application is an educational mobile simulator. It does not perform real network scanning or communicate with external systems. All scan results are simulated using predefined data.';
