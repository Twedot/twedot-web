import { useState, useEffect, useRef } from 'react';

const MILESTONES = [
  {
    year: 'Nov 2025',
    title: 'The Problem Became Personal',
    desc: (
      <>
        <p style={{ marginBottom: 12 }}>While trying to find a way to survive financially, we started exploring ideas — a gym wear brand, a sneaker brand, selling shoes from local vendors. But we kept hitting the same wall:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li>finding reliable local vendors was difficult</li>
          <li>most platforms required hours of searching</li>
          <li>responses were slow, and vendors were often too far away</li>
        </ul>
        <p>That frustration planted the first seed of what would later become Twedot.</p>
      </>
    ),
    color: '#7c3aed',
  },
  {
    year: 'Dec 2025',
    title: 'The Idea Expanded',
    desc: (
      <>
        <p style={{ marginBottom: 12 }}>We started discussing a bigger problem beyond just fashion vendors. We noticed:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li>local businesses struggled to get visibility</li>
          <li>skilled service providers weren't getting enough gigs</li>
          <li>platforms like Upwork focused mostly on tech</li>
          <li>LinkedIn felt too corporate for everyday local services</li>
        </ul>
        <p>We believed there was a huge untapped market for local commerce — if visibility could be simplified. That month, we officially started building.</p>
      </>
    ),
    color: '#7c3aed',
  },
  {
    year: 'Apr 2026',
    title: 'First Technical Test Launch',
    desc: (
      <>
        <p style={{ marginBottom: 12 }}>After months of planning and development, we reached our first technical test launch. This phase focused on:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li>testing the core infrastructure</li>
          <li>validating the concept technically</li>
          <li>understanding how users would interact with the platform</li>
        </ul>
        <p>It was the first real step from idea to product.</p>
      </>
    ),
    color: '#7c3aed',
  },
  {
    year: '17 May 2026',
    title: 'Securing the Brand',
    desc: 'We officially secured our domain — marking the beginning of establishing the project\'s identity publicly.',
    color: '#7c3aed',
    highlight: 'twedot.com',
  },
  {
    year: '22 May 2026',
    title: 'First Non-Technical Test',
    desc: (
      <>
        <p style={{ marginBottom: 12 }}>We entered our first non-technical testing phase. This stage focused on:</p>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          <li>user understanding and branding perception</li>
          <li>market reactions and feature validation</li>
          <li>gathering feedback outside pure development</li>
        </ul>
        <p>The first real test of whether people connected with the vision behind Twedot.</p>
      </>
    ),
    color: '#6d28d9',
  },
  { year: '2026 →', title: 'Await our story and progress', desc: null, color: '#4c1d95' },
];

export default function Timeline() {
  const [active, setActive] = useState(4);
  const [visible, setVisible] = useState(false);
  const [contentKey, setContentKey] = useState(4);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const goTo = (i) => {
    setActive(i);
    setContentKey(k => k + 1);
  };

  const prev = () => goTo(Math.max(0, active - 1));
  const next = () => goTo(Math.min(MILESTONES.length - 1, active + 1));

  const progressPct = MILESTONES.length > 1 ? (active / (MILESTONES.length - 1)) * 100 : 0;
  const m = MILESTONES[active];

  return (
    <section
      ref={sectionRef}
      style={{ background: 'transparent', padding: '100px 0', position: 'relative', zIndex: 1 }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          padding: '0 64px', marginBottom: 32, flexWrap: 'wrap', gap: 24,
          opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 24, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Our Story</span>
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-2px', textTransform: 'uppercase', color: 'var(--text)' }}>
            BUILT FOR <span style={{ color: 'var(--purple)' }}>PEOPLE.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.7 }}>
            The idea was born in November 2025 — here's how it grew.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <button className="slide-btn" onClick={prev} disabled={active === 0} aria-label="Previous milestone">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', minWidth: 42, textAlign: 'center' }}>
            {active + 1} / {MILESTONES.length}
          </span>
          <button className="slide-btn" onClick={next} disabled={active === MILESTONES.length - 1} aria-label="Next milestone">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          padding: '0 64px', marginBottom: 56,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease 0.15s',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {/* Track */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: 4, background: 'var(--border)', borderRadius: 4 }} />
          {/* Fill */}
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 4, background: 'var(--purple)', borderRadius: 4, width: `${progressPct}%`, transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)' }} />
          {/* Dots */}
          <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            {MILESTONES.map((ms, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to ${ms.title}`}
                style={{
                  width: i === active ? 28 : 16, height: 16, borderRadius: 8,
                  background: i <= active ? 'var(--purple)' : 'var(--bg)',
                  border: `3px solid ${i <= active ? 'var(--purple)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: i === active ? '0 0 0 4px rgba(124,58,237,0.2)' : 'none',
                  padding: 0, flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Year labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          {MILESTONES.map((ms, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 11, fontWeight: i === active ? 800 : 600,
                color: i === active ? 'var(--purple)' : 'var(--text-muted)',
                transition: 'color 0.3s', letterSpacing: '0.02em',
              }}
            >
              {ms.year}
            </button>
          ))}
        </div>
      </div>

      {/* Single active content panel */}
      <div
        style={{ padding: '0 64px' }}
      >
        <div
          key={contentKey}
          style={{
            maxWidth: active === 1 ? 960 : 680,
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            animation: visible ? 'tl-fade-in 0.45s ease forwards' : 'none',
          }}
        >
          <div style={{
            display: 'inline-block', background: m.color,
            color: '#fff', borderRadius: 20, padding: '5px 16px',
            fontSize: 13, fontWeight: 800, marginBottom: 20,
            letterSpacing: '0.01em',
          }}>
            {m.year}
          </div>

          <div style={{ fontWeight: 900, fontSize: 'clamp(28px, 3.5vw, 46px)', letterSpacing: '-1.5px', color: 'var(--text)', marginBottom: 16, lineHeight: 1.05 }}>
            {m.title}
          </div>

          {m.highlight && (
            <div style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, color: '#7c3aed', letterSpacing: '-2px', lineHeight: 1, marginBottom: 20 }}>
              {m.highlight}
            </div>
          )}

          {m.desc && (
            <div style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 520 }}>
              {m.desc}
            </div>
          )}

          {active === 1 && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 32, marginTop: 32,
              flexWrap: 'wrap',
            }}>
              <img
                src="/founders.jpeg"
                alt="Founders"
                style={{
                  width: 220, height: 220, objectFit: 'cover',
                  borderRadius: 16,
                  transform: 'rotate(-6deg)',
                  boxShadow: '0 8px 32px rgba(124,58,237,0.25)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 12, lineHeight: 1.3 }}>
                  The Team Behind Twedot
                </div>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 0 }}>
                  What started as a personal struggle to find local vendors turned into a mission. A small team united by one frustration —
                  and one vision: make local commerce as easy as sending a message.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes tl-fade-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
