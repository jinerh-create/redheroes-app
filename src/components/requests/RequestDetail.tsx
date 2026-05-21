import { useState, useEffect } from 'react';
import Avatar from '../shared/Avatar';
import BloodBadge from '../shared/BloodBadge';
import RankBadge from '../shared/RankBadge';
import type { User, BloodRequest, RequestResponse } from '../../lib/types';

interface Props { requestId?: string; user: User; }

export default function RequestDetail({ requestId, user }: Props) {
  const [req, setReq] = useState<(BloodRequest & { responses: RequestResponse[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!requestId) return;
    fetch(`/api/requests/${requestId}`).then(r => r.json()).then(setReq).finally(() => setLoading(false));
  }, [requestId]);

  async function respond() {
    setResponding(true); setError('');
    try {
      const r = await fetch(`/api/requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'respond', message }),
      });
      const data = await r.json();
      if (r.ok) { setSuccess("You've responded! The requester will contact you."); fetch(`/api/requests/${requestId}`).then(r2 => r2.json()).then(setReq); }
      else setError(data.error ?? 'Failed');
    } finally { setResponding(false); }
  }

  async function fulfill() {
    if (!confirm('Mark this request as fulfilled?')) return;
    const r = await fetch(`/api/requests/${requestId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fulfill' }) });
    if (r.ok) fetch(`/api/requests/${requestId}`).then(r2 => r2.json()).then(setReq);
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  }

  if (loading) return <div className="spinner" />;
  if (!req) return <div className="empty-state"><div className="empty-state-icon">❌</div><h3>Request not found</h3></div>;

  const alreadyResponded = req.responses.some(r => r.donor_id === user.id);
  const isOwner = req.requester_id === user.id;

  function urgencyClass(u: string) {
    return u === 'critical' ? 'urgency-critical' : u === 'urgent' ? 'urgency-urgent' : 'urgency-normal';
  }

  return (
    <div className="page">
      {/* Header */}
      <div className={`card${req.urgency === 'critical' ? ' card-red' : ''}`} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <BloodBadge type={req.blood_type} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{req.patient_name}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Requested by {req.requester_name}</div>
          </div>
          <span className={`urgency-badge ${urgencyClass(req.urgency)}`}>
            {req.urgency === 'critical' ? '🚨' : req.urgency === 'urgent' ? '⚠️' : '📋'} {req.urgency}
          </span>
        </div>

        {[
          { icon: '🏥', label: 'Hospital', val: req.hospital },
          { icon: '📍', label: 'City', val: req.city },
          { icon: '💉', label: 'Units Needed', val: `${req.units_needed} unit${req.units_needed > 1 ? 's' : ''}` },
          { icon: '🕐', label: 'Posted', val: timeAgo(req.created_at) },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>{item.label}</span>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{item.val}</span>
          </div>
        ))}

        {req.message && (
          <div style={{ marginTop: '0.875rem', padding: '0.75rem', background: 'var(--surface2)', borderRadius: 10, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            💬 {req.message}
          </div>
        )}

        {req.status === 'fulfilled' && (
          <div className="alert alert-success" style={{ marginTop: '0.875rem', marginBottom: 0 }}>✓ This request has been fulfilled</div>
        )}
      </div>

      {/* Respond section */}
      {req.status === 'open' && !isOwner && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.875rem' }}>Can you help?</h3>
          {success ? (
            <div className="alert alert-success">{success}</div>
          ) : alreadyResponded ? (
            <div className="alert alert-success">✓ You've already responded to this request</div>
          ) : (
            <>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="form-group">
                <label className="form-label">Message (optional)</label>
                <textarea className="form-textarea" value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. I'm available tomorrow morning…" style={{ minHeight: 60 }} />
              </div>
              <button className={`btn btn-primary btn-block${req.urgency === 'critical' ? ' pulse-critical' : ''}`} onClick={respond} disabled={responding}>
                {responding ? 'Sending…' : '🩸 I Can Donate'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Owner fulfill */}
      {isOwner && req.status === 'open' && (
        <button className="btn btn-secondary btn-block" onClick={fulfill} style={{ marginBottom: '1rem' }}>Mark as Fulfilled</button>
      )}

      {/* Responses */}
      {req.responses.length > 0 && (
        <>
          <div className="section-label">{req.responses.length} Donor{req.responses.length > 1 ? 's' : ''} Responded</div>
          {req.responses.map(resp => (
            <div key={resp.id} className="donor-card">
              <Avatar name={resp.donor_name ?? ''} avatar_b64={resp.donor_avatar} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{resp.donor_name}</div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <BloodBadge type={resp.donor_blood_type ?? ''} />
                </div>
                {resp.message && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{resp.message}</div>}
              </div>
              {(isOwner || user.is_admin) && resp.donor_phone && (
                <a href={`tel:${resp.donor_phone}`} className="btn btn-primary btn-sm">Call</a>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
