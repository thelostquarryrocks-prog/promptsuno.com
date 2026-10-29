// Canvas drawing for the homepage, ported from the Oct 10 Claude Design comp.
// Pure functions: the components own the animation loops.

export type RGB = readonly [number, number, number];

export interface Spark {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
}

export interface Burst {
  x: number;
  y: number;
  rgb: RGB;
  t0: number;
}

/** Deterministic sparks so every visit looks the same. */
export function makeSparks(count = 90): Spark[] {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const sparks: Spark[] = [];
  for (let n = 0; n < count; n++) {
    const side = rand() < 0.5 ? rand() * 0.36 : 0.64 + rand() * 0.36;
    sparks.push({
      x: side,
      y: rand(),
      r: 0.6 + rand() * 1.6,
      speed: 0.008 + rand() * 0.02,
      drift: 0.004 + rand() * 0.01,
      phase: rand() * 6.28,
    });
  }
  return sparks;
}

/** Fits a canvas's backing store to its CSS size. Returns the CSS size. */
export function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

export function drawWaves(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, sparks: Spark[]) {
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";
  const glow = (x: number, y: number, r: number, c: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  glow(w * 0.14, h * 0.5, w * 0.34, "rgba(255,120,20,0.16)");
  glow(w * 0.86, h * 0.5, w * 0.34, "rgba(255,30,130,0.16)");
  glow(w * 0.5, h * 0.62, w * 0.3, "rgba(150,40,160,0.10)");
  const narrow = w < 700;
  const lines = narrow ? 20 : 34;
  const step = narrow ? 6 : 4;
  const reach = w * (narrow ? 0.62 : 0.56);
  const sides: { dir: 1 | -1; from: RGB; to: RGB }[] = [
    { dir: 1, from: [255, 120, 20], to: [255, 200, 90] },
    { dir: -1, from: [255, 30, 135], to: [255, 95, 120] },
  ];
  for (const s of sides) {
    for (let j = 0; j < 7; j++) {
      const bx = s.dir === 1 ? w * (0.065 + j * 0.011) : w - w * (0.065 + j * 0.011);
      const bh = h * (0.05 + 0.05 * (0.5 + 0.5 * Math.sin(t * 1.4 + j * 1.7)));
      const by = h * 0.43;
      const bg = ctx.createLinearGradient(0, by - bh, 0, by);
      bg.addColorStop(0, "rgba(0,0,0,0)");
      bg.addColorStop(1, rgba(s.from, 0.35));
      ctx.fillStyle = bg;
      ctx.fillRect(bx, by - bh, 2.5, bh);
    }
    for (let i = 0; i < lines; i++) {
      const mix = i / (lines - 1);
      const k = mix - 0.5;
      const c: RGB = [
        Math.round(s.from[0] + (s.to[0] - s.from[0]) * mix),
        Math.round(s.from[1] + (s.to[1] - s.from[1]) * mix),
        Math.round(s.from[2] + (s.to[2] - s.from[2]) * mix),
      ];
      for (let px = 0; px <= reach; px += step) {
        const u = px / reach;
        const spread = h * 0.56 * Math.pow(1 - u, 1.1) + h * 0.02;
        const y =
          h * (0.5 + 0.08 * u) +
          k * spread +
          Math.sin(u * 3.4 + t * 0.5 + i * 0.09) * h * 0.09 * (1 - u * 0.5) +
          Math.sin(u * 1.4 - t * 0.3 + i * 0.03) * h * 0.06;
        const x = s.dir === 1 ? px : w - px;
        const core = Math.max(0.08, 1 - Math.abs(k) * 1.3);
        const tw = 0.7 + 0.3 * Math.sin(px * 0.31 + t * 2.2 + i);
        const a = 0.95 * Math.pow(1 - u, 0.55) * core * tw;
        if (a < 0.02) continue;
        ctx.fillStyle = rgba(c, a);
        ctx.fillRect(x, y, 1.8, 1.8);
      }
    }
    ctx.shadowColor = `rgb(${s.from[0]},${s.from[1]},${s.from[2]})`;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 1.4;
    for (const kk of [-0.18, -0.04, 0.1]) {
      ctx.beginPath();
      for (let qx = 0; qx <= reach * 0.92; qx += 8) {
        const uu = qx / reach;
        const sp = h * 0.56 * Math.pow(1 - uu, 1.1) + h * 0.02;
        const yy =
          h * (0.5 + 0.08 * uu) +
          kk * sp +
          Math.sin(uu * 3.4 + t * 0.5 + (kk + 0.5) * 3) * h * 0.09 * (1 - uu * 0.5) +
          Math.sin(uu * 1.4 - t * 0.3) * h * 0.06;
        const xx = s.dir === 1 ? qx : w - qx;
        if (qx === 0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      }
      const sg = ctx.createLinearGradient(s.dir === 1 ? 0 : w, 0, s.dir === 1 ? reach : w - reach, 0);
      sg.addColorStop(0, rgba(s.to, 0.55));
      sg.addColorStop(1, rgba(s.to, 0));
      ctx.strokeStyle = sg;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
  for (const sk of sparks) {
    const sy = (((sk.y - t * sk.speed) % 1) + 1) % 1;
    const sx = sk.x + Math.sin(t * 0.4 + sk.phase) * sk.drift;
    const sa = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2 + sk.phase));
    ctx.fillStyle = sx < 0.5 ? `rgba(255,150,50,${sa.toFixed(3)})` : `rgba(255,60,150,${sa.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sx * w, sy * h, sk.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

/** Little particle pops where a floating tag expires. Mutates `bursts` to drop finished ones. */
export function drawBursts(ctx: CanvasRenderingContext2D, bursts: Burst[], now: number) {
  ctx.globalCompositeOperation = "lighter";
  for (let bi = bursts.length - 1; bi >= 0; bi--) {
    const B = bursts[bi];
    const age = (now - B.t0) / 650;
    if (age >= 1) {
      bursts.splice(bi, 1);
      continue;
    }
    for (let q = 0; q < 16; q++) {
      const ang = (q / 16) * 6.283 + B.t0;
      const rr = 8 + age * 70 * (0.6 + 0.4 * Math.sin(q * 7.1));
      ctx.fillStyle = rgba(B.rgb, 0.9 * (1 - age));
      ctx.beginPath();
      ctx.arc(B.x + Math.cos(ang) * rr, B.y + Math.sin(ang) * rr, 1.8 * (1 - age) + 0.4, 0, 6.283);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = "source-over";
}

/** The flowing ribbon art behind the Learn / Build / Write cards. */
export function drawRibbon(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, pal: readonly [RGB, RGB]) {
  const [c0, c1] = pal;
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(w * 0.8, h * 0.38, 0, w * 0.8, h * 0.38, w * 0.5);
  g.addColorStop(0, rgba(c0, 0.2));
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let j = 0; j < 6; j++) {
    const bx = w * (0.6 + j * 0.055);
    const by = h * 0.6;
    const bh = h * (0.1 + 0.16 * (0.5 + 0.5 * Math.sin(t * 1.5 + j * 1.3)));
    const bg = ctx.createLinearGradient(0, by - bh, 0, by);
    bg.addColorStop(0, "rgba(0,0,0,0)");
    bg.addColorStop(1, rgba(c1, 0.55));
    ctx.fillStyle = bg;
    ctx.fillRect(bx, by - bh, 3, bh);
  }
  const lines = 16;
  for (let i = 0; i < lines; i++) {
    const mix = i / (lines - 1);
    const k = mix - 0.5;
    const c: RGB = [
      Math.round(c0[0] + (c1[0] - c0[0]) * mix),
      Math.round(c0[1] + (c1[1] - c0[1]) * mix),
      Math.round(c0[2] + (c1[2] - c0[2]) * mix),
    ];
    for (let px = 0; px <= w; px += 4) {
      const u = px / w;
      const y =
        h * (0.7 - 0.42 * u) +
        k * h * (0.05 + 0.24 * Math.sin(Math.min(u * 1.15, 1) * Math.PI)) +
        Math.sin(u * 5.5 + t * 0.7 + i * 0.12) * h * 0.07;
      const core = Math.max(0.1, 1 - Math.abs(k) * 1.4);
      const a = Math.pow(u, 1.5) * 0.95 * core * (0.7 + 0.3 * Math.sin(px * 0.3 + t * 2.2 + i));
      if (a < 0.02) continue;
      ctx.fillStyle = rgba(c, a);
      ctx.fillRect(px, y, 1.6, 1.6);
    }
  }
  ctx.globalCompositeOperation = "source-over";
}
