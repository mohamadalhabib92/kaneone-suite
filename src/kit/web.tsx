import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { kane } from '@/theme';

/** Focus visible (web) et respect de « réduire les animations ». */
export function WebBaseline() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'kane-baseline';
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = [
      `*:focus-visible{outline:2px solid ${kane.primary};outline-offset:2px;}`,
      '@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;}}',
    ].join('');
  }, []);
  return null;
}

/** Bascule vers la variante claire le temps de l’impression / du PDF. */
export function usePrintMode(): boolean {
  const [print, setPrint] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const on = () => setPrint(true);
    const off = () => setPrint(false);
    window.addEventListener('kane-beforeprint', on);
    window.addEventListener('beforeprint', on);
    window.addEventListener('afterprint', off);
    return () => {
      window.removeEventListener('kane-beforeprint', on);
      window.removeEventListener('beforeprint', on);
      window.removeEventListener('afterprint', off);
    };
  }, []);
  return print;
}
