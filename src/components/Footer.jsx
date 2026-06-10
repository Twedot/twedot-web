const SOCIAL = [
  {
    label: 'X (Twitter)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.847L1.254 2.25H8.08l4.26 5.632 5.904-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

const LINKS = [
  { title: 'Product',  items: [
    { label: 'Features',  href: '/#features' },
    { label: 'Security',  href: '/#security' },
    { label: 'Download',  href: 'https://play.google.com/store/search?q=twedot&c=apps', external: true },
    { label: 'Changelog', href: '#' },
    { label: 'Status',    href: '#' },
  ]},
  { title: 'Business', items: [
    { label: 'List Your Service', href: '#' },
    { label: 'Analytics',        href: '#' },
    { label: 'Pricing',          href: '#' },
    { label: 'API',              href: '#' },
    { label: 'Partner Program',  href: '#' },
  ]},
  { title: 'Company', items: [
    { label: 'About',   href: '/about' },
    { label: 'Blog',    href: '#' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press',   href: '#' },
    { label: 'Contact', href: '#' },
  ]},
  { title: 'Legal', items: [
    { label: 'Privacy',    href: '/privacy' },
    { label: 'Terms',      href: '/terms' },
    { label: 'Cookies',    href: '#' },
    { label: 'Guidelines', href: '#' },
    { label: 'GDPR',       href: '#' },
  ]},
];

const TwedotLogo = () => (
  <svg width="30" height="26" viewBox="0 0 42 36" fill="none">
    <path d="M26.5986 0C35.1033 0.00026388 41.9988 6.89476 41.999 15.3994C41.999 23.9043 35.1034 30.7995 26.5986 30.7998H16.4082L5.80957 35.4531C5.54529 35.5691 5.24913 35.3755 5.24902 35.0869V26.9795C2.03162 24.157 0 20.0157 0 15.3994C0.000256501 6.8946 6.89454 0 15.3994 0H26.5986ZM29.0479 7C26.1484 7 23.7979 9.35056 23.7979 12.25C23.7979 12.8524 23.9011 13.4309 24.0879 13.9697L17.8779 16.04C17.1406 14.0326 15.2114 12.6008 12.9482 12.6006C10.0491 12.6008 7.69846 14.9505 7.69824 17.8496C7.69845 20.7488 10.0491 23.0994 12.9482 23.0996C15.8474 23.0994 18.198 20.7487 18.1982 17.8496C18.1982 17.6338 18.1826 17.4209 18.1572 17.2119L24.6143 15.0596C25.5455 16.5255 27.1825 17.5 29.0479 17.5C31.9468 17.4997 34.2976 15.149 34.2979 12.25C34.2979 9.35077 31.947 7.00035 29.0479 7Z" style={{ fill: 'var(--purple)' }} />
  </svg>
);

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border-sub)', padding: '72px 64px 0', transition: 'background 0.35s', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Newsletter */}
        <div style={{ borderBottom: '1px solid var(--border-sub)', paddingBottom: 48, marginBottom: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 28 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.3px' }}>Stay in the loop</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Product updates, local commerce insights, and early access to new features.</div>
          </div>
          <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{ padding: '13px 18px', borderRadius: '28px 0 0 28px', border: '1.5px solid var(--border)', borderRight: 'none', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', width: 240, fontFamily: 'inherit' }}
            />
            <button style={{ padding: '13px 24px', borderRadius: '0 28px 28px 0', background: 'var(--purple)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--purple)'}
            >
              Subscribe
            </button>
          </div>
        </div>

        {/* Main footer body */}
        <div className="footer-inner" style={{ display: 'flex', justifyContent: 'space-between', gap: 48, marginBottom: 56, flexWrap: 'wrap' }}>

          {/* Brand column */}
          <div style={{ minWidth: 200, maxWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <TwedotLogo />
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.3px' }}>Twedot</span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.85, marginBottom: 24 }}>
              Private. Local. Powerful. Connect with vendors and people around you — securely.
            </p>

            {/* Download badges */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Download</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', textDecoration: 'none', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ color: 'var(--text)', flexShrink: 0 }}>
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1 }}>Download on the</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>App Store</div>
                  </div>
                </a>
                <a
                  href="https://play.google.com/store/search?q=twedot&c=apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', textDecoration: 'none', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ color: 'var(--text)', flexShrink: 0 }}>
                    <path d="M3.18 23.76c.3.17.64.22.97.16L14.76 12 3.18.08c-.33-.06-.67-.01-.97.16C1.6.61 1.2 1.3 1.2 2.08v19.84c0 .78.4 1.47 1.01 1.84zM16.72 9.44L5.65 2.88l9.7 9.7-8.49 8.49 9.86-5.56c.7-.39 1.13-1.12 1.13-1.92v-.23c0-.8-.43-1.53-1.13-1.92zM21.34 10.04l-2.54-1.43-2.93 2.93 2.93 2.93 2.54-1.43c.72-.4 1.2-1.17 1.2-2.01 0-.84-.48-1.6-1.2-2z" />
                  </svg>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1 }}>Get it on</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>Google Play</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Social */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Social</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              {SOCIAL.map(({ label, icon }) => (
                <a key={label} href="#" className="social-link" aria-label={label}>{icon}</a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {LINKS.map(col => (
              <div key={col.title}>
                <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.title}</div>
                {col.items.map(item => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="footer-link"
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--border-sub)', padding: '24px 0 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, opacity: 0.6 }}>© 2026 Twedot Inc. All rights reserved.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 12, opacity: 0.7 }}>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
