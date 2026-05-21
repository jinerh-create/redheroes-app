import { useState, useEffect } from 'react';
import type { Notification } from '../../lib/types';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(data => {
      setNotifs(Array.isArray(data) ? data : []);
    }).finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: 1 } : x));
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  }

  const typeIcon: Record<string, string> = { response: '🩸', request: '📋', donation: '✅', system: '📢' };

  return (
    <div className="page">
      <div className="section-label">{notifs.filter(n => !n.read).length} unread</div>
      {loading ? <div className="spinner" /> : notifs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        notifs.map(n => (
          <div
            key={n.id}
            className="card"
            style={{ cursor: n.link ? 'pointer' : 'default', opacity: n.read ? 0.6 : 1, borderColor: n.read ? 'var(--border)' : 'var(--border-red)', marginBottom: '0.5rem' }}
            onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{typeIcon[n.type] ?? '🔔'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{n.title}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{n.body}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', marginTop: '0.375rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{timeAgo(n.created_at)}</div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: 6 }} />}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
