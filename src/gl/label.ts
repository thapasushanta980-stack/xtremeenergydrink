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

function drawDesign(ctx: CanvasRenderingContext2D, f: Flavour, cx: number) {
  // chunky white geometric blocks, echoing the pack's large "X" construction
  ctx.fillStyle = '#f4f4ff';
  ctx.beginPath();
  ctx.moveTo(cx - 330, 120);
  ctx.lineTo(cx + 110, 120);
  ctx.lineTo(cx + 110, 150);
  ctx.lineTo(cx + 330, 150);
  ctx.lineTo(cx + 330, 760);
  ctx.lineTo(cx + 120, 760);
  ctx.lineTo(cx + 120, 300);
  ctx.lineTo(cx - 140, 300);
  ctx.lineTo(cx - 140, 780);
  ctx.lineTo(cx - 330, 780);
  ctx.closePath();
  ctx.fill();

  xMark(ctx, cx + 20, 930, 520, '#ffe21f');

  ctx.textAlign = 'center';
  ctx.font = '300px Anton, Impact, sans-serif';
  ctx.fillStyle = '#e5203b';
  ctx.fillText('XTREME', cx, 1290);
  ctx.fillStyle = '#fff';
  ctx.font = '96px Anton, Impact, sans-serif';
  ctx.fillText('ENERGY DRINK', cx, 1390);
  ctx.font = '700 36px "Space Grotesk", Arial, sans-serif';
  spaced(ctx, 'ENERGIZES BODY AND MIND', cx, 1440, 4);

  ctx.fillStyle = '#f4f4ff';
  ctx.fillRect(0, 1500, LW, 130);
  ctx.fillStyle = NAVY;
  ctx.font = '96px Anton, Impact, sans-serif';
  ctx.fillText(f.name[1] === 'CLASSIC' ? 'CLASSIC' : f.name.join(' '), cx, 1600);

  ctx.fillStyle = '#e5203b';
  ctx.font = '700 46px "Space Grotesk", Arial, sans-serif';
  spaced(ctx, '#XTREMEENERGY', cx, 90, 6);
}

/**
 * Wrap for the can body: the supplied Xtreme Classic 330 ml pack photo (public/media/can-front.png)
 * projected onto the cylinder. No packaging element is redrawn. Only the front of the pack was
 * supplied, so the same artwork is repeated around the can until a full wrap is provided
 * (drop it at public/media/can-wrap.png, 2048x1608, to override).
 */
export function makeLabel(_f: Flavour, maxAniso: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = LW;
  c.height = LH;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#2a3a9e';
  ctx.fillRect(0, 0, LW, LH);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;

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
    .catch(() =>
      load('/media/can-front.png').then((img) => {
        // inverse cylindrical projection: photo column = sin(angle); the back repeats the front (un-mirrored)
        const front = LW / 2;
        for (let x = 0; x < LW; x++) {
          let th = ((x - front) / LW) * Math.PI * 2;
          if (th > Math.PI / 2) th -= Math.PI;
          else if (th < -Math.PI / 2) th += Math.PI;
          // beyond ~72° the photo is too foreshortened to be sharp: hold that column instead of smearing
          const cl = Math.max(-1.26, Math.min(1.26, th));
          const sx = (img.width / 2) * (1 + Math.sin(cl));
          const sw = Math.max(1, (img.width / 2) * Math.abs(Math.cos(cl)) * ((Math.PI * 2) / LW) + 0.5);
          ctx.drawImage(img, Math.min(img.width - sw, Math.max(0, sx - sw / 2)), 0, sw, img.height, x, 0, 1, LH);
        }
        t.needsUpdate = true;
      }),
    );
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
