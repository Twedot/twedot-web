import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = 'https://prodapi.twedot.com/api/v1';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.twedot';
const APP_STORE  = 'https://apps.apple.com/app/twedot/id6744031056';

function getStoreLink() {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return APP_STORE;
  return PLAY_STORE;
}

export default function UserLinkPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('opening'); // opening | download | error
  const [resolvedUserId, setResolvedUserId] = useState(null);

  useEffect(() => {
    if (!token) { setStatus('error'); return; }

    // Resolve token → userId. If it looks like a UUID (old-format link), use it directly.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const resolveUserId = UUID_RE.test(token)
      ? Promise.resolve(token)
      : fetch(`${API_BASE}/users/invite/${token}`)
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(body => {
            const uid = body?.data?.userId;
            if (!uid) return Promise.reject();
            return uid;
          });

    resolveUserId
      .then(userId => {
        setResolvedUserId(userId);
        window.location.href = `twedot://chat/${userId}`;
        setTimeout(() => setStatus('download'), 1500);
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const handleDownload = () => {
    window.location.href = getStoreLink();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#08000f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(124,58,237,0.4)',
        }}>
          <span style={{ fontSize: 36 }}>T</span>
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Twedot</span>
      </div>

      {status === 'opening' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid rgba(124,58,237,0.2)',
              borderTopColor: '#7c3aed',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Opening Twedot…</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            Taking you straight to the chat
          </p>
        </div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Link not found</p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 40 }}>
            This invite link is invalid or has expired.
          </p>
          <button onClick={handleDownload} style={{
            width: '100%', padding: '16px 24px',
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            border: 'none', borderRadius: 14, color: '#fff',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
          }}>
            Download Twedot
          </button>
        </div>
      )}

      {status === 'download' && (
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>
            You need Twedot to open this link
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 40 }}>
            Chat, discover services, and connect with people nearby — all in one place.
          </p>

          <button onClick={handleDownload} style={{
            width: '100%', padding: '16px 24px',
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            border: 'none', borderRadius: 14, color: '#fff',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            marginBottom: 16,
            boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
          }}>
            Download Twedot
          </button>

          <button
            onClick={() => resolvedUserId && (window.location.href = `twedot://chat/${resolvedUserId}`)}
            style={{
              width: '100%', padding: '14px 24px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14, color: 'rgba(255,255,255,0.5)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            I already have the app
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
