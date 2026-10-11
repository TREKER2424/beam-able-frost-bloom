import { GOAL_HW, HALF_L, HALF_W } from "./data";
import type { Ball, RT } from "./sim";

export type FieldView = {
  players: RT[];
  ball: Ball;
  particles: { x: number; y: number; life: number; max: number; color: string; size: number }[];
  homeColor: string;
  awayColor: string;
  controlledId: string;
  cam: { x: number; y: number; shake: number };
  viewH: number;
  phase: string;
  offsideY?: number | null;
  weather?: "clear" | "rain" | "snow";
  weatherT?: number;
  official?: { x: number; y: number };
  flipY?: boolean;
};

const NETS = buildNets();

function buildNets() {
  const nets: { x: number; y: number; z: number; px: number; py: number; pz: number; pin: boolean }[][] = [];
  for (const gy of [HALF_L, -HALF_L]) {
    const nodes = [];
    const cols = 9;
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -GOAL_HW + (c / (cols - 1)) * GOAL_HW * 2;
        const z = (r / (rows - 1)) * 2.4;
        const y = gy + Math.sign(gy) * 0.15;
        const pin = r === rows - 1 || c === 0 || c === cols - 1;
        nodes.push({ x, y, z, px: x, py: y, pz: z, pin });
      }
    }
    nets.push(nodes);
  }
  return nets;
}

export function relaxNets(ball: Ball) {
  for (const nodes of NETS) {
    for (const n of nodes) {
      if (n.pin) {
        n.px = n.x;
        n.py = n.y;
        n.pz = n.z;
        continue;
      }
      const vx = n.x - n.px;
      const vy = n.y - n.py;
      const vz = n.z - n.pz;
      n.px = n.x;
      n.py = n.y;
      n.pz = n.z;
      n.x += vx * 0.86;
      n.y += vy * 0.86;
      n.z += vz * 0.86 + 0.002;
      const dx = n.x - ball.x;
      const dy = n.y - ball.y;
      const dz = n.z - ball.z;
      const d = Math.hypot(dx, dy, dz);
      if (d < 1.4 && d > 0.001) {
        const push = (1.4 - d) * 0.35;
        n.x += (dx / d) * push;
        n.y += (dy / d) * push;
        n.z += (dz / d) * push * 0.4;
      }
    }
  }
}

export function paintMatch(ctx: CanvasRenderingContext2D, w: number, h: number, field: FieldView) {
  const scale = h / Math.max(20, field.viewH);
  const fy = field.flipY ? -1 : 1;
  const shake = (field.cam.shake || 0) * 4;
  const project = (x: number, y: number, z = 0) => {
    const s = scale;
    return {
      sx: w / 2 + (x - field.cam.x) * s + shake,
      sy: h * 0.52 - (y - field.cam.y) * fy * s - z * s,
      s,
    };
  };

  ctx.clearRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  const wet = field.weather === "rain";
  const cold = field.weather === "snow";
  sky.addColorStop(0, wet ? "#141c24" : cold ? "#1a2228" : "#0c2416");
  sky.addColorStop(0.42, wet ? "#1c2830" : cold ? "#243038" : "#145c30");
  sky.addColorStop(1, "#07110c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  drawStands(ctx, project, field.weatherT ?? 0, field.homeColor, field.awayColor);
  drawGrass(ctx, project);
  drawLines(ctx, project);
  if (field.offsideY != null) {
    ctx.save();
    ctx.strokeStyle = "rgba(212,83,74,0.9)";
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = Math.max(1.5, project(0, 0).s * 0.1);
    strokeWorld(ctx, project, [
      [-HALF_W, field.offsideY],
      [HALF_W, field.offsideY],
    ]);
    ctx.restore();
  }
  drawGoals(ctx, project, field);
  drawShadows(ctx, project, field);
  const sprites = field.players
    .filter((p) => p.on && !p.red)
    .map((p) => ({ p, y: p.y }))
    .sort((a, b) => a.y - b.y);
  for (const { p } of sprites) drawPlayer(ctx, project, p, p.uid === field.controlledId, p.side === 0 ? field.homeColor : field.awayColor);
  if (field.official) drawOfficial(ctx, project, field.official);
  drawBall(ctx, project, field.ball);
  drawWeather(ctx, w, h, field);
  for (const q of field.particles) {
    const pt = project(q.x, q.y, (q.life / q.max) * 2);
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.color;
    ctx.fillRect(pt.sx, pt.sy, q.size * pt.s, q.size * pt.s);
    ctx.globalAlpha = 1;
  }
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

type Fan = { x: number; y: number; z: number; phase: number; camp: 0 | 1; salt: number };

const FANS: Fan[] = buildFans();

function buildFans(): Fan[] {
  const fans: Fan[] = [];
  const gap = 2.4;
  const depth = 11;
  const stands = [
    { x0: -HALF_W - 1, x1: HALF_W + 1, y0: HALF_L + gap, y1: HALF_L + gap + depth, cols: 38, rows: 6 },
    { x0: -HALF_W - 1, x1: HALF_W + 1, y0: -HALF_L - gap - depth, y1: -HALF_L - gap, cols: 38, rows: 6 },
    { x0: HALF_W + gap, x1: HALF_W + gap + depth, y0: -HALF_L + 1, y1: HALF_L - 1, cols: 8, rows: 22 },
    { x0: -HALF_W - gap - depth, x1: -HALF_W - gap, y0: -HALF_L + 1, y1: HALF_L - 1, cols: 8, rows: 22 },
  ];
  let n = 0;
  for (const stand of stands) {
    for (let r = 0; r < stand.rows; r++) {
      for (let c = 0; c < stand.cols; c++) {
        if ((r + c * 3) % 8 === 0) continue;
        const tx = (c + 0.5) / stand.cols;
        const ty = (r + 0.5) / stand.rows;
        const x = stand.x0 + (stand.x1 - stand.x0) * tx;
        const y = stand.y0 + (stand.y1 - stand.y0) * ty;
        const camp: 0 | 1 = y >= 0 ? 1 : 0;
        fans.push({ x, y, z: 0.35 + r * 0.42, phase: (n % 19) * 0.41, camp, salt: n * 5 + r * 3 + c });
        n++;
      }
    }
  }
  return fans;
}

function shirtTint(hex: string, salt: number) {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((ch) => ch + ch).join("") : raw;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return hex;
  const k = 0.58 + (salt % 6) * 0.08;
  const lift = (salt % 4) * 14;
  const ch = (shift: number) => Math.max(0, Math.min(255, Math.round((((n >> shift) & 255) * k) + lift)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function drawStands(
  ctx: CanvasRenderingContext2D,
  project: (x: number, y: number, z?: number) => { sx: number; sy: number; s: number },
  time: number,
  homeColor: string,
  awayColor: string,
) {
  const gap = 2.4;
  const depth = 11.6;
  ctx.fillStyle = "#0d1612";
  poly(ctx, project, [
    [-HALF_W - gap - depth - 1.5, -HALF_L - gap - depth - 1.5],
    [HALF_W + gap + depth + 1.5, -HALF_L - gap - depth - 1.5],
    [HALF_W + gap + depth + 1.5, HALF_L + gap + depth + 1.5],
    [-HALF_W - gap - depth - 1.5, HALF_L + gap + depth + 1.5],
  ]);
  ctx.fill();
  ctx.fillStyle = "#1a2c24";
  const tiers = [
    [-HALF_W - 0.4, HALF_L + gap, HALF_W + 0.4, HALF_L + gap + depth],
    [-HALF_W - 0.4, -HALF_L - gap - depth, HALF_W + 0.4, -HALF_L - gap],
    [HALF_W + gap, -HALF_L, HALF_W + gap + depth, HALF_L],
    [-HALF_W - gap - depth, -HALF_L, -HALF_W - gap, HALF_L],
  ];
  for (const [x0, y0, x1, y1] of tiers) {
    poly(ctx, project, [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ]);
    ctx.fill();
  }
  for (const fan of FANS) {
    const wave = Math.sin(time * 2.1 + fan.phase);
    const jump = Math.max(0, Math.sin(time * 1.15 + fan.phase * 1.7));
    const p = project(fan.x, fan.y, fan.z + jump * 0.55);
    const s = Math.max(2.4, p.s * 0.62);
    const lean = wave * s * 0.18;
    const main = fan.camp === 0 ? homeColor : awayColor;
    const other = fan.camp === 0 ? awayColor : homeColor;
    ctx.fillStyle = shirtTint(fan.salt % 9 === 0 ? other : main, fan.salt);
    ctx.globalAlpha = 0.94;
    ctx.fillRect(p.sx - s * 0.42 + lean, p.sy - s * 1.15, s * 0.84, s * 1.05);
    ctx.fillStyle = "#efd0b0";
    ctx.beginPath();
    ctx.arc(p.sx + lean * 0.4, p.sy - s * 1.38, s * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const boards: [number, number, string][] = [
    [0, HALF_L + 1.15, "#e7f2ea"],
    [0, -HALF_L - 1.15, "#8fe388"],
    [HALF_W + 1.15, 0, "#e2b93b"],
    [-HALF_W - 1.15, 0, "#c4534a"],
  ];
  for (const [x, y, color] of boards) {
    const horizontal = Math.abs(y) > Math.abs(x);
    const p = project(x, y, 0.35);
    ctx.fillStyle = color;
    if (horizontal) ctx.fillRect(p.sx - p.s * HALF_W, p.sy - p.s * 0.35, p.s * HALF_W * 2, p.s * 0.7);
    else ctx.fillRect(p.sx - p.s * 0.35, p.sy - p.s * HALF_L, p.s * 0.7, p.s * HALF_L * 2);
  }
}

function drawGrass(ctx: CanvasRenderingContext2D, project: (x: number, y: number, z?: number) => { sx: number; sy: number }) {
  const stripes = 14;
  const span = (HALF_L * 2) / stripes;
  for (let i = 0; i < stripes; i++) {
    const y0 = -HALF_L + i * span;
    ctx.fillStyle = i % 2 === 0 ? "#187a3a" : "#1f9a48";
    poly(ctx, project, [
      [-HALF_W, y0],
      [HALF_W, y0],
      [HALF_W, y0 + span],
      [-HALF_W, y0 + span],
    ]);
    ctx.fill();
  }
}

function poly(ctx: CanvasRenderingContext2D, project: (x: number, y: number, z?: number) => { sx: number; sy: number }, pts: [number, number][]) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const p = project(x, y, 0);
    if (i === 0) ctx.moveTo(p.sx, p.sy);
    else ctx.lineTo(p.sx, p.sy);
  });
  ctx.closePath();
}

function strokeWorld(ctx: CanvasRenderingContext2D, project: (x: number, y: number, z?: number) => { sx: number; sy: number; s: number }, pts: [number, number][], close = false) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const p = project(x, y, 0);
    if (i === 0) ctx.moveTo(p.sx, p.sy);
    else ctx.lineTo(p.sx, p.sy);
  });
  if (close) ctx.closePath();
  ctx.stroke();
}

function drawLines(ctx: CanvasRenderingContext2D, project: (x: number, y: number, z?: number) => { sx: number; sy: number; s: number }) {
  ctx.strokeStyle = "rgba(255,255,255,0.88)";
  ctx.lineWidth = Math.max(1.2, project(0, 0).s * 0.12);
  strokeWorld(ctx, project, [
    [-HALF_W, -HALF_L],
    [HALF_W, -HALF_L],
    [HALF_W, HALF_L],
    [-HALF_W, HALF_L],
  ], true);
  strokeWorld(ctx, project, [
    [-HALF_W, 0],
    [HALF_W, 0],
  ]);
  const circle: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    circle.push([Math.cos(a) * 9.15, Math.sin(a) * 9.15]);
  }
  strokeWorld(ctx, project, circle, true);
  for (const s of [1, -1]) {
    strokeWorld(ctx, project, [
      [-20.16, s * HALF_L],
      [-20.16, s * (HALF_L - 16.5)],
      [20.16, s * (HALF_L - 16.5)],
      [20.16, s * HALF_L],
    ]);
    strokeWorld(ctx, project, [
      [-9.16, s * HALF_L],
      [-9.16, s * (HALF_L - 5.5)],
      [9.16, s * (HALF_L - 5.5)],
      [9.16, s * HALF_L],
    ]);
  }
}

function drawGoals(ctx: CanvasRenderingContext2D, project: (x: number, y: number, z?: number) => { sx: number; sy: number; s: number }, field: FieldView) {
  const frame = field.phase === "goal" ? "#8FE388" : "#f4f7f2";
  for (const gy of [HALF_L, -HALF_L]) {
    const sign = Math.sign(gy);
    const h = 2.44;
    const depth = 1.35;
    const back = gy + sign * depth;
    ctx.strokeStyle = "rgba(231,242,234,0.55)";
    ctx.lineWidth = Math.max(1, project(0, 0).s * 0.07);
    const net: [number, number, number][][] = [
      [[-GOAL_HW, gy, h], [GOAL_HW, gy, h], [GOAL_HW, back, h * 0.72], [-GOAL_HW, back, h * 0.72]],
      [[-GOAL_HW, gy, 0], [-GOAL_HW, gy, h], [-GOAL_HW, back, h * 0.72], [-GOAL_HW, back, 0]],
      [[GOAL_HW, gy, 0], [GOAL_HW, gy, h], [GOAL_HW, back, h * 0.72], [GOAL_HW, back, 0]],
    ];
    for (const poly3 of net) {
      ctx.beginPath();
      poly3.forEach(([x, y, z], i) => {
        const p = project(x, y, z);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      });
      ctx.closePath();
      ctx.stroke();
    }
    ctx.strokeStyle = frame;
    ctx.lineWidth = Math.max(2, project(0, 0).s * 0.16);
    const posts: [number, number, number][] = [
      [-GOAL_HW, gy, 0],
      [-GOAL_HW, gy, h],
      [GOAL_HW, gy, h],
      [GOAL_HW, gy, 0],
    ];
    ctx.beginPath();
    posts.forEach(([x, y, z], i) => {
      const p = project(x, y, z);
      if (i === 0) ctx.moveTo(p.sx, p.sy);
      else ctx.lineTo(p.sx, p.sy);
    });
    ctx.stroke();
  }
}

function drawShadows(ctx: CanvasRenderingContext2D, project: (x: number, y: number, z?: number) => { sx: number; sy: number; s: number }, field: FieldView) {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  for (const p of field.players) {
    if (!p.on || p.red) continue;
    const s = project(p.x, p.y, 0);
    ctx.beginPath();
    ctx.ellipse(s.sx, s.sy + 2, s.s * 0.55, s.s * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const b = project(field.ball.x, field.ball.y, 0);
  ctx.beginPath();
  ctx.ellipse(b.sx, b.sy + 2, b.s * (0.28 + field.ball.z * 0.02), b.s * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  project: (x: number, y: number, z?: number) => { sx: number; sy: number; s: number },
  p: RT,
  ctrl: boolean,
  kit: string,
) {
  const foot = project(p.x, p.y, 0);
  const s = Math.max(12, Math.min(28, foot.s * 0.92));
  const nose = project(p.x - Math.sin(p.yaw) * 1.15, p.y + Math.cos(p.yaw) * 1.15, 0);
  if (ctrl) {
    ctx.strokeStyle = "#8FE388";
    ctx.lineWidth = Math.max(2, s * 0.1);
    ctx.beginPath();
    ctx.arc(foot.sx, foot.sy - s * 0.15, Math.max(13, s * 1.15), 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(foot.sx, foot.sy);
    ctx.lineTo(nose.sx, nose.sy);
    ctx.stroke();
  }
  const faceX = -Math.sin(p.yaw);
  const bx = foot.sx;
  const by = foot.sy - s * 0.72;
  const grd = ctx.createLinearGradient(bx, by - s, bx, by + s);
  grd.addColorStop(0, shade(kit, 1.25));
  grd.addColorStop(1, shade(kit, 0.72));
  ctx.fillStyle = p.role === "GK" ? "#f08a24" : grd;
  ctx.beginPath();
  ctx.ellipse(bx, by, s * 0.5, s * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(bx - s * 0.5, by - s * 0.05, s, s * 0.12);
  ctx.fillStyle = "#f0d2b4";
  ctx.beginPath();
  ctx.arc(bx + faceX * s * 0.08, by - s * 0.78, Math.max(4, s * 0.3), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4f7f2";
  ctx.font = `700 ${Math.max(9, s * 0.34)}px Oswald, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(p.num), bx, by);
  ctx.textBaseline = "alphabetic";
}

function drawBall(ctx: CanvasRenderingContext2D, project: (x: number, y: number, z?: number) => { sx: number; sy: number; s: number }, ball: Ball) {
  const p = project(ball.x, ball.y, ball.z);
  const r = Math.max(4.5, Math.min(10, p.s * 0.36));
  ctx.fillStyle = "#f7f7f5";
  ctx.beginPath();
  ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.moveTo(p.sx, p.sy - r * 0.42);
  for (let i = 1; i <= 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    ctx.lineTo(p.sx + Math.cos(a) * r * 0.42, p.sy + Math.sin(a) * r * 0.42);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath();
  ctx.arc(p.sx, p.sy, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
}

function drawOfficial(ctx: CanvasRenderingContext2D, project: (x: number, y: number, z?: number) => { sx: number; sy: number; s: number }, official: { x: number; y: number }) {
  const body = project(official.x, official.y, 0.95);
  const head = project(official.x, official.y, 1.55);
  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.ellipse(body.sx, body.sy, body.s * 0.58, body.s * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f2c94c";
  ctx.fillRect(body.sx - body.s * 0.58, body.sy - body.s * 0.2, body.s * 1.16, body.s * 0.22);
  ctx.fillStyle = "#f0d2b4";
  ctx.beginPath();
  ctx.arc(head.sx, head.sy, Math.max(4, head.s * 0.32), 0, Math.PI * 2);
  ctx.fill();
}

function drawWeather(ctx: CanvasRenderingContext2D, w: number, h: number, field: FieldView) {
  if (!field.weather || field.weather === "clear") return;
  const t = field.weatherT ?? 0;
  ctx.save();
  if (field.weather === "rain") {
    ctx.strokeStyle = "rgba(210,225,235,0.35)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const x = ((i * 97 + t * 180) % (w + 40)) - 20;
      const y = ((i * 53 + t * 320) % (h + 40)) - 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 6, y + 16);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 50; i++) {
      const x = ((i * 113 + t * 40) % w);
      const y = ((i * 71 + t * 50) % h);
      ctx.fillRect(x, y, 2.5, 2.5);
    }
  }
  ctx.restore();
}

function shade(hex: string, m: number) {
  const c = hex.replace("#", "");
  const n = parseInt(c.length === 3 ? c.split("").map((ch) => ch + ch).join("") : c, 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * m)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * m)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * m)));
  return `rgb(${r},${g},${b})`;
}
