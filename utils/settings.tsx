import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Settings = {
  darkMode: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  animationsEnabled: boolean;
};

const DEFAULTS: Settings = {
  darkMode: true,
  soundEnabled: true,
  hapticsEnabled: true,
  animationsEnabled: true,
};

const STORAGE_KEY = 'psd.settings.v1';

type Listener = (s: Settings) => void;
class SettingsStore {
  private state: Settings = DEFAULTS;
  private listeners = new Set<Listener>();
  getState() {
    return this.state;
  }
  setState(next: Partial<Settings>) {
    this.state = { ...this.state, ...next };
    this.listeners.forEach((l) => l(this.state));
  }
  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}
export const settingsStore = new SettingsStore();

type SettingsContextValue = {
  settings: Settings;
  colors: ThemeColors;
  update: (next: Partial<Settings>) => void;
};

import { COLORS, LIGHT_COLORS, type ThemeColors } from '@/constants/theme';

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as Settings;
        setSettings(parsed);
        settingsStore.setState(parsed);
      }
    } catch {
      /* ignore */
    }
  };
  load();

  const update = (next: Partial<Settings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      settingsStore.setState(merged);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
      return merged;
    });
  };

  const colors = settings.darkMode ? COLORS : LIGHT_COLORS;

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, colors, update }),
    [settings, colors],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
