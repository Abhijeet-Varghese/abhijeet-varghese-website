/**
 * AV OS admin — local UI state (theme, toasts, command palette, sidebar).
 * Deliberately separate from server state (api hooks) and future editor state.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface UiState {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (t: Theme) => void;
  toasts: Toast[];
  pushToast: (kind: Toast['kind'], message: string) => void;
  dismissToast: (id: number) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const UiContext = createContext<UiState | null>(null);

function resolve(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return theme;
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('avos-theme') as Theme) || 'dark');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const idRef = useRef(0);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('avos-theme', t);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolve(theme));
  }, [theme]);

  const pushToast = useCallback((kind: Toast['kind'], message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);

  const value = useMemo<UiState>(() => ({
    theme, resolvedTheme: resolve(theme), setTheme, toasts, pushToast, dismissToast,
    paletteOpen, setPaletteOpen, sidebarCollapsed, toggleSidebar,
  }), [theme, setTheme, toasts, pushToast, dismissToast, paletteOpen, sidebarCollapsed, toggleSidebar]);

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiState {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
}
