import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { bus, READY_EVENT } from '../gl/bus';
import { Button, Reveal, reduceMotion } from './ui';

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || reduceMotion()) return;
    const ctx = gsap.context(() => {
      const items = el.querySelectorAll('.hero-in');
      gsap.set(items, { opacity: 0, y: 24 });
      gsap.set('.streak', { xPercent: -120, opacity: 0 });
      gsap.set('.hero-glow', { opacity: 0, scale: 0.6 });
      const go = () => {
        const tl = gsap.timeline();
        tl.to('.streak', { xPercent: 140, opacity: 1, duration: 0.9, ease: 'power4.in' }, 0.35)
          .to('.streak', { opacity: 0, duration: 0.2 }, 1.1)
          .to('.hero-glow', { opacity: 1, scale: 1, duration: 1.6, ease: 'expo.out' }, 0.9)
          .to(items, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.09 }, 1.2);
        // nav settles last
        gsap.fromTo('.nav', { yPercent: -120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, ease: 'expo.out', delay: 1.6 });
      };
      if (bus.ready) go();
      else window.addEventListener(READY_EVENT, go, { once: true });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" id="home" ref={root} data-can="0.34,-0.02,1.15,0,0,1,0,-0.12">
      <div className="bg hero-bg">
        <div className="hero-glow" />
        <div className="grid-lines" />
        <div className="vignette" />
      </div>
      <div className="streak" aria-hidden="true" />

      <h1 className="behind hero-title">
        <Reveal text="FEEL THE" on="ready" delay={0.35} className="hero-l1" />
        <Reveal text="XTREME." on="ready" delay={0.5} className="hero-l2" />
      </h1>

      <div className="fg hero-copy">
        <p className="hero-in hero-kicker">
          <i /> ENERGY FOR THE UNSTOPPABLE
        </p>
        <p className="hero-in hero-sub">Built for the moments that demand more.</p>
        <div className="hero-in hero-cta">
          <Button href="#products">GET XTREME</Button>
          <Button href="#story" variant="ghost" cursor="DOWN ↓">
            EXPLORE THE ENERGY
          </Button>
        </div>
      </div>

      <div className="fg hero-corner hero-in" aria-hidden="true">
        <span>500 ML</span>
        <span>SCROLL</span>
        <i />
      </div>
    </section>
  );
}
