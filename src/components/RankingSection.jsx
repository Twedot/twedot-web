import { useInView } from '../hooks/useInView';

// Was "What's New" (a feature-announcement card grid) — replaced per explicit
// direction: this should read as a standing explainer of Rank, not a "new feature"
// callout, and should match the rest of the site's plain centered-text section
// pattern (see LatestFeature.jsx) instead of a card/grid layout. Moved to sit right
// before CTASection ("Join Twedot") — the last real content section on the page.
export default function RankingSection() {
  const [ref, inView] = useInView(0.15);

  return (
    <section style={{ background: 'var(--bg)', padding: 'clamp(72px, 9vw, 110px) 24px' }}>
      <div ref={ref} className={`reveal ${inView ? 'visible' : ''}`} style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>
          Ranking
        </div>
        <h2 style={{ fontSize: 'clamp(32px, 5.5vw, 56px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1, marginBottom: 20 }}>
          Your Rank grows from being active on Twedot.
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>
          Chatting, posting, commenting, showing up — it all counts. Your Rank badge is
          visible on your profile and grows purely from real activity, no purchases involved.
        </p>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Reach the top tier and your videos start earning qualified views, tracked live
          on your in-app Wallet.
        </p>

        <div style={{ marginTop: 32 }}>
          <a href="/withdraw-earnings" className="btn-outline" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            See how ranking &amp; earning works
          </a>
        </div>
      </div>
    </section>
  );
}
