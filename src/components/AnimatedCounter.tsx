import { useEffect, useRef, useState } from 'react';

export function AnimatedCounter({ value, duration = 900, suffix = '', className = '' }: {
  value: number; duration?: number; suffix?: string; className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(0);
  useEffect(() => {
    const start = startRef.current; const diff = value - start; const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + diff * eased));
      if (t < 1) raf = requestAnimationFrame(tick); else startRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{display}{suffix}</span>;
}
