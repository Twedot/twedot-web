import { useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function CareersPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Careers — Twedot';
    return () => { document.title = 'Twedot'; };
  }, []);

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 68, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="careers-inner" style={{ flex: 1, maxWidth: 900, margin: '0 auto', padding: '100px 56px 120px', width: '100%' }}>

          {/* Header */}
          <div style={{ marginBottom: 80 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 20, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Careers</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 76px)', fontWeight: 800,
              letterSpacing: '0px', color: 'var(--text)',
              lineHeight: 1.05, textTransform: 'uppercase', marginBottom: 24,
            }}>
              COME BUILD<br /><span style={{ color: 'var(--purple)' }}>WITH US.</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 500 }}>
              We're a small team building something big — private messaging meets local commerce for the world.
            </p>
          </div>

          {/* No openings card */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '64px 56px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            marginBottom: 80,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.8" width="28" height="28">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
              </svg>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.3px' }}>
              No open roles right now
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 420, margin: '0 auto 32px' }}>
              We don't have any openings at the moment, but we're always growing. Drop your details and we'll reach out when something fits.
            </p>

            <a
              href="mailto:careers@twedot.com"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--purple)', color: '#fff',
                borderRadius: 28, padding: '13px 32px',
                fontWeight: 700, fontSize: 15,
                transition: 'background 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#6d28d9'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--purple)'; e.currentTarget.style.transform = 'none'; }}
            >
              Send us your CV
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Values row */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 32, opacity: 0.6 }}>
              What we care about
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {[
                { icon: '🏠', title: 'Local first', desc: 'Everything we build starts with the Nigerian user and expands outward.' },
                { icon: '🔒', title: 'Privacy by default', desc: 'End-to-end encryption is not a feature — it is the foundation.' },
                { icon: '⚡', title: 'Move fast', desc: 'Small team, big output. We ship, learn, and iterate quickly.' },
                { icon: '🌍', title: 'Global vision', desc: 'One neighbourhood today, the whole world tomorrow. We think long term.' },
              ].map((v, i) => (
                <div
                  key={i}
                  style={{
                    padding: '28px 24px',
                    border: '1px solid var(--border-sub)',
                    borderRadius: 16,
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 14 }}>{v.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.2px' }}>{v.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.75 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
