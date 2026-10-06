import { useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function WithdrawEarningsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Content Monetisation & Withdrawal — Twedot';
    return () => { document.title = 'Twedot'; };
  }, []);

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 68, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', padding: '100px 56px 120px', width: '100%' }}>

          {/* Header */}
          <div style={{ marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 20, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Content Monetisation</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 68px)', fontWeight: 800,
              letterSpacing: '0px', color: 'var(--text)',
              lineHeight: 1.05, textTransform: 'uppercase', marginBottom: 24,
            }}>
              CREATE CONTENT.<br /><span style={{ color: 'var(--purple)' }}>GET PAID.</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 620 }}>
              Twedot's earning system rewards real creators with real money. Build your Rank,
              post videos, accumulate qualified views, and withdraw your balance directly to
              your bank account or mobile money wallet.
            </p>
          </div>

          {/* How it works — steps */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '48px 56px',
            background: 'var(--bg-card)',
            marginBottom: 40,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.3px' }}>
              How content monetisation works
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 32 }}>
              Earning on Twedot is tied to your Rank. Everyone starts at{' '}
              <strong style={{ color: 'var(--text)' }}>Unknown</strong> and climbs through
              named tiers — Known, Noticed, Veteran, Influential, Elite — all the way to{' '}
              <strong style={{ color: 'var(--text)' }}>Supreme</strong> — purely from genuine
              activity: posting, chatting, commenting, liking, watching videos, completing jobs.
              Nothing is purchased.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {[
                {
                  title: 'Reach Supreme — the top tier',
                  desc: 'The moment your account crosses into Supreme, earning eligibility switches on and you receive a one-time welcome credit in your Wallet.',
                },
                {
                  title: 'Post videos and earn qualified views',
                  desc: 'From then on, every video you post can earn "qualified views." A view only counts once someone has genuinely watched at least 60 seconds of a video that is itself at least 60 seconds long. Quick skims and short clips do not qualify.',
                },
                {
                  title: 'Watch your Wallet grow',
                  desc: 'Qualified views and bonuses are tracked in real time on your in-app Wallet page, alongside your Rank progress. You always know exactly where you stand.',
                },
                {
                  title: 'Withdraw when you\'re ready',
                  desc: 'Once your balance reaches the minimum threshold, you can request a withdrawal directly to your Nigerian bank account or mobile money wallet. Withdrawals are processed within 1–3 business days.',
                },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{
                    flexShrink: 0,
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 15, color: 'var(--purple)',
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.2px' }}>{step.title}</div>
                    <div style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.8 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Withdrawal details */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '40px 48px',
            background: 'var(--bg-card)',
            marginBottom: 40,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 24, letterSpacing: '-0.3px' }}>
              Withdrawal details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { label: 'Minimum withdrawal', value: 'Check your Wallet page in-app for the current minimum threshold.' },
                { label: 'Supported methods', value: 'Nigerian bank account transfer · Mobile money wallet' },
                { label: 'Processing time', value: '1–3 business days after a successful withdrawal request.' },
                { label: 'Fees', value: 'No withdrawal fees charged by Twedot. Standard bank or mobile money network charges may apply.' },
                { label: 'Eligibility', value: 'Supreme rank required. Your account must be in good standing with no active policy violations.' },
                { label: 'Identity verification', value: 'A verified phone number and completed profile are required before your first withdrawal.' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', paddingBottom: 18, borderBottom: i < 5 ? '1px solid var(--border-sub)' : 'none' }}>
                  <div style={{ width: 180, flexShrink: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--text)', paddingTop: 1 }}>{row.label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualified view rules */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '32px 40px',
            marginBottom: 40,
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
              What counts as a qualified view?
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 12 }}>
              To protect the integrity of the earning system and ensure creators are rewarded for real engagement:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>The video must be <strong style={{ color: 'var(--text)' }}>at least 60 seconds long</strong>.</li>
              <li style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>The viewer must watch <strong style={{ color: 'var(--text)' }}>at least 60 seconds</strong> of the video continuously.</li>
              <li style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>Each viewer counts <strong style={{ color: 'var(--text)' }}>once per video</strong> — repeated views from the same account do not stack.</li>
              <li style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>Views from automated tools, bots, or coordinated inauthentic behaviour are detected and excluded.</li>
              <li style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>Only videos posted after you reach Supreme rank are eligible for earning.</li>
            </ul>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 560 }}>
            Questions about your Rank, Wallet, or a withdrawal? Message the Twedot account in the
            app, or reach out at <a href="mailto:support@twedot.com" style={{ color: 'var(--purple)', fontWeight: 700 }}>support@twedot.com</a>.
          </p>

        </div>
      </main>
      <Footer />
    </>
  );
}
