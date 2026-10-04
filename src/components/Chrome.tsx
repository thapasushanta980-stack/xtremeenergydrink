import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { NAV, PURCHASE, SOCIAL } from '../data';
import { ENTRANCE, pacedEntrance } from '../intro';
import type { Stage } from '../gl/Stage';
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

/**
 * Reasons never to start the 3D stage at all. Each one is a device telling us
 * it would rather not, and we take it at its word instead of measuring later.
 */
function skipReason(): string | null {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return 'Save-Data requested';
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory < 2) return 'low device memory';
  return null;
}

export function GLCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(true);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let stage: Stage | null = null;
    let cancelled = false;

    /** Hand the page back to the static can, whatever the reason. */
    const standDown = (why: string) => {
      if (cancelled) return;
      document.documentElement.classList.add('no-webgl');
      setLive(false);
      if (import.meta.env.DEV) console.info(`[xtreme] 3D stage off: ${why}`);
    };

    const skip = skipReason();
    if (skip) {
      standDown(skip);
      return;
    }

    // three.js is the heaviest thing on the page (~122 KB gzipped). Loading it
    // on demand keeps it off the first-paint path; the loader has its own
    // deadline, so a slow or failed chunk delays nothing.
    import('../gl/Stage')
      .then(({ Stage }) => {
        if (cancelled) return;
        try {
          stage = new Stage(canvas, (alive) => setLive(alive));
          bus.stage = stage;
          // The chunk can land after the loader has already left: the can would
          // otherwise simply be there, with no entrance.
          if (bus.ready) stage.playIntro();
        } catch {
          standDown('WebGL unavailable');
        }
      })
      .catch(() => standDown('stage chunk failed to load'));

    return () => {
      cancelled = true;
      stage?.destroy();
      bus.stage = null;
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="gl" aria-hidden="true" />
      {!live && (
        <div className="gl-fallback">
          <img src="/media/can-front.png" alt="A chilled can of Xtreme Energy Drink, Classic" />
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------ Loader */

/**
 * Not an overlay - the overlay is already on screen. index.html paints the pour
 * before this bundle exists, and this component is the part that knows when the
 * page is actually ready: it takes over the dial, holds it short of full until
 * fonts and the stage are in, and then plays the splash out.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const found = window.__splash;
    // No splash in the document (an unusual host page, or it already timed out
    // and removed itself): there is nothing to play out, so do not hold the
    // page back behind a loading state that has no loader.
    if (!found) {
      bus.ready = true;
      bus.stage?.playIntro();
      window.dispatchEvent(new Event(READY_EVENT));
      onDone();
      return;
    }
    // Re-bound non-optionally: finish() is hoisted, so a narrowing of the
    // original would not reach it.
    const splash: SplashController = found;

    let alive = true;
    // Pick up wherever the splash's own crawl got to, so the handover is
    // invisible rather than a pause at whatever number it had reached.
    const state = { v: splash.get() };
    let fontsReady = false;
    let forced = false;
    Promise.all([
      document.fonts.load('330px Anton'),
      document.fonts.load('700 46px "Space Grotesk"'),
      document.fonts.ready,
    ])
      .catch(() => undefined)
      .then(() => (fontsReady = true));

    const stageReady = () => !!bus.stage || document.documentElement.classList.contains('no-webgl');
    const canFinish = () => forced || (fontsReady && stageReady());
    // Hard deadline: a slow font request or GPU must never hold the page hostage.
    const deadline = window.setTimeout(() => (forced = true), reduceMotion() ? 800 : 3500);

    const tl = gsap.to(state, {
      v: 100,
      duration: reduceMotion() ? 0.4 : 2.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        // never finish before fonts/stage are ready, or before the deadline fires
        const cap = canFinish() ? 100 : 92;
        if (state.v > cap) state.v = cap;
        if (alive) splash.set(state.v);
        if (state.v >= 100 && alive) finish();
      },
    });
    // if capped, keep nudging until ready
    const poll = window.setInterval(() => {
      if (canFinish() && state.v >= 92) {
        gsap.to(state, { v: 100, duration: 0.5, onUpdate: () => alive && splash.set(state.v), onComplete: finish });
        window.clearInterval(poll);
      }
    }, 150);

    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      window.clearInterval(poll);
      window.clearTimeout(deadline);
      // Measure everything while the splash still covers the screen. This pass
      // reads the position of every scroll anchor on the page, and it used to
      // run after the loader had gone - landing a full layout on the first
      // frame the visitor actually saw, at the same moment as the hero intro.
      ScrollTrigger.refresh();
      bus.stage?.refresh();
      // For the length of the entrance a long frame stretches time instead of
      // skipping through it; see pacedEntrance().
      pacedEntrance();
      // The page is live from the moment the splash starts leaving, so the
      // hero intro plays into the fade rather than after it.
      bus.ready = true;
      bus.stage?.playIntro();
      window.dispatchEvent(new Event(READY_EVENT));
      splash.done(onDone);
    }
    return () => {
      alive = false;
      tl.kill();
      window.clearInterval(poll);
      window.clearTimeout(deadline);
    };
  }, [onDone]);

  return null;
}

/* ------------------------------------------------------------ Navbar */

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const last = useRef(0);
  const menu = useRef<HTMLDivElement>(null);
  const burger = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    burger.current?.focus();
  };

  useEffect(() => {
    // Scroll fires far more often than the screen refreshes: fold the burst
    // into one read per frame so the nav never competes with the scroll.
    let queued = 0;
    const read = () => {
      queued = 0;
      const y = window.scrollY;
      setSolid(y > 40);
      if (!open) setHidden(y > last.current && y > 400);
      last.current = y;
    };
    const onScroll = () => {
      if (!queued) queued = requestAnimationFrame(read);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(queued);
    };
  }, [open]);

  // The entrance the hero was trying to play on it from outside its own scope.
  useEffect(() => {
    if (reduceMotion()) return;
    gsap.set('.nav', { yPercent: -120, opacity: 0 });
    const play = () =>
      gsap.to('.nav', {
        yPercent: 0,
        opacity: 1,
        duration: 1,
        ease: 'expo.out',
        delay: ENTRANCE.nav,
        // Hand the transform back to CSS, or the inline one GSAP leaves behind
        // outranks .nav.is-hidden and the hide-on-scroll stops working.
        onComplete: () => gsap.set('.nav', { clearProps: 'transform,opacity' }),
      });
    if (bus.ready) play();
    else window.addEventListener(READY_EVENT, play, { once: true });
    return () => window.removeEventListener(READY_EVENT, play);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open);
    const el = menu.current;
    if (!el) return;
    // A clipped menu is still in the tab order unless it is inert.
    if (open) {
      el.removeAttribute('inert');
      el.querySelector<HTMLElement>('a')?.focus();
    } else {
      el.setAttribute('inert', '');
    }
  }, [open]);

  // Escape closes; Tab cycles inside the open menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = menu.current?.querySelectorAll<HTMLElement>('a[href]');
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !menu.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
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
          <button
            ref={burger}
            className="burger"
            aria-expanded={open}
            aria-controls="menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => (open ? close() : setOpen(true))}
          >
            <i />
            <i />
          </button>
        </div>
      </header>
      <div id="menu" className={`menu ${open ? 'is-open' : ''}`} ref={menu}>
        {NAV.map((n, i) => (
          <a
            key={n.href}
            href={n.href}
            tabIndex={open ? undefined : -1}
            onClick={() => setOpen(false)}
            style={{ transitionDelay: `${open ? 0.12 + i * 0.05 : 0}s` }}
          >
            <small>0{i + 1}</small>
            {n.label}
          </a>
        ))}
        <Button href="#products" tabIndex={open ? undefined : -1} onClick={() => setOpen(false)}>
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
    // scrollHeight forces the browser to settle layout. Reading it on every
    // scroll event puts that cost directly in the scroll path, so measure it
    // when the page can actually change height and cache it in between.
    let max = 0;
    let queued = 0;
    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
    };
    const paint = () => {
      queued = 0;
      const v = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${v})`;
    };
    const on = () => {
      if (!queued) queued = requestAnimationFrame(paint);
    };
    const remeasure = () => {
      measure();
      on();
    };
    measure();
    paint();
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', remeasure);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', remeasure);
      ro.disconnect();
      cancelAnimationFrame(queued);
    };
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
        <div className="footer-buy">
          <h2>Where to buy</h2>
          <p>Looking for a can, or want to stock Xtreme? Tell us where you are and we will point you to the nearest supply.</p>
          <a className="footer-mail" href={`mailto:${PURCHASE.email}`} data-cursor="MAIL">
            {PURCHASE.email}
          </a>
        </div>
        {/* Privacy and Terms return here once real pages exist — a link to '#' promises a page that is not there. */}
        <nav aria-label="Footer">
          <a href="#products">Products</a>
          <a href="#story">About</a>
          <a href={`mailto:${PURCHASE.email}`}>Contact</a>
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
