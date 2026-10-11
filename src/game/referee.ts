import { clubRating, seasonFixtures, simOtherScore, TEAMS } from "./data";

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
  results: { home: string; away: string; hg: number; ag: number }[];
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

const FIXTURES = seasonFixtures(TEAMS.map((t) => t.id)).filter((_, i) => i % 2 === 0).slice(0, 8);

export function createRef(name: string): RefState {
  return {
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
    results: [],
  };
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
  results?: RefState["results"];
} | null): RefState | null {
  if (!data?.name || (data.v != null && data.v !== 1 && data.v !== 2)) return null;
  return {
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
    results: Array.isArray(data.results) ? data.results : [],
  };
}

export function refRank(rating: number): string {
  if (rating >= 88) return "Инспектор лиги";
  if (rating >= 78) return "Федеральный судья";
  if (rating >= 68) return "Судья ЧПЛ";
  if (rating >= 55) return "Ассистент";
  return "Стажёр";
}

export function refFixture(index: number) {
  return FIXTURES[index] ?? null;
}

export function refFixtures() {
  return FIXTURES;
}

export function beginRefSeason(state: RefState): RefState | string {
  if (refFixture(state.nextIndex)) return "Сезон ещё не закрыт: сначала отсудите назначения";
  return {
    ...state,
    season: (state.season > 0 ? state.season : 1) + 1,
    seasonsDone: (state.seasonsDone || 0) + 1,
    nextIndex: 0,
    results: [],
  };
}

export function applyRefMatch(state: RefState, report: RefReport, score?: { hg: number; ag: number }): RefState {
  const fx = refFixture(state.nextIndex);
  const rating = Math.max(50, Math.min(99, Math.round(state.rating + 1 + report.correct * 2 - report.wrong * 3)));
  const results = fx && score ? [...state.results, { home: fx.home, away: fx.away, hg: score.hg, ag: score.ag }] : state.results;
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
  };
}

export function simulateRefMatch(state: RefState): RefState {
  const fx = refFixture(state.nextIndex);
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
