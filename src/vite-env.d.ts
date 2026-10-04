/// <reference types="vite/client" />

/**
 * The pour splash in index.html. It is created before the bundle loads and
 * drives itself until the app takes the dial over; see <Loader/>.
 */
interface SplashController {
  /** Progress it is currently heading for, so a handover does not jump. */
  get(): number;
  /** Move progress forward. Never moves back: the cup must not drain. */
  set(pct: number): void;
  /** Fill, fade, remove, then call back. Calls back even if already gone. */
  done(cb?: () => void): void;
}

interface Window {
  __splash?: SplashController;
}
