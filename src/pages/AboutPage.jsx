import { useEffect } from 'react';
import { Link } from 'react-router-dom';
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

      {/* ── Founder section — text left, large image right ── */}
      <section style={{ padding: '0 clamp(24px, 6vw, 80px) clamp(80px, 10vw, 120px)', background: 'transparent' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(40px, 6vw, 80px)',
          alignItems: 'start',
        }}>

          {/* Left — text content */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 24, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Meet the Founder</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 56px)', fontWeight: 800,
              lineHeight: 1.05, letterSpacing: '0px', textTransform: 'uppercase',
              color: 'var(--text)', marginBottom: 8,
            }}>
              PRINCE RANDY
            </h2>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 32 }}>
              Chief Executive Officer &amp; Founder
            </p>

            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.85, marginBottom: 20 }}>
              Prince Randy is the visionary behind Twedot — an app born from a simple but powerful observation: the people around you have exactly what you need, but there's no private, reliable way to find them or talk to them.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.85, marginBottom: 20 }}>
              Growing up in Lagos, Randy saw how local vendors — shoe makers, electricians, tailors, and food sellers — struggled to reach customers beyond word of mouth, while buyers had no way to discover who was right around the corner.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.85, marginBottom: 40 }}>
              Under his leadership, Twedot launched in December 2025 and is already connecting users across the globe — with ambitions to reach every city in the world.
            </p>

            <blockquote style={{ borderLeft: '3px solid var(--purple)', paddingLeft: 24, marginBottom: 40 }}>
              <p style={{
                fontSize: 'clamp(17px, 2vw, 21px)', fontWeight: 700, fontStyle: 'italic',
                color: 'var(--text)', lineHeight: 1.55, marginBottom: 12,
              }}>
                "Your neighbourhood is your network. Twedot just makes it private."
              </p>
              <cite style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)', fontStyle: 'normal', letterSpacing: '0.05em' }}>
                — Prince Randy
              </cite>
            </blockquote>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href="/#download"
                style={{
                  background: '#7c3aed', color: '#fff',
                  borderRadius: 10, padding: '13px 28px',
                  fontWeight: 800, fontSize: 14,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
              >
                Download the App
              </a>
              <Link
                to="/"
                style={{
                  background: 'var(--purple-dim)', color: 'var(--purple)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, padding: '13px 28px',
                  fontWeight: 800, fontSize: 14,
                }}
              >
                Back to Home
              </Link>
            </div>
          </div>

          {/* Right — large CEO photo */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: 24,
              overflow: 'hidden',
              border: '2px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              aspectRatio: '3/4',
              background: 'var(--bg-card)',
            }}>
              <img
                src="/ceo.jpeg"
                alt="Prince Randy — CEO & Founder of Twedot"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                }}
              />
            </div>

            {/* Floating name badge */}
            <div style={{
              position: 'absolute', bottom: 24, left: 24, right: 24,
              background: 'rgba(10,0,16,0.82)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 14,
              border: '1px solid rgba(124,58,237,0.3)',
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16, color: '#fff', letterSpacing: '-0.3px' }}>Prince Randy</div>
                <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, marginTop: 2 }}>CEO &amp; Founder · Twedot</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#7c3aed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="16" height="14" viewBox="0 0 42 36" fill="none"><path d="M26.5986 0C35.1033 0.00026388 41.9988 6.89476 41.999 15.3994C41.999 23.9043 35.1034 30.7995 26.5986 30.7998H16.4082L5.80957 35.4531C5.54529 35.5691 5.24913 35.3755 5.24902 35.0869V26.9795C2.03162 24.157 0 20.0157 0 15.3994C0.000256501 6.8946 6.89454 0 15.3994 0H26.5986ZM29.0479 7C26.1484 7 23.7979 9.35056 23.7979 12.25C23.7979 12.8524 23.9011 13.4309 24.0879 13.9697L17.8779 16.04C17.1406 14.0326 15.2114 12.6008 12.9482 12.6006C10.0491 12.6008 7.69846 14.9505 7.69824 17.8496C7.69845 20.7488 10.0491 23.0994 12.9482 23.0996C15.8474 23.0994 18.198 20.7487 18.1982 17.8496C18.1982 17.6338 18.1826 17.4209 18.1572 17.2119L24.6143 15.0596C25.5455 16.5255 27.1825 17.5 29.0479 17.5C31.9468 17.4997 34.2976 15.149 34.2979 12.25C34.2979 9.35077 31.947 7.00035 29.0479 7Z" fill="white"/></svg>
              </div>
            </div>
          </div>
        </div>
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
