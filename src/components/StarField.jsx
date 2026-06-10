const STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  x: ((i * 61.803) % 100).toFixed(2),
  y: ((i * 38.197 + i * i * 0.13) % 100).toFixed(2),
  isPlus: i % 4 === 0,
  delay: ((i * 0.37) % 4).toFixed(2),
  dur: (2.5 + (i % 5) * 0.5).toFixed(1),
}));

export default function StarField() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      {STARS.map(s => (
        <div key={s.id} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%` }}>
          {s.isPlus ? (
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ animation: `starPulse ${s.dur}s ${s.delay}s ease-in-out infinite`, display: 'block' }}>
              <rect x="4" y="0" width="2" height="10" style={{ fill: 'var(--star-c)' }} />
              <rect x="0" y="4" width="10" height="2" style={{ fill: 'var(--star-c)' }} />
            </svg>
          ) : (
            <div style={{ width: 3, height: 3, background: 'var(--star-c)', borderRadius: 1, animation: `starPulse ${s.dur}s ${s.delay}s ease-in-out infinite` }} />
          )}
        </div>
      ))}
    </div>
  );
}
