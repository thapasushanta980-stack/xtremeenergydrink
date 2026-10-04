import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { isDashain } from '../dashain';
import { Kites, LingePing } from './Dashain';
import { Reveal, SectionLabel, reduceMotion } from './ui';

/* -------------------------------------------------------------- Nepal */
/**
 * Boudhanath. One of the largest stupas anywhere and the single most legible
 * silhouette in Kathmandu: a whitewashed dome on a stepped mandala base, the
 * harmika above it carrying the Buddha eyes and the curl that stands for the
 * Nepali numeral one, then the thirteen gilded steps to enlightenment and the
 * parasol. This is "Kathmandu after dark" without writing it down.
 */
function Boudhanath() {
  return (
    <svg className="stupa" viewBox="0 0 260 300" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="gild2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd84a" />
          <stop offset="1" stopColor="#a8760d" />
        </linearGradient>
      </defs>
      {/* stepped mandala base */}
      <path d="M6 300h248v-26H6zM26 274h208v-22H26zM46 252h168v-20H46z" fill="#20121c" />
      {/* dome */}
      <path d="M58 232a72 66 0 0 1 144 0z" fill="#efeef6" opacity="0.88" />
      {/* harmika, with the eyes */}
      <path d="M100 166h60v34h-60z" fill="#f2f0f7" opacity="0.9" />
      <g fill="#1b1026">
        <ellipse cx="114" cy="178" rx="8" ry="5" />
        <ellipse cx="146" cy="178" rx="8" ry="5" />
        <path d="M128 184c4 0 6 3 6 7h-4c0-2-1-3-2-3z" />
        <circle cx="130" cy="171" r="2" />
      </g>
      {/* thirteen gilded steps */}
      <path d="M104 166l6-74h40l6 74z" fill="url(#gild2)" />
      <g stroke="#8a5f08" strokeWidth="2" opacity="0.55">
        <path d="M106 154h48M107 142h46M108 130h44M110 118h40M111 106h38" />
      </g>
      {/* parasol and finial */}
      <path d="M96 92h68l-14-12h-40z" fill="url(#gild2)" />
      <path d="M126 80h8V64h-8z" fill="#f6c026" />
      <circle cx="130" cy="58" r="5" fill="#ffd84a" />
    </svg>
  );
}

/** The traditional lungta order, and it is an order: blue, white, red, green, yellow. */
const FLAGS = ['#2f6fd0', '#f2f2f6', '#d8322f', '#2f9e52', '#f2c12e'];

/**
 * Prayer flags. Strung across every ridge, rooftop and courtyard in the country
 * and the fastest piece of visual shorthand Nepal has. The line sags as a real
 * one does and the colours run in their proper repeating order.
 */
function PrayerFlags() {
  const n = 24;
  return (
    <svg className="flags" viewBox="0 0 1200 150" aria-hidden="true" preserveAspectRatio="none">
      <path d="M0 14C300 96 900 96 1200 14" fill="none" stroke="rgba(247,246,255,0.42)" strokeWidth="2" />
      {Array.from({ length: n }).map((_, i) => {
        const t = (i + 0.5) / n;
        // the same cubic the string is drawn with, so every flag hangs on it
        const y = 3 * (1 - t) * (1 - t) * t * 96 + 3 * (1 - t) * t * t * 96 + t * t * t * 14 + (1 - t) * (1 - t) * (1 - t) * 14;
        return (
          <g key={i} className="flag">
            <path d={`M${t * 1200 - 15} ${y} h30 v34 l-15 -7 -15 7z`} fill={FLAGS[i % FLAGS.length]} opacity="0.88" />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Floodlight towers. The brand sponsors six Nepal Premier League sides, so the
 * roar belongs in the skyline rather than in a caption.
 */
function Floodlights() {
  return (
    <svg className="floods" viewBox="0 0 200 300" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <defs>
        <radialGradient id="beam" cx="0.5" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#dbe6ff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#dbe6ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="70" rx="96" ry="78" fill="url(#beam)" />
      {[46, 154].map((x) => (
        <g key={x}>
          <path d={`M${x - 5} 300 L${x - 2} 92 h4 L${x + 5} 300z`} fill="#160c16" />
          <path d={`M${x - 26} 92 h52 v-40 h-52z`} fill="#241626" />
          <g fill="#eaf1ff" opacity="0.85">
            {[0, 1, 2].map((r) =>
              [0, 1, 2, 3].map((c) => <rect key={`${r}-${c}`} x={x - 22 + c * 11} y={56 + r * 11} width="8" height="8" rx="1" />),
            )}
          </g>
        </g>
      ))}
    </svg>
  );
}

/**
 * Pashupatinath, in the form the temple actually takes.
 *
 * Nepalese pagoda, not the Chinese kind the word usually conjures: a square
 * plinth, TWO tiered roofs of copper gilded in gold that diminish as they rise,
 * the carved struts - tundal - that carry each eave, a silver-plated door, and
 * the gajur at the pinnacle. Roughly 23.7 m from base to finial, which is why
 * it sits lower than the peaks behind it rather than competing with them.
 *
 * Drawn as a lit landmark and left still: no neon on it, no flicker, none of
 * the city's colour. It is one of the holiest Shiva temples anywhere, and the
 * section can carry it with some quiet.
 */
function Pashupatinath() {
  return (
    <svg className="temple" viewBox="0 0 240 300" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="gild" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd84a" />
          <stop offset="0.55" stopColor="#f6c026" />
          <stop offset="1" stopColor="#a8760d" />
        </linearGradient>
        <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Lamp light the temple sits in, so it reads as lit rather than cut out */}
      <ellipse cx="120" cy="194" rx="116" ry="104" fill="url(#lamp)" />

      {/* Stepped plinth */}
      <path d="M8 300h224v-9H8zM20 291h200v-8H20zM32 283h176v-8H32z" fill="#1c0d14" />

      {/* Lower storey, with the silver door */}
      <path d="M62 275V198h116v77z" fill="#190b12" />
      <path d="M104 275v-45a16 16 0 0 1 32 0v45z" fill="#9aa6c4" opacity="0.5" />
      <path d="M104 275v-45a16 16 0 0 1 32 0v45z" fill="url(#lamp)" />

      {/* Tundal: the struts carrying the lower eave */}
      <g stroke="#2b1520" strokeWidth="3" strokeLinecap="round">
        <path d="M62 204 38 196M62 212 46 207M178 204l24-8M178 212l16-5" />
      </g>

      {/* Lower roof - the wider of the two */}
      <path d="M26 198l44-50h100l44 50z" fill="url(#gild)" />
      <path d="M26 198h188v7H26z" fill="#8a5f08" />

      {/* Upper storey */}
      <path d="M80 148v-34h80v34z" fill="#190b12" />
      <g stroke="#2b1520" strokeWidth="2.6" strokeLinecap="round">
        <path d="M80 120 62 113M160 120l18-7" />
      </g>

      {/* Upper roof */}
      <path d="M54 114l34-40h64l34 40z" fill="url(#gild)" />
      <path d="M54 114h132v6H54z" fill="#8a5f08" />

      {/* Gajur: base, bell and spire */}
      <path d="M110 74h20v-6h-20z" fill="url(#gild)" />
      <path d="M112 68c0-14 4-20 8-24 4 4 8 10 8 24z" fill="url(#gild)" />
      <path d="M118.5 44h3v-12h-3z" fill="#f6c026" />
      <circle cx="120" cy="30" r="4" fill="#ffd84a" />
    </svg>
  );
}


export function NepalEnergy() {
  const root = useRef<HTMLElement>(null);
  // Read once on mount: the festival is not going to start mid-session.
  const dashain = useRef(isDashain()).current;

  useEffect(() => {
    const el = root.current;
    if (!el || reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.ridge').forEach((r) => {
        const sp = parseFloat(r.dataset.depth || '0.1');
        gsap.fromTo(
          r,
          { yPercent: sp * 60 },
          { yPercent: -sp * 60, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
        );
      });
      gsap.to('.city i', { opacity: 0.2, duration: 1.4, repeat: -1, yoyo: true, stagger: { each: 0.07, from: 'random' }, ease: 'sine.inOut' });
      // the line breathes rather than flaps: a slow travelling sway
      gsap.to('.flag', {
        rotation: 7,
        transformOrigin: 'top center',
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { each: 0.09, from: 'start' },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const ridge = (d: string, fill: string, depth: number, h: string, snow?: string) => (
    <svg className="ridge" data-depth={depth} viewBox="0 0 1440 400" preserveAspectRatio="none" style={{ height: h }} aria-hidden="true">
      <path d={d} fill={fill} />
      {snow && <path d={snow} fill="#e8ecff" opacity="0.82" />}
    </svg>
  );

  return (
    <section className="nepal" id="nepal" ref={root} data-can="0.5,0.02,0.95,6.9,0,0,0,-0.28">
      <div className="bg nepal-bg">
        <div className="nepal-sky" />
        
        {/* The skyline: Everest's summit pyramid at 420, the long west ridge
            falling away to the left and the short steep south-east ridge to the
            right, with Nuptse's serrated wall in front of it and Lhotse beyond.
            Snow sits only on what stands above the others. */}
        {ridge(
          'M0 400V268l96-26 74 34 92-78 70 50 76-70 92-134 58 92 40-40 66 86 78-54 70 78 96-58 84 72 92-50 78 60 110-44 168 54V400z',
          '#2a0e0a',
          0.16,
          '78%',
          // Caps sit on the three summits the ridge actually has - Everest at
          // (500,44), Lhotse at (598,96), Nuptse at (742,128) - and every
          // vertex is on or inside the rock, so no snow floats off a peak.
          'M500 44 468 91 486 103 504 84 520 76zM598 96 582 112 598 124 610 114 618 122zM742 128 715 147 736 160 752 148 763 151z',
        )}
        {ridge('M0 400V280l90-40 100 50 130-110 80 70 140-90 100 110 110-60 120 90 130-120 120 80 160-50 160 80V400z', '#170908', 0.1, '62%')}
        {ridge('M0 400V320l120-40 120 50 140-70 120 60 160-60 140 70 150-50 160 60 130-30 100 30V400z', '#0a0505', 0.05, '46%')}
        {dashain && <Kites />}
        <Floodlights />
        {dashain && <LingePing />}
        <Boudhanath />
        <Pashupatinath />
        <PrayerFlags />
        <div className="city" aria-hidden="true">
          {Array.from({ length: 70 }).map((_, i) => (
            <i key={i} style={{ left: `${(i * 37) % 100}%`, bottom: `${(i * 13) % 18}%`, background: i % 7 === 0 ? '#e5203b' : '#f6c026' }} />
          ))}
        </div>
      </div>
      <div className="nepal-copy fg">
        <SectionLabel index="04">NEPAL</SectionLabel>
        <Reveal as="h2" text={'BORN FOR THE\nENERGY THAT\nMOVES NEPAL.'} className="h-xl nepal-h" />
      </div>
    </section>
  );
}

