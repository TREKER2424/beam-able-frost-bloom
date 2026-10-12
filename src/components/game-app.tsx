import { Component, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from "react";
import { CareerDesk, ClubBrowser, ClubPage, CreatePlayer, PlayerDesk } from "@/components/career-ui";
import { RefereeCreate, RefereeDesk } from "@/components/referee-ui";
import { StoryBook } from "@/components/story-ui";
import { Crest } from "@/components/crests";
import { CupDesk } from "@/components/cup-ui";
import { audio } from "@/game/audio";
import { setActiveLang, tr, type Lang } from "@/game/i18n";
import { careerLevel, COACHES, createCareer, createManagerCareer, migrateLegacy, nextUserFixture, normalizeCareer, recordUserMatch, shellCareer, simulateIndex, simulateRest, toRoster, type CareerState, type CoachId } from "@/game/career";
import { clubRating, FORMATION_IDS, leagueTitle, neighborLeague, teamsIn, type LeagueId, type TeamDef, TEAMS } from "@/game/data";
import { applyRefCup, applyRefMatch, createRef, refCupAssignment, refFixture, reviveRef, simulateRefMatch, type RefState } from "@/game/referee";
import { MatchSim, type DiffId, type KitId, type Snap } from "@/game/sim";
import { STORY, type StoryState } from "@/game/story";
import { createCup, recordCupScore, reviveCup, userTieIndex, type CupState } from "@/game/cup";

type Screen =
  | "home"
  | "clubs"
  | "club"
  | "pick"
  | "settings"
  | "saves"
  | "authors"
  | "match"
  | "manager"
  | "player"
  | "createPlayer"
  | "pickManager"
  | "pickPlayer"
  | "pickStory"
  | "story"
  | "referee"
  | "refCreate"
  | "pickCup"
  | "cup";
type Scheme = "both" | "keys" | "touch";
type Settings = { matchMin: number; difficulty: DiffId; speed: number; sound: boolean; scheme: Scheme; lang: Lang };
type Origin = "home" | "manager" | "player" | "story" | "referee" | "cup";
type Play = { origin: Origin; index: number; userHome: boolean; final?: boolean; refCup?: boolean } | null;

const MANAGER_KEY = "chuvash-ball-manager-v1";
const PLAYER_KEY = "chuvash-ball-player-v1";
const STORY_KEY = "chuvash-ball-story-v1";
const REF_KEY = "chuvash-ball-ref-v1";
const CUP_KEY = "rodnoy-myach-cup-v1";
const SAVE_V2 = "chuvash-ball-career-v2";
const SAVE_V1 = "chuvash-ball-career-v1";
const SETTINGS_KEY = "chuvash-ball-settings-v1";
const LEAGUE_KEY = "rodnoy-myach-league-v1";
const DIFFS: { id: DiffId; ru: string; en: string }[] = [
  { id: "novice", ru: "Новичок", en: "Novice" },
  { id: "amateur", ru: "Любитель", en: "Amateur" },
  { id: "pro", ru: "Профессионал", en: "Professional" },
  { id: "world", ru: "Мировой класс", en: "World class" },
  { id: "legend", ru: "Легенда Волги", en: "Volga legend" },
];
const SPEEDS = [
  { id: 0.78, ru: "Медленно", en: "Slow" },
  { id: 0.96, ru: "Обычно", en: "Normal" },
  { id: 1.12, ru: "Быстро", en: "Fast" },
];
const DEFAULT_SETTINGS: Settings = { matchMin: 4, difficulty: "novice", speed: 0.96, sound: true, scheme: "both", lang: "ru" };

function unlockInput() {
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
  document.body.style.touchAction = "";
  document.body.style.userSelect = "";
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
}

function halfOf(matchMin: number) {
  return matchMin / 2;
}

function writeSave(key: string, value: unknown | null) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* приватный режим или квота не должны обрывать матч */
  }
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const data = JSON.parse(raw) as Partial<Settings> & { halfMin?: number; pace?: number };
    let speed = typeof data.speed === "number" ? data.speed : 0.96;
    if (data.pace === 2) {
      if (Math.abs(speed - 0.78) < 0.04) speed = 0.78;
      else if (Math.abs(speed - 0.96) < 0.04) speed = 0.96;
      else if (Math.abs(speed - 1.12) < 0.04) speed = 1.12;
      else speed = 0.96;
    } else if (Math.abs(speed - 0.68) < 0.03 || Math.abs(speed - 0.82) < 0.03 || Math.abs(speed - 0.78) < 0.03) speed = 0.78;
    else if (Math.abs(speed - 1.45) < 0.03 || Math.abs(speed - 1.58) < 0.03) speed = 1.12;
    else speed = 0.96;
    const difficulty = DIFFS.some((d) => d.id === data.difficulty) ? data.difficulty! : "novice";
    const scheme: Scheme = data.scheme === "keys" || data.scheme === "touch" ? data.scheme : "both";
    const rawMin = typeof data.matchMin === "number" ? data.matchMin : data.halfMin;
    const matchMin = rawMin === 2 || rawMin === 3 || rawMin === 4 || rawMin === 5 ? rawMin : rawMin === 6 ? 5 : 4;
    const lang: Lang = data.lang === "en" ? "en" : "ru";
    return { matchMin, difficulty, speed, sound: data.sound !== false, scheme, lang };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function parseCareer(raw: string | null): CareerState | null {
  if (!raw) return null;
  const data = JSON.parse(raw) as CareerState;
  if (data?.v === 2 && data.teamId && Array.isArray(data.people) && Array.isArray(data.fixtures)) return normalizeCareer(data);
  return null;
}

function loadManager(): CareerState | null {
  try {
    const own = parseCareer(localStorage.getItem(MANAGER_KEY));
    if (own) return own;
    const v2 = parseCareer(localStorage.getItem(SAVE_V2));
    if (v2) return v2;
    const v1 = localStorage.getItem(SAVE_V1);
    if (!v1) return null;
    const legacy = migrateLegacy(JSON.parse(v1) as { teamId?: string; fixtures?: CareerState["fixtures"]; budget?: number });
    return legacy ? normalizeCareer(legacy) : null;
  } catch {
    return null;
  }
}

function loadPlayer(): CareerState | null {
  try {
    return parseCareer(localStorage.getItem(PLAYER_KEY));
  } catch {
    return null;
  }
}

function loadStory(): StoryState | null {
  try {
    const raw = localStorage.getItem(STORY_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoryState;
    if (data?.v !== 1 || !data.teamId || !data.career) return null;
    return { ...data, career: normalizeCareer(data.career) };
  } catch {
    return null;
  }
}

function loadRef(): RefState | null {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    return reviveRef(JSON.parse(raw) as RefState);
  } catch {
    return null;
  }
}

function installProbe(sim: MatchSim) {
  window.__controlsTest = {
    getYaw: () => sim.getYaw(),
    getSpeed: () => sim.getSpeed(),
    setKeys: (codes: string[]) => sim.setKeys(codes),
    ticks: () => sim.ticks,
    debug: () => sim.debug(),
  };
}

export function GameApp() {
  const [generation, setGeneration] = useState(0);
  return (
    <GameBoundary onRecover={() => setGeneration((n) => n + 1)}>
      <GameRoot key={generation} />
    </GameBoundary>
  );
}

class GameBoundary extends Component<{ onRecover: () => void; children: ReactNode }, { error: string }> {
  state = { error: "" };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error && error.message ? error.message : tr("Неизвестная ошибка", "Unknown error") };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="safe-top safe-bot mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-8">
        <p className="font-display text-xs tracking-widest uppercase text-mint">{tr("Родной мяч", "Home Ball")}</p>
        <h1 className="font-display mt-2 text-4xl uppercase">{tr("Сбой экрана", "Screen failed")}</h1>
        <p className="mt-3 text-sm text-fg/75">{tr("Этот экран оборвался. Сохранения в браузере не стёрты. Можно вернуться в меню без перезагрузки страницы.", "This screen stopped. Saves in the browser were not wiped. You can return to the menu without reloading the page.")}</p>
        <p className="mt-2 text-xs break-words text-fg/50">{this.state.error}</p>
        <button
          className="btn-main mt-4"
          onClick={() => {
            this.setState({ error: "" });
            this.props.onRecover();
          }}
        >
          {tr("В меню", "To the menu")}
        </button>
      </main>
    );
  }
}

function GameRoot() {
  const [screen, setScreen] = useState<Screen>("home");
  const [manager, setManager] = useState<CareerState | null>(null);
  const [player, setPlayer] = useState<CareerState | null>(null);
  const [story, setStory] = useState<StoryState | null>(null);
  const [refCareer, setRefCareer] = useState<RefState | null>(null);
  const [cup, setCup] = useState<CupState | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [league, setLeague] = useState<LeagueId>("chuvash");
  const [hydrated, setHydrated] = useState(false);
  const [homeId, setHomeId] = useState("KHM");
  const [awayId, setAwayId] = useState("SPM");
  const [clubId, setClubId] = useState("KHM");
  const [coachId, setCoachId] = useState<CoachId | null>(null);
  const [snap, setSnap] = useState<Snap | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [subMsg, setSubMsg] = useState("");
  const [play, setPlay] = useState<Play>(null);
  const simRef = useRef<MatchSim | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const againRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const legacy = loadManager();
    setManager(legacy);
    if (legacy) writeSave(MANAGER_KEY, legacy);
    setPlayer(loadPlayer());
    setStory(loadStory());
    setRefCareer(loadRef());
    try {
      setCup(reviveCup(JSON.parse(localStorage.getItem(CUP_KEY) || "null") as CupState | null));
    } catch {
      setCup(null);
    }
    const loaded = loadSettings();
    setSettings(loaded);
    setActiveLang(loaded.lang);
    audio.ui = loaded.sound;
    const saved = localStorage.getItem(LEAGUE_KEY);
    const id: LeagueId = saved === "volga" || saved === "siberia" ? saved : "chuvash";
    setLeague(id);
    document.documentElement.dataset.league = id;
    if (id !== "chuvash") {
      const list = teamsIn(id);
      setHomeId(list[0]!.id);
      setAwayId(list[1]!.id);
      setClubId(list[0]!.id);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target.closest("button, [role='button']") : null;
      if (!el || (el as HTMLButtonElement).disabled) return;
      try {
        audio.click();
      } catch {
        /* звук не должен глушить нажатие */
      }
    };
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("click", click);
      MatchSim.haltAll();
      unlockInput();
    };
  }, []);

  function moveLeague(dir: -1 | 1) {
    const next = neighborLeague(league, dir);
    const list = teamsIn(next);
    setLeague(next);
    setHomeId(list[0]!.id);
    setAwayId(list[1]!.id);
    setClubId(list[0]!.id);
    try {
      localStorage.setItem(LEAGUE_KEY, next);
    } catch {
      /* квота не должна сбрасывать экран */
    }
    document.documentElement.dataset.league = next;
  }

  function persistSettings(next: Settings) {
    setSettings(next);
    setActiveLang(next.lang);
    audio.ui = next.sound;
    writeSave(SETTINGS_KEY, { ...next, pace: 2 });
  }
  function persistManager(next: CareerState | null) {
    setManager(next);
    writeSave(MANAGER_KEY, next);
  }
  function persistPlayer(next: CareerState | null) {
    setPlayer(next);
    writeSave(PLAYER_KEY, next);
  }
  function persistStory(next: StoryState | null) {
    setStory(next);
    writeSave(STORY_KEY, next);
  }
  function persistRef(next: RefState | null) {
    setRefCareer(next);
    writeSave(REF_KEY, next);
  }
  function persistCup(next: CupState | null) {
    setCup(next);
    writeSave(CUP_KEY, next);
  }

  function boot(sim: MatchSim, meta: NonNullable<Play>, again?: () => void) {
    try {
      audio.unlock();
      sim.volume = settings.sound ? 0.8 : 0;
      const prev = simRef.current;
      const carry = prev && prev !== sim && prev.homeKit && prev.awayKit ? { home: prev.homeKit, away: prev.awayKit, weather: prev.weather } : null;
      prev?.stop();
      audio.setMatch(true);
      if (carry) {
        sim.setSideKit(0, carry.home);
        sim.setSideKit(1, carry.away);
        sim.setWeather(carry.weather);
        sim.beginPlay();
      }
      const first = sim.snapshot();
      sim.onHud = (s) => setSnap(s);
      simRef.current = sim;
      installProbe(sim);
      againRef.current = again ?? null;
      const canvas = canvasRef.current;
      if (canvas) sim.bindCanvas(canvas);
      sim.start();
      setPlay(meta);
      setSnap(first);
      setPicked(null);
      setSubMsg("");
      setScreen("match");
    } catch (err) {
      console.error(err);
      sim.stop();
      if (simRef.current === sim) simRef.current = null;
      setSnap(null);
      setScreen((cur) => (cur === "match" ? meta.origin : cur));
    }
  }

  function careerSim(career: CareerState, lock: boolean, rated: boolean) {
    const next = nextUserFixture(career);
    if (!next) return null;
    const userHome = next.fixture.home === career.teamId;
    const home = next.fixture.home;
    const away = next.fixture.away;
    const foe = userHome ? away : home;
    const level = rated ? careerLevel(career, foe, lock) : null;
    const difficulty = level ? level.diff : settings.difficulty;
    const opts = {
      homeId: home,
      awayId: away,
      halfMin: halfOf(settings.matchMin),
      difficulty,
      formation: career.formation,
      homeRoster: toRoster(career, home, userHome ? career.lineup : undefined),
      awayRoster: toRoster(career, away, userHome ? undefined : career.lineup),
      speed: settings.speed,
      lockId: lock ? career.createdId || undefined : undefined,
      lockControl: lock,
      userSide: (userHome ? 0 : 1) as 0 | 1,
      shapeSalt: next.index,
    };
    return { next, userHome, opts };
  }

  function startQuick(h = homeId, a = awayId) {
    if (h === a) return;
    const opts = { homeId: h, awayId: a, halfMin: halfOf(settings.matchMin), difficulty: settings.difficulty, speed: settings.speed };
    const meta: Play = { origin: "home", index: -1, userHome: true };
    const again = () => boot(new MatchSim(opts), meta, again);
    boot(new MatchSim(opts), meta, again);
  }

  function startManagerMatch() {
    if (!manager) return;
    const built = careerSim(manager, false, true);
    if (!built) return;
    const meta: Play = { origin: "manager", index: built.next.index, userHome: built.userHome };
    boot(new MatchSim(built.opts), meta);
  }

  function startPlayerMatch() {
    if (!player) return;
    const built = careerSim(player, true, true);
    if (!built) return;
    const meta: Play = { origin: "player", index: built.next.index, userHome: built.userHome };
    boot(new MatchSim(built.opts), meta);
  }

  function startStoryMatch() {
    if (!story) return;
    const built = careerSim(story.career, true, false);
    if (!built) return;
    const chapter = STORY[story.step];
    const meta: Play = { origin: "story", index: built.next.index, userHome: built.userHome, final: chapter?.kind === "match" && Boolean(chapter.final) };
    boot(new MatchSim(built.opts), meta);
  }

  function startCupMatch() {
    if (!cup) return;
    const index = userTieIndex(cup);
    const tie = index >= 0 ? cup.rounds[cup.round]?.ties[index] : null;
    if (!tie?.away) return;
    const userHome = tie.home === cup.teamId;
    const shell = shellCareer(cup);
    boot(
      new MatchSim({
        homeId: tie.home,
        awayId: tie.away,
        halfMin: halfOf(settings.matchMin),
        difficulty: settings.difficulty,
        formation: cup.formation,
        homeRoster: toRoster(shell, tie.home, userHome ? cup.lineup : undefined),
        awayRoster: toRoster(shell, tie.away, userHome ? undefined : cup.lineup),
        speed: settings.speed,
        userSide: userHome ? 0 : 1,
        shapeSalt: cup.round * 10 + index,
      }),
      { origin: "cup", index, userHome },
    );
  }

  function startRefMatch() {
    if (!refCareer) return;
    const fx = refFixture(refCareer.nextIndex, refCareer.league);
    if (!fx) return;
    boot(
      new MatchSim({
        homeId: fx.home,
        awayId: fx.away,
        halfMin: 1,
        difficulty: settings.difficulty,
        speed: settings.speed,
        referee: true,
        shapeSalt: refCareer.nextIndex,
      }),
      { origin: "referee", index: refCareer.nextIndex, userHome: true },
    );
  }

  function startRefCupMatch() {
    if (!refCareer) return;
    const next = refCupAssignment(refCareer);
    if (!next) return;
    boot(
      new MatchSim({
        homeId: next.home,
        awayId: next.away,
        halfMin: 1,
        difficulty: settings.difficulty,
        speed: settings.speed,
        referee: true,
        shapeSalt: refCareer.cup.round * 20 + next.index,
      }),
      { origin: "referee", index: next.index, userHome: true, refCup: true },
    );
  }

  function leaveMatch() {
    const origin = play?.origin ?? "home";
    MatchSim.haltAll();
    simRef.current = null;
    unlockInput();
    setSnap(null);
    const back: Record<Origin, Screen> = {
      home: "home",
      manager: "manager",
      player: "player",
      story: "story",
      referee: "referee",
      cup: "cup",
    };
    setScreen(back[origin] ?? "home");
  }

  function finishMatch() {
    try {
      const side = play?.userHome ? 0 : 1;
      const names = snap ? snap.scorers.filter((g) => g.side === side && !g.own).map((g) => g.name) : [];
      if (play?.origin === "manager" && manager && play.index >= 0 && snap) {
        persistManager(recordUserMatch(manager, play.index, snap.score[0], snap.score[1], names));
      }
      if (play?.origin === "player" && player && play.index >= 0 && snap) {
        persistPlayer(recordUserMatch(player, play.index, snap.score[0], snap.score[1], names));
      }
      if (play?.origin === "story" && story && play.index >= 0 && snap) {
        let career = recordUserMatch(story.career, play.index, snap.score[0], snap.score[1], names, true);
        if (play.final) career = simulateRest(career);
        persistStory({ ...story, teamId: career.teamId, career, step: story.step + 1, note: "" });
      }
      if (play?.origin === "referee" && refCareer && snap) {
        const report = {
          correct: snap.refCorrect,
          wrong: snap.refWrong,
          fouls: snap.fouls[0] + snap.fouls[1],
          yellows: snap.yellows[0] + snap.yellows[1],
          reds: snap.reds[0] + snap.reds[1],
          pens: snap.pens[0] + snap.pens[1],
          offsides: snap.offsides[0] + snap.offsides[1],
        };
        const score = { hg: snap.score[0], ag: snap.score[1] };
        persistRef(play.refCup ? applyRefCup(refCareer, play.index, report, score) : applyRefMatch(refCareer, report, score));
      }
      if (play?.origin === "cup" && cup && play.index >= 0 && snap) {
        persistCup(recordCupScore(cup, play.index, snap.score[0], snap.score[1], names));
      }
    } catch (err) {
      console.error(err);
    }
    leaveMatch();
  }

  function simulateStory() {
    if (!story) return;
    const next = nextUserFixture(story.career);
    if (!next) return;
    const trial = simulateIndex(story.career, next.index);
    const row = trial.fixtures[next.index];
    if (!row || row.hg === null || row.ag === null) return;
    const chapter = STORY[story.step];
    const final = chapter?.kind === "match" && Boolean(chapter.final);
    let career = trial;
    if (final) career = simulateRest(career);
    persistStory({ ...story, teamId: career.teamId, career, step: story.step + 1, note: "" });
  }

  function simulateRef() {
    if (!refCareer) return;
    persistRef(simulateRefMatch(refCareer));
  }

  const clubs = teamsIn(league);
  return (
    <div className="min-h-dvh bg-bg text-fg">
      {screen === "home" && (
        <Home
          hydrated={hydrated}
          hasManager={Boolean(manager)}
          hasPlayer={Boolean(player)}
          hasStory={Boolean(story)}
          hasRef={Boolean(refCareer)}
          hasCup={Boolean(cup)}
          league={league}
          teams={clubs}
          onPrev={() => moveLeague(-1)}
          onNext={() => moveLeague(1)}
          onStart={() => startQuick(clubs[0]!.id, clubs[1]!.id)}
          onPick={() => setScreen("pick")}
          onClubs={() => setScreen("clubs")}
          onSettings={() => setScreen("settings")}
          onSaves={() => setScreen("saves")}
          onAuthors={() => setScreen("authors")}
          onManager={() => { setCoachId(null); setScreen(manager ? "manager" : "pickManager"); }}
          onPlayer={() => setScreen(player ? "player" : "pickPlayer")}
          onStory={() => setScreen(story ? "story" : "pickStory")}
          onRef={() => setScreen(refCareer ? "referee" : "refCreate")}
          onCup={() => setScreen(cup ? "cup" : "pickCup")}
        />
      )}
      {screen === "clubs" && (
        <ClubBrowser teams={clubs} onBack={() => setScreen("home")} onOpen={(id) => { setClubId(id); setScreen("club"); }} />
      )}
      {screen === "club" && <ClubPage id={clubId} onBack={() => setScreen("clubs")} />}
      {screen === "pickManager" && !coachId && (
        <ManagerStart onBack={() => setScreen("home")} onCoach={setCoachId} />
      )}
      {screen === "pickManager" && coachId && (
        <ClubPick title={tr("Клуб тренера", "Manager's club")} text={tr("Состав, трансферы, тренировки клуба. В матче вы управляете всей командой.", "Squad, transfers, club training. In a match you control the whole team.")} teams={clubs} onBack={() => setCoachId(null)} onChoose={(id) => { persistManager(createManagerCareer(id, coachId)); setCoachId(null); setScreen("manager"); }} />
      )}
      {screen === "pickPlayer" && (
        <ClubPick title={tr("Карьера игрока", "Player career")} text={tr("Выберите клуб. Дальше создадите футболиста: на поле можно бегать только им.", "Pick a club. Then you create a footballer: on the pitch you can only run with him.")} teams={clubs} onBack={() => setScreen("home")} onChoose={(id) => { setClubId(id); setScreen("createPlayer"); }} />
      )}
      {screen === "createPlayer" && (
        <CreatePlayer
          teamId={clubId}
          onBack={() => setScreen("pickPlayer")}
          onDone={(draft) => {
            if (draft.pos === "GK") return;
            persistPlayer(createCareer(clubId, draft));
            setScreen("player");
          }}
        />
      )}
      {screen === "pickStory" && (
        <ClubPick
          title={tr("Клуб Васи Иванова", "Vasya Ivanov's club")}
          text={tr("Вася начинает сезон здесь. В конце года место в таблице решает финал: пьедестал — счастливый, ниже третьего — нет. Новый сезон сохраняет трансферы и победы.", "Vasya starts the season here. At the end of the year the table decides the ending: a podium is a happy one, below third is not. A new season keeps transfers and wins.")}
          teams={clubs}
          onBack={() => setScreen("home")}
          onChoose={(id) => {
            persistStory({
              v: 1,
              teamId: id,
              step: 0,
              rigged: false,
              note: "",
              career: createCareer(id, { name: "В. Иванов", pos: "ST", num: 9 }),
            });
            setScreen("story");
          }}
        />
      )}
      {screen === "pick" && (
        <Friendly
          homeId={homeId}
          awayId={awayId}
          settings={settings}
          teams={clubs}
          onHome={setHomeId}
          onAway={setAwayId}
          onSettings={persistSettings}
          onBack={() => setScreen("home")}
          onStart={() => startQuick()}
        />
      )}
      {screen === "settings" && <SettingsScreen settings={settings} onChange={persistSettings} onBack={() => setScreen("home")} />}
      {screen === "authors" && <AuthorsScreen onBack={() => setScreen("home")} />}
      {screen === "saves" && (
        <SavesFolder
          onBack={() => setScreen("home")}
          onOpen={(id) => setScreen(id)}
          manager={manager}
          player={player}
          story={story}
          referee={refCareer}
          cup={cup}
          settingsNote={`${DIFFS.find((d) => d.id === settings.difficulty)?.[settings.lang === "en" ? "en" : "ru"] ?? ""} · ${tr("звук", "sound")} ${settings.sound ? tr("вкл", "on") : tr("выкл", "off")} · ${settings.scheme === "keys" ? tr("клавиатура", "keyboard") : settings.scheme === "touch" ? tr("сенсор", "touch") : tr("джойстик и клавиатура", "pad and keyboard")}`}
          onClear={(id) => {
            if (id === "manager") persistManager(null);
            if (id === "player") persistPlayer(null);
            if (id === "story") persistStory(null);
            if (id === "referee") persistRef(null);
            if (id === "cup") persistCup(null);
          }}
          onRewrite={(id) => {
            if (id === "manager") { persistManager(null); setCoachId(null); setScreen("pickManager"); }
            if (id === "player") { persistPlayer(null); setScreen("pickPlayer"); }
            if (id === "story") { persistStory(null); setScreen("pickStory"); }
            if (id === "referee") { persistRef(null); setScreen("refCreate"); }
            if (id === "cup") { persistCup(null); setScreen("pickCup"); }
          }}
        />
      )}
      {screen === "pickCup" && (
        <ClubPick
          title={tr("Кубок России", "Russian Cup")}
          text={tr("Все 24 клуба, независимо от выбранной лиги. Жеребьёвка ставит рядом команды с близким рейтингом и формой. Трансферов нет. Можно играть, симулировать или отказаться: отказ — техническое 0:3.", "All 24 clubs, whatever league you picked. The draw pairs sides of similar rating and form. No transfers. You can play, simulate or forfeit: a forfeit is a 0-3 walkover.")}
          teams={TEAMS}
          onBack={() => setScreen("home")}
          onChoose={(id) => { persistCup(createCup(id)); setScreen("cup"); }}
        />
      )}
      {screen === "cup" && cup && (
        <CupDesk
          cup={cup}
          onChange={persistCup}
          onPlay={startCupMatch}
          onMenu={() => setScreen("home")}
          onReset={() => { persistCup(null); setScreen("home"); }}
          onRestart={() => persistCup(createCup(cup.teamId))}
        />
      )}
      {screen === "manager" && manager && (
        <CareerDesk career={manager} onChange={persistManager} onPlay={startManagerMatch} onMenu={() => setScreen("home")} onReset={() => { persistManager(null); setScreen("home"); }} />
      )}
      {screen === "player" && player && (
        <PlayerDesk career={player} onChange={persistPlayer} onPlay={startPlayerMatch} onMenu={() => setScreen("home")} onReset={() => { persistPlayer(null); setScreen("home"); }} />
      )}
      {screen === "story" && story && (
        <StoryBook state={story} onChange={persistStory} onPlay={startStoryMatch} onSimulate={simulateStory} onMenu={() => setScreen("home")} onReset={() => { persistStory(null); setScreen("home"); }} />
      )}
      {screen === "refCreate" && <RefereeCreate onBack={() => setScreen("home")} onDone={(name) => { persistRef(createRef(name, league)); setScreen("referee"); }} />}
      {screen === "referee" && refCareer && (
        <RefereeDesk state={refCareer} onMatch={startRefMatch} onCup={startRefCupMatch} onSimulate={simulateRef} onMenu={() => setScreen("home")} onReset={() => { persistRef(null); setScreen("home"); }} onSave={() => persistRef(refCareer)} onChange={persistRef} />
      )}
      {screen === "match" && snap && (
        <MatchLayer
          snap={snap}
          canvasRef={canvasRef}
          simRef={simRef}
          picked={picked}
          subMsg={subMsg}
          career={play?.origin === "manager" || play?.origin === "player" || play?.origin === "story" || play?.origin === "cup"}
          showTouch={settings.scheme !== "keys"}
          onPick={setPicked}
          onSubMsg={setSubMsg}
          onLeave={leaveMatch}
          onDone={finishMatch}
          onAgain={play?.origin === "home" ? () => againRef.current?.() : null}
        />
      )}
    </div>
  );
}

function Home({
  hydrated,
  hasManager,
  hasPlayer,
  hasStory,
  hasRef,
  hasCup,
  league,
  teams,
  onPrev,
  onNext,
  onStart,
  onPick,
  onClubs,
  onSettings,
  onSaves,
  onAuthors,
  onManager,
  onPlayer,
  onStory,
  onRef,
  onCup,
}: {
  hydrated: boolean;
  hasManager: boolean;
  hasPlayer: boolean;
  hasStory: boolean;
  hasRef: boolean;
  hasCup: boolean;
  league: LeagueId;
  teams: TeamDef[];
  onPrev: () => void;
  onNext: () => void;
  onStart: () => void;
  onPick: () => void;
  onClubs: () => void;
  onSettings: () => void;
  onSaves: () => void;
  onAuthors: () => void;
  onManager: () => void;
  onPlayer: () => void;
  onStory: () => void;
  onRef: () => void;
  onCup: () => void;
}) {
  return (
    <main className="safe-top safe-bot mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6">
      <div className="flex items-start gap-3">
        <button type="button" className="league-arrow" aria-label={tr("Предыдущая лига", "Previous league")} onClick={onPrev}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path d="M14.5 5 8 12l6.5 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xs tracking-widest text-mint uppercase">{tr("Родной мяч", "Home Ball")}</p>
          <h1 className="font-display mt-2 text-5xl leading-none uppercase sm:text-7xl">
            {leagueTitle(league)}
            <span className="block text-mint">{tr("мяч", "ball")}</span>
          </h1>
        </div>
        <button type="button" className="league-arrow" aria-label={tr("Следующая лига", "Next league")} onClick={onNext}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path d="M9.5 5 16 12l-6.5 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
        {teams.map((t) => (
          <div key={t.id} className="flex flex-col items-center gap-1">
            <Crest id={t.id} className="h-12 w-12" />
            <span className="text-center text-xs leading-tight text-fg/70">{t.name}</span>
            <span className="text-center text-[10px] text-mint">{clubRating(t.id)}</span>
          </div>
        ))}
      </div>
      <section className="mt-8">
        <h2 className="font-display text-xs tracking-widest text-fg/50 uppercase">{tr("Быстрый матч", "Quick match")}</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button className="btn-main" aria-label="Start" onClick={onStart}>
            Start
            <span className="mt-1 block text-xs font-sans font-normal normal-case tracking-normal text-bg/80">{teams[0]?.name} — {teams[1]?.name}</span>
          </button>
          <button className="btn-ghost" onClick={onPick}>{tr("Свой матч", "Custom match")}</button>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-display text-xs tracking-widest text-fg/50 uppercase">{tr("Карьера", "Career")}</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <button className="btn-ghost" onClick={onPlayer}>{hydrated && hasPlayer ? tr("Игрок: продолжить", "Player: continue") : tr("Карьера игрока", "Player career")}</button>
          <button className="btn-ghost" onClick={onManager}>{hydrated && hasManager ? tr("Тренер: продолжить", "Manager: continue") : tr("Карьера тренера", "Manager career")}</button>
          <button className="btn-ghost" onClick={onRef}>{hydrated && hasRef ? tr("Судья: продолжить", "Referee: continue") : tr("Карьера судьи", "Referee career")}</button>
          <button className="btn-ghost" onClick={onCup}>{hydrated && hasCup ? tr("Кубок: продолжить", "Cup: continue") : tr("Кубок России", "Russian Cup")}<span className="mt-1 block font-sans text-xs font-normal normal-case tracking-normal text-fg/60">{tr("Все 24 клуба", "All 24 clubs")}</span></button>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-display text-xs tracking-widest text-fg/50 uppercase">{tr("История", "Story")}</h2>
        <button className="btn-ghost mt-2 w-full sm:w-auto" onClick={onStory}>{hydrated && hasStory ? tr("Продолжить историю Васи", "Continue Vasya's story") : tr("История Васи Иванова", "Vasya Ivanov's story")}</button>
      </section>
      <section className="mt-6">
        <h2 className="font-display text-xs tracking-widest text-fg/50 uppercase">{tr("Информация", "Info")}</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button className="btn-ghost" onClick={onClubs}>{tr("Клубы и игроки", "Clubs and players")}</button>
          <button className="btn-ghost" onClick={onSettings}>{tr("Настройки", "Settings")}</button>
          <button className="btn-ghost" onClick={onSaves}>{tr("Папка сохранений", "Save folder")}</button>
          <button className="btn-ghost" onClick={onAuthors}>{tr("Авторы", "Credits")}</button>
        </div>
      </section>
      <p className="mt-auto pt-10 text-center text-xs tracking-widest text-fg/40">BY KOLOSOV MADE AI</p>
    </main>
  );
}

function ManagerStart({ onBack, onCoach }: { onBack: () => void; onCoach: (id: CoachId) => void }) {
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>{tr("Назад", "Back")}</button>
      <h2 className="font-display mt-3 text-3xl uppercase">{tr("Карьера тренера", "Manager career")}</h2>
      <p className="mt-2 text-sm text-fg/70">{tr("Сначала человек на скамейке. Потом клуб. Истории не пересекаются: от этого зависят рейтинг и бюджет.", "First the person on the bench. Then the club. Stories do not mix: rating and budget depend on it.")}</p>
      <div className="mt-4 grid gap-3">
        {COACHES.map((c) => (
          <button key={c.id} className="card text-left" onClick={() => onCoach(c.id)}>
            <span className="font-display block text-lg uppercase">{c.name}</span>
            <span className="mt-1 block text-sm text-mint">{tr(c.title, c.titleEn || c.title)} · {tr("рейтинг", "rating")} {c.rating}</span>
            <span className="mt-1 block text-sm text-fg/70">{tr(c.story, c.storyEn || c.story)}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

function ClubPick({ title, text, teams, onBack, onChoose }: { title: string; text: string; teams: TeamDef[]; onBack: () => void; onChoose: (id: string) => void }) {
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-5xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>{tr("Назад", "Back")}</button>
      <h2 className="font-display mt-3 text-3xl uppercase">{title}</h2>
      <p className="mt-2 max-w-xl text-sm text-fg/70">{text}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {teams.map((t) => (
          <button key={t.id} className="card flex items-center gap-3 text-left" onClick={() => onChoose(t.id)}>
            <Crest id={t.id} className="h-14 w-14 shrink-0" />
            <span>
              <span className="font-display block text-lg uppercase">{t.name}</span>
              <span className="text-sm text-fg/70">{t.city} · {t.stadium} · {tr("рейтинг", "rating")} {clubRating(t.id)}</span>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}


function Friendly(props: {
  homeId: string;
  awayId: string;
  settings: Settings;
  teams: TeamDef[];
  onHome: (id: string) => void;
  onAway: (id: string) => void;
  onSettings: (s: Settings) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-5xl px-4 py-6">
      <button className="text-sm text-mint" onClick={props.onBack}>{tr("Назад", "Back")}</button>
      <h2 className="font-display mt-3 text-3xl uppercase">{tr("Свой матч", "Custom match")}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TeamColumn title={tr("Хозяева", "Home")} teams={props.teams} selected={props.homeId} onPick={props.onHome} />
        <TeamColumn title={tr("Гости", "Away")} teams={props.teams} selected={props.awayId} onPick={props.onAway} />
      </div>
      <MatchOptions settings={props.settings} onChange={props.onSettings} />
      <button className="btn-main mt-5 w-full sm:w-auto" disabled={props.homeId === props.awayId} onClick={props.onStart}>
        Start
      </button>
      {props.homeId === props.awayId && <p className="mt-2 text-sm text-mint">{tr("Нужны две разные команды", "Pick two different teams")}</p>}
    </main>
  );
}

function AuthorsScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-3xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>{tr("Назад", "Back")}</button>
      <h2 className="font-display mt-3 text-3xl uppercase">{tr("Авторы", "Credits")}</h2>
      <section className="card mt-4">
        <p className="text-xs tracking-widest text-fg/50 uppercase">{tr("Об игре", "About")}</p>
        <p className="mt-2 text-sm text-fg/80">
          {tr(
            "«Родной мяч» — футбольная игра о трёх лигах и о Васе Иванове: чувашской, волжской и сибирской. Быстрый матч, карьера тренера, карьера игрока, история, судейство и Кубок России на все 24 клуба. Составы, схема, трансферы и статистика сезона сохраняются в браузере.",
            "Home Ball is a football game about three leagues and Vasya Ivanov: Chuvash, Volga and Siberian. Quick match, manager career, player career, story, refereeing and the Russian Cup across all 24 clubs. Squads, shape, transfers and the season stay in the browser.",
          )}
        </p>
        <p className="mt-3 font-display text-sm tracking-widest text-mint uppercase">{tr("Версия 1.0", "Version 1.0")}</p>
      </section>
      <section className="card mt-3">
        <p className="text-xs tracking-widest text-fg/50 uppercase">{tr("Авторы", "Credits")}</p>
        <p className="mt-2 text-sm text-fg/80">
          {tr("Игру создали Иван и Михаил Колосовы с помощью AI GROK.", "The game was made by Ivan and Mikhail Kolosov with AI GROK.")}
        </p>
      </section>
    </main>
  );
}

function SettingsScreen({ settings, onChange, onBack }: { settings: Settings; onChange: (s: Settings) => void; onBack: () => void }) {
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-3xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>{tr("Назад", "Back")}</button>
      <h2 className="font-display mt-3 text-3xl uppercase">{tr("Настройки", "Settings")}</h2>
      <p className="mt-2 text-sm text-fg/70">{tr("Быстрый матч, карьеры и история. Матчи судьи всегда две минуты: тайм по одной.", "Quick match, careers and story. Referee matches are always two minutes: one minute each half.")}</p>
      <MatchOptions settings={settings} onChange={onChange} />
    </main>
  );
}

function halfText(matchMin: number) {
  const sec = Math.round((matchMin / 2) * 60);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (s === 0) return tr(`${m} мин`, `${m} min`);
  return tr(`${m} мин ${s} сек`, `${m} min ${s} sec`);
}

function MatchOptions({ settings, onChange }: { settings: Settings; onChange: (s: Settings) => void }) {
  return (
    <div className="mt-4 grid gap-4">
      <div>
        <p className="text-xs tracking-widest text-fg/50 uppercase">{tr("Язык", "Language")}</p>
        <p className="mt-1 text-sm text-fg/60">{tr("Русский по умолчанию. В английском деньги карьеры показываются в долларах.", "Russian is the default. In English, career money is shown in dollars.")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={settings.lang === "ru" ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, lang: "ru" })}>Русский</button>
          <button className={settings.lang === "en" ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, lang: "en" })}>English</button>
        </div>
      </div>
      <div>
        <p className="text-xs tracking-widest text-fg/50 uppercase">{tr("Длительность матча", "Match length")}</p>
        <p className="mt-1 text-sm text-fg/60">{tr("Это весь матч. Два тайма, каждый ровно в два раза короче. Пауза и перерыв время не тратят.", "This is the whole match. Two halves, each exactly half as long. Pause and half-time do not spend the clock.")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[2, 3, 4, 5].map((n) => (
            <button key={n} className={settings.matchMin === n ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, matchMin: n })}>
              {n} {tr("мин", "min")}
              <span className="mt-0.5 block font-sans text-[10px] font-normal normal-case tracking-normal">{tr(`2 тайма по ${halfText(n)}`, `2 halves of ${halfText(n)}`)}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs tracking-widest text-fg/50 uppercase">{tr("Сложность", "Difficulty")}</p>
        <p className="mt-1 text-sm text-fg/60">{tr("Выше уровень — соперник точнее бьёт, держит позиции и жёстче отбирает. На Легенде Волги прессинг плотный, а удары опаснее. Жёсткий отбор сзади — карточка. Травм в игре нет.", "Higher levels shoot truer, hold their shape and tackle harder. Volga Legend presses tight and finishes more. A cynical tackle from behind is a card. There are no injuries.")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DIFFS.map((d) => (
            <button key={d.id} className={settings.difficulty === d.id ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, difficulty: d.id })}>{settings.lang === "en" ? d.en : d.ru}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs tracking-widest text-fg/50 uppercase">{tr("Скорость матча", "Match speed")}</p>
        <p className="mt-1 text-sm text-fg/60">{tr("Медленно, обычно или быстро — на любой сложности. Меняет бег и мяч. Часы 90 минут остаются выбранной длиной.", "Slow, normal or fast, on every difficulty. It changes running and the ball. The 90-minute clock stays the length you picked.")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SPEEDS.map((s) => (
            <button key={s.id} className={settings.speed === s.id ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, speed: s.id })}>{settings.lang === "en" ? s.en : s.ru}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs tracking-widest text-fg/50 uppercase">{tr("Звук", "Sound")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={settings.sound ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, sound: true })}>{tr("Вкл", "On")}</button>
          <button className={!settings.sound ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, sound: false })}>{tr("Выкл", "Off")}</button>
        </div>
      </div>
      <div>
        <p className="text-xs tracking-widest text-fg/50 uppercase">{tr("Управление", "Controls")}</p>
        <p className="mt-1 text-sm text-fg/60">{tr("Удерживайте пас и удар, чтобы набрать силу. Геймпад: крест/A пас, круг/B удар, квадрат/X отбор, треугольник/Y или L1 смена, R1/R2 рывок, Options/Start пауза.", "Hold pass and shoot to add power. Pad: cross/A pass, circle/B shoot, square/X tackle, triangle/Y or L1 switch, R1/R2 sprint, Options/Start pause.")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={settings.scheme === "both" ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, scheme: "both" })}>{tr("Джойстик и клавиатура", "Pad and keyboard")}</button>
          <button className={settings.scheme === "touch" ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, scheme: "touch" })}>{tr("Сенсор", "Touch")}</button>
          <button className={settings.scheme === "keys" ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, scheme: "keys" })}>{tr("Только клавиатура", "Keyboard only")}</button>
        </div>
      </div>
      <KeysHelp />
    </div>
  );
}

function KeysHelp() {
  const rows = [
    [tr("W A S D или стрелки", "W A S D or arrows"), tr("Бег", "Run")],
    [tr("Пробел или J, удерживать", "Space or J, hold"), tr("Пас, сила от нажатия", "Pass, power from the hold")],
    [tr("F или K, удерживать", "F or K, hold"), tr("Удар, сила от нажатия", "Shot, power from the hold")],
    ["Shift", tr("Рывок", "Sprint")],
    [tr("Q или Tab", "Q or Tab"), tr("Смена игрока, только без мяча", "Switch player, only after you lose the ball")],
    ["C", tr("Отбор", "Tackle")],
    ["R", tr("Быстрая замена, только со своим мячом", "Quick sub, only with the ball")],
    ["Esc", tr("Пауза", "Pause")],
    [tr("Правая кнопка мыши", "Right mouse button"), tr("Удар в сторону курсора", "Shot toward the cursor")],
  ];
  return (
    <div>
      <p className="text-xs tracking-widest text-fg/50 uppercase">{tr("Информация", "Info")}</p>
      <ul className="mt-2 grid gap-1 text-sm">
        {rows.map(([key, act]) => (
          <li key={key} className="flex justify-between gap-3 border-b border-fg/10 py-1">
            <span>{key}</span>
            <span className="text-fg/70">{act}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamColumn({ title, teams, selected, onPick }: { title: string; teams: TeamDef[]; selected: string; onPick: (id: string) => void }) {
  return (
    <section>
      <h3 className="font-display text-sm tracking-widest uppercase text-fg/60">{title}</h3>
      <div className="mt-2 grid gap-2">
        {teams.map((t) => (
          <button key={t.id} className={selected === t.id ? "card card-on flex items-center gap-3" : "card flex items-center gap-3"} onClick={() => onPick(t.id)}>
            <Crest id={t.id} className="h-10 w-10" />
            <span className="text-left">
              <span className="block font-display uppercase">{t.name}</span>
              <span className="text-xs text-fg/60">{t.city} · {tr("рейтинг", "rating")} {clubRating(t.id)}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function MatchLayer({
  snap,
  canvasRef,
  simRef,
  picked,
  subMsg,
  career,
  showTouch,
  onPick,
  onSubMsg,
  onLeave,
  onDone,
  onAgain,
}: {
  snap: Snap;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  simRef: RefObject<MatchSim | null>;
  picked: string | null;
  subMsg: string;
  career: boolean;
  showTouch: boolean;
  onPick: (id: string | null) => void;
  onSubMsg: (s: string) => void;
  onLeave: () => void;
  onDone: () => void;
  onAgain: (() => void) | null;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const sim = simRef.current;
    rootRef.current?.focus();
    if (!canvas || !sim) return;
    sim.bindCanvas(canvas);
    const ro = new ResizeObserver(() => sim.resize());
    ro.observe(canvas);
    document.body.style.overflow = "hidden";
    const blockGesture = (e: Event) => e.preventDefault();
    canvas.addEventListener("gesturestart", blockGesture);
    canvas.addEventListener("gesturechange", blockGesture);
    return () => {
      ro.disconnect();
      canvas.removeEventListener("gesturestart", blockGesture);
      canvas.removeEventListener("gesturechange", blockGesture);
      unlockInput();
    };
  }, [canvasRef, simRef]);

  function worldFromEvent(e: ReactMouseEvent<HTMLCanvasElement>) {
    const sim = simRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!sim) return;
    sim.aim = sim.pointerWorld(e.clientX - rect.left, e.clientY - rect.top);
  }

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      className="match-field fixed inset-0 overflow-hidden bg-bg outline-none select-none"
      style={{ touchAction: "none" }}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).tagName === "CANVAS") return;
        e.preventDefault();
      }}
      onPointerDown={() => rootRef.current?.focus()}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-none"
        onContextMenu={(e) => {
          e.preventDefault();
          if (snap.referee) return;
          if (e.nativeEvent instanceof PointerEvent && e.nativeEvent.pointerType !== "mouse") return;
          worldFromEvent(e);
          simRef.current?.fire("shoot", 1);
        }}
        onPointerDown={(e) => {
          rootRef.current?.focus();
          if (e.pointerType !== "mouse" || e.button !== 0) return;
          worldFromEvent(e);
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="safe-top flex items-start justify-between gap-2 px-3 pt-3">
          <div className="pointer-events-auto min-w-0 rounded-2xl border border-fg/15 bg-bg/80 px-2.5 py-1.5 backdrop-blur-xl">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-display text-xs uppercase">{snap.half === 1 ? tr("1-й тайм", "1st half") : tr("2-й тайм", "2nd half")}</span>
              <span className="font-display text-sm tabular-nums sm:text-base">{snap.time}</span>
              <Crest id={snap.homeCode} className="hidden h-6 w-6 sm:block" />
              <span className="font-display text-xs sm:text-sm">{snap.homeCode}</span>
              <span className="font-display text-base tabular-nums sm:text-lg">{snap.score[0]}:{snap.score[1]}</span>
              <span className="font-display text-xs sm:text-sm">{snap.awayCode}</span>
              <Crest id={snap.awayCode} className="hidden h-6 w-6 sm:block" />
            </div>
            <p className="mt-0.5 truncate font-display text-xs tracking-wide uppercase">{snap.carrier}</p>
          </div>
          <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-1">
            <button className="chip" onClick={() => simRef.current?.togglePause()}>{tr("Пауза", "Pause")}</button>
            {snap.phase !== "intro" && snap.phase !== "fulltime" && (
              <button className="chip" onClick={() => simRef.current?.simulateToEnd()}>{tr("Продолжить и выйти", "Sim and exit")}</button>
            )}
          </div>
        </div>
        {snap.call && (
          <div className="absolute top-36 right-3 left-3 text-center">
            <p className="font-display text-lg text-gold uppercase">{snap.call === "foul" ? tr("Фол?", "Foul?") : tr("Офсайд?", "Offside?")}</p>
            <p className="text-sm text-fg/80">{snap.callText}</p>
          </div>
        )}
        {snap.goal && (
          <div key={snap.goal.seq} className="goal-card safe-bot pointer-events-none absolute right-3 bottom-36 left-3">
            <p className="font-display text-xs tracking-widest text-mint uppercase">{snap.goal.own ? tr("Автогол", "Own goal") : tr("Гол", "Goal")} · {snap.goal.minute}</p>
            <p className="font-display text-2xl uppercase">{snap.goal.name}</p>
            {snap.goal.assist && <p className="text-sm text-fg/70">{tr("Пас", "Assist")}: {snap.goal.assist}</p>}
          </div>
        )}
      </div>
      {snap.referee ? <RefPad simRef={simRef} /> : showTouch && snap.phase !== "intro" && <TouchControls simRef={simRef} locked={snap.locked} canSwitch={snap.canSwitch} canSub={snap.canSub} />}
      {snap.phase === "intro" && (
        <div className="safe-bot absolute inset-x-0 bottom-0 max-h-[48%] overflow-auto px-3 pb-3">
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-fg/15 bg-bg/85 p-4 backdrop-blur-xl">
            <p className="font-display text-xs tracking-widest text-mint uppercase">{tr("Выход команд", "Teams out")} · {snap.stadium}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <LineList title={snap.homeName} rows={snap.xi} />
              <LineList title={snap.awayName} rows={snap.awayXi} />
            </div>
            <p className="mt-3 text-xs tracking-widest text-fg/50 uppercase">{tr("Форма — без обоих выборов матч не начнётся", "Kits — the match will not start until both are chosen")}</p>
            <KitChoices snap={snap} onPick={(side, kit) => simRef.current?.setSideKit(side, kit)} />
            <p className="mt-3 text-sm text-fg/80">{tr("Сводка", "Lineups")}: {snap.homeName} {snap.homeShape} · {snap.awayName} {snap.awayShape}</p>
            <p className="mt-3 text-xs tracking-widest text-fg/50 uppercase">{tr("Погода", "Weather")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className={snap.weather === "clear" ? "chip-on" : "chip"} onClick={() => simRef.current?.setWeather("clear")}>{tr("Ясно", "Clear")}</button>
              <button className={snap.weather === "rain" ? "chip-on" : "chip"} onClick={() => simRef.current?.setWeather("rain")}>{tr("Дождь", "Rain")}</button>
              <button className={snap.weather === "snow" ? "chip-on" : "chip"} onClick={() => simRef.current?.setWeather("snow")}>{tr("Снег", "Snow")}</button>
            </div>
            <button className="btn-main mt-4" disabled={!snap.kitsReady} onClick={() => simRef.current?.beginPlay()}>
              {snap.kitsReady ? tr("На поле", "Onto the pitch") : tr("Сначала выберите обе формы", "Choose both kits first")}
            </button>
          </div>
        </div>
      )}
      {snap.paused && (
        <Pause simRef={simRef} snap={snap} picked={picked} subMsg={subMsg} onPick={onPick} onSubMsg={onSubMsg} onLeave={onLeave} />
      )}
      {snap.phase === "halftime" && !snap.paused && (
        <Overlay title={tr("Перерыв", "Half time")} text={`${snap.homeName} ${snap.score[0]} : ${snap.score[1]} ${snap.awayName}`}>
          <ul className="mb-3 space-y-1 text-sm text-fg/80">
            <li>{tr("Удары", "Shots")}: {snap.shots[0]} — {snap.shots[1]}</li>
            <li>{tr("Владение", "Possession")}: {snap.possPct[0]}% — {snap.possPct[1]}%</li>
            <li>{tr("Пасы", "Passes")}: {snap.passes[0]} — {snap.passes[1]}</li>
            <li>{tr("Фолы", "Fouls")}: {snap.fouls[0]} — {snap.fouls[1]}</li>
            <li>{tr("Жёлтые", "Yellows")}: {snap.yellows[0]} — {snap.yellows[1]}</li>
            <li>{tr("Красные", "Reds")}: {snap.reds[0]} — {snap.reds[1]}</li>
            <li>{tr("Пенальти", "Penalties")}: {snap.pens[0]} — {snap.pens[1]}</li>
            <li>{tr("Офсайды", "Offsides")}: {snap.offsides[0]} — {snap.offsides[1]}</li>
            {snap.referee && <li>{tr("Судья", "Referee")}: {tr("верно", "correct")} {snap.refCorrect}, {tr("ошибки", "wrong")} {snap.refWrong}</li>}
          </ul>
          <div className="flex flex-col gap-2">
            <button className="btn-main" onClick={() => simRef.current?.continueHalf()}>{tr("Второй тайм", "Second half")}</button>
            <button className="btn-ghost" onClick={() => simRef.current?.togglePause()}>{snap.referee ? tr("Пауза", "Pause") : tr("Пауза и замены", "Pause and subs")}</button>
            <button className="btn-ghost" onClick={() => simRef.current?.simulateToEnd()}>{tr("Продолжить и выйти", "Sim and exit")}</button>
          </div>
        </Overlay>
      )}
      {snap.phase === "fulltime" && (
        <Overlay title={tr("Финальный свисток", "Full time")} text={`${snap.homeName} ${snap.score[0]} : ${snap.score[1]} ${snap.awayName}`}>
          <ul className="mb-3 max-h-52 space-y-1 overflow-auto text-sm text-fg/80">
            <li>{tr("Голы", "Goals")}: {snap.scorers.length === 0 ? tr("без голов", "no goals") : snap.scorers.map((g) => `${g.minute} ${g.name}${g.own ? tr(" (автогол)", " (own goal)") : ""}${g.assist ? `, ${tr("пас", "assist")} ${g.assist}` : ""}`).join(" · ")}</li>
            <li>{tr("Удары", "Shots")}: {snap.shots[0]} — {snap.shots[1]}</li>
            <li>{tr("Владение", "Possession")}: {snap.possPct[0]}% — {snap.possPct[1]}%</li>
            <li>{tr("Пасы", "Passes")}: {snap.passes[0]} — {snap.passes[1]}</li>
            <li>{tr("Фолы", "Fouls")}: {snap.fouls[0]} — {snap.fouls[1]}</li>
            <li>{tr("Жёлтые", "Yellows")}: {snap.yellows[0]} — {snap.yellows[1]}</li>
            <li>{tr("Красные", "Reds")}: {snap.reds[0]} — {snap.reds[1]}</li>
            <li>{tr("Пенальти", "Penalties")}: {snap.pens[0]} — {snap.pens[1]}</li>
            <li>{tr("Офсайды", "Offsides")}: {snap.offsides[0]} — {snap.offsides[1]}</li>
            {snap.added > 0 && <li>{tr("Компенсированное", "Added time")}: +{snap.added}</li>}
            {snap.referee && <li>{tr("Судья", "Referee")}: {tr("верно", "correct")} {snap.refCorrect}, {tr("ошибки", "wrong")} {snap.refWrong}</li>}
          </ul>
          <div className="mb-3 rounded-2xl border border-gold/40 bg-gold/10 px-3 py-2">
            <p className="font-display text-xs tracking-widest text-gold uppercase">{tr("Критики", "Critics")} · {snap.critic.mark}</p>
            <p className="font-display uppercase">{snap.critic.title}</p>
            <p className="text-sm text-fg/75">{snap.critic.text}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button className="btn-main" onClick={onDone}>{career ? tr("В карьеру", "Back to career") : tr("В меню", "Menu")}</button>
            {!career && onAgain && <button className="btn-ghost" onClick={onAgain}>{tr("Заново", "Again")}</button>}
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Stam({ value }: { value: number }) {
  const tone = value > 55 ? "bg-mint" : value > 28 ? "bg-gold" : "bg-hot";
  return (
    <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-fg/15">
      <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function TouchControls({ simRef, locked, canSwitch, canSub }: { simRef: RefObject<MatchSim | null>; locked: boolean; canSwitch: boolean; canSub: boolean }) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const limit = 28;
  function setStick(x: number, y: number) {
    const sim = simRef.current;
    if (!sim) return;
    sim.touch.x = x;
    sim.touch.y = y;
  }
  function reset() {
    origin.current = null;
    setKnob({ x: 0, y: 0 });
    setStick(0, 0);
  }
  return (
    <div className="safe-bot pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-3 pb-3">
      <div
        className="pointer-events-auto relative h-28 w-28 overflow-hidden rounded-full border border-fg/20 bg-bg/50"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          origin.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (!origin.current) return;
          const dx = e.clientX - origin.current.x;
          const dy = e.clientY - origin.current.y;
          const mag = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, mag / 48);
          const x = (dx / mag) * k;
          const y = -(dy / mag) * k;
          const reach = Math.min(limit, k * limit);
          setKnob({ x: (dx / mag) * reach, y: (dy / mag) * reach });
          setStick(x, y);
        }}
        onPointerUp={reset}
        onPointerCancel={reset}
        onLostPointerCapture={reset}
      >
        <span
          className="pointer-events-none absolute h-12 w-12 rounded-full bg-mint"
          style={{ left: "50%", top: "50%", transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
      <div className="pointer-events-auto grid grid-cols-3 gap-2">
        <Hold label={tr("Пас", "Pass")} onDown={() => simRef.current?.arm("pass")} onUp={() => simRef.current?.release("pass")} />
        <Hold label={tr("Удар", "Shot")} onDown={() => simRef.current?.arm("shoot")} onUp={() => simRef.current?.release("shoot")} />
        <Hold label={tr("Рывок", "Sprint")} onDown={() => simRef.current?.holdSprint(true)} onUp={() => simRef.current?.holdSprint(false)} />
        {!locked && <Tap label={tr("Смена", "Switch")} disabled={!canSwitch} onTap={() => simRef.current?.tap("switch")} />}
        <Tap label={tr("Отбор", "Tackle")} onTap={() => simRef.current?.tap("tackle")} />
        {!locked && <Tap label={tr("Замена", "Sub")} disabled={!canSub} onTap={() => simRef.current?.tap("quick")} />}
      </div>
    </div>
  );
}

function RefPad({ simRef }: { simRef: RefObject<MatchSim | null> }) {
  return (
    <div className="safe-bot pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3">
      <p className="pointer-events-none mb-2 text-center text-[11px] text-fg/80">{tr("Штрафной и пенальти ставятся сами, по месту фола.", "Free kicks and penalties follow the foul. You do not pick them.")}</p>
      <div className="pointer-events-auto mx-auto grid max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
        <Tap label={tr("Жёлтая", "Yellow")} onTap={() => simRef.current?.judge("yellow")} />
        <Tap label={tr("Красная", "Red")} onTap={() => simRef.current?.judge("red")} />
        <Tap label={tr("Офсайд", "Offside")} onTap={() => simRef.current?.judge("offside")} />
        <Tap label={tr("Не офсайд", "Not offside")} onTap={() => simRef.current?.judge("notoffside")} />
        <Tap label={tr("Фол", "Foul")} onTap={() => simRef.current?.judge("foul")} />
        <Tap label={tr("Нет фола", "No foul")} onTap={() => simRef.current?.judge("clear")} />
      </div>
    </div>
  );
}

function Tap({ label, onTap, disabled }: { label: string; onTap: () => void; disabled?: boolean }) {
  return (
    <button
      className={`h-11 min-w-14 rounded-full px-2 font-display text-xs tracking-wide uppercase ${disabled ? "cursor-default bg-fg/10 text-fg/30" : "bg-pitch text-fg"}`}
      disabled={disabled}
      onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) onTap(); }}
    >
      {label}
    </button>
  );
}
function Hold({ label, onDown, onUp }: { label: string; onDown: () => void; onUp: () => void }) {
  return (
    <button
      className="h-11 min-w-14 rounded-full bg-card px-2 font-display text-xs tracking-wide text-mint uppercase"
      onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onDown(); }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {label}
    </button>
  );
}

function Pause({
  simRef,
  snap,
  picked,
  subMsg,
  onPick,
  onSubMsg,
  onLeave,
}: {
  simRef: RefObject<MatchSim | null>;
  snap: Snap;
  picked: string | null;
  subMsg: string;
  onPick: (id: string | null) => void;
  onSubMsg: (s: string) => void;
  onLeave: () => void;
}) {
  const mineXi = snap.userSide === 0 ? snap.xi : snap.awayXi;
  const mineBench = snap.userSide === 0 ? snap.bench : snap.awayBench;
  return (
    <div className="safe-top safe-bot absolute inset-0 overflow-auto bg-bg/80 px-4 py-6 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="font-display text-3xl uppercase">{snap.referee ? tr("Пауза", "Pause") : tr("Тактика", "Tactics")}</h2>
        {!snap.referee && (
          <>
            <p className="text-sm text-fg/70">{tr("Схема сразу меняет позиции и то, куда игроки бегут.", "The shape changes positions and where players run.")} {tr("Сейчас", "Now")} {snap.formation}.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {FORMATION_IDS.map((id) => (
                <button key={id} className={snap.formation === id ? "chip-on" : "chip"} onClick={() => { simRef.current?.applyFormation(snap.userSide, id, true); onSubMsg(""); onPick(null); }}>
                  {id}
                </button>
              ))}
            </div>
            {!snap.locked && <p className="mt-3 text-sm text-fg/70">{tr("Замен осталось", "Subs left")}: {snap.subs}. {snap.canSub ? tr("Нажмите игрока основы, затем запасного. Замена только со своим мячом.", "Tap a starter, then a substitute. Subs only while your team has the ball.") : tr("Сейчас мяч не ваш — замену сделать нельзя.", "You do not have the ball, so you cannot make a sub.")}</p>}
            {snap.locked && <p className="mt-3 text-sm text-fg/70">{tr("На поле вы управляете только своим игроком. Схему команды всё равно можно сменить.", "On the pitch you control only your player. You can still change the team shape.")}</p>}
            {subMsg && <p className="mt-2 text-sm text-mint">{subMsg}</p>}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ul className="grid gap-2">
                {mineXi.map((p) => (
                  <li key={p.uid}>
                    <button className={picked === p.uid ? "card card-on w-full text-left" : "card w-full text-left"} onClick={() => !snap.locked && onPick(p.uid)}>
                      <span className="font-display uppercase">{p.num} {p.name}</span>
                      <span className="ml-2 text-xs text-fg/60">{p.role} {p.ovr}</span>
                      <Stam value={p.stamina} />
                    </button>
                  </li>
                ))}
              </ul>
              {!snap.locked && (
              <ul className="grid gap-2">
                {mineBench.map((p) => (
                  <li key={p.uid}>
                    <button
                      className="card w-full text-left"
                      onClick={() => {
                        if (!picked) {
                          onSubMsg(tr("Сначала выберите игрока на поле", "Pick a player on the pitch first"));
                          return;
                        }
                        const err = simRef.current?.substitute(picked, p.uid);
                        onSubMsg(err ?? tr(`${p.name} вышел`, `${p.name} is on`));
                        if (!err) onPick(null);
                      }}
                    >
                      <span className="font-display uppercase">{p.num} {p.name}</span>
                      <span className="ml-2 text-xs text-fg/60">{p.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
              )}
            </div>
          </>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button className="btn-main" onClick={() => simRef.current?.togglePause()}>{snap.phase === "halftime" ? tr("К перерыву", "Back to the break") : tr("Продолжить", "Resume")}</button>
          {snap.phase !== "intro" && snap.phase !== "fulltime" && (
            <button className="btn-ghost" onClick={() => simRef.current?.simulateToEnd()}>{tr("Продолжить и выйти", "Sim and exit")}</button>
          )}
          <button className="btn-ghost" onClick={onLeave}>{tr("Выйти", "Quit")}</button>
        </div>
      </div>
    </div>
  );
}

function Overlay({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg/75 px-4 backdrop-blur-xl">
      <div className="card max-h-[86vh] w-full max-w-md overflow-auto">
        <h2 className="font-display text-3xl uppercase">{title}</h2>
        <p className="mt-2 text-fg/80">{text}</p>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function KitChoices({ snap, onPick }: { snap: Snap; onPick: (side: 0 | 1, kit: KitId) => void }) {
  const you: 0 | 1 = snap.userSide;
  const them: 0 | 1 = you === 0 ? 1 : 0;
  return (
    <div className="mt-2 grid gap-3 sm:grid-cols-2">
      <KitRow title={tr("Ваша форма", "Your kit")} side={you} picked={you === 0 ? snap.homeKit : snap.awayKit} colors={you === 0 ? snap.homeSwatch : snap.awaySwatch} onPick={onPick} />
      <KitRow title={tr("Форма соперника", "Opponent kit")} side={them} picked={them === 0 ? snap.homeKit : snap.awayKit} colors={them === 0 ? snap.homeSwatch : snap.awaySwatch} onPick={onPick} />
    </div>
  );
}

function KitRow({
  title,
  side,
  picked,
  colors,
  onPick,
}: {
  title: string;
  side: 0 | 1;
  picked: KitId | null;
  colors: [string, string];
  onPick: (side: 0 | 1, kit: KitId) => void;
}) {
  return (
    <div>
      <p className="text-xs text-fg/60">{title}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        <button className={picked === "primary" ? "chip-on" : "chip"} onClick={() => onPick(side, "primary")}>
          <i className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors[0] }} />
          {tr("Цвет клуба", "Club colour")}
        </button>
        <button className={picked === "inverse" ? "chip-on" : "chip"} onClick={() => onPick(side, "inverse")}>
          <i className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors[1] }} />
          {tr("Инверсия", "Inverse")}
        </button>
      </div>
    </div>
  );
}

function LineList({ title, rows }: { title: string; rows: Snap["xi"] }) {
  return (
    <div>
      <p className="font-display text-sm uppercase">{title}</p>
      <ul className="mt-1 text-xs text-fg/80">
        {rows.map((p) => (
          <li key={p.uid}>{p.num} {p.name} · {p.role}</li>
        ))}
      </ul>
    </div>
  );
}

function SavesFolder({
  onBack,
  onOpen,
  onClear,
  onRewrite,
  manager,
  player,
  story,
  referee,
  cup,
  settingsNote,
}: {
  onBack: () => void;
  onOpen: (id: "manager" | "player" | "story" | "referee" | "cup" | "settings") => void;
  onClear: (id: "manager" | "player" | "story" | "referee" | "cup") => void;
  onRewrite: (id: "manager" | "player" | "story" | "referee" | "cup") => void;
  manager: CareerState | null;
  player: CareerState | null;
  story: StoryState | null;
  referee: RefState | null;
  cup: CupState | null;
  settingsNote: string;
}) {
  const files: { id: "manager" | "player" | "story" | "referee" | "cup" | "settings"; title: string; note: string; filled: boolean }[] = [
    { id: "settings", title: tr("Настройки", "Settings"), note: settingsNote, filled: true },
    { id: "manager", title: tr("Карьера тренера", "Manager career"), note: manager ? teamName(manager.teamId) : tr("пусто", "empty"), filled: Boolean(manager) },
    { id: "player", title: tr("Карьера игрока", "Player career"), note: player ? teamName(player.teamId) : tr("пусто", "empty"), filled: Boolean(player) },
    { id: "story", title: tr("История", "Story"), note: story ? teamName(story.teamId) : tr("пусто", "empty"), filled: Boolean(story) },
    { id: "referee", title: tr("Карьера судьи", "Referee career"), note: referee ? referee.name : tr("пусто", "empty"), filled: Boolean(referee) },
    { id: "cup", title: tr("Кубок России", "Russian Cup"), note: cup ? teamName(cup.teamId) : tr("пусто", "empty"), filled: Boolean(cup) },
  ];
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-3xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>{tr("Назад", "Back")}</button>
      <h2 className="font-display mt-3 text-3xl uppercase">{tr("Папка сохранений", "Save folder")}</h2>
      <p className="mt-2 text-sm text-fg/70">{tr("Выберите сохранение и продолжайте. Перезапись стирает прогресс режима и начинает заново.", "Pick a save and carry on. Overwrite wipes that mode and starts it again.")}</p>
      <ul className="mt-4 grid gap-2">
        {files.map((file) => {
          const mode = file.id === "settings" ? null : file.id;
          return (
          <li key={file.id} className="card flex items-center justify-between gap-3">
            <span>
              <span className="font-display block uppercase">{file.title}</span>
              <span className="text-sm text-fg/60">{file.note}</span>
            </span>
            <span className="flex flex-wrap justify-end gap-2">
              {file.filled && (
                <button className="chip-on" onClick={() => onOpen(file.id)}>{tr("Продолжить", "Continue")}</button>
              )}
              {mode && (
                <button className="chip" onClick={() => onRewrite(mode)}>{file.filled ? tr("Перезаписать", "Overwrite") : tr("Начать", "Start")}</button>
              )}
              {mode && file.filled && (
                <button className="chip" onClick={() => onClear(mode)}>{tr("Удалить", "Delete")}</button>
              )}
            </span>
          </li>
          );
        })}
      </ul>
    </main>
  );
}

function teamName(id: string) {
  return TEAMS.find((t) => t.id === id)?.name ?? id;
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys: (codes: string[]) => void;
      ticks: () => number;
      debug: () => ReturnType<MatchSim["debug"]>;
    };
  }
}
