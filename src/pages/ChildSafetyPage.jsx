import { useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

// Same "legal page" template as Privacy/Terms — eyebrow label, big uppercase
// clamp-scaled h1 with the last word in purple, then numbered content rows —
// this page used to be its own plain h1/h2 layout with fixed rem sizes and a
// lighter font-weight scale, out of step with the rest of the site.
const sections = [
  {
    title: 'Our Commitment',
    content: (
      <p>
        Twedot has a zero-tolerance policy toward child sexual abuse and exploitation (CSAE).
        We are committed to protecting minors from all forms of abuse, exploitation, and harmful content on our platform.
        Our app is intended exclusively for users aged 18 and over.
      </p>
    ),
  },
  {
    title: 'Age Restrictions',
    content: (
      <p>
        Twedot restricts access to users aged 18 and above. We use age verification measures at account creation
        and work with platform-level controls to prevent minors from accessing the app.
      </p>
    ),
  },
  {
    title: 'Prohibited Content',
    content: (
      <>
        <p>The following content is strictly prohibited on Twedot:</p>
        <ul>
          <li>Child sexual abuse material (CSAM) of any kind</li>
          <li>Content that sexualises or exploits minors</li>
          <li>Any communication intended to groom, exploit, or harm minors</li>
          <li>Sharing, distributing, or soliciting CSAE content</li>
        </ul>
        <p>Violations result in immediate account termination and reporting to the relevant authorities.</p>
      </>
    ),
  },
  {
    title: 'Reporting',
    content: (
      <p>
        Users can report child safety concerns directly within the app by tapping the report button on any profile or message.
        All reports are reviewed promptly. Where required by law, we report confirmed CSAE content to the
        National Center for Missing and Exploited Children (NCMEC) and relevant national authorities.
      </p>
    ),
  },
  {
    title: 'Enforcement',
    content: (
      <p>
        Twedot enforces these standards through a combination of user reporting, content moderation,
        and cooperation with law enforcement. Accounts found to violate our child safety policy are
        permanently banned and reported to authorities.
      </p>
    ),
  },
  {
    title: 'Contact',
    content: (
      <p>
        To report a child safety concern or contact our designated safety officer, email us at{' '}
        <a href="mailto:safety@twedot.com">safety@twedot.com</a>.
        We respond to all safety reports within 24 hours.
      </p>
    ),
  },
];

export default function ChildSafetyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Child Safety Standards — Twedot';
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
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Legal</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 72px)', fontWeight: 800,
              letterSpacing: '0px', color: 'var(--text)',
              lineHeight: 1.05, textTransform: 'uppercase', marginBottom: 20,
            }}>
              Child<br /><span style={{ color: 'var(--purple)' }}>Safety</span>
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', opacity: 0.7 }}>
              Last Updated: June 2026
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
                    .legal-content ul { padding-left: 20px; margin-bottom: 12px; }
                    .legal-content li { margin-bottom: 6px; }
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
