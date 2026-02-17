import { useCallback, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'theme';

const getSavedTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useTheme = () => {
  const [theme, setTheme] = useState(getSavedTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  };
};
