import { useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function WithdrawEarningsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Withdraw Earnings — Twedot';
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
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Rankings & Rewards</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 68px)', fontWeight: 800,
              letterSpacing: '0px', color: 'var(--text)',
              lineHeight: 1.05, textTransform: 'uppercase', marginBottom: 24,
            }}>
              HOW TO WITHDRAW<br /><span style={{ color: 'var(--purple)' }}>YOUR EARNINGS.</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 560 }}>
              Every naira you earn on Twedot — from chatting, posting statuses, adding to
              your inventory, or referring friends — is tracked on your Rankings page in
              the app. Here's how to actually get paid out.
            </p>
          </div>

          {/* Steps card */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '48px 56px',
            background: 'var(--bg-card)',
            marginBottom: 56,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 32, letterSpacing: '-0.3px' }}>
              Withdrawal steps
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {[
                {
                  title: 'Keep using the app',
                  desc: 'Chat, post statuses, list items in your inventory, and refer friends — your balance on the Rankings page grows automatically as you go.',
                },
                {
                  title: 'Message the Twedot account',
                  desc: 'Open a chat with the official Twedot account in the app and let them know you\'d like to withdraw your earnings.',
                },
                {
                  title: 'Get paid after the campaign ends',
                  desc: 'This rewards program runs for a limited time — 2 months. Payouts are made once that period is over, based on the balance shown on your Rankings page at that time.',
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

          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 560 }}>
            Questions about your balance or a withdrawal? Message the Twedot account in the
            app, or reach out at <a href="mailto:support@twedot.com" style={{ color: 'var(--purple)', fontWeight: 700 }}>support@twedot.com</a>.
          </p>

        </div>
      </main>
      <Footer />
    </>
  );
}
