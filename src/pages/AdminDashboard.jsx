import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import { getConversations, getConversationWithUser } from '../services/chat';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const loadConversations = () => {
    getConversations().then(setConversations).catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socket.emit('chat_identify', { userId: user.id, isAdmin: true });

    socket.on('chat_new_message', (msg) => {
      loadConversations();
      setSelectedUser(current => {
        if (current && msg.user_id === current.user_id) {
          setMessages(prev => [...prev, msg]);
        }
        return current;
      });
    });

    socket.on('chat_message', (msg) => {
      setMessages(prev => {
        if (selectedUser && msg.user_id === selectedUser.user_id) {
          return [...prev, msg];
        }
        return prev;
      });
    });

    loadConversations();

    return () => {
      socket.off('chat_new_message');
      socket.off('chat_message');
    };
  }, [user, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (conv) => {
    setSelectedUser(conv);
    const msgs = await getConversationWithUser(conv.user_id);
    setMessages(msgs);
    loadConversations(); // refresh unread counts
  };

  const handleSend = () => {
    if (!input.trim() || !selectedUser) return;
    const socket = getSocket();
    socket.emit('chat_send_admin_message', { userId: selectedUser.user_id, body: input.trim() });
    setInput('');
  };

  return (
    <div className="page-reveal" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Conversation list */}
      <div
        className="admin-conversation-list"
        style={{
          width: 300, borderRight: '1px solid var(--line)', background: '#fff',
          display: selectedUser ? 'none' : 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ padding: 20, borderBottom: '1px solid var(--line)' }}>
          <div className="mono-label" style={{ letterSpacing: '0.1em' }}>SAFETRACE ADMIN</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <h2 style={{ fontSize: 18 }}>Conversations</h2>
            <button onClick={logout} style={{ fontSize: 13, background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer' }}>
              Log out
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 && (
            <p style={{ padding: 20, color: 'var(--ink-soft)', fontSize: 14 }}>No conversations yet.</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.user_id}
              onClick={() => openConversation(conv)}
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--line)',
                cursor: 'pointer',
                background: selectedUser?.user_id === conv.user_id ? 'var(--stone)' : '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{conv.name}</div>
                {conv.unread_count > 0 && <span className="unread-dot">{conv.unread_count}</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{conv.phone_number}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {conv.last_message}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message thread */}
      <div
        className="admin-thread"
        style={{
          flex: 1, display: (!selectedUser && window.innerWidth < 768) ? 'none' : 'flex',
          flexDirection: 'column'
        }}
      >
        {!selectedUser ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
            Select a conversation to view messages
          </div>
        ) : (
          <>
            <div style={{ padding: 20, borderBottom: '1px solid var(--line)', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setSelectedUser(null)}
                className="admin-back-btn"
                style={{ background: 'var(--stone)', border: 'none', borderRadius: '50%', width: 34, height: 34, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                ←
              </button>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{selectedUser.name}</div>
                <div className="mono-label">{selectedUser.phone_number} · {selectedUser.category}</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map((m) => (
                <div key={m.id} className={`chat-bubble ${m.sender === 'admin' ? 'mine' : 'theirs'}`}>
                  {m.body}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-row" style={{ borderTop: '1px solid var(--line)' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Reply…"
              />
              <button onClick={handleSend}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
