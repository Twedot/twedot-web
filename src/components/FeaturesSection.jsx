import { useInView } from '../hooks/useInView';
import EncryptedChat from './demos/EncryptedChat';
import ForwardControl from './demos/ForwardControl';
import MapAnimation from './demos/MapAnimation';

const FEATURES = [
  {
    id: 'security',
    label: 'Privacy',
    title: "WE DON'T\nSEE\nANYTHING.",
    subtitle: 'Your conversations are encrypted end-to-end. Not even Twedot can read them. Ever.',
    Demo: EncryptedChat,
    reverse: false,
  },
  {
    id: 'control',
    label: 'Control',
    title: 'CONTROL\nYOUR\nDATA.',
    subtitle: 'Know when your message is forwarded. Protected chats can\'t be shared or screenshot — your privacy stays yours.',
    Demo: ForwardControl,
    reverse: true,
  },
  {
    id: 'discover',
    label: 'Discover',
    title: 'FIND\nVENDORS\nNEAR YOU.',
    subtitle: 'Search for a shoe maker, screen repair, tailor — see them on the map, then chat instantly.',
    Demo: MapAnimation,
    reverse: false,
  },
  {
    id: 'business',
    label: 'Business',
    title: 'GROW\nYOUR\nBUSINESS.',
    subtitle: 'List your service on Twedot. Customers find you by location, view your profile, and message you directly.',
    Demo: BusinessCards,
    reverse: true,
  },
];

function BusinessCards({ active: _active }) {
  const cards = [
    { icon: <PinIcon />,    title: 'Location Listing',  desc: 'Appear on the Twedot map for your neighbourhood',           col: '#7c3aed' },
    { icon: <ChatIcon />,   title: 'Direct Chat',        desc: 'Customers reach you instantly — no middlemen',              col: '#22c55e' },
    { icon: <BookIcon />,   title: 'Book & Purchase',    desc: 'Clients book your service or buy directly — one tap',       col: '#a78bfa' },
    { icon: <BarIcon />,    title: 'Analytics',          desc: 'See who viewed, messaged & booked you today',               col: '#c4b5fd' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {cards.map(c => (
        <div key={c.title} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '18px 16px', border: `1px solid ${c.col}22` }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.col}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.col, marginBottom: 12 }}>{c.icon}</div>
          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.title}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6, opacity: 0.7 }}>{c.desc}</div>
        </div>
      ))}
    </div>
  );
}

function FeatureRow({ feat }) {
  const [ref, inView] = useInView();

  return (
    <section id={feat.id} className="feat-section" style={{ background: 'transparent', padding: '100px 0', position: 'relative', zIndex: 1 }}>
      <div
        ref={ref}
        className="feat-row"
        style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 64px',
          display: 'flex', alignItems: 'center', gap: 72,
          flexDirection: feat.reverse ? 'row-reverse' : 'row',
        }}
      >
        {/* Demo container */}
        <div className={`reveal ${feat.reverse ? 'from-right' : 'from-left'} ${inView ? 'visible' : ''}`} style={{ flex: 1 }}>
          <div className="feat-container" style={{ padding: 32, overflow: 'visible' }}>
            <feat.Demo active={inView} />
          </div>
        </div>

        {/* Text */}
        <div className={`feat-text-col reveal ${feat.reverse ? 'from-left' : 'from-right'} ${inView ? 'visible delay-1' : ''}`} style={{ flex: '0 0 380px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 24, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{feat.label}</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(32px, 5vw, 68px)', fontWeight: 800,
              lineHeight: 1.05, letterSpacing: '0px', textTransform: 'uppercase',
              color: 'var(--text)', marginBottom: 24, whiteSpace: 'pre-line',
            }}
          >
            {feat.title.split('\n').map((line, i, arr) => (
              <span key={i} style={{ display: 'block', color: i === arr.length - 1 ? 'var(--purple)' : 'var(--text)' }}>{line}</span>
            ))}
          </h2>

          <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 32 }}>
            {feat.subtitle}
          </p>

          <a
            href="#"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--purple)', fontWeight: 700, fontSize: 15, transition: 'gap 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.gap = '14px'}
            onMouseLeave={e => e.currentTarget.style.gap = '8px'}
          >
            Learn more <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default function FeaturesSection() {
  return (
    <div id="features">
      {FEATURES.map(f => <FeatureRow key={f.id} feat={f} />)}
    </div>
  );
}

/* ── Inline SVG icons ───────────────────────────────────────────────────── */
function PinIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>;
}
function ChatIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>;
}
function BookIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>;
}
function BarIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>;
}
