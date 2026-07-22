import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ScanResult } from '@/utils/scanner';

export type Progress = {
  favorites: number[]; achievements: string[]; scannedIPs: string[]; viewedPorts: number[];
  quizCompleted: boolean; quizPerfect: boolean; reportGenerated: boolean;
  lastScan: ScanResult | null; scanCount: number;
};

const DEFAULTS: Progress = {
  favorites: [], achievements: [], scannedIPs: [], viewedPorts: [],
  quizCompleted: false, quizPerfect: false, reportGenerated: false, lastScan: null, scanCount: 0,
};

const STORAGE_KEY = 'psd.progress.v1';

type ProgressContextValue = {
  progress: Progress; toastId: string | null;
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
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setProgress({ ...DEFAULTS, ...JSON.parse(raw) }); } catch { /* ignore */ }
  }, []);

  const persist = useCallback((updater: (prev: Progress) => Progress) => {
    setProgress((prev) => { const next = updater(prev); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ } return next; });
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setProgress((prev) => {
      if (prev.achievements.includes(id)) return prev;
      const next = { ...prev, achievements: [...prev.achievements, id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      setToastId(id);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((port: number) => {
    persist((prev) => {
      const has = prev.favorites.includes(port);
      return { ...prev, favorites: has ? prev.favorites.filter((p) => p !== port) : [...prev.favorites, port] };
    });
  }, [persist]);

  const recordScan = useCallback((result: ScanResult) => {
    persist((prev) => {
      const ips = prev.scannedIPs.includes(result.ip) ? prev.scannedIPs : [...prev.scannedIPs, result.ip];
      return { ...prev, scannedIPs: ips, lastScan: result, scanCount: prev.scanCount + 1 };
    });
  }, [persist]);

  const recordViewedPort = useCallback((port: number) => {
    persist((prev) => prev.viewedPorts.includes(port) ? prev : { ...prev, viewedPorts: [...prev.viewedPorts, port] });
  }, [persist]);

  const recordQuiz = useCallback((perfect: boolean) => {
    persist((prev) => ({ ...prev, quizCompleted: true, quizPerfect: perfect || prev.quizPerfect }));
  }, [persist]);

  const recordReport = useCallback(() => { persist((prev) => ({ ...prev, reportGenerated: true })); }, [persist]);

  const reset = useCallback(() => {
    setProgress(DEFAULTS);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (progress.scanCount >= 1) unlockAchievement('first-scan');
    if (progress.scannedIPs.length >= 5) unlockAchievement('network-explorer');
    if (progress.viewedPorts.length >= 10) unlockAchievement('port-master');
    if (progress.reportGenerated) unlockAchievement('security-analyst');
  }, [progress.scanCount, progress.scannedIPs.length, progress.viewedPorts.length, progress.reportGenerated, unlockAchievement]);

  const dismissToast = useCallback(() => setToastId(null), []);

  const value = useMemo<ProgressContextValue>(() => ({
    progress, toastId, toggleFavorite,
    isFavorite: (port) => progress.favorites.includes(port),
    unlockAchievement, recordScan, recordViewedPort, recordQuiz, recordReport, dismissToast, reset,
  }), [progress, toastId, toggleFavorite, unlockAchievement, recordScan, recordViewedPort, recordQuiz, recordReport, dismissToast, reset]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
