import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import { getMyMessages } from '../services/chat';

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socket.emit('chat_identify', { userId: user.id, isAdmin: false });

    socket.on('chat_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      if (msg.sender === 'admin' && !open) {
        setUnread(u => u + 1);
      }
    });

    return () => socket.off('chat_message');
  }, [user, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      getMyMessages().then(setMessages).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const socket = getSocket();
    socket.emit('chat_send_user_message', { userId: user.id, body: input.trim() });
    setInput('');
  };

  if (!user) return null;

  return (
    <>
      {!open && (
        <button className="chat-fab" onClick={() => setOpen(true)}>
          💬
          {unread > 0 && (
            <span className="unread-dot" style={{ position: 'absolute', top: -4, right: -4 }}>{unread}</span>
          )}
        </button>
      )}

      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>SafeTrace Support</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>We're here if you need help</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <p style={{ color: 'var(--ink-soft)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
                Send a message if you have a concern or emergency question.
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.sender === 'user' ? 'mine' : 'theirs'}`}>
                {m.body}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message…"
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
