import { useState, useEffect } from 'react';
import Avatar from '../shared/Avatar';
import BloodBadge from '../shared/BloodBadge';
import RankBadge from '../shared/RankBadge';
import { RANKS } from '../../lib/types';
import type { User, BloodRequest } from '../../lib/types';

interface Props { user: User; }

export default function Dashboard({ user }: Props) {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/requests').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
    ]).then(([reqs, st]) => {
      setRequests(reqs.slice(0, 5));
      setStats(st.stats);
    }).finally(() => setLoading(false));
  }, []);

  const rankInfo = RANKS.find(r => r.name === user.rank) ?? RANKS[0];
  const nextRank = RANKS.find(r => r.min > user.donations_count);

  function urgencyClass(u: string) {
    if (u === 'critical') return 'urgency-critical';
    if (u === 'urgent') return 'urgency-urgent';
    return 'urgency-normal';
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="page">
      {/* User card */}
      <div className="hero-banner" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Avatar name={user.name} avatar_b64={user.avatar_b64} size="lg" />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{user.name}</div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <BloodBadge type={user.blood_type} />
              <RankBadge rank={user.rank} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{user.city}</div>
          </div>
          <a href={`/profile/${user.id}`} className="btn btn-ghost btn-sm">Edit</a>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          {[
            { val: user.donations_count, label: 'Donations' },
            { val: user.lives_saved, label: 'Lives Saved' },
            { val: rankInfo.icon, label: user.rank },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.18)', borderRadius: 10, padding: '0.625rem 0.25rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Rank progress */}
        {nextRank && (
          <div style={{ marginTop: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'rgba(255,255,255,0.75)', marginBottom: '0.375rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span>Next: {nextRank.icon} {nextRank.name}</span>
              <span>{nextRank.min - user.donations_count} more donations</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(100, (user.donations_count / nextRank.min) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="section-label">Quick Actions</div>
      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        <a href="/requests" className="card card-red" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', padding: '1.25rem 0.75rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🩸</div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Request Blood</div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Post urgent need</div>
        </a>
        <a href="/find" className="card" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', padding: '1.25rem 0.75rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Find Donors</div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>By blood type</div>
        </a>
        <a href="/leaderboard" className="card" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', padding: '1.25rem 0.75rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Leaderboard</div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Top heroes</div>
        </a>
        <a href="/chat" className="card" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', padding: '1.25rem 0.75rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Messages</div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Chat with donors</div>
        </a>
      </div>

      {/* Global stats */}
      {stats && (
        <>
          <div className="section-label">Community Stats</div>
          <div className="stat-row" style={{ marginBottom: '1.25rem' }}>
            <div className="stat-box">
              <div className="stat-val">{stats.users?.total ?? 0}</div>
              <div className="stat-label">Heroes</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">{stats.users?.donors ?? 0}</div>
              <div className="stat-label">Donors</div>
            </div>
            <div className="stat-box">
              <div className="stat-val">{stats.users?.total_donations ?? 0}</div>
              <div className="stat-label">Donations</div>
            </div>
          </div>
        </>
      )}

      {/* Recent requests */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div className="section-label" style={{ margin: 0 }}>Urgent Requests</div>
        <a href="/requests" style={{ color: 'var(--red)', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>See all →</a>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🩸</div>
          <h3>No open requests</h3>
          <p>Community is well supplied right now</p>
        </div>
      ) : (
        requests.map(req => (
          <a key={req.id} href={`/requests/${req.id}`} className={`request-card${req.urgency === 'critical' ? ' critical' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <BloodBadge type={req.blood_type} />
                <span className={`urgency-badge ${urgencyClass(req.urgency)}`}>
                  {req.urgency === 'critical' ? '🚨' : req.urgency === 'urgent' ? '⚠️' : '📋'} {req.urgency}
                </span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{timeAgo(req.created_at)}</span>
            </div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{req.patient_name}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {req.hospital} · {req.city} · {req.units_needed} unit{req.units_needed > 1 ? 's' : ''}
            </div>
            {(req.responses_count ?? 0) > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: 'var(--green)', fontWeight: 700 }}>
                ✓ {req.responses_count} donor{req.responses_count! > 1 ? 's' : ''} responded
              </div>
            )}
          </a>
        ))
      )}
    </div>
  );
}
