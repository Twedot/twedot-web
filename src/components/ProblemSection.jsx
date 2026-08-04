import { useInView } from '../hooks/useInView';
import chatPhoto from '../assets/images/service-chat.jpg';
import discoverPhoto from '../assets/images/service-discover.jpg';
import repairPhoto from '../assets/images/service-repair.jpg';
import tailorPhoto from '../assets/images/service-tailor.jpg';
import artistPhoto from '../assets/images/service-artist.jpg';
import workPhoto from '../assets/images/service-work.jpg';

// Matches Bolt.eu's "Our services" strip: a left-aligned header, then a row
// of tall photo cards, roughly full-screen height (not the whole viewport —
// that leaves no room to see it's a scrollable row), spaced apart with real
// gaps rather than touching edge-to-edge. Title + subtitle sit near the TOP
// of each card, CTA directly beneath. Every card uses a real photo (matched
// to what's actually happening in it) rather than a plain color/gradient tile.
const SERVICES = [
  {
    id: 'chat',
    title: 'Chat, privately',
    desc: 'Message vendors and friends. End-to-end encrypted.',
    cta: 'Start chatting',
    ctaBg: '#7c3aed',
    ctaFg: '#fff',
    photo: chatPhoto,
    href: '#',
  },
  {
    id: 'discover',
    title: 'Find vendors nearby',
    desc: 'See real vendors live on the map, sorted by distance.',
    cta: 'See the map',
    ctaBg: '#e9fbee',
    ctaFg: '#0a0010',
    photo: discoverPhoto,
    href: '#',
  },
  {
    id: 'book',
    title: 'Book a service',
    desc: 'Post what you need, get real bids in minutes.',
    cta: 'Get started',
    ctaBg: '#fff',
    ctaFg: '#0a0010',
    photo: repairPhoto,
    href: '#',
  },
  {
    id: 'business',
    title: 'Grow your business',
    desc: 'Get discovered by location. Zero commission, ever.',
    cta: 'List your service',
    ctaBg: '#0a0010',
    ctaFg: '#fff',
    photo: tailorPhoto,
    href: '/#vendors',
  },
  {
    id: 'video',
    title: 'Video Stories',
    desc: 'Watch vendors show their work before you book.',
    cta: 'Explore videos',
    ctaBg: '#fff',
    ctaFg: '#0a0010',
    photo: artistPhoto,
    href: '#',
  },
  {
    id: 'requests',
    title: 'Manage requests',
    desc: 'Track every booking and message from one place.',
    cta: 'See how it works',
    ctaBg: '#0a0010',
    ctaFg: '#fff',
    photo: workPhoto,
    href: '/#how-it-works',
  },
];

function ServiceCard({ s }) {
  return (
    <a href={s.href} className="obolt-card">
      <img src={s.photo} alt="" className="obolt-card-img" />
      <div className="obolt-card-scrim" />
      <div className="obolt-card-copy">
        <div className="obolt-card-title">{s.title}</div>
        <div className="obolt-card-desc">{s.desc}</div>
        <span className="obolt-card-cta" style={{ background: s.ctaBg, color: s.ctaFg }}>
          {s.cta}
        </span>
      </div>
    </a>
  );
}

export default function ProblemSection() {
  const [headerRef, headerInView] = useInView(0.2);

  return (
    <section id="services" style={{ background: '#fff', padding: 'clamp(72px, 10vw, 120px) 0' }}>
      <div ref={headerRef} className="obolt-header" style={{ maxWidth: 1280, margin: '0 auto 40px', padding: '0 64px' }}>
        <div className={`reveal ${headerInView ? 'visible' : ''}`}>
          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.05 }}>
            Our services
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text-muted)', marginTop: 10, maxWidth: 460 }}>
            Everything local, in one app. Some features are rolling out — check back as we grow.
          </p>
        </div>
      </div>

      <div className="obolt-scroll">
        {SERVICES.map(s => <ServiceCard key={s.id} s={s} />)}
      </div>

      <style>{`
        .obolt-scroll {
          display: flex;
          flex-wrap: nowrap;
          gap: 14px;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x proximity;
          width: 100%;
          padding: 0 64px;
        }
        .obolt-scroll::-webkit-scrollbar { display: none; }
        .obolt-scroll { scrollbar-width: none; }

        .obolt-card {
          position: relative;
          flex: 0 0 clamp(280px, 24vw, 380px);
          /* Full screen height with a real gap so each card reads as its own
             tile instead of bleeding into its neighbour. */
          height: 92vh;
          min-height: 560px;
          border-radius: 12px;
          display: block;
          text-decoration: none;
          overflow: hidden;
          scroll-snap-align: start;
        }
        .obolt-card-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .obolt-card:hover .obolt-card-img { transform: scale(1.04); }
        .obolt-card-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(10,0,16,0.55) 0%, rgba(10,0,16,0.1) 32%, rgba(10,0,16,0.05) 55%, rgba(10,0,16,0.5) 100%);
        }
        .obolt-card-copy {
          position: absolute; left: 32px; right: 32px; top: 40px;
        }
        .obolt-card-title { color: #fff; font-weight: 800; font-size: clamp(22px, 2vw, 28px); line-height: 1.15; margin-bottom: 10px; }
        .obolt-card-desc { color: rgba(255,255,255,0.85); font-size: 15.5px; line-height: 1.5; margin-bottom: 24px; max-width: 240px; }
        .obolt-card-cta { display: inline-block; font-weight: 700; font-size: 14.5px; padding: 12px 24px; border-radius: 8px; }

        @media (max-width: 960px) {
          .obolt-header { padding: 0 24px !important; }
          .obolt-scroll { padding: 0 24px; }
          .obolt-card { flex-basis: 78vw; }
        }
        @media (max-width: 640px) {
          .obolt-header { padding: 0 16px !important; }
          .obolt-scroll { padding: 0 16px; }
          .obolt-card-copy { left: 24px; right: 24px; top: 32px; }
        }
      `}</style>
    </section>
  );
}
