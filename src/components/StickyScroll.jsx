import { useInView } from '../hooks/useInView';
import vendorPhoto from '../assets/images/service-hair-2.jpg';
import freelancePhoto from '../assets/images/service-hair.jpg';

// Matches Bolt's "Earn money with Bolt" page exactly: a left-aligned intro
// (headline + one paragraph), then stacked photo/text panels that alternate
// which side the photo sits on — eyebrow label, bold sub-headline, one
// paragraph, single CTA button, real photo alongside.
const PANELS = [
  {
    id: 'vendor',
    eyebrow: 'Earn money as a Twedot vendor',
    title: 'List your service, get paid',
    desc: 'Our growing base of local customers will send you plenty of service requests. Appear on the map for your area, respond in real time, and chat with every customer directly.',
    cta: 'Start listing today',
    href: '/#download',
    photo: vendorPhoto,
    photoAlt: 'Vendor providing a service',
    imgSide: 'right',
  },
  {
    id: 'freelance',
    eyebrow: 'Earn with every request',
    title: 'Work on your own time',
    desc: "You decide when and how often you take jobs — weekdays, evenings, weekends, or just the occasional hour. It's entirely up to you.",
    cta: 'Get Twedot',
    href: '/#download',
    photo: freelancePhoto,
    photoAlt: 'Vendor providing a service on their own schedule',
    imgSide: 'left',
  },
];

function Panel({ p, i }) {
  const [ref, inView] = useInView(0.2);
  const text = (
    <div style={{ flex: '1 1 380px', maxWidth: 480, alignSelf: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple)', marginBottom: 14 }}>{p.eyebrow}</div>
      <h3 style={{ fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.15, marginBottom: 16 }}>{p.title}</h3>
      <p style={{ fontSize: 15.5, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 28, maxWidth: 440 }}>{p.desc}</p>
      <a href={p.href} className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none', padding: '14px 32px', fontSize: 15 }}>
        {p.cta}
      </a>
    </div>
  );
  const image = (
    // The source photos are already a tall 2:3 portrait — no need to force a
    // width and crop with object-fit:cover (that's what was slicing the
    // photo in half). Just size by height and let width follow the photo's
    // own aspect ratio: the whole image shows, full height, phone-tall.
    <div className="earn-image" style={{ flexShrink: 0 }}>
      <img
        src={p.photo}
        alt={p.photoAlt}
        style={{ display: 'block', height: 'clamp(480px, 68vh, 720px)', width: 'auto', maxWidth: '100%', borderRadius: 24 }}
      />
    </div>
  );

  return (
    <div
      ref={ref}
      className={`reveal delay-${Math.min(i, 3)} ${inView ? 'visible' : ''} earn-split`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(40px, 6vw, 80px)', flexWrap: 'wrap',
        marginBottom: i < PANELS.length - 1 ? 'clamp(96px, 12vw, 160px)' : 0,
        paddingBottom: i < PANELS.length - 1 ? 'clamp(96px, 12vw, 160px)' : 0,
        borderBottom: i < PANELS.length - 1 ? '1px solid var(--border-sub)' : 'none',
      }}
    >
      {p.imgSide === 'left' ? <>{image}{text}</> : <>{text}{image}</>}
    </div>
  );
}

export default function StickyScroll() {
  const [headerRef, headerInView] = useInView(0.2);

  return (
    <section id="how-it-works" style={{ background: 'var(--bg)', padding: 'clamp(96px, 12vw, 150px) 0' }}>
      <div ref={headerRef} className="section-header-pad" style={{ maxWidth: 1100, margin: '0 auto clamp(72px, 9vw, 110px)', padding: '0 64px' }}>
        <div className={`reveal ${headerInView ? 'visible' : ''}`}>
          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>
            Earn money with Twedot
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 10, maxWidth: 480 }}>
            Join our growing community of vendors and freelancers earning through the app.
          </p>
        </div>
      </div>

      <div className="earn-col" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 64px' }}>
        {PANELS.map((p, i) => <Panel key={p.id} p={p} i={i} />)}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .earn-split { flex-direction: column !important; }
          .earn-image img { height: clamp(380px, 60vh, 560px) !important; }
        }
      `}</style>
    </section>
  );
}
