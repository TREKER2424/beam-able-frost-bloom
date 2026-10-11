export type Lang = "ru" | "en" | "cv";

export type Role =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "CDM"
  | "CM"
  | "LM"
  | "RM"
  | "CAM"
  | "LW"
  | "RW"
  | "ST";

export type DifficultyId = "novice" | "amateur" | "pro" | "world" | "legend";
export type SpeedId = "slow" | "normal" | "fast";
export type CameraId = "broadcast" | "tower" | "coop" | "dynamic";
export type HalfId = 3 | 4 | 5 | 6 | 45;
export type FormationId = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1";

export type Loc = { ru: string; en: string; cv: string };

export type PlayerDef = {
  name: string;
  pos: Role;
  ovr: number;
  stamina: number;
  speed: number;
  num: number;
};

export type TeamDef = {
  id: string;
  code: string;
  name: Loc;
  city: Loc;
  stadium: Loc;
  capacity: number;
  sponsor: Loc;
  home: string;
  away: string;
  roster: PlayerDef[];
};

export type Slot = { x: number; y: number; role: Role };

export type Phase = "play" | "goal" | "halftime" | "fulltime";

export type RuntimePlayer = {
  uid: string;
  side: 0 | 1;
  name: string;
  role: Role;
  ovr: number;
  effOvr: number;
  speed: number;
  stamina: number;
  maxStamina: number;
  num: number;
  onPitch: boolean;
  slot: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  yaw: number;
  tackleCd: number;
  think: number;
  tx: number;
  ty: number;
  hasOrder: boolean;
};

export type Ball = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  owner: string | null;
  lastUid: string | null;
  lastSide: 0 | 1 | null;
  kickAt: number;
  assistUid: string | null;
  assistAt: number;
  assistSide: 0 | 1 | null;
  saveRolled: boolean;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
};

export type Scorer = {
  name: string;
  minute: string;
  side: 0 | 1;
  own: boolean;
  assist: string | null;
};

export type TacticsRow = {
  uid: string;
  name: string;
  role: Role;
  num: number;
  ovr: number;
  mod: number;
  stamina: number;
  onPitch: boolean;
  slot: number;
};

export type HudSnap = {
  timeLabel: string;
  minuteMark: string;
  half: 1 | 2;
  score: [number, number];
  homeCode: string;
  awayCode: string;
  homeColor: string;
  awayColor: string;
  homeName: string;
  awayName: string;
  stadium: string;
  poss: 0 | 1 | null;
  phase: Phase;
  paused: boolean;
  playerName: string;
  playerRole: Role | "";
  playerNum: number;
  playerStam: number;
  playerOvr: number;
  playerMod: number;
  goal: {
    name: string;
    minute: string;
    assist: string | null;
    side: 0 | 1;
    own: boolean;
    seq: number;
  } | null;
  quick: { outName: string; inName: string; outUid: string; inUid: string } | null;
  banner: string;
  subsLeft: number;
  formation: FormationId;
  xi: TacticsRow[];
  bench: TacticsRow[];
  scorers: Scorer[];
  setPiece: boolean;
  fitSum: number;
};
