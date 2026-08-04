import { useInView } from '../hooks/useInView';

const VENDORS = [
  { init: 'AC', name: 'Ade Cobblers',    type: 'Shoe Maker',      dist: '0.3 km', c1: '#7c3aed', c2: '#a78bfa' },
  { init: 'TH', name: 'TechFix Hub',     type: 'Screen Repair',   dist: '0.8 km', c1: '#4c1d95', c2: '#7c3aed' },
  { init: 'FK', name: 'Fabric Kings',    type: 'Tailor',          dist: '1.1 km', c1: '#6d28d9', c2: '#a78bfa' },
  { init: 'MK', name: "Mama's Kitchen",  type: 'Food Vendor',     dist: '0.5 km', c1: '#5b21b6', c2: '#c4b5fd' },
  { init: 'SB', name: 'Sam Barbers',     type: 'Barbershop',      dist: '1.4 km', c1: '#7c3aed', c2: '#6d28d9' },
  { init: 'CE', name: 'City Electrics',  type: 'Electrician',     dist: '0.7 km', c1: '#4c1d95', c2: '#a78bfa' },
  { init: 'PL', name: 'ProPlumb',        type: 'Plumber',         dist: '2.0 km', c1: '#6d28d9', c2: '#7c3aed' },
  { init: 'GD', name: 'GadgetDen',       type: 'Electronics',     dist: '0.6 km', c1: '#5b21b6', c2: '#a78bfa' },
  { init: 'FR', name: 'Fresh Rides',     type: 'Car Wash',        dist: '1.8 km', c1: '#7c3aed', c2: '#4c1d95' },
  { init: 'BK', name: 'Book Palace',     type: 'Stationery',      dist: '0.9 km', c1: '#4c1d95', c2: '#c4b5fd' },
];

function VendorCard({ v }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '24px 20px',
        width: 220,
        flexShrink: 0,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
        boxShadow: '0 4px 20px rgba(124,58,237,0.08)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(124,58,237,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.08)'; }}
    >
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg,${v.c1},${v.c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 900, color: '#fff', margin: '0 auto 16px' }}>
        {v.init}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>{v.name}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>{v.type}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 600 }}>📍 {v.dist}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            Online
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VendorParade() {
  const [headerRef, headerInView] = useInView(0.2);
  const doubled = [...VENDORS, ...VENDORS];

  return (
    <section style={{ background: 'var(--bg-alt)', padding: 'clamp(64px, 9vw, 110px) 0', overflow: 'hidden' }}>
      <div ref={headerRef} className="vendor-header" style={{ textAlign: 'center', padding: '0 64px', marginBottom: 56 }}>
        <div className={`reveal ${headerInView ? 'visible' : ''}`}>
          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 800, lineHeight: 1.1, color: 'var(--text)' }}>
            Hundreds of vendors, one app.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 12 }}>
            From shoe repairs to screen fixes — find and message any vendor near you, privately.
          </p>
        </div>
      </div>

      {/* Marquee */}
      <div className="marquee-wrap">
        <div className="marquee-track" style={{ paddingLeft: 32 }}>
          {doubled.map((v, i) => <VendorCard key={i} v={v} />)}
        </div>
      </div>
    </section>
  );
}
