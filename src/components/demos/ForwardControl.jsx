import { useState, useEffect } from 'react';

export default function ForwardControl({ active }) {
  const [step, setStep] = useState(0);
  const [protected_, setProtected] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (!active) {
      setStep(0);
      setProtected(false);
      setShowNotif(false);
      return;
    }

    setStep(0);
    setProtected(false);
    setShowNotif(false);

    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2000),
      setTimeout(() => setStep(3), 3200),
      setTimeout(() => setShowNotif(true), 4000),
      setTimeout(() => { setShowNotif(false); setStep(4); }, 5600),
      setTimeout(() => { setStep(0); setProtected(false); }, 7800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  const handleProtect = () => {
    setProtected(true);
    setShowNotif(false);
    setTimeout(() => { setProtected(false); setStep(0); }, 2000);
  };

  const box = { background: 'var(--bg-card)', borderRadius: 14, padding: 12, flex: 1, border: '1px solid var(--border)' };
  const label = { color: 'var(--purple)', fontWeight: 700, fontSize: 11, marginBottom: 7 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Protection notification */}
      <div style={{ overflow: 'hidden', maxHeight: showNotif ? 60 : 0, transition: 'max-height 0.4s ease', opacity: showNotif ? 1 : 0 }}>
        <div style={{ background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 12, padding: '9px 18px', color: '#fff', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}>
          <span>🔒 Protected – can't be shared or screenshot</span>
          <button onClick={handleProtect} style={{ background: '#7c3aed', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, color: '#fff', fontWeight: 700, cursor: 'pointer', padding: '3px 10px', fontSize: 11, marginLeft: 10 }}>Protect</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={box}>
          <div style={label}>👤 You</div>
          {step >= 1 && (
            <div style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', borderRadius: '12px 12px 4px 12px', padding: '7px 10px', color: '#fff', fontSize: 11, animation: 'fadeIn 0.4s ease' }}>
              Hey! Check this out 🔥
              {protected_ && <div style={{ color: '#c4b5fd', fontSize: 9, marginTop: 3 }}>🔒 Protected from all</div>}
            </div>
          )}
          {step >= 3 && !protected_ && <div style={{ color: '#fca5a5', fontSize: 9, marginTop: 4 }}>⚠️ Forwarded by Caleb</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', color: 'var(--purple)', fontSize: 20, gap: 4 }}>
          {step >= 2 && <span style={{ animation: 'fadeIn 0.4s ease' }}>→</span>}
          {step >= 3 && <span style={{ animation: 'fadeIn 0.4s ease', color: '#facc15' }}>→</span>}
        </div>
        <div style={box}>
          <div style={label}>👤 Caleb</div>
          {step >= 2 && (
            <div style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 4px', padding: '7px 10px', color: 'var(--text)', fontSize: 11, animation: 'fadeIn 0.4s ease' }}>
              <div style={{ color: '#facc15', fontSize: 9 }}>↗ Forwarded</div>
              Hey! Check this out 🔥
              {protected_ && <div style={{ color: '#c4b5fd', fontSize: 9, marginTop: 3 }}>🔒 Protected</div>}
            </div>
          )}
          {step >= 3 && !protected_ && <div style={{ color: '#facc15', fontSize: 9, marginTop: 2 }}>⚠️ Forwarded to Sam</div>}
        </div>
      </div>

      <div style={{ overflow: 'hidden', maxHeight: step >= 3 ? 120 : 0, transition: 'max-height 0.4s ease', opacity: step >= 3 ? 1 : 0 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 12, border: '1px solid rgba(250,204,21,0.25)', animation: step >= 3 ? 'fadeIn 0.4s ease' : 'none' }}>
          <div style={{ color: '#facc15', fontWeight: 700, fontSize: 11, marginBottom: 5 }}>👤 Sam (3rd party)</div>
          <div style={{ background: 'var(--bg-container)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '12px 12px 12px 4px', padding: '7px 10px', color: 'var(--text)', fontSize: 11 }}>
            <div style={{ color: '#facc15', fontSize: 9 }}>↗↗ Forwarded chain</div>
            Hey! Check this out 🔥
            {protected_ && <div style={{ color: '#c4b5fd', fontSize: 9, marginTop: 3 }}>🔒 Protected</div>}
          </div>
        </div>
      </div>

      {/* Protected chat badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 0', opacity: 0.7 }}>
        <span style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 600 }}>🔒 Protected chat · Can't be shared or screenshot</span>
      </div>
    </div>
  );
}