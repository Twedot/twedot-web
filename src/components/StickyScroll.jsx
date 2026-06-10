import { useState, useRef, useEffect } from 'react';
import { useInView } from '../hooks/useInView';

// ── Slide Visuals ─────────────────────────────────────────────────────────────

function FriendsVisual() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg,#1a0f3d,#0e0625)', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(167,139,250,0.06) 1px,transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
      <div style={{ width: 210, height: 380, borderRadius: 32, background: 'rgba(14,6,37,0.95)', border: '2px solid rgba(124,58,237,0.4)', boxShadow: '0 24px 60px rgba(124,58,237,0.3)', overflow: 'hidden', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 60, height: 18, background: '#050310', borderRadius: '0 0 10px 10px', margin: '0 auto', flexShrink: 0 }} />

        {/* App bar */}
        <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid rgba(124,58,237,0.15)', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Twedot</div>
          <div style={{ fontSize: 8, color: '#a78bfa88' }}>3 unread messages</div>
        </div>

        {/* Chat list */}
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { init: 'M', name: 'Mum 👩‍👧', msg: 'Are you eating well? 😊', time: '2m', col: '#ec4899', unread: 1 },
            { init: 'B', name: 'Big Bro 💯', msg: "We on for Saturday right?", time: '15m', col: '#7c3aed', unread: 2 },
            { init: 'AD', name: 'Adaeze', msg: 'Haha yes!! 😂😂', time: '1h', col: '#a78bfa', unread: 0 },
            { init: 'FC', name: 'Flat Crew 🏠', msg: 'Emeka: I paid my part o', time: '2h', col: '#22c55e', unread: 0 },
            { init: 'TJ', name: 'Tunde J', msg: 'Guy when you dey come back?', time: '3h', col: '#f59e0b', unread: 0 },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 6px', borderRadius: 10, background: i === 0 ? 'rgba(124,58,237,0.1)' : 'transparent' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg,${c.col},${c.col}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{c.init}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{c.name}</div>
                  <div style={{ fontSize: 7, color: '#a78bfa55' }}>{c.time}</div>
                </div>
                <div style={{ fontSize: 8, color: '#a78bfa88', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.msg}</div>
              </div>
              {c.unread > 0 && <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', fontWeight: 700, flexShrink: 0 }}>{c.unread}</div>}
            </div>
          ))}
        </div>

        {/* Lock badge */}
        <div style={{ margin: '6px 10px 0', background: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: '6px 10px', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10 }}>🔒</span>
          <span style={{ fontSize: 7.5, color: '#22c55e', fontWeight: 600 }}>All chats end-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}

function DiscoverVisual() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg,#1a0f3d,#0e0625)', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(124,58,237,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.08) 1px,transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />
      <div style={{ width: 210, height: 380, borderRadius: 32, background: 'rgba(14,6,37,0.95)', border: '2px solid rgba(124,58,237,0.4)', boxShadow: '0 24px 60px rgba(124,58,237,0.3)', overflow: 'hidden', position: 'relative', zIndex: 2 }}>
        <div style={{ width: 60, height: 18, background: '#050310', borderRadius: '0 0 10px 10px', margin: '0 auto' }} />
        {/* Map */}
        <div style={{ margin: '8px', height: 165, borderRadius: 14, background: 'linear-gradient(135deg,#0d1b2a,#1a2a1a)', border: '1px solid rgba(124,58,237,0.2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(124,58,237,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.1) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
          {[
            { top: '25%', left: '35%', col: '#7c3aed', label: 'AC' },
            { top: '55%', left: '62%', col: '#22c55e', label: 'TH' },
            { top: '38%', left: '76%', col: '#a78bfa', label: 'MK' },
            { top: '72%', left: '24%', col: '#7c3aed', label: 'FK' },
          ].map((pin, i) => (
            <div key={i} style={{ position: 'absolute', top: pin.top, left: pin.left, transform: 'translate(-50%,-50%)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: pin.col, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${pin.col}88` }}>
                <span style={{ transform: 'rotate(45deg)', color: '#fff', fontSize: 7, fontWeight: 800 }}>{pin.label}</span>
              </div>
            </div>
          ))}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 0 5px rgba(59,130,246,0.25)' }} />
        </div>
        {/* Vendor list */}
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { init: 'AC', name: 'Ade Cobblers', dist: '0.3 km', col: '#7c3aed' },
            { init: 'TH', name: 'TechFix Hub', dist: '0.8 km', col: '#22c55e' },
            { init: 'MK', name: "Mama's Kitchen", dist: '1.2 km', col: '#a78bfa' },
          ].map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.1)', borderRadius: 10, padding: '7px 10px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg,${v.col},${v.col}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{v.init}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{v.name}</div>
                <div style={{ fontSize: 8, color: '#a78bfa' }}>📍 {v.dist}</div>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatVisual() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg,#1a0f3d,#0e0625)', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(167,139,250,0.06) 1px,transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
      <div style={{ width: 210, height: 380, borderRadius: 32, background: 'rgba(14,6,37,0.95)', border: '2px solid rgba(124,58,237,0.4)', boxShadow: '0 24px 60px rgba(124,58,237,0.3)', overflow: 'hidden', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 60, height: 18, background: '#050310', borderRadius: '0 0 10px 10px', margin: '0 auto', flexShrink: 0 }} />
        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>TH</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>TechFix Hub</div>
            <div style={{ fontSize: 8, color: '#22c55e' }}>● Online · 0.8 km</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#a78bfa' }}>🔒</div>
        </div>
        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflow: 'hidden' }}>
          {[
            { text: 'Hi! Can you fix my screen today?', mine: true },
            { text: 'Yes! I have a slot at 2pm 📍 Park St.', mine: false },
            { text: 'Perfect! How much?', mine: true },
            { text: '₦8,500. 30 mins job 👍', mine: false },
            { text: "Great, I'll be there!", mine: true },
          ].map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ background: msg.mine ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : 'rgba(124,58,237,0.15)', border: msg.mine ? 'none' : '1px solid rgba(124,58,237,0.25)', borderRadius: msg.mine ? '12px 12px 2px 12px' : '2px 12px 12px 12px', padding: '6px 9px', fontSize: 9, color: '#fff', maxWidth: '82%' }}>{msg.text}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '6px 10px', background: 'rgba(124,58,237,0.08)', borderTop: '1px solid rgba(124,58,237,0.15)', flexShrink: 0 }}>
          <span style={{ fontSize: 8, color: '#a78bfa66' }}>🔒 End-to-end encrypted · Messages never stored</span>
        </div>
      </div>
    </div>
  );
}

function TrustVisual() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg,#1a0f3d,#0e0625)', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(167,139,250,0.06) 1px,transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
      <div style={{ width: 230, zIndex: 2 }}>
        <div style={{ background: 'rgba(14,6,37,0.95)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 20, padding: '20px 16px', boxShadow: '0 24px 60px rgba(124,58,237,0.3)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>TH</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>TechFix Hub</div>
              <div style={{ fontSize: 10, color: '#a78bfa' }}>Screen Repair · 📍 0.8 km</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[{ val: '247', label: 'Customers', col: '#22c55e' }, { val: '1.2k', label: 'Chats', col: '#a78bfa' }, { val: '2yr', label: 'Active', col: '#c4b5fd' }].map((s, i) => (
              <div key={i} style={{ flex: 1, background: `${s.col}18`, borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: s.col }}>{s.val}</div>
                <div style={{ fontSize: 8, color: '#a78bfa88' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 600 }}>Open now · Closes at 6pm</span>
          </div>
        </div>
        <div style={{ background: 'rgba(14,6,37,0.8)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 9, color: '#c4b5fd', marginBottom: 5, lineHeight: 1.5 }}>"Fast and reliable, fixed my phone in 20 mins!"</div>
          <div style={{ fontSize: 8, color: '#a78bfa55' }}>— Verified customer · 2 days ago</div>
        </div>
      </div>
    </div>
  );
}

function GrowVisual() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg,#1a0f3d,#0e0625)', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(167,139,250,0.06) 1px,transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
      <div style={{ width: 230, zIndex: 2 }}>
        <div style={{ background: 'rgba(14,6,37,0.95)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 20, padding: '18px 16px', boxShadow: '0 24px 60px rgba(124,58,237,0.3)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's Overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[{ val: '12', label: 'Views', col: '#a78bfa' }, { val: '5', label: 'Messages', col: '#7c3aed' }, { val: '3', label: 'Bookings', col: '#22c55e' }, { val: '₦24k', label: 'Earned', col: '#c4b5fd' }].map((s, i) => (
              <div key={i} style={{ background: `${s.col}14`, border: `1px solid ${s.col}22`, borderRadius: 12, padding: '10px' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.col }}>{s.val}</div>
                <div style={{ fontSize: 9, color: '#a78bfa66' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: '#a78bfa55', marginBottom: 6 }}>Messages this week</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 44 }}>
              {[3, 5, 2, 8, 6, 10, 5].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h * 4}px`, background: i === 5 ? '#7c3aed' : 'rgba(124,58,237,0.25)', borderRadius: '3px 3px 0 0' }} />
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 10, padding: '8px 10px' }}>
            <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 600 }}>↑ 23% more views than last week</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Slides data ───────────────────────────────────────────────────────────────

const SLIDES = [
  { label: 'Step 01', title: ['CHAT WITH', 'FRIENDS &', 'FAMILY.'], desc: 'Start with the people you know. Send private messages, share moments, and stay connected with friends and family — all end-to-end encrypted.', cta: 'Start messaging', Visual: FriendsVisual },
  { label: 'Step 02', title: ['FIND SERVICES', 'NEAR YOU.'], desc: 'Browse vendors by category — shoe makers, electricians, tailors, food vendors. See them live on a map and reach out in seconds.', cta: 'Explore the map', Visual: DiscoverVisual },
  { label: 'Step 03', title: ['CHAT.', 'NO MIDDLEMEN.'], desc: 'Message any vendor directly. Every chat is encrypted end-to-end — no ads, no tracking. Just you and the person doing the work.', cta: 'See how it works', Visual: ChatVisual },
  { label: 'Step 04', title: ['YOUR BUSINESS', 'GROWS HERE.'], desc: 'List your service on Twedot. Customers find you by location, view your profile, and message you directly — zero commissions, ever.', cta: 'List your service', Visual: GrowVisual },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function StickyScroll() {
  const [active, setActive] = useState(0);
  const sectionRefs = useRef([]);
  const [headerRef, headerInView] = useInView(0.2);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.idx);
            if (!isNaN(idx)) setActive(idx);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-10% 0px -35% 0px' }
    );
    sectionRefs.current.forEach(el => { if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how-it-works" style={{ padding: '100px 0', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div ref={headerRef} style={{ maxWidth: 1100, margin: '0 auto 80px', padding: '0 64px' }}>
        <div className={`reveal ${headerInView ? 'visible' : ''}`}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 24, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>How it Works</span>
          </div>
          <h2 style={{ fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-3px', textTransform: 'uppercase', color: 'var(--text)', maxWidth: 520 }}>
            ONE APP.<br /><span style={{ color: 'var(--purple)' }}>ENDLESS USE.</span>
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 18, maxWidth: 460, lineHeight: 1.75 }}>
            Chat with the people you love, discover local services, and get things done — all in one place.
          </p>
        </div>
      </div>

      {/* Sticky scroll body */}
      <div className="sticky-scroll-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 64px', display: 'flex', gap: 80, alignItems: 'flex-start' }}>

        {/* Left: scrollable text panels */}
        <div style={{ flex: '0 0 400px' }}>
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              data-idx={String(i)}
              ref={el => sectionRefs.current[i] = el}
              style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '60px 0', opacity: active === i ? 1 : 0.28, transition: 'opacity 0.5s ease' }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 24, height: 2, background: 'var(--purple)', borderRadius: 2 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{slide.label}</span>
                </div>

                <h3 style={{ fontSize: 'clamp(36px, 4vw, 58px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-2.5px', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 24 }}>
                  {slide.title.map((line, li) => (
                    <span key={li} style={{ display: 'block', color: li === slide.title.length - 1 ? 'var(--purple)' : 'var(--text)' }}>{line}</span>
                  ))}
                </h3>

                <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 32 }}>{slide.desc}</p>

                <a
                  href="#"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--purple)', fontWeight: 700, fontSize: 15, transition: 'gap 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.gap = '14px'}
                  onMouseLeave={e => e.currentTarget.style.gap = '8px'}
                >
                  {slide.cta} <span>→</span>
                </a>

                {/* Progress dots */}
                <div style={{ display: 'flex', gap: 8, marginTop: 40 }}>
                  {SLIDES.map((_, di) => (
                    <div key={di} style={{ width: di === i ? 24 : 8, height: 8, borderRadius: 4, background: di === i ? 'var(--purple)' : 'var(--border)', transition: 'all 0.35s ease' }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: sticky visual */}
        <div style={{ flex: 1, position: 'sticky', top: '15vh', height: '70vh', alignSelf: 'flex-start' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden', boxShadow: '0 40px 100px rgba(124,58,237,0.22)' }}>
            {SLIDES.map((slide, i) => (
              <div key={i} style={{ position: 'absolute', inset: 0, opacity: active === i ? 1 : 0, transform: active === i ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)', transition: 'opacity 0.5s ease, transform 0.5s ease', pointerEvents: active === i ? 'auto' : 'none' }}>
                <slide.Visual />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
