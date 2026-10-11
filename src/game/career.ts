import {
  avgOvr,
  coachRating,
  FORMATIONS,
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

export function formatRub(n: number): string {
  const v = Math.round(n);
  const sign = v < 0 ? "−" : "";
  const abs = Math.abs(v);
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
  if (form >= 85) return "Отличная";
  if (form >= 75) return "Хорошая";
  if (form >= 60) return "Нормальная";
  if (form >= 45) return "Спад";
  return "Кризис";
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

function insertCreated(people: Person[], teamId: string, created: { name: string; pos: Role; num: number }): Person[] {
  const next = people.map((p) => ({ ...p }));
  const mine = next.filter((p) => p.teamId === teamId);
  const sameRole = mine.filter((p) => p.pos === created.pos).sort((a, b) => a.ovr - b.ovr);
  const replaced = sameRole[0] ?? [...mine].sort((a, b) => a.ovr - b.ovr)[0];
  if (!replaced) return next;
  const me: Person = {
    id: "created-player",
    teamId,
    name: created.name.trim(),
    pos: created.pos,
    ovr: 64,
    speed: created.pos === "GK" ? 62 : created.pos === "ST" || created.pos === "LW" || created.pos === "RW" ? 78 : 72,
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
    fixtures: seasonFixtures(TEAMS.map((t) => t.id)),
    people,
    lineup: pickLineup(people, teamId, formation, "created-player"),
    formation,
    trainsLeft: 2,
    createdId: "created-player",
    season: 1,
    honours: [],
  };
}

export function createManagerCareer(teamId: string): CareerState {
  const people = emptyPeople();
  const formation = "4-3-3";
  return {
    v: 2,
    teamId,
    budget: 140_000_000,
    fixtures: seasonFixtures(TEAMS.map((t) => t.id)),
    people,
    lineup: pickLineup(people, teamId, formation),
    formation,
    trainsLeft: 2,
    createdId: "",
    season: 1,
    honours: [],
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
  const order = teamId === c.teamId && lineup?.length ? lineup.map((id) => squad.find((p) => p.id === id)).filter((p): p is Person => Boolean(p)) : squad.slice(0, 11);
  const rest = squad.filter((p) => !order.some((q) => q.id === p.id)).sort((a, b) => b.fitness - a.fitness || b.ovr - a.ovr);
  const match = [...order, ...rest].slice(0, 18);
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
  const theirs = squadOvr(c, opponentId);
  const me = c.people.find((p) => p.id === c.createdId);
  const mine = asPlayer
    ? Math.round((me ? me.ovr * 0.6 + me.form * 0.4 : squad) * 0.75 + squad * 0.25)
    : Math.round(squad * 0.6 + coachRating(c.teamId) * 0.4);
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
  if (!incoming || incoming.teamId !== c.teamId) return "Игрок не в клубе";
  if (incoming.fitness < 40) return "Не готов: мало свежести";
  const lineup = c.lineup.slice();
  const already = lineup.indexOf(personId);
  const slots = FORMATIONS[c.formation] ?? FORMATIONS["4-3-3"]!;
  const slot = slots[slotIndex];
  if (!slot) return "Нет такой позиции";
  if (slot.role === "GK" && incoming.pos !== "GK") return "В ворота только вратарь";
  if (slot.role !== "GK" && incoming.pos === "GK") return "Вратарь остаётся в воротах";
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
  if (c.trainsLeft <= 0) return "Тренировки на этот тур закончились";
  const people = c.people.map((p) => ({ ...p }));
  const p = people.find((q) => q.id === id && q.teamId === c.teamId);
  if (!p) return "Нет такого игрока";
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
  if (!p || p.teamId === c.teamId) return "Уже ваш";
  const price = playerValue(p);
  if (c.budget < price) return "Не хватает бюджета";
  if (peopleOf(c, c.teamId).length >= 22) return "В заявке максимум 22";
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
  if (id === c.createdId) return "Себя продать нельзя";
  const mine = peopleOf(c, c.teamId);
  if (mine.length <= 16) return "Нужно оставить хотя бы 16 игроков";
  if (c.lineup.includes(id) && mine.length - 1 < 11) return "Сначала уберите из основы";
  const people = c.people.map((p) => ({ ...p }));
  const p = people.find((q) => q.id === id && q.teamId === c.teamId);
  if (!p) return "Нет такого игрока";
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
  if (!isSeasonOver(c)) return "Новый сезон откроется, когда все команды сыграют друг с другом";
  const table = tableOf(c.fixtures);
  const index = table.findIndex((r) => r.id === c.teamId);
  const row = index >= 0 ? table[index] : undefined;
  const season = c.season > 0 ? c.season : 1;
  const honour: Honour = {
    season,
    place: index >= 0 ? index + 1 : table.length,
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
    fixtures: seasonFixtures(TEAMS.map((t) => t.id)),
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
  if (isSeasonOver(c)) return "Сезон закрыт: смотрите предложения клубов";
  const people = c.people.map((p) => ({ ...p }));
  const p = people.find((q) => q.id === id && q.teamId === c.teamId);
  if (!p) return "Нет такого игрока";
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
  if (!bid) return "Нет предложения";
  if (!isSeasonOver(c)) return "Переход только когда все команды сыграли друг с другом";
  const people = c.people.map((p) => ({ ...p }));
  const p = people.find((q) => q.id === personId && q.teamId === c.teamId);
  if (!p) return "Игрок уже ушёл";
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
  const next: CareerState = {
    ...c,
    budget,
    people,
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
  if (archive.honours.length) {
    out.push({
      tag: "Архив",
      title: `Сезон ${archive.season}: за спиной уже ${archive.honours.length} чемпионата`,
      body: `Титулов ${archive.titles}, пьедесталов ${archive.podiums}, побед в закрытых сезонах ${archive.wins}. Клубы игроков после трансферов не откатываются.`,
    });
  }
  if (champ) {
    const club = teamById(champ.id);
    out.push({
      tag: "Кубок",
      title: champ.id === c.teamId ? `${me.name} поднимают кубок` : `Кубок уезжает к ${club.name}`,
      body: `Сезон ${c.season > 0 ? c.season : 1} закрыт: каждая команда сыграла с каждой. ${club.name} — ${champ.pts} очков. Можно открыть новый сезон: состав, деньги и уже совершённые переходы останутся.`,
    });
  } else if (leader) {
    out.push({
      tag: "Таблица",
      title: `${teamById(leader.id).name} пока впереди`,
      body: `Кубок ещё никто не получает. Сначала все клубы должны сыграть друг с другом. Сейчас лидирует ${teamById(leader.id).name}: ${leader.pts} очков.`,
    });
  }
  const movers = c.people.filter((p) => p.teamId === c.teamId && p.wantsMove);
  if (movers.length) {
    out.push({
      tag: "Трансферы",
      title: "Запросы на уход ждут конца сезона",
      body: `${movers.map((p) => `${p.name} (${p.ovr})`).join(", ")} просят трансфер. Сменить клуб можно только когда календарь закрыт.`,
    });
  }
  const scorers = [...c.people].filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals || b.ovr - a.ovr).slice(0, 4);
  for (const p of scorers) {
    out.push({
      tag: "Игроки",
      title: `${p.name} — ${p.goals} ${p.goals === 1 ? "гол" : "гола"}`,
      body: `${teamById(p.teamId).name}. Рейтинг ${p.ovr} при потолке 99 и полу 50. Форма ${formLabel(p.form).toLowerCase()}, ${p.apps} матчей.`,
    });
  }
  const hot = [...c.people].filter((p) => p.teamId === c.teamId).sort((a, b) => b.form - a.form)[0];
  const cold = [...c.people].filter((p) => p.teamId === c.teamId).sort((a, b) => a.form - b.form)[0];
  if (hot && cold && hot.id !== cold.id) {
    out.push({
      tag: "Форма",
      title: `${hot.name} в ударе, ${cold.name} тускнеет`,
      body: `Тренировки и протокол двигают рейтинг. У ${hot.name} форма ${hot.form} и рейтинг ${hot.ovr}. У ${cold.name} форма ${cold.form}: без минут и без работы оценка ползёт вниз.`,
    });
  }
  const played = c.fixtures.filter((f) => (f.home === c.teamId || f.away === c.teamId) && f.hg !== null).slice(-3).reverse();
  for (const f of played) {
    const home = teamById(f.home).name;
    const away = teamById(f.away).name;
    const winner = f.hg === f.ag ? "" : f.hg! > f.ag! ? home : away;
    out.push({
      tag: "Матч",
      title: `${home} ${f.hg}:${f.ag} ${away}`,
      body: `Тур ${f.round + 1}. ${f.hg === f.ag ? "Очки делят." : `${winner} забирают три очка.`}`,
    });
  }
  if (!out.length) {
    out.push({
      tag: "Лига",
      title: `${me.name} открывают сезон`,
      body: "Средний рейтинг в лиге около 60–70. Выше 99 не растут, ниже 50 не падают. Кубок — только в конце, когда все сыграли со всеми.",
    });
  }
  return out.slice(0, 10);
}

export const CREATE_ROLES: Role[] = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
