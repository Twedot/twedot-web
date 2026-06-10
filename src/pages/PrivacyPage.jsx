import { useEffect } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const sections = [
  {
    title: 'Our Commitment to Privacy',
    content: (
      <>
        <p>Twedot Limited is committed to protecting the personal information of everyone who uses our app. This Privacy Policy explains what data we collect, why we collect it, how we use it, and your rights over it.</p>
        <p>By using Twedot, you agree to the practices described here. This policy is incorporated by reference into our <a href="/terms">Terms and Conditions</a>. In the event of any conflict between these two documents, this Privacy Policy governs. <strong>We do not sell your personal data — ever.</strong> Questions? Email us at <a href="mailto:privacy@twedot.com">privacy@twedot.com</a>.</p>
      </>
    ),
  },
  {
    title: 'What We Collect',
    content: (
      <>
        <p>When you use Twedot we collect the following categories of data:</p>
        <ul>
          <li><strong>Identity Data</strong> — Phone number, name, occupation, profile photo</li>
          <li><strong>Location Data</strong> — GPS coordinates (foreground only), city, state, country</li>
          <li><strong>Device Data</strong> — OS version, App version, push notification token</li>
          <li><strong>Usage Data</strong> — Status views, contacts synced, listings viewed (aggregated and anonymised — never linked to individual messages)</li>
          <li><strong>Contact Data</strong> — Phone numbers from your device address book, used for contact matching only</li>
          <li><strong>Content Data</strong> — Status photos/videos/text, inventory images and captions, media files attached to messages</li>
          <li><strong>Transaction Metadata</strong> — Pickup requests and item reference interactions</li>
        </ul>
      </>
    ),
  },
  {
    title: 'What We Do NOT Collect',
    content: (
      <>
        <p>The following data is <strong>never collected or stored by Twedot</strong>:</p>
        <ul>
          <li><strong>Message text content</strong> — All chat messages are end-to-end encrypted on your device before they leave it. The Twedot server only ever handles the encrypted payload and cannot read, access, or process the content of any message.</li>
          <li><strong>Voice note content</strong> — Voice messages are transmitted as encrypted media files and deleted from our servers once delivered. They are not stored, archived, or indexed.</li>
          <li><strong>Exact GPS coordinates</strong> — We collect approximate location for Nearby Discovery but do not store or share precise coordinates beyond what is necessary for proximity matching.</li>
          <li><strong>Browsing behaviour outside the App</strong> — We do not track you across third-party websites or apps.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'End-to-End Encryption & Message Privacy',
    content: (
      <>
        <p><strong>How It Works.</strong> All chat messages are <strong>end-to-end encrypted (E2EE)</strong>. Your device encrypts message content using the recipient's public key before transmission. Only the recipient's device — holding the matching private key — can decrypt and read the content. Twedot's server handles only the encrypted payload and is technically unable to read your messages.</p>
        <p><strong>Relay Architecture — Not a Storage System.</strong> The Twedot server is a relay, not a message store:</p>
        <ul>
          <li>When a recipient is <strong>online</strong>, the encrypted message is delivered in real-time and the server retains no copy.</li>
          <li>When a recipient is <strong>offline</strong>, the encrypted message is held in a temporary delivery queue for up to <strong>7 days</strong>. It is permanently and automatically deleted from our infrastructure the moment the recipient's device acknowledges receipt.</li>
          <li><strong>No message content is ever written to a permanent database.</strong></li>
        </ul>
        <p><strong>Local Device Storage.</strong> Your entire chat history — messages you send and receive — is stored exclusively on your own device in an encrypted local database. If you lose your device, factory-reset it, uninstall the App, or delete your account, your message history <strong>cannot be recovered from our servers</strong> because we do not have it.</p>
        <p><strong>No Server Access.</strong> Twedot Limited, its employees, contractors, and partners cannot read, access, or disclose the content of your messages under any circumstances. We do not use message content for advertising, profiling, AI training, or any other purpose.</p>
      </>
    ),
  },
  {
    title: 'Location Data',
    content: (
      <>
        <p>Location is core to Twedot's Nearby Discovery feature. We use <strong>foreground location access only</strong> — we access your location when you actively use the App, never silently in the background.</p>
        <p>Your <strong>exact GPS coordinates are never shown to other users</strong>. Distance is expressed in approximate proximity tiers only. We store your city, state, and country with your profile to enable discovery. Precise coordinates are used solely for proximity matching and are not included in your public profile.</p>
        <p>You can revoke location permission at any time from your device settings. Messaging will continue to work normally without it. <strong>We do not sell location data to third parties.</strong></p>
      </>
    ),
  },
  {
    title: 'Contact Synchronisation',
    content: (
      <>
        <p><strong>How It Works.</strong> When you grant the Contacts permission, the App reads phone numbers from your device address book, normalises them to international format, and sends them to our servers. We check which numbers correspond to registered Twedot users and return only those matches to your device. Phone numbers that do not match any Twedot account are <strong>not retained on our servers</strong> beyond the matching operation.</p>
        <p><strong>What We Store.</strong> For numbers that match registered Twedot users, we store the association between your account and theirs to power your contacts list and private status delivery. We do not store the names or other personal details of your non-Twedot contacts.</p>
        <p><strong>Frequency.</strong> Synchronisation runs automatically in the background no more than once every 24 hours. You may trigger a manual sync from Settings → Contacts.</p>
        <p><strong>Your Contacts' Privacy.</strong> By uploading phone numbers from your address book, you represent that you have a lawful basis to share this data. We process numbers solely for matching and do not contact your contacts independently.</p>
        <p><strong>Opt-Out.</strong> Disable Twedot contact sync at any time via Settings → Contacts, or revoke the Contacts permission in your device settings.</p>
      </>
    ),
  },
  {
    title: 'Device Permissions',
    content: (
      <>
        <p>The App requests the following permissions. You may grant or revoke them at any time via your device settings; revoking a permission disables only the corresponding feature and does not affect others.</p>
        <ul>
          <li><strong>Location (Foreground)</strong> — Required for Nearby Discovery and public status proximity targeting. Exact coordinates are never shared with other users.</li>
          <li><strong>Microphone</strong> — Required for voice messaging and in-app video recording. Used only during active recording.</li>
          <li><strong>Camera</strong> — Required for taking photos and videos in chat and the status camera. Used only when the camera is actively open.</li>
          <li><strong>Photo Library</strong> — Required for selecting images and videos to send. Read-only access.</li>
          <li><strong>Contacts</strong> — Required for contact synchronisation. Phone numbers are sent to our server for matching only (see section above).</li>
          <li><strong>Notifications</strong> — Required for push notifications about new messages and activity.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'How We Use Your Data',
    content: (
      <>
        <p>We use the data we collect to:</p>
        <ul>
          <li>Operate and deliver all platform services;</li>
          <li>Match you with contacts already on Twedot;</li>
          <li>Power the Nearby Discovery and public status features;</li>
          <li>Send push and in-app notifications;</li>
          <li>Detect and prevent fraud, abuse, and illegal activity;</li>
          <li>Improve the platform through anonymised, aggregated analytics;</li>
          <li>Comply with applicable legal obligations.</li>
        </ul>
        <p>We will never use your data for purposes incompatible with this policy without your explicit consent first.</p>
      </>
    ),
  },
  {
    title: 'Sharing Your Data',
    content: (
      <>
        <p>We do not sell, rent, or trade your personal data. We share data only in these circumstances:</p>
        <ul>
          <li>With infrastructure providers (cloud hosting, CDN, SMS gateway) under strict data processing agreements;</li>
          <li>When required by applicable law, regulation, court order, or valid legal process;</li>
          <li>To protect the rights, safety, or property of Twedot, our users, or the public;</li>
          <li>In the event of a merger, acquisition, or sale of assets — with advance notice to users and the same privacy protections.</li>
        </ul>
        <p>Any sharing beyond the above requires your explicit consent.</p>
      </>
    ),
  },
  {
    title: 'Data Retention & Deletion',
    content: (
      <>
        <p><strong>Account data</strong> is retained while your account is active. Upon permanent account deletion, your personal data is purged from our active systems within <strong>30 days</strong>. Certain metadata may be retained longer where required by law (e.g., fraud investigation records).</p>
        <p><strong>Message content</strong> is never retained on our servers beyond the 7-day temporary offline delivery queue, and is automatically deleted upon delivery acknowledgment. We hold no long-term copy of any message.</p>
        <p><strong>Status content</strong> is deleted from our servers and CDN caches within a short period of the 24-hour expiry.</p>
        <p><strong>Contact matching data</strong> (non-Twedot phone numbers) is discarded immediately after the matching operation.</p>
        <p>You can delete your account at any time through Settings → Account → Delete account. This action is irreversible — deleted accounts and their data cannot be recovered.</p>
      </>
    ),
  },
  {
    title: 'Your Rights',
    content: (
      <>
        <p>Depending on your jurisdiction, you may have the following rights over your personal data:</p>
        <ul>
          <li><strong>Access</strong> — Request a copy of the data we hold about you (available via Settings → Account → Request account data).</li>
          <li><strong>Correct</strong> — Update inaccurate or incomplete data via your profile settings.</li>
          <li><strong>Delete</strong> — Request erasure of your personal data, or delete your account directly in the App.</li>
          <li><strong>Export</strong> — Receive your account data in a portable format.</li>
          <li><strong>Object / Restrict</strong> — Object to certain processing activities or request we restrict how we use your data.</li>
        </ul>
        <p>To exercise any right, contact us at <a href="mailto:privacy@twedot.com">privacy@twedot.com</a>. We will respond within 30 days.</p>
      </>
    ),
  },
  {
    title: 'Security',
    content: (
      <>
        <p>We implement industry-standard security measures: TLS encryption in transit, encrypted storage at rest, strict access controls, and regular security reviews. On-device chat data is stored in an encrypted local database.</p>
        <p>No system is 100% secure. In the event of a significant data breach that affects your personal data, we will notify you as required by applicable law. If you suspect unauthorised access to your account, contact us immediately at <a href="mailto:support@twedot.com">support@twedot.com</a>.</p>
      </>
    ),
  },
  {
    title: "Children's Privacy",
    content: (
      <>
        <p>Twedot is not intended for anyone under 13. We do not knowingly collect personal data from children under 13. If we become aware that a user is under 13, we will immediately delete their account and all associated data.</p>
        <p>Users aged 16–18 must have parental or guardian consent. If you believe a child under 13 is using Twedot, please notify us at <a href="mailto:privacy@twedot.com">privacy@twedot.com</a>.</p>
      </>
    ),
  },
  {
    title: 'International Data Transfers',
    content: (
      <>
        <p>Your data may be processed on servers located outside your country, including in jurisdictions that may have different data protection laws. Where required (e.g., for transfers from the EU or UK), we rely on appropriate safeguards such as standard contractual clauses to ensure your data receives equivalent protection.</p>
      </>
    ),
  },
  {
    title: 'Third-Party Services',
    content: (
      <>
        <p>The App relies on the following third-party services that may process some of your data as part of delivering the platform:</p>
        <ul>
          <li><strong>Cloud Infrastructure (AWS or equivalent)</strong> — Hosting, media storage, CDN delivery</li>
          <li><strong>SMS Gateway</strong> — OTP delivery for account verification</li>
          <li><strong>Apple APNs / Google FCM</strong> — Push notification delivery</li>
          <li><strong>OpenStreetMap / Photon Geocoder</strong> — Address search for service location setup</li>
          <li><strong>Redis</strong> — Temporary encrypted offline message queue (7-day TTL, auto-deleted on delivery)</li>
        </ul>
        <p>Each provider operates under its own privacy policy. Twedot is not responsible for their data practices but selects providers under contractual data protection obligations.</p>
      </>
    ),
  },
  {
    title: 'Updates & Contact',
    content: (
      <>
        <p>We may update this Privacy Policy from time to time. We will notify you of material changes via in-app notification or push notification at least <strong>14 days</strong> before they take effect. This policy complies with the Nigeria Data Protection Regulation (NDPR) and, where applicable, the EU GDPR, UK GDPR, and other regional privacy laws.</p>
        <p>
          Privacy enquiries: <a href="mailto:privacy@twedot.com">privacy@twedot.com</a><br />
          Legal notices: <a href="mailto:legal@twedot.com">legal@twedot.com</a><br />
          Support: <a href="mailto:support@twedot.com">support@twedot.com</a><br />
          <strong>Twedot Limited</strong> · Lagos, Nigeria
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Privacy Policy — Twedot';
    return () => { document.title = 'Twedot'; };
  }, []);

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 68, minHeight: '100vh' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 56px 120px' }}>

          <div style={{ marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 20, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Legal</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900,
              letterSpacing: '-3px', color: 'var(--text)',
              lineHeight: 0.92, textTransform: 'uppercase', marginBottom: 20,
            }}>
              Privacy<br /><span style={{ color: 'var(--purple)' }}>Policy</span>
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', opacity: 0.7 }}>
              Effective Date: 1 June 2025 · Last Updated: 22 May 2025 · Version 2.0
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sections.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 56, alignItems: 'flex-start',
                  padding: '40px 0',
                  borderTop: '1px solid var(--border-sub)',
                }}
              >
                <div style={{ width: 220, flexShrink: 0 }}>
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
                    .legal-content strong { color: var(--text); font-weight: 700; }
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
