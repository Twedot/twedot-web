import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const TwedotLogo = ({ fill }) => (
  <svg width="32" height="28" viewBox="0 0 42 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M26.5986 0C35.1033 0.00026388 41.9988 6.89476 41.999 15.3994C41.999 23.9043 35.1034 30.7995 26.5986 30.7998H16.4082L5.80957 35.4531C5.54529 35.5691 5.24913 35.3755 5.24902 35.0869V26.9795C2.03162 24.157 0 20.0157 0 15.3994C0.000256501 6.8946 6.89454 0 15.3994 0H26.5986ZM29.0479 7C26.1484 7 23.7979 9.35056 23.7979 12.25C23.7979 12.8524 23.9011 13.4309 24.0879 13.9697L17.8779 16.04C17.1406 14.0326 15.2114 12.6008 12.9482 12.6006C10.0491 12.6008 7.69846 14.9505 7.69824 17.8496C7.69845 20.7488 10.0491 23.0994 12.9482 23.0996C15.8474 23.0994 18.198 20.7487 18.1982 17.8496C18.1982 17.6338 18.1826 17.4209 18.1572 17.2119L24.6143 15.0596C25.5455 16.5255 27.1825 17.5 29.0479 17.5C31.9468 17.4997 34.2976 15.149 34.2979 12.25C34.2979 9.35077 31.947 7.00035 29.0479 7Z"
      style={{ fill }}
    />
  </svg>
);

// Nigeria flag — same green/white/green as Bolt's own country selector.
const NigeriaFlag = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: 2, flexShrink: 0 }}>
    <rect width="20" height="14" fill="#fff" />
    <rect width="6.67" height="14" fill="#008751" />
    <rect x="13.33" width="6.67" height="14" fill="#008751" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.twedot&pli=1';

const MENU_ITEMS = [
  { label: 'About', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Download', href: PLAY_STORE_URL, external: true },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const isHome = location.pathname === '/';

  // Plain, always-solid header — Bolt/Uber never render a transparent hero-overlay
  // nav, just a simple white bar with a bottom border. Only the hide-on-scroll-down
  // behaviour is kept.
  useEffect(() => {
    let last = 0;
    const h = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 80);
      last = y;
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <nav
      className="nav-wrap nav-scrolled"
      style={{
        // Leaflet's internal panes/controls use z-index up to 1000 and don't sit
        // in the nav's stacking context — anything lower here gets drawn under
        // the hero map (and its dropdown menu along with it).
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100,
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff',
        borderBottom: '1px solid var(--border-sub)',
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <TwedotLogo fill="var(--purple)" />
        <span style={{ fontWeight: 800, fontSize: 19, color: 'var(--text)', letterSpacing: '-0.3px' }}>Twedot</span>
      </Link>

      {/* Right controls — matches Bolt's header exactly: flag + language, Support link,
          a pill Register/Download button, then a hamburger menu for everything else. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, cursor: 'default' }} className="nav-flag">
          <NigeriaFlag />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>EN</span>
        </div>

        <a href="mailto:support@twedot.com" className="nav-link nav-support">Support</a>

        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="nav-download-btn"
          style={{
            background: 'var(--text)', borderRadius: 24, padding: '9px 22px',
            color: '#fff', fontWeight: 700, fontSize: 14, transition: 'opacity 0.2s',
            textDecoration: 'none', marginLeft: 6,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Register
        </a>

        <div ref={menuRef} style={{ position: 'relative', marginLeft: 4 }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: '50%', border: 'none',
              background: menuOpen ? 'var(--purple-dim)' : 'transparent',
              color: 'var(--text)', cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            <MenuIcon />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0, minWidth: 190,
              background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
              boxShadow: '0 16px 40px rgba(10,0,16,0.14)', overflow: 'hidden', padding: 6,
            }}>
              {MENU_ITEMS.map(item => (
                <a
                  key={item.label}
                  href={isHome || !item.href.startsWith('#') ? item.href : `/${item.href}`}
                  {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block', padding: '10px 14px', borderRadius: 8,
                    color: 'var(--text)', fontSize: 14.5, fontWeight: 600, textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-dim)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .nav-support { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
