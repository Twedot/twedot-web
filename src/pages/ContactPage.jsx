import { useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const CONTACTS = [
  {
    label: 'Address',
    value: '29 Aina Jakande, Ajah, Lagos, Nigeria',
    href: 'https://www.google.com/maps/search/?api=1&query=29+Aina+Jakande+Ajah+Lagos+Nigeria',
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.8" width="24" height="24">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: 'Phone',
    value: '+234 814 713 4884',
    href: 'tel:+2348147134884',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.8" width="24" height="24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.79.63 2.65a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.43-1.2a2 2 0 0 1 2.11-.45c.86.3 1.75.51 2.65.63A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    value: 'support@twedot.com',
    href: 'mailto:support@twedot.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.8" width="24" height="24">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Contact Us — Twedot';
    return () => { document.title = 'Twedot'; };
  }, []);

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 68, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="careers-inner" style={{ flex: 1, maxWidth: 900, margin: '0 auto', padding: '100px 56px 120px', width: '100%' }}>

          {/* Header */}
          <div style={{ marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 20, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Contact</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 76px)', fontWeight: 800,
              letterSpacing: '0px', color: 'var(--text)',
              lineHeight: 1.05, textTransform: 'uppercase', marginBottom: 24,
            }}>
              GET IN<br /><span style={{ color: 'var(--purple)' }}>TOUCH.</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 480 }}>
              Questions, feedback, or just want to say hi — here's how to reach us.
            </p>
          </div>

          {/* Contact info card */}
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 'clamp(32px, 5vw, 48px)',
            background: 'var(--bg-card)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {CONTACTS.map((c, i) => (
                <a
                  key={c.label}
                  href={c.href}
                  {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 20,
                    padding: '20px 0',
                    borderTop: i > 0 ? '1px solid var(--border-sub)' : 'none',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{
                    flexShrink: 0, width: 48, height: 48, borderRadius: 14,
                    background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {c.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>
                      {c.value}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', opacity: 0.7, marginTop: 32 }}>
            For safety reports, use <a href="mailto:safety@twedot.com" style={{ color: 'var(--purple)' }}>safety@twedot.com</a> instead — those are reviewed within 24 hours.
          </p>

        </div>
      </main>
      <Footer />
    </>
  );
}
