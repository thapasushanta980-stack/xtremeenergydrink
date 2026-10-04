import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { KITE_COLOURS } from '../dashain';
import { reduceMotion } from './ui';

/**
 * Changa, the Dashain kite.
 *
 * Flown over Kathmandu from before Ghatasthapana as a signal to Indra that the
 * rain can stop: the monsoon is over, the fields are planted, and the valley
 * gets clear skies and the afternoon westerly. Folklore has the birds and the
 * king settling a treaty that permits kites only in this window - which is as
 * good a reason as any for these to disappear again in November.
 *
 * Diamond paper, a cross spar, a bowed tail, and a line running back down to
 * whoever is holding the lattai. One is always cut and still going: changa chet.
 *
 * Self-contained, including its drift, so any section can fly a few.
 */

type Kite = { x: number; y: number; s: number; tilt: number; cut?: boolean };

const FULL: Kite[] = [
  { x: 14, y: 20, s: 1, tilt: -14 },
  { x: 37, y: 13, s: 0.74, tilt: 9 },
  { x: 68, y: 24, s: 0.62, tilt: -6 },
  { x: 84, y: 15, s: 0.9, tilt: 17, cut: true },
  { x: 54, y: 31, s: 0.5, tilt: -11 },
];

/** High and far off, for sections whose subject is not the sky. */
const SPARSE: Kite[] = [
  { x: 76, y: 11, s: 0.5, tilt: 12 },
  { x: 90, y: 22, s: 0.34, tilt: -8, cut: true },
  { x: 62, y: 7, s: 0.26, tilt: 16 },
];

export function Kites({ sparse = false }: { sparse?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const kites = sparse ? SPARSE : FULL;

  useEffect(() => {
    if (!root.current || reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.to('.kite', {
        xPercent: 'random(-14, 14)',
        yPercent: 'random(-10, 10)',
        rotation: 'random(-9, 9)',
        duration: 'random(4, 7)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.4,
      });
      // cut loose, and still going
      gsap.to('.kite.is-cut', { xPercent: 42, yPercent: -26, duration: 26, repeat: -1, ease: 'none' });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div className={`kites ${sparse ? 'is-sparse' : ''}`} ref={root} aria-hidden="true">
      {kites.map((k, i) => (
        <svg
          key={i}
          className={`kite ${k.cut ? 'is-cut' : ''}`}
          style={{ left: `${k.x}%`, top: `${k.y}%`, width: `${k.s * 92}px`, transform: `rotate(${k.tilt}deg)` }}
          viewBox="0 0 60 190"
        >
          {!k.cut && <path d="M30 54C26 100 18 140 6 190" stroke="rgba(247,246,255,0.3)" strokeWidth="1" fill="none" />}
          <path d="M30 2 56 34 30 54 4 34z" fill={KITE_COLOURS[i % KITE_COLOURS.length]} />
          <path d="M30 2v52M4 34h52" stroke="rgba(0,0,0,0.28)" strokeWidth="1.4" />
          <path d="M30 54c6 10-6 16 0 26s-6 16 0 26" stroke={KITE_COLOURS[(i + 2) % KITE_COLOURS.length]} strokeWidth="2.4" fill="none" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Linge ping: the bamboo swing raised in courtyards and fields for Dashain and
 * taken down when it ends. Four poles lashed into a frame, one rope swing.
 */
export function LingePing() {
  return (
    <svg className="ping" viewBox="0 0 200 300" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <g stroke="#1d1119" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d="M24 300 92 40M76 300 108 40M124 300 92 40M176 300 108 40" />
      </g>
      <path d="M86 44h28" stroke="#1d1119" strokeWidth="9" strokeLinecap="round" />
      <g stroke="#6b5a3a" strokeWidth="3">
        <path d="M92 48v150M108 48v150" />
      </g>
      <path d="M84 198h32v9H84z" fill="#3a2a16" />
    </svg>
  );
}
