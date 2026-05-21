import { useState, useEffect } from 'react';
import Avatar from '../shared/Avatar';
import BloodBadge from '../shared/BloodBadge';
import RankBadge from '../shared/RankBadge';
import type { User } from '../../lib/types';
import { BLOOD_TYPES } from '../../lib/types';

interface Props { user: User; }

export default function FindDonors({ user }: Props) {
  const [donors, setDonors] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [selectedBlood, setSelectedBlood] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => {
      setDonors(data);
      setFiltered(data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = donors;
    if (selectedBlood) list = list.filter(d => d.blood_type === selectedBlood);
    if (search) list = list.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.city.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [donors, selectedBlood, search]);

  return (
    <div className="page">
      {/* Search */}
      <input
        className="form-input"
        placeholder="Search by name or city…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: '0.75rem' }}
      />

      {/* Blood type filter */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          className="btn btn-sm"
          style={{ background: !selectedBlood ? 'var(--red)' : 'var(--surface2)', color: !selectedBlood ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)' }}
          onClick={() => setSelectedBlood('')}
        >All</button>
        {BLOOD_TYPES.map(bt => (
          <button
            key={bt}
            className="btn btn-sm"
            style={{ background: selectedBlood === bt ? 'var(--red)' : 'var(--surface2)', color: selectedBlood === bt ? 'white' : 'var(--text)', border: '1px solid var(--border)', fontWeight: 900 }}
            onClick={() => setSelectedBlood(bt === selectedBlood ? '' : bt)}
          >{bt}</button>
        ))}
      </div>

      <div className="section-label">{filtered.length} donor{filtered.length !== 1 ? 's' : ''} found</div>

      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No donors found</h3>
          <p>Try a different blood type or city</p>
        </div>
      ) : (
        filtered.map(donor => (
          <a key={donor.id} href={`/profile/${donor.id}`} className="donor-card">
            <Avatar name={donor.name} avatar_b64={donor.avatar_b64} size="md" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {donor.name}
                {donor.is_available ? <span className="online-dot" title="Available" /> : <span className="offline-dot" title="Unavailable" />}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <BloodBadge type={donor.blood_type} />
                <RankBadge rank={donor.rank} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{donor.city} · {donor.donations_count} donations</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>→</div>
          </a>
        ))
      )}
    </div>
  );
}
