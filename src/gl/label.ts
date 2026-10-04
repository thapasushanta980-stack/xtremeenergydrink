import * as THREE from 'three';
import type { Flavour } from '../data';

const W = 2048;
const H = 1280;

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number) {
  const widths = [...text].map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
  let cx = x - total / 2;
  [...text].forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + gap;
  });
}

function bolt(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx + 0.15 * s, cy - 0.5 * s);
  ctx.lineTo(cx - 0.35 * s, cy + 0.08 * s);
  ctx.lineTo(cx - 0.02 * s, cy + 0.08 * s);
  ctx.lineTo(cx - 0.18 * s, cy + 0.5 * s);
  ctx.lineTo(cx + 0.38 * s, cy - 0.12 * s);
  ctx.lineTo(cx + 0.04 * s, cy - 0.12 * s);
  ctx.closePath();
}

function barcode(ctx: CanvasRenderingContext2D, cx: number, y: number) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx - 150, y, 300, 150);
  ctx.fillStyle = '#000';
  let x = cx - 138;
  let seed = 7;
  while (x < cx + 130) {
    seed = (seed * 16807) % 2147483647;
    const w = 2 + (seed % 5);
    ctx.fillRect(x, y + 12, w, 126);
    x += w + 2 + (seed % 4);
  }
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const LW = 2048;
const LH = 1608;
const NAVY = '#1a1a78';

/*
  Pack geometry, measured off public/media/can-front.png rather than eyeballed.

  Vertical figures are fractions of the can's height, read from where each band
  of colour starts and stops. Horizontal figures are texture offsets from the
  centre of a face, obtained by un-projecting the photo column through
  asin(sx/halfW - 1): that is where each element genuinely sits once the
  camera's curvature is taken back out. A face is half the can, so two of them
  tile the full turn.
*/
const PACK = {
  navy: '#222c87',
  side: '#121a5e', // the same navy, curving away from the light
  red: '#c5163a',
  gold: '#f9d500',
  silver: '#eceef6',
  hash: 0.045,
  markTop: 0.112,
  markBot: 0.545,
  name: 0.74,
  drink: 0.808,
  claim: 0.845,
  footTop: 0.924,
  footBot: 0.954,
};

/** One wrap face is half the can. */
const FACE = LW / 2;

/** Measured silver runs: [x0, x1, yTop, yBottom] in texture offsets / height fractions. */
const MARK: [number, number, number, number][] = [
  [-182, 285, 0.112, 0.185],
  [-342, -222, 0.185, 0.42],
  [155, 342, 0.185, 0.26],
  [147, 325, 0.26, 0.42],
  [-342, 155, 0.42, 0.49],
  [-342, -248, 0.49, 0.545],
];

/** Scribbled brand X (yellow), approximating the logo mark. */
function xMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  const stroke = (angle: number, len: number, w: number) => {
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-len / 2, -w / 2);
    ctx.lineTo(len / 2 - w * 0.4, -w * 0.6);
    ctx.lineTo(len / 2, w / 2);
    ctx.lineTo(-len / 2 + w * 0.5, w * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  stroke(-0.95, s, s * 0.17);
  stroke(0.85, s * 0.95, s * 0.2);
  ctx.restore();
}

/**
 * Draw text to a measured width.
 *
 * Sizing from a font size assumes the font has loaded and that its metrics are
 * what we think; sizing from measureText does not. The pack's words are set to
 * the widths they occupy on the pack, whatever face ends up rendering them.
 */
function fitText(ctx: CanvasRenderingContext2D, text: string, cx: number, baseline: number, width: number, weight: string, family: string) {
  ctx.font = `${weight}100px ${family}`;
  const m = ctx.measureText(text).width || width;
  ctx.font = `${weight}${Math.max(8, Math.round((width / m) * 100))}px ${family}`;
  ctx.fillText(text, cx, baseline);
}

/** One face of the wrap, at the pack's measured proportions. */
function drawDesign(ctx: CanvasRenderingContext2D, f: Flavour, cx: number) {
  const y = (t: number) => t * LH;
  ctx.save();
  ctx.textAlign = 'center';

  // Softened: these are straight runs read off the photo, and a hard rectangle
  // edge meeting a photograph announces itself. The blur costs nothing and the
  // dissolve then has nothing to catch on.
  ctx.fillStyle = PACK.silver;
  ctx.filter = 'blur(7px)';
  for (const [x0, x1, t0, t1] of MARK) ctx.fillRect(cx + x0, y(t0), x1 - x0, y(t1) - y(t0));
  ctx.filter = 'none';

  xMark(ctx, cx + 200, y(0.625), 290, PACK.gold);

  ctx.fillStyle = PACK.red;
  fitText(ctx, 'XTREME', cx + 20, y(PACK.name) + 0.045 * LH, 610, '', 'Anton, Impact, sans-serif');
  ctx.fillStyle = '#fff';
  fitText(ctx, 'ENERGY DRINK', cx + 20, y(PACK.drink) + 0.016 * LH, 470, '', 'Anton, Impact, sans-serif');
  fitText(ctx, 'VITALIZE BODY AND MIND', cx + 20, y(PACK.claim) + 0.009 * LH, 430, '700 ', '"Space Grotesk", Arial, sans-serif');

  // the white foot band runs right round the can
  ctx.fillStyle = PACK.silver;
  ctx.fillRect(cx - FACE / 2, y(PACK.footTop), FACE, y(PACK.footBot) - y(PACK.footTop));
  ctx.fillStyle = PACK.navy;
  fitText(ctx, f.name[1] === 'CLASSIC' ? 'CLASSIC' : f.name.join(' '), cx, y(PACK.footBot) - 0.006 * LH, 300, '', 'Anton, Impact, sans-serif');

  ctx.fillStyle = PACK.red;
  fitText(ctx, '#XTREMEENERGY', cx + 17, y(PACK.hash) + 0.012 * LH, 454, '700 ', '"Space Grotesk", Arial, sans-serif');
  ctx.restore();
}

const TAU = Math.PI * 2;
/**
 * How far out the photo is still evidence rather than a smear. Measured: the
 * outer 10 degrees of the pack photo hold 5.3 source pixels and have to cover
 * 57 texture columns - a 10.8x stretch. At 60 degrees it is 2.2x, which holds.
 */
const SHARP = 1.05;
/** Radians over which the photo dissolves into the drawn wrap. */
const FADE = 0.34;

/**
 * Build the 360 degree wrap.
 *
 * A photograph of a cylinder cannot describe that cylinder's sides - the
 * information is not in the file - and this can idles, so every part of the
 * wrap faces the camera sooner or later. Projecting the photo the whole way
 * round therefore always failed somewhere: first as a tear where the angle was
 * folded, then as a bright band of 10x-stretched edge pixels sweeping across
 * the front.
 *
 * So the wrap is DRAWN from the measurements above, and the photo is laid over
 * the part of each face where it is still sharp. Because both come from the
 * same measurements they register, and the dissolve between them has little to
 * give away. Towards the sides the drawn navy darkens, so the photo thinning
 * out reads as the can curving away from the light rather than as artwork
 * running out.
 */
function paintWrap(ctx: CanvasRenderingContext2D, img: HTMLImageElement, f: Flavour) {
  const halfW = img.width / 2;

  // 1. the field, darkening towards the sides of each face
  for (const centre of [0, FACE, LW]) {
    const g = ctx.createLinearGradient(centre - FACE / 2, 0, centre + FACE / 2, 0);
    g.addColorStop(0, PACK.side);
    g.addColorStop(0.3, PACK.navy);
    g.addColorStop(0.7, PACK.navy);
    g.addColorStop(1, PACK.side);
    ctx.fillStyle = g;
    ctx.fillRect(centre - FACE / 2, 0, FACE, LH);
  }

  // 2. the drawn faces; the one at u = 0 straddles the texture edge
  drawDesign(ctx, f, 0);
  drawDesign(ctx, f, LW);
  drawDesign(ctx, f, FACE);

  // 3. the photo over the sharp middle of each face
  const span = Math.round((SHARP / TAU) * LW);
  for (const centre of [0, FACE]) {
    for (let i = -span; i <= span; i++) {
      const th = (i / LW) * TAU;
      const a = Math.abs(th);
      ctx.globalAlpha = a <= SHARP - FADE ? 1 : Math.max(0, (SHARP - a) / FADE);
      const sx = halfW * (1 + Math.sin(th));
      const sw = Math.max(1, halfW * Math.abs(Math.cos(th)) * (TAU / LW) + 0.5);
      ctx.drawImage(img, Math.min(img.width - sw, Math.max(0, sx - sw / 2)), 0, sw, img.height, (centre + i + LW) % LW, 0, 1, LH);
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * Wrap for the can body: the supplied Xtreme Classic pack photo (public/media/can-front.png)
 * projected onto the cylinder, with the back painted from the brand panel.
 * Drop a full 360 wrap at public/media/can-wrap.png (2048x1608) to override all of it.
 */
export function makeLabel(f: Flavour, maxAniso: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = LW;
  c.height = LH;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, LW, LH);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  // The front of the pack sits across u = 0, so the two edges of the texture
  // have to filter into each other or the seam shows as a line down the can.
  t.wrapS = THREE.RepeatWrapping;

  const load = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });

  load('/media/can-wrap.png')
    .then((img) => {
      ctx.drawImage(img, 0, 0, LW, LH);
      t.needsUpdate = true;
    })
    .catch(() => load('/media/can-front.png'))
    .then((img) => {
      if (!img) return;
      paintWrap(ctx, img, f);
      t.needsUpdate = true;
    })
    .catch(() => {
      // No artwork at all: the can still has to look like the product.
      ctx.fillStyle = PACK.navy;
      ctx.fillRect(0, 0, LW, LH);
      drawDesign(ctx, f, 0);
      drawDesign(ctx, f, LW);
      drawDesign(ctx, f, FACE);
      t.needsUpdate = true;
    });
  return t;
}

export function makeCondensation(maxAniso: number): THREE.CanvasTexture {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  const rnd = rng(42);
  for (let i = 0; i < 1500; i++) {
    const x = rnd() * S;
    const y = Math.pow(rnd(), 0.8) * S;
    const r = 1.5 + Math.pow(rnd(), 2.4) * 11;
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.12)');
    grad.addColorStop(0.8, 'rgba(255,255,255,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 1.12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 22; i++) {
    const x = rnd() * S;
    const y = rnd() * S * 0.6;
    const len = 60 + rnd() * 160;
    const sg = ctx.createLinearGradient(x, y, x, y + len);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.2, 'rgba(255,255,255,0.22)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(x, y, 2.4, len);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = maxAniso;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeSprite(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function makeSmoke(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const rnd = rng(9);
  for (let i = 0; i < 26; i++) {
    const x = 70 + rnd() * 116;
    const y = 70 + rnd() * 116;
    const r = 40 + rnd() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  const mask = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  mask.addColorStop(0, 'rgba(0,0,0,0)');
  mask.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function makeSliceTexture(rind: string, flesh: string, pith: string): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const m = S / 2;
  ctx.fillStyle = rind;
  ctx.beginPath();
  ctx.arc(m, m, m, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pith;
  ctx.beginPath();
  ctx.arc(m, m, m * 0.92, 0, Math.PI * 2);
  ctx.fill();
  const segs = 10;
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2 + 0.06;
    const a1 = ((i + 1) / segs) * Math.PI * 2 - 0.06;
    const g = ctx.createRadialGradient(m, m, 6, m, m, m * 0.86);
    g.addColorStop(0, flesh);
    g.addColorStop(1, rind);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(m, m);
    ctx.arc(m, m, m * 0.86, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeBerryTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#e0123a');
  g.addColorStop(1, '#8e0c28');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const rnd = rng(3);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = 'rgba(255,225,130,0.9)';
    ctx.beginPath();
    ctx.ellipse(rnd() * 256, 20 + rnd() * 220, 2.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
