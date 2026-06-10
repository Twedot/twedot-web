// Star positions derived deterministically (no Math.random on every render)
const STARS = Array.from({ length: 58 }, (_, i) => ({
  id: i,
  x: ((i * 61.803) % 100).toFixed(2),
  y: ((i * 38.197 + i * i * 0.13) % 100).toFixed(2),
  isPlus: i % 3 === 0,
  opacity: (0.2 + (i % 7) * 0.07).toFixed(2),
  delay: ((i * 0.37) % 4).toFixed(2),
  dur: (2.2 + (i % 5) * 0.4).toFixed(1),
}));

const VENDORS = [
  { init: 'AC', name: 'Ade Cobblers',  type: 'Shoe Maker',    dist: '0.3 km', c1: '#7c3aed', c2: '#a78bfa', cls: 'floatA', pos: { top: 44,  left: 0   } },
  { init: 'TH', name: 'TechFix Hub',   type: 'Screen Repair', dist: '0.8 km', c1: '#4c1d95', c2: '#7c3aed', cls: 'floatB', pos: { top: 20,  right: 0  } },
  { init: 'MK', name: "Mama's Kitchen", type: 'Food Vendor',  dist: '0.5 km', c1: '#6d28d9', c2: '#a78bfa', cls: 'floatC', pos: { bottom: 64, left: 4  } },
  { init: 'FK', name: 'Fabric Kings',  type: 'Tailor',        dist: '1.1 km', c1: '#5b21b6', c2: '#7c3aed', cls: 'floatA', pos: { bottom: 40, right: 0 } },
];

function VendorCard({ v }) {
  return (
    <div
      style={{
        ...v.pos,
        position: 'absolute',
        animation: `${v.cls} ${v.cls === 'floatB' ? 5 : v.cls === 'floatC' ? 4.5 : 4}s ease-in-out infinite`,
        background: 'rgba(30,15,60,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(167,139,250,0.25)',
        borderRadius: 16, padding: '12px 14px', width: 162,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${v.c1},${v.c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{v.init}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{v.name}</div>
          <div style={{ fontSize: 10, color: '#a78bfa' }}>{v.type}</div>
        </div>
      </div>
      <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>📍 {v.dist}</div>
        <div style={{ fontSize: 10, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Open
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section
      id="home"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(155deg, #050310 0%, #0e0625 28%, #1a0f3d 58%, #2d1b69 85%, #3b1f7a 100%)',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Stars */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {STARS.map(s => (
          <div key={s.id} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%` }}>
            {s.isPlus ? (
              <svg width="13" height="13" viewBox="0 0 13 13" style={{ animation: `starPulse ${s.dur}s ${s.delay}s ease-in-out infinite` }}>
                <rect x="5.5" y="0" width="2" height="13" fill={`rgba(255,255,255,${s.opacity})`} />
                <rect x="0" y="5.5" width="13" height="2" fill={`rgba(255,255,255,${s.opacity})`} />
              </svg>
            ) : (
              <div style={{ width: 5, height: 5, background: `rgba(255,255,255,${s.opacity})`, borderRadius: 1, animation: `starPulse ${s.dur}s ${s.delay}s ease-in-out infinite` }} />
            )}
          </div>
        ))}
      </div>

      {/* Radial glow */}
      <div style={{ position: 'absolute', top: '35%', right: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Main split */}
      <div
        className="hero-split"
        style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '120px 64px 40px', maxWidth: 1280, margin: '0 auto', width: '100%', gap: 40 }}
      >
        {/* Left: Text */}
        <div style={{ flex: 1, zIndex: 1 }}>
          <h1
            style={{
              fontSize: 'clamp(52px, 7.5vw, 100px)',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 0.94,
              letterSpacing: '-4px',
              textTransform: 'uppercase',
              marginBottom: 32,
            }}
          >
            CHAT<br />
            PRIVATELY.<br />
            SHOP<br />
            <span style={{ background: 'linear-gradient(90deg,#a78bfa,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>LOCALLY.</span>
          </h1>
          <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.68)', lineHeight: 1.8, maxWidth: 460 }}>
            Private messaging for the people in your life. Local vendor discovery for everything else. Twedot is the app that does both — securely.
          </p>

          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 40 }}>
            <div style={{ display: 'flex' }}>
              {[['AC','#7c3aed','#a78bfa'],['TH','#4c1d95','#7c3aed'],['FK','#6d28d9','#a78bfa'],['MK','#5b21b6','#c4b5fd']].map(([init,c1,c2],i)=>(
                <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${c1},${c2})`, border: '2px solid rgba(255,255,255,0.2)', marginLeft: i===0?0:-10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', zIndex: 4-i }}>
                  {init}
                </div>
              ))}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              <strong style={{ color: '#fff' }}>50,000+</strong> users already connected
            </span>
          </div>
        </div>

        {/* Right: Phone + floating vendor cards */}
        <div className="hero-visual" style={{ flex: '0 0 auto', width: 500, height: 540, position: 'relative' }}>
          {/* Glow behind phone */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Phone */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 214, height: 380, borderRadius: 36, background: 'linear-gradient(160deg,#1a0f3d,#221842)', border: '1.5px solid rgba(124,58,237,0.4)', boxShadow: '0 32px 80px rgba(124,58,237,0.35), inset 0 0 0 1px rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            <div style={{ width: 72, height: 22, background: '#050310', borderRadius: '0 0 12px 12px', margin: '0 auto' }} />
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: 'rgba(124,58,237,0.2)', borderRadius: 8, padding: '7px 10px', borderLeft: '3px solid #7c3aed' }}>
                <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 600 }}>📍 Twedot Map · Nearby</div>
              </div>
              {[{ init: 'AC', name: 'Ade Cobblers', msg: 'Hi! Are you available? 👋', mine: true },
                { init: 'TH', name: 'TechFix Hub',  msg: 'Yes! How can I help? 😊', mine: false }].map((c,i)=>(
                <div key={i} style={{ background: 'rgba(124,58,237,0.1)', borderRadius: 10, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg,${i===0?'#7c3aed,#a78bfa':'#4c1d95,#7c3aed'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>{c.init}</div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{c.name}</div>
                      <div style={{ fontSize: 9, color: '#22c55e' }}>● Online</div>
                    </div>
                  </div>
                  <div style={{ background: c.mine ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : 'rgba(124,58,237,0.18)', border: c.mine ? 'none' : '1px solid rgba(124,58,237,0.3)', borderRadius: c.mine ? '10px 10px 2px 10px' : '2px 10px 10px 10px', padding: '5px 9px', fontSize: 10, color: '#fff' }}>{c.msg}</div>
                </div>
              ))}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 10px' }}>
                <div style={{ fontSize: 9, color: '#a78bfa', marginBottom: 2 }}>🔒 End-to-end encrypted</div>
                <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#7c3aed99' }}>aG9sbXVlcm9iYXNl...</div>
              </div>
            </div>
          </div>

          {/* Floating vendor cards */}
          {VENDORS.map(v => <VendorCard key={v.init} v={v} />)}
        </div>
      </div>

    </section>
  );
}
