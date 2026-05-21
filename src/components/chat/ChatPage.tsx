import { useState, useEffect, useRef } from 'react';
import Avatar from '../shared/Avatar';
import BloodBadge from '../shared/BloodBadge';
import type { User, Message } from '../../lib/types';

interface Props { user: User; }

interface ConvItem { other_id: string; other_name: string; avatar_b64?: string; blood_type: string; last_msg: string; last_time: string; unread: number; }

export default function ChatPage({ user }: Props) {
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function loadConversations() {
    fetch('/api/messages').then(r => r.json()).then(setConversations);
  }

  function loadMessages(otherId: string) {
    fetch(`/api/messages?with=${otherId}`).then(r => r.json()).then(data => {
      setMessages(Array.isArray(data) ? data : []);
    });
  }

  async function send() {
    if (!input.trim() || !activeId) return;
    setSending(true);
    try {
      await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_id: activeId, body: input.trim() }) });
      setInput('');
      loadMessages(activeId);
      loadConversations();
    } finally { setSending(false); }
  }

  function timeStr(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const activeConv = conversations.find(c => c.other_id === activeId);

  if (activeId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 60px)' }}>
        {/* Chat header */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--surface)' }}>
          <button onClick={() => setActiveId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}>←</button>
          <Avatar name={activeConv?.other_name ?? ''} avatar_b64={activeConv?.avatar_b64} size="sm" />
          <div>
            <div style={{ fontWeight: 700 }}>{activeConv?.other_name}</div>
            <BloodBadge type={activeConv?.blood_type ?? ''} />
          </div>
          <a href={`/profile/${activeId}`} style={{ marginLeft: 'auto', color: 'var(--red)', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>Profile</a>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {messages.length === 0 ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-state-icon">💬</div>
              <p>Start the conversation</p>
            </div>
          ) : (
            messages.map(msg => {
              const isOut = msg.from_id === user.id;
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOut ? 'flex-end' : 'flex-start' }}>
                  <div className={`msg-bubble ${isOut ? 'msg-out' : 'msg-in'}`}>{msg.body}</div>
                  <span className="msg-time" style={{ marginBottom: '0.25rem', paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>{timeStr(msg.sent_at)}</span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', background: 'var(--bg)' }}>
          <input
            className="form-input"
            placeholder="Type a message…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={send} disabled={sending || !input.trim()} style={{ flexShrink: 0 }}>Send</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="section-label">Conversations</div>
      {conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h3>No messages yet</h3>
          <p>Find a donor and start chatting</p>
          <a href="/find" className="btn btn-primary" style={{ marginTop: '1rem' }}>Find Donors</a>
        </div>
      ) : (
        conversations.map(conv => (
          <button
            key={conv.other_id}
            className="donor-card"
            onClick={() => setActiveId(conv.other_id)}
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none', background: 'var(--surface)' }}
          >
            <Avatar name={conv.other_name} avatar_b64={conv.avatar_b64} size="md" />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700 }}>{conv.other_name}</span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{new Date(conv.last_time).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '0.5rem' }}>{conv.last_msg}</span>
                {conv.unread > 0 && (
                  <span style={{ background: 'var(--red)', color: 'white', fontSize: '0.625rem', fontWeight: 900, padding: '2px 6px', borderRadius: 10, flexShrink: 0 }}>{conv.unread}</span>
                )}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
