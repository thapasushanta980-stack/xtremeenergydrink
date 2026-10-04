import { useEffect, useLayoutEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bus, READY_EVENT } from '../gl/bus';

gsap.registerPlugin(ScrollTrigger);

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------- Reveal */

interface RevealProps {
  text: string; // use \n for line breaks
  as?: ElementType;
  className?: string;
  on?: 'scroll' | 'ready';
  delay?: number;
  by?: 'char' | 'word';
}

/** Mask-reveal typography: characters rise out of a clipped line. */
export function Reveal({ text, as: Tag = 'div', className = '', on = 'scroll', delay = 0, by = 'char' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion()) return;
    const targets = el.querySelectorAll('.ch');
    const ctx = gsap.context(() => {
      gsap.set(targets, { yPercent: 115, rotate: 4 });
      const play = () =>
        gsap.to(targets, {
          yPercent: 0,
          rotate: 0,
          duration: 1.05,
          ease: 'expo.out',
          stagger: by === 'char' ? 0.03 : 0.07,
          delay,
          // Layer promotion lasts exactly as long as the movement does; see
          // the note on .ch in styles.css.
          onStart: () => el.classList.add('is-revealing'),
          onComplete: () => el.classList.remove('is-revealing'),
        });
      if (on === 'ready') {
        if (bus.ready) play();
        else window.addEventListener(READY_EVENT, play, { once: true });
      } else {
        ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: play });
      }
    }, el);
    return () => ctx.revert();
  }, [text, on, delay, by]);

  const lines = text.split('\n');
  return (
    <Tag ref={ref} className={className} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, li) => (
        <span className="ln" key={li} aria-hidden="true">
          {by === 'char'
            ? [...line].map((c, i) => (
                <span className="ch" key={i}>
                  {c === ' ' ? ' ' : c}
                </span>
              ))
            : line.split(' ').map((w, i) => (
                <span className="ch" key={i}>
                  {w}&nbsp;
                </span>
              ))}
        </span>
      ))}
    </Tag>
  );
}

/* ------------------------------------------------------------- Button */

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: 'primary' | 'ghost';
  cursor?: string;
  tabIndex?: number;
  onClick?: () => void;
}

export function Button({ children, href = '#', variant = 'primary', cursor = 'GO →', tabIndex, onClick }: ButtonProps) {
  return (
    <a className={`btn btn-${variant}`} href={href} data-cursor={cursor} tabIndex={tabIndex} onClick={onClick}>
      <span className="btn-label">{children}</span>
      <span className="btn-arrow" aria-hidden="true">
        →
      </span>
    </a>
  );
}

export function SectionLabel({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="label">
      <span>{index}</span>
      <i />
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------ Marquee */

const DEVANAGARI = /[ऀ-ॿ]/;

/**
 * The ticker band. Items alternate solid and ghosted so the line has a rhythm
 * rather than one flat weight; pass an even number of them or the alternation
 * breaks at the seam between repeats.
 */
export function Marquee({ items, className = '' }: { items: string[]; className?: string }) {
  const row = (
    <div className="marquee-row" aria-hidden="true">
      {items.map((t, i) => (
        // Anton carries no Devanagari, so a Nepali item is tagged and set in a
        // face the device already has rather than falling back glyph by glyph.
        <span key={i} className={`${i % 2 ? 'mq-ghost' : ''} ${DEVANAGARI.test(t) ? 'deva' : ''}`}>
          {t}
          <b>✦</b>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`marquee ${className}`} role="presentation">
      {/* The fade has to be painted on something still: a mask lives in its own
          element's box, so on the moving track it would travel along with it. */}
      <div className="marquee-mask">
        <div className="marquee-track">
          {row}
          {row}
          {row}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Media */

/**
 * Cinematic image slot. Drop `public/media/<name>.jpg` (or .webp) to replace the generated art.
 * Lazy-loaded; falls back silently to the generative composition passed as children.
 */
export function Media({ name, alt, children, className = '', src }: { name: string; alt: string; children?: ReactNode; className?: string; src?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className={`media ${className}`} data-cursor="VIEW">
      <div className="media-art">{children}</div>
      <img
        src={src ?? `/media/${name}.jpg`}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={(e) => setOk(e.currentTarget.naturalWidth > 10)}
        onError={() => setOk(false)}
        style={{ opacity: ok ? 1 : 0 }}
      />
      <div className="media-grain" />
    </div>
  );
}

/* --------------------------------------------------------- parallax */

/** Applies data-speed parallax to children when the page scrolls. */
export function useParallax(scope: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!scope.current || reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-speed]').forEach((el) => {
        const s = parseFloat(el.dataset.speed || '0');
        gsap.fromTo(
          el,
          { yPercent: -s * 50 },
          {
            yPercent: s * 50,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
    }, scope);
    return () => ctx.revert();
  }, [scope]);
}
