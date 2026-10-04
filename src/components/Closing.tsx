import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { REELS, SHORTS, SOCIAL, buyHref, buyLabel, reelCover, thumb, thumbAlt, type Short } from '../data';
import { isDashain } from '../dashain';
import { Kites } from './Dashain';
import gsap from 'gsap';
import { Button, Reveal, SectionLabel, reduceMotion } from './ui';

/* -------------------------------------------------------------- Thumb */

/**
 * A cover that survives a missing file. YouTube's first address is tried, then
 * its fallback; a local reel cover has none, so it fades out and leaves the
 * tile's label and frame rather than a broken-image icon.
 */
function Cover({ srcs, alt = '' }: { srcs: string[]; alt?: string }) {
  const [step, setStep] = useState(0);
  const gone = step >= srcs.length;
  return (
    <img
      src={gone ? undefined : srcs[step]}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={gone ? { opacity: 0 } : undefined}
      onError={() => setStep((s) => s + 1)}
    />
  );
}

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
          <Cover srcs={[thumb(short.id), thumbAlt(short.id)]} />
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

const TABS = [
  { id: 'youtube', label: 'YouTube Shorts' },
  { id: 'instagram', label: 'Instagram Reels' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function Community() {
  const [tab, setTab] = useState<TabId>('youtube');
  const [active, setActive] = useState(0);
  const [igActive, setIgActive] = useState(0);
  const current = SHORTS[active];
  const rest = SHORTS.map((s, i) => ({ s, i })).filter((x) => x.i !== active);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  // Arrow keys move between tabs; only the selected tab is a tab stop.
  const onTabKeys = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const next =
      e.key === 'ArrowRight' ? (i + 1) % TABS.length
      : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? TABS.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    const id = TABS[next].id;
    setTab(id);
    tabRefs.current[id]?.focus();
  };
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
      <div className="tabs" role="tablist" aria-label="Video source" onKeyDown={onTabKeys}>
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className={tab === t.id ? 'is-active' : ''}
            onClick={() => setTab(t.id)}
            data-cursor="hover"
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Panels mount only while selected, so a hidden player can never keep playing. */}
      {tab === 'instagram' && (
        <div className="reels" role="tabpanel" id="panel-instagram" aria-labelledby="tab-instagram">
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
                    <Cover srcs={[reelCover(id)]} />
                    <span className="rail-tag">REEL</span>
                    <span className="rail-title">Reel {String(i + 1).padStart(2, '0')}</span>
                  </button>
                </li>
              ),
            )}
          </ul>
        </div>
      )}
      {tab === 'youtube' && (
        <div className="reels" role="tabpanel" id="panel-youtube" aria-labelledby="tab-youtube">
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
                  <Cover srcs={[thumb(s.id), thumbAlt(s.id)]} />
                  <span className="rail-tag">{s.tag}</span>
                  <span className="rail-title">{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
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
        {isDashain() && <Kites sparse />}
      </div>
      <div className="behind final-type">
        <Reveal as="h2" text={'READY TO\nGO XTREME?'} className="h-mega" />
      </div>
      <div className="fg final-cta">
        <Button href="#products">GET XTREME</Button>
        <Button href={buyHref()} variant="ghost" cursor="FIND →">
          {buyLabel()}
        </Button>
      </div>
    </section>
  );
}
