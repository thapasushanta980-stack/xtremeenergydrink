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
| Full can wrap (2048×1630, front centred) | `public/media/can-classic.png`, `can-citrus.png`, `can-berry.png` (Classic currently maps the supplied pack photo `can-front.png`) |
| Lifestyle photos | `public/media/life-athlete.jpg`, `life-cricket`, `life-gym`, `life-street`, `life-ride`, `life-night` |
| Moments | `public/media/moment-sport.jpg`, `moment-music`, `moment-adventure`, `moment-night`, `moment-grind` |
| Community tiles | `public/media/community-1.jpg` … `community-6.jpg` |

Anything missing falls back to the generated art, so you can add them one at a time.
Flavours, copy and nav live in `src/data.ts`.
