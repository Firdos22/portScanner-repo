import { Platform } from 'react-native';

// Lightweight audio stub. Real sound assets are not bundled to keep the app
// self-contained; this still respects the sound toggle and never crashes.
export async function playSound(
  _type: 'scan' | 'complete' | 'success' | 'error' | 'achievement',
  soundEnabled: boolean,
) {
  if (Platform.OS === 'web' || !soundEnabled) return;
  // No-op: would play a bundled asset via expo-av when enabled.
}
