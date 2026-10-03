import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bus } from '../gl/bus';
import type { Mood } from '../gl/Stage';
import { Marquee, Reveal, SectionLabel, reduceMotion } from './ui';

/* ------------------------------------------------------- Brand story */

export function BrandStory() {
  return (
    <>
      <Marquee items={['NO PAUSE', 'NO LIMITS', 'GO XTREME', 'FEEL THE RUSH', 'PUSH FURTHER', 'OWN THE MOMENT']} className="marquee-hero" />
      <section className="story" id="story" data-can="0,0,1.25,3.14159,0,0,0,-0.1">
        <div className="bg story-bg">
          <div className="rays" />
          <div className="vignette" />
        </div>
        <div className="behind story-type">
          <SectionLabel index="01">WHAT IS XTREME?</SectionLabel>
          <Reveal as="h2" text={'NOT JUST\nENERGY.'} className="story-l" />
          <Reveal as="h2" text={"IT'S\nXTREME."} className="story-r outline" delay={0.15} />
        </div>
        <div className="fg story-copy">
          <p>
            Built for the moments that demand more.
            <br />
            <strong>More focus. More drive. More attitude.</strong>
          </p>
        </div>
      </section>
    </>
  );
}

/* --------------------------------------------------------- Experience */

const WORDS: { mood: Mood; word: string; line: string; tag: string }[] = [
  { mood: 'power', word: 'POWER', line: 'Hit the lights. Everything goes loud.', tag: 'Red · Raw · Immediate' },
  { mood: 'focus', word: 'FOCUS', line: 'Noise off. One target. Dead clean.', tag: 'Cold · Sharp · Still' },
  { mood: 'drive', word: 'DRIVE', line: 'Foot down. The world turns to streaks.', tag: 'Speed · Blur · Forward' },
];

export function EnergyExperience() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const hover = useRef<number | null>(null);
  const inView = useRef(false);

  const apply = (i: number) => {
    setActive(i);
    if (inView.current) bus.stage?.setMood(WORDS[i].mood);
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => {
        inView.current = self.isActive;
        bus.stage?.setMood(self.isActive ? WORDS[active].mood : 'none');
      },
    });
    const prog = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (hover.current !== null) return;
        const i = Math.min(2, Math.floor(self.progress * 3));
        setActive((prev) => {
          if (prev !== i) bus.stage?.setMood(inView.current ? WORDS[i].mood : 'none');
          return i;
        });
      },
    });
    return () => {
      st.kill();
      prog.kill();
      bus.stage?.setMood('none');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reduceMotion()) return;
    gsap.fromTo('.en-line', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' });
  }, [active]);

  const m = WORDS[active].mood;
  return (
    <section className={`energy mood-${m}`} id="energy" ref={root} data-can="0,0,1.05,6.28318,0,0,0,-0.1">
      <div className="bg energy-bg">
        <div className="mood-layer m-power" />
        <div className="mood-layer m-focus" />
        <div className="mood-layer m-drive">
          {Array.from({ length: 14 }).map((_, i) => (
            <i key={i} style={{ top: `${6 + i * 6.5}%`, animationDelay: `${(i % 5) * -0.4}s`, width: `${30 + ((i * 17) % 50)}%` }} />
          ))}
        </div>
      </div>
      <div className="energy-sticky">
        <SectionLabel index="02">THE ENERGY</SectionLabel>
        <ul className="energy-words behind">
          {WORDS.map((w, i) => (
            <li key={w.word}>
              <button
                className={`word ${i === active ? 'is-active' : ''}`}
                data-cursor="FEEL"
                onMouseEnter={() => {
                  hover.current = i;
                  apply(i);
                }}
                onMouseLeave={() => (hover.current = null)}
                onFocus={() => apply(i)}
                onClick={() => apply(i)}
              >
                <small>0{i + 1}</small>
                {w.word}
              </button>
            </li>
          ))}
        </ul>
        <div className="fg energy-note">
          <p className="en-line">{WORDS[active].line}</p>
          <span className="en-line tag">{WORDS[active].tag}</span>
        </div>
      </div>
    </section>
  );
}
