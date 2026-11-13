import { useState } from 'react';

const KEY = 'mf-fav';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } };

/** Small heart toggle; favourites are remembered in this browser only. */
export default function Heart({ id, className = '' }) {
  const [on, setOn] = useState(() => read().includes(id));
  const toggle = e => {
    e.stopPropagation();
    const now = read();
    const next = now.includes(id) ? now.filter(x => x !== id) : [...now, id];
    write(next); setOn(next.includes(id));
  };
  return (
    <button className={`heart${on ? ' on' : ''} ${className}`} onClick={toggle} aria-pressed={on} aria-label={on ? 'Remove from favourites' : 'Add to favourites'}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
    </button>
  );
}
