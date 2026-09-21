import { useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const OVERVIEW = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1 3 2.2c0 2.8-6 1.3-6 4.1 0 1.3 1.3 2.2 3 2.2s3-1.1 3-2.5" />
      </svg>
    ),
    title: 'What Are Twedot Credits',
    body: 'Twedot Credits are the in-app currency used to boost your posts. 1 Twedot Credit = ₦3, and they only ever spend on boosting — nothing else on Twedot costs Credits.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" />
      </svg>
    ),
    title: 'How You Get Them',
    body: 'Buy Credits any time from your Wallet inside the app — enter how many you want, pay securely through Paystack, and your balance updates instantly.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M4 21v-7M4 10V3M12 21v-11M12 6V3M20 21v-5M20 12V3" /><path d="M1 14h6M9 6h6M17 16h6" />
      </svg>
    ),
    title: 'What Boosting Does',
    body: 'Boosting spends Credits to put your post in front of more people than it would reach on its own — a "Promoted" tag shows it was boosted, same as any ads platform.',
  },
];

const STEPS = [
  {
    title: 'Duration',
    content: (
      <>
        <p>Every boost runs for a set number of days — from 1 day up to 30. This is the main thing that decides your total cost: the base rate is <strong>399 Credits per day</strong>, and that scales up directly with how many days you choose.</p>
        <p>You can adjust the duration at any point while setting up a boost, and the price updates live as you do.</p>
      </>
    ),
  },
  {
    title: 'Audience',
    content: (
      <>
        <p>Choose how wide your boost reaches:</p>
        <ul>
          <li><strong>Automatic</strong> — Twedot targets people near you. The default, and the cheapest option.</li>
          <li><strong>City</strong> — One or more cities you choose.</li>
          <li><strong>Country</strong> — One or more countries you choose.</li>
        </ul>
        <p>A wider audience costs a little more per day than Automatic, since it puts your post in front of more people.</p>
      </>
    ),
  },
  {
    title: 'Targeting',
    content: (
      <>
        <p>Optionally narrow who's likely to see your boosted post by category — Fashion, Food, Technology, Beauty, and more — or add your own category if what you're promoting isn't in the list. Targeting is entirely optional; leaving it off reaches the broadest slice of your chosen audience.</p>
      </>
    ),
  },
  {
    title: 'Estimated Reach',
    content: (
      <>
        <p>Every boost shows an estimated number of people it's likely to reach — and unlike a plain readout, this number is <strong>editable</strong>. Pushing it up asks for a bigger boost and increases the cost to match; pulling it down does the opposite. It's a direct lever, not just a forecast.</p>
      </>
    ),
  },
  {
    title: 'Cost',
    content: (
      <>
        <p>Your final price is the 399 Credits/day base rate, multiplied by duration, then adjusted by your audience, targeting, and estimated reach choices. The full breakdown is always shown before you confirm — there's never a hidden charge.</p>
      </>
    ),
  },
  {
    title: 'Where Boosted Posts Show Up',
    content: (
      <>
        <p>A boosted post carries a small <strong>"Promoted"</strong> tag so it's always clear to viewers that it was paid distribution, and it's shown to more people across Twedot for as long as the boost is active. Boosting never changes how a post looks otherwise — same photo/video, same caption, same comments and likes.</p>
      </>
    ),
  },
];

export default function CreditsAdsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Twedot Credits & Ads — Twedot';
    return () => { document.title = 'Twedot'; };
  }, []);

  return (
    <>
      <Nav />

      {/* ── Page header ── */}
      <section style={{ padding: 'clamp(120px, 14vw, 160px) clamp(24px, 6vw, 80px) clamp(48px, 6vw, 80px)', background: 'transparent' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 24, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ads &amp; Marketing</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 7vw, 88px)', fontWeight: 800,
          lineHeight: 1.05, letterSpacing: '0px', textTransform: 'uppercase',
          color: 'var(--text)', maxWidth: 820,
        }}>
          TWEDOT CREDITS<br />
          <span style={{ color: 'var(--purple)' }}>& HOW BOOSTING WORKS.</span>
        </h1>

        <p style={{ fontSize: 17, color: 'var(--text-muted)', marginTop: 24, maxWidth: 560, lineHeight: 1.8 }}>
          Twedot Credits are how you pay to reach more people. Here's exactly what they are, how they're priced, and what your Credits actually buy.
        </p>
      </section>

      {/* ── Overview cards ── */}
      <section style={{ padding: '0 clamp(24px, 6vw, 80px) clamp(80px, 10vw, 120px)', background: 'transparent' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {OVERVIEW.map((v, i) => (
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

      {/* ── How it works — numbered sections, same pattern as the Privacy/Terms pages ── */}
      <section style={{ padding: '0 clamp(24px, 6vw, 80px) clamp(48px, 6vw, 80px)', background: 'transparent' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 24, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>The Details</span>
          </div>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 48px)', fontWeight: 800,
            textTransform: 'uppercase', color: 'var(--text)', marginBottom: 40,
          }}>
            HOW BOOSTING WORKS
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="legal-section-row"
                style={{
                  display: 'flex', gap: 56, alignItems: 'flex-start',
                  padding: '36px 0',
                  borderTop: '1px solid var(--border-sub)',
                }}
              >
                <div className="legal-sidebar" style={{ width: 200, flexShrink: 0 }}>
                  <span style={{
                    display: 'block', fontSize: 11, fontWeight: 700,
                    color: 'var(--purple)', opacity: 0.55,
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 style={{
                    fontSize: 16, fontWeight: 800, color: 'var(--text)',
                    lineHeight: 1.3, letterSpacing: '-0.2px',
                  }}>
                    {s.title}
                  </h3>
                </div>

                <div style={{ flex: 1, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.9 }}>
                  <style>{`
                    .credits-content p { margin-bottom: 12px; }
                    .credits-content p:last-child { margin-bottom: 0; }
                    .credits-content strong { color: var(--text); font-weight: 700; }
                    .credits-content ul { padding-left: 20px; margin-bottom: 12px; }
                    .credits-content li { margin-bottom: 6px; }
                  `}</style>
                  <div className="credits-content">{s.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing note ── */}
      <section style={{ padding: '0 clamp(24px, 6vw, 80px) clamp(64px, 8vw, 100px)', background: 'transparent' }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '24px 28px',
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, margin: 0 }}>
            Estimated reach is exactly that — an estimate, not a guarantee, the same as on any ads platform. Credits are spent only when you confirm a boost, and the full price is always shown up front before you do.
          </p>
        </div>
      </section>

      {/* ── Closing CTA — same dark band + button as the landing page's download section ── */}
      <section style={{ background: '#0a0010', padding: 'clamp(56px, 8vw, 96px) 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.15, color: '#fff', marginBottom: 16 }}>
          Ready to reach more people?
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 32 }}>
          Get Twedot, post, and boost from your Wallet whenever you're ready.
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
      </section>

      <Footer />
    </>
  );
}
