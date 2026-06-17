import Nav from '../components/Nav';
import Footer from '../components/Footer';

const steps = [
  {
    step: '1',
    title: 'Open Twedot',
    description: 'Launch the Twedot app on your device and make sure you are logged in.',
  },
  {
    step: '2',
    title: 'Go to Settings',
    description: 'Tap your profile photo, then tap the Settings icon in the top corner.',
  },
  {
    step: '3',
    title: 'Select "Delete Account"',
    description: 'Scroll to the bottom of Settings and tap "Delete Account".',
  },
  {
    step: '4',
    title: 'Confirm deletion',
    description: 'Read the confirmation prompt and tap "Delete" to permanently delete your account.',
  },
];

const dataItems = [
  { label: 'Profile data', detail: 'Name, phone number, occupation, profile photo — permanently deleted immediately.' },
  { label: 'Messages', detail: 'All sent and received messages are permanently deleted.' },
  { label: 'Media files', detail: 'All photos and videos you uploaded are permanently deleted from our servers.' },
  { label: 'Location data', detail: 'All stored location data is permanently deleted.' },
  { label: 'Device tokens', detail: 'Push notification tokens are removed immediately.' },
  { label: 'Activity data', detail: 'Status views, contact matches, and usage records are deleted.' },
];

export default function DeleteAccountPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Delete Your Account</h1>
        <p style={{ color: 'var(--text-secondary, #888)', marginBottom: 48 }}>
          You can permanently delete your Twedot account at any time from within the app.
          Once deleted, your account and all associated data cannot be recovered.
        </p>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 24 }}>How to delete your account</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 56 }}>
          {steps.map(({ step, title, description }) => (
            <div key={step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                minWidth: 36, height: 36, borderRadius: '50%',
                background: '#6B4EFF', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.9rem',
              }}>
                {step}
              </div>
              <div>
                <p style={{ fontWeight: 600, margin: '0 0 4px' }}>{title}</p>
                <p style={{ margin: 0, color: 'var(--text-secondary, #888)' }}>{description}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>What data is deleted</h2>
        <p style={{ color: 'var(--text-secondary, #888)', marginBottom: 24 }}>
          When you delete your account, the following data is permanently and immediately removed from our servers:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 56 }}>
          {dataItems.map(({ label, detail }) => (
            <div key={label} style={{ borderLeft: '3px solid #6B4EFF', paddingLeft: 16 }}>
              <p style={{ fontWeight: 600, margin: '0 0 2px' }}>{label}</p>
              <p style={{ margin: 0, color: 'var(--text-secondary, #888)', fontSize: '0.9rem' }}>{detail}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>Need help?</h2>
        <p style={{ color: 'var(--text-secondary, #888)' }}>
          If you are unable to access the app or need assistance deleting your account, email us at{' '}
          <a href="mailto:support@twedot.com" style={{ color: '#6B4EFF' }}>support@twedot.com</a>{' '}
          and we will process your request within 7 days.
        </p>
      </main>
      <Footer />
    </div>
  );
}
