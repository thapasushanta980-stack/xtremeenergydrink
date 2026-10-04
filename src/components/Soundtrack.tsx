import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { bus, READY_EVENT } from '../gl/bus';

const VOLUME = 0.12;

/** Quiet, optional ambience. Browsers that block autoplay get a gesture retry. */
export function Soundtrack() {
  const audio = useRef<HTMLAudioElement>(null);
  const fade = useRef<gsap.core.Tween | null>(null);
  const starting = useRef(false);
  const desired = useRef(true);
  const [playing, setPlaying] = useState(false);

  const start = useCallback(async () => {
    const el = audio.current;
    if (!el || starting.current || !desired.current) return;
    starting.current = true;
    try {
      fade.current?.kill();
      if (el.paused) {
        el.volume = 0;
        await el.play();
      }
      if (!desired.current) {
        el.pause();
        return;
      }
      fade.current = gsap.to(el, { volume: VOLUME, duration: 1.8, ease: 'power2.out' });
      setPlaying(true);
    } catch {
      // Autoplay can be denied even after the page is ready. A pointer or key
      // gesture can retry, and the button always offers explicit playback.
      setPlaying(false);
    } finally {
      starting.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    const el = audio.current;
    desired.current = false;
    fade.current?.kill();
    setPlaying(false);
    if (el && !el.paused) {
      fade.current = gsap.to(el, {
        volume: 0,
        duration: 0.3,
        onComplete: () => el.pause(),
      });
    }
  }, []);

  useEffect(() => {
    let ready = bus.ready;
    const onReady = () => {
      ready = true;
      void start();
    };
    const onGesture = (event: PointerEvent | KeyboardEvent) => {
      if (!ready || !desired.current || !audio.current?.paused) return;
      if ((event.target as HTMLElement | null)?.closest?.('.sound-toggle')) return;
      void start();
    };
    if (ready) void start();
    window.addEventListener(READY_EVENT, onReady);
    document.addEventListener('pointerdown', onGesture);
    document.addEventListener('keydown', onGesture);
    return () => {
      window.removeEventListener(READY_EVENT, onReady);
      document.removeEventListener('pointerdown', onGesture);
      document.removeEventListener('keydown', onGesture);
      fade.current?.kill();
      audio.current?.pause();
    };
  }, [start]);

  return (
    <>
      <audio ref={audio} src="/audio/xtreme-ambient.mp3" preload="none" loop />
      <button
        className={`sound-toggle ${playing ? 'is-playing' : ''}`}
        type="button"
        aria-label={playing ? 'Turn background music off' : 'Turn background music on'}
        aria-pressed={playing}
        onClick={() => {
          if (playing) stop();
          else {
            desired.current = true;
            void start();
          }
        }}
      >
        <span className="sound-bars" aria-hidden="true"><i /><i /><i /><i /></span>
        <span className="sound-label">SOUND {playing ? 'ON' : 'OFF'}</span>
      </button>
    </>
  );
}
