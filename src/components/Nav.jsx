import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const TwedotLogo = ({ fill }) => (
  <svg width="32" height="28" viewBox="0 0 42 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M26.5986 0C35.1033 0.00026388 41.9988 6.89476 41.999 15.3994C41.999 23.9043 35.1034 30.7995 26.5986 30.7998H16.4082L5.80957 35.4531C5.54529 35.5691 5.24913 35.3755 5.24902 35.0869V26.9795C2.03162 24.157 0 20.0157 0 15.3994C0.000256501 6.8946 6.89454 0 15.3994 0H26.5986ZM29.0479 7C26.1484 7 23.7979 9.35056 23.7979 12.25C23.7979 12.8524 23.9011 13.4309 24.0879 13.9697L17.8779 16.04C17.1406 14.0326 15.2114 12.6008 12.9482 12.6006C10.0491 12.6008 7.69846 14.9505 7.69824 17.8496C7.69845 20.7488 10.0491 23.0994 12.9482 23.0996C15.8474 23.0994 18.198 20.7487 18.1982 17.8496C18.1982 17.6338 18.1826 17.4209 18.1572 17.2119L24.6143 15.0596C25.5455 16.5255 27.1825 17.5 29.0479 17.5C31.9468 17.4997 34.2976 15.149 34.2979 12.25C34.2979 9.35077 31.947 7.00035 29.0479 7Z"
      style={{ fill }}
    />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export default function Nav() {
  const { isDark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    let last = 0;
    const h = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > last && y > 80);
      last = y;
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const bg = scrolled ? 'var(--nav-bg)' : 'transparent';
  const logoFill = scrolled && !isDark ? 'var(--purple)' : 'rgba(255,255,255,0.92)';
  const logoText = scrolled && !isDark ? 'var(--text)' : '#fff';

  return (
    <nav
      className={`nav-wrap${scrolled ? ' nav-scrolled' : ''}`}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: bg,
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-sub)' : 'none',
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'background 0.3s, border-color 0.3s, transform 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <TwedotLogo fill={logoFill} />
        <span style={{ fontWeight: 800, fontSize: 19, color: logoText, letterSpacing: '-0.3px', transition: 'color 0.3s' }}>Twedot</span>
      </Link>

      {/* Nav links */}
      <div className="nav-links" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <a href={isHome ? '#features'     : '/#features'}     className="nav-link">Features</a>
        <a href={isHome ? '#how-it-works' : '/#how-it-works'} className="nav-link">How it Works</a>
        <a href={isHome ? '#security'     : '/#security'}     className="nav-link">Security</a>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <a
          href="https://play.google.com/store/apps/details?id=com.twedot&pli=1"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-download-btn"
          style={{
            background: '#7c3aed', borderRadius: 8, padding: '9px 20px',
            color: '#fff', fontWeight: 700, fontSize: 14, transition: 'background 0.2s',
            textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
        >
          Download
        </a>
      </div>
    </nav>
  );
}
