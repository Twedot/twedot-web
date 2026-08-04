import { useInView } from '../hooks/useInView';
import businessVideo from '../assets/videos/business.mp4';
import friendsVideo from '../assets/videos/friends.mp4';
import foodVideo from '../assets/videos/food.mp4';
import familyVideo from '../assets/videos/family.mp4';
import noStressVideo from '../assets/videos/no-stress.mp4';
import readyVideo from '../assets/videos/ready.mp4';

// Matches Bolt's "Latest features / Bolt Send" section (eyebrow, huge feature
// name, subtext, single CTA) — with an actual preview row of the feature
// sitting between the subtext and the button: real phone-tall (9:16) video
// clips, autoplaying muted/looping, with the same dark-gradient caption
// overlay used on the "Our services" cards.
const STORIES = [
  { id: 'business', caption: 'Launch your business with Twedot', video: businessVideo },
  { id: 'friends', caption: 'Share the memories with friends', video: friendsVideo },
  { id: 'food', caption: 'Get your next meal using Twedot', video: foodVideo },
  { id: 'family', caption: 'That feeling with family', video: familyVideo },
  { id: 'no-stress', caption: 'No need to stress looking for items', video: noStressVideo },
  { id: 'ready', caption: 'Twedot sets everything ready for you', video: readyVideo },
];

function StoryCard({ s }) {
  return (
    <a href="#" className="vs-card">
      <video className="vs-card-video" src={s.video} autoPlay loop muted playsInline />
      <div className="vs-card-scrim" />
      <div className="vs-card-caption">{s.caption}</div>
    </a>
  );
}

export default function LatestFeature() {
  const [ref, inView] = useInView(0.2);
  const [gridRef, gridInView] = useInView(0.1);

  return (
    <section style={{ background: 'var(--bg)', padding: 'clamp(72px, 9vw, 110px) 24px', textAlign: 'center' }}>
      <div ref={ref} className={`reveal ${inView ? 'visible' : ''}`} style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>
          Latest features
        </div>
        <h2 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.05, marginBottom: 20 }}>
          Video Stories
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>
          Watch vendors show their work before you book. See a haircut, a repair, a finished dress — real footage from real vendors near you.
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', opacity: 0.75 }}>
          Check the Nearby tab in-app for available videos.
        </p>
      </div>

      <div ref={gridRef} className={`reveal ${gridInView ? 'visible' : ''} vs-row-outer`} style={{ margin: 'clamp(48px, 6vw, 64px) auto' }}>
        <div className="vs-row">
          {STORIES.map(s => <StoryCard key={s.id} s={s} />)}
        </div>
      </div>

      <a
        href="https://play.google.com/store/apps/details?id=com.twedot&pli=1"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline"
        style={{ display: 'inline-flex', textDecoration: 'none' }}
      >
        Explore videos
      </a>

      <style>{`
        .vs-row-outer {
          width: 100%;
          max-width: 100vw;
        }
        .vs-row {
          display: flex;
          justify-content: flex-start;
          flex-wrap: nowrap;
          gap: 20px;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x proximity;
          padding: 4px 24px 8px;
        }
        .vs-row::-webkit-scrollbar { display: none; }
        .vs-row { scrollbar-width: none; }
        .vs-card {
          position: relative;
          height: clamp(440px, 62vh, 640px);
          aspect-ratio: 9 / 16;
          border-radius: 20px;
          overflow: hidden;
          display: block;
          text-decoration: none;
          flex-shrink: 0;
          scroll-snap-align: start;
        }
        .vs-card-video {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover;
        }
        .vs-card-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(10,0,16,0.05) 0%, rgba(10,0,16,0.15) 55%, rgba(10,0,16,0.8) 100%);
        }
        .vs-card-caption {
          position: absolute; left: 20px; right: 20px; bottom: 22px;
          color: #fff; font-weight: 800; font-size: 18px; line-height: 1.3; text-align: left;
        }

        @media (max-width: 960px) {
          .vs-card { height: clamp(360px, 58vh, 520px); }
        }
        @media (max-width: 640px) {
          .vs-row { padding: 4px 16px 8px; gap: 14px; }
        }
      `}</style>
    </section>
  );
}
