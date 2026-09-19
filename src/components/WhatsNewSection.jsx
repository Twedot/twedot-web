import { useInView } from '../hooks/useInView';

// "What's new" grid — icon + title + short desc cards, same reveal-on-scroll
// pattern as the rest of the landing page. Sits between the feature band and the
// video-stories showcase, calling out this cycle's additions specifically
// (hashtags/mentions/location tagging on posts, the Rank system, profile-view
// alerts, and earning tied to Rank) rather than re-describing the whole app.
const ITEMS = [
  {
    icon: '#',
    title: 'Hashtags & mentions',
    desc: 'Tag a post with hashtags so it turns up in Search, and mention a specific contact directly on your posts.',
  },
  {
    icon: '📍',
    title: 'Tag your location',
    desc: 'Add a real place to a post so people nearby can discover it — your exact coordinates are never shown.',
  },
  {
    icon: '🏆',
    title: 'Your Rank, front and centre',
    desc: 'A visible Rank badge that grows purely from being active — chatting, posting, commenting, showing up.',
  },
  {
    icon: '👁',
    title: 'See who viewed your profile',
    desc: 'Get notified when someone checks out your profile, plus a running count of your total profile views.',
  },
  {
    icon: '💰',
    title: 'Earn as you rank up',
    desc: 'Reach the top tier and your videos start earning qualified views — tracked live on your in-app Wallet.',
  },
];

function Card({ item, i, inView }) {
  return (
    <div
      className={`reveal ${inView ? 'visible' : ''}`}
      style={{
        transitionDelay: `${i * 60}ms`,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '32px 28px',
        textAlign: 'left',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'rgba(124,58,237,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, marginBottom: 18,
      }}>
        {item.icon}
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.2px' }}>
        {item.title}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        {item.desc}
      </div>
    </div>
  );
}

export default function WhatsNewSection() {
  const [ref, inView] = useInView(0.15);

  return (
    <section style={{ background: 'var(--bg)', padding: 'clamp(72px, 9vw, 110px) 24px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div ref={ref} className={`reveal ${inView ? 'visible' : ''}`} style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>
            What's new
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 5.5vw, 56px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1, marginBottom: 16 }}>
            Twedot just got a lot more useful.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Fresh this update: real discovery tools for your posts, a Rank that actually
            means something, and your first path to earning on the platform.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginTop: 56,
        }}>
          {ITEMS.map((item, i) => <Card key={item.title} item={item} i={i} inView={inView} />)}
        </div>

        <div style={{ textAlign: 'center', marginTop: 44 }}>
          <a href="/withdraw-earnings" className="btn-outline" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            See how ranking & earning works
          </a>
        </div>
      </div>
    </section>
  );
}
