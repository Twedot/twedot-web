import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Same tile source + pin style as the mobile app's map screen (Leaflet + OSM/CartoDB,
// no API key) — see app/nearby/map.tsx's buildMapHTML in the mobile repo.
const CENTER = [6.5244, 3.3792]; // Lagos

// 40 vendors, one per service type, spread deterministically (golden-ratio offsets, same
// technique used elsewhere in this file for star placement — no Math.random) across the
// whole visible map extent at zoom 11, edges included, not clustered near the center.
const VENDOR_TYPES = [
  ['Ade Cobblers', 'Shoe Maker'], ['TechFix Hub', 'Screen Repair'], ["Mama's Kitchen", 'Food Vendor'],
  ['Fabric Kings', 'Tailor'], ['Bright Electrics', 'Electrician'], ['QuickFix Plumbing', 'Plumber'],
  ['GlowUp Studio', 'Hair Stylist'], ['CodeCraft Devs', 'Software Developer'], ['Snap Studio', 'Photographer'],
  ['CleanPro Services', 'Cleaner'], ['MoveIt Logistics', 'Delivery'], ['FixIt Auto', 'Mechanic'],
  ['Bloom Florals', 'Florist'], ['Prime Cuts', 'Butcher'], ['Nail Bar Lagos', 'Nail Technician'],
  ['Fresh Press', 'Laundry'], ['SecureGuard', 'Security'], ['PixelWorks', 'Graphic Designer'],
  ['Sweet Treats', 'Baker'], ['Handy Carpentry', 'Carpenter'], ['AC Masters', 'AC Repair'],
  ['Glam Makeup', 'Makeup Artist'], ['Legal Aid NG', 'Lawyer'], ['FitLife PT', 'Personal Trainer'],
  ['TutorHub', 'Tutor'], ['PaintPro', 'Painter'], ['WeldWorks', 'Welder'], ['GreenThumb', 'Gardener'],
  ['PestOut', 'Pest Control'], ['EventCraft', 'Event Planner'], ['SoundWave DJ', 'DJ'],
  ['CakeCraft', 'Cake Maker'], ['RoofRight', 'Roofer'], ['GlassFix', 'Glazier'], ['LockSmiths NG', 'Locksmith'],
  ['PetCare Plus', 'Pet Groomer'], ['DriveEasy', 'Driver'], ['UpholsterIt', 'Upholsterer'],
  ['SolarTech NG', 'Solar Installer'], ['CCTV Pro', 'CCTV Installer'],
];

const VENDOR_PINS = VENDOR_TYPES.map(([name, type], i) => {
  const fx = (i * 0.618034) % 1;               // golden-ratio spread, 0..1
  const fy = ((i * 0.381966) + i * i * 0.008) % 1;
  return {
    id: i + 1,
    name,
    type,
    pos: [6.35 + fx * 0.35, 3.24 + fy * 0.32],
  };
});

// Small pin, service title baked right into the marker (not just a hover popup) — a
// permanent white label pill sits above the dot, always visible on the map.
function pinIcon(type) {
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);">
      <div style="background:#fff;color:#0a0010;font:700 8.5px Manrope,sans-serif;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px rgba(10,0,16,0.18);margin-bottom:2px;">${type}</div>
      <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.5" fill="#7c3aed" stroke="#fff" stroke-width="2"/></svg>
    </div>`;
  return L.divIcon({ html, className: '', iconSize: [12, 12], iconAnchor: [6, 6] });
}

const CATEGORIES = ['Hair Stylist', 'Electrician', 'Plumber', 'Tailor', 'Software Developer', 'Photographer'];
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.twedot&pli=1';

// A single stacked, light-gray field — matches Uber's "Get a ride" card fields
// exactly (plain flat gray pill, small marker icon on the left, no borders).
function Field({ icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f2f1f6', borderRadius: 10, padding: '13px 16px' }}>
      <span style={{ flexShrink: 0, display: 'flex', color: '#5c4b80' }}>{icon}</span>
      {children}
    </div>
  );
}

const DotIcon = () => <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />;
const SquareIcon = () => <span style={{ width: 8, height: 8, background: '#0a0010', display: 'inline-block' }} />;
const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

export default function Hero() {
  const [locationLabel, setLocationLabel] = useState('');
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | detecting | done | denied
  const [category, setCategory] = useState('');
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [description, setDescription] = useState('');
  const categoryBoxRef = useRef(null);

  // Real browser geolocation + reverse geocode via Nominatim (same OSM stack as the map,
  // no API key) — mirrors the mobile app's auto-fill-on-open behaviour.
  useEffect(() => {
    if (!navigator.geolocation) { setLocationStatus('denied'); return; }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const a = data.address || {};
          const label = [a.suburb || a.neighbourhood || a.road, a.city || a.town || a.state].filter(Boolean).join(', ');
          setLocationLabel(label || data.display_name || 'Current location');
        } catch {
          setLocationLabel('Current location');
        }
        setLocationStatus('done');
      },
      () => setLocationStatus('denied'),
      { timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (categoryBoxRef.current && !categoryBoxRef.current.contains(e.target)) setShowCategoryList(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const canSubmit = category.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // No web account/session exists to actually create the request against — the real
    // flow lives in the app. Hand off there with everything already filled in on their end.
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
  };

  const locationText = locationStatus === 'detecting' ? 'Detecting your location…'
    : locationStatus === 'denied' ? 'Location unavailable'
    : locationLabel || 'Your location';

  return (
    <section id="home" style={{ background: '#fff', padding: '128px 24px 72px' }}>
      <div className="hero-row" style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 40, alignItems: 'flex-start' }}>

        {/* ── Left: request form — plain stacked light-gray fields, same pattern as
             Uber's "Get a ride" card (icon + field, no borders, no gradients). ── */}
        <div className="hero-form-col" style={{ flex: '0 0 400px', width: 400, maxWidth: '100%' }}>
          <h1 style={{ fontSize: 'clamp(30px, 3.2vw, 42px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1, marginBottom: 28 }}>
            Get a service
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Field icon={<DotIcon />}>
              <input
                type="text"
                value={locationStatus === 'detecting' ? '' : locationLabel}
                onChange={(e) => { setLocationLabel(e.target.value); setLocationStatus('done'); }}
                placeholder={locationText}
                style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
              />
              {locationStatus === 'detecting' && (
                <span style={{ width: 14, height: 14, border: '2px solid #ddd6f8', borderTopColor: '#7c3aed', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              )}
            </Field>

            <div ref={categoryBoxRef} style={{ position: 'relative' }}>
              <Field icon={<ListIcon />}>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onFocus={() => setShowCategoryList(true)}
                  placeholder="What service do you need?"
                  style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
                />
              </Field>
              {showCategoryList && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 5 }}>
                  {CATEGORIES.filter(c => c.toLowerCase().includes(category.toLowerCase())).map(c => (
                    <div
                      key={c}
                      onClick={() => { setCategory(c); setShowCategoryList(false); }}
                      style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f6f4ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Field icon={<SquareIcon />}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you need done"
                rows={1}
                style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, color: 'var(--text)', outline: 'none', fontFamily: 'inherit', resize: 'none' }}
              />
            </Field>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              background: canSubmit ? '#7c3aed' : '#f2f1f6', color: canSubmit ? '#fff' : '#9b8fb8',
              border: 'none', borderRadius: 10, padding: '15px', fontWeight: 800, fontSize: 15.5,
              marginTop: 18, cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = '#6d28d9'; }}
            onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = '#7c3aed'; }}
          >
            {canSubmit ? 'Find vendors near you' : 'Search'}
          </button>

          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 14 }}>
            Opens the Twedot app to finish sending your request.
          </p>
        </div>

        {/* ── Right: real map, same Leaflet/OSM setup as the mobile app, filling the
             rest of the hero — plain and static like Uber's homepage map. ── */}
        <div className="hero-map-col" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ height: 560, borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <MapContainer
              center={CENTER}
              zoom={11}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
              attributionControl={false}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" subdomains="abcd" maxZoom={19} />
              <CircleMarker center={CENTER} radius={9} pathOptions={{ fillColor: '#22c55e', color: '#fff', weight: 3, fillOpacity: 1 }} />
              {VENDOR_PINS.map(v => (
                <Marker key={v.id} position={v.pos} icon={pinIcon(v.type)} />
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
