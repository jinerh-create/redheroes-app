import { useState, useEffect } from 'react';
import Avatar from '../shared/Avatar';
import BloodBadge from '../shared/BloodBadge';
import RankBadge from '../shared/RankBadge';
import type { User, BloodRequest } from '../../lib/types';

interface Props { user: User; }

export default function AdminPanel({ user }: Props) {
  const [tab, setTab] = useState<'overview' | 'users' | 'requests'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/requests').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
    ]).then(([u, req, st]) => {
      setUsers(Array.isArray(u) ? u : []);
      setRequests(Array.isArray(req) ? req : []);
      setStats(st.stats);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="hero-banner" style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.375rem' }}>⚙️</div>
        <h2 style={{ color: 'var(--red)', marginBottom: '0.25rem' }}>Admin Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>RedHeroes management</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem', marginBottom: '1.25rem' }}>
          {[
            { val: stats.users?.total ?? 0, label: 'Users' },
            { val: stats.users?.donors ?? 0, label: 'Donors' },
            { val: stats.requests?.open ?? 0, label: 'Open Req' },
            { val: stats.requests?.total ?? 0, label: 'Requests' },
            { val: stats.users?.total_donations ?? 0, label: 'Donations' },
            { val: stats.donations?.total ?? 0, label: 'Logged' },
          ].map(s => (
            <div key={s.label} className="stat-box">
              <div className="stat-val" style={{ fontSize: '1.25rem' }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab strip */}
      <div className="tab-strip" style={{ marginBottom: '1rem' }}>
        {(['overview', 'users', 'requests'] as const).map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : tab === 'users' ? (
        <>
          <div className="section-label">{users.length} registered users</div>
          {users.map(u => (
            <div key={u.id} className="donor-card">
              <Avatar name={u.name} avatar_b64={u.avatar_b64} size="sm" />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {u.name}
                  {u.is_admin ? <span style={{ fontSize: '0.5625rem', background: 'rgba(220,38,38,0.2)', color: 'var(--red)', padding: '1px 5px', borderRadius: 4, fontWeight: 900 }}>ADMIN</span> : null}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.2rem' }}>
                  <BloodBadge type={u.blood_type} />
                  <RankBadge rank={u.rank} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{u.city} · {u.donations_count} donations · {u.phone}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: u.is_available ? 'var(--green)' : 'var(--text-dim)', display: 'inline-block', marginTop: 6 }} />
              </div>
            </div>
          ))}
        </>
      ) : tab === 'requests' ? (
        <>
          <div className="section-label">{requests.length} open requests</div>
          {requests.map(req => (
            <a key={req.id} href={`/requests/${req.id}`} className="request-card">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.375rem' }}>
                <BloodBadge type={req.blood_type} />
                <span className={`urgency-badge urgency-${req.urgency}`}>{req.urgency}</span>
              </div>
              <div style={{ fontWeight: 700 }}>{req.patient_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.hospital} · {req.city}</div>
            </a>
          ))}
        </>
      ) : (
        <div className="card">
          <div className="section-label" style={{ marginBottom: '1rem' }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setTab('users')}>Manage Users →</button>
            <button className="btn btn-secondary" onClick={() => setTab('requests')}>View Requests →</button>
            <a href="/leaderboard" className="btn btn-secondary">View Leaderboard →</a>
          </div>
        </div>
      )}
    </div>
  );
}
