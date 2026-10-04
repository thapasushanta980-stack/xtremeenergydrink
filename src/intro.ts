import gsap from 'gsap';

/**
 * The entrance, choreographed in one place.
 *
 * Every beat is seconds from `READY_EVENT`, which fires the moment the pour
 * splash begins to clear - not when it has gone. That matters: the splash holds
 * at full for 0.30 s and then fades for 0.52 s, so for the first `clear` seconds
 * the page is still behind it.
 *
 * The sequence is built around two rules.
 *
 * Nothing that must be *seen* may start before `clear`, or the visitor catches
 * it already half finished. The can fly-in used to start at 0.5 s and was ~80%
 * over by the time anything was visible, which is most of why arriving on the
 * page felt broken rather than deliberate.
 *
 * Something must be *moving* before `clear`, or the page lands as a still frame
 * and then jerks into life. The glow is that something: it is ambient, it is
 * cheap, and it reads beautifully through a fade.
 *
 * The heaviest frame on the page - the liquid crown bursting, a 160-segment
 * mesh plus 150 droplet instances - is deliberately pushed past the handover so
 * it never shares a frame with the splash compositing its own fade out.
 */
export const ENTRANCE = {
  /** When the splash is actually gone: its 0.30 s hold plus its 0.52 s fade. */
  clear: 0.82,

  glow: 0.1, // under the splash, so motion is already running when it lifts
  can: 0.55, // starts just before the handover: the whole move is seen
  streak: 0.95,
  title: 1.05,
  subtitle: 1.2,
  burst: 1.3, // the liquid crown, kept clear of the splash fade
  copy: 1.55,
  nav: 1.95,

  /** Entrance over. The ticker goes back to scroll-first pacing here. */
  settle: 2.9,
} as const;

/**
 * While the entrance plays, a long frame should stretch time rather than skip
 * through it.
 *
 * `useSmoothScroll` turns lag smoothing off, which is the right call for
 * scroll-linked work - it keeps scrubbed animation in step with Lenis. But with
 * smoothing off, a 400 ms stall during load advances every tween by 400 ms, so
 * the entrance teleports instead of slowing down. That jump is what reads as
 * "it lagged and then broke". For the length of the entrance only, a stall
 * slows the sequence instead; afterwards scroll takes priority again.
 */
export function pacedEntrance() {
  gsap.ticker.lagSmoothing(1000, 33);
  gsap.delayedCall(ENTRANCE.settle, () => gsap.ticker.lagSmoothing(0));
}
