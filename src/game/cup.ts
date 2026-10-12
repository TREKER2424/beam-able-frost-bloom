import { clubRating, simOtherScore, TEAMS, teamById } from "./data";
import { lineupFor, peopleFor, setFormation, shellCareer, swapLineup, train, type Person } from "./career";
import { tr } from "./i18n";

export type RoundId = "prelim" | "r16" | "qf" | "sf" | "final";

export type CupTie = {
  home: string;
  away: string | null;
  hg: number | null;
  ag: number | null;
  ph: number | null;
  pa: number | null;
};

export type CupRound = {
  id: RoundId;
  title: string;
  ties: CupTie[];
};

export type CupState = {
  v: 1;
  teamId: string;
  budget: number;
  people: Person[];
  lineup: string[];
  formation: string;
  trainsLeft: number;
  rounds: CupRound[];
  round: number;
  out: boolean;
  champion: string | null;
  seenCutscene: boolean;
};

const TITLES: Record<RoundId, string> = {
  prelim: "Отборочный раунд",
  r16: "1/8 финала",
  qf: "1/4 финала",
  sf: "1/2 финала",
  final: "Финал",
};

export function roundTitle(id: RoundId): string {
  if (id === "prelim") return tr("Отборочный раунд", "Preliminary round");
  if (id === "r16") return tr("1/8 финала", "Round of 16");
  if (id === "qf") return tr("1/4 финала", "Quarter-final");
  if (id === "sf") return tr("1/2 финала", "Semi-final");
  return tr("Финал", "Final");
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], seed: number): T[] {
  const next = list.slice();
  const roll = rng(seed);
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    const swap = next[i]!;
    next[i] = next[j]!;
    next[j] = swap;
  }
  return next;
}

export function cupStrength(id: string, people: Person[]): number {
  const xi = people.filter((p) => p.teamId === id).sort((a, b) => b.ovr - a.ovr).slice(0, 11);
  if (!xi.length) return clubRating(id);
  const ovr = xi.reduce((s, p) => s + p.ovr, 0) / xi.length;
  const form = xi.reduce((s, p) => s + p.form, 0) / xi.length;
  return ovr + (form - 70) * 0.22;
}

function roundKind(count: number): RoundId {
  if (count > 16) return "prelim";
  if (count > 8) return "r16";
  if (count > 4) return "qf";
  if (count > 2) return "sf";
  return "final";
}

function pairRound(ids: string[], people: Person[], seed: number): CupRound {
  const id = roundKind(ids.length);
  const sorted = ids.slice().sort((a, b) => cupStrength(b, people) - cupStrength(a, people) || a.localeCompare(b));
  const byeN = id === "prelim" ? Math.max(0, sorted.length - 16) : 0;
  const byes = sorted.slice(0, byeN);
  let play = sorted.slice(byeN);
  const mixed: string[] = [];
  for (let i = 0; i < play.length; i += 4) mixed.push(...shuffle(play.slice(i, i + 4), seed + i * 17 + id.length));
  play = mixed;
  const ties: CupTie[] = byes.map((home) => ({ home, away: null, hg: 0, ag: 0, ph: null, pa: null }));
  if (play.length % 2 === 1) {
    ties.push({ home: play[0]!, away: null, hg: 0, ag: 0, ph: null, pa: null });
    play = play.slice(1);
  }
  for (let i = 0; i < play.length; i += 2) {
    ties.push({ home: play[i]!, away: play[i + 1]!, hg: null, ag: null, ph: null, pa: null });
  }
  return { id, title: TITLES[id], ties };
}

export function tieWinner(tie: CupTie): string | null {
  if (!tie.away) return tie.home;
  if (tie.hg === null || tie.ag === null) return null;
  if (tie.ph != null && tie.pa != null && tie.ph !== tie.pa) return tie.ph > tie.pa ? tie.home : tie.away;
  if (tie.hg === tie.ag) return null;
  return tie.hg > tie.ag ? tie.home : tie.away;
}

export function createCup(teamId: string): CupState {
  const ids = TEAMS.map((t) => t.id);
  const people = peopleFor(ids);
  const seed = (Date.now() ^ teamId.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0)) >>> 0;
  return {
    v: 1,
    teamId,
    budget: 25_000_000,
    people,
    lineup: lineupFor(people, teamId, "4-3-3"),
    formation: "4-3-3",
    trainsLeft: 2,
    rounds: [pairRound(ids, people, seed || 1)],
    round: 0,
    out: false,
    champion: null,
    seenCutscene: false,
  };
}

export function currentRound(state: CupState): CupRound {
  return state.rounds[Math.min(state.round, state.rounds.length - 1)]!;
}

export function userTieIndex(state: CupState): number {
  if (state.out || state.champion) return -1;
  return currentRound(state).ties.findIndex((t) => (t.home === state.teamId || t.away === state.teamId) && t.hg === null);
}

function withRound(state: CupState, ties: CupTie[]): CupState {
  const rounds = state.rounds.slice();
  const round = rounds[state.round];
  if (!round) return state;
  rounds[state.round] = { ...round, ties };
  return { ...state, rounds };
}

function touchSide(people: Person[], teamId: string, win: boolean, lineup?: string[]): Person[] {
  const starters = new Set(lineup ?? []);
  let left = 11;
  return people.map((p) => {
    if (p.teamId !== teamId) return p;
    const start = starters.size ? starters.has(p.id) : left > 0 && (left -= 1, true);
    if (!start) return { ...p, fitness: Math.min(100, p.fitness + 6) };
    return {
      ...p,
      apps: p.apps + 1,
      fitness: Math.max(35, p.fitness - 10),
      form: Math.max(32, Math.min(99, p.form + (win ? 4 : -3))),
    };
  });
}

function scoreOpen(tie: CupTie, people: Person[], seed: number): CupTie {
  if (!tie.away || tie.hg !== null) return tie;
  const [rawH, rawA] = simOtherScore(cupStrength(tie.home, people), cupStrength(tie.away, people), seed);
  return finishScore(tie, rawH, rawA, people);
}

function finishScore(tie: CupTie, hg: number, ag: number, people: Person[]): CupTie {
  if (!tie.away) return tie;
  if (hg !== ag) return { ...tie, hg, ag, ph: null, pa: null };
  const homeWins = cupStrength(tie.home, people) >= cupStrength(tie.away, people);
  return { ...tie, hg, ag, ph: homeWins ? 5 : 4, pa: homeWins ? 4 : 5 };
}

function advance(state: CupState): CupState {
  const round = state.rounds[state.round];
  if (!round || round.ties.some((t) => tieWinner(t) === null)) return state;
  const winners = round.ties.map((t) => tieWinner(t)).filter((id): id is string => Boolean(id));
  const alive = winners.includes(state.teamId);
  if (round.id === "final") {
    return { ...state, champion: winners[0] ?? null, out: !alive };
  }
  const next = pairRound(winners, state.people, (state.round + 3) * 97 + winners.join("").length);
  return {
    ...state,
    out: state.out || !alive,
    rounds: [...state.rounds, next],
    round: state.round + 1,
    trainsLeft: 2,
  };
}

function playRest(state: CupState): CupState {
  let next = state;
  for (let guard = 0; guard < 8 && !next.champion; guard++) {
    const round = next.rounds[next.round];
    if (!round) break;
    const ties = round.ties.map((tie, i) => scoreOpen(tie, next.people, next.round * 100 + i * 13 + 5));
    next = withRound(next, ties);
    if (ties.some((t) => tieWinner(t) === null)) break;
    const before = next.round;
    next = advance(next);
    if (next.round === before && !next.champion) break;
  }
  return next;
}

function afterScore(state: CupState, ties: CupTie[]): CupState {
  let next = withRound(state, ties);
  const mine = ties.find((t) => t.home === state.teamId || t.away === state.teamId);
  if (mine && tieWinner(mine) && tieWinner(mine) !== state.teamId) next = { ...next, out: true };
  if (next.out) return playRest(next);
  if (ties.every((t) => tieWinner(t))) return advance(next);
  return next;
}

export function simulateTie(state: CupState, index: number): CupState {
  const ties = currentRound(state).ties.slice();
  const tie = ties[index];
  if (!tie) return state;
  ties[index] = scoreOpen(tie, state.people, state.round * 80 + index * 19 + state.teamId.length);
  const played = ties[index]!;
  let people = state.people;
  if (played.away && played.hg !== null && played.ag !== null) {
    const homeWin = tieWinner(played) === played.home;
    people = touchSide(people, played.home, homeWin);
    people = touchSide(people, played.away, !homeWin);
  }
  return afterScore({ ...state, people }, ties);
}

export function simulateOthers(state: CupState): CupState {
  const ties = currentRound(state).ties.map((tie, i) => {
    const user = tie.home === state.teamId || tie.away === state.teamId;
    if (user && !state.out) return tie;
    return scoreOpen(tie, state.people, state.round * 50 + i * 11);
  });
  return afterScore(state, ties);
}

export function recordCupScore(state: CupState, index: number, hg: number, ag: number, scorers: string[] = []): CupState {
  const ties = currentRound(state).ties.slice();
  const tie = ties[index];
  if (!tie?.away || tie.hg !== null) return state;
  const played = finishScore(tie, hg, ag, state.people);
  ties[index] = played;
  const userHome = tie.home === state.teamId;
  const win = tieWinner(played) === state.teamId;
  let people = touchSide(state.people, state.teamId, win, state.lineup);
  people = touchSide(people, userHome ? tie.away : tie.home, !win);
  for (const name of scorers) {
    people = people.map((p) => (p.teamId === state.teamId && p.name === name ? { ...p, goals: p.goals + 1, form: Math.min(99, p.form + 4) } : p));
  }
  const prize = win ? 4_000_000 : 800_000;
  const wages = people.filter((p) => p.teamId === state.teamId).length * 180_000;
  return afterScore({ ...state, people, budget: Math.max(0, state.budget + prize - wages), trainsLeft: 2 }, ties);
}

export function forfeitCup(state: CupState): CupState {
  const index = userTieIndex(state);
  if (index < 0) return state;
  const tie = currentRound(state).ties[index];
  if (!tie?.away) return state;
  const userHome = tie.home === state.teamId;
  return recordCupScore(state, index, userHome ? 0 : 3, userHome ? 3 : 0);
}

export function trainCup(state: CupState, id: string, kind: "form" | "fitness" | "sharp"): CupState | string {
  const next = train(shellCareer(state), id, kind);
  if (typeof next === "string") return next;
  return { ...state, people: next.people, trainsLeft: next.trainsLeft };
}

export function shapeCup(state: CupState, formation: string): CupState {
  const next = setFormation(shellCareer(state), formation);
  return { ...state, formation: next.formation, lineup: next.lineup };
}

export function swapCup(state: CupState, slot: number, personId: string): CupState | string {
  const next = swapLineup(shellCareer(state), slot, personId);
  if (typeof next === "string") return next;
  return { ...state, lineup: next.lineup };
}

export function cupPress(state: CupState): { tag: string; title: string; body: string }[] {
  const me = teamById(state.teamId);
  const round = currentRound(state);
  const stage = roundTitle(round.id);
  const out: { tag: string; title: string; body: string }[] = [];
  const mine = state.rounds.flatMap((r) => r.ties).filter((t) => t.away && (t.home === state.teamId || t.away === state.teamId) && t.hg !== null);
  const last = mine[mine.length - 1];
  if (state.champion) {
    const holder = teamById(state.champion);
    out.push({
      tag: tr("Финал", "Final"),
      title: state.champion === state.teamId
        ? tr(`${me.name} поднимают Кубок России`, `${me.name} lift the Russian Cup`)
        : tr(`${me.name} смотрят, как кубок забирает ${holder.name}`, `${me.name} watch ${holder.name} take the cup`),
      body: state.champion === state.teamId
        ? tr(`Сетка из 24 клубов закрыта. ${me.name} прошли её тем составом, с которым начинали: трансферов в кубке нет. В раздевалке говорят не про чужой финал, а про свой последний свисток.`, `A bracket of 24 clubs is closed. ${me.name} came through it with the squad they started with: there are no transfers in the cup. The dressing room talks about their own last whistle, not someone else's final.`)
        : tr(`${me.name} выбыли раньше. Кубок у ${holder.name}. Состав, с которым клуб входил в сетку, так и остался без покупок.`, `${me.name} went out earlier. The cup belongs to ${holder.name}. The squad that entered the bracket never bought anyone.`),
    });
  } else if (state.out) {
    out.push({
      tag: tr("Вылет", "Out"),
      title: tr(`${me.name} заканчивают кубковый путь`, `${me.name} end their cup run`),
      body: tr(`${stage} остался без ${me.name}. Дальше играют другие, а разговор в клубе простой: лига ещё может спасти сезон, эта сетка — уже нет.`, `${stage} goes on without ${me.name}. Others play on, and the talk at the club is simple: the league can still save the season, this bracket cannot.`),
    });
  } else {
    const index = userTieIndex(state);
    const tie = index >= 0 ? round.ties[index] : round.ties.find((t) => t.home === state.teamId || t.away === state.teamId);
    if (tie?.away && tie.hg === null) {
      const foe = teamById(tie.home === state.teamId ? tie.away : tie.home);
      const home = tie.home === state.teamId;
      out.push({
        tag: tr("Наш жребий", "Our draw"),
        title: `${me.name} — ${foe.name}`,
        body: tr(
          `${stage}. ${home ? `${me.name} играют дома` : `Выезд к ${foe.name}`}. Пару собрали из клубов близкого уровня, не из крайностей сетки. В заявке ${me.name} ждут не сенсацию ради заголовка, а свой проход.`,
          `${stage}. ${home ? `${me.name} play at home` : `Away at ${foe.name}`}. The tie pairs clubs of a similar level, not the extremes of the bracket. ${me.name} want their own passage, not a headline shock.`,
        ),
      });
    } else if (tie && !tie.away) {
      out.push({
        tag: tr("Сетка", "Bracket"),
        title: tr(`${me.name} ждут следующую стадию без игры`, `${me.name} wait for the next round without playing`),
        body: tr("Более высокий рейтинг оставил клуб среди сеяных. Пока играют остальные пары, в раздевалке спорят, кого ставить, когда сетка снова дойдёт до нас.", "A higher rating left the club among the seeds. While the other ties are played, the dressing room argues who starts when the bracket reaches them again."),
      });
    }
  }
  if (last?.away && last.hg !== null && last.ag !== null) {
    const ours = last.home === state.teamId ? last.hg : last.ag;
    const theirs = last.home === state.teamId ? last.ag : last.hg;
    const wentThrough = ours > theirs || (ours === theirs && last.ph != null && ((last.home === state.teamId && last.ph > (last.pa ?? 0)) || (last.away === state.teamId && (last.pa ?? 0) > (last.ph ?? 0))));
    const pens = last.ph != null && last.pa != null ? tr(` Серия ${last.ph}:${last.pa}.`, ` Shoot-out ${last.ph}:${last.pa}.`) : "";
    const tone = wentThrough
      ? tr(`${me.name} проходят дальше.`, `${me.name} go through.`)
      : tr(`${me.name} этот вечер не празднуют.`, `${me.name} do not celebrate this night.`);
    out.push({
      tag: tr("Наш матч", "Our match"),
      title: `${teamById(last.home).name} ${last.hg}:${last.ag} ${teamById(last.away).name}`,
      body: tr(`${tone}${pens} Протокол пишут про ${me.name}, остальные пары — только фон сетки.`, `${tone}${pens} The report is about ${me.name}. The other ties are only the background of the bracket.`),
    });
  }
  const around = state.rounds.flatMap((r) => r.ties).filter((t) => t.away && t.hg !== null && t.home !== state.teamId && t.away !== state.teamId).slice(-2);
  for (const tie of around) {
    if (!tie.away || tie.hg === null || tie.ag === null) continue;
    const winner = teamById(tieWinner(tie) ?? tie.home).name;
    out.push({
      tag: tr("Рядом в сетке", "Elsewhere in the bracket"),
      title: `${teamById(tie.home).name} ${tie.hg}:${tie.ag} ${teamById(tie.away).name}`,
      body: tr(`Дальше идёт ${winner}. Для ${me.name} это чужой вечер: важен только свой следующий соперник.`, `${winner} go on. For ${me.name} this is someone else's night: only their own next opponent matters.`),
    });
  }
  if (!out.length) {
    out.push({
      tag: tr("Кубок", "Cup"),
      title: tr(`${me.name} входят в сетку`, `${me.name} enter the bracket`),
      body: tr("Все 24 клуба. Трансферов нет. Жеребьёвка держит рядом команды близкого уровня.", "All 24 clubs. No transfers. The draw keeps sides of a similar level together."),
    });
  }
  return out.slice(0, 6);
}

export function reviveCup(data: CupState | null): CupState | null {
  if (!data || data.v !== 1 || !data.teamId || !TEAMS.some((t) => t.id === data.teamId)) return null;
  if (!Array.isArray(data.people) || !Array.isArray(data.rounds) || !data.rounds.length) return null;
  if (!Array.isArray(data.lineup) || data.lineup.length < 11) return null;
  return {
    ...data,
    budget: Number.isFinite(data.budget) ? data.budget : 25_000_000,
    trainsLeft: data.trainsLeft > 0 ? data.trainsLeft : 0,
    round: Math.max(0, Math.min(data.round ?? 0, data.rounds.length - 1)),
    out: Boolean(data.out),
    champion: data.champion ?? null,
    seenCutscene: Boolean(data.seenCutscene),
    formation: data.formation || "4-3-3",
  };
}

export function cupDone(state: CupState): boolean {
  return Boolean(state.champion) || state.out;
}
