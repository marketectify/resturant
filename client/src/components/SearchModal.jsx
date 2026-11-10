import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import Thumb from './Thumb.jsx';
import { useStore } from '../store.jsx';
import { rs } from '../config.js';

export default function SearchModal() {
  const { menu, searchOpen, setSearchOpen, add } = useStore();
  const [q, setQ] = useState('');
  const input = useRef(null);

  useEffect(() => {
    if (!searchOpen) return undefined;
    setQ('');
    input.current?.focus();
    const onKey = e => e.key === 'Escape' && setSearchOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, setSearchOpen]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t || !menu) return [];
    return menu.filter(m => `${m.name} ${m.desc || ''} ${m.cat}`.toLowerCase().includes(t)).slice(0, 30);
  }, [q, menu]);

  if (!searchOpen) return null;
  return (
    <div className="search-modal" onClick={() => setSearchOpen(false)}>
      <div className="search-box" role="dialog" aria-modal="true" aria-label="Search the menu" onClick={e => e.stopPropagation()}>
        <div className="search-input">
          <Icon name="search" size={22} />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Search biryani, karahi, burger..." aria-label="Search the menu" />
          <button className="round soft" onClick={() => setSearchOpen(false)} aria-label="Close search"><Icon name="close" size={18} stroke={2.6} /></button>
        </div>
        <div className="search-results">
          {q.trim() && results.length === 0 && <p className="muted">No items found for “{q.trim()}”.</p>}
          {results.map(m => (
            <div className="search-row" key={m._id}>
              <Thumb item={m} className="line-thumb" />
              <div><h4>{m.name}</h4><span className="muted">{m.cat}</span></div>
              <b className="red">{rs(m.price)}</b>
              <button className="add sm static" onClick={() => add(m)} aria-label={`Add ${m.name}`}><Icon name="plus" size={16} stroke={3} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
