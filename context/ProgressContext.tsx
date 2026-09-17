import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScanResult } from '@/utils/scanner';

export type Progress = {
  favorites: number[];
  achievements: string[];
  scannedHosts: string[];
  viewedPorts: number[];
  quizCompleted: boolean;
  quizPerfect: boolean;
  reportGenerated: boolean;
  lastScan: ScanResult | null;
  scanCount: number;
};

const DEFAULTS: Progress = {
  favorites: [],
  achievements: [],
  scannedHosts: [],
  viewedPorts: [],
  quizCompleted: false,
  quizPerfect: false,
  reportGenerated: false,
  lastScan: null,
  scanCount: 0,
};

const STORAGE_KEY = 'psd.progress.v1';

type ProgressContextValue = {
  progress: Progress;
  toastId: string | null;
  toggleFavorite: (port: number) => void;
  isFavorite: (port: number) => boolean;
  unlockAchievement: (id: string) => void;
  recordScan: (result: ScanResult) => void;
  recordViewedPort: (port: number) => void;
  recordQuiz: (perfect: boolean) => void;
  recordReport: () => void;
  dismissToast: () => void;
  reset: () => void;
};

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(DEFAULTS);
  const [toastId, setToastId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw: string | null) => {
      if (raw) {
        try { setProgress({ ...DEFAULTS, ...JSON.parse(raw) }); } catch { /* ignore */ }
      }
    });
  }, []);

  const persist = (next: Progress) => {
    setProgress(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const unlockAchievement = useCallback((id: string) => {
    setProgress((prev) => {
      if (prev.achievements.includes(id)) return prev;
      const next = { ...prev, achievements: [...prev.achievements, id] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      setToastId(id);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((port: number) => {
    setProgress((prev) => {
      const has = prev.favorites.includes(port);
      const favorites = has ? prev.favorites.filter((p) => p !== port) : [...prev.favorites, port];
      const next = { ...prev, favorites };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const recordScan = useCallback((result: ScanResult) => {
    setProgress((prev) => {
      const ips = prev.scannedIPs.includes(result.ip) ? prev.scannedIPs : [...prev.scannedIPs, result.ip];
      const next: Progress = { ...prev, scannedIPs: ips, lastScan: result, scanCount: prev.scanCount + 1 };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const recordViewedPort = useCallback((port: number) => {
    setProgress((prev) => {
      if (prev.viewedPorts.includes(port)) return prev;
      const next = { ...prev, viewedPorts: [...prev.viewedPorts, port] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const recordQuiz = useCallback((perfect: boolean) => {
    setProgress((prev) => {
      const next = { ...prev, quizCompleted: true, quizPerfect: perfect || prev.quizPerfect };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const recordReport = useCallback(() => {
    setProgress((prev) => {
      const next = { ...prev, reportGenerated: true };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const reset = useCallback(() => { persist(DEFAULTS); }, []);

  // Auto-unlock milestone achievements based on progress.
  useEffect(() => {
    if (progress.scanCount >= 1) unlockAchievement('first-scan');
    if (progress.scannedIPs.length >= 5) unlockAchievement('network-explorer');
    if (progress.viewedPorts.length >= 10) unlockAchievement('port-master');
    if (progress.reportGenerated) unlockAchievement('security-analyst');
  }, [progress.scanCount, progress.scannedIPs.length, progress.viewedPorts.length, progress.reportGenerated, unlockAchievement]);

  const dismissToast = useCallback(() => setToastId(null), []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      toastId,
      toggleFavorite,
      isFavorite: (port) => progress.favorites.includes(port),
      unlockAchievement,
      recordScan,
      recordViewedPort,
      recordQuiz,
      recordReport,
      dismissToast,
      reset,
    }),
    [progress, toastId, toggleFavorite, unlockAchievement, recordScan, recordViewedPort, recordQuiz, recordReport, dismissToast, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
