import {
  avgOvr,
  clubShape,
  coachRating,
  FORMATIONS,
  leagueIds,
  seasonFixtures,
  simOtherScore,
  slotFit,
  TEAMS,
  teamById,
  tableOf,
  type Fixture,
  type PlayerDef,
  type Role,
} from "./data";
import { diffFromRatings, type DiffId } from "./sim";
import { getLang, tr } from "./i18n";

export type CoachId = "ivanov" | "orlov" | "volkova";

export type CoachCard = {
  id: CoachId;
  name: string;
  title: string;
  titleEn?: string;
  rating: number;
  story: string;
  storyEn?: string;
};

export const COACHES: CoachCard[] = [
  {
    id: "ivanov",
    name: "Сергей Иванов",
    title: "Хозяин раздевалки",
    titleEn: "Dressing-room boss",
    rating: 68,
    story: "Держит состав до последнего тура и не меняет схему после одного плохого вечера.",
    storyEn: "Keeps the same side until the last matchday and does not rip up the shape after one bad night.",
  },
  {
    id: "orlov",
    name: "Роман Орлов",
    title: "Тактик",
    titleEn: "Tactician",
    rating: 75,
    story: "Считает позиции важнее громких трансферов и требует, чтобы линия не разъезжалась.",
    storyEn: "Rates positions above headline signings and demands that the line stays compact.",
  },
  {
    id: "volkova",
    name: "Дмитрий Волков",
    title: "Прессинг",
    titleEn: "Pressing coach",
    rating: 71,
    story: "Любит высокий отбор и короткий розыгрыш, но не прощает пустых рывков без паса.",
    storyEn: "Likes a high tackle and a short combination, but will not forgive empty runs without a pass.",
  },
];

export function coachCopy(card?: CoachCard | null): { name: string; title: string; story: string; rating: number } | null {
  if (!card) return null;
  const live = COACHES.find((c) => c.id === card.id) ?? card;
  return {
    name: live.name,
    rating: live.rating,
    title: tr(live.title, live.titleEn || live.title),
    story: tr(live.story, live.storyEn || live.story),
  };
}

export type Person = {
  id: string;
  teamId: string;
  name: string;
  pos: Role;
  ovr: number;
  speed: number;
  stamina: number;
  num: number;
  age: number;
  form: number;
  fitness: number;
  goals: number;
  apps: number;
  created: boolean;
  wantsMove?: boolean;
};

export type CareerState = {
  v: 2;
  teamId: string;
  budget: number;
  fixtures: Fixture[];
  people: Person[];
  lineup: string[];
  formation: string;
  trainsLeft: number;
  createdId: string;
  bids?: Bid[];
  bidsSettled?: boolean;
  season: number;
  honours: Honour[];
  coach?: CoachCard;
};

export type Honour = {
  season: number;
  place: number;
  pts: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
};

export type Bid = { personId: string; from: string; fee: number };

export type Article = { tag: string; title: string; body: string };

function playerValueBody(p: Person): number {
  const age = p.age <= 23 ? 8_000_000 : p.age >= 32 ? -6_000_000 : 0;
  const form = (p.form - 70) * 180_000;
  return Math.max(2_000_000, Math.round(p.ovr * p.ovr * 11_000 + age + form));
}

export function playerValue(p: Person): number {
  return playerValueBody(p);
}

export function wageOf(p: Person): number {
  return Math.max(80_000, Math.round(p.ovr * p.ovr * 95));
}

export function formatRub(n: number, lang: "ru" | "en" = getLang() === "en" ? "en" : "ru"): string {
  const v = Math.round(n);
  const sign = v < 0 ? "−" : "";
  const abs = Math.abs(v);
  if (lang === "en") {
    const minus = v < 0 ? "-" : "";
    if (abs >= 1_000_000) {
      const m = Math.round((abs / 1_000_000) * 10) / 10;
      return `${minus}$${String(m)}m`;
    }
    if (abs >= 1_000) return `${minus}$${Math.round(abs / 1000)}k`;
    return `${minus}$${abs}`;
  }
  if (abs >= 1_000_000) {
    const m = Math.round((abs / 1_000_000) * 10) / 10;
    return `${sign}${String(m).replace(".", ",")} млн ₽`;
  }
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1000)} тыс. ₽`;
  return `${sign}${abs} ₽`;
}

function clampOvr(n: number) {
  return Math.max(50, Math.min(99, Math.round(n)));
}

export function formLabel(form: number): string {
  if (form >= 85) return tr("Отличная", "Excellent");
  if (form >= 75) return tr("Хорошая", "Good");
  if (form >= 60) return tr("Нормальная", "Normal");
  if (form >= 45) return tr("Спад", "Dip");
  return tr("Кризис", "Crisis");
}

export function peopleOf(c: CareerState, teamId: string): Person[] {
  return c.people.filter((p) => p.teamId === teamId).sort((a, b) => b.ovr - a.ovr || a.num - b.num);
}

export function personById(c: CareerState, id: string): Person | undefined {
  return c.people.find((p) => p.id === id);
}

function freshFromRoster(teamId: string): Person[] {
  return teamById(teamId).roster.map((p, i) => ({
    id: `${teamId}-${p.num}-${i}`,
    teamId,
    name: p.name,
    pos: p.pos,
    ovr: p.ovr,
    speed: p.speed,
    stamina: p.stamina,
    num: p.num,
    age: p.age ?? 24,
    form: 68 + ((p.ovr + i) % 9),
    fitness: 92,
    goals: 0,
    apps: 0,
    created: false,
  }));
}

export function emptyPeople(): Person[] {
  return TEAMS.flatMap((t) => freshFromRoster(t.id));
}

function pickLineup(people: Person[], teamId: string, formation: string, preferId?: string): string[] {
  const slots = FORMATIONS[formation] ?? FORMATIONS["4-3-3"]!;
  const pool = people.filter((p) => p.teamId === teamId).slice();
  const used = new Set<string>();
  const ids: string[] = [];
  if (preferId) {
    const me = pool.find((p) => p.id === preferId);
    const slotIndex = me ? slots.findIndex((s) => s.role === me.pos) : -1;
    if (me && slotIndex >= 0) {
      ids[slotIndex] = me.id;
      used.add(me.id);
    }
  }
  slots.forEach((slot, index) => {
    if (ids[index]) return;
    let best: Person | null = null;
    let bestScore = -999;
    for (const p of pool) {
      if (used.has(p.id)) continue;
      const score = slotFit(p.pos, slot.role) * 10 + (p.pos === slot.role ? 8 : 0) + p.ovr / 20 + p.form / 80;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (!best) return;
    used.add(best.id);
    ids[index] = best.id;
  });
  return ids.filter(Boolean);
}

export function peopleFor(ids: string[]): Person[] {
  return ids.flatMap((id) => freshFromRoster(id));
}

export function lineupFor(people: Person[], teamId: string, formation: string, preferId?: string): string[] {
  return pickLineup(people, teamId, formation, preferId);
}

export function shellCareer(src: { teamId: string; people: Person[]; lineup: string[]; formation: string; trainsLeft: number; budget: number }): CareerState {
  return {
    v: 2,
    teamId: src.teamId,
    budget: src.budget,
    fixtures: [],
    people: src.people,
    lineup: src.lineup,
    formation: src.formation,
    trainsLeft: src.trainsLeft,
    createdId: "",
    season: 1,
    honours: [],
  };
}

function seasonClubIds(teamId: string): string[] {
  const ids = leagueIds(teamId);
  return ids.length >= 2 ? ids : TEAMS.map((t) => t.id);
}

function insertCreated(people: Person[], teamId: string, created: { name: string; pos: Role; num: number }): Person[] {
  const pos: Role = created.pos === "GK" ? "CAM" : created.pos;
  const next = people.map((p) => ({ ...p }));
  const mine = next.filter((p) => p.teamId === teamId);
  const sameRole = mine.filter((p) => p.pos === pos).sort((a, b) => a.ovr - b.ovr);
  const replaced = sameRole[0] ?? [...mine].sort((a, b) => a.ovr - b.ovr)[0];
  if (!replaced) return next;
  const me: Person = {
    id: "created-player",
    teamId,
    name: created.name.trim(),
    pos,
    ovr: 64,
    speed: pos === "ST" || pos === "LW" || pos === "RW" ? 78 : 72,
    stamina: 84,
    num: created.num,
    age: 21,
    form: 76,
    fitness: 100,
    goals: 0,
    apps: 0,
    created: true,
  };
  const clash = next.find((p) => p.teamId === teamId && p.num === me.num && p.id !== replaced.id);
  if (clash) clash.num = replaced.num;
  const idx = next.findIndex((p) => p.id === replaced.id);
  next[idx] = me;
  return next;
}

export function createCareer(teamId: string, created: { name: string; pos: Role; num: number }): CareerState {
  const people = insertCreated(emptyPeople(), teamId, created);
  const formation = "4-3-3";
  return {
    v: 2,
    teamId,
    budget: 95_000_000,
    fixtures: seasonFixtures(seasonClubIds(teamId)),
    people,
    lineup: pickLineup(people, teamId, formation, "created-player"),
    formation,
    trainsLeft: 2,
    createdId: "created-player",
    season: 1,
    honours: [],
  };
}

export function createManagerCareer(teamId: string, coachId?: CoachId | null): CareerState {
  const people = emptyPeople();
  const formation = "4-3-3";
  const coach = COACHES.find((c) => c.id === coachId) ?? COACHES[0];
  return {
    v: 2,
    teamId,
    budget: 140_000_000,
    fixtures: seasonFixtures(seasonClubIds(teamId)),
    people,
    lineup: pickLineup(people, teamId, formation),
    formation,
    trainsLeft: 2,
    createdId: "",
    season: 1,
    honours: [],
    coach,
  };
}

export function adoptPlayer(c: CareerState, created: { name: string; pos: Role; num: number }): CareerState {
  const people = insertCreated(
    c.people.filter((p) => p.id !== "created-player"),
    c.teamId,
    created,
  );
  return {
    ...c,
    people,
    lineup: pickLineup(people, c.teamId, c.formation, "created-player"),
    createdId: "created-player",
  };
}

export function migrateLegacy(raw: { teamId?: string; fixtures?: Fixture[]; budget?: number }): CareerState | null {
  if (!raw.teamId || !Array.isArray(raw.fixtures)) return null;
  const people = emptyPeople();
  return {
    v: 2,
    teamId: raw.teamId,
    budget: raw.budget ?? 90_000_000,
    fixtures: raw.fixtures,
    people,
    lineup: pickLineup(people, raw.teamId, "4-3-3"),
    formation: "4-3-3",
    trainsLeft: 2,
    createdId: "",
    season: 1,
    honours: [],
  };
}

export function toRoster(c: CareerState, teamId: string, lineup?: string[]): PlayerDef[] {
  const squad = peopleOf(c, teamId);
  const mine = teamId === c.teamId;
  const shape = mine && FORMATIONS[c.formation] ? c.formation : clubShape(teamId, 1);
  const picked = new Set(mine && lineup?.length ? lineup : pickLineup(c.people, teamId, shape));
  const order = [...picked].map((id) => squad.find((p) => p.id === id)).filter((p): p is Person => Boolean(p));
  if (!order.some((p) => p.pos === "GK")) {
    const keeper = squad.find((p) => p.pos === "GK" && !order.some((q) => q.id === p.id));
    if (keeper) order.unshift(keeper);
  }
  const rest = squad.filter((p) => !order.some((q) => q.id === p.id)).sort((a, b) => b.fitness - a.fitness || b.ovr - a.ovr);
  const match = [...order.slice(0, 11), ...rest].slice(0, 18);
  return match.map((p) => ({
    id: p.id,
    name: p.name,
    pos: p.pos,
    ovr: p.ovr,
    speed: p.speed,
    stamina: p.stamina,
    num: p.num,
    age: p.age,
    form: p.form,
    fitness: p.fitness,
  }));
}

export function careerLevel(c: CareerState, opponentId: string, asPlayer: boolean): { mine: number; theirs: number; diff: DiffId } {
  const squad = squadOvr(c, c.teamId);
  const me = c.people.find((p) => p.id === c.createdId);
  if (asPlayer) {
    const mine = Math.round((me ? me.ovr * 0.6 + me.form * 0.4 : squad) * 0.75 + squad * 0.25);
    const theirs = squadOvr(c, opponentId);
    return { mine, theirs, diff: diffFromRatings(mine, theirs) };
  }
  const mine = coachRating(c.teamId);
  const theirs = coachRating(opponentId);
  return { mine, theirs, diff: diffFromRatings(mine, theirs) };
}

export function squadOvr(c: CareerState, teamId: string): number {
  const xi = teamId === c.teamId ? c.lineup.map((id) => personById(c, id)).filter((p): p is Person => Boolean(p)) : peopleOf(c, teamId).slice(0, 11);
  if (!xi.length) return avgOvr(teamById(teamId));
  return Math.round(xi.reduce((s, p) => s + p.ovr + (p.form - 70) / 10, 0) / xi.length);
}

export function setFormation(c: CareerState, formation: string): CareerState {
  if (!FORMATIONS[formation]) return c;
  return { ...c, formation, lineup: pickLineup(c.people, c.teamId, formation, c.createdId || undefined) };
}

export function swapLineup(c: CareerState, slotIndex: number, personId: string): CareerState | string {
  const incoming = personById(c, personId);
  if (!incoming || incoming.teamId !== c.teamId) return tr("Игрок не в клубе", "That player is not at the club");
  if (incoming.fitness < 40) return tr("Не готов: мало свежести", "Not ready: freshness is too low");
  const lineup = c.lineup.slice();
  const already = lineup.indexOf(personId);
  const slots = FORMATIONS[c.formation] ?? FORMATIONS["4-3-3"]!;
  const slot = slots[slotIndex];
  if (!slot) return tr("Нет такой позиции", "No such position");
  if (slot.role === "GK" && incoming.pos !== "GK") return tr("В ворота только вратарь", "Only a goalkeeper plays in goal");
  if (slot.role !== "GK" && incoming.pos === "GK") return tr("Вратарь остаётся в воротах", "The goalkeeper stays in goal");
  if (already >= 0) {
    const displaced = lineup[slotIndex];
    lineup[slotIndex] = personId;
    if (displaced && displaced !== personId) lineup[already] = displaced;
  } else {
    lineup[slotIndex] = personId;
  }
  return { ...c, lineup };
}

export function train(c: CareerState, id: string, kind: "form" | "fitness" | "sharp"): CareerState | string {
  if (c.trainsLeft <= 0) return tr("Тренировки на этот тур закончились", "No training left this round");
  const people = c.people.map((p) => ({ ...p }));
  const p = people.find((q) => q.id === id && q.teamId === c.teamId);
  if (!p) return tr("Нет такого игрока", "No such player");
  if (kind === "form") {
    p.form = Math.min(99, p.form + (p.created ? 10 : 8));
    p.fitness = Math.max(40, p.fitness - 4);
  } else if (kind === "fitness") {
    p.fitness = Math.min(100, p.fitness + 16);
  } else {
    if (p.fitness < 55) p.ovr = clampOvr(p.ovr - 1);
    else p.ovr = clampOvr(p.ovr + 1);
    p.form = Math.min(99, p.form + 3);
    p.fitness = Math.max(30, p.fitness - 6);
  }
  return { ...c, people, trainsLeft: c.trainsLeft - 1 };
}

export function buyPlayer(c: CareerState, id: string): CareerState | string {
  const people = c.people.map((p) => ({ ...p }));
  const p = people.find((q) => q.id === id);
  if (!p || p.teamId === c.teamId) return tr("Уже ваш", "Already yours");
  const price = playerValue(p);
  if (c.budget < price) return tr("Не хватает бюджета", "Not enough budget");
  if (peopleOf(c, c.teamId).length >= 22) return tr("В заявке максимум 22", "The squad is full at 22");
  const used = new Set(people.filter((q) => q.teamId === c.teamId).map((q) => q.num));
  p.teamId = c.teamId;
  if (used.has(p.num)) {
    for (let n = 1; n <= 99; n++) {
      if (!used.has(n)) {
        p.num = n;
        break;
      }
    }
  }
  return { ...c, people, budget: c.budget - price };
}

export function sellPlayer(c: CareerState, id: string): CareerState | string {
  if (id === c.createdId) return tr("Себя продать нельзя", "You cannot sell yourself");
  const mine = peopleOf(c, c.teamId);
  if (mine.length <= 16) return tr("Нужно оставить хотя бы 16 игроков", "Keep at least 16 players");
  if (c.lineup.includes(id) && mine.length - 1 < 11) return tr("Сначала уберите из основы", "Take him out of the lineup first");
  const people = c.people.map((p) => ({ ...p }));
  const p = people.find((q) => q.id === id && q.teamId === c.teamId);
  if (!p) return tr("Нет такого игрока", "No such player");
  const buyers = TEAMS.map((t) => t.id).filter((id2) => id2 !== c.teamId);
  const buyer = buyers.slice().sort((a, b) => peopleOf({ ...c, people }, a).length - peopleOf({ ...c, people }, b).length)[0]!;
  p.teamId = buyer;
  let lineup = c.lineup.filter((x) => x !== id);
  if (lineup.length < 11) lineup = pickLineup(people, c.teamId, c.formation, c.createdId || undefined);
  const fee = Math.round(playerValue(p) * 0.82);
  return { ...c, people, lineup, budget: c.budget + fee };
}

function applyScore(fixtures: Fixture[], index: number, hg: number, ag: number): Fixture[] {
  return fixtures.map((f, i) => (i === index ? { ...f, hg, ag } : f));
}

export function simulateIndex(c: CareerState, index: number): CareerState {
  const f = c.fixtures[index];
  if (!f || f.hg !== null) return c;
  const [hg, ag] = simOtherScore(squadOvr(c, f.home), squadOvr(c, f.away), index * 17 + f.home.length * 3);
  return closeIfDone({ ...c, fixtures: applyScore(c.fixtures, index, hg, ag) });
}

export function simulateRoundExcept(c: CareerState, round: number, skipIndex: number | null): CareerState {
  let next = c;
  c.fixtures.forEach((f, i) => {
    if (f.round === round && f.hg === null && i !== skipIndex) next = simulateIndex(next, i);
  });
  return next;
}

export function recordUserMatch(c: CareerState, index: number, hg: number, ag: number, scorerNames: string[], fillRound = false): CareerState {
  const f = c.fixtures[index];
  if (!f || f.hg !== null) return c;
  let next = fillRound ? simulateRoundExcept(c, f.round, index) : c;
  next = { ...next, fixtures: applyScore(next.fixtures, index, hg, ag) };
  const userHome = f.home === c.teamId;
  const gf = userHome ? hg : ag;
  const ga = userHome ? ag : hg;
  const win = gf > ga;
  const people = next.people.map((p) => ({ ...p }));
  const starters = new Set(next.lineup);
  for (const p of people) {
    if (p.teamId !== c.teamId) continue;
    if (starters.has(p.id)) {
      p.apps += 1;
      p.fitness = Math.max(35, p.fitness - 12);
      p.form = clampForm(p.form + (win ? 3 : gf === ga ? 0 : -3));
      if (p.apps % 5 === 0 && p.form >= 80) p.ovr = clampOvr(p.ovr + 1);
      if (p.apps % 5 === 0 && p.form <= 46) p.ovr = clampOvr(p.ovr - 1);
    } else {
      p.fitness = Math.min(100, p.fitness + 8);
      p.form = clampForm(p.form - 1);
    }
  }
  for (const name of scorerNames) {
    const scorer = people.find((p) => p.teamId === c.teamId && p.name === name);
    if (!scorer) continue;
    scorer.goals += 1;
    scorer.form = clampForm(scorer.form + (scorer.created ? 6 : 4));
    if (scorer.goals % 4 === 0) scorer.ovr = clampOvr(scorer.ovr + 1);
  }
  const me = people.find((p) => p.id === next.createdId);
  if (me && starters.has(me.id)) me.form = clampForm(me.form + (win ? 2 : 0));
  const wages = people.filter((p) => p.teamId === c.teamId).reduce((s, p) => s + wageOf(p), 0);
  const prize = win ? 3_500_000 : gf === ga ? 1_600_000 : 700_000;
  return closeIfDone({ ...next, people, budget: next.budget + prize - wages, trainsLeft: 2 });
}

function clampForm(n: number) {
  return Math.max(32, Math.min(99, Math.round(n)));
}

export function forfeitMatch(c: CareerState, index: number): CareerState {
  const f = c.fixtures[index];
  if (!f || f.hg !== null) return c;
  const userHome = f.home === c.teamId;
  return recordUserMatch(c, index, userHome ? 0 : 3, userHome ? 3 : 0, []);
}

export function firstOpenIndex(c: CareerState): number {
  return c.fixtures.findIndex((f) => f.hg === null);
}

export function nextUserFixture(c: CareerState): { fixture: Fixture; index: number } | null {
  const index = c.fixtures.findIndex((f) => (f.home === c.teamId || f.away === c.teamId) && f.hg === null);
  if (index < 0) return null;
  return { fixture: c.fixtures[index]!, index };
}

export function isSeasonOver(c: CareerState): boolean {
  return c.fixtures.length > 0 && c.fixtures.every((f) => f.hg !== null && f.ag !== null);
}

export const SEASON_CAP = 10;

export function seasonRatingBump(place: number, size: number): number {
  if (place === 1) return 2;
  if (place >= 2 && place <= 4) return 1;
  if (size >= 5 && place > size - 4) return -1;
  return 0;
}

export function careerClosed(c: CareerState): boolean {
  return isSeasonOver(c) && (c.season > 0 ? c.season : 1) >= SEASON_CAP;
}

export function ourPlace(c: CareerState): number | null {
  const table = tableOf(c.fixtures);
  const index = table.findIndex((r) => r.id === c.teamId);
  return index < 0 ? null : index + 1;
}

export function careerRecord(c: CareerState) {
  const honours = c.honours ?? [];
  return {
    season: c.season > 0 ? c.season : 1,
    titles: honours.filter((h) => h.place === 1).length,
    podiums: honours.filter((h) => h.place >= 1 && h.place <= 3).length,
    wins: honours.reduce((sum, h) => sum + (h.w || 0), 0),
    honours,
  };
}

export function beginNextSeason(c: CareerState): CareerState | string {
  if (!isSeasonOver(c)) return tr("Новый сезон откроется, когда все команды сыграют друг с другом", "A new season opens when every team has played every other team");
  if (careerClosed(c)) return tr("Десять сезонов позади. Начните карьерный путь заново.", "Ten seasons are behind you. Start the career path again.");
  const table = tableOf(c.fixtures);
  const index = table.findIndex((r) => r.id === c.teamId);
  const row = index >= 0 ? table[index] : undefined;
  const season = c.season > 0 ? c.season : 1;
  const place = index >= 0 ? index + 1 : table.length;
  const bump = seasonRatingBump(place, table.length);
  const honour: Honour = {
    season,
    place,
    pts: row?.pts ?? 0,
    w: row?.w ?? 0,
    d: row?.d ?? 0,
    l: row?.l ?? 0,
    gf: row?.gf ?? 0,
    ga: row?.ga ?? 0,
  };
  const people = c.people.map((p) => {
    const age = p.age + 1;
    let ovr = p.ovr;
    if (age >= 34) ovr = clampOvr(ovr - 1);
    else if (age <= 23 && p.apps >= 10) ovr = clampOvr(ovr + 1);
    if (p.teamId === c.teamId && bump !== 0) ovr = clampOvr(ovr + bump);
    return {
      ...p,
      age,
      ovr,
      wantsMove: false,
      fitness: Math.max(p.fitness, 90),
      form: clampForm(Math.round((p.form + 72) / 2)),
    };
  });
  return normalizeCareer({
    ...c,
    season: season + 1,
    honours: [...(c.honours ?? []), honour],
    people,
    fixtures: seasonFixtures(seasonClubIds(c.teamId)),
    lineup: pickLineup(people, c.teamId, c.formation, c.createdId || undefined),
    trainsLeft: 2,
    bids: [],
    bidsSettled: false,
  });
}

export function championOf(c: CareerState): { id: string; pts: number } | null {
  if (!isSeasonOver(c)) return null;
  const row = tableOf(c.fixtures)[0];
  if (!row) return null;
  return { id: row.id, pts: row.pts };
}

export function simulateRest(c: CareerState): CareerState {
  let next = c;
  c.fixtures.forEach((f, i) => {
    if (f.hg === null) next = simulateIndex(next, i);
  });
  return next;
}

export function requestTransfer(c: CareerState, id: string): CareerState | string {
  if (isSeasonOver(c)) return tr("Сезон закрыт: смотрите предложения клубов", "The season is over: look at the club offers");
  const people = c.people.map((p) => ({ ...p }));
  const p = people.find((q) => q.id === id && q.teamId === c.teamId);
  if (!p) return tr("Нет такого игрока", "No such player");
  p.wantsMove = !p.wantsMove;
  return { ...c, people, bidsSettled: false };
}

export function settleBids(c: CareerState): CareerState {
  if (!isSeasonOver(c) || c.bidsSettled) return c;
  const clubs = TEAMS.map((t) => t.id).filter((id) => id !== c.teamId);
  const bids: Bid[] = [];
  c.people.forEach((p, i) => {
    if (p.teamId !== c.teamId || !p.wantsMove) return;
    const from = clubs[(p.ovr + i * 3) % clubs.length];
    if (!from) return;
    bids.push({ personId: p.id, from, fee: Math.round(playerValue(p) * (p.created ? 1.2 : 0.92)) });
  });
  return { ...c, bids, bidsSettled: true };
}

function closeIfDone(c: CareerState): CareerState {
  return isSeasonOver(c) ? settleBids(c) : c;
}

export function acceptBid(c: CareerState, personId: string): CareerState | string {
  const bid = (c.bids ?? []).find((b) => b.personId === personId);
  if (!bid) return tr("Нет предложения", "No offer");
  if (!isSeasonOver(c)) return tr("Переход только когда все команды сыграли друг с другом", "A move waits until every team has played every other team");
  const people = c.people.map((p) => ({ ...p }));
  const p = people.find((q) => q.id === personId && q.teamId === c.teamId);
  if (!p) return tr("Игрок уже ушёл", "That player has already left");
  p.teamId = bid.from;
  p.wantsMove = false;
  const movingSelf = p.created || p.id === c.createdId;
  let teamId = c.teamId;
  let lineup = c.lineup.filter((id) => id !== personId);
  if (movingSelf) {
    teamId = bid.from;
    lineup = pickLineup(people, teamId, c.formation, p.id);
  } else if (lineup.length < 11) {
    lineup = pickLineup(people, teamId, c.formation, c.createdId || undefined);
  }
  const bids = (c.bids ?? []).filter((b) => b.personId !== personId);
  const bonus = movingSelf ? Math.round(bid.fee * 0.12) : bid.fee;
  return { ...c, people, teamId, lineup, bids, budget: c.budget + bonus };
}

export function normalizeCareer(c: CareerState): CareerState {
  let budget = c.budget;
  if (!Number.isFinite(budget)) budget = 100_000_000;
  if (budget < 500_000) budget = Math.round(budget * 250_000);
  const people = c.people.map((p) => ({
    ...p,
    ovr: clampOvr(p.ovr),
    wantsMove: Boolean(p.wantsMove),
  }));
  const coach = c.coach ? COACHES.find((x) => x.id === c.coach?.id) ?? { ...c.coach, rating: Math.min(75, c.coach.rating) } : undefined;
  const next: CareerState = {
    ...c,
    budget,
    people,
    coach,
    season: c.season > 0 ? c.season : 1,
    honours: cleanHonours(c.honours),
    bids: Array.isArray(c.bids) ? c.bids : [],
    bidsSettled: Boolean(c.bidsSettled),
  };
  return isSeasonOver(next) ? settleBids(next) : next;
}

function cleanHonours(raw: Honour[] | undefined): Honour[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h) => h && typeof h.season === "number" && typeof h.place === "number")
    .map((h) => ({
      season: h.season,
      place: h.place,
      pts: h.pts || 0,
      w: h.w || 0,
      d: h.d || 0,
      l: h.l || 0,
      gf: h.gf || 0,
      ga: h.ga || 0,
    }));
}

export function pressFeed(c: CareerState): Article[] {
  const table = tableOf(c.fixtures);
  const me = teamById(c.teamId);
  const out: Article[] = [];
  const champ = championOf(c);
  const leader = table[0];
  const archive = careerRecord(c);
  const goalsWord = (n: number) => (n === 1 ? tr("гол", "goal") : tr("гола", "goals"));
  if (archive.honours.length) {
    out.push({
      tag: tr("Архив", "Archive"),
      title: tr(`Сезон ${archive.season}: за спиной уже ${archive.honours.length} чемпионата`, `Season ${archive.season}: ${archive.honours.length} championships already behind you`),
      body: tr(`Титулов ${archive.titles}, пьедесталов ${archive.podiums}, побед в закрытых сезонах ${archive.wins}. Клубы игроков после трансферов не откатываются.`, `Titles ${archive.titles}, podiums ${archive.podiums}, wins in closed seasons ${archive.wins}. Clubs stay where transfers left them.`),
    });
  }
  if (champ) {
    const club = teamById(champ.id);
    out.push({
      tag: tr("Кубок", "Trophy"),
      title: champ.id === c.teamId ? tr(`${me.name} поднимают кубок`, `${me.name} lift the trophy`) : tr(`Кубок уезжает к ${club.name}`, `The trophy goes to ${club.name}`),
      body: tr(`Сезон ${c.season > 0 ? c.season : 1} закрыт: каждая команда сыграла с каждой. ${club.name} — ${champ.pts} очков. Можно открыть новый сезон: состав, деньги и уже совершённые переходы останутся.`, `Season ${c.season > 0 ? c.season : 1} is closed: every team has played every other team. ${club.name} finish on ${champ.pts} points. A new season keeps the squad, the money and the moves already made.`),
    });
  } else if (leader) {
    out.push({
      tag: tr("Таблица", "Table"),
      title: tr(`${teamById(leader.id).name} пока впереди`, `${teamById(leader.id).name} lead for now`),
      body: tr(`Кубок ещё никто не получает. Сначала все клубы должны сыграть друг с другом. Сейчас лидирует ${teamById(leader.id).name}: ${leader.pts} очков.`, `Nobody has the trophy yet. Every club must play every other club first. ${teamById(leader.id).name} lead on ${leader.pts} points.`),
    });
  }
  const movers = c.people.filter((p) => p.teamId === c.teamId && p.wantsMove);
  if (movers.length) {
    out.push({
      tag: tr("Трансферы", "Transfers"),
      title: tr("Запросы на уход ждут конца сезона", "Transfer requests wait for the end of the season"),
      body: tr(`${movers.map((p) => `${p.name} (${p.ovr})`).join(", ")} просят трансфер. Сменить клуб можно только когда календарь закрыт.`, `${movers.map((p) => `${p.name} (${p.ovr})`).join(", ")} want a move. A club can be changed only when the calendar is closed.`),
    });
  }
  const scorers = [...c.people].filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals || b.ovr - a.ovr).slice(0, 4);
  for (const p of scorers) {
    out.push({
      tag: tr("Игроки", "Players"),
      title: `${p.name} — ${p.goals} ${goalsWord(p.goals)}`,
      body: tr(`${teamById(p.teamId).name}. Рейтинг ${p.ovr} при потолке 99 и полу 50. Форма ${formLabel(p.form).toLowerCase()}, ${p.apps} матчей.`, `${teamById(p.teamId).name}. Rating ${p.ovr}, capped at 99 and floored at 50. Form ${formLabel(p.form).toLowerCase()}, ${p.apps} matches.`),
    });
  }
  const hot = [...c.people].filter((p) => p.teamId === c.teamId).sort((a, b) => b.form - a.form)[0];
  const cold = [...c.people].filter((p) => p.teamId === c.teamId).sort((a, b) => a.form - b.form)[0];
  if (hot && cold && hot.id !== cold.id) {
    out.push({
      tag: tr("Форма", "Form"),
      title: tr(`${hot.name} в ударе, ${cold.name} тускнеет`, `${hot.name} is sharp, ${cold.name} is fading`),
      body: tr(`Тренировки и протокол двигают рейтинг. У ${hot.name} форма ${hot.form} и рейтинг ${hot.ovr}. У ${cold.name} форма ${cold.form}: без минут и без работы оценка ползёт вниз.`, `Training and the match log move the rating. ${hot.name} is on ${hot.form} form and a ${hot.ovr} rating. ${cold.name} is on ${cold.form}: without minutes and without work the mark slides.`),
    });
  }
  const played = c.fixtures.filter((f) => (f.home === c.teamId || f.away === c.teamId) && f.hg !== null).slice(-3).reverse();
  for (const f of played) {
    const home = teamById(f.home).name;
    const away = teamById(f.away).name;
    const winner = f.hg === f.ag ? "" : f.hg! > f.ag! ? home : away;
    out.push({
      tag: tr("Матч", "Match"),
      title: `${home} ${f.hg}:${f.ag} ${away}`,
      body: tr(`Тур ${f.round + 1}. ${f.hg === f.ag ? "Очки делят." : `${winner} забирают три очка.`}`, `Matchday ${f.round + 1}. ${f.hg === f.ag ? "The points are shared." : `${winner} take three points.`}`),
    });
  }
  if (!out.length) {
    out.push({
      tag: tr("Лига", "League"),
      title: tr(`${me.name} открывают сезон`, `${me.name} open the season`),
      body: tr("Средний рейтинг в лиге около 60–70. Выше 99 не растут, ниже 50 не падают. Кубок — только в конце, когда все сыграли со всеми.", "League ratings sit around 60–70. Nobody grows past 99 or falls under 50. The trophy is given only at the end, when everyone has played everyone."),
    });
  }
  return out.slice(0, 10);
}

export const CREATE_ROLES: Role[] = ["CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
