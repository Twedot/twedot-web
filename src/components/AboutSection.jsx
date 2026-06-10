import { useInView } from '../hooks/useInView';

function RandyAvatar() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
      <circle cx="70" cy="70" r="70" fill="#7c3aed"/>
      {/* Body / suit */}
      <path d="M16 140 Q16 112 70 107 Q124 112 124 140Z" fill="#4c1d95"/>
      <polygon points="62,107 70,124 78,107" fill="#a78bfa"/>
      {/* Neck */}
      <rect x="59" y="91" width="22" height="18" rx="6" fill="#C68B59"/>
      {/* Head */}
      <circle cx="70" cy="66" r="34" fill="#C68B59"/>
      {/* Ears */}
      <ellipse cx="36" cy="67" rx="7" ry="9" fill="#C68B59"/>
      <ellipse cx="104" cy="67" rx="7" ry="9" fill="#C68B59"/>
      {/* Crown */}
      <path d="M40 50 L46 32 L56 44 L70 26 L84 44 L94 32 L100 50Z" fill="#FBBF24"/>
      <circle cx="70" cy="27" r="4.5" fill="#EF4444"/>
      <circle cx="56" cy="45" r="3" fill="#34D399"/>
      <circle cx="84" cy="45" r="3" fill="#34D399"/>
      {/* Eyebrows */}
      <path d="M55 61 Q62 56 68 60" stroke="#7c4a00" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M72 60 Q78 56 85 61" stroke="#7c4a00" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Eyes */}
      <circle cx="62" cy="68" r="7" fill="#1a0800"/>
      <circle cx="78" cy="68" r="7" fill="#1a0800"/>
      <circle cx="64" cy="66" r="2.5" fill="white"/>
      <circle cx="80" cy="66" r="2.5" fill="white"/>
      {/* Nose */}
      <path d="M67 77 Q70 82 73 77" stroke="#AA6B3A" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Smile */}
      <path d="M57 86 Q70 99 83 86" stroke="#7c4a00" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M58 87 Q70 97 82 87 Q70 102 58 87Z" fill="#f4a58a"/>
      <path d="M61 88 Q70 96 79 88 Q70 98 61 88Z" fill="white"/>
    </svg>
  );
}

function CalebAvatar() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
      <circle cx="70" cy="70" r="70" fill="#4c1d95"/>
      {/* Body / hoodie */}
      <path d="M15 140 Q15 110 70 106 Q125 110 125 140Z" fill="#6d28d9"/>
      <polygon points="62,106 70,124 78,106" fill="#c4b5fd"/>
      <path d="M62 106 Q50 104 40 112" stroke="#c4b5fd" strokeWidth="3" fill="none"/>
      <path d="M78 106 Q90 104 100 112" stroke="#c4b5fd" strokeWidth="3" fill="none"/>
      {/* Neck */}
      <rect x="60" y="91" width="20" height="17" rx="6" fill="#D9956A"/>
      {/* Head */}
      <circle cx="70" cy="67" r="32" fill="#D9956A"/>
      {/* Ears */}
      <ellipse cx="38" cy="67" rx="7" ry="8" fill="#D9956A"/>
      <ellipse cx="102" cy="67" rx="7" ry="8" fill="#D9956A"/>
      {/* Hair */}
      <path d="M38 50 Q70 36 102 50 Q98 40 70 36 Q42 40 38 50Z" fill="#3d1a00"/>
      {/* Glasses frame left */}
      <rect x="50" y="61" width="17" height="13" rx="5" fill="none" stroke="#3d1a00" strokeWidth="2.5"/>
      {/* Glasses frame right */}
      <rect x="73" y="61" width="17" height="13" rx="5" fill="none" stroke="#3d1a00" strokeWidth="2.5"/>
      {/* Bridge */}
      <line x1="67" y1="67" x2="73" y2="67" stroke="#3d1a00" strokeWidth="2.5"/>
      {/* Arms */}
      <line x1="38" y1="67" x2="50" y2="67" stroke="#3d1a00" strokeWidth="2"/>
      <line x1="90" y1="67" x2="102" y2="67" stroke="#3d1a00" strokeWidth="2"/>
      {/* Eyes */}
      <circle cx="58" cy="67" r="4.5" fill="#1a0800"/>
      <circle cx="81" cy="67" r="4.5" fill="#1a0800"/>
      <circle cx="59.5" cy="65.5" r="1.5" fill="white"/>
      <circle cx="82.5" cy="65.5" r="1.5" fill="white"/>
      {/* Nose */}
      <path d="M68 76 Q70 80 72 76" stroke="#AA6B3A" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Smile */}
      <path d="M59 84 Q70 95 81 84" stroke="#7c4a00" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M60 85 Q70 94 80 85 Q70 98 60 85Z" fill="#f4a58a"/>
    </svg>
  );
}

function CharlesAvatar() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
      <circle cx="70" cy="70" r="70" fill="#5b21b6"/>
      {/* Body / t-shirt */}
      <path d="M16 140 Q16 112 70 107 Q124 112 124 140Z" fill="#3b0f8a"/>
      <rect x="54" y="105" width="32" height="4" rx="2" fill="#7c3aed"/>
      {/* Neck */}
      <rect x="60" y="90" width="20" height="18" rx="6" fill="#8B4513"/>
      {/* Head */}
      <circle cx="70" cy="65" r="33" fill="#8B4513"/>
      {/* Ears */}
      <ellipse cx="37" cy="66" rx="7" ry="8" fill="#8B4513"/>
      <ellipse cx="103" cy="66" rx="7" ry="8" fill="#8B4513"/>
      {/* Headphone band */}
      <path d="M37 57 Q70 30 103 57" stroke="#1a0e30" strokeWidth="7" fill="none" strokeLinecap="round"/>
      {/* Headphone cups */}
      <ellipse cx="37" cy="62" rx="10" ry="12" fill="#1a0e30"/>
      <ellipse cx="37" cy="62" rx="6" ry="8" fill="#7c3aed"/>
      <ellipse cx="103" cy="62" rx="10" ry="12" fill="#1a0e30"/>
      <ellipse cx="103" cy="62" rx="6" ry="8" fill="#7c3aed"/>
      {/* Short hair */}
      <path d="M38 50 Q70 36 102 50 Q97 38 70 34 Q43 38 38 50Z" fill="#0d0500"/>
      {/* Eyebrows */}
      <path d="M56 59 Q62 55 68 58" stroke="#0d0500" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M72 58 Q78 55 84 59" stroke="#0d0500" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Eyes */}
      <circle cx="62" cy="65" r="6.5" fill="#0d0500"/>
      <circle cx="78" cy="65" r="6.5" fill="#0d0500"/>
      <circle cx="64" cy="63" r="2" fill="white"/>
      <circle cx="80" cy="63" r="2" fill="white"/>
      {/* Nose */}
      <path d="M67 74 Q70 79 73 74" stroke="#7a3b0a" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Wide smile */}
      <path d="M57 83 Q70 97 83 83" stroke="#3a1800" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M58 84 Q70 96 82 84 Q70 102 58 84Z" fill="#c46b3a"/>
      <path d="M61 86 Q70 94 79 86 Q70 98 61 86Z" fill="white"/>
    </svg>
  );
}

const TEAM = [
  {
    Avatar: RandyAvatar,
    name: 'Prince Randy',
    role: 'Chief Executive Officer',
    tag: 'Founder & Visionary',
    desc: 'Building Twedot to connect people privately and empower local businesses across Africa.',
    accent: '#7c3aed',
    bg: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(167,139,250,0.06) 100%)',
  },
  {
    Avatar: CalebAvatar,
    name: 'Caleb',
    role: 'Co-Engineer',
    tag: 'Frontend & Mobile',
    desc: 'Crafting the interface that makes Twedot feel fast, smooth, and effortless on every device.',
    accent: '#6d28d9',
    bg: 'linear-gradient(135deg, rgba(109,40,217,0.1) 0%, rgba(196,181,253,0.06) 100%)',
  },
  {
    Avatar: CharlesAvatar,
    name: 'Charles',
    role: 'Co-Engineer',
    tag: 'Backend & Infrastructure',
    desc: 'Engineering the secure, reliable systems that keep Twedot running for thousands of users.',
    accent: '#5b21b6',
    bg: 'linear-gradient(135deg, rgba(91,33,182,0.1) 0%, rgba(167,139,250,0.06) 100%)',
  },
];

export default function AboutSection() {
  const [ref, inView] = useInView(0.15);

  return (
    <section id="about" style={{ background: 'transparent', padding: '100px 0', position: 'relative', zIndex: 1 }}>
      <div ref={ref} style={{ maxWidth: 1100, margin: '0 auto', padding: '0 64px' }}>

        {/* Header */}
        <div className={`reveal ${inView ? 'visible' : ''}`} style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
            — The Team —
          </div>
          <h2 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-3px', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 20 }}>
            BUILT BY <span style={{ color: 'var(--purple)' }}>PEOPLE</span><br />
            WHO CARE.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.75, maxWidth: 520, margin: '0 auto' }}>
            A small, focused team on a mission to make communication private and local commerce easy for everyday Nigerians.
          </p>
        </div>

        {/* Team cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28 }}>
          {TEAM.map((member, i) => (
            <div
              key={i}
              className={`reveal ${inView ? `visible delay-${i + 1}` : ''}`}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 28,
                padding: '40px 28px 32px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.25s, box-shadow 0.25s',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 20px 50px rgba(124,58,237,0.18)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              {/* Accent top bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${member.accent}, #a78bfa)` }} />

              {/* Avatar */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ borderRadius: '50%', overflow: 'hidden', width: 140, height: 140, boxShadow: `0 8px 32px ${member.accent}44` }}>
                  <member.Avatar />
                </div>
              </div>

              {/* Tag pill */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${member.accent}18`, border: `1px solid ${member.accent}30`, borderRadius: 20, padding: '4px 12px', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: member.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{member.tag}</span>
              </div>

              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 4 }}>{member.name}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)', marginBottom: 16 }}>{member.role}</div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{member.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
