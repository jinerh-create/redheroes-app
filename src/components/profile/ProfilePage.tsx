import { useState, useEffect, useRef } from 'react';
import Avatar from '../shared/Avatar';
import BloodBadge from '../shared/BloodBadge';
import RankBadge from '../shared/RankBadge';
import type { User } from '../../lib/types';
import { RANKS } from '../../lib/types';

interface Props { profileId?: string; user: User; }

export default function ProfilePage({ profileId, user }: Props) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [available, setAvailable] = useState(true);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const isMe = profileId === user.id;

  useEffect(() => {
    fetch(`/api/users/${profileId}`).then(r => r.json()).then(data => {
      setProfile(data);
      setAvailable(!!data.is_available);
    }).finally(() => setLoading(false));
  }, [profileId]);

  async function toggleAvailability() {
    const newVal = !available;
    setAvailable(newVal);
    await fetch(`/api/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_available: newVal }) });
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg('Uploading…');
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const r = await fetch(`/api/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_b64: base64 }) });
      if (r.ok) {
        setUploadMsg('Updated!');
        setProfile(p => p ? { ...p, avatar_b64: base64 } : p);
        setTimeout(() => setUploadMsg(''), 2000);
      } else setUploadMsg('Failed');
    };
    reader.readAsDataURL(file);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  if (loading) return <div className="spinner" />;
  if (!profile) return <div className="empty-state"><div className="empty-state-icon">❌</div><h3>User not found</h3></div>;

  const rankInfo = RANKS.find(r => r.name === profile.rank) ?? RANKS[0];
  const nextRank = RANKS.find(r => r.min > profile.donations_count);
  const joinDate = new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="page">
      {/* Profile header */}
      <div className="hero-banner" style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.875rem' }}>
          <Avatar name={profile.name} avatar_b64={profile.avatar_b64} size="xl" />
          {isMe && (
            <>
              <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--red)', border: '2px solid var(--bg)', color: 'white', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </>
          )}
        </div>
        {uploadMsg && <div style={{ color: 'var(--green)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{uploadMsg}</div>}
        <h2 style={{ marginBottom: '0.375rem' }}>{profile.name}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <BloodBadge type={profile.blood_type} />
          <RankBadge rank={profile.rank} />
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {profile.city} · Joined {joinDate}</div>

        {/* Rank progress */}
        {nextRank && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: '0.375rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <span>Progress to {nextRank.icon} {nextRank.name}</span>
              <span>{nextRank.min - profile.donations_count} more</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(100, (profile.donations_count / nextRank.min) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stat-row" style={{ marginBottom: '1rem' }}>
        <div className="stat-box">
          <div className="stat-val">{profile.donations_count}</div>
          <div className="stat-label">Donations</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{profile.lives_saved}</div>
          <div className="stat-label">Lives</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{rankInfo.icon}</div>
          <div className="stat-label">{profile.rank}</div>
        </div>
      </div>

      {/* Availability toggle (own profile) */}
      {isMe && (
        <div className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700 }}>Available to Donate</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Show up in search results</div>
          </div>
          <button onClick={toggleAvailability} style={{ width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: available ? 'var(--green)' : 'var(--surface2)', transition: 'background 0.2s', position: 'relative' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 4, transition: 'left 0.2s', left: available ? 24 : 4 }} />
          </button>
        </div>
      )}

      {/* Contact / Message buttons */}
      {!isMe && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <a href={`/chat?with=${profile.id}`} className="btn btn-primary" style={{ flex: 1 }}>💬 Message</a>
          {profile.phone && <a href={`tel:${profile.phone}`} className="btn btn-secondary" style={{ flex: 1 }}>📞 Call</a>}
        </div>
      )}

      {/* Rank milestones */}
      <div className="section-label">Rank Milestones</div>
      <div className="card">
        {RANKS.map(r => {
          const reached = profile.donations_count >= r.min;
          return (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', opacity: reached ? 1 : 0.4 }}>
              <span style={{ fontSize: '1.25rem' }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: r.color }}>{r.name}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{r.description}</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.min}+</span>
              {reached && <span style={{ color: 'var(--green)', fontSize: '1rem' }}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Log donation (own profile) */}
      {isMe && <LogDonation user={user} />}

      {/* Logout */}
      {isMe && (
        <button className="btn btn-ghost btn-block" onClick={logout} style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Sign Out</button>
      )}
    </div>
  );
}

function LogDonation({ user }: { user: User }) {
  const [show, setShow] = useState(false);
  const [hospital, setHospital] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!hospital) { setMsg('Hospital is required'); return; }
    setSaving(true); setMsg('');
    try {
      const r = await fetch('/api/donations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hospital }) });
      if (r.ok) { setMsg('Donation logged! Thank you hero 🩸'); setHospital(''); setTimeout(() => { setShow(false); setMsg(''); window.location.reload(); }, 2000); }
      else { const d = await r.json(); setMsg(d.error ?? 'Failed'); }
    } finally { setSaving(false); }
  }

  return (
    <>
      <button className="btn btn-primary btn-block" onClick={() => setShow(true)} style={{ marginTop: '1rem' }}>🩸 Log a Donation</button>
      {show && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShow(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h3 style={{ marginBottom: '1rem' }}>Log Blood Donation</h3>
            {msg && <div className={`alert ${msg.includes('Thank') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}
            <div className="form-group">
              <label className="form-label">Hospital / Blood Bank *</label>
              <input className="form-input" value={hospital} onChange={e => setHospital(e.target.value)} placeholder="Where you donated" />
            </div>
            <button className="btn btn-primary btn-block" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Record Donation'}</button>
          </div>
        </div>
      )}
    </>
  );
}
