import { useEffect, type ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    localStorage.removeItem('app-theme');
    document.documentElement.classList.add('dark');
  }, []);

  return children;
}
