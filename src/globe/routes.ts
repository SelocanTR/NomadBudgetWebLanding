// The route over the planet, on a 2D canvas above it: each crossing's great circle in the
// app's line language (white with a dark halo; flights dashed and lifted off the surface,
// roads dotted, rail solid and thick, ferries long-dashed), the vehicle travelling the
// crossing in progress, a badge on every crossing made, and a dot on every stop reached.
// Everything fades out over the last of the near side instead of vanishing at the limb.

import { clamp, flightLift, nearestTurn, project, smoothstep } from './geo';
import type { View } from './renderer';

export type Transport = 'flight' | 'train' | 'bus' | 'ferry' | 'car';

export type Leg = { transport: Transport; points: number[] };

type Style = { w: number; dash: number[]; cap: CanvasLineCap };

const STYLE: Record<Transport, Style> = {
  flight: { w: 2, dash: [7, 6], cap: 'butt' },
  train: { w: 3.2, dash: [], cap: 'round' },
  bus: { w: 2.6, dash: [0.1, 6.5], cap: 'round' },
  car: { w: 2.6, dash: [0.1, 6.5], cap: 'round' },
  ferry: { w: 2.2, dash: [12, 5], cap: 'butt' },
};

const HALO = 'rgba(4,8,18,0.5)';
const LINE = '#FFFFFF';

/** The vehicle's length on screen, CSS px — the app's VOYAGE_LEN_PT, a little larger. */
export const VEHICLE_LEN: Record<Transport, number> = { train: 52, flight: 46, ferry: 48, bus: 40, car: 30 };

/** Near side only, faded over the last of it. */
const limb = (c: number) => smoothstep(0.02, 0.2, c);

type Pt = { x: number; y: number; a: number };

export class RouteLayer {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;

  constructor(private canvas: HTMLCanvasElement, private sprites: Record<Transport, HTMLImageElement>) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d');
    this.ctx = ctx;
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.dpr = dpr;
    const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  /** The screen point `t` of the way along `leg` (0..1), lifted if it flies, with its limb alpha. */
  pointAt(leg: Leg, t: number, v: View): Pt {
    const n = leg.points.length / 2;
    const f = clamp(t, 0, 1) * (n - 1);
    const i = Math.min(n - 2, Math.floor(f));
    const u = f - i;
    const lon0 = leg.points[i * 2], lat0 = leg.points[i * 2 + 1];
    const lon1 = nearestTurn(lon0, leg.points[i * 2 + 2]), lat1 = leg.points[i * 2 + 3];
    return this.screen(leg, lon0 + (lon1 - lon0) * u, lat0 + (lat1 - lat0) * u, t, v);
  }

  private screen(leg: Leg, lon: number, lat: number, t: number, v: View): Pt {
    const [x, y, c] = project(lon, lat, v.lon0, v.lat0);
    let lx = 0, ly = 0;
    if (leg.transport === 'flight') {
      const n = leg.points.length;
      const [ax, ay] = project(leg.points[0], leg.points[1], v.lon0, v.lat0);
      const [bx, by] = project(leg.points[n - 2], leg.points[n - 1], v.lon0, v.lat0);
      [lx, ly] = flightLift(ax, ay, bx, by, t);
    }
    return { x: v.cx + (x + lx) * v.r, y: v.cy + (y + ly) * v.r, a: limb(c) };
  }

  /**
   * `progress[i]` is how much of leg i is drawn (0..1). `vehicle` is the leg whose head
   * carries its vehicle, `stops` how many stops have been reached, `anchors` their places.
   */
  draw(v: View, legs: Leg[], progress: number[], vehicle: number | null, stops: number, anchors: [number, number][], alpha: number) {
    const { ctx, dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (alpha <= 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    legs.forEach((leg, i) => {
      if (progress[i] > 0) this.line(leg, progress[i], v, alpha);
    });

    // Dots on the stops reached.
    for (let i = 0; i < stops; i++) {
      const [x, y, c] = project(anchors[i][0], anchors[i][1], v.lon0, v.lat0);
      const a = limb(c) * alpha;
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(v.cx + x * v.r, v.cy + y * v.r, 4, 0, Math.PI * 2);
      ctx.fillStyle = LINE;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = HALO;
      ctx.stroke();
    }

    // Badges on the crossings made, the vehicle on the one being made.
    legs.forEach((leg, i) => {
      if (progress[i] >= 1 && i !== vehicle) this.badge(leg, v, alpha);
    });
    if (vehicle !== null && progress[vehicle] > 0 && progress[vehicle] < 1) this.vehicle(legs[vehicle], progress[vehicle], v, alpha);
    ctx.globalAlpha = 1;
  }

  private line(leg: Leg, upTo: number, v: View, alpha: number) {
    const style = STYLE[leg.transport];
    const n = leg.points.length / 2;
    const end = upTo * (n - 1);
    const pts: Pt[] = [];
    for (let i = 0; i <= Math.floor(end); i++) {
      pts.push(this.screen(leg, leg.points[i * 2], leg.points[i * 2 + 1], i / (n - 1), v));
    }
    if (end % 1 > 0) pts.push(this.pointAt(leg, upTo, v));
    if (pts.length < 2) return;

    // Runs of points at one alpha step, so the fade costs a handful of strokes, not one
    // per segment; the dash carries on from run to run by its offset.
    const level = (a: number) => Math.round(a * 6) / 6;
    let dist = 0;
    let runStart = 0;
    let runLevel = -1;
    let run: Pt[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const l = Math.min(level(pts[i - 1].a), level(pts[i].a));
      if (l !== runLevel) {
        if (run.length > 1 && runLevel > 0) this.stroke(run, style, runLevel * alpha, runStart);
        run = [pts[i - 1]];
        runLevel = l;
        runStart = dist;
      }
      run.push(pts[i]);
      dist += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }
    if (run.length > 1 && runLevel > 0) this.stroke(run, style, runLevel * alpha, runStart);
  }

  private stroke(run: Pt[], style: Style, a: number, offset: number) {
    const { ctx } = this;
    ctx.globalAlpha = a;
    ctx.lineCap = style.cap;
    ctx.lineJoin = 'round';
    ctx.setLineDash(style.dash);
    ctx.lineDashOffset = -offset;
    ctx.beginPath();
    ctx.moveTo(run[0].x, run[0].y);
    for (let i = 1; i < run.length; i++) ctx.lineTo(run[i].x, run[i].y);
    ctx.strokeStyle = HALO;
    ctx.lineWidth = style.w + 3.5;
    ctx.stroke();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = style.w;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private heading(leg: Leg, t: number, v: View): [Pt, number] {
    const p = this.pointAt(leg, t, v);
    const d = 0.004;
    const a = this.pointAt(leg, Math.max(0, t - d), v);
    const b = this.pointAt(leg, Math.min(1, t + d), v);
    return [p, Math.atan2(b.y - a.y, b.x - a.x)];
  }

  private vehicle(leg: Leg, t: number, v: View, alpha: number) {
    const { ctx } = this;
    const [p, angle] = this.heading(leg, t, v);
    if (p.a <= 0) return;
    const flying = leg.transport === 'flight';
    // Climb and descent: a flight grows a little at the top of its arc, and its shadow
    // falls further away.
    const up = flying ? Math.sin(Math.PI * t) : 0;
    const len = VEHICLE_LEN[leg.transport] * (1 + 0.22 * up);
    ctx.save();
    ctx.globalAlpha = p.a * alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 6 + 8 * up;
    ctx.shadowOffsetX = 3 + 10 * up;
    ctx.shadowOffsetY = 4 + 12 * up;
    ctx.drawImage(this.sprites[leg.transport], -len / 2, -len / 2, len, len);
    ctx.restore();
  }

  private badge(leg: Leg, v: View, alpha: number) {
    const { ctx } = this;
    const [p, angle] = this.heading(leg, 0.5, v);
    if (p.a <= 0) return;
    ctx.save();
    ctx.globalAlpha = p.a * alpha;
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.rotate(angle);
    ctx.drawImage(this.sprites[leg.transport], -11, -11, 22, 22);
    ctx.restore();
  }
}
