import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FLAVOURS, buyHref, buyLabel } from '../data';
import { bus } from '../gl/bus';
import { Button, Reveal, SectionLabel, reduceMotion } from './ui';

export function Products() {
  const root = useRef<HTMLElement>(null);
  const [sel, setSel] = useState(0);
  const f = FLAVOURS[sel];

  const choose = (i: number) => {
    setSel(i);
    bus.stage?.setSelected(i);
  };

  // arm ingredients for the starting flavour once the section is reached
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 30%',
      onEnter: () => bus.stage?.armIngredients(),
      onEnterBack: () => bus.stage?.armIngredients(),
    });
    return () => st.kill();
  }, []);

  useEffect(() => {
    if (reduceMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.pd-in', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07 });
      gsap.fromTo('.pd-name .c', { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.03 });
    }, root);
    return () => ctx.revert();
  }, [sel]);

  const style = { ['--glow' as string]: f.glow, ['--base' as string]: f.base, ['--accent' as string]: f.accent };

  return (
    <section className="products" id="products" ref={root} style={style} data-can="0,0,1,6.28318,0,0,1,-0.05">
      <div className="bg products-bg" />
      <div className="behind products-head">
        <SectionLabel index="03">THE LINEUP</SectionLabel>
        <Reveal as="h2" text={'CHOOSE YOUR\nXTREME.'} className="h-xl" />
      </div>

      <div className="behind products-flavour" aria-hidden="true">
        <span key={f.id}>{f.name[0]}</span>
      </div>

      {/* drag target over the stage */}
      <div className="fg drag-zone" data-drag aria-hidden="true" />

      <div className="fg pd">
        <div className="pd-meta pd-in">
          <span>{f.index} / 0{FLAVOURS.length}</span>
          <i />
          <span>{f.note}</span>
        </div>
        <h3 className="pd-name" aria-live="polite">
          {f.name.map((w, wi) => (
            <span className={`pd-w ${wi ? 'outline' : ''}`} key={wi}>
              {[...w].map((c, i) => (
                <span className="cm" key={i}>
                  <span className="c">{c}</span>
                </span>
              ))}
            </span>
          ))}
        </h3>
        <p className="pd-desc pd-in">{f.desc}</p>
        <div className="pd-cta pd-in">
          <Button href={buyHref()}>{buyLabel()}</Button>
          <Button href="#energy" variant="ghost" cursor="EXPLORE">
            EXPLORE
          </Button>
        </div>
      </div>

      {/* A pack chooser, not a tab set: ordinary toggle buttons describe it honestly. */}
      <div className="fg pd-select" role="group" aria-label="Choose a pack">
        {FLAVOURS.map((x, i) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={i === sel}
            className={i === sel ? 'is-active' : ''}
            onClick={() => choose(i)}
            data-cursor="SELECT"
          >
            <b>{x.index}</b>
            <span>{x.name.join(' ')}</span>
            <i style={{ background: x.base }} />
          </button>
        ))}
      </div>
    </section>
  );
}
