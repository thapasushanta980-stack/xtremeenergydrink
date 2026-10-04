/**
 * The Dashain layer.
 *
 * Dashain 2026 runs from Ghatasthapana on 11 October to Kojagrat Purnima on
 * 25 October, with Vijaya Dashami - the Tika day - on the 21st. The run-up is
 * part of it: kites go up over Kathmandu well before Ghatasthapana, which is
 * why the window opens a week early rather than on the first day.
 *
 * This is a SEASONAL layer, so it has to switch itself off. A site still flying
 * kites in June is a site nobody is tending. Everything Dashain adds is behind
 * `isDashain()`, and the dates below are the only thing to change next year.
 *
 * Preview it at any time of year with ?dashain=1, and force it off with
 * ?dashain=0.
 */
export const DASHAIN = {
  /** Kites and swings go up ahead of the festival proper. */
  opens: '2026-10-04',
  /** Ghatasthapana: the jamara is sown. */
  begins: '2026-10-11',
  /** Vijaya Dashami: tika and jamara from elders. */
  tika: '2026-10-21',
  /** Kojagrat Purnima: the full moon that closes it. */
  closes: '2026-10-25',
} as const;

const day = (iso: string) => new Date(`${iso}T00:00:00`).getTime();

export function isDashain(now: Date = new Date()): boolean {
  if (typeof location !== 'undefined') {
    const forced = new URLSearchParams(location.search).get('dashain');
    if (forced === '1') return true;
    if (forced === '0') return false;
  }
  const t = now.getTime();
  // through the end of the closing day
  return t >= day(DASHAIN.opens) && t < day(DASHAIN.closes) + 864e5;
}

/**
 * Traditional changa colours. Kathmandu's kite shops sell them in flat,
 * saturated paper colours, not brand colours, so these are left as they are -
 * the red and gold happen to meet the brand halfway on their own.
 */
export const KITE_COLOURS = ['#e5203b', '#f6c026', '#f2f2f6', '#1fa65a', '#e049a0'];
