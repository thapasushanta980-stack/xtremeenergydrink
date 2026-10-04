import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { PRODUCT } from '../data';
import { isDashain } from '../dashain';
import { Kites } from './Dashain';
import { ENTRANCE } from '../intro';
import { bus, READY_EVENT } from '../gl/bus';
import { Button, Reveal, reduceMotion } from './ui';

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const dashain = useRef(isDashain()).current;

  useEffect(() => {
    const el = root.current;
    if (!el || reduceMotion()) return;
    const ctx = gsap.context(() => {
      const items = el.querySelectorAll('.hero-in');
      gsap.set(items, { opacity: 0, y: 24 });
      gsap.set('.streak', { xPercent: -120, opacity: 0 });
      gsap.set('.hero-glow', { opacity: 0, scale: 0.6 });
      const go = () => {
        // Beats come from ENTRANCE so the hero, the can and the nav are one
        // sequence rather than three timers that happen to overlap.
        gsap
          .timeline()
          // Ambient, and the only thing moving while the splash fades out.
          .to('.hero-glow', { opacity: 1, scale: 1, duration: 1.5, ease: 'expo.out' }, ENTRANCE.glow)
          .to('.streak', { xPercent: 140, opacity: 1, duration: 0.85, ease: 'power4.in' }, ENTRANCE.streak)
          .to('.streak', { opacity: 0, duration: 0.2 }, ENTRANCE.streak + 0.72)
          .to(items, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.09 }, ENTRANCE.copy);
        // The nav used to be animated from here, but gsap.context scopes its
        // selectors to the hero section and .nav lives outside it, so that
        // tween never matched anything. It belongs to <Navbar/>; see there.
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
        {/* A few, high and far off: the hero's subject is the can, not the sky. */}
        {dashain && <Kites sparse />}
        <div className="vignette" />
      </div>
      <div className="streak" aria-hidden="true" />

      <h1 className="behind hero-title">
        <Reveal text="FEEL THE" on="ready" delay={ENTRANCE.title} className="hero-l1" />
        <Reveal text="XTREME." on="ready" delay={ENTRANCE.subtitle} className="hero-l2" />
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
        <span>{PRODUCT.volume}</span>
        <span>SCROLL</span>
        <i />
      </div>
    </section>
  );
}
