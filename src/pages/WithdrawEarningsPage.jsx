import { useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function WithdrawEarningsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Ranking & Earnings — Twedot';
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
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Rankings & Earnings</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 68px)', fontWeight: 800,
              letterSpacing: '0px', color: 'var(--text)',
              lineHeight: 1.05, textTransform: 'uppercase', marginBottom: 24,
            }}>
              HOW YOUR RANK<br /><span style={{ color: 'var(--purple)' }}>BUILDS TOWARD EARNING.</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 620 }}>
              Every real thing you do on Twedot — chatting, posting, commenting, liking,
              being active in rooms, completing jobs, watching videos — feeds one running
              Rank. Here's exactly how it works, and how it connects to earning money on
              the platform.
            </p>
          </div>

          {/* Rank tiers card */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '48px 56px',
            background: 'var(--bg-card)',
            marginBottom: 40,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.3px' }}>
              Your Rank grows with real activity
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 28 }}>
              Everyone starts at <strong style={{ color: 'var(--text)' }}>Unknown</strong> and climbs through named
              tiers — Known, Noticed, Veteran, Influential, Elite, and beyond, all the way
              to <strong style={{ color: 'var(--text)' }}>Supreme</strong> — purely from being genuinely active. There's
              nothing to buy: your score is built from your own messages, posts, comments,
              likes given, room activity, completed service jobs, and time spent watching
              other people's videos. You can hide your rank badge from other users in
              Settings at any time — hiding it never stops it from growing.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {[
                {
                  title: 'Reach Supreme, the top tier',
                  desc: 'The moment your account crosses into Supreme, you unlock a one-time welcome credit and earning eligibility switches on.',
                },
                {
                  title: 'Your videos start earning qualified views',
                  desc: 'From then on, every video you post can earn "qualified views" — a view only counts once someone has genuinely watched at least 60 seconds of a video that\'s itself at least 60 seconds long. A quick skim or a short clip doesn\'t qualify.',
                },
                {
                  title: 'Your balance grows on your Wallet page',
                  desc: 'Qualified views and your welcome credit are tracked on your in-app Wallet, right alongside your Rank progress — so you always know exactly where you stand.',
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

          {/* Honesty note about payouts */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '32px 40px',
            marginBottom: 40,
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
              A straight answer on payouts
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, margin: 0 }}>
              Your Rank and Wallet balance are real, and they're yours. We don't yet run a
              general cash-withdrawal facility for every user's balance — when one opens up,
              we'll announce it in-app first, the same way you'll hear about anything else
              new on Twedot. Building your Rank now is never wasted: it's the thing any future
              payout will be based on.
            </p>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 560 }}>
            Questions about your Rank or Wallet? Message the Twedot account in the
            app, or reach out at <a href="mailto:support@twedot.com" style={{ color: 'var(--purple)', fontWeight: 700 }}>support@twedot.com</a>.
          </p>

        </div>
      </main>
      <Footer />
    </>
  );
}
