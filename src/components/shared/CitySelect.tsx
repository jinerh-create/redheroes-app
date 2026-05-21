import { useState, useRef, useEffect } from 'react';
import { MALDIVES_ISLANDS } from '../../lib/maldives';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  id?: string;
}

export default function CitySelect({ value, onChange, placeholder = 'Select island…', id }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = search
    ? MALDIVES_ISLANDS.filter(i => i.toLowerCase().includes(search.toLowerCase()))
    : MALDIVES_ISLANDS;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function select(island: string) {
    onChange(island);
    setSearch('');
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        id={id}
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: 'var(--surface2)',
          border: `1px solid ${open ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 10,
          padding: '0.625rem 0.875rem',
          color: value ? 'var(--text)' : 'var(--text-dim)',
          fontSize: '0.9375rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <span>{value || placeholder}</span>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border-red)',
          borderRadius: 10,
          zIndex: 999,
          maxHeight: 260,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ padding: '0.5rem' }}>
            <input
              autoFocus
              className="form-input"
              placeholder="Search island…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
            />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 200 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>No islands found</div>
            ) : (
              filtered.map(island => (
                <button
                  key={island}
                  onClick={() => select(island)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 1rem',
                    background: island === value ? 'var(--red-soft)' : 'none',
                    color: island === value ? 'var(--red)' : 'var(--text)',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    fontWeight: island === value ? 700 : 400,
                    borderBottom: '1px solid var(--border)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = island === value ? 'var(--red-soft)' : 'none')}
                >
                  {island}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
