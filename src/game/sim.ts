import { audio } from "./audio";
import {
  clubInfo,
  clubShape,
  FORMATIONS,
  GOAL_HW,
  HALF_L,
  HALF_W,
  playerAttrs,
  slotFit,
  teamById,
  type PlayerDef,
  type Role,
  type TeamDef,
} from "./data";
import { paintMatch, type FieldView } from "./draw";

export { GOAL_HW, HALF_L, HALF_W };

export type DiffId = "novice" | "amateur" | "pro" | "world" | "legend";
export type Weather = "clear" | "rain" | "snow";
export type KitId = "primary" | "inverse";

export function diffFromRatings(mine: number, theirs: number): DiffId {
  const gap = theirs - mine;
  if (gap >= 14) return "legend";
  if (gap >= 9) return "world";
  if (gap >= 5) return "pro";
  if (gap >= 1) return "amateur";
  return "novice";
}

const DIFF: Record<DiffId, { acc: number; speed: number; save: number; press: number; mate: number; tackle: number; mark: number }> = {
  novice: { acc: 0.2, speed: 0.6, save: 0.22, press: 0, mate: 0.96, tackle: 0.05, mark: 0.75 },
  amateur: { acc: 0.4, speed: 0.72, save: 0.4, press: 1, mate: 0.84, tackle: 0.32, mark: 1 },
  pro: { acc: 0.58, speed: 0.84, save: 0.56, press: 1, mate: 0.72, tackle: 0.55, mark: 1.22 },
  world: { acc: 0.78, speed: 0.94, save: 0.74, press: 2, mate: 0.58, tackle: 0.8, mark: 1.45 },
  legend: { acc: 0.98, speed: 1.04, save: 0.9, press: 2, mate: 0.42, tackle: 1.08, mark: 1.7 },
};

export type Tactic = "tiki" | "bus" | "press" | "counter" | "wing" | "direct";

const PLAN_LABEL: Record<Tactic, string> = {
  tiki: "Тики-така",
  bus: "Автобус",
  press: "Высокий прессинг",
  counter: "Контратака",
  wing: "Фланги",
  direct: "Вертикальный футбол",
};

function matchPace(v: number) {
  if (Math.abs(v - 0.82) < 0.03 || Math.abs(v - 0.68) < 0.03) return 0.68;
  if (Math.abs(v - 1.18) < 0.03 || Math.abs(v - 1.45) < 0.03) return 1.45;
  return v > 0.4 && v < 2.2 ? v : 1;
}

function saltOf(a: string, b: string) {
  let h = 0;
  const s = `${a}:${b}`;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function planFromStyle(style: string): Tactic {
  const s = style.toLowerCase();
  if (s.includes("владен") || s.includes("опорн")) return "tiki";
  if (s.includes("низк") || s.includes("своей")) return "bus";
  if (s.includes("высокий")) return "press";
  if (s.includes("контрат")) return "counter";
  if (s.includes("фланг")) return "wing";
  if (s.includes("вертикал")) return "direct";
  if (s.includes("пресс")) return "press";
  return "tiki";
}

export type RT = {
  uid: string;
  side: 0 | 1;
  name: string;
  role: Role;
  ovr: number;
  eff: number;
  speed: number;
  stamina: number;
  maxStamina: number;
  num: number;
  on: boolean;
  slot: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  yaw: number;
  cd: number;
  think: number;
  tx: number;
  ty: number;
  order: boolean;
  yellow: number;
  red: boolean;
  form: number;
  fitness: number;
  pinned: boolean;
  accuracy: number;
  hardness: number;
};

export type Ball = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  px: number;
  py: number;
  owner: string | null;
  lastUid: string | null;
  lastSide: 0 | 1 | null;
  kickAt: number;
  assistUid: string | null;
  assistAt: number;
  assistSide: 0 | 1 | null;
  fromThrow: boolean;
  offside: Set<string>;
  squash: number;
};

export type Dead = { kind: "throw" | "corner" | "goalkick" | "freekick" | "penalty"; side: 0 | 1; x: number; y: number; wait: number };

type Incident = {
  kind: "foul" | "offside";
  by: string;
  victim: string;
  inBox: boolean;
  side: 0 | 1;
  x: number;
  y: number;
  actor: RT | null;
  victimPlayer: RT | null;
};

export type Scorer = { name: string; minute: string; side: 0 | 1; own: boolean; assist: string | null };

export type TRow = {
  uid: string;
  name: string;
  role: Role;
  num: number;
  ovr: number;
  mod: number;
  stamina: number;
  on: boolean;
  slot: number;
};

export type Snap = {
  time: string;
  minute: string;
  half: 1 | 2;
  score: [number, number];
  poss: 0 | 1 | null;
  phase: "intro" | "play" | "goal" | "halftime" | "fulltime";
  paused: boolean;
  name: string;
  role: string;
  num: number;
  stam: number;
  ovr: number;
  banner: string;
  goal: { name: string; minute: string; assist: string | null; side: 0 | 1; own: boolean; seq: number } | null;
  quick: { outName: string; inName: string; outUid: string; inUid: string } | null;
  subs: number;
  formation: string;
  homeShape: string;
  awayShape: string;
  carrier: string;
  xi: TRow[];
  bench: TRow[];
  scorers: Scorer[];
  dead: string;
  setPiece: boolean;
  homeCode: string;
  awayCode: string;
  homeColor: string;
  awayColor: string;
  homeName: string;
  awayName: string;
  stadium: string;
  locked: boolean;
  referee: boolean;
  call: "" | "foul" | "offside";
  callText: string;
  refCorrect: number;
  refWrong: number;
  weather: Weather;
  kit: KitId;
  added: number;
  onField: [number, number];
  shots: [number, number];
  fouls: [number, number];
  cards: [number, number];
  possPct: [number, number];
  awayXi: TRow[];
  awayBench: TRow[];
  charge: number;
  statLine: string;
  kitPicked: boolean;
  homePlan: string;
  awayPlan: string;
  homeKit: KitId | null;
  awayKit: KitId | null;
  kitsReady: boolean;
  userSide: 0 | 1;
  passes: [number, number];
  yellows: [number, number];
  reds: [number, number];
  pens: [number, number];
  offsides: [number, number];
  homeSwatch: [string, string];
  awaySwatch: [string, string];
  critic: { mark: string; title: string; text: string };
};

type Buf = { pass: number; shoot: number; tackle: number; switch: number; quick: number };

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function hypot(x: number, y: number) {
  return Math.hypot(x, y);
}
function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return hypot(a.x - b.x, a.y - b.y);
}

export class MatchSim implements FieldView {
  players: RT[] = [];
  ball: Ball = {
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, px: 0, py: 0,
    owner: null, lastUid: null, lastSide: null, kickAt: -10,
    assistUid: null, assistAt: -10, assistSide: null, fromThrow: false,
    offside: new Set(), squash: 0,
  };
  particles: { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }[] = [];
  homeColor: string;
  awayColor: string;
  controlledId = "";
  cam = { x: 0, y: 0, shake: 0 };
  viewH = 62;
  phase: Snap["phase"] = "play";
  home: TeamDef;
  away: TeamDef;
  half: 1 | 2 = 1;
  clock = 0;
  halfLen: number;
  halfBase: number;
  score: [number, number] = [0, 0];
  scorers: Scorer[] = [];
  paused = false;
  keys = new Set<string>();
  axes = { x: 0, y: 0 };
  sprintHeld = false;
  padSprint = false;
  aim: { x: number; y: number } | null = null;
  formation = "4-3-3";
  subsUsed = 0;
  banner = "Ваш игрок в кольце — ведите мяч вверх";
  bannerT = 3.4;
  goalPopup: Snap["goal"] = null;
  popupT = 0;
  goalT = 0;
  dead: Dead | null = null;
  now = 0;
  diff: (typeof DIFF)[DiffId];
  volume = 0.8;
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  cssW = 0;
  cssH = 0;
  onHud: ((s: Snap) => void) | null = null;
  private raf = 0;
  private hudAcc = 0;
  ticks = 0;
  private buf: Buf = { pass: 0, shoot: 0, tackle: 0, switch: 0, quick: 0 };
  private kickSide: 0 | 1 = 0;
  private goalSeq = 0;
  private userSide: 0 | 1 = 0;
  speedMul = 1;
  private simming = false;
  offsideY: number | null = null;
  private offsideT = 0;
  private idle = 0;
  touch = { x: 0, y: 0 };
  lockControl = false;
  referee = false;
  refCorrect = 0;
  refWrong = 0;
  private incident: Incident | null = null;
  private incidentAge = 0;
  weather: Weather = "clear";
  kit: KitId = "primary";
  official = { x: 0, y: 0 };
  weatherT = 0;
  added = 0;
  private addedApplied = false;
  private possTime: [number, number] = [0, 0];
  private shotN: [number, number] = [0, 0];
  private foulN: [number, number] = [0, 0];
  private passN: [number, number] = [0, 0];
  private penN: [number, number] = [0, 0];
  private offN: [number, number] = [0, 0];
  private style: ["rough" | "tactical", "rough" | "tactical"] = ["tactical", "tactical"];
  private tactic: [Tactic, Tactic] = ["tiki", "tiki"];
  private shapes: [string, string] = ["4-3-3", "4-4-2"];
  kitPicked = false;
  homeKit: KitId | null = null;
  awayKit: KitId | null = null;
  kickPower = 0.8;
  chargeKind: "pass" | "shoot" | null = null;
  chargeT = 0;
  private padPass = false;
  private padShoot = false;
  private manualSwitchAt = -10;

  constructor(opts: {
    homeId: string;
    awayId: string;
    halfMin: number;
    difficulty: DiffId;
    formation?: string;
    homeRoster?: PlayerDef[];
    awayRoster?: PlayerDef[];
    speed?: number;
    lockId?: string;
    lockControl?: boolean;
    referee?: boolean;
    weather?: Weather;
    kit?: KitId;
    userSide?: 0 | 1;
    shapeSalt?: number;
  }) {
    this.home = { ...teamById(opts.homeId), roster: opts.homeRoster ?? teamById(opts.homeId).roster };
    this.away = { ...teamById(opts.awayId), roster: opts.awayRoster ?? teamById(opts.awayId).roster };
    this.homeColor = this.home.home;
    this.awayColor = this.away.away;
    this.halfLen = Math.max(30, opts.halfMin * 60);
    this.halfBase = this.halfLen;
    this.diff = DIFF[opts.difficulty];
    this.formation = opts.formation ?? "4-3-3";
    this.speedMul = matchPace(opts.speed ?? 1);
    this.lockControl = Boolean(opts.lockControl);
    this.referee = Boolean(opts.referee);
    this.weather = opts.weather ?? "clear";
    this.kit = opts.kit ?? "primary";
    this.userSide = opts.userSide === 1 ? 1 : 0;
    const salt = opts.shapeSalt ?? saltOf(opts.homeId, opts.awayId);
    if (this.referee) {
      const homeShape = clubShape(opts.homeId, salt);
      let awayShape = clubShape(opts.awayId, salt + 1);
      if (awayShape === homeShape) awayShape = clubShape(opts.awayId, salt + 2);
      this.shapes = [homeShape, awayShape];
    } else {
      const foe: 0 | 1 = this.userSide === 0 ? 1 : 0;
      const foeId = foe === 0 ? opts.homeId : opts.awayId;
      this.shapes = [clubShape(opts.homeId, salt), clubShape(opts.awayId, salt + 1)];
      this.shapes[this.userSide] = this.formation in FORMATIONS ? this.formation : "4-3-3";
      if (this.shapes[foe] === this.shapes[this.userSide]) {
        this.shapes[foe] = clubShape(foeId, salt + 2);
      }
    }
    this.buildSquad(0, this.home, this.shapes[0], this.userSide === 0 ? opts.lockId : undefined);
    this.buildSquad(1, this.away, this.shapes[1], this.userSide === 1 ? opts.lockId : undefined);
    this.applyColors();
    this.style = [this.teamStyle(0), this.teamStyle(1)];
    this.tactic = [planFromStyle(clubInfo(this.home.id).style), planFromStyle(clubInfo(this.away.id).style)];
    this.startWalk();
    audio.setMatch(true);
    audio.whistle();
  }

  private buildSquad(side: 0 | 1, team: TeamDef, formation: string, lockId?: string) {
    team.roster.forEach((def, i) => {
      const p = this.make(side, def, i < 11, i < 11 ? i : -1);
      if (lockId && def.id === lockId) p.pinned = true;
      this.players.push(p);
    });
    this.applyFormation(side, formation, false);
  }

  private make(side: 0 | 1, def: PlayerDef, on: boolean, slot: number): RT {
    return {
      uid: def.id ? `${side}:${def.id}` : `${side}-${def.num}-${def.name}`,
      side,
      name: def.name,
      role: def.pos,
      ovr: def.ovr,
      eff: def.ovr + Math.round(((def.form ?? 70) - 70) / 8),
      speed: def.speed,
      stamina: 100,
      maxStamina: def.stamina,
      num: def.num,
      on,
      slot,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      yaw: side === 0 ? 0 : Math.PI,
      cd: 0,
      think: Math.random() * 0.4,
      tx: 0,
      ty: 0,
      order: false,
      yellow: 0,
      red: false,
      form: def.form ?? 70,
      fitness: def.fitness ?? 100,
      pinned: false,
      accuracy: playerAttrs(def).accuracy,
      hardness: playerAttrs(def).hardness,
    };
  }

  start() {
    if (this.raf || typeof requestAnimationFrame === "undefined") return;
    this.bindKeys();
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      try {
        this.step(dt);
        this.paint();
      } catch (err) {
        this.banner = "Кадр сброшен — игра продолжается";
        this.bannerT = 1.2;
        console.error(err);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.unbindKeys();
    audio.setMatch(false);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    this.keys.add(e.code);
    const block = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "KeyR"];
    if (block.includes(e.code)) e.preventDefault();
    if (e.code === "Escape") {
      e.preventDefault();
      this.togglePause();
      return;
    }
    if (this.paused) return;
    if (this.referee) {
      if (e.code === "KeyF" || e.code === "Space") this.judge("foul");
      if (e.code === "KeyG") this.judge("advantage");
      if (e.code === "KeyO") this.judge("offside");
      if (e.code === "KeyY") this.judge("yellow");
      if (e.code === "KeyR") this.judge("red");
      return;
    }
    if (e.code === "Space" || e.code === "KeyJ") this.arm("pass");
    if (e.code === "KeyF" || e.code === "KeyK") this.arm("shoot");
    if (e.code === "KeyC") this.tap("tackle");
    if (e.code === "KeyQ" || e.code === "Tab") this.tap("switch");
    if (e.code === "KeyR") this.tap("quick");
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    if (e.code === "Space" || e.code === "KeyJ") this.release("pass");
    if (e.code === "KeyF" || e.code === "KeyK") this.release("shoot");
  };
  private onBlur = () => {
    if (this.forcedKeys) return;
    this.keys.clear();
    this.sprintHeld = false;
  };

  private bindKeys() {
    window.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("keyup", this.onKeyUp, true);
    window.addEventListener("blur", this.onBlur);
  }
  private unbindKeys() {
    window.removeEventListener("keydown", this.onKeyDown, true);
    window.removeEventListener("keyup", this.onKeyUp, true);
    window.removeEventListener("blur", this.onBlur);
  }

  bindCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
  }

  resize() {
    const c = this.canvas;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cssW = c.clientWidth;
    this.cssH = c.clientHeight;
    c.width = Math.max(1, Math.floor(this.cssW * dpr));
    c.height = Math.max(1, Math.floor(this.cssH * dpr));
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.fitPitch();
  }

  /** Broadcast camera: close enough to read shirts, not the whole bowl. */
  private fitPitch() {
    const portrait = this.cssH >= this.cssW;
    this.viewH = portrait ? 40 : 30;
  }

  get flipY() {
    return this.userSide === 1;
  }

  private followCam(dt: number) {
    const p = this.referee ? null : this.ctrl();
    let tx = this.ball.x * 0.62 + (p ? p.x * 0.38 : this.ball.x * 0.38);
    let ty = this.ball.y * 0.62 + (p ? p.y * 0.38 : this.ball.y * 0.38);
    tx += clamp(this.ball.vx, -14, 14) * 0.18;
    ty += clamp(this.ball.vy, -14, 14) * 0.22;
    const visY = this.viewH * 0.42;
    const visX = visY * ((this.cssW || 1) / Math.max(1, this.cssH || 1));
    tx = clamp(tx, -HALF_W + Math.min(12, visX * 0.45), HALF_W - Math.min(12, visX * 0.45));
    ty = clamp(ty, -HALF_L + visY * 0.7, HALF_L - visY * 0.7);
    const k = Math.min(1, Math.max(0.04, dt) * 4.4);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
  }

  tap(kind: keyof Buf) {
    if (this.paused || this.phase === "halftime" || this.phase === "fulltime" || this.phase === "goal" || this.phase === "intro") return;
    this.buf[kind] = 0.18;
  }

  arm(kind: "pass" | "shoot") {
    if (this.paused || this.referee || this.phase !== "play") return;
    if (this.chargeKind === kind) return;
    this.chargeKind = kind;
    this.chargeT = 0;
  }

  release(kind: "pass" | "shoot") {
    if (this.chargeKind !== kind) return;
    this.kickPower = clamp(0.48 + Math.min(this.chargeT, 0.75) / 0.75 * 0.52, 0.48, 1);
    this.chargeKind = null;
    this.chargeT = 0;
    this.tap(kind);
  }

  fire(kind: "pass" | "shoot", power: number) {
    this.chargeKind = null;
    this.chargeT = 0;
    this.kickPower = clamp(power, 0.35, 1);
    this.tap(kind);
  }

  holdSprint(v: boolean) {
    this.sprintHeld = v;
  }

  forcedKeys: string[] | null = null;

  setKeys(codes: string[]) {
    this.forcedKeys = codes.slice();
    this.keys.clear();
    for (const c of codes) this.keys.add(c);
  }

  togglePause() {
    if (this.phase === "fulltime" || this.phase === "halftime" || this.phase === "goal") return;
    this.paused = !this.paused;
    this.emit(true);
  }

  continueHalf() {
    if (this.phase !== "halftime") return;
    this.half = 2;
    this.clock = 0;
    this.halfLen = this.halfBase;
    this.addedApplied = false;
    for (const p of this.players) if (p.on) p.stamina = clamp(p.stamina + 22, 0, 100);
    this.kickoff(1);
    this.banner = "Второй тайм";
    this.bannerT = 2;
    audio.whistle();
    this.emit(true);
  }

  /** Play the rest of the match with both sides under AI, then open the final summary. */
  simulateToEnd() {
    if (this.simming || this.phase === "intro" || this.phase === "fulltime") return;
    this.simming = true;
    this.paused = false;
    audio.suppressed = true;
    try {
      let guard = 0;
      while (this.phase !== "fulltime" && guard++ < 250000) {
        if (this.phase === "halftime") this.continueHalf();
        if (this.referee && this.incident) {
          const card = Math.random();
          this.judge(this.incident.kind === "offside" ? "offside" : card < 0.14 ? "yellow" : card < 0.17 ? "red" : "foul");
        }
        this.step(1 / 60);
      }
    } finally {
      audio.suppressed = false;
      this.simming = false;
      this.paused = false;
      if (this.phase !== "fulltime") {
        this.phase = "fulltime";
        this.banner = "Финальный свисток";
        this.bannerT = 4;
      }
      this.emit(true);
    }
  }

  debug() {
    const p = this.ctrl();
    return {
      phase: this.phase,
      paused: this.paused,
      keys: [...this.keys],
      forced: this.forcedKeys,
      id: this.controlledId,
      on: p?.on ?? false,
      vx: p?.vx ?? 0,
      vy: p?.vy ?? 0,
      x: p?.x ?? 0,
      y: p?.y ?? 0,
      clock: this.clock,
      dead: this.dead?.kind ?? "",
      owner: this.ball.owner,
    };
  }
  getSpeed() {
    const p = this.ctrl();
    return p ? hypot(p.vx, p.vy) : 0;
  }

  getYaw() {
    return this.ctrl()?.yaw ?? 0;
  }

  private ctrl() {
    return this.players.find((p) => p.uid === this.controlledId) ?? null;
  }

  private sidePlayers(side: 0 | 1, on = true) {
    return this.players.filter((p) => p.side === side && p.on === on && !p.red);
  }

  attack(side: 0 | 1) {
    return side === 0 ? 1 : -1;
  }

  applyFormation(side: 0 | 1, formation: string, teleport: boolean) {
    const id = formation in FORMATIONS ? formation : "4-3-3";
    this.shapes[side] = id;
    if (side === this.userSide) this.formation = id;
    const slots = FORMATIONS[id] ?? FORMATIONS["4-3-3"]!;
    const pool = this.sidePlayers(side).slice();
    const used = new Set<string>();
    slots.forEach((slot, index) => {
      let best: RT | null = null;
      let bestScore = -999;
      for (const p of pool) {
        if (used.has(p.uid)) continue;
        const score = slotFit(p.role, slot.role) * 8 + (p.role === slot.role ? 6 : 0) + p.ovr / 50 + (p.pinned && p.role === slot.role ? 40 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = p;
        }
      }
      if (!best) return;
      used.add(best.uid);
      best.slot = index;
      best.eff = best.ovr + slotFit(best.role, slot.role);
      if (teleport) {
        const pos = this.homeOf(best);
        best.x = pos.x;
        best.y = pos.y;
        best.vx = 0;
        best.vy = 0;
      }
    });
    if (teleport && this.ball.owner) {
      const owner = this.players.find((q) => q.uid === this.ball.owner);
      if (owner?.side === side) this.stick();
    }
    this.emit(true);
  }

  private homeOf(p: RT) {
    const slots = FORMATIONS[this.shapes[p.side]] ?? FORMATIONS["4-3-3"]!;
    const slot = slots[p.slot] ?? slots[0]!;
    const atk = this.attack(p.side);
    return { x: atk * slot.x * 26, y: atk * slot.y * 42 };
  }

  private lineRole(p: RT): Role {
    const slots = FORMATIONS[this.shapes[p.side]] ?? FORMATIONS["4-3-3"]!;
    return slots[p.slot]?.role ?? p.role;
  }

  private placeTeam(side: 0 | 1) {
    for (const p of this.sidePlayers(side)) {
      const pos = this.homeOf(p);
      p.x = pos.x;
      p.y = pos.y;
      p.vx = 0;
      p.vy = 0;
      p.order = false;
    }
  }

  private teamStyle(side: 0 | 1): "rough" | "tactical" {
    const team = side === 0 ? this.home : this.away;
    const style = clubInfo(team.id).style.toLowerCase();
    if (style.includes("пресс") || style.includes("контрат")) return "rough";
    const xi = this.players.filter((p) => p.side === side && p.on);
    if (!xi.length) return "tactical";
    const hard = xi.reduce((s, p) => s + p.hardness, 0) / xi.length;
    const acc = xi.reduce((s, p) => s + p.accuracy, 0) / xi.length;
    return hard >= acc + 6 ? "rough" : "tactical";
  }

  private applyColors() {
    this.homeColor = (this.homeKit ?? "primary") === "inverse" ? this.home.away : this.home.home;
    if (this.awayKit === "primary") this.awayColor = this.away.home;
    else this.awayColor = this.away.away;
  }

  setKit(kit: KitId) {
    this.setSideKit(this.userSide, kit);
  }

  setSideKit(side: 0 | 1, kit: KitId) {
    if (this.phase !== "intro") return;
    if (side === 0) this.homeKit = kit;
    else this.awayKit = kit;
    this.kit = kit;
    this.kitPicked = this.homeKit !== null && this.awayKit !== null;
    this.applyColors();
    const who = side === this.userSide ? "Ваша форма" : "Форма соперника";
    this.banner = `${who}: ${kit === "primary" ? "цвет клуба" : "инверсия"}`;
    this.bannerT = 2.4;
    this.emit(true);
  }

  setWeather(weather: Weather) {
    if (this.phase !== "intro") return;
    this.weather = weather;
    this.emit(true);
  }

  beginPlay() {
    if (this.phase !== "intro") return;
    if (this.homeKit === null || this.awayKit === null) {
      this.banner = "Выберите форму себе и сопернику — матч ещё не начался";
      this.bannerT = 2.6;
      this.emit(true);
      return;
    }
    this.kickoff(0);
    this.banner = "Развод с центра. Мяч у хозяев";
    this.bannerT = 2.2;
    this.emit(true);
  }

  private startWalk() {
    this.phase = "intro";
    this.dead = null;
    this.placeTeam(0);
    this.placeTeam(1);
    for (const p of this.players) {
      if (!p.on) continue;
      const atk = this.attack(p.side);
      p.y = -atk * (HALF_L - 6);
      p.vx = 0;
      p.vy = 0;
    }
    this.ball.owner = null;
    this.ball.x = 0;
    this.ball.y = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.official = { x: 0, y: -8 };
    const first = this.sidePlayers(this.userSide).find((p) => p.pinned && p.role !== "GK") ?? this.sidePlayers(this.userSide).find((p) => p.role !== "GK" && p.on);
    this.controlledId = this.referee ? "" : first?.uid ?? "";
    this.banner = "Выберите свою форму и форму соперника. Пока обе не выбраны, матч не начнётся";
    this.bannerT = 6;
  }

  private walk(dt: number) {
    for (const p of this.players) {
      if (!p.on || p.red) continue;
      const home = this.homeOf(p);
      p.x += (home.x - p.x) * Math.min(1, dt * 0.8);
      p.y += (home.y - p.y) * Math.min(1, dt * 0.8);
      p.yaw = this.attack(p.side) > 0 ? 0 : Math.PI;
    }
    this.official.y += (0 - this.official.y) * Math.min(1, dt * 0.6);
  }

  kickoff(side: 0 | 1) {
    this.phase = "play";
    this.dead = null;
    this.kickSide = side;
    this.placeTeam(0);
    this.placeTeam(1);
    const pinned = this.sidePlayers(this.userSide).find((p) => p.pinned && p.role !== "GK");
    const takers = this.sidePlayers(side).filter((p) => p.role === "CM" || p.role === "ST" || p.role === "CAM" || p.role === "LW" || p.role === "RW");
    let taker = takers.sort((a, b) => b.eff - a.eff)[0] ?? this.sidePlayers(side).find((p) => p.role !== "GK") ?? this.sidePlayers(side)[0]!;
    if (pinned && side === this.userSide) taker = pinned;
    const atk = this.attack(side);
    taker.x = 0;
    taker.y = -atk * 0.85;
    taker.yaw = atk > 0 ? 0 : Math.PI;
    this.ball.owner = taker.uid;
    this.ball.x = 0;
    this.ball.y = 0;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.lastUid = taker.uid;
    this.ball.lastSide = side;
    this.ball.kickAt = this.now;
    this.ball.fromThrow = false;
    this.ball.offside.clear();
    this.controlledId = pinned?.uid ?? (side === this.userSide ? taker.uid : this.nearestOutfield(this.userSide, 0, 0).uid);
    if (this.lockControl && pinned) this.controlledId = pinned.uid;
    if (this.referee) this.controlledId = "";
    if (this.ctrl()?.role === "GK") this.controlledId = this.nearestOutfield(this.userSide, 0, 0).uid;
    this.stick();
  }

  private nearestMate(side: 0 | 1, x: number, y: number) {
    return this.sidePlayers(side).slice().sort((a, b) => hypot(a.x - x, a.y - y) - hypot(b.x - x, b.y - y))[0]!;
  }

  private nearestOutfield(side: 0 | 1, x: number, y: number) {
    const list = this.sidePlayers(side).filter((p) => p.on && !p.red && p.role !== "GK");
    return list.sort((a, b) => hypot(a.x - x, a.y - y) - hypot(b.x - x, b.y - y))[0] ?? this.nearestMate(side, x, y);
  }

  substitute(outUid: string, inUid: string): string | null {
    const out = this.players.find((p) => p.uid === outUid);
    const inn = this.players.find((p) => p.uid === inUid);
    if (!out || !inn || out.side !== this.userSide || inn.side !== this.userSide) return "Нельзя";
    if (!out.on || inn.on) return "Нельзя";
    if (this.subsUsed >= 5) return "Лимит замен";
    if (out.role === "GK" || inn.role === "GK") {
      if (out.role !== "GK" || inn.role !== "GK") return "Вратарь только на вратаря";
    } else if (!this.roleOk(out.role, inn.role)) return "Позиция не совпадает";
    inn.on = true;
    inn.slot = out.slot;
    inn.x = out.x;
    inn.y = out.y;
    inn.vx = 0;
    inn.vy = 0;
    inn.stamina = Math.min(100, inn.maxStamina);
    out.on = false;
    out.slot = -1;
    out.vx = 0;
    out.vy = 0;
    this.subsUsed++;
    if (this.controlledId === out.uid) this.controlledId = inn.uid;
    this.applyFormation(this.userSide, this.formation, false);
    this.banner = `${inn.name} вместо ${out.name}`;
    this.bannerT = 2.4;
    this.emit(true);
    return null;
  }

  private roleOk(outRole: Role, inRole: Role) {
    if (outRole === "GK" || inRole === "GK") return outRole === inRole;
    const rank = (r: Role) => (r === "ST" || r === "LW" || r === "RW" ? 3 : r === "CAM" ? 2 : r === "CB" || r === "LB" || r === "RB" ? 0 : 1);
    return Math.abs(rank(outRole) - rank(inRole)) <= 2;
  }

  private recommend() {
    const tired = this.sidePlayers(this.userSide)
      .filter((p) => p.role !== "GK" && p.stamina < 42)
      .sort((a, b) => a.stamina - b.stamina);
    const bench = this.players.filter((p) => p.side === this.userSide && !p.on && !p.red).sort((a, b) => b.stamina - a.stamina);
    for (const out of tired) {
      for (const inn of bench) {
        if (this.roleOk(out.role, inn.role) && this.subsUsed < 5) {
          return { outName: out.name, inName: inn.name, outUid: out.uid, inUid: inn.uid };
        }
      }
    }
    return null;
  }

  step(realDt: number) {
    const dt = clamp(realDt, 0, 0.05);
    this.now += dt;
    this.ticks++;
    if (this.forcedKeys) {
      this.keys.clear();
      for (const c of this.forcedKeys) this.keys.add(c);
    }
    this.pollPad();
    (Object.keys(this.buf) as (keyof Buf)[]).forEach((k) => {
      this.buf[k] = Math.max(0, this.buf[k] - dt);
    });
    if (this.popupT > 0 && !this.paused) this.popupT -= dt;
    if (this.bannerT > 0) this.bannerT -= dt;
    if (this.offsideT > 0) {
      this.offsideT -= dt;
      if (this.offsideT <= 0) this.offsideY = null;
    }
    this.ball.squash = Math.max(0, this.ball.squash - dt * 3);
    if (this.cam.shake > 0) this.cam.shake = Math.max(0, this.cam.shake - dt * 2.4);
    try { if (!this.simming) audio.update(dt, this.volume, this.paused); } catch { /* звук не должен останавливать кадр */ }

    if (this.paused) {
      this.emit(false);
      return;
    }
    if (this.chargeKind && this.phase === "play") this.chargeT = Math.min(0.75, this.chargeT + dt);
    this.weatherT += dt;
    if (!this.simming) this.followCam(dt);
    if (this.phase === "intro") {
      this.walk(dt);
      this.emit(false);
      return;
    }
    if (this.phase === "goal") {
      this.goalT -= dt;
      this.burstStep(dt);
      if (this.goalT <= 0) this.kickoff(this.kickSide);
      this.emit(false);
      return;
    }
    if (this.phase === "halftime" || this.phase === "fulltime") {
      this.emit(false);
      return;
    }
    if (this.referee && this.incident) {
      this.incidentAge += dt;
      if (this.incidentAge > 4.5) {
        this.incidentAge = 0;
        this.judge("advantage");
      }
      this.emit(false);
      return;
    }
    this.incidentAge = 0;

    this.clock += dt;
    if (this.ball.lastSide != null) this.possTime[this.ball.lastSide] += dt;
    if (!this.dead && this.clock >= this.halfLen) {
      if (this.half === 2 && !this.addedApplied) {
        this.addedApplied = true;
        this.added = Math.floor(Math.random() * 6);
        if (this.added > 0) {
          this.halfLen += this.halfBase * (this.added / 45);
          this.banner = `Судья добавил ${this.added} мин`;
          this.bannerT = 2.4;
          this.emit(true);
          return;
        }
      }
      if (this.half === 1) {
        this.phase = "halftime";
        audio.whistle();
        this.banner = "Перерыв";
        this.bannerT = 3;
      } else {
        this.phase = "fulltime";
        audio.whistle();
        this.banner = "Финальный свисток";
        this.bannerT = 4;
      }
      this.emit(true);
      return;
    }

    this.updateHumans(dt);
    this.updateAI(dt);
    this.keeperTake();
    this.integrate(dt);
    this.keepGoalersInBox();
    this.separate(dt);
    this.ballPhysics(dt);
    this.deflect();
    this.carryGoal();
    this.lines();
    const ox = clamp(this.ball.x * 0.65 + 8, -HALF_W + 4, HALF_W - 4);
    const oy = clamp(this.ball.y * 0.35, -HALF_L + 8, HALF_L - 8);
    this.official.x += (ox - this.official.x) * 0.08;
    this.official.y += (oy - this.official.y) * 0.08;
    this.recover(dt);
    this.emit(false);
  }

  private padBits = new Array<boolean>(16).fill(false);

  private pollPad() {
    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
    if (!pads) return;
    const pad = [...pads].find((g) => g && g.connected);
    if (!pad) return;
    const dz = 0.18;
    let x = pad.axes[0] ?? 0;
    let y = -(pad.axes[1] ?? 0);
    const m = Math.hypot(x, y);
    if (m < dz) {
      x = 0;
      y = 0;
    } else {
      const s = ((m - dz) / (1 - dz)) / m;
      x *= s;
      y *= s;
    }
    if (Math.hypot(this.touch.x, this.touch.y) < 0.2) {
      this.axes.x = x;
      this.axes.y = y;
    }
    const down = (i: number) => (pad.buttons[i]?.pressed ?? false) || (pad.buttons[i]?.value ?? 0) > 0.55;
    const edge = (i: number) => {
      const now = down(i);
      const was = this.padBits[i] ?? false;
      this.padBits[i] = now;
      return now && !was;
    };
    if (edge(9)) this.togglePause();
    if (this.referee) {
      if (edge(0)) this.judge("foul");
      if (edge(1)) this.judge("advantage");
      if (edge(2)) this.judge("offside");
      if (edge(3)) this.judge("yellow");
      if (edge(5)) this.judge("red");
      return;
    }
    const passNow = down(0);
    const shootNow = down(1);
    if (passNow && !this.padPass) this.arm("pass");
    if (!passNow && this.padPass) this.release("pass");
    if (shootNow && !this.padShoot) this.arm("shoot");
    if (!shootNow && this.padShoot) this.release("shoot");
    this.padPass = passNow;
    this.padShoot = shootNow;
    if (edge(2)) this.tap("tackle");
    if (edge(3) || edge(4)) this.tap("switch");
    if (edge(13)) this.tap("quick");
    this.padSprint = (pad.buttons[7]?.value ?? 0) > 0.45 || down(5);
  }

  private moveAxes() {
    let mx = (this.keys.has("KeyD") || this.keys.has("ArrowRight") ? 1 : 0) - (this.keys.has("KeyA") || this.keys.has("ArrowLeft") ? 1 : 0);
    let my = (this.keys.has("KeyW") || this.keys.has("ArrowUp") ? 1 : 0) - (this.keys.has("KeyS") || this.keys.has("ArrowDown") ? 1 : 0);
    if (mx === 0 && my === 0) {
      const stick = Math.hypot(this.touch.x, this.touch.y) > 0.12 ? this.touch : this.axes;
      mx = stick.x;
      my = stick.y;
    }
    const mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
    }
    if (this.userSide === 1) my = -my;
    return { mx, my, mag: Math.min(1, mag) };
  }

  private updateHumans(dt: number) {
    if (this.referee || this.simming) return;
    if (this.lockControl) {
      const pinned = this.players.find((q) => q.pinned && q.role !== "GK");
      if (!pinned) {
        if (this.ctrl()?.role === "GK") this.controlledId = this.nearestOutfield(this.userSide, this.ball.x, this.ball.y).uid;
      } else {
        this.controlledId = pinned.uid;
        if (!pinned.on || pinned.red) return;
      }
    }
    const p = this.ctrl();
    if (!p || !p.on || p.red || p.role === "GK") {
      if (this.lockControl && this.players.some((q) => q.pinned && q.role !== "GK")) return;
      const mate = this.nearestOutfield(this.userSide, this.ball.x, this.ball.y);
      this.controlledId = mate.uid;
      return;
    }
    const { mx, my, mag } = this.moveAxes();
    const live = this.live(p);
    const sprint = (this.sprintHeld || this.padSprint || this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")) && p.stamina > 8 && mag > 0.15;
    const fit = 0.78 + 0.22 * (p.fitness / 100);
    const tempo = this.speedMul < 0.85 ? 0.72 : this.speedMul > 1.15 ? 1.22 : 1;
    const max = (4.5 + (live.speed / 100) * 5.1) * tempo * (sprint ? 1.28 : 1) * (0.62 + 0.38 * (p.stamina / 100)) * (this.ball.owner === p.uid ? 0.92 : 1) * fit;
    const tvx = mx * max;
    const tvy = my * max;
    const k = Math.min(1, dt * 12);
    p.vx += (tvx - p.vx) * k;
    p.vy += (tvy - p.vy) * k;
    if (mag > 0.18) {
      const target = Math.atan2(-mx, my);
      const d = Math.atan2(Math.sin(target - p.yaw), Math.cos(target - p.yaw));
      p.yaw += d * Math.min(1, dt * 14);
    }
    if (mag > 0.12) this.idle = 0;
    else this.idle += dt;
    if (this.idle > 2.2 && this.bannerT <= 0) {
      this.banner = "WASD или джойстик слева — кольцо на вашем игроке";
      this.bannerT = 2.4;
      this.idle = 0;
    }
    if (sprint) p.stamina = Math.max(0, p.stamina - 15 * dt);
    if (this.buf.switch > 0) {
      this.buf.switch = 0;
      this.switchPlayer();
    }
    if (this.buf.quick > 0 && this.dead) {
      this.buf.quick = 0;
      const rec = this.recommend();
      if (rec) this.substitute(rec.outUid, rec.inUid);
    }
    if (this.buf.pass > 0 && this.ball.owner === p.uid) {
      this.buf.pass = 0;
      this.pass(p);
    }
    if (this.buf.shoot > 0 && this.ball.owner === p.uid) {
      this.buf.shoot = 0;
      this.shoot(p);
    }
    if (this.buf.tackle > 0) {
      this.buf.tackle = 0;
      this.userTackle(p);
    }
    const owner = this.players.find((q) => q.uid === this.ball.owner);
    const canAuto = this.now - this.manualSwitchAt > 0.45;
    if (canAuto && owner && owner.side === this.userSide && owner.on && !owner.red && owner.uid !== p.uid && (owner.pinned || (!this.lockControl && owner.role !== "GK" && this.now - this.ball.kickAt > 0.16))) {
      this.controlledId = owner.uid;
    }
  }

  private switchPlayer() {
    if (this.lockControl || this.referee) return;
    this.manualSwitchAt = this.now;
    const mates = this.sidePlayers(this.userSide).filter((m) => m.on && !m.red && m.role !== "GK").slice().sort((a, b) => dist(a, this.ball) - dist(b, this.ball));
    const idx = Math.max(0, mates.findIndex((m) => m.uid === this.controlledId));
    const next = mates[(idx + 1) % mates.length];
    if (next) this.controlledId = next.uid;
  }

  private forward(p: RT) {
    return { x: -Math.sin(p.yaw), y: Math.cos(p.yaw) };
  }

  private live(p: RT) {
    const form = 0.84 + (p.form / 100) * 0.28;
    const fit = 0.82 + (p.fitness / 100) * 0.18;
    return {
      speed: p.speed * form * fit,
      accuracy: clamp(p.accuracy * form, 42, 97),
      hardness: clamp(p.hardness * (0.9 + p.fitness / 500), 40, 97),
    };
  }

  private pass(p: RT) {
    const aim = this.aim && dist(p, this.aim) > 3 ? this.aim : null;
    const facing = this.forward(p);
    const live = this.live(p);
    const powerMul = p.uid === this.controlledId ? this.kickPower : 0.78;
    const maxD = 18 + powerMul * 30;
    let best: RT | null = null;
    let bestScore = aim ? 8 : 0.2;
    for (const m of this.sidePlayers(p.side)) {
      if (m.uid === p.uid) continue;
      const d = dist(p, m);
      if (d < 3.5 || d > maxD) continue;
      if (aim) {
        const ad = dist(m, aim);
        if (ad < bestScore) {
          bestScore = ad;
          best = m;
        }
      } else {
        const dx = m.x - p.x;
        const dy = m.y - p.y;
        const dot = (dx * facing.x + dy * facing.y) / d;
        if (dot < 0.12) continue;
        const score = dot * 1.6 + this.attack(p.side) * dy * 0.03 + (d > 7 && d < 24 ? 0.4 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = m;
        }
      }
    }
    const err = (1 - live.accuracy / 100) * (0.55 + (1 - powerMul) * 0.45) * this.passErr(p);
    const jitter = () => (Math.random() - 0.5) * err;
    if (best) {
      const flight = 0.26 + (1 - powerMul) * 0.2;
      const tx = best.x + best.vx * flight;
      const ty = best.y + best.vy * flight;
      const gap = hypot(tx - p.x, ty - p.y);
      const pace = this.passPace(gap, powerMul);
      this.kick(p, tx - p.x + jitter() * 4, ty - p.y + jitter() * 4, pace, 0.12 + powerMul * 0.22, false);
      this.banner = `Пас: ${best.name}`;
      this.bannerT = 1.3;
    } else {
      const dirx = aim ? aim.x - p.x : facing.x;
      const diry = aim ? aim.y - p.y : facing.y;
      this.kick(p, dirx + jitter() * 3, diry + jitter() * 3, this.passPace(14 + powerMul * 10, powerMul), 0.1 + powerMul * 0.16, false);
    }
    this.aim = null;
  }

  private passPace(gap: number, powerMul: number) {
    const base = 12 + gap * 0.92;
    return clamp(base * (0.78 + powerMul * 0.48), 15, 48);
  }

  private shoot(p: RT) {
    this.shotN[p.side] += 1;
    const atk = this.attack(p.side);
    const gy = atk * HALF_L;
    const live = this.live(p);
    const user = p.uid === this.controlledId && !this.simming;
    const rival = this.referee || p.side !== this.userSide;
    const powerMul = user ? this.kickPower : rival ? 0.58 + this.diff.acc * 0.42 : 0.72;
    const aimX = this.aim ? clamp(this.aim.x, -3.3, 3.3) : clamp(-Math.sin(p.yaw) * 2.2, -3.1, 3.1);
    let acc = clamp(live.accuracy / 100 - Math.max(0, powerMul - 0.82) * 0.22, 0.34, 0.97);
    if (!user && rival) acc = clamp(0.28 + this.diff.acc * 0.5 + acc * 0.22, 0.32, 0.9);
    else if (!user) acc = clamp(0.42 + acc * 0.4, 0.4, 0.88);
    const dx = aimX - p.x;
    const dy = gy - p.y;
    const ang = Math.atan2(dx, dy) + (Math.random() - 0.5) * (1 - acc) * 0.85;
    const power = clamp((16 + (live.hardness / 100) * 12) * (0.58 + powerMul * 0.55), 12, 34);
    const zLift = dist(p, { x: 0, y: gy });
    const paced = !user && zLift > 18 ? clamp(Math.max(power, 12 + zLift * 0.9), 12, 38) : power;
    let z = zLift > 22 ? 2.2 + powerMul * 2.4 : 0.7 + powerMul * 0.8;
    if (!user && zLift > 12 && zLift < 36) z = clamp(5.2 + (zLift - 16) * 0.06, 4.8, 6.6);
    this.kick(p, Math.sin(ang), Math.cos(ang), paced, z, true);
    this.banner = `Удар! ${p.name}`;
    this.bannerT = 1.4;
    this.aim = null;
  }

  private kick(p: RT, dx: number, dy: number, power: number, z: number, shot: boolean) {
    const len = hypot(dx, dy) || 1;
    const thrown = this.dead?.kind === "throw";
    this.ball.owner = null;
    this.ball.lastUid = p.uid;
    this.ball.lastSide = p.side;
    this.ball.kickAt = this.now;
    this.ball.fromThrow = thrown;
    if (!shot && !thrown) {
      this.ball.assistUid = p.uid;
      this.ball.assistAt = this.now;
      this.ball.assistSide = p.side;
      this.markOffside(p);
    } else this.ball.offside.clear();
    this.ball.vx = (dx / len) * power;
    this.ball.vy = (dy / len) * power;
    this.ball.vz = z;
    this.ball.z = 0.2;
    this.dead = null;
    if (!shot) this.passN[p.side] += 1;
    audio.kick();
  }

  private markOffside(passer: RT) {
    this.ball.offside.clear();
    const atk = this.attack(passer.side);
    const defs = this.sidePlayers((1 - passer.side) as 0 | 1)
      .slice()
      .sort((a, b) => atk * b.y - atk * a.y);
    const line = defs[1]?.y ?? defs[0]?.y ?? atk * HALF_L;
    for (const m of this.sidePlayers(passer.side)) {
      if (m.uid === passer.uid || m.role === "GK") continue;
      const aheadBall = atk * m.y > atk * this.ball.y + 0.4;
      const aheadLine = atk * m.y > atk * line;
      const inHalf = atk * m.y > 0;
      if (aheadBall && aheadLine && inHalf) this.ball.offside.add(m.uid);
    }
    if (this.ball.offside.size) {
      this.offsideY = line;
      this.offsideT = 1.4;
    }
  }

  private userTackle(p: RT) {
    const foe = this.players.find((q) => q.side !== p.side && q.on && this.ball.owner === q.uid);
    if (!foe || foe.role === "GK" || dist(p, foe) > 1.8) return;
    p.cd = 0.7;
    const mine = this.live(p);
    const theirs = this.live(foe);
    const won = dist(p, this.ball) < 1.5 && Math.random() < this.userTackleChance(mine.hardness, theirs.hardness);
    if (won) {
      this.popBall(foe, p);
      this.banner = `Отбор: ${p.name}`;
      this.bannerT = 1.2;
    } else if (dist(p, this.ball) > 1.05) {
      this.foul(p, foe);
    }
  }

  private popBall(from: RT, to: RT | null) {
    if (from.role === "GK") return;
    this.ball.kickAt = this.now;
    this.ball.offside.clear();
    this.ball.fromThrow = false;
    if (to && to.on && !to.red && to.role !== "GK") {
      this.ball.owner = to.uid;
      this.ball.lastUid = to.uid;
      this.ball.lastSide = to.side;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.ball.vz = 0;
      this.stick();
      return;
    }
    this.ball.owner = null;
    this.ball.vx = (Math.random() - 0.5) * 8;
    this.ball.vy = (Math.random() - 0.5) * 8;
    this.ball.vz = 1.2;
    this.ball.lastUid = from.uid;
    this.ball.lastSide = from.side;
  }

  judge(kind: "foul" | "advantage" | "offside" | "yellow" | "red") {
    if (!this.referee || this.paused || this.phase !== "play") return;
    const inc = this.incident;
    if (!inc) {
      if (kind === "advantage") {
        this.banner = "Игра продолжается";
      } else {
        this.refWrong++;
        this.banner = "Лишний свисток";
        audio.whistle();
      }
      this.bannerT = 1.4;
      this.emit(true);
      return;
    }
    const card = kind === "yellow" || kind === "red" ? kind : "none";
    if (inc.kind === "foul" && (kind === "foul" || kind === "yellow" || kind === "red") && inc.actor && inc.victimPlayer) {
      this.refCorrect++;
      this.incident = null;
      this.applyFoul(inc.actor, inc.victimPlayer, card);
      return;
    }
    if (inc.kind === "offside" && kind === "offside" && inc.actor) {
      this.refCorrect++;
      this.incident = null;
      this.applyOffside(inc.actor);
      return;
    }
    if (kind === "advantage") {
      this.refWrong++;
      this.banner = inc.kind === "offside" ? "Офсайд пропущен" : "Фол пропущен";
      this.bannerT = 1.5;
      if (inc.kind === "offside" && inc.actor) {
        this.ball.offside.delete(inc.actor.uid);
        this.ball.owner = inc.actor.uid;
        this.ball.lastUid = inc.actor.uid;
        this.ball.lastSide = inc.actor.side;
      }
      this.incident = null;
      this.emit(true);
      return;
    }
    this.refWrong++;
    this.banner = "Неверное решение";
    this.bannerT = 1.5;
    if (inc.kind === "offside" && inc.actor) {
      this.ball.offside.delete(inc.actor.uid);
      this.ball.owner = inc.actor.uid;
    }
    this.incident = null;
    this.emit(true);
  }

  private foul(by: RT, victim: RT) {
    const atk = this.attack(victim.side);
    const inBox = Math.abs(by.x) < 20 && atk * by.y > atk * (HALF_L - 16.5) && atk * by.y < atk * HALF_L;
    if (this.referee) {
      if (this.incident) return;
      this.incident = { kind: "foul", by: by.name, victim: victim.name, inBox, side: victim.side, x: by.x, y: by.y, actor: by, victimPlayer: victim };
      this.banner = inBox ? "Момент в штрафной" : "Стык. Ваше решение";
      this.bannerT = 2;
      return;
    }
    this.applyFoul(by, victim, "none");
  }

  private applyFoul(by: RT, victim: RT, card: "none" | "yellow" | "red") {
    const atk = this.attack(victim.side);
    const inBox = Math.abs(by.x) < 20 && atk * by.y > atk * (HALF_L - 16.5) && atk * by.y < atk * HALF_L;
    this.dead = {
      kind: inBox ? "penalty" : "freekick",
      side: victim.side,
      x: inBox ? 0 : clamp(by.x, -HALF_W + 1, HALF_W - 1),
      y: inBox ? atk * 41.5 : clamp(by.y, -HALF_L + 2, HALF_L - 2),
      wait: 0.45,
    };
    this.giveDead(victim.side);
    this.foulN[by.side] += 1;
    if (inBox) this.penN[victim.side] += 1;
    const rough = by.hardness >= 74 || this.style[by.side] === "rough";
    const directRed = card === "red" || (!this.referee && card === "none" && rough && Math.random() < 0.035);
    const book = directRed || card === "yellow" || (!this.referee && card === "none" && Math.random() < (rough ? 0.36 : 0.18));
    if (book) {
      by.yellow += directRed ? 2 : 1;
      if (by.yellow >= 2) {
        by.red = true;
        by.on = false;
        by.vx = 0;
        by.vy = 0;
        this.banner = `Красная! ${by.name} удалён`;
      } else this.banner = `Фол. Жёлтая ${by.name}`;
    } else this.banner = inBox ? "Пенальти" : "Штрафной";
    this.bannerT = 2;
    audio.whistle();
    this.emit(true);
  }

  private giveDead(side: 0 | 1) {
    if (!this.dead) return;
    const taker = this.dead.kind === "goalkick"
      ? this.sidePlayers(side).find((p) => p.role === "GK" && p.on && !p.red) ?? this.nearestMate(side, this.dead.x, this.dead.y)
      : this.nearestOutfield(side, this.dead.x, this.dead.y);
    taker.x = this.dead.x;
    taker.y = this.dead.y - this.attack(side) * 0.7;
    this.ball.owner = taker.uid;
    this.ball.x = this.dead.x;
    this.ball.y = this.dead.y;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.fromThrow = this.dead.kind === "throw";
    this.ball.offside.clear();
    this.ball.lastSide = side;
    if (side === this.userSide && !this.lockControl && !this.referee && taker.role !== "GK") this.controlledId = taker.uid;
  }

  private updateAI(dt: number) {
    const owner = this.players.find((p) => p.uid === this.ball.owner) ?? null;
    const duty: Record<string, "hold" | "press" | "support"> = {};
    for (const side of [0, 1] as const) {
      const list = this.sidePlayers(side)
        .filter((q) => q.on && !q.red && q.role !== "GK" && (this.simming || q.uid !== this.controlledId))
        .sort((a, b) => dist(a, this.ball) - dist(b, this.ball));
      const oppHas = !owner || owner.side !== side;
      if (oppHas && list[0]) duty[list[0].uid] = "press";
      if (owner?.side === side) {
        for (const q of list.filter((m) => m.uid !== owner.uid).slice(0, 2)) duty[q.uid] = "support";
      }
    }
    for (const p of this.players) {
      if (!p.on || p.red || (!this.simming && p.uid === this.controlledId)) continue;
      p.cd = Math.max(0, p.cd - dt);
      p.think -= dt;
      const job = duty[p.uid] ?? "hold";
      const spot = p.role === "GK" ? this.keeperSpot(p) : this.zoneTarget(p, this.shapePoint(p), job, owner);
      let tx = spot.x;
      let ty = spot.y;
      if (owner?.uid === p.uid) {
        if (p.think <= 0) {
          const tempo = this.speedMul;
          const calm = tempo < 0.85 ? 1.18 : tempo > 1.15 ? 0.8 : 1;
          const rivalMind = this.referee || p.side !== this.userSide;
          const iq = rivalMind ? 0.96 + this.diff.acc * 0.28 : 1.05;
          p.think = (p.role === "GK" ? 0.32 : this.tactic[p.side] === "tiki" ? 0.4 : 0.28) * calm / iq;
          this.aiOnBall(p);
        }
        if (this.ball.owner === p.uid && p.order && p.role !== "GK") {
          tx = p.tx;
          ty = p.ty;
        }
      } else p.order = false;
      const dx = tx - p.x;
      const dy = ty - p.y;
      const d = hypot(dx, dy) || 1;
      const live = this.live(p);
      const rival = this.referee || p.side !== this.userSide;
      const carrying = owner?.uid === p.uid;
      const diffPace = rival ? 0.86 + this.diff.speed * 0.16 : 0.96;
      const jobBoost = job === "press" ? 1.1 : job === "support" ? 1.05 : 1;
      const pace = (4.35 + (live.speed / 100) * 2.7) * diffPace * this.paceScale(p) * (carrying ? 0.94 : 0.9) * jobBoost * (0.78 + 0.22 * (p.stamina / 100)) * (0.9 + 0.1 * (p.fitness / 100));
      const spd = d < 0.65 ? pace * d : pace;
      const k = Math.min(1, dt * (carrying ? 7 : 6.2));
      p.vx += ((dx / d) * spd - p.vx) * k;
      p.vy += ((dy / d) * spd - p.vy) * k;
      if (hypot(p.vx, p.vy) > 0.25) {
        const target = Math.atan2(-p.vx, p.vy);
        const diff = Math.atan2(Math.sin(target - p.yaw), Math.cos(target - p.yaw));
        p.yaw += diff * Math.min(1, dt * 8);
      }
      if (carrying && p.role !== "GK") p.stamina = Math.max(0, p.stamina - 2.2 * dt);
      const mayTackle =
        owner &&
        owner.side !== p.side &&
        owner.role !== "GK" &&
        p.role !== "GK" &&
        p.cd <= 0;
      const arm = job === "press" ? 2.2 : 1.9;
      if (mayTackle && owner && dist(p, owner) < arm) {
        const tempo = this.speedMul;
        p.cd = tempo > 1.15 ? 1.28 : tempo < 0.85 ? 1.72 : 1.48;
        const rough = this.style[p.side] === "rough" || this.tactic[p.side] === "press";
        const mine = this.live(p);
        const hold = this.live(owner);
        const skill = rival ? clamp(0.4 + this.diff.tackle * 0.42, 0.4, 0.92) : 0.58;
        const win = clamp(0.22 + skill * 0.38 + (mine.hardness - hold.hardness) / 420, 0.18, 0.66);
        const foulP = clamp(0.055 + (1 - skill) * 0.12 + (rough ? 0.04 : 0), 0.05, 0.22);
        if (Math.random() < win) this.popBall(owner, p);
        else if (Math.random() < foulP) this.foul(p, owner);
      }
    }
    if (this.dead && this.dead.wait > 0) {
      this.dead.wait -= dt;
      if (this.dead.wait <= 0 && this.ball.owner && (this.simming || this.referee || this.ball.lastSide !== this.userSide)) {
        const taker = this.players.find((p) => p.uid === this.ball.owner);
        if (taker) {
          if (this.dead.kind === "penalty" || dist(taker, { x: 0, y: this.attack(taker.side) * HALF_L }) < 22) this.shoot(taker);
          else this.pass(taker);
        }
      }
    }
  }

  private paceScale(p: RT) {
    const rate = clamp(p.speed / 100, 0.45, 1);
    if (this.speedMul < 0.85) return 0.8 + rate * 0.05;
    if (this.speedMul > 1.15) return 1.12 + rate * 0.07;
    return 0.94 + rate * 0.06;
  }

  private passErr(p: RT) {
    if (p.uid === this.controlledId && !this.simming) return this.speedMul > 1.15 ? 1.25 : 1;
    const tempo = this.speedMul < 0.85 ? 0.94 : this.speedMul > 1.15 ? 1.1 : 1;
    const iq = this.referee || p.side !== this.userSide ? 1.32 - this.diff.acc * 0.68 : 0.9;
    return tempo * iq;
  }

  private userTackleChance(mine: number, theirs: number) {
    const ease = this.diff.tackle < 0.2 ? 1.55 : this.diff.tackle < 0.5 ? 1.05 : this.diff.tackle < 0.85 ? 0.62 : 0.34;
    return clamp((0.22 + mine / 150 - theirs / 260) * ease, 0.08, 0.78);
  }

  /** One player closes the ball down. Two teammates offer a pass. Everyone else keeps the block. */
  private zoneTarget(p: RT, spot: { x: number; y: number }, job: "hold" | "press" | "support", owner: RT | null) {
    if (p.role === "GK") return spot;
    const edgeX = HALF_W - 1.8;
    const edgeY = HALF_L - 1.8;
    if (job === "press") {
      const rival = this.referee || p.side !== this.userSide;
      const stop = rival ? clamp(1.08 - this.diff.tackle * 0.2, 0.82, 1.08) : 0.98;
      const mark = owner && owner.side !== p.side ? owner : null;
      const qx = mark ? mark.x : this.ball.x;
      const qy = mark ? mark.y : this.ball.y;
      const crowding = this.sidePlayers(p.side).filter((q) => q.uid !== p.uid && q.on && q.role !== "GK" && hypot(q.x - qx, q.y - qy) < 8.2).length;
      if (crowding >= 2) return spot;
      const dx = qx - p.x;
      const dy = qy - p.y;
      const d = hypot(dx, dy) || 1;
      return {
        x: clamp(qx - (dx / d) * stop, -edgeX, edgeX),
        y: clamp(qy - (dy / d) * stop, -edgeY, edgeY),
      };
    }
    if (job === "support") {
      const atk = this.attack(p.side);
      const flank = Math.sign(spot.x || (p.slot % 2 ? 1 : -1)) || 1;
      const wantX = clamp(this.ball.x + flank * 6.5, -edgeX, edgeX);
      const wantY = clamp(this.ball.y + atk * 5.5, -edgeY, edgeY);
      const step = 6.5;
      return this.keepOnside(p, 
        clamp(spot.x + clamp(wantX - spot.x, -step, step), -edgeX, edgeX),
        clamp(spot.y + clamp(wantY - spot.y, -step, step), -edgeY, edgeY),
      );
    }
    const atk = this.attack(p.side);
    const line = this.lineRole(p);
    const wobx = Math.sin(this.now * 0.8 + p.slot * 1.7) * 0.42;
    let y = spot.y + Math.cos(this.now * 0.65 + p.slot) * 0.22;
    const attacking = owner?.side === p.side;
    if (attacking && (line === "ST" || line === "LW" || line === "RW" || line === "CAM")) {
      const run = Math.sin(this.now * 0.42 + p.slot * 0.9);
      if (run > 0.9) y += atk * 2.2;
    }
    return this.keepOnside(p, clamp(spot.x + wobx, -edgeX, edgeX), clamp(y, -edgeY, edgeY));
  }

  private keepOnside(p: RT, x: number, y: number) {
    const atk = this.attack(p.side);
    const defs = this.sidePlayers((1 - p.side) as 0 | 1)
      .filter((q) => q.on && !q.red && q.role !== "GK")
      .slice()
      .sort((a, b) => atk * b.y - atk * a.y);
    const line = defs[1]?.y ?? defs[0]?.y;
    if (line == null) return { x, y };
    const run = Math.sin(this.now * 0.48 + p.slot * 1.15) > 0.88;
    if (!run && atk * y > atk * line - 0.5 && atk * y > 0.5) {
      const nextY = line - atk * 1.2;
      const nextD = hypot(x - this.ball.x, nextY - this.ball.y);
      const had = hypot(p.x - this.ball.x, p.y - this.ball.y);
      if (!(nextD < 8 && had > 8)) y = nextY;
    }
    const bd = hypot(x - this.ball.x, y - this.ball.y);
    if (bd < 9.1 && bd > 0.15) {
      x = this.ball.x + ((x - this.ball.x) / bd) * 9.1;
      y = this.ball.y + ((y - this.ball.y) / bd) * 9.1;
    }
    return {
      x: clamp(x, -HALF_W + 1.8, HALF_W - 1.8),
      y: clamp(y, -HALF_L + 1.8, HALF_L - 1.8),
    };
  }

  private keepGoalersInBox() {
    for (const p of this.players) {
      if (!p.on || p.red || p.role !== "GK") continue;
      const atk = this.attack(p.side);
      const goalY = -atk * HALF_L;
      const along = clamp(atk * (p.y - goalY), 0.4, 15.2);
      p.y = goalY + atk * along;
      p.x = clamp(p.x, -19.2, 19.2);
      if (this.ball.owner === p.uid) this.stick();
    }
  }

  private keeperSpot(p: RT) {
    const atk = this.attack(p.side);
    const goalY = -atk * HALF_L;
    const depth = Math.abs(this.ball.y - goalY);
    const inPen = Math.abs(this.ball.x) < 20 && depth < 16.5;
    const follow = inPen ? 0.72 : 0.28;
    const x = clamp(this.ball.x * follow, -12, 12);
    let step = 0.7;
    if (inPen) step = clamp(15.2 - depth * 0.35, 1.2, 14.2);
    return { x, y: goalY + atk * step };
  }

  private keeperTake() {
    if (this.dead || this.phase !== "play" || !this.ball.owner) return;
    const owner = this.players.find((q) => q.uid === this.ball.owner);
    if (!owner || owner.role === "GK") return;
    const gk = this.sidePlayers((1 - owner.side) as 0 | 1).find((q) => q.role === "GK" && q.on && !q.red);
    if (!gk) return;
    const tough = this.referee || gk.side !== this.userSide;
    if (!tough) return;
    const goalY = -this.attack(gk.side) * HALF_L;
    const depth = Math.abs(owner.y - goalY);
    if (Math.abs(owner.x) > 16 || depth > 16.5) return;
    const reach = 1.25 + this.diff.save * 1.35;
    if (dist(gk, owner) > reach) return;
    this.ball.owner = gk.uid;
    this.ball.lastUid = gk.uid;
    this.ball.lastSide = gk.side;
    this.ball.kickAt = this.now;
    this.ball.offside.clear();
    this.ball.fromThrow = false;
    this.stick();
    this.banner = `Забрал ${gk.name}`;
    this.bannerT = 1.2;
  }

  private deflect() {
    if (this.ball.owner || this.dead || this.ball.lastSide == null) return;
    const spd = hypot(this.ball.vx, this.ball.vy);
    if (spd < 16 || this.ball.z > 1.45) return;
    const atk = this.attack(this.ball.lastSide);
    if (atk * this.ball.vy < 7) return;
    for (const p of this.sidePlayers((1 - this.ball.lastSide) as 0 | 1)) {
      if (p.uid === this.controlledId || p.role === "GK" || !p.on || p.red) continue;
      if (p.role !== "CB" && p.role !== "LB" && p.role !== "RB" && p.role !== "CDM") continue;
      const rival = this.referee || p.side !== this.userSide;
      const reach = rival ? 0.68 + this.diff.tackle * 0.42 : 0.66;
      if (dist(p, this.ball) > reach) continue;
      const odds = rival ? 0.08 + this.diff.tackle * 0.48 : 0.08;
      if (Math.random() > odds) continue;
      this.ball.vx *= -0.22;
      this.ball.vy *= 0.12;
      this.ball.vz = 1.5;
      this.ball.lastUid = p.uid;
      this.ball.lastSide = p.side;
      this.ball.kickAt = this.now;
      this.banner = `Блок ${p.name}`;
      this.bannerT = 1.1;
      return;
    }
  }

  /** Formation spot shifted by the team's real plan. Players keep the block instead of ball-chasing. */
  private shapePoint(p: RT) {
    const tactic = this.tactic[p.side];
    const shape = this.shapes[p.side];
    const atk = this.attack(p.side);
    const home = this.homeOf(p);
    const line = this.lineRole(p);
    const ballAdv = atk * this.ball.y;
    let push = 0;
    let wide = 1;
    let stretch = 1;
    if (tactic === "tiki") {
      push = clamp(ballAdv * 0.22 + 4, -4, 12);
      wide = 0.88;
      stretch = 0.8;
    } else if (tactic === "bus") {
      push = clamp(Math.min(-12, ballAdv * 0.05 - 18), -26, -10);
      wide = 0.72;
      stretch = 0.62;
    } else if (tactic === "press") {
      push = clamp(ballAdv * 0.32 + 2, -4, 14);
      wide = 0.96;
      stretch = 0.84;
    } else if (tactic === "counter") {
      push = clamp(ballAdv * 0.08 - 10, -20, 0);
      wide = 0.8;
      stretch = 0.7;
    } else if (tactic === "wing") {
      push = clamp(ballAdv * 0.18, -8, 10);
      wide = 1.12;
      stretch = 0.86;
    } else {
      push = clamp(ballAdv * 0.16, -8, 8);
      wide = 0.92;
      stretch = 1.02;
    }
    if (shape === "4-3-3") wide *= 1.08;
    if (shape === "4-4-2") {
      wide *= 0.9;
      stretch *= 0.94;
    }
    if (shape === "3-5-2") wide *= 1.12;
    if (shape === "4-2-3-1" && (line === "CDM" || line === "CB")) stretch *= 0.86;
    if (line === "GK") {
      const goalY = -atk * (HALF_L - 1.6);
      const come = tactic === "tiki" || tactic === "press" ? 0.16 : 0.08;
      return {
        x: clamp(this.ball.x * come, -5.5, 5.5),
        y: goalY + atk * (tactic === "bus" ? 0.4 : 1.2),
      };
    }
    let x = home.x * wide;
    let y = home.y * stretch + atk * push;
    if (tactic === "bus") {
      const base = line === "ST" ? -6 : line === "CAM" || line === "LW" || line === "RW" || line === "LM" || line === "RM" ? -12 : line === "CM" || line === "CDM" ? -16 : -22;
      let band = base;
      const behindBall = ballAdv - 9;
      if (band > behindBall) band = behindBall;
      const cap = line === "ST" ? 0 : -8;
      if (band > cap) band = cap;
      y = atk * clamp(band, -34, cap);
      x = clamp(home.x * (shape === "3-5-2" || shape === "4-3-3" ? 0.86 : 0.66), -24, 24);
    } else if (tactic === "counter" && (line === "ST" || line === "LW" || line === "RW")) {
      y = atk * (line === "ST" ? 14 : 8);
      if (line !== "ST") x = Math.sign(home.x || 1) * 16;
    }
    if (tactic === "tiki") x = x * 0.94 + clamp(this.ball.x, -18, 18) * 0.06;
    if ((tactic === "wing" || shape === "4-3-3" || shape === "3-5-2") && (line === "LW" || line === "RW" || line === "LM" || line === "RM")) {
      x = Math.sign(home.x || 1) * (HALF_W - (shape === "3-5-2" ? 5 : 8));
    }
    if (shape === "4-4-2" && line === "ST") {
      x = home.x;
      y = home.y * stretch + atk * Math.min(push, 6);
    }
    if (shape === "4-2-3-1" && line === "CDM") y = home.y - atk * 3;
    if ((tactic === "direct" || shape === "4-4-2") && (line === "ST" || line === "LW" || line === "RW") && tactic === "direct") {
      y = home.y + atk * 4;
    }
    if ((this.referee || p.side !== this.userSide) && tactic !== "bus" && line !== "ST") {
      y += atk * this.diff.press * 2.1;
    }
    return {
      x: clamp(x, -HALF_W + 1.8, HALF_W - 1.8),
      y: clamp(y, -HALF_L + 1.8, HALF_L - 1.8),
    };
  }

  private aiOnBall(p: RT) {
    const tactic = this.tactic[p.side];
    const atk = this.attack(p.side);
    const gy = atk * HALF_L;
    const gd = dist(p, { x: 0, y: gy });
    const rival = this.referee || p.side !== this.userSide;
    const acc = (rival ? this.diff.acc : 0.74) * (this.live(p).accuracy / 78);
    if (p.role === "GK") {
      const mate = this.bestMate(p) ?? this.fallbackMate(p);
      if (mate) {
        const gap = dist(p, mate);
        this.kick(p, mate.x - p.x, mate.y - p.y, this.passPace(gap, tactic === "bus" || tactic === "counter" || tactic === "direct" ? 0.95 : 0.72), 0.35, false);
      } else this.kick(p, 0, atk * 20, this.passPace(28, 0.9), 0.45, false);
      return;
    }
    if ((tactic === "bus" || tactic === "counter") && atk * p.y < -24) {
      const st = this.sidePlayers(p.side).find((m) => m.role === "ST" && m.uid !== p.uid);
      if (st) {
        this.kick(p, st.x - p.x, st.y - p.y, this.passPace(dist(p, st), 0.92), 0.55, false);
        return;
      }
    }
    const rushed = this.speedMul > 1.15;
    const slow = this.speedMul < 0.85;
    const finisher = p.role === "ST" || p.role === "LW" || p.role === "RW" || p.role === "CAM";
    if (gd < 28 && Math.abs(p.x) < 14) {
      const urge = (finisher || gd < 16 ? 0.16 : 0.05) + acc * 0.07;
      if (gd < 9 || Math.random() < urge * (slow ? 0.88 : rushed ? 1.1 : 1)) {
        this.shoot(p);
        return;
      }
    }
    if (gd > 16 && gd < 42 && Math.random() < (finisher ? 0.22 : 0.08)) {
      p.order = true;
      p.tx = clamp(p.x * 0.4, -9, 9);
      p.ty = clamp(p.y + atk * (slow ? 7.5 : rushed ? 10 : 8.5), -HALF_L + 4, HALF_L - 4);
      return;
    }
    const mate = this.bestMate(p) ?? this.fallbackMate(p);
    const passP = rushed ? 0.74 : slow ? 0.66 : 0.78;
    const wantPass = tactic === "tiki" ? (gd < 26 ? 0.58 : passP + 0.08) : passP;
    if (mate && Math.random() < wantPass) {
      const gap = dist(p, mate);
      const weight = tactic === "tiki" ? 0.58 : tactic === "direct" || tactic === "counter" ? 0.86 : 0.68;
      const lead = Math.random() < 0.05 ? atk * (1.6 + Math.random() * 2) : 0;
      this.kick(p, mate.x - p.x, mate.y - p.y + lead, this.passPace(gap, weight), tactic === "direct" ? 0.28 : 0.16, false);
      return;
    }
    const home = this.shapePoint(p);
    p.order = true;
    const carry = rushed ? 8.4 : slow ? 6.2 : 7.2;
    p.tx = clamp(home.x + clamp(p.x - home.x, -4, 4), -HALF_W + 3, HALF_W - 3);
    p.ty = clamp(home.y + atk * carry, -HALF_L + 4, HALF_L - 4);
  }

  private bestMate(p: RT) {
    const tactic = this.tactic[p.side];
    let best: RT | null = null;
    let score = -999;
    const atk = this.attack(p.side);
    const minD = tactic === "tiki" ? 4.2 : 5.5;
    const maxD = tactic === "tiki" ? 26 : tactic === "direct" || tactic === "counter" ? 44 : 34;
    for (const m of this.sidePlayers(p.side)) {
      if (m.uid === p.uid || (m.role === "GK" && p.role !== "GK")) continue;
      if (p.role === "GK" && m.role === "GK") continue;
      const d = dist(p, m);
      if (d < minD || d > maxD) continue;
      const forward = atk * (m.y - p.y);
      const wide = Math.abs(m.x) - Math.abs(p.x);
      let s = 0.2;
      if (!this.safePass(p, m) && Math.random() > 0.16) s -= 5;
      if (tactic === "tiki") s += (d > 6 && d < 14 ? 2.2 : 0.4) + Math.max(0, forward) * 0.04 - Math.abs(m.x - p.x) * 0.01;
      else if (tactic === "direct" || tactic === "counter") s += forward * 0.12 + (m.role === "ST" ? 1.5 : 0);
      else if (tactic === "wing") s += wide * 0.12 + forward * 0.04 + (m.role === "LW" || m.role === "RW" || m.role === "LM" || m.role === "RM" ? 1.1 : 0);
      else if (tactic === "bus") s += Math.max(0, forward) * 0.08 + (m.role === "ST" ? 1.6 : 0);
      else s += forward * 0.06;
      let mark = 99;
      for (const foe of this.sidePlayers((1 - p.side) as 0 | 1)) mark = Math.min(mark, dist(m, foe));
      if (mark < 2.4) s -= 1.4;
      if (s > score) {
        score = s;
        best = m;
      }
    }
    return score > 0.05 ? best : null;
  }

  private fallbackMate(p: RT) {
    let best: RT | null = null;
    let bestD = 40;
    for (const m of this.sidePlayers(p.side)) {
      if (m.uid === p.uid || m.role === "GK") continue;
      const d = dist(p, m);
      if (d < 4 || d >= bestD) continue;
      best = m;
      bestD = d;
    }
    return best;
  }

  private safePass(from: RT, to: RT) {
    const atk = this.attack(from.side);
    if (atk * to.y <= 1) return true;
    const defs = this.sidePlayers((1 - from.side) as 0 | 1)
      .slice()
      .sort((a, b) => atk * b.y - atk * a.y);
    const line = defs[1]?.y ?? defs[0]?.y ?? atk * HALF_L;
    const aheadBall = atk * to.y > atk * from.y + 0.6;
    const aheadLine = atk * to.y > atk * line + 0.4;
    return !(aheadBall && aheadLine);
  }

  private integrate(dt: number) {
    for (const p of this.players) {
      if (!p.on || p.red) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.x = clamp(p.x, -HALF_W + 1.2, HALF_W - 1.2);
      p.y = clamp(p.y, -HALF_L + 1.2, HALF_L - 1.2);
    }
  }

  private separate(dt: number) {
    const list = this.players.filter((p) => p.on && !p.red);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = hypot(dx, dy) || 0.001;
        if (d < 1.7) {
          const push = ((1.7 - d) * 0.5 * Math.min(1, dt * 8)) / d;
          const sx = dx * push;
          const sy = dy * push;
          if (this.simming || a.uid !== this.controlledId) {
            a.x -= sx;
            a.y -= sy;
          }
          if (this.simming || b.uid !== this.controlledId) {
            b.x += sx;
            b.y += sy;
          }
        }
      }
    }
  }

  private stick() {
    const p = this.players.find((q) => q.uid === this.ball.owner);
    if (!p) return;
    const f = this.forward(p);
    this.ball.x = p.x + f.x * 0.85;
    this.ball.y = p.y + f.y * 0.85;
    this.ball.vx = p.vx;
    this.ball.vy = p.vy;
    this.ball.z = 0;
    this.ball.vz = 0;
  }

  private ballPhysics(dt: number) {
    if (this.ball.owner) {
      this.stick();
      return;
    }
    this.ball.px = this.ball.x;
    this.ball.py = this.ball.y;
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    this.ball.z += this.ball.vz * dt;
    this.ball.vz -= 13 * dt;
    const drag = Math.exp(-(this.weather === "clear" ? 0.8 : 1.25) * dt);
    this.ball.vx *= drag;
    this.ball.vy *= drag;
    if (this.ball.z <= 0) {
      if (this.ball.vz < -1.2) this.ball.squash = 1;
      this.ball.z = 0;
      this.ball.vz = Math.abs(this.ball.vz) > 1.4 ? -this.ball.vz * 0.38 : 0;
      this.ball.vx *= 0.92;
      this.ball.vy *= 0.92;
    }
    this.tryClaim();
  }

  private tryClaim() {
    if (this.ball.z > 1.35) return;
    const spd = hypot(this.ball.vx, this.ball.vy);
    let best: RT | null = null;
    let bestD = 99;
    const user = this.ctrl();
    if (user && user.on && this.canTouch(user)) {
      const d = dist(user, this.ball);
      if (d < 1.45 && this.canReceive(user, d, spd)) {
        best = user;
        bestD = d;
      }
    }
    if (!best) {
      for (const p of this.players) {
        if (!p.on || p.red || !this.canTouch(p)) continue;
        const d = dist(p, this.ball);
        const reach = this.claimReach(p);
        if (d < reach && d < bestD && this.canReceive(p, d, spd)) {
          best = p;
          bestD = d;
        }
      }
    }
    if (!best) return;
    if (this.ball.offside.has(best.uid)) {
      this.callOffside(best);
      return;
    }
    if (best.role === "GK" && best.side === this.ball.lastSide && this.ball.z < 0.4 && hypot(this.ball.vx, this.ball.vy) < 10 && this.now - this.ball.kickAt < 2) {
      this.dead = { kind: "freekick", side: (1 - best.side) as 0 | 1, x: best.x, y: best.y + this.attack((1 - best.side) as 0 | 1) * 1, wait: 0.4 };
      this.banner = "Пас вратарю рукой нельзя";
      this.bannerT = 1.8;
      this.giveDead(this.dead.side);
      return;
    }
    this.ball.owner = best.uid;
    this.ball.lastUid = best.uid;
    this.ball.lastSide = best.side;
    this.ball.offside.clear();
    this.ball.fromThrow = false;
  }

  private claimReach(p: RT) {
    if (p.role !== "GK") return p.uid === this.controlledId && !this.simming ? 1.2 : 1.48;
    const goalY = -this.attack(p.side) * HALF_L;
    const depth = Math.abs(this.ball.y - goalY);
    const inBox = Math.abs(this.ball.x) < 18 && depth < 16;
    const tough = this.referee || p.side !== this.userSide;
    if (inBox && tough) return 2.05 + this.diff.save * 0.4;
    if (inBox) return 2.15;
    return 1.75;
  }

  private canReceive(p: RT, d: number, spd: number) {
    if (p.role === "GK") return spd < 34 || d < 2.2;
    if (spd < 15) return true;
    const teammate = this.ball.lastSide === p.side;
    if (teammate) {
      const userTouch = p.uid === this.controlledId && !this.simming;
      const reach = userTouch ? 1.65 : 2.05;
      const stick = userTouch ? 1.05 : 1.35;
      if (d > reach || spd > 50) return false;
      const closing = this.ball.vx * (p.x - this.ball.x) + this.ball.vy * (p.y - this.ball.y);
      return closing > 0 || d < stick;
    }
    const cap = this.referee || p.side !== this.userSide ? 7 + this.diff.tackle * 9 : 13;
    return spd < cap && d < 1.05;
  }

  private canTouch(p: RT) {
    if (this.ball.lastUid === p.uid && this.now - this.ball.kickAt < 0.28) return false;
    return true;
  }

  private callOffside(p: RT) {
    if (this.referee) {
      if (!this.incident) {
        const side = (1 - p.side) as 0 | 1;
        this.incident = { kind: "offside", by: p.name, victim: "", inBox: false, side, x: p.x, y: p.y, actor: p, victimPlayer: null };
        this.banner = `Офсайд? ${p.name}`;
        this.bannerT = 2;
      }
      return;
    }
    this.applyOffside(p);
  }

  private applyOffside(p: RT) {
    const side = (1 - p.side) as 0 | 1;
    this.dead = { kind: "freekick", side, x: clamp(p.x, -HALF_W + 1, HALF_W - 1), y: clamp(p.y, -HALF_L + 2, HALF_L - 2), wait: 0.45 };
    this.ball.offside.clear();
    this.banner = `Офсайд. ${p.name}`;
    this.bannerT = 1.8;
    this.offN[p.side] += 1;
    audio.whistle();
    this.giveDead(side);
    this.emit(true);
  }

  private carryGoal() {
    if (!this.ball.owner || this.dead || this.ball.fromThrow) return;
    const p = this.players.find((q) => q.uid === this.ball.owner);
    if (!p) return;
    const depth = this.attack(p.side) * p.y;
    if (depth < HALF_L - 2.4 || Math.abs(p.x) > GOAL_HW + 0.15) return;
    const goalY = this.attack(p.side) * HALF_L;
    const scoring: 0 | 1 = goalY > 0 ? 0 : 1;
    this.ball.owner = null;
    this.ball.vx = this.attack(p.side) * 8;
    this.ball.vy = this.attack(p.side) * 10;
    this.resolveGoal(scoring, this.ball.x, goalY);
  }

  private lines() {
    if (this.ball.owner || this.dead) return;
    const prevY = this.ball.py;
    const y = this.ball.y;
    if ((prevY <= HALF_L && y > HALF_L) || (prevY >= -HALF_L && y < -HALF_L)) {
      const goalY = y > 0 ? HALF_L : -HALF_L;
      const t = (goalY - prevY) / (y - prevY || 1);
      const crossX = this.ball.px + (this.ball.x - this.ball.px) * t;
      const scoring: 0 | 1 = goalY > 0 ? 0 : 1;
      const z = this.ball.z;
      const mouth = Math.abs(crossX) < GOAL_HW - 0.28;
      const post = Math.abs(crossX) >= GOAL_HW - 0.28 && Math.abs(crossX) <= GOAL_HW + 0.42;
      if ((post && z < 2.75) || (mouth && z >= 2.05 && z <= 2.75)) {
        this.ball.x = clamp(crossX, -GOAL_HW + 0.15, GOAL_HW - 0.15);
        this.ball.y = goalY - Math.sign(goalY) * 0.7;
        this.ball.vx = post ? -Math.sign(crossX || 1) * (7 + Math.abs(this.ball.vx) * 0.3) : this.ball.vx * 0.35;
        this.ball.vy = -Math.sign(goalY) * (6 + Math.abs(this.ball.vy) * 0.28);
        this.ball.vz = 1.8;
        this.ball.z = post ? Math.min(z, 1.6) : 2.1;
        this.ball.owner = null;
        this.banner = post ? "Штанга!" : "Перекладина!";
        this.bannerT = 1.6;
        return;
      }
      if (mouth && z < 2.05) {
        if (this.ball.fromThrow) {
          this.dead = { kind: "goalkick", side: (1 - scoring) as 0 | 1, x: 0, y: -this.attack((1 - scoring) as 0 | 1) * 46, wait: 0.5 };
          this.banner = "С аута гол не засчитывается";
          this.bannerT = 1.6;
          this.giveDead(this.dead.side);
          return;
        }
        this.resolveGoal(scoring, crossX, goalY);
        return;
      }
      const last = this.ball.lastSide;
      const attackSide: 0 | 1 = goalY > 0 ? 0 : 1;
      const lastPlayer = this.players.find((q) => q.uid === this.ball.lastUid);
      const keeperOut = lastPlayer?.role === "GK" && lastPlayer.side !== attackSide;
      if (!keeperOut && last === attackSide) {
        this.dead = { kind: "goalkick", side: (1 - attackSide) as 0 | 1, x: Math.sign(crossX) * 6, y: goalY - Math.sign(goalY) * 5.5, wait: 0.45 };
        this.banner = z >= 2.05 ? "Выше ворот" : "Удар от ворот";
      } else {
        this.dead = { kind: "corner", side: attackSide, x: Math.sign(crossX || 1) * (HALF_W - 0.6), y: goalY - Math.sign(goalY) * 0.6, wait: 0.45 };
        this.banner = keeperOut ? "Угловой от вратаря" : "Угловой";
      }
      this.bannerT = 1.5;
      this.giveDead(this.dead.side);
      return;
    }
    if (Math.abs(this.ball.x) > HALF_W) {
      const side = (this.ball.lastSide === 0 ? 1 : 0) as 0 | 1;
      this.dead = {
        kind: "throw",
        side,
        x: Math.sign(this.ball.x) * (HALF_W - 0.4),
        y: clamp(this.ball.y, -HALF_L + 1, HALF_L - 1),
        wait: 0.35,
      };
      this.banner = "Аут";
      this.bannerT = 1.3;
      this.giveDead(side);
    }
  }

  private resolveGoal(scoring: 0 | 1, crossX: number, goalY: number) {
    const gk = this.sidePlayers((1 - scoring) as 0 | 1).find((p) => p.role === "GK");
    const speed = hypot(this.ball.vx, this.ball.vy);
    const placed = gk ? Math.abs(crossX - gk.x) : 9;
    const near = placed < 1.15;
    const open = placed > 2.35;
    const oppKeeper = Boolean(gk && (this.referee || gk.side !== this.userSide));
    let save = 0.06;
    if (gk && oppKeeper) {
      const base = near ? 0.42 + this.diff.save * 0.55 : open ? 0.04 + this.diff.save * 0.14 : 0.22 + this.diff.save * 0.4;
      const diffPush = (this.diff.save - 0.22) * 0.2;
      const offLine = Math.abs(gk.y - goalY) > 4.2 && open ? 0.4 : 1;
      save = clamp((base + diffPush - speed / 150) * offLine, 0.04, 0.94);
    } else if (gk) {
      const wall = 0.2 + this.diff.mate * 0.58;
      save = clamp((near ? wall : wall * 0.5) - speed / 120, 0.04, 0.82);
    }
    if (Math.random() < save && gk) {
      this.ball.x = crossX * 0.8;
      this.ball.y = goalY - Math.sign(goalY) * 1.1;
      this.ball.vy = -Math.sign(goalY) * Math.abs(this.ball.vy) * 0.35;
      this.ball.vx *= 0.4;
      this.ball.vz = 3.2;
      this.ball.z = 0.5;
      this.ball.owner = null;
      this.ball.lastUid = gk.uid;
      this.ball.lastSide = gk.side;
      this.ball.kickAt = this.now;
      this.banner = `Сейв! ${gk.name}`;
      this.bannerT = 1.5;
      return;
    }
    const kicker = this.players.find((p) => p.uid === this.ball.lastUid);
    const own = !kicker || kicker.side !== scoring;
    const name = kicker?.name ?? "Гол";
    const assist =
      !own && this.ball.assistUid && this.ball.assistUid !== kicker?.uid && this.ball.assistSide === scoring && this.now - this.ball.assistAt < 8
        ? this.players.find((p) => p.uid === this.ball.assistUid)?.name ?? null
        : null;
    this.score[scoring] += 1;
    const minute = this.minuteMark();
    this.scorers.push({ name, minute, side: scoring, own, assist });
    this.goalSeq++;
    this.goalPopup = { name, minute, assist, side: scoring, own, seq: this.goalSeq };
    this.popupT = 6;
    this.goalT = 2.8;
    this.phase = "goal";
    this.kickSide = (1 - scoring) as 0 | 1;
    this.ball.owner = null;
    this.ball.y = goalY + Math.sign(goalY) * 0.7;
    this.ball.vx *= 0.2;
    this.ball.vy *= 0.2;
    this.cam.shake = 1;
    this.banner = own ? `Автогол. ${name}` : `Гол! ${name}`;
    this.bannerT = 3;
    audio.goal();
    this.spawnConfetti(scoring);
    this.emit(true);
  }

  private minuteMark() {
    const secs = (this.clock / this.halfBase) * 45 * 60 + (this.half === 2 ? 45 * 60 : 0);
    return `${Math.min(this.half === 2 ? 90 + this.added : 45, Math.floor(secs / 60) + 1)}'`;
  }

  private spawnConfetti(side: 0 | 1) {
    const color = side === 0 ? this.homeColor : this.awayColor;
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 16,
        y: this.attack(side) * (HALF_L - 2),
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 6,
        life: 1.6 + Math.random(),
        max: 2.2,
        color: i % 3 === 0 ? "#8FE388" : color,
        size: 0.25 + Math.random() * 0.35,
      });
    }
  }

  private burstStep(dt: number) {
    for (const q of this.particles) {
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy -= 2 * dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
  }

  private contests(_dt: number) {}

  private recover(dt: number) {
    for (const p of this.players) {
      if (!p.on) continue;
      const sprinting = p.uid === this.controlledId && (this.sprintHeld || this.keys.has("ShiftLeft") || this.keys.has("ShiftRight"));
      if (!sprinting) p.stamina = Math.min(100, p.stamina + 6 * dt);
    }
  }

  private timeLabel() {
    const halfSeconds = (this.clock / this.halfBase) * 45 * 60;
    let m = Math.floor(halfSeconds / 60);
    const s = Math.floor(halfSeconds % 60);
    if (this.half === 2) m += 45;
    const tag = this.added > 0 && this.half === 2 && m >= 90 ? `+${this.added}` : "";
    return `${String(Math.min(m, 90 + this.added)).padStart(2, "0")}:${String(s).padStart(2, "0")}${tag}`;
  }

  snapshot(): Snap {
    const p = this.ctrl();
    const rows = (side: 0 | 1, on: boolean): TRow[] => {
      const slots = FORMATIONS[this.shapes[side]] ?? FORMATIONS["4-3-3"]!;
      return this.players
        .filter((q) => q.side === side && q.on === on && !q.red)
        .map((q) => ({
          uid: q.uid,
          name: q.name,
          role: on && q.slot >= 0 ? (slots[q.slot]?.role ?? q.role) : q.role,
          num: q.num,
          ovr: q.eff,
          mod: q.eff - q.ovr,
          stamina: q.stamina,
          on: q.on,
          slot: q.slot,
        }))
        .sort((a, b) => (on ? a.slot - b.slot : a.num - b.num));
    };
    const possSum = this.possTime[0] + this.possTime[1];
    const count = (side: 0 | 1) => this.players.filter((q) => q.side === side && q.on && !q.red).length;
    const cards = (side: 0 | 1) => this.players.filter((q) => q.side === side && (q.yellow > 0 || q.red)).length;
    const yellows = (side: 0 | 1) => this.players.filter((q) => q.side === side).reduce((s, q) => s + q.yellow, 0);
    const reds = (side: 0 | 1) => this.players.filter((q) => q.side === side && q.red).length;
    const live = p ? this.live(p) : null;
    const ready = this.homeKit !== null && this.awayKit !== null;
    const owner = this.players.find((q) => q.uid === this.ball.owner);
    return {
      time: this.timeLabel(),
      minute: this.minuteMark(),
      half: this.half,
      score: [this.score[0], this.score[1]],
      poss: this.ball.lastSide,
      phase: this.phase,
      paused: this.paused,
      name: p?.name ?? "",
      role: p?.role ?? "",
      num: p?.num ?? 0,
      stam: p?.stamina ?? 0,
      ovr: p?.eff ?? 0,
      banner: this.bannerT > 0 ? this.banner : "",
      goal: this.popupT > 0 ? this.goalPopup : null,
      quick: this.dead ? this.recommend() : null,
      subs: 5 - this.subsUsed,
      formation: this.shapes[this.userSide] ?? this.formation,
      homeShape: this.shapes[0],
      awayShape: this.shapes[1],
      carrier: owner ? `${owner.num} ${owner.name}` : "Свободный мяч",
      xi: rows(0, true),
      bench: rows(0, false),
      awayXi: rows(1, true),
      awayBench: rows(1, false),
      scorers: this.scorers,
      dead: this.dead?.kind ?? "",
      setPiece: Boolean(this.dead),
      homeCode: this.home.code,
      awayCode: this.away.code,
      homeColor: this.homeColor,
      awayColor: this.awayColor,
      homeName: this.home.name,
      awayName: this.away.name,
      stadium: this.home.stadium,
      locked: this.lockControl,
      referee: this.referee,
      call: this.incident?.kind ?? "",
      callText: this.incident ? (this.incident.kind === "foul" ? `${this.incident.by} против ${this.incident.victim}` : this.incident.by) : "",
      refCorrect: this.refCorrect,
      refWrong: this.refWrong,
      weather: this.weather,
      kit: this.kit,
      added: this.added,
      onField: [count(0), count(1)],
      shots: [this.shotN[0], this.shotN[1]],
      fouls: [this.foulN[0], this.foulN[1]],
      cards: [cards(0), cards(1)],
      possPct: possSum > 0 ? [Math.round((this.possTime[0] / possSum) * 100), Math.round((this.possTime[1] / possSum) * 100)] : [50, 50],
      charge: this.chargeKind ? Math.min(1, this.chargeT / 0.75) : 0,
      statLine: live ? `скорость ${Math.round(live.speed)} · точность ${Math.round(live.accuracy)} · жёсткость ${Math.round(live.hardness)}` : "",
      kitPicked: ready,
      homePlan: PLAN_LABEL[this.tactic[0]],
      awayPlan: PLAN_LABEL[this.tactic[1]],
      homeKit: this.homeKit,
      awayKit: this.awayKit,
      kitsReady: ready,
      userSide: this.userSide,
      passes: [this.passN[0], this.passN[1]],
      yellows: [yellows(0), yellows(1)],
      reds: [reds(0), reds(1)],
      pens: [this.penN[0], this.penN[1]],
      offsides: [this.offN[0], this.offN[1]],
      homeSwatch: [this.home.home, this.home.away],
      awaySwatch: [this.away.home, this.away.away],
      critic: this.critic(),
    };
  }

  private critic(): Snap["critic"] {
    if (this.referee) {
      const calls = this.refCorrect + this.refWrong;
      const acc = calls === 0 ? 0.62 : this.refCorrect / calls;
      const mark = clamp(Math.round((4.6 + acc * 4.8 - this.refWrong * 0.22) * 10) / 10, 3.5, 9.8);
      const title = mark >= 8 ? "Судья вечера" : mark >= 6.5 ? "Рабочий вечер" : "Спорный протокол";
      return {
        mark: mark.toFixed(1),
        title,
        text: `Верных решений ${this.refCorrect}, ошибок ${this.refWrong}. Фолов ${this.foulN[0] + this.foulN[1]}, жёлтых ${this.players.reduce((s, q) => s + q.yellow, 0)}, красных ${this.players.filter((q) => q.red).length}.`,
      };
    }
    const us = this.userSide;
    const them = (1 - us) as 0 | 1;
    const gf = this.score[us];
    const ga = this.score[them];
    let mark = 6 + (gf - ga) * 0.65 + Math.min(1.1, this.shotN[us] * 0.1) - Math.min(0.9, this.foulN[us] * 0.07);
    if (gf > ga) mark += 0.35;
    if (gf === 0 && ga === 0) mark = Math.max(mark, 6.1);
    mark = clamp(Math.round(mark * 10) / 10, 3.5, 9.7);
    const title = mark >= 8.5 ? "Матч тура" : mark >= 7 ? "Уверенно" : mark >= 5.5 ? "Рабочий вечер" : "Ниже ожиданий";
    const usName = us === 0 ? this.home.name : this.away.name;
    return {
      mark: mark.toFixed(1),
      title,
      text: `${usName} ${gf}:${ga}. Удары ${this.shotN[us]} против ${this.shotN[them]}, пасы ${this.passN[us]} против ${this.passN[them]}. ${title}.`,
    };
  }

  private emit(force: boolean) {
    if (this.simming) return;
    this.hudAcc += force ? 1 : 0.016;
    if (force || this.hudAcc > 0.1) {
      this.hudAcc = 0;
      this.onHud?.(this.snapshot());
    }
  }

  paint() {
    if (!this.ctx || this.cssW < 2 || this.cssH < 2) return;
    paintMatch(this.ctx, this.cssW, this.cssH, this);
  }

  pointerWorld(sx: number, sy: number) {
    const scale = this.cssH / Math.max(20, this.viewH);
    const x = (sx - this.cssW / 2) / scale + this.cam.x;
    const worldUp = (this.cssH * 0.52 - sy) / scale;
    const y = this.userSide === 1 ? this.cam.y - worldUp : this.cam.y + worldUp;
    return { x, y };
  }
}

export function selfTest() {
  const sim = new MatchSim({ homeId: "KHM", awayId: "ZNM", halfMin: 3, difficulty: "novice" });
  const phase = () => sim.phase as string;
  if (sim.snapshot().kitsReady) throw new Error("kit preselected");
  sim.beginPlay();
  if (phase() !== "intro") throw new Error("started without kit");
  sim.setSideKit(0, "primary");
  sim.beginPlay();
  if (phase() !== "intro") throw new Error("started with one kit");
  sim.setSideKit(1, "inverse");
  if (!sim.snapshot().kitsReady) throw new Error("kits not stored");
  if (sim.snapshot().homeColor === sim.snapshot().awayColor && sim.home.home !== sim.away.home) {
    /* colors may still match by chance */
  }
  sim.beginPlay();
  if (phase() !== "play") throw new Error("no kickoff");
  if (sim.ball.lastSide !== 0) throw new Error(`kickoff side ${sim.ball.lastSide}`);
  if (Math.hypot(sim.ball.x, sim.ball.y) > 0.35) throw new Error(`center ${sim.ball.x},${sim.ball.y}`);
  const guest = new MatchSim({ homeId: "KHM", awayId: "SPM", halfMin: 3, difficulty: "novice", userSide: 1 });
  guest.setSideKit(0, "primary");
  guest.setSideKit(1, "primary");
  guest.beginPlay();
  if (guest.ball.lastSide !== 0) throw new Error("away user took the kickoff");
  if (Math.hypot(guest.ball.x, guest.ball.y) > 0.35) throw new Error("away center");
  sim.setKeys(["KeyW"]);
  for (let i = 0; i < 40; i++) sim.step(1 / 60);
  if (sim.getSpeed() <= 0.1) throw new Error(`W no speed ${sim.getSpeed()}`);
  const y0 = sim.getYaw();
  sim.setKeys(["KeyW", "KeyA"]);
  for (let i = 0; i < 30; i++) sim.step(1 / 60);
  const d = Math.atan2(Math.sin(sim.getYaw() - y0), Math.cos(sim.getYaw() - y0));
  if (d < 0.05) throw new Error(`A yaw ${d}`);
  sim.setKeys([]);
  const holder = sim.players.find((q) => q.uid === sim.controlledId)!;
  holder.x = 0;
  holder.y = 8;
  holder.vx = 0;
  holder.vy = 0;
  sim.ball.owner = holder.uid;
  sim.ball.lastSide = 0;
  for (let i = 0; i < 150; i++) sim.step(1 / 60);
  const me = sim.players.find((q) => q.uid === sim.controlledId)!;
  const near = sim.players.filter((q) => q.side === 1 && q.on && Math.hypot(q.x - me.x, q.y - me.y) < 9).length;
  if (near > 2) throw new Error(`swarm ${near}`);
  const p = sim.players.find((q) => q.uid === sim.controlledId)!;
  p.x = 0;
  p.y = 40;
  p.vx = 0;
  p.vy = 0;
  sim.ball.owner = p.uid;
  sim.ball.x = 0;
  sim.ball.y = 40.8;
  sim.ball.vx = 0;
  sim.ball.vy = 0;
  sim.ball.z = 0;
  sim.ball.lastSide = 0;
  sim.dead = null;
  sim.tap("shoot");
  sim.step(1 / 60);
  const speed = Math.hypot(sim.ball.vx, sim.ball.vy);
  if (speed < 8 && sim.score[0] === 0) throw new Error(`shot dead y=${sim.ball.y} v=${speed}`);
  const passing = new MatchSim({ homeId: "KHM", awayId: "ZNM", halfMin: 3, difficulty: "novice" });
  passing.setSideKit(0, "primary");
  passing.setSideKit(1, "inverse");
  passing.beginPlay();
  const passer = passing.players.find((q) => q.uid === passing.controlledId)!;
  const mate = passing.players.find((q) => q.side === 0 && q.on && q.uid !== passer.uid && q.role !== "GK");
  if (!mate) throw new Error("no mate");
  const setupPass = (power: number) => {
    passer.x = 0;
    passer.y = 0;
    passer.vx = 0;
    passer.vy = 0;
    passer.yaw = 0;
    mate.x = 0;
    mate.y = 16;
    mate.vx = 0;
    mate.vy = 0;
    passing.ball.owner = passer.uid;
    passing.ball.x = passer.x;
    passing.ball.y = passer.y + 0.8;
    passing.ball.vx = 0;
    passing.ball.vy = 0;
    passing.ball.z = 0;
    passing.ball.lastSide = 0;
    passing.dead = null;
    passing.phase = "play";
    passing.fire("pass", power);
    passing.step(1 / 60);
    return Math.hypot(passing.ball.vx, passing.ball.vy);
  };
  const soft = setupPass(0.48);
  const hard = setupPass(1);
  if (soft < 16) throw new Error(`soft pass ${soft}`);
  if (hard < soft + 3) throw new Error(`pass charge soft ${soft} hard ${hard}`);
  const gk = passing.players.find((q) => q.side === 1 && q.role === "GK" && q.on)!;
  gk.think = 4;
  gk.x = 2;
  gk.y = 30;
  passer.x = 2.3;
  passer.y = 30.2;
  passing.ball.owner = gk.uid;
  passing.ball.lastUid = gk.uid;
  passing.ball.lastSide = 1;
  passing.ball.x = gk.x;
  passing.ball.y = gk.y;
  passing.ball.vx = 0;
  passing.ball.vy = 0;
  passing.dead = null;
  passing.tap("tackle");
  passing.step(1 / 60);
  if (passing.ball.owner !== gk.uid) throw new Error("tackle stole from keeper");
  const slots = new Map<number, number>();
  for (const q of passing.players) {
    if (!q.on || q.side !== 1) continue;
    slots.set(q.slot, (slots.get(q.slot) ?? 0) + 1);
  }
  if ([...slots.values()].some((n) => n !== 1)) throw new Error("away slots collided");
  return "ok";
}
