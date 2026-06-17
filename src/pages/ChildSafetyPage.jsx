import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function ChildSafetyPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Child Safety Standards</h1>
        <p style={{ color: 'var(--text-secondary, #888)', marginBottom: 40 }}>
          Last updated: June 2026
        </p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>Our Commitment</h2>
          <p>
            Twedot has a zero-tolerance policy toward child sexual abuse and exploitation (CSAE).
            We are committed to protecting minors from all forms of abuse, exploitation, and harmful content on our platform.
            Our app is intended exclusively for users aged 18 and over.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>Age Restrictions</h2>
          <p>
            Twedot restricts access to users aged 18 and above. We use age verification measures at account creation
            and work with platform-level controls to prevent minors from accessing the app.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>Prohibited Content</h2>
          <p>The following content is strictly prohibited on Twedot:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Child sexual abuse material (CSAM) of any kind</li>
            <li>Content that sexualises or exploits minors</li>
            <li>Any communication intended to groom, exploit, or harm minors</li>
            <li>Sharing, distributing, or soliciting CSAE content</li>
          </ul>
          <p>Violations result in immediate account termination and reporting to the relevant authorities.</p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>Reporting</h2>
          <p>
            Users can report child safety concerns directly within the app by tapping the report button on any profile or message.
            All reports are reviewed promptly. Where required by law, we report confirmed CSAE content to the
            National Center for Missing and Exploited Children (NCMEC) and relevant national authorities.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>Enforcement</h2>
          <p>
            Twedot enforces these standards through a combination of user reporting, content moderation,
            and cooperation with law enforcement. Accounts found to violate our child safety policy are
            permanently banned and reported to authorities.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>Contact</h2>
          <p>
            To report a child safety concern or contact our designated safety officer, email us at{' '}
            <a href="mailto:safety@twedot.com" style={{ color: '#6B4EFF' }}>safety@twedot.com</a>.
            We respond to all safety reports within 24 hours.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
