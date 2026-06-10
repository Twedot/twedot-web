import { useState, useEffect } from 'react';

const MSGS = [
  'aG9sbXVlcm9iYXNl','SGVsbG8gV29ybGQ=','dHdlZG90IHNlY3VyZQ==',
  '5Lqs5qCH5a2X5rWL6K+V','MTIzNDU2Nzg5MA==','5a2X5rWL6K+V5Lqs5qCH',
];

const makeInit = () => MSGS.map((text, i) => ({
  id: i, sender: i % 2 === 0 ? 'Prince Randy' : 'Caleb',
  side: i % 2 === 0 ? 'left' : 'right', text, visible: i === 0,
}));

export default function EncryptedChat({ active }) {
  const [messages, setMessages] = useState(makeInit);

  useEffect(() => {
    if (!active) {
      setMessages(makeInit());
      return;
    }

    setMessages(makeInit());

    let idx = 0;
    const iv = setInterval(() => {
      idx = (idx + 1) % MSGS.length;
      if (idx === 0) {
        setMessages(makeInit());
      } else {
        setMessages(ms => ms.map((m, i) => i === idx ? { ...m, visible: true } : m));
      }
    }, 900);

    return () => clearInterval(iv);
  }, [active]);

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔒</div>
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>End-to-End Encrypted</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Nobody can read this. Not even us.</div>
        </div>
      </div>
      {messages.map(msg => (
        <div key={msg.id} style={{ display: 'flex', justifyContent: msg.side === 'right' ? 'flex-end' : 'flex-start', opacity: msg.visible ? 1 : 0, transform: msg.visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s, transform 0.5s' }}>
          <div style={{ maxWidth: '72%', background: msg.side === 'right' ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : 'var(--bg-container)', borderRadius: msg.side === 'right' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '7px 12px', color: 'var(--text)', fontFamily: 'monospace', fontSize: 11, border: msg.side === 'left' ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 9, color: msg.side === 'right' ? '#e0d9ff' : 'var(--purple)', marginBottom: 2 }}>{msg.sender}</div>
            <div style={{ letterSpacing: 2, filter: 'blur(0.4px)', color: msg.side === 'right' ? '#fff' : 'var(--text)' }}>{msg.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
