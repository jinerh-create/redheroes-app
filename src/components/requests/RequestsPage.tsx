import { useState, useEffect } from 'react';
import BloodBadge from '../shared/BloodBadge';
import CitySelect from '../shared/CitySelect';
import type { User, BloodRequest } from '../../lib/types';
import { BLOOD_TYPES } from '../../lib/types';

interface Props { user: User; }

export default function RequestsPage({ user }: Props) {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');

  // Form state
  const [form, setForm] = useState({ patient_name: '', blood_type: '', units_needed: '1', hospital: '', city: '', urgency: 'normal', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadRequests(); }, []);

  function loadRequests() {
    setLoading(true);
    fetch('/api/requests').then(r => r.json()).then(setRequests).finally(() => setLoading(false));
  }

  const filtered = filter ? requests.filter(r => r.blood_type === filter) : requests;

  async function submit() {
    if (!form.patient_name || !form.blood_type || !form.hospital || !form.city) { setError('Fill all required fields'); return; }
    setSubmitting(true); setError('');
    try {
      const r = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, units_needed: parseInt(form.units_needed) || 1 }) });
      const data = await r.json();
      if (r.ok) { setShowForm(false); setForm({ patient_name: '', blood_type: '', units_needed: '1', hospital: '', city: '', urgency: 'normal', message: '' }); loadRequests(); }
      else setError(data.error ?? 'Failed');
    } finally { setSubmitting(false); }
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  }

  function urgencyClass(u: string) {
    return u === 'critical' ? 'urgency-critical' : u === 'urgent' ? 'urgency-urgent' : 'urgency-normal';
  }

  return (
    <div className="page">
      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button className="btn btn-sm" style={{ background: !filter ? 'var(--red)' : 'var(--surface2)', color: !filter ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setFilter('')}>All</button>
        {BLOOD_TYPES.map(bt => (
          <button key={bt} className="btn btn-sm" style={{ background: filter === bt ? 'var(--red)' : 'var(--surface2)', color: filter === bt ? 'white' : 'var(--text)', border: '1px solid var(--border)', fontWeight: 900 }} onClick={() => setFilter(bt === filter ? '' : bt)}>{bt}</button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🩸</div>
          <h3>No open requests</h3>
          <p>All needs are met right now</p>
        </div>
      ) : (
        filtered.map(req => (
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
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{req.hospital} · {req.city}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {req.units_needed} unit{req.units_needed > 1 ? 's' : ''} needed
              {(req.responses_count ?? 0) > 0 && <span style={{ color: 'var(--green)', marginLeft: '0.75rem' }}>✓ {req.responses_count} responded</span>}
            </div>
          </a>
        ))
      )}

      {/* FAB */}
      <button className="fab" onClick={() => setShowForm(true)} title="Post Blood Request">+</button>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h2 style={{ marginBottom: '1rem' }}>Post Blood Request</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group">
              <label className="form-label">Patient Name *</label>
              <input className="form-input" value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Type *</label>
              <div className="blood-grid">
                {BLOOD_TYPES.map(bt => (
                  <button key={bt} className={`blood-option${form.blood_type === bt ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, blood_type: bt }))}>{bt}</button>
                ))}
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Units Needed</label>
                <input className="form-input" type="number" min="1" max="10" value={form.units_needed} onChange={e => setForm(f => ({ ...f, units_needed: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Urgency</label>
                <select className="form-select" value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical 🚨</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Hospital *</label>
              <input className="form-input" value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))} placeholder="Hospital name" />
            </div>
            <div className="form-group">
              <label className="form-label">Island *</label>
              <CitySelect value={form.city} onChange={city => setForm(f => ({ ...f, city }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Message (optional)</label>
              <textarea className="form-textarea" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Additional information…" />
            </div>
            <button className="btn btn-primary btn-block" onClick={submit} disabled={submitting}>
              {submitting ? 'Posting…' : 'Post Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
