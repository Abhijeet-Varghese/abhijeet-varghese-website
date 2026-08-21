/**
 * AV OS admin — command palette (⌘K). Searches navigation + real actions.
 * Only implemented actions are offered; no "coming soon" placeholders.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUi } from '@/state/ui';
import { usePermissions } from '@/permissions/usePermissions';
import { flattenNav } from '@/navigation/nav';
import './palette.css';

interface Action {
  id: string;
  label: string;
  group: string;
  run: () => void;
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useUi();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const actions = useMemo<Action[]>(() => {
    const nav = flattenNav()
      .filter((it) => !it.permission || can(it.permission))
      .map((it) => ({ id: `nav:${it.to}`, label: it.label, group: 'Go to', run: () => navigate(it.to) }));
    const ops: Action[] = [
      { id: 'nav:dashboard', label: 'Dashboard', group: 'Go to', run: () => navigate('/dashboard') },
      { id: 'nav:projects', label: 'Projects', group: 'Go to', run: () => navigate('/projects') },
      { id: 'nav:articles', label: 'Journal', group: 'Go to', run: () => navigate('/articles') },
      { id: 'nav:media', label: 'Media Library', group: 'Go to', run: () => navigate('/media') },
      { id: 'nav:settings', label: 'Settings', group: 'Go to', run: () => navigate('/settings') },
    ];
    return [...nav, ...ops.filter((o) => !nav.some((n) => n.id === o.id))];
  }, [can, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(q) || a.group.toLowerCase().includes(q));
  }, [actions, query]);

  useEffect(() => {
    if (!paletteOpen) return;
    setQuery('');
    setIndex(0);
    inputRef.current?.focus();
  }, [paletteOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [paletteOpen, setPaletteOpen]);

  useEffect(() => setIndex(0), [query]);

  if (!paletteOpen) return null;

  const run = (a: Action) => {
    setPaletteOpen(false);
    a.run();
  };

  return (
    <div className="av-palette-backdrop" onClick={() => setPaletteOpen(false)} role="presentation">
      <div className="av-palette" role="dialog" aria-modal="true" aria-label="Command palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="av-palette__input"
          placeholder="Search pages, projects, articles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, filtered.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
            else if (e.key === 'Enter') { const a = filtered[index]; if (a) run(a); }
            else if (e.key === 'Escape') setPaletteOpen(false);
          }}
        />
        <div className="av-palette__list" ref={listRef}>
          {filtered.length === 0 && <p className="av-palette__empty">No results for “{query}”</p>}
          {filtered.map((a, i) => (
            <button
              key={a.id}
              className={`av-palette__item ${i === index ? 'is-active' : ''}`}
              onMouseEnter={() => setIndex(i)}
              onClick={() => run(a)}
            >
              <span className="av-palette__item-label">{a.label}</span>
              <span className="av-palette__item-group">{a.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
