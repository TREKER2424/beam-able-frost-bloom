import { SEASON_CAP } from "./career";
import { clubRating, type Fixture, type LeagueId, seasonFixtures, simOtherScore, TEAMS, teamsIn } from "./data";
import { tr } from "./i18n";

export type RefCupTie = {
  home: string;
  away: string | null;
  hg: number | null;
  ag: number | null;
  ph: number | null;
  pa: number | null;
};

export type RefCupRound = { title: string; ties: RefCupTie[] };

export type RefCup = { round: number; rounds: RefCupRound[]; champion: string | null };

export type RefBoard = {
  nextIndex: number;
  results: { home: string; away: string; hg: number; ag: number }[];
  season: number;
  seasonsDone: number;
};

export type RefState = {
  v: 2;
  name: string;
  rating: number;
  matches: number;
  correct: number;
  wrong: number;
  fouls: number;
  yellows: number;
  reds: number;
  pens: number;
  offsides: number;
  nextIndex: number;
  season: number;
  seasonsDone: number;
  league: LeagueId;
  results: { home: string; away: string; hg: number; ag: number }[];
  boards?: Partial<Record<LeagueId, RefBoard>>;
  cup: RefCup;
  tables?: Partial<Record<LeagueId, Fixture[]>>;
};

export type RefReport = {
  correct: number;
  wrong: number;
  fouls: number;
  yellows: number;
  reds: number;
  pens: number;
  offsides: number;
};

function cardOf(league: LeagueId) {
  return seasonFixtures(teamsIn(league).map((t) => t.id)).filter((_, i) => i % 2 === 0).slice(0, 8);
}

const REF_LEAGUES: LeagueId[] = ["chuvash", "volga", "siberia"];

function freshTable(league: LeagueId): Fixture[] {
  return seasonFixtures(teamsIn(league).map((t) => t.id));
}

function ensureTables(state: RefState): RefState {
  const tables: Partial<Record<LeagueId, Fixture[]>> = { ...(state.tables ?? {}) };
  for (const id of REF_LEAGUES) {
    if (!tables[id]?.length) tables[id] = freshTable(id);
  }
  return { ...state, tables };
}

function paintLeague(state: RefState, league: LeagueId, home: string, away: string, hg: number, ag: number, playedIndex: number) {
  const ready = ensureTables(state);
  const tables = { ...(ready.tables ?? {}) };
  const list = (tables[league] ?? freshTable(league)).map((f) => ({ ...f }));
  const hit = list.find((f) => f.home === home && f.away === away && f.hg === null);
  if (hit) {
    hit.hg = hg;
    hit.ag = ag;
  }
  const round = hit?.round ?? list.find((f) => f.home === home && f.away === away)?.round ?? 0;
  const future = cardOf(league).slice(playedIndex + 1);
  const seed = state.matches * 19 + state.season * 7 + round * 3;
  for (let i = 0; i < list.length; i++) {
    const f = list[i]!;
    if (f.hg !== null || f.round > round) continue;
    if (future.some((a) => a.home === f.home && a.away === f.away)) continue;
    const [sh, sa] = simOtherScore(clubRating(f.home), clubRating(f.away), seed + i * 11);
    f.hg = sh;
    f.ag = sa;
  }
  tables[league] = list;
  return tables;
}

function backfillTables(state: RefState): RefState {
  const next = ensureTables(state);
  const tables = { ...(next.tables ?? {}) };
  for (const id of REF_LEAGUES) {
    const board = id === next.league ? { results: next.results, nextIndex: next.nextIndex } : next.boards?.[id];
    if (!board?.results?.length) continue;
    const list = (tables[id] ?? freshTable(id)).map((f) => ({ ...f }));
    if (list.some((f) => f.hg !== null)) {
      tables[id] = list;
      continue;
    }
    const card = cardOf(id);
    board.results.forEach((row, i) => {
      const fx = card[i];
      if (!fx) return;
      const hit = list.find((f) => f.home === fx.home && f.away === fx.away && f.hg === null);
      if (hit) {
        hit.hg = row.hg;
        hit.ag = row.ag;
      }
    });
    const lastFx = card[board.results.length - 1];
    const round = lastFx ? (list.find((f) => f.home === lastFx.home && f.away === lastFx.away)?.round ?? 0) : -1;
    if (round >= 0) {
      const future = card.slice(board.nextIndex ?? board.results.length);
      for (let i = 0; i < list.length; i++) {
        const f = list[i]!;
        if (f.hg !== null || f.round > round) continue;
        if (future.some((a) => a.home === f.home && a.away === f.away)) continue;
        const [sh, sa] = simOtherScore(clubRating(f.home), clubRating(f.away), 400 + i * 11 + round);
        f.hg = sh;
        f.ag = sa;
      }
    }
    tables[id] = list;
  }
  return { ...next, tables };
}

export function refTable(state: RefState, league: LeagueId): Fixture[] {
  return state.tables?.[league]?.length ? state.tables[league]! : freshTable(league);
}

export function createRef(name: string, league: LeagueId = "chuvash"): RefState {
  return ensureTables({
    v: 2,
    name: name.trim() || "А. Судейкин",
    rating: 62,
    matches: 0,
    correct: 0,
    wrong: 0,
    fouls: 0,
    yellows: 0,
    reds: 0,
    pens: 0,
    offsides: 0,
    nextIndex: 0,
    season: 1,
    seasonsDone: 0,
    league,
    results: [],
    boards: {},
    cup: buildRefCup(name),
  });
}

export function reviveRef(data: {
  v?: number;
  name?: string;
  rating?: number;
  matches?: number;
  correct?: number;
  wrong?: number;
  fouls?: number;
  yellows?: number;
  reds?: number;
  pens?: number;
  offsides?: number;
  nextIndex?: number;
  season?: number;
  seasonsDone?: number;
  league?: LeagueId;
  results?: RefState["results"];
  boards?: RefState["boards"];
  cup?: RefCup;
  tables?: RefState["tables"];
} | null): RefState | null {
  if (!data?.name || (data.v != null && data.v !== 1 && data.v !== 2)) return null;
  const base: RefState = {
    v: 2,
    name: data.name,
    rating: Math.max(50, Math.min(99, data.rating ?? 62)),
    matches: data.matches ?? 0,
    correct: data.correct ?? 0,
    wrong: data.wrong ?? 0,
    fouls: data.fouls ?? 0,
    yellows: data.yellows ?? 0,
    reds: data.reds ?? 0,
    pens: data.pens ?? 0,
    offsides: data.offsides ?? 0,
    nextIndex: data.nextIndex ?? 0,
    season: data.season && data.season > 0 ? data.season : 1,
    seasonsDone: data.seasonsDone ?? 0,
    league: data.league === "volga" || data.league === "siberia" ? data.league : "chuvash",
    results: Array.isArray(data.results) ? data.results : [],
    boards: data.boards && typeof data.boards === "object" ? data.boards : {},
    cup: data.cup?.rounds?.length ? data.cup : buildRefCup(data.name),
    tables: data.tables,
  };
  return backfillTables(base);
}

export function refRank(rating: number): string {
  if (rating >= 88) return tr("Инспектор лиги", "League inspector");
  if (rating >= 78) return tr("Федеральный судья", "Federal referee");
  if (rating >= 68) return tr("Судья лиги", "League referee");
  if (rating >= 55) return tr("Ассистент", "Assistant");
  return tr("Стажёр", "Trainee");
}

export function refFixture(index: number, league: LeagueId = "chuvash") {
  return cardOf(league)[index] ?? null;
}

export function refFixtures(league: LeagueId = "chuvash") {
  return cardOf(league);
}

export function refCareerDone(state: RefState): boolean {
  return !refFixture(state.nextIndex, state.league) && (state.season > 0 ? state.season : 1) >= SEASON_CAP;
}

export function beginRefSeason(state: RefState): RefState | string {
  if (refFixture(state.nextIndex, state.league)) return tr("Сезон ещё не закрыт: сначала отсудите назначения", "The season is not closed yet: referee the appointments first");
  if (refCareerDone(state)) return tr("Десять сезонов позади. Начните судейский путь заново.", "Ten seasons are behind you. Start the refereeing path again.");
  const ready = ensureTables(state);
  const tables = { ...(ready.tables ?? {}) };
  tables[state.league] = freshTable(state.league);
  return {
    ...state,
    season: (state.season > 0 ? state.season : 1) + 1,
    seasonsDone: (state.seasonsDone || 0) + 1,
    nextIndex: 0,
    results: [],
    tables,
  };
}

export function applyRefMatch(state: RefState, report: RefReport, score?: { hg: number; ag: number }): RefState {
  const fx = refFixture(state.nextIndex, state.league);
  const rating = Math.max(50, Math.min(99, Math.round(state.rating + 1 + report.correct * 2 - report.wrong * 3)));
  const results = fx && score ? [...state.results, { home: fx.home, away: fx.away, hg: score.hg, ag: score.ag }] : state.results;
  const tables = fx && score ? paintLeague(state, state.league, fx.home, fx.away, score.hg, score.ag, state.nextIndex) : ensureTables(state).tables;
  return {
    ...state,
    v: 2,
    rating,
    matches: state.matches + 1,
    correct: state.correct + report.correct,
    wrong: state.wrong + report.wrong,
    fouls: state.fouls + report.fouls,
    yellows: state.yellows + report.yellows,
    reds: state.reds + report.reds,
    pens: state.pens + report.pens,
    offsides: state.offsides + report.offsides,
    nextIndex: state.nextIndex + 1,
    results,
    tables,
  };
}

export function simulateRefMatch(state: RefState): RefState {
  const fx = refFixture(state.nextIndex, state.league);
  if (!fx) return state;
  const seed = state.matches * 17 + state.rating;
  const [hg, ag] = simOtherScore(clubRating(fx.home), clubRating(fx.away), seed);
  return applyRefMatch(
    state,
    {
      correct: 4 + (seed % 5),
      wrong: seed % 4 === 0 ? 2 : seed % 2,
      fouls: 10 + (seed % 8),
      yellows: 2 + (seed % 4),
      reds: seed % 5 === 0 ? 1 : 0,
      pens: seed % 3 === 0 ? 1 : 0,
      offsides: 1 + (seed % 4),
    },
    { hg, ag },
  );
}

export function setRefLeague(state: RefState, league: LeagueId): RefState {
  if (state.league === league) return state;
  const boards = { ...(state.boards ?? {}) };
  boards[state.league] = {
    nextIndex: state.nextIndex,
    results: state.results,
    season: state.season,
    seasonsDone: state.seasonsDone,
  };
  const saved = boards[league];
  return {
    ...state,
    league,
    boards,
    nextIndex: saved?.nextIndex ?? 0,
    results: saved?.results ?? [],
    season: saved?.season ?? 1,
    seasonsDone: saved?.seasonsDone ?? 0,
  };
}

export function refCupAssignment(state: RefState): { index: number; home: string; away: string; title: string } | null {
  const round = state.cup.rounds[state.cup.round];
  if (!round || state.cup.champion) return null;
  const index = round.ties.findIndex((t) => t.away && t.hg === null);
  const tie = index >= 0 ? round.ties[index] : null;
  if (!tie?.away) return null;
  return { index, home: tie.home, away: tie.away, title: round.title };
}

export function applyRefCup(state: RefState, index: number, report: RefReport, score: { hg: number; ag: number }): RefState {
  const rated = applyRefStats(state, report);
  const rounds = state.cup.rounds.map((round) => ({ ...round, ties: round.ties.map((tie) => ({ ...tie })) }));
  const round = rounds[state.cup.round];
  const tie = round?.ties[index];
  if (!round || !tie?.away || tie.hg !== null) return rated;
  const nextTie = finishRefTie(tie, score.hg, score.ag);
  round.ties[index] = nextTie;
  return advanceRefCup({ ...rated, cup: { ...state.cup, rounds } });
}

export function simulateRefCupOthers(state: RefState): RefState {
  const rounds = state.cup.rounds.map((round) => ({ ...round, ties: round.ties.map((tie) => ({ ...tie })) }));
  const round = rounds[state.cup.round];
  if (!round) return state;
  const focus = round.ties.findIndex((t) => t.away && t.hg === null);
  round.ties = round.ties.map((tie, i) => {
    if (!tie.away || tie.hg !== null || i === focus) return tie;
    const [hg, ag] = simOtherScore(clubRating(tie.home), clubRating(tie.away), state.matches * 9 + i * 5 + state.cup.round);
    return finishRefTie(tie, hg, ag);
  });
  return advanceRefCup({ ...state, cup: { ...state.cup, rounds } });
}

function applyRefStats(state: RefState, report: RefReport): RefState {
  const rating = Math.max(50, Math.min(99, Math.round(state.rating + 1 + report.correct * 2 - report.wrong * 3)));
  return {
    ...state,
    v: 2,
    rating,
    matches: state.matches + 1,
    correct: state.correct + report.correct,
    wrong: state.wrong + report.wrong,
    fouls: state.fouls + report.fouls,
    yellows: state.yellows + report.yellows,
    reds: state.reds + report.reds,
    pens: state.pens + report.pens,
    offsides: state.offsides + report.offsides,
  };
}

function finishRefTie(tie: RefCupTie, hg: number, ag: number): RefCupTie {
  if (!tie.away) return tie;
  if (hg !== ag) return { ...tie, hg, ag, ph: null, pa: null };
  const homeWins = clubRating(tie.home) >= clubRating(tie.away);
  return { ...tie, hg, ag, ph: homeWins ? 5 : 4, pa: homeWins ? 4 : 5 };
}

function refTieWinner(tie: RefCupTie): string | null {
  if (!tie.away) return tie.home;
  if (tie.hg === null || tie.ag === null) return null;
  if (tie.ph != null && tie.pa != null && tie.ph !== tie.pa) return tie.ph > tie.pa ? tie.home : tie.away;
  if (tie.hg === tie.ag) return null;
  return tie.hg > tie.ag ? tie.home : tie.away;
}

function advanceRefCup(state: RefState): RefState {
  const round = state.cup.rounds[state.cup.round];
  if (!round || round.ties.some((t) => refTieWinner(t) === null)) return state;
  const winners = round.ties.map(refTieWinner).filter((id): id is string => Boolean(id));
  if (winners.length <= 1) return { ...state, cup: { ...state.cup, champion: winners[0] ?? null } };
  const next = pairRefRound(winners, state.cup.round * 97 + winners.join("").length);
  return { ...state, cup: { ...state.cup, rounds: [...state.cup.rounds, next], round: state.cup.round + 1 } };
}

function buildRefCup(name: string): RefCup {
  let seed = 2166136261;
  for (const ch of name) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619);
  return { round: 0, rounds: [pairRefRound(TEAMS.map((t) => t.id), seed >>> 0 || 1)], champion: null };
}

function pairRefRound(ids: string[], seed: number): RefCupRound {
  const title = ids.length > 16 ? "Отборочный раунд" : ids.length > 8 ? "1/8 финала" : ids.length > 4 ? "1/4 финала" : ids.length > 2 ? "1/2 финала" : "Финал";
  const sorted = ids.slice().sort((a, b) => clubRating(b) - clubRating(a) || a.localeCompare(b));
  const byeN = ids.length > 16 ? ids.length - 16 : 0;
  const byes = sorted.slice(0, byeN);
  let play = sorted.slice(byeN);
  const mixed: string[] = [];
  for (let i = 0; i < play.length; i += 4) mixed.push(...mixIds(play.slice(i, i + 4), seed + i * 17));
  play = mixed;
  const ties: RefCupTie[] = byes.map((home) => ({ home, away: null, hg: 0, ag: 0, ph: null, pa: null }));
  if (play.length % 2 === 1) {
    ties.push({ home: play[0]!, away: null, hg: 0, ag: 0, ph: null, pa: null });
    play = play.slice(1);
  }
  for (let i = 0; i < play.length; i += 2) {
    ties.push({ home: play[i]!, away: play[i + 1]!, hg: null, ag: null, ph: null, pa: null });
  }
  return { title, ties };
}

function mixIds(list: string[], seed: number): string[] {
  const next = list.slice();
  let a = seed >>> 0;
  const roll = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    const swap = next[i]!;
    next[i] = next[j]!;
    next[j] = swap;
  }
  return next;
}
