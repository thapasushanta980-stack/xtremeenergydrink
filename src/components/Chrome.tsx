import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { NAV, SOCIAL } from '../data';
import { Stage } from '../gl/Stage';
import { bus, READY_EVENT } from '../gl/bus';
import { Button, reduceMotion } from './ui';

/* ------------------------------------------------------------ Logo */

export function Logo({ className = '' }: { className?: string }) {
  return (
    <a className={`logo ${className}`} href="#home" aria-label="Xtreme Energy Drink — home" data-cursor="GO →">
      <img src="/logo.png" alt="Xtreme Energy Drink" width="786" height="717" />
    </a>
  );
}

/* ---------------------------------------------------------- GLCanvas */

export function GLCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let stage: Stage | null = null;
    try {
      stage = new Stage(ref.current);
      bus.stage = stage;
    } catch {
      // WebGL unavailable: the DOM experience still works without the 3D can.
      document.documentElement.classList.add('no-webgl');
    }
    return () => {
      stage?.destroy();
      bus.stage = null;
    };
  }, []);
  return <canvas ref={ref} className="gl" aria-hidden="true" />;
}

/* ------------------------------------------------------------ Loader */

export function Loader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const state = { v: 0 };
    let fontsReady = false;
    Promise.all([
      document.fonts.load('330px Anton'),
      document.fonts.load('700 46px "Space Grotesk"'),
      document.fonts.ready,
    ])
      .catch(() => undefined)
      .then(() => (fontsReady = true));

    const tl = gsap.to(state, {
      v: 100,
      duration: reduceMotion() ? 0.4 : 2.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        // never finish before fonts/stage are ready
        const cap = fontsReady && bus.stage ? 100 : 92;
        if (state.v > cap) state.v = cap;
        if (alive) setPct(Math.round(state.v));
        if (state.v >= 100 && alive) finish();
      },
    });
    // if capped, keep nudging until ready
    const poll = window.setInterval(() => {
      if (fontsReady && (bus.stage || document.documentElement.classList.contains('no-webgl')) && state.v >= 92) {
        gsap.to(state, { v: 100, duration: 0.5, onUpdate: () => alive && setPct(Math.round(state.v)), onComplete: finish });
        window.clearInterval(poll);
      }
    }, 150);

    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      window.clearInterval(poll);
      const el = root.current;
      if (!el) return;
      gsap.to(el, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 1,
        ease: 'expo.inOut',
        delay: 0.25,
        onStart: () => {
          bus.ready = true;
          bus.stage?.playIntro();
          window.dispatchEvent(new Event(READY_EVENT));
        },
        onComplete: onDone,
      });
    }
    return () => {
      alive = false;
      tl.kill();
      window.clearInterval(poll);
    };
  }, [onDone]);

  return (
    <div className="loader" ref={root} role="status" aria-label={`Loading ${pct}%`}>
      <div className="loader-inner">
        <img className="loader-logo" src="/logo.png" alt="Xtreme Energy Drink" />
        <div className="loader-bar">
          <i style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <div className="loader-meta">
          <span>LOADING ENERGY…</span>
          <span>{String(pct).padStart(2, '0')}%</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Navbar */

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 40);
      if (!open) setHidden(y > last.current && y > 400);
      last.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open]);

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open);
  }, [open]);

  return (
    <>
      <header className={`nav ${hidden ? 'is-hidden' : ''} ${solid ? 'is-solid' : ''}`}>
        <Logo />
        <nav aria-label="Primary" className="nav-links">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} data-cursor="hover">
              <span>{n.label}</span>
            </a>
          ))}
        </nav>
        <div className="nav-right">
          <Button href="#products">GET XTREME</Button>
          <button className="burger" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
            <i />
            <i />
          </button>
        </div>
      </header>
      <div className={`menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        {NAV.map((n, i) => (
          <a key={n.href} href={n.href} onClick={() => setOpen(false)} style={{ transitionDelay: `${open ? 0.12 + i * 0.05 : 0}s` }}>
            <small>0{i + 1}</small>
            {n.label}
          </a>
        ))}
        <Button href="#products" onClick={() => setOpen(false)}>
          GET XTREME
        </Button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ Cursor */

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.documentElement.classList.add('has-cursor');
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'power3' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'power3' });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3' });
    const move = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const over = (e: Event) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor], a, button, [data-drag]');
      const r = ring.current!;
      if (!t) {
        r.classList.remove('is-on', 'has-label');
        return;
      }
      const txt = t.dataset.cursor || (t.hasAttribute('data-drag') ? 'DRAG' : '');
      r.classList.add('is-on');
      if (txt && txt !== 'hover') {
        label.current!.textContent = txt;
        r.classList.add('has-label');
      } else r.classList.remove('has-label');
    };
    const down = () => ring.current?.classList.add('is-down');
    const up = () => ring.current?.classList.remove('is-down');
    window.addEventListener('pointermove', move);
    window.addEventListener('mouseover', over);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dot} />
      <div className="cursor-ring" ref={ring}>
        <span ref={label} />
      </div>
    </>
  );
}

/* ---------------------------------------------------- ScrollProgress */

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <div className="progress" aria-hidden="true">
      <div ref={bar} />
    </div>
  );
}

/* ------------------------------------------------------ Smooth scroll */

export function useSmoothScroll() {
  useEffect(() => {
    if (reduceMotion()) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.getAttribute('href') === '#') return;
      const target = document.querySelector(a.getAttribute('href')!);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: 0, duration: 1.6 });
      }
    };
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
}

/* ------------------------------------------------------------ Footer */

export function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-top">
        <Logo />
        <nav aria-label="Footer">
          <a href="#products">Products</a>
          <a href="#story">About</a>
          <a href="mailto:hello@xtreme.com.np">Contact</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </nav>
        <div className="social">
          <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" data-cursor="hover">Instagram</a>
          <a href={SOCIAL.youtube} target="_blank" rel="noopener noreferrer" data-cursor="hover">YouTube</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Xtreme Energy Drink. All rights reserved.</span>
        <span>Consume responsibly. Not recommended for children.</span>
      </div>
    </footer>
  );
}
