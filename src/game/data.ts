export const HALF_W = 34;
export const HALF_L = 52.5;
export const GOAL_HW = 3.66;

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

export type PlayerDef = {
  name: string;
  pos: Role;
  ovr: number;
  speed: number;
  stamina: number;
  num: number;
  age?: number;
  form?: number;
  fitness?: number;
  id?: string;
  accuracy?: number;
  hardness?: number;
};

export type TeamDef = {
  id: string;
  code: string;
  name: string;
  city: string;
  stadium: string;
  home: string;
  away: string;
  roster: PlayerDef[];
};

export type Slot = { x: number; y: number; role: Role };

export const FORMATIONS: Record<string, Slot[]> = {
  "4-3-3": [
    { x: 0, y: -0.92, role: "GK" },
    { x: -0.78, y: -0.5, role: "LB" },
    { x: -0.28, y: -0.58, role: "CB" },
    { x: 0.28, y: -0.58, role: "CB" },
    { x: 0.78, y: -0.5, role: "RB" },
    { x: -0.42, y: -0.08, role: "CM" },
    { x: 0.42, y: -0.08, role: "CM" },
    { x: 0, y: 0.12, role: "CAM" },
    { x: -0.7, y: 0.4, role: "LW" },
    { x: 0, y: 0.48, role: "ST" },
    { x: 0.7, y: 0.4, role: "RW" },
  ],
  "4-4-2": [
    { x: 0, y: -0.92, role: "GK" },
    { x: -0.78, y: -0.5, role: "LB" },
    { x: -0.28, y: -0.58, role: "CB" },
    { x: 0.28, y: -0.58, role: "CB" },
    { x: 0.78, y: -0.5, role: "RB" },
    { x: -0.7, y: 0.02, role: "LM" },
    { x: -0.24, y: -0.08, role: "CM" },
    { x: 0.24, y: -0.08, role: "CM" },
    { x: 0.7, y: 0.02, role: "RM" },
    { x: -0.18, y: 0.46, role: "ST" },
    { x: 0.18, y: 0.46, role: "ST" },
  ],
  "3-5-2": [
    { x: 0, y: -0.92, role: "GK" },
    { x: -0.42, y: -0.56, role: "CB" },
    { x: 0, y: -0.6, role: "CB" },
    { x: 0.42, y: -0.56, role: "CB" },
    { x: -0.82, y: -0.05, role: "LM" },
    { x: -0.4, y: -0.12, role: "CM" },
    { x: 0, y: 0.02, role: "CAM" },
    { x: 0.4, y: -0.12, role: "CM" },
    { x: 0.82, y: -0.05, role: "RM" },
    { x: -0.18, y: 0.46, role: "ST" },
    { x: 0.18, y: 0.46, role: "ST" },
  ],
  "4-2-3-1": [
    { x: 0, y: -0.92, role: "GK" },
    { x: -0.78, y: -0.5, role: "LB" },
    { x: -0.28, y: -0.58, role: "CB" },
    { x: 0.28, y: -0.58, role: "CB" },
    { x: 0.78, y: -0.5, role: "RB" },
    { x: -0.28, y: -0.18, role: "CDM" },
    { x: 0.28, y: -0.18, role: "CDM" },
    { x: -0.62, y: 0.18, role: "LW" },
    { x: 0, y: 0.16, role: "CAM" },
    { x: 0.62, y: 0.18, role: "RW" },
    { x: 0, y: 0.48, role: "ST" },
  ],
};

export const FORMATION_IDS = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1"] as const;

/** Opponent shape. Same club lines up differently from match to match. */
export function clubShape(teamId: string, salt = 0): (typeof FORMATION_IDS)[number] {
  const style = clubInfo(teamId).style.toLowerCase();
  let pref = 0;
  if (style.includes("фланг")) pref = 2;
  else if (style.includes("вертикал") || style.includes("контрат")) pref = 1;
  else if (style.includes("низк") || style.includes("своей") || style.includes("опорн")) pref = 3;
  const shift = Math.abs(Math.trunc(salt)) % 3;
  return FORMATION_IDS[(pref + shift) % FORMATION_IDS.length]!;
}

const INI = ["А", "В", "Д", "И", "К", "М", "Н", "П", "Р", "С", "Е", "О", "Г", "Л", "Т"];
const SUR = [
  "Иванов", "Петров", "Смирнов", "Васильев", "Фёдоров", "Николаев", "Егоров", "Орлов",
  "Кузьмин", "Степанов", "Павлов", "Григорьев", "Волков", "Соколов", "Макаров", "Зайцев",
  "Белов", "Морозов", "Козлов", "Новиков", "Лебедев", "Михайлов", "Алексеев", "Киселёв",
  "Попов", "Семенов", "Голубев", "Виноградов", "Богданов", "Воробьёв", "Фролов", "Медведев",
  "Ермолаев", "Тихонов", "Крылов", "Назаров", "Савельев", "Романов", "Осипов", "Марков",
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const XI: Role[] = ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CAM", "LW", "ST", "RW"];
const BENCH: Role[] = ["GK", "CB", "CM", "ST", "LW"];

function buildRoster(seed: number, base: number, stars: Partial<PlayerDef>[] = []): PlayerDef[] {
  const rng = mulberry32(seed);
  const used = new Set<string>();
  const roles = [...XI, ...BENCH];
  return roles.map((pos, i) => {
    const star = stars[i];
    let name = star?.name ?? "";
    if (!name) {
      for (let n = 0; n < 12; n++) {
        const candidate = `${INI[Math.floor(rng() * INI.length)]}. ${SUR[Math.floor(rng() * SUR.length)]}`;
        if (!used.has(candidate)) {
          name = candidate;
          break;
        }
      }
    }
    used.add(name);
    const line = pos === "GK" ? -2 : pos === "ST" || pos === "LW" || pos === "RW" ? 3 : 0;
    const rolled = star?.ovr ?? Math.round(base + line + (rng() - 0.5) * 8);
    const shifted = star?.ovr != null ? star.ovr - 6 : rolled - 6;
    return {
      name,
      pos,
      ovr: Math.max(50, Math.min(star?.ovr != null ? 90 : 74, shifted)),
      speed: star?.speed ?? Math.round(pos === "GK" ? 58 + rng() * 10 : 66 + rng() * 18),
      stamina: star?.stamina ?? Math.round(78 + rng() * 16),
      num: star?.num ?? i + 1,
      age: star?.age ?? Math.round(19 + rng() * 15),
    };
  });
}

export const TEAMS: TeamDef[] = [
  {
    id: "KHM",
    code: "KHM",
    name: "Химик-Август",
    city: "Вурнары",
    stadium: "Стадион Химик",
    home: "#981C1E",
    away: "#F4F0EA",
    roster: buildRoster(11, 72, [
      { name: "И. Иванов", pos: "GK", ovr: 74, speed: 62, stamina: 88, num: 1 },
      { name: "П. Андреев", pos: "LB", ovr: 69, num: 2 },
      { name: "А. Николаев", pos: "CB", ovr: 71, speed: 68, stamina: 85, num: 3 },
      { name: "Р. Егоров", pos: "CB", ovr: 70, num: 4 },
      { name: "К. Орлов", pos: "RB", ovr: 72, num: 5 },
      { name: "В. Фёдоров", pos: "CM", ovr: 76, speed: 75, stamina: 92, num: 6 },
      { name: "Д. Кузьмин", pos: "CM", ovr: 73, num: 8 },
      { name: "Л. Степанов", pos: "CAM", ovr: 74, num: 10 },
      { name: "Н. Григорьев", pos: "LW", ovr: 73, num: 11 },
      { name: "С. Васильев", pos: "ST", ovr: 78, speed: 84, stamina: 89, num: 9 },
      { name: "А. Павлов", pos: "RW", ovr: 71, num: 7 },
    ]),
  },
  {
    id: "SPM",
    code: "SPM",
    name: "Спартак",
    city: "Чебоксары",
    stadium: "Олимпийский",
    home: "#CC0000",
    away: "#1E4ED8",
    roster: buildRoster(22, 74, [
      { name: "Д. Петров", pos: "GK", ovr: 70, speed: 60, stamina: 82, num: 1 },
      { name: "С. Козлов", pos: "LB", ovr: 71, num: 2 },
      { name: "А. Белов", pos: "CB", ovr: 72, num: 4 },
      { name: "И. Морозов", pos: "CB", ovr: 69, num: 5 },
      { name: "В. Новиков", pos: "RB", ovr: 70, num: 3 },
      { name: "П. Лебедев", pos: "CM", ovr: 73, num: 6 },
      { name: "К. Михайлов", pos: "CM", ovr: 74, num: 8 },
      { name: "Р. Алексеев", pos: "CAM", ovr: 72, num: 10 },
      { name: "А. Киселёв", pos: "LW", ovr: 71, num: 11 },
      { name: "М. Смирнов", pos: "ST", ovr: 75, speed: 81, stamina: 87, num: 9 },
      { name: "Н. Попов", pos: "RW", ovr: 73, num: 7 },
    ]),
  },
  {
    id: "SHU",
    code: "SHU",
    name: "ФК Шумерля",
    city: "Шумерля",
    stadium: "Труд",
    home: "#1F6B45",
    away: "#F4F1E8",
    roster: buildRoster(33, 67),
  },
  {
    id: "ENR",
    code: "ENR",
    name: "Энергия",
    city: "Новочебоксарск",
    stadium: "Химик-Арена",
    home: "#E2B93B",
    away: "#142033",
    roster: buildRoster(44, 71),
  },
  {
    id: "ZNM",
    code: "ZNM",
    name: "Знамя",
    city: "Канаш",
    stadium: "Энергия",
    home: "#7A1F2B",
    away: "#F2C94C",
    roster: buildRoster(55, 69),
  },
  {
    id: "ALT",
    code: "ALT",
    name: "Алатырь",
    city: "Алатырь",
    stadium: "Старт",
    home: "#2E6BFF",
    away: "#F7F7F2",
    roster: buildRoster(66, 68),
  },
  {
    id: "SKL",
    code: "SKL",
    name: "Сокол",
    city: "Ядрин",
    stadium: "Юность",
    home: "#143024",
    away: "#8FE388",
    roster: buildRoster(77, 70),
  },
  {
    id: "CVL",
    code: "CVL",
    name: "Цивиль",
    city: "Цивильск",
    stadium: "Волна",
    home: "#0E6E8C",
    away: "#E7F2EA",
    roster: buildRoster(88, 66),
  },
];

export const CLUB_INFO: Record<string, { capacity: number; coach: string; founded: number; style: string }> = {
  KHM: { capacity: 3050, coach: "А. Петров", founded: 1965, style: "Высокий прессинг" },
  SPM: { capacity: 15000, coach: "Р. Орлов", founded: 1961, style: "Владение мячом" },
  SHU: { capacity: 3500, coach: "В. Егоров", founded: 1970, style: "Контратака" },
  ENR: { capacity: 6200, coach: "Д. Волков", founded: 1978, style: "Фланговые забегания" },
  ZNM: { capacity: 4100, coach: "С. Белов", founded: 1954, style: "Низкий блок" },
  ALT: { capacity: 2800, coach: "И. Савельев", founded: 1968, style: "Вертикальные передачи" },
  SKL: { capacity: 2500, coach: "Н. Крылов", founded: 1982, style: "Прессинг на своей половине" },
  CVL: { capacity: 2200, coach: "М. Тихонов", founded: 1991, style: "Игра через опорного" },
};

export function clubInfo(id: string) {
  return CLUB_INFO[id] ?? { capacity: 3000, coach: "Главный тренер", founded: 1970, style: "Универсальный" };
}

export function teamById(id: string): TeamDef {
  const team = TEAMS.find((t) => t.id === id);
  if (!team) throw new Error(`unknown team ${id}`);
  return team;
}

export function avgOvr(team: TeamDef): number {
  const xi = team.roster.slice(0, 11);
  return Math.round(xi.reduce((s, p) => s + p.ovr, 0) / xi.length);
}

export function clubRating(id: string): number {
  return avgOvr(teamById(id));
}

export function coachRating(id: string): number {
  const avg = clubRating(id);
  const style = clubInfo(id).style;
  const bump = style.includes("прессинг") || style.includes("Прессинг") ? 1 : style.includes("Владение") ? 2 : 0;
  return Math.max(58, Math.min(90, avg + bump));
}

export function playerAttrs(p: { name: string; pos: Role; ovr: number; speed: number; accuracy?: number; hardness?: number }) {
  if (p.accuracy != null && p.hardness != null) return { speed: p.speed, accuracy: p.accuracy, hardness: p.hardness };
  let h = 0;
  for (let i = 0; i < p.name.length; i++) h = (h * 33 + p.name.charCodeAt(i)) % 97;
  const atk = p.pos === "ST" || p.pos === "LW" || p.pos === "RW" || p.pos === "CAM";
  const def = p.pos === "CB" || p.pos === "CDM" || p.pos === "LB" || p.pos === "RB" || p.pos === "GK";
  const accuracy = Math.max(46, Math.min(94, Math.round(p.ovr + (atk ? 6 : def ? -3 : 1) + (h % 7) - 3)));
  const hardness = Math.max(40, Math.min(96, Math.round(p.ovr + (def ? 8 : atk ? -5 : 0) + ((h * 3) % 9) - 4)));
  return { speed: p.speed, accuracy, hardness };
}

export type Fixture = {
  round: number;
  home: string;
  away: string;
  hg: number | null;
  ag: number | null;
};

export function seasonFixtures(ids: string[]): Fixture[] {
  const n = ids.length;
  const list = ids.slice();
  const first: Fixture[][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: Fixture[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i]!;
      const b = list[n - 1 - i]!;
      const swap = r % 2 === 1 && i === 0;
      pairs.push({
        round: r,
        home: swap ? b : a,
        away: swap ? a : b,
        hg: null,
        ag: null,
      });
    }
    first.push(pairs);
    const fixed = list[0]!;
    const rest = list.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    list.splice(0, list.length, fixed, ...rest);
  }
  const second = first.map((pairs, i) =>
    pairs.map((p) => ({
      round: i + (n - 1),
      home: p.away,
      away: p.home,
      hg: null,
      ag: null,
    })),
  );
  return [...first.flat(), ...second.flat()];
}

export type TableRow = {
  id: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
};

export function tableOf(fixtures: Fixture[]): TableRow[] {
  const rows = new Map<string, TableRow>();
  for (const id of TEAMS.map((t) => t.id)) {
    rows.set(id, { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
  }
  for (const f of fixtures) {
    if (f.hg === null || f.ag === null) continue;
    const h = rows.get(f.home)!;
    const a = rows.get(f.away)!;
    h.p++;
    a.p++;
    h.gf += f.hg;
    h.ga += f.ag;
    a.gf += f.ag;
    a.ga += f.hg;
    if (f.hg > f.ag) {
      h.w++;
      h.pts += 3;
      a.l++;
    } else if (f.hg < f.ag) {
      a.w++;
      a.pts += 3;
      h.l++;
    } else {
      h.d++;
      a.d++;
      h.pts++;
      a.pts++;
    }
  }
  return [...rows.values()].sort((a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf);
}

export function profile(role: Role): { line: number; flank: number } {
  switch (role) {
    case "GK":
      return { line: 0, flank: 0 };
    case "CB":
      return { line: 1, flank: 0 };
    case "LB":
      return { line: 1, flank: -1 };
    case "RB":
      return { line: 1, flank: 1 };
    case "CDM":
      return { line: 2, flank: 0 };
    case "CM":
      return { line: 2, flank: 0 };
    case "LM":
      return { line: 2, flank: -1 };
    case "RM":
      return { line: 2, flank: 1 };
    case "CAM":
      return { line: 3, flank: 0 };
    case "LW":
      return { line: 3, flank: -1 };
    case "RW":
      return { line: 3, flank: 1 };
    case "ST":
      return { line: 4, flank: 0 };
  }
}

export function slotFit(role: Role, slotRole: Role): number {
  if (role === "GK" || slotRole === "GK") return role === slotRole ? 2 : -8;
  const a = profile(role);
  const b = profile(slotRole);
  const d = Math.abs(a.line - b.line) + Math.abs(a.flank - b.flank);
  if (d === 0) return 2;
  if (d <= 1.5) return 0;
  return -3;
}

export function compatible(outRole: Role, inRole: Role): boolean {
  if (outRole === "GK" || inRole === "GK") return outRole === inRole;
  const a = profile(outRole);
  const b = profile(inRole);
  if (Math.abs(a.line - b.line) > 2) return false;
  if (a.flank * b.flank === -1 && a.flank !== 0) return false;
  return true;
}

export function simOtherScore(homeOvr: number, awayOvr: number, seed: number): [number, number] {
  const rng = mulberry32(seed);
  const poisson = (lambda: number) => {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= rng();
    } while (p > L && k < 8);
    return k - 1;
  };
  const hg = poisson(Math.max(0.35, 1.25 + (homeOvr - awayOvr) / 28));
  const ag = poisson(Math.max(0.3, 1.05 + (awayOvr - homeOvr) / 28));
  return [hg, ag];
}
