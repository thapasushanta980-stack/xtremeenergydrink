import * as THREE from 'three';
import gsap from 'gsap';
import { FLAVOURS, type Flavour } from '../data';
import { ENTRANCE } from '../intro';
import {
  makeBerryTexture,
  makeCondensation,
  makeLabel,
  makeSliceTexture,
  makeSmoke,
  makeSprite,
} from './label';

export type Mood = 'none' | 'power' | 'focus' | 'drive';

const MOODS: Record<Mood, { speed: number; key: number; rim: number; rimCol: number; fov: number; part: number; smoke: number }> = {
  none: { speed: 1, key: 2.4, rim: 3.2, rimCol: 0xf6c026, fov: 32, part: 0.8, smoke: 0.5 },
  power: { speed: 2.4, key: 3.2, rim: 7, rimCol: 0xe5203b, fov: 30, part: 1, smoke: 0.85 },
  focus: { speed: 0.3, key: 4.8, rim: 1.1, rimCol: 0xcfe0ff, fov: 27, part: 0.22, smoke: 0.12 },
  drive: { speed: 5, key: 2.4, rim: 4.5, rimCol: 0xffd84a, fov: 40, part: 1, smoke: 0.6 },
};

const CAN_R = 0.3;
const CAN_H = 1.48;
const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface Key {
  top: number;
  v: number[];
}

interface IngItem {
  mesh: THREE.Object3D;
  a: number;
  r: number;
  h: number;
  sp: number;
  s: number;
  spin: THREE.Vector3;
}

interface CanRig {
  group: THREE.Group; // position + scale
  pivot: THREE.Group; // rotation
  ing: THREE.Group;
  items: IngItem[];
  ingK: { v: number };
  drag: number;
  flavour: Flavour;
  body: THREE.MeshPhysicalMaterial;
}

export class Stage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private rigs: CanRig[] = [];
  private keys: Key[] = [];
  private cur = [0.38, 0, 1.1, 0, 0, 1, 0, 0];
  private raf = 0;
  private last = performance.now();
  private t = 0;
  private scrollVel = 0;
  private lastScroll = 0;
  private pointer = new THREE.Vector2();
  private pointerS = new THREE.Vector2();
  private selF = { v: 0 };
  private sel = 0;
  private mood: Mood = 'none';
  private moodS = { ...MOODS.none };
  private zoom = { v: 0 };
  private intro = { x: 9, stretch: 1.6, alpha: 0 };
  private introDone = false;
  private reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private small = window.innerWidth < 768;
  private key!: THREE.DirectionalLight;
  private rim!: THREE.DirectionalLight;
  private rim2!: THREE.PointLight;
  private points!: THREE.Points;
  private pVel!: Float32Array;
  private smokes: THREE.Sprite[] = [];
  private splashMesh!: THREE.Mesh;
  private splashGroup = new THREE.Group();
  private splashT = 99;
  private splashColor = new THREE.Color('#f6c026');
  private drops!: THREE.InstancedMesh;
  private dropData: { p: THREE.Vector3; v: THREE.Vector3; r: number; live: boolean }[] = [];
  private prevSplash = 1;
  private dragging = false;
  private dragVel = 0;
  private ro: ResizeObserver;
  private onResizeBound = () => this.resize();
  private dummy = new THREE.Object3D();
  private visible = true;
  private io: IntersectionObserver | null = null;

  /* --- resilience and pacing ------------------------------------------- */
  private lost = false; // the GPU took the context away
  private maxDpr: number;
  private quality = 2; // 2 full · 1 reduced · 0 minimal
  private frameMs = 16.7; // smoothed frame time, the only quality signal
  private hold = 90; // frames to wait before grading again
  private skipGrade = true; // the frame after a pause is always a long one
  private refreshQueued = 0;

  /**
   * @param canvas    the one fixed canvas the whole page shares
   * @param onContext called with `false` when the GPU drops the context and
   *                  `true` when it comes back, so the page can swap in the
   *                  static can meanwhile instead of showing an empty stage.
   */
  constructor(
    private canvas: HTMLCanvasElement,
    private onContext?: (alive: boolean) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.small,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.maxDpr = Math.min(window.devicePixelRatio, this.small ? 1.5 : 1.75);
    this.renderer.setPixelRatio(this.maxDpr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    this.camera.position.set(0, 0, 6);

    this.buildEnvironment();
    this.buildLights();
    this.buildSmoke();
    this.buildParticles();
    FLAVOURS.forEach((f, i) => this.rigs.push(this.buildCan(f, i)));
    this.buildSplash();

    this.resize();
    window.addEventListener('resize', this.onResizeBound);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('webglcontextlost', this.onLost);
    canvas.addEventListener('webglcontextrestored', this.onRestored);
    // Measuring every anchor is a layout read: coalesce bursts into one frame.
    this.ro = new ResizeObserver(this.queueRefresh);
    this.ro.observe(document.body);

    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting), { threshold: 0 });
    this.io.observe(canvas);

    this.lastScroll = window.scrollY;
    this.raf = requestAnimationFrame(this.loop);
  }

  /* ---------------------------------------------------------------- build */

  private buildEnvironment() {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x02020c);
    const box = (w: number, h: number, pos: [number, number, number], color: number, mult: number) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(mult), side: THREE.DoubleSide }),
      );
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    box(2.2, 9, [-6, 0.5, 2], 0xffffff, 9); // left softbox
    box(1.4, 9, [6, 0, -1], 0xf6c026, 12); // right gold strip
    box(9, 2, [0, 6, 1], 0xffffff, 5); // overhead
    box(1.2, 9, [-3, 0, -6], 0x2f45ff, 10); // back blue
    box(1.0, 9, [3.5, 0, 5], 0xffffff, 4); // front right kicker
    box(14, 3, [0, -6, 0], 0x101050, 1.2); // warm floor bounce
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(env, 0.035).texture;
    pm.dispose();
  }

  private buildLights() {
    this.key = new THREE.DirectionalLight(0xffffff, 2.4);
    this.key.position.set(-3, 3, 4);
    this.rim = new THREE.DirectionalLight(0xf6c026, 3.2);
    this.rim.position.set(4, 1.5, -3);
    this.rim2 = new THREE.PointLight(0x3a4bff, 14, 12, 1.6);
    this.rim2.position.set(-3, -0.5, -2);
    const fill = new THREE.AmbientLight(0xffffff, 0.12);
    this.scene.add(this.key, this.rim, this.rim2, fill);
  }

  private buildSmoke() {
    const tex = makeSmoke();
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          color: i % 2 ? 0x3a4bff : 0x1c2290,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      s.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, -2.5 - Math.random() * 2);
      s.scale.setScalar(5 + Math.random() * 4);
      s.userData = { sp: (Math.random() - 0.5) * 0.15, ph: Math.random() * 6 };
      this.smokes.push(s);
      this.scene.add(s);
    }
  }

  private buildParticles() {
    const n = this.small ? 260 : 640;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    this.pVel = new Float32Array(n);
    const palette = [new THREE.Color('#f6c026'), new THREE.Color('#ffd84a'), new THREE.Color('#7f92ff'), new THREE.Color('#ffffff')];
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5 - 0.5;
      this.pVel[i] = 0.15 + Math.random() * 0.6;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.points = new THREE.Points(
      g,
      new THREE.PointsMaterial({
        size: 0.06,
        map: makeSprite(),
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    );
    this.scene.add(this.points);
  }

  private buildCan(f: Flavour, index: number): CanRig {
    const aniso = this.renderer.capabilities.getMaxAnisotropy();
    const label = makeLabel(f, aniso);
    const seg = this.small ? 40 : 72;
    const body = new THREE.MeshPhysicalMaterial({
      map: label,
      metalness: 0.3,
      roughness: 0.34,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.25,
    });
    const alu = new THREE.MeshStandardMaterial({ color: 0xd8d8dc, metalness: 1, roughness: 0.22, envMapIntensity: 1.5 });

    const pivot = new THREE.Group();
    const body3 = new THREE.Mesh(new THREE.CylinderGeometry(CAN_R, CAN_R, CAN_H, seg, 1, true), body);
    pivot.add(body3);

    const hh = CAN_H / 2;
    // Low-profile ends measured from the reference render: lid rises ~0.035, base ~0.04.
    const top = [
      [CAN_R, hh],
      [CAN_R - 0.004, hh + 0.01],
      [0.285, hh + 0.018],
      [0.262, hh + 0.027],
      [0.225, hh + 0.034],
      [0.18, hh + 0.037],
      [0.15, hh + 0.03],
      [0.0, hh + 0.028],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const bottom = [
      [CAN_R, -hh],
      [CAN_R - 0.008, -hh - 0.012],
      [0.272, -hh - 0.022],
      [0.235, -hh - 0.034],
      [0.18, -hh - 0.04],
      [0.1, -hh - 0.034],
      [0.0, -hh - 0.03],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    pivot.add(new THREE.Mesh(new THREE.LatheGeometry(top, seg), alu));
    pivot.add(new THREE.Mesh(new THREE.LatheGeometry(bottom, seg), alu));

    // pull tab
    const tab = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.006, 32), alu);
    tab.scale.set(1, 1, 1.5);
    tab.position.set(0, hh + 0.04, 0.03);
    tab.rotation.x = 0.02;
    pivot.add(tab);
    const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.014, 16), alu);
    rivet.position.set(0, hh + 0.042, -0.02);
    pivot.add(rivet);

    // condensation shell
    const cond = makeCondensation(aniso);
    cond.repeat.set(2, 1.2);
    const condMat = new THREE.MeshPhysicalMaterial({
      map: cond,
      transparent: true,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.2,
      depthWrite: false,
      opacity: 0.35,
      bumpMap: cond,
      bumpScale: 3,
    });
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(CAN_R + 0.0025, CAN_R + 0.0025, CAN_H * 0.98, seg, 1, true), condMat);
    shell.renderOrder = 2;
    pivot.add(shell);

    const group = new THREE.Group();
    group.add(pivot);
    const ing = new THREE.Group();
    group.add(ing);
    const items = this.buildIngredients(f, ing);
    this.scene.add(group);

    return { group, pivot, ing, items, ingK: { v: 0 }, drag: 0, flavour: f, body };
  }

  private buildIngredients(f: Flavour, parent: THREE.Group): IngItem[] {
    const items: IngItem[] = [];
    const n = this.small ? 9 : 14;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    let geo: THREE.BufferGeometry | null = null;
    const mats: THREE.Material[] = [];

    if (f.ingredient === 'orange') {
      geo = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 36);
      const tex = makeSliceTexture('#ff7a00', '#ffb02e', '#fff0cf');
      const rind = new THREE.MeshPhysicalMaterial({ color: 0xff7a00, roughness: 0.5, clearcoat: 0.3 });
      const face = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.15 });
      mats.push(rind, face);
    } else if (f.ingredient === 'berry') {
      geo = new THREE.SphereGeometry(0.1, 24, 16);
      mats.push(
        new THREE.MeshPhysicalMaterial({ map: makeBerryTexture(), roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }),
        new THREE.MeshPhysicalMaterial({ color: 0x6a0f3a, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
      );
    } else {
      geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      mats.push(
        new THREE.MeshPhysicalMaterial({
          color: 0xcfeaff,
          transparent: true,
          opacity: 0.32,
          roughness: 0.05,
          metalness: 0,
          clearcoat: 1,
          envMapIntensity: 2.5,
          depthWrite: false,
        }),
      );
    }

    for (let i = 0; i < n; i++) {
      let mesh: THREE.Mesh;
      if (f.ingredient === 'orange') {
        const m = mats as THREE.MeshPhysicalMaterial[];
        mesh = new THREE.Mesh(geo, [m[0], m[1], m[1]]);
        const s = rnd(0.8, 1.35);
        mesh.scale.setScalar(s);
      } else if (f.ingredient === 'berry') {
        mesh = new THREE.Mesh(geo, i % 3 === 0 ? mats[0] : mats[1]);
        const s = rnd(0.7, 1.4);
        mesh.scale.set(s, s * (i % 3 === 0 ? 1.18 : 1), s);
      } else {
        mesh = new THREE.Mesh(geo, mats[0]);
        mesh.scale.set(rnd(0.7, 1.5), rnd(0.7, 1.5), rnd(0.7, 1.5));
      }
      parent.add(mesh);
      items.push({
        mesh,
        a: (i / n) * Math.PI * 2 + rnd(-0.3, 0.3),
        r: rnd(0.62, 1.25),
        h: rnd(-0.55, 0.85),
        sp: rnd(0.15, 0.45) * (i % 2 ? 1 : -1),
        s: 1,
        spin: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)),
      });
    }
    return items;
  }

  private buildSplash() {
    const rings = 48;
    const segs = this.small ? 90 : 160;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array((rings + 1) * (segs + 1) * 3);
    const idx: number[] = [];
    for (let r = 0; r <= rings; r++) {
      for (let s = 0; s <= segs; s++) {
        if (r < rings && s < segs) {
          const a = r * (segs + 1) + s;
          const b = a + segs + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(idx);
    const mat = new THREE.MeshPhysicalMaterial({
      color: this.splashColor,
      emissive: this.splashColor,
      // The crown is DoubleSide, so its inner surface faces away from every
      // light and was rendering near black - a dark shell around the juice.
      // Emissive is added whatever the lighting does, so it sets a floor at the
      // juice colour and the inside reads as liquid rather than as a hole.
      emissiveIntensity: 0.7,
      roughness: 0.12,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2,
      transparent: true,
      opacity: 0.94,
      side: THREE.DoubleSide,
    });
    this.splashMesh = new THREE.Mesh(geo, mat);
    this.splashMesh.frustumCulled = false;
    this.splashMesh.userData = { rings, segs };
    this.splashGroup.add(this.splashMesh);

    const count = this.small ? 70 : 150;
    const dg = new THREE.SphereGeometry(1, 12, 10);
    const dm = new THREE.MeshPhysicalMaterial({
      color: this.splashColor,
      emissive: this.splashColor,
      emissiveIntensity: 0.55,
      roughness: 0.05,
      clearcoat: 1,
      envMapIntensity: 2,
    });
    this.drops = new THREE.InstancedMesh(dg, dm, count);
    this.drops.frustumCulled = false;
    for (let i = 0; i < count; i++) {
      this.dropData.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: 0.008 + Math.random() * 0.02, live: false });
    }
    this.splashGroup.add(this.drops);
    this.scene.add(this.splashGroup);
  }

  /* ----------------------------------------------------------------- API */

  /** Fire the liquid crown + droplet burst. */
  splash(color?: string) {
    if (color) {
      this.splashColor.set(color);
      (this.splashMesh.material as THREE.MeshPhysicalMaterial).color.copy(this.splashColor);
      (this.splashMesh.material as THREE.MeshPhysicalMaterial).emissive.copy(this.splashColor);
      const dm = this.drops.material as THREE.MeshPhysicalMaterial;
      dm.color.copy(this.splashColor);
      dm.emissive.copy(this.splashColor);
    }
    this.splashT = 0;
    this.dropData.forEach((d) => {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.4 + Math.random() * 1.8;
      d.p.set(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3);
      d.v.set(Math.cos(a) * sp, 2.2 + Math.random() * 4.8, Math.sin(a) * sp);
      d.live = true;
    });
  }

  playIntro() {
    if (this.reduce) {
      this.intro.x = 0;
      this.intro.stretch = 1;
      this.intro.alpha = 1;
      this.introDone = true;
      this.splash('#f6c026');
      return;
    }
    // Beats from ENTRANCE: the can arrives as the splash lifts rather than
    // behind it, and the liquid crown fires clear of the handover.
    gsap.fromTo(this.intro, { x: 9, stretch: 1.9 }, { x: 0, stretch: 1, duration: 1.15, ease: 'expo.out', delay: ENTRANCE.can });
    gsap.to(this.intro, { alpha: 1, duration: 0.2, delay: ENTRANCE.can });
    gsap.delayedCall(ENTRANCE.burst, () => this.splash('#f6c026'));
    gsap.delayedCall(ENTRANCE.settle, () => (this.introDone = true));
  }

  setMood(m: Mood) {
    this.mood = m;
  }

  setSelected(i: number) {
    if (i === this.sel) return;
    const prev = this.rigs[this.sel];
    gsap.to(prev.ingK, { v: 0, duration: 0.45, ease: 'power2.in' });
    this.sel = i;
    gsap.to(this.selF, { v: i, duration: 1.1, ease: 'expo.out' });
    const r = this.rigs[i];
    gsap.fromTo(r.ingK, { v: 0 }, { v: 1, duration: 1.4, ease: 'expo.out', delay: 0.15 });
    gsap.fromTo(this.zoom, { v: 0 }, { v: 1, duration: 0.6, ease: 'power3.out', yoyo: true, repeat: 1 });
    this.splash(r.flavour.accent);
  }

  armIngredients() {
    const r = this.rigs[this.sel];
    gsap.to(r.ingK, { v: 1, duration: 1.4, ease: 'expo.out' });
  }

  /** Re-measure section anchors at most once per frame. */
  private queueRefresh = () => {
    if (this.refreshQueued) return;
    this.refreshQueued = requestAnimationFrame(() => {
      this.refreshQueued = 0;
      this.refresh();
    });
  };

  /** Re-measure section anchors (data-can attributes). */
  refresh() {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-can]'));
    this.keys = els.map((el) => {
      const raw = el.dataset.can!.split(',').map(Number);
      const v = [0, 0, 1, 0, 0, 0, 0, 0].map((d, i) => (Number.isFinite(raw[i]) ? raw[i] : d));
      return { top: el.getBoundingClientRect().top + window.scrollY, v };
    });
  }

  private resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.small = w < 768;
    this.maxDpr = Math.min(window.devicePixelRatio, this.small ? 1.5 : 1.75);
    this.renderer.setPixelRatio(this.dpr());
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.refresh();
  }

  /* ------------------------------------------------------------- quality

     One dial, driven by measured frame time rather than by guessing at the
     device. Dropping a tier costs resolution and atmosphere, never the can. */

  private dpr() {
    return this.quality === 2 ? this.maxDpr : this.quality === 1 ? Math.min(this.maxDpr, 1.25) : 1;
  }

  private applyQuality() {
    this.renderer.setPixelRatio(this.dpr());
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.points.visible = this.quality > 0;
    this.smokes.forEach((s) => (s.visible = this.quality > 1));
  }

  /**
   * Smooth the frame time and step the tier when it stays off target.
   *
   * What is measured is the gap between frames, which the display caps: a
   * perfectly healthy page on a 60 Hz screen sits at 16.7 ms and never goes
   * below it. So the thresholds straddle that cadence rather than chasing an
   * unreachable number — DROP is about 42 fps, CLIMB is "comfortably keeping
   * up", and the gap between them is the hysteresis.
   */
  private static readonly DROP_MS = 24;
  private static readonly CLIMB_MS = 18;

  private grade(ms: number) {
    if (this.skipGrade) {
      this.skipGrade = false;
      return;
    }
    this.frameMs += (Math.min(ms, 100) - this.frameMs) * 0.05;
    if (this.hold > 0) {
      this.hold--;
      return;
    }
    if (this.frameMs > Stage.DROP_MS && this.quality > 0) {
      this.quality--;
      this.applyQuality();
      this.hold = 240; // ~4 s: let the new tier settle before judging it
    } else if (this.frameMs < Stage.CLIMB_MS && this.quality < 2) {
      this.quality++;
      this.applyQuality();
      this.hold = 600; // ~10 s: climbing back is the slower move, so a brief
      // calm patch cannot start a seesaw between two tiers
    }
  }

  /* ------------------------------------------------------- context loss */

  private onLost = (e: Event) => {
    // Default-prevented means we are asking for a restore, and the browser
    // only honours that if we ask during the event itself.
    e.preventDefault();
    this.lost = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    document.documentElement.classList.add('no-webgl');
    this.onContext?.(false);
  };

  private onRestored = () => {
    // three.js re-uploads its own resources; we restart what we own.
    this.lost = false;
    document.documentElement.classList.remove('no-webgl');
    this.applyQuality();
    this.refresh();
    this.last = performance.now();
    this.skipGrade = true;
    this.hold = 90;
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
    this.onContext?.(true);
  };

  /* -------------------------------------------------------------- input */

  private onMove = (e: PointerEvent) => {
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    if (this.dragging) {
      this.dragVel += e.movementX * 0.012;
      this.rigs[this.sel].drag += e.movementX * 0.012;
    }
  };
  private onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement | null)?.closest?.('[data-drag]')) this.dragging = true;
  };
  private onUp = () => {
    this.dragging = false;
  };

  /* ---------------------------------------------------------------- loop */

  private loop = () => {
    if (this.lost) return; // no context: nothing to drive and nothing to draw
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const raw = now - this.last;
    const dtMul = import.meta.env.DEV ? (window as unknown as { __dtMul?: number }).__dtMul ?? 1 : 1;
    const dt = Math.min(0.05, raw / 1000) * dtMul;
    this.last = now;
    if (document.hidden || !this.visible) {
      this.skipGrade = true; // the first frame back is not a performance signal
      return;
    }
    this.grade(raw);
    this.t += dt;
    const a = performance.now();
    this.update(dt);
    const b = performance.now();
    this.renderer.render(this.scene, this.camera);
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__xt = { update: b - a, render: performance.now() - b, dt, cur: this.cur.map((n) => +n.toFixed(2)), keys: this.keys, pos: this.rigs.map((r) => [r.group.visible, r.group.position.x, r.group.scale.x]) };
  };

  private update(dt: number) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    const mobile = aspect < 0.85;

    // scroll velocity
    const sy = window.scrollY;
    const v = (sy - this.lastScroll) / Math.max(dt, 0.001);
    this.lastScroll = sy;
    this.scrollVel = lerp(this.scrollVel, v, 1 - Math.exp(-dt * 8));
    const vNorm = Math.min(1, Math.abs(this.scrollVel) / 3000);

    // scroll-driven target state
    const keys = this.keys;
    if (keys.length) {
      const pos = sy + h / 2;
      const target = keys[0].v.slice();
      for (let i = 1; i < keys.length; i++) {
        const t = smooth((pos - (keys[i].top - h * 0.5)) / h);
        if (t <= 0) break;
        for (let k = 0; k < target.length; k++) target[k] = lerp(target[k], keys[i].v[k], t);
      }
      const f = 1 - Math.exp(-dt * 5.5);
      for (let k = 0; k < this.cur.length; k++) this.cur[k] = lerp(this.cur[k], target[k], f);
    }
    const [kx, ky, ks, kry, krx, ksplash, kcar, kmy] = this.cur;

    // mood
    const mt = MOODS[this.mood];
    const mf = 1 - Math.exp(-dt * 3.5);
    const ms = this.moodS;
    (Object.keys(ms) as (keyof typeof ms)[]).forEach((k) => {
      ms[k] = lerp(ms[k], mt[k], mf);
    });
    this.key.intensity = ms.key;
    this.rim.intensity = ms.rim;
    this.rim.color.lerp(new THREE.Color(mt.rimCol), mf);
    this.rim2.intensity = 10 + ms.rim * 2;
    const driveShake = this.mood === 'drive' ? 1 : 0;
    this.camera.fov = ms.fov + vNorm * 3;
    this.camera.position.x = lerp(this.camera.position.x, driveShake * Math.sin(this.t * 0.9) * 0.25 - this.pointerS.x * 0.15, 0.06);
    this.camera.position.y = lerp(this.camera.position.y, -this.pointerS.y * 0.1, 0.06);
    this.camera.position.z = 6 - this.zoom.v * 0.9 - (this.mood === 'drive' ? Math.sin(this.t * 0.7) * 0.25 : 0);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    this.pointerS.lerp(this.pointer, 1 - Math.exp(-dt * 4));

    const visH = 2 * this.camera.position.z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const visW = visH * aspect;

    // layout
    const px = kx * (mobile ? 0.2 : 1) * (visW / 2);
    const py = (ky + (mobile ? kmy : 0)) * (visH / 2);
    const ps = ks * (mobile ? 0.82 : 1);
    const spacing = mobile ? 0.95 : Math.min(2.2, visW * 0.2);
    const slotOff = mobile ? 0 : -visW * 0.1; // leave room for the info column on the right
    const car = smooth(kcar);

    this.dragVel *= Math.exp(-dt * 3);
    if (!this.dragging) this.rigs[this.sel].drag += this.dragVel * dt * 4;

    const introBlend = this.intro.alpha;
    this.rigs.forEach((rig, i) => {
      const d = i - this.selF.v;
      const near = 1 - Math.min(1, Math.abs(d));
      const slotS = lerp(0.62, 1.12, near) * (mobile ? 0.88 : 1);
      const slotX = d * spacing + slotOff;
      let x: number, y: number, s: number;
      if (i === 0) {
        x = lerp(px, slotX, car);
        y = lerp(py, 0, car);
        s = lerp(ps, slotS, car);
        x += this.intro.x;
        s *= introBlend > 0 ? 1 : 0;
      } else {
        x = slotX;
        y = 0;
        s = slotS * car;
      }
      rig.group.visible = s > 0.01;
      rig.group.position.set(x, y + Math.sin(this.t * 1.2 + i) * 0.04 * (1 - car * 0.5), 0);
      const stretch = i === 0 ? this.intro.stretch : 1;
      rig.group.scale.set(s * stretch, s, s);

      const idle = this.reduce ? 0 : this.t * (0.22 + 0.05 * i) + this.scrollVel * 0.0004;
      const isHero = i === 0 && car < 0.5;
      rig.pivot.rotation.y =
        Math.PI + kry * (i === 0 ? 1 : 0) + idle + rig.drag + this.pointerS.x * 0.35 * (isHero || i === this.sel ? 1 : 0.3);
      rig.pivot.rotation.x = krx * (i === 0 ? 1 : 0) + this.pointerS.y * -0.14 + Math.sin(this.t * 0.8 + i) * 0.015;
      rig.pivot.rotation.z = lerp(0.1, 0, car) * (i === 0 ? 1 : 0) + (i === 0 ? (1 - this.intro.stretch) * 0.0 : 0) - vNorm * 0.06 * Math.sign(this.scrollVel);

      // ingredients
      const k = rig.ingK.v * car * (i === this.sel ? 1 : 0);
      rig.ing.visible = k > 0.01;
      if (rig.ing.visible) {
        rig.items.forEach((it) => {
          const a = it.a + this.t * it.sp;
          const r = it.r * (0.25 + 0.75 * k) * (1 + Math.sin(this.t * 0.9 + it.a * 3) * 0.04);
          it.mesh.position.set(Math.cos(a) * r, it.h * k + Math.sin(this.t * 1.1 + it.a) * 0.05, Math.sin(a) * r * 0.9);
          it.mesh.rotation.x += it.spin.x * dt;
          it.mesh.rotation.y += it.spin.y * dt;
          it.mesh.rotation.z += it.spin.z * dt;
          it.mesh.scale.setScalar(Math.max(0.001, k) * (it.mesh.userData.base ??= it.mesh.scale.x));
        });
      }
    });

    // hide ingredients when scale was baked wrong at k=0 (guard)
    // splash follows hero can base
    const hero = this.rigs[0];
    const splashAmt = ksplash * (1 - car);
    if (ksplash > 0.7 && this.prevSplash <= 0.7 && this.introDone) this.splash('#f6c026');
    this.prevSplash = ksplash;
    if (splashAmt > 0.7 && this.introDone && this.splashT > 9) this.splash();
    this.splashGroup.visible = splashAmt > 0.02 && hero.group.visible;
    this.splashGroup.position.copy(hero.group.position);
    this.splashGroup.position.y += -0.78 * hero.group.scale.y;
    this.splashGroup.scale.setScalar(hero.group.scale.y * Math.max(0.01, splashAmt));
    this.updateSplash(dt);

    // particles
    const pArr = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const speed = ms.speed * (1 + vNorm * 4) * (this.reduce ? 0.2 : 1);
    for (let i = 0; i < pArr.count; i++) {
      let yy = pArr.getY(i) + this.pVel[i] * dt * speed * 0.55;
      let xx = pArr.getX(i) + Math.sin(this.t * 0.6 + i) * dt * 0.05;
      if (this.mood === 'drive') xx -= this.pVel[i] * dt * speed * 0.4;
      if (yy > 3.2) yy = -3.2;
      if (xx < -4.6) xx = 4.6;
      pArr.setXYZ(i, xx, yy, pArr.getZ(i));
    }
    pArr.needsUpdate = true;
    (this.points.material as THREE.PointsMaterial).opacity = lerp((this.points.material as THREE.PointsMaterial).opacity, ms.part, 0.05);

    // smoke
    this.smokes.forEach((s, i) => {
      s.material.rotation += s.userData.sp * dt;
      s.position.y += Math.sin(this.t * 0.2 + s.userData.ph) * dt * 0.05;
      s.material.opacity = lerp(s.material.opacity, 0.22 * ms.smoke * (0.6 + 0.4 * ksplash + 0.4 * car), 0.05);
      s.material.color.setHex(i % 2 ? 0x3a4bff : 0x1c2290);
    });
  }

  private updateSplash(dt: number) {
    this.splashT += dt;
    const t = this.splashT;
    const geo = this.splashMesh.geometry;
    const { rings, segs } = this.splashMesh.userData as { rings: number; segs: number };
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const live = t < 6;
    this.splashMesh.visible = live;
    (this.splashMesh.material as THREE.MeshPhysicalMaterial).opacity = 0.94 * (t < 2.2 ? 1 : Math.max(0, 1 - (t - 2.2) / 2.6));
    if (live) {
      const R0 = 0.24;
      const Rmax = 1.55;
      const rc = R0 + 0.12 + (Rmax - 0.5) * (1 - Math.exp(-t * 2.4)) * 0.62;
      const amp = Math.min(1, t * 7) * Math.exp(-t * 1.1) * 0.9;
      const wid = 0.085 + t * 0.07;
      for (let r = 0; r <= rings; r++) {
        const u = r / rings;
        const rad = R0 + u * (Rmax - R0);
        const dr = (rad - rc) / wid;
        const bump = Math.exp(-dr * dr);
        const puddle = Math.max(0, 1 - rad / (rc + 0.3)) * 0.05 * Math.min(1, t * 3);
        for (let s = 0; s <= segs; s++) {
          const th = (s / segs) * Math.PI * 2;
          const spikes = Math.pow(Math.abs(Math.sin(th * 7 + Math.sin(th * 3) * 1.2)), 1.5);
          const spikes2 = Math.pow(Math.abs(Math.sin(th * 13 + 1.3)), 2.4);
          const m = 0.3 + 0.55 * spikes + 0.35 * spikes2;
          const y = bump * amp * m + puddle;
          const lean = bump * amp * m * 0.22; // spikes lean outward
          const rr = rad + lean;
          const fade = rad > rc + wid * 3 ? 0 : 1;
          pos.setXYZ(r * (segs + 1) + s, Math.cos(th) * rr, y * fade, Math.sin(th) * rr);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // droplets
    let any = false;
    this.dropData.forEach((d, i) => {
      if (d.live) {
        d.v.y -= 9 * dt;
        d.p.addScaledVector(d.v, dt);
        if (d.p.y < -0.05 && d.v.y < 0) d.live = false;
        any = true;
      }
      this.dummy.position.copy(d.p);
      this.dummy.scale.setScalar(d.live ? d.r : 0.0001);
      this.dummy.updateMatrix();
      this.drops.setMatrixAt(i, this.dummy.matrix);
    });
    if (any || t < 8) this.drops.instanceMatrix.needsUpdate = true;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    cancelAnimationFrame(this.refreshQueued);
    gsap.killTweensOf([this.intro, this.zoom, this.selF, this.moodS, ...this.rigs.map((r) => r.ingK)]);
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointerup', this.onUp);
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
    this.ro.disconnect();
    this.io?.disconnect();

    // Geometries, materials and generated textures are GPU memory: hand every
    // one back. renderer.dispose() alone leaves them allocated.
    const killMaterial = (m: THREE.Material) => {
      for (const v of Object.values(m) as unknown[]) {
        if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
      }
      m.dispose();
    };
    this.scene.traverse((o) => {
      const h = o as Partial<THREE.Mesh> & { material?: THREE.Material | THREE.Material[] };
      h.geometry?.dispose();
      const mat = h.material;
      if (Array.isArray(mat)) mat.forEach(killMaterial);
      else if (mat) killMaterial(mat);
    });
    this.scene.environment?.dispose();
    this.scene.clear();
    // Not forceContextLoss(): the canvas outlives this Stage and a remount
    // takes the same context straight back.
    this.renderer.dispose();
  }
}
