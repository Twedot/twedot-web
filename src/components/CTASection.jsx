import { useState } from 'react';
import { useInView } from '../hooks/useInView';

// Matches Bolt's "Download our apps" section exactly: full-bleed dark band,
// a tilted phone mockup with a grid of app icons on the left, and on the
// right a small tab toggle above a headline, subtext, and a single button.
const TABS = {
  chat: {
    label: 'Chat',
    heading: 'The fast, private way to message.',
    sub: 'Available for Android. End-to-end encrypted, always.',
  },
  book: {
    label: 'Book',
    heading: 'The fast, affordable way to get things done.',
    sub: 'Post a request and get real bids from nearby vendors in minutes.',
  },
};

export default function CTASection() {
  const [ref, inView] = useInView(0.2);
  const [tab, setTab] = useState('chat');
  const active = TABS[tab];

  return (
    <section id="download" style={{ background: '#0a0010', padding: 'clamp(72px, 10vw, 120px) 24px' }}>
      <div ref={ref} className={`reveal ${inView ? 'visible' : ''} cta-split`} style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64 }}>

        {/* Tilted phone with app icon grid */}
        <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 260, background: 'linear-gradient(160deg,#1a1330,#0a0010)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 32,
            padding: 26, transform: 'rotate(-6deg)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {[
                { label: 'Twedot', bg: '#7c3aed' },
                { label: 'Chat', bg: '#4c1d95' },
                { label: 'Vendors', bg: '#22c55e' },
                { label: 'Requests', bg: '#3b82f6' },
              ].map(icon => (
                <div key={icon.label} style={{ textAlign: 'center' }}>
                  <div style={{ width: '100%', aspectRatio: '1', borderRadius: 16, background: icon.bg, marginBottom: 8 }} />
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{icon.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs + copy + CTA */}
        <div style={{ flex: '1 1 380px' }}>
          <div style={{ display: 'inline-flex', gap: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 4, marginBottom: 26 }}>
            {Object.entries(TABS).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: 700, fontSize: 13.5, padding: '9px 20px', borderRadius: 7,
                  background: tab === key ? '#fff' : 'transparent',
                  color: tab === key ? '#0a0010' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 800, lineHeight: 1.1, color: '#fff', marginBottom: 18 }}>
            {active.heading}
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
            {active.sub}
          </p>
          <a
            href="https://play.google.com/store/apps/details?id=com.twedot&pli=1"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-hero-white"
            style={{ display: 'inline-flex', textDecoration: 'none' }}
          >
            Get Twedot
          </a>
        </div>
      </div>
    </section>
  );
}
