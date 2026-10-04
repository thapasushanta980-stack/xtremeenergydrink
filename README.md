# XTREME Energy Drink — website

Vite + React + TypeScript, GSAP + ScrollTrigger, Lenis smooth scroll, Three.js.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
```

## How it works

One fixed WebGL canvas (`src/gl/Stage.ts`) holds the 3D can(s), liquid crown, droplets, particles and smoke.
Every section declares where the can should be with a `data-can="x,y,scale,rotY,rotX,splash,carousel,mobileY"`
attribute; the stage blends between those keyframes as you scroll, so the whole page plays as one continuous shot.

Layering: `.bg` (0) < `.behind` (1) < canvas (2) < `.fg` (3). Sections must not create stacking contexts.

## Replace placeholders with real assets

| What | Where |
| --- | --- |
| Classic can reference photo | `public/media/can-front.png` |
| Lifestyle photos | `public/media/life-athlete.jpg`, `life-cricket`, `life-gym`, `life-street`, `life-ride`, `life-night` |
| Moments | `public/media/moment-sport.jpg`, `moment-music`, `moment-adventure`, `moment-night`, `moment-grind` |
| Community tiles | `public/media/community-1.jpg` … `community-6.jpg` |

Anything missing falls back to the generated art, so you can add them one at a time.
Flavours, copy and nav live in `src/data.ts`.

## Reliability: what happens when something fails

Every heavy or remote part of this page has a defined way to fail. Nothing here
is load-bearing for the content: the copy, the navigation, the lineup and the
contact details survive all of it.

| If this fails | What the visitor gets | Where |
| --- | --- | --- |
| WebGL is unavailable | The static pack photo takes the stage's place, with alt text | `GLCanvas`, `.gl-fallback` |
| The GPU drops the context mid-session | Same static can; the 3D stage resumes by itself when the context returns | `Stage.onLost` / `onRestored` |
| The `three` chunk never downloads | Static can, and the loader still leaves on schedule | `GLCanvas` |
| A section component throws | That one section is dropped; the rest of the page is untouched | `Boundary` |
| Fonts are slow or blocked | Text paints immediately in the fallback stack and swaps in later | `index.html`, `--display` / `--body` |
| A video thumbnail 404s | A second YouTube address is tried, then the tile keeps its frame and label | `Cover` |
| JavaScript is off entirely | A plain block with the brand and the contact address | `index.html` `<noscript>` |
| Nothing is ready in time | A hard deadline releases the splash anyway (3.5 s, 0.8 s reduced-motion) | `Loader` |
| The bundle never arrives at all | The splash runs itself, then clears after 9 s rather than sitting on the page | `index.html` |

Devices that ask for less get less, before anything is measured: `Save-Data` or
under 2 GB of reported memory means the 3D stage never starts.

## The loading state

The first thing on screen is a can pouring into a glass, and it is **inline in
`index.html`** - markup, CSS and a small ES5 controller, with no stylesheet, no
module and no image behind it. That is deliberate:

- **It paints on the first frame.** Nothing waits for the bundle, so there is no
  gap between the HTML arriving and React mounting.
- **Nothing in it uses a web font.** The can and glass are drawn in CSS and the
  readout is pinned to fonts the device already has, so no text in the splash
  re-renders when Anton and Space Grotesk land.
- **It carries no download.** `logo.png` is 294 KB and `can-front.png` is 1.2 MB,
  the wrong order of magnitude for something shown before anything else.
- **The cup is the progress bar.** How full the glass is *is* the percentage.

`window.__splash` is the handover. The inline controller fills the cup on its
own up to 72%, and the moment the app mounts, `<Loader/>` takes the dial over
from wherever the crawl reached, holds it short of full until fonts and the 3D
stage are in, measures every scroll anchor while the screen is still covered,
and then plays the splash out. `<Loader/>` renders nothing itself.

Two rules the controller must keep: progress never
moves backward, and `done()` always calls back - including when the 9-second
last resort already removed the splash, since whoever waits on that callback
would otherwise leave the page scroll-locked forever.

The visitor's ambient soundtrack is `public/audio/xtreme-ambient.mp3`. It fades
in quietly after the entrance; if a browser blocks autoplay, a page interaction
retries playback. The fixed sound button lets visitors turn it off or on.

The Dashain visuals are seasonal. `src/dashain.ts` defines their date window,
and `?dashain=1` or `?dashain=0` forces them on or off for previewing.

## Smoothness: where the frame budget goes

- **three.js is loaded on demand.** It is the single heaviest asset (122 KB
  gzipped) and is no longer in the first-paint path — initial JS is roughly
  107 KB gzipped. The stage arrives a moment later and plays its intro whenever
  it lands, before or after the loader leaves.
- **One quality dial, driven by measurement.** `Stage.grade()` smooths the real
  frame time and steps between three tiers — full, reduced pixel ratio without
  smoke, minimum pixel ratio without particles. It drops after a sustained 24 ms
  frame and climbs back only after a long settled spell, so it cannot oscillate.
  The can itself is never what gets cut.
- **Nothing reads layout on the scroll path.** The progress bar caches
  `scrollHeight` and recomputes it on resize; the navbar folds a burst of scroll
  events into one read per frame; the stage coalesces anchor re-measurement into
  a single frame.
- **The loop stops when it cannot be seen.** Hidden tab or off-screen canvas
  means no update and no draw, and the frame after a pause is never counted
  against the quality dial.
- **Layer promotion lasts only as long as the movement.** Each `Reveal` splits
  its text into one span per character, and the page holds about 140 of them.
  `will-change` on all of them permanently cost GPU memory for the whole
  session; it is now applied for the duration of the tween and removed after.
  The hero glow is promoted the same way, and no longer re-blurs a 60vw square
  on every frame of its intro scale.
- **Teardown returns everything.** Geometries, materials and generated textures
  are disposed individually; `renderer.dispose()` alone would leave them on the
  GPU.
