import { useInView } from '../hooks/useInView';

export default function CTASection() {
  const [ref, inView] = useInView(0.2);

  return (
    <section id="download" className="cta-section" style={{ background: 'transparent', padding: '100px 0', position: 'relative', zIndex: 1 }}>
      <div
        ref={ref}
        className="feat-row"
        style={{ maxWidth: 1100, margin: '0 auto', padding: '0 64px', display: 'flex', alignItems: 'center', gap: 72 }}
      >
        {/* Left: text */}
        <div className={`reveal from-left ${inView ? 'visible' : ''}`} style={{ flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 24, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Download Now</span>
          </div>
          <h2 style={{ fontSize: 'clamp(30px, 5.5vw, 78px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '0px', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 28 }}>
            <span style={{ display: 'block' }}>WE'RE</span>
            <span style={{ display: 'block' }}>WAITING</span>
            <span style={{ display: 'block', color: 'var(--purple)' }}>FOR YOU.</span>
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 40, maxWidth: 420 }}>
            Chat privately with friends and family. Discover vendors right around the corner. Join thousands of Nigerians already on Twedot — for free.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
            <a
              href="https://play.google.com/store/apps/details?id=com.twedot&pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ padding: '16px 44px', fontSize: 16, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Download the App
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.twedot&pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{ padding: '16px 44px', fontSize: 16, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Get on Play Store
            </a>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, opacity: 0.55 }}>iOS · Android · Web · Free to use</div>
        </div>

        {/* Right: phone mockup */}
        <div className={`reveal from-right ${inView ? 'visible delay-1' : ''}`} style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 270, height: 520, borderRadius: 44, background: 'linear-gradient(160deg,#1a0f3d,#221842)', border: '2px solid rgba(124,58,237,0.35)', boxShadow: '0 40px 100px rgba(124,58,237,0.28), inset 0 0 0 1px rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative' }}>
            {/* Notch */}
            <div style={{ width: 84, height: 22, background: '#050310', borderRadius: '0 0 14px 14px', margin: '0 auto' }} />

            {/* Top bar */}
            <div style={{ padding: '8px 14px 10px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>TW</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>Twedot</div>
              <div style={{ marginLeft: 'auto', fontSize: 8, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Connected
              </div>
            </div>

            {/* Chat list */}
            <div style={{ padding: '6px 14px', display: 'flex', flexDirection: 'column' }}>
              {[
                { init: 'AC', name: 'Ade Cobblers',    msg: 'Your shoes are ready! 👟',       time: '2m',  col: '#7c3aed', unread: 1 },
                { init: 'TH', name: 'TechFix Hub',     msg: 'Slot available at 2pm',           time: '8m',  col: '#4c1d95', unread: 0 },
                { init: 'MK', name: "Mama's Kitchen",  msg: 'Jollof rice available now 🍚',    time: '15m', col: '#6d28d9', unread: 2 },
                { init: 'FK', name: 'Fabric Kings',    msg: 'Your suit is done, sir 🎩',       time: '1h',  col: '#5b21b6', unread: 0 },
                { init: 'SB', name: 'Sam Barbers',     msg: 'Book for tomorrow? 💈',           time: '2h',  col: '#7c3aed', unread: 0 },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${c.col},${c.col}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{c.init}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{c.name}</div>
                      <div style={{ fontSize: 8, color: '#a78bfa55' }}>{c.time}</div>
                    </div>
                    <div style={{ fontSize: 9, color: '#a78bfa88', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.msg}</div>
                  </div>
                  {c.unread > 0 && <div style={{ width: 17, height: 17, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 700, flexShrink: 0 }}>{c.unread}</div>}
                </div>
              ))}
            </div>

            {/* Map pill */}
            <div style={{ margin: '8px 14px 0', background: 'rgba(124,58,237,0.15)', borderRadius: 12, padding: '9px 12px', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div style={{ fontSize: 9, color: '#a78bfa', fontWeight: 600, marginBottom: 5 }}>📍 6 vendors near you right now</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['Tailor','Barber','Tech','Food','Plumber','Cobbler'].map((t, i) => (
                  <div key={i} style={{ background: 'rgba(124,58,237,0.25)', borderRadius: 6, padding: '2px 6px', fontSize: 7, color: '#c4b5fd', fontWeight: 600 }}>{t}</div>
                ))}
              </div>
            </div>

            {/* Lock badge */}
            <div style={{ margin: '8px 14px 0', background: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: '6px 10px', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10 }}>🔒</span>
              <span style={{ fontSize: 8, color: '#22c55e', fontWeight: 600 }}>All chats end-to-end encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
