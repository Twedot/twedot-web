import { useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const MASTHEAD = [
  {
    name: 'Prince R.',
    role: 'Founder · Software Engineer',
    avatar: '/avatars/michael.png',
    accent: '#7c3aed',
  },
  {
    name: 'Charles S.',
    role: 'Co-founder · Director of Publicity',
    avatar: '/avatars/charles.png',
    accent: '#5b21b6',
  },
  {
    name: 'Caleb U.',
    role: 'Co-founder · Software Engineer',
    avatar: '/avatars/chris.png',
    accent: '#6d28d9',
  },
];

const VALUES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Privacy First',
    body: "Your conversations are yours. End-to-end encrypted, always. We don't read, sell, or share your data.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'Local First',
    body: 'Built for every street and every neighbourhood, anywhere in the world. Real people, real commerce, real connections.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Community Driven',
    body: 'Every feature we build comes from listening to our users — vendors, buyers, and everyday people.',
  },
];

export default function AboutPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <Nav />

      {/* ── Page header ── */}
      <section style={{ padding: 'clamp(120px, 14vw, 160px) clamp(24px, 6vw, 80px) clamp(48px, 6vw, 80px)', background: 'transparent' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 24, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>About Us</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 7vw, 88px)', fontWeight: 800,
          lineHeight: 1.05, letterSpacing: '0px', textTransform: 'uppercase',
          color: 'var(--text)', maxWidth: 800,
        }}>
          BUILDING THE<br />
          <span style={{ color: 'var(--purple)' }}>FUTURE OF LOCAL.</span>
        </h1>

        <p style={{ fontSize: 17, color: 'var(--text-muted)', marginTop: 24, maxWidth: 520, lineHeight: 1.8 }}>
          Twedot was built by people who believe your neighbourhood is your greatest untapped network.
        </p>
      </section>

      {/* ── Masthead ── */}
      <section style={{ padding: '0 clamp(24px, 6vw, 80px) clamp(80px, 10vw, 120px)', background: 'transparent' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 24, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>The Masthead</span>
          </div>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 800,
            textTransform: 'uppercase', color: 'var(--text)', marginBottom: 56,
          }}>
            MEET THE TEAM
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40 }}>
            {MASTHEAD.map((m, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: 'rgba(245,242,255,0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: `0 8px 40px ${m.accent}28, 0 0 0 4px ${m.accent}18`,
                    flexShrink: 0,
                  }}>
                    <img
                      src={m.avatar}
                      alt={m.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 6 }}>
                  {m.name}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: m.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {m.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section style={{ padding: 'clamp(48px, 6vw, 80px) clamp(24px, 6vw, 80px)', background: 'transparent' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 24, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>What We Stand For</span>
          </div>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 800,
            letterSpacing: '0px', textTransform: 'uppercase',
            color: 'var(--text)', marginBottom: 48,
          }}>
            OUR VALUES
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {VALUES.map((v, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: '28px 24px',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--purple-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--purple)', marginBottom: 16,
                }}>
                  {v.icon}
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>{v.title}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>{v.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom spacer before footer ── */}
      <div style={{ height: 'clamp(64px, 8vw, 100px)' }} />

      <Footer />
    </>
  );
}
