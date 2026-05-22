import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectThemeMode } from './themeSlice';

const applyTheme = (mode: 'light' | 'dark' | 'system') => {
  const isDark =
    mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const mode = useSelector(selectThemeMode);

  useEffect(() => {
    applyTheme(mode);
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyTheme('system');
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [mode]);

  return <>{children}</>;
};
