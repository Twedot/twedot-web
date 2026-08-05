import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const CONTACTS = [
  {
    label: 'Address',
    value: 'Lagos, Nigeria',
    href: 'https://www.google.com/maps/search/?api=1&query=Lagos+Nigeria',
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

// Same stacked light-gray pill fields as the Hero's request form.
function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '2px 4px' }}>
        {children}
      </div>
    </label>
  );
}

const inputStyle = {
  width: '100%', border: 'none', background: 'transparent',
  padding: '11px 12px', fontSize: 15, fontWeight: 600, color: 'var(--text)',
  outline: 'none', fontFamily: 'inherit',
};

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Contact Us — Twedot';
    return () => { document.title = 'Twedot'; };
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const canSubmit = name.trim() && email.trim() && message.trim();

  // No backend/session exists on this static site to actually deliver a
  // message — same honest pattern as the Hero's request form, which hands
  // off to the app instead of pretending to submit somewhere. Here that
  // means opening the visitor's own mail client with everything pre-filled.
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const subject = encodeURIComponent(`Message from ${name} via twedot.com`);
    const body = encodeURIComponent(`${message}\n\n—\n${name}\n${email}`);
    window.location.href = `mailto:support@twedot.com?subject=${subject}&body=${body}`;
  };

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

          <div className="contact-split" style={{ display: 'flex', gap: 32, alignItems: 'stretch' }}>

            {/* Contact info card */}
            <div style={{
              flex: '1 1 340px',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 'clamp(28px, 4vw, 40px)',
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

              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', opacity: 0.7, marginTop: 24 }}>
                For safety reports, use <a href="mailto:safety@twedot.com" style={{ color: 'var(--purple)' }}>safety@twedot.com</a> instead — those are reviewed within 24 hours.
              </p>
            </div>

            {/* Quick contact form */}
            <form
              onSubmit={handleSubmit}
              style={{
                flex: '1 1 360px',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 'clamp(28px, 4vw, 40px)',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
                Send us a message
              </div>

              <Field label="Your name">
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ada Lovelace" style={inputStyle} required
                />
              </Field>

              <Field label="Your email">
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle} required
                />
              </Field>

              <Field label="Message">
                <textarea
                  value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help?" rows={4} required
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </Field>

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  marginTop: 4, border: 'none', borderRadius: 10, padding: '14px',
                  fontWeight: 800, fontSize: 15, fontFamily: 'inherit',
                  background: canSubmit ? 'var(--purple)' : 'var(--border)',
                  color: canSubmit ? '#fff' : 'var(--text-muted)',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = '#6d28d9'; }}
                onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = 'var(--purple)'; }}
              >
                Send message
              </button>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.7, textAlign: 'center' }}>
                Opens your email app with this pre-filled.
              </p>
            </form>

          </div>

        </div>
      </main>
      <Footer />

      <style>{`
        @media (max-width: 720px) {
          .contact-split { flex-direction: column !important; }
        }
      `}</style>
    </>
  );
}
