import { useState, useEffect } from 'react';
import Avatar from '../shared/Avatar';
import BloodBadge from '../shared/BloodBadge';
import RankBadge from '../shared/RankBadge';
import type { User } from '../../lib/types';

interface Props { user: User; }

export default function Leaderboard({ user }: Props) {
  const [leaders, setLeaders] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(data => {
      setLeaders(data.leaderboard ?? []);
      setStats(data.stats);
    }).finally(() => setLoading(false));
  }, []);

  const myRank = leaders.findIndex(l => l.id === user.id) + 1;

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero-banner" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
        <h2 style={{ color: 'var(--red)', marginBottom: '0.25rem' }}>Heroes Board</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Top blood donors saving lives</p>
        {myRank > 0 && (
          <div style={{ marginTop: '0.875rem', padding: '0.5rem 1rem', background: 'rgba(220,38,38,0.15)', borderRadius: 10, display: 'inline-block', border: '1px solid var(--border-red)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Your rank: </span>
            <span style={{ color: 'var(--red)', fontWeight: 900, fontSize: '1.1rem' }}>#{myRank}</span>
          </div>
        )}
      </div>

      {/* Global stats */}
      {stats && (
        <div className="stat-row" style={{ marginBottom: '1.25rem' }}>
          <div className="stat-box">
            <div className="stat-val">{stats.users?.total ?? 0}</div>
            <div className="stat-label">Heroes</div>
          </div>
          <div className="stat-box">
            <div className="stat-val">{stats.users?.total_donations ?? 0}</div>
            <div className="stat-label">Donations</div>
          </div>
          <div className="stat-box">
            <div className="stat-val">{stats.requests?.total ?? 0}</div>
            <div className="stat-label">Requests</div>
          </div>
        </div>
      )}

      <div className="section-label">Top Donors</div>

      {loading ? <div className="spinner" /> : leaders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌟</div>
          <h3>Be the first hero!</h3>
          <p>Make your first donation to appear here</p>
        </div>
      ) : (
        leaders.map((leader, i) => {
          const rank = i + 1;
          const rankClass = rank === 1 ? 'lb-rank-gold' : rank === 2 ? 'lb-rank-silver' : rank === 3 ? 'lb-rank-bronze' : '';
          const isMe = leader.id === user.id;
          return (
            <a key={leader.id} href={`/profile/${leader.id}`}
              className="lb-row"
              style={{ textDecoration: 'none', color: 'inherit', border: `1px solid ${isMe ? 'var(--red)' : 'var(--border)'}`, background: isMe ? 'var(--red-soft)' : 'var(--surface)' }}>
              <div className={`lb-rank-num ${rankClass}`}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
              </div>
              <Avatar name={leader.name} avatar_b64={leader.avatar_b64} size="sm" />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {leader.name} {isMe && <span style={{ fontSize: '0.625rem', color: 'var(--red)', fontWeight: 900 }}>YOU</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                  <BloodBadge type={leader.blood_type} />
                  <RankBadge rank={leader.rank} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--red)', lineHeight: 1 }}>{leader.donations_count}</div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>donations</div>
              </div>
            </a>
          );
        })
      )}
    </div>
  );
}
