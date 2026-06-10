import { useEffect, useRef, useState } from 'react';

function useFlipIn(threshold = 0.08) {
  const ref = useRef(null);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setFlipped(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, flipped];
}

export default function BookPage({ chapter, title, children, pageNum, delay = 0 }) {
  const [ref, flipped] = useFlipIn(0.08);

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        transformOrigin: 'left center',
        transform: flipped
          ? 'perspective(1100px) rotateY(0deg) translateX(0px)'
          : 'perspective(1100px) rotateY(-58deg) translateX(-32px)',
        opacity: flipped ? 1 : 0,
        transition: `transform 0.85s cubic-bezier(0.2,0.85,0.2,1) ${delay}s, opacity 0.55s ease ${delay}s`,
        marginBottom: 28,
      }}
    >
      {/* Page card */}
      <div
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--purple)',
          borderRadius: 18,
          padding: '44px 52px 36px',
          boxShadow: '0 28px 72px rgba(0,0,0,0.45), 0 2px 0 rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle corner fold decoration */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 0, height: 0,
          borderStyle: 'solid',
          borderWidth: '0 36px 36px 0',
          borderColor: `transparent var(--bg) transparent transparent`,
          opacity: 0.5,
        }} />

        {/* Chapter badge */}
        {chapter && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginBottom: 18,
          }}>
            <div style={{ width: 16, height: 2, background: 'var(--purple)', borderRadius: 2, opacity: 0.6 }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'var(--purple)',
              textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.8,
            }}>
              {chapter}
            </span>
          </div>
        )}

        {/* Section title */}
        <h2 style={{
          fontSize: 22, fontWeight: 800, color: 'var(--text)',
          marginBottom: 24, letterSpacing: '-0.4px', lineHeight: 1.2,
        }}>
          {title}
        </h2>

        {/* Ruled divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, var(--purple) 0%, var(--border) 60%, transparent 100%)',
          marginBottom: 28, opacity: 0.4,
        }} />

        {/* Content */}
        <div style={{ fontSize: 15.5, color: 'var(--text-muted)', lineHeight: 1.9 }}>
          {children}
        </div>

        {/* Page number */}
        {pageNum && (
          <div style={{
            marginTop: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.4 }} />
            <span style={{
              fontSize: 11, color: 'var(--purple)', opacity: 0.5,
              fontWeight: 700, letterSpacing: '0.1em',
            }}>
              {pageNum}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
