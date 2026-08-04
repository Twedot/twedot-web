import { useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

// Same "legal page" template as Privacy/Terms/Child Safety — this page used
// to be its own plain h1/h2 layout with fixed rem sizes, a lighter
// font-weight scale, and a hardcoded hex purple instead of var(--purple),
// out of step with the rest of the site.
const steps = [
  { step: '1', title: 'Open Twedot', description: 'Launch the Twedot app on your device and make sure you are logged in.' },
  { step: '2', title: 'Go to your Profile', description: 'Tap the Profile tab at the bottom of the screen.' },
  { step: '3', title: 'Tap "Account"', description: 'On your profile page, tap "Account" to open your account settings.' },
  { step: '4', title: 'Tap "Delete Account"', description: 'Scroll down and tap "Delete Account".' },
  { step: '5', title: 'Confirm deletion', description: 'Read the confirmation prompt and tap "Delete" to permanently delete your account.' },
];

const dataItems = [
  { label: 'Profile data', detail: 'Name, phone number, occupation, profile photo — permanently deleted immediately.' },
  { label: 'Messages', detail: 'All sent and received messages are permanently deleted.' },
  { label: 'Media files', detail: 'All photos and videos you uploaded are permanently deleted from our servers.' },
  { label: 'Location data', detail: 'All stored location data is permanently deleted.' },
  { label: 'Device tokens', detail: 'Push notification tokens are removed immediately.' },
  { label: 'Activity data', detail: 'Status views, contact matches, and usage records are deleted.' },
];

const sections = [
  {
    title: 'How to Delete',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {steps.map(({ step, title, description }) => (
          <div key={step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
              background: 'var(--purple)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13,
            }}>
              {step}
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>{title}</p>
              <p style={{ margin: 0 }}>{description}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'What Gets Deleted',
    content: (
      <>
        <p>When you delete your account, the following data is permanently and immediately removed from our servers:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {dataItems.map(({ label, detail }) => (
            <div key={label} style={{ borderLeft: '3px solid var(--purple)', paddingLeft: 16 }}>
              <p style={{ fontWeight: 700, color: 'var(--text)', margin: '0 0 2px' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 13.5 }}>{detail}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    title: 'Need Help?',
    content: (
      <p>
        If you are unable to access the app or need assistance deleting your account, email us at{' '}
        <a href="mailto:support@twedot.com">support@twedot.com</a>{' '}
        and we will process your request within 7 days.
      </p>
    ),
  },
];

export default function DeleteAccountPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Delete Your Account — Twedot';
    return () => { document.title = 'Twedot'; };
  }, []);

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 68, minHeight: '100vh' }}>
        <div className="page-inner" style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 56px 120px' }}>

          <div style={{ marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 20, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Account</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 72px)', fontWeight: 800,
              letterSpacing: '0px', color: 'var(--text)',
              lineHeight: 1.05, textTransform: 'uppercase', marginBottom: 20,
            }}>
              Delete Your<br /><span style={{ color: 'var(--purple)' }}>Account</span>
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', opacity: 0.7 }}>
              You can permanently delete your Twedot account at any time from within the app.
              Once deleted, your account and all associated data cannot be recovered.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sections.map((s, i) => (
              <div
                key={i}
                className="legal-section-row"
                style={{
                  display: 'flex', gap: 56, alignItems: 'flex-start',
                  padding: '40px 0',
                  borderTop: '1px solid var(--border-sub)',
                }}
              >
                <div className="legal-sidebar" style={{ width: 220, flexShrink: 0 }}>
                  <span style={{
                    display: 'block', fontSize: 11, fontWeight: 700,
                    color: 'var(--purple)', opacity: 0.55,
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 style={{
                    fontSize: 16, fontWeight: 800, color: 'var(--text)',
                    lineHeight: 1.3, letterSpacing: '-0.2px',
                  }}>
                    {s.title}
                  </h2>
                </div>

                <div style={{ flex: 1, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.9 }}>
                  <style>{`
                    .legal-content p { margin-bottom: 12px; }
                    .legal-content p:last-child { margin-bottom: 0; }
                    .legal-content a { color: var(--purple); text-decoration: none; }
                    .legal-content a:hover { text-decoration: underline; }
                  `}</style>
                  <div className="legal-content">{s.content}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
