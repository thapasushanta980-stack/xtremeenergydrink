import { useEffect, useRef, useState } from 'react';
import { REELS, SHORTS, SOCIAL, reelCover, thumb, type Short } from '../data';
import gsap from 'gsap';
import { Button, Reveal, SectionLabel, reduceMotion } from './ui';

/* ----------------------------------------------------------- NoPause */

export function BrandStatement() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (reduceMotion()) {
      el.querySelectorAll('.np-line').forEach((l) => ((l as HTMLElement).style.opacity = '1'));
      return;
    }
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>('.np-line');
      gsap.set(lines, { opacity: 0.08, xPercent: -6 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.5 },
      });
      lines.forEach((l, i) => {
        tl.to(l, { opacity: 1, xPercent: 0, duration: 1, ease: 'power3.out' }, i * 1.1);
        if (i < lines.length - 1) tl.to(l, { opacity: 0.18, duration: 0.8 }, i * 1.1 + 1.5);
      });
      tl.to({}, { duration: 0.6 });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="nopause" ref={root} data-can="0,0,0,0,0,0,0,0">
      <div className="bg nopause-bg" />
      <div className="nopause-sticky">
        <h2 aria-label="No pause. No limits. Go Xtreme.">
          <span className="np-line">NO PAUSE.</span>
          <span className="np-line">NO LIMITS.</span>
          <span className="np-line hot">GO XTREME.</span>
        </h2>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Community */

function Player({ short }: { short: Short }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(false), [short.id]);
  return (
    <div className="player" data-cursor={on ? undefined : 'PLAY'}>
      {on ? (
        <iframe
          title={short.title}
          src={`https://www.youtube-nocookie.com/embed/${short.id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setOn(true)} aria-label={`Play: ${short.title}`}>
          <img src={thumb(short.id)} alt="" loading="lazy" decoding="async" />
          <span className="play" aria-hidden="true" />
          <span className="player-cap">
            <small>{short.tag}</small>
            {short.title}
          </span>
        </button>
      )}
    </div>
  );
}

const IG_HEADER = 54; // Instagram embed chrome above the video
const IG_FOOTER = 152; // ...and below it (actions, likes, comment box)

/** Instagram embed cropped to just the video: the embed reports its height, we trim header and footer. */
function IgPlayer({ id, n }: { id: string; n: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    setH(null);
    const on = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        const m = JSON.parse(e.data);
        if (m.type === 'MEASURE' && m.details?.height) setH(m.details.height);
      } catch {
        /* ignore non-JSON messages */
      }
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, [id]);

  const media = h ? Math.max(120, h - IG_HEADER - IG_FOOTER) : null;
  return (
    <div className="ig-player" style={media ? { height: media } : { aspectRatio: '4 / 5' }}>
      <iframe
        ref={ref}
        key={id}
        title={`Instagram reel ${n}`}
        src={`https://www.instagram.com/reel/${id}/embed/`}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        scrolling="no"
        style={{ height: h ?? '140%' }}
      />
    </div>
  );
}

export function Community() {
  const [tab, setTab] = useState<'youtube' | 'instagram'>('youtube');
  const [active, setActive] = useState(0);
  const [igActive, setIgActive] = useState(0);
  const current = SHORTS[active];
  const rest = SHORTS.map((s, i) => ({ s, i })).filter((x) => x.i !== active);
  return (
    <section className="community" id="community" data-can="0,0,0,0,0,0,0,0">
      <div className="bg community-bg" />
      <div className="community-head">
        <SectionLabel index="05">XTREME ON SCREEN</SectionLabel>
        <Reveal as="h2" text={'SHOW US\nYOUR XTREME.'} className="h-xl" />
        <div className="community-actions">
          <Button href={SOCIAL.instagram} cursor="FOLLOW">
            @XTREME_ENERGYDRINK
          </Button>
          <Button href={SOCIAL.youtube} variant="ghost" cursor="WATCH">
            YOUTUBE SHORTS
          </Button>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="Video source">
        <button role="tab" aria-selected={tab === 'youtube'} className={tab === 'youtube' ? 'is-active' : ''} onClick={() => setTab('youtube')} data-cursor="hover">
          YouTube Shorts
        </button>
        <button role="tab" aria-selected={tab === 'instagram'} className={tab === 'instagram' ? 'is-active' : ''} onClick={() => setTab('instagram')} data-cursor="hover">
          Instagram Reels
        </button>
      </div>
      {tab === 'instagram' && (
        <div className="reels">
          <div className="reels-main">
            <IgPlayer id={REELS[igActive]} n={igActive + 1} />
            <p className="reels-title">
              <span>NOW PLAYING · INSTAGRAM</span>
              Reel {String(igActive + 1).padStart(2, '0')}
            </p>
          </div>
          <ul className="reels-rail">
            {REELS.map((id, i) =>
              i === igActive ? null : (
                <li key={id}>
                  <button onClick={() => setIgActive(i)} data-cursor="PLAY" aria-label={`Select Instagram reel ${i + 1}`}>
                    <img src={reelCover(id)} alt="" loading="lazy" decoding="async" />
                    <span className="rail-tag">REEL</span>
                    <span className="rail-title">Reel {String(i + 1).padStart(2, '0')}</span>
                  </button>
                </li>
              ),
            )}
          </ul>
        </div>
      )}
      <div className="reels" hidden={tab !== 'youtube'}>
        <div className="reels-main">
          <Player short={current} />
          <p className="reels-title">
            <span>NOW PLAYING</span>
            {current.title}
          </p>
        </div>
        <ul className="reels-rail">
          {rest.map(({ s, i }) => (
            <li key={s.id}>
              <button onClick={() => setActive(i)} data-cursor="PLAY" aria-label={`Select: ${s.title}`}>
                <img src={thumb(s.id)} alt="" loading="lazy" decoding="async" />
                <span className="rail-tag">{s.tag}</span>
                <span className="rail-title">{s.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="community-note">
        Tag <b>#GoXtreme</b> on Instagram and make the feed move.
      </p>
    </section>
  );
}

/* ----------------------------------------------------------- FinalCTA */

export function FinalCTA() {
  return (
    <section className="final" id="final" data-can="0,-0.04,1.3,12.6,0,1,0,-0.1">
      <div className="bg final-bg">
        <div className="final-glow" />
      </div>
      <div className="behind final-type">
        <Reveal as="h2" text={'READY TO\nGO XTREME?'} className="h-mega" />
      </div>
      <div className="fg final-cta">
        <Button href="#products">GET XTREME</Button>
        <Button href="#contact" variant="ghost" cursor="FIND →">
          FIND XTREME
        </Button>
      </div>
    </section>
  );
}
