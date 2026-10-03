import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Reveal, SectionLabel, reduceMotion } from './ui';

/* -------------------------------------------------------------- Nepal */

export function NepalEnergy() {
  const root = useRef<HTMLElement>(null);

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
    }, el);
    return () => ctx.revert();
  }, []);

  const ridge = (d: string, fill: string, depth: number, h: string) => (
    <svg className="ridge" data-depth={depth} viewBox="0 0 1440 400" preserveAspectRatio="none" style={{ height: h }} aria-hidden="true">
      <path d={d} fill={fill} />
    </svg>
  );

  return (
    <section className="nepal" id="nepal" ref={root} data-can="0.5,0.02,0.95,6.9,0,0,0,-0.28">
      <div className="bg nepal-bg">
        <div className="nepal-sky" />
        
        {ridge('M0 400V230l140-70 90 60 120-130 110 110 80-50 150 150 120-120 130 90 100-130 160 150 150-80 90 60V400z', '#2a0e0a', 0.16, '78%')}
        {ridge('M0 400V280l90-40 100 50 130-110 80 70 140-90 100 110 110-60 120 90 130-120 120 80 160-50 160 80V400z', '#170908', 0.1, '62%')}
        {ridge('M0 400V320l120-40 120 50 140-70 120 60 160-60 140 70 150-50 160 60 130-30 100 30V400z', '#0a0505', 0.05, '46%')}
        <div className="city" aria-hidden="true">
          {Array.from({ length: 70 }).map((_, i) => (
            <i key={i} style={{ left: `${(i * 37) % 100}%`, bottom: `${(i * 13) % 18}%`, background: i % 7 === 0 ? '#e5203b' : '#f6c026' }} />
          ))}
        </div>
      </div>
      <div className="nepal-copy fg">
        <SectionLabel index="04">NEPAL</SectionLabel>
        <Reveal as="h2" text={'BORN FOR THE\nENERGY THAT\nMOVES NEPAL.'} className="h-xl nepal-h" />
        <ul className="nepal-list">
          <li>Kathmandu after dark</li>
          <li>Stadium roar</li>
          <li>Himalaya-high ambition</li>
        </ul>
      </div>
    </section>
  );
}

