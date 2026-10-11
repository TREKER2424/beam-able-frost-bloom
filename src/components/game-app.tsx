import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from "react";
import { CareerDesk, ClubBrowser, ClubPage, CreatePlayer, PlayerDesk } from "@/components/career-ui";
import { RefereeCreate, RefereeDesk } from "@/components/referee-ui";
import { StoryBook } from "@/components/story-ui";
import { Crest } from "@/components/crests";
import { audio } from "@/game/audio";
import { careerLevel, createCareer, createManagerCareer, migrateLegacy, nextUserFixture, normalizeCareer, recordUserMatch, simulateIndex, simulateRest, toRoster, type CareerState } from "@/game/career";
import { clubRating, FORMATION_IDS, TEAMS } from "@/game/data";
import { applyRefMatch, createRef, refFixture, reviveRef, simulateRefMatch, type RefState } from "@/game/referee";
import { MatchSim, type DiffId, type KitId, type Snap } from "@/game/sim";
import { STORY, type StoryState } from "@/game/story";

type Screen =
  | "home"
  | "clubs"
  | "club"
  | "pick"
  | "settings"
  | "saves"
  | "match"
  | "manager"
  | "player"
  | "createPlayer"
  | "pickManager"
  | "pickPlayer"
  | "pickStory"
  | "story"
  | "referee"
  | "refCreate";
type Scheme = "both" | "keys" | "touch";
type Settings = { halfMin: number; difficulty: DiffId; speed: number; sound: boolean; scheme: Scheme };
type Origin = "home" | "manager" | "player" | "story" | "referee";
type Play = { origin: Origin; index: number; userHome: boolean; final?: boolean } | null;

const MANAGER_KEY = "chuvash-ball-manager-v1";
const PLAYER_KEY = "chuvash-ball-player-v1";
const STORY_KEY = "chuvash-ball-story-v1";
const REF_KEY = "chuvash-ball-ref-v1";
const SAVE_V2 = "chuvash-ball-career-v2";
const SAVE_V1 = "chuvash-ball-career-v1";
const SETTINGS_KEY = "chuvash-ball-settings-v1";
const DIFFS: { id: DiffId; label: string }[] = [
  { id: "novice", label: "Новичок" },
  { id: "amateur", label: "Любитель" },
  { id: "pro", label: "Профессионал" },
  { id: "world", label: "Мировой класс" },
  { id: "legend", label: "Легенда Волги" },
];
const SPEEDS = [
  { id: 0.68, label: "Медленно" },
  { id: 1, label: "Обычно" },
  { id: 1.45, label: "Быстро" },
];
const DEFAULT_SETTINGS: Settings = { halfMin: 3, difficulty: "novice", speed: 1, sound: true, scheme: "both" };

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const data = JSON.parse(raw) as Partial<Settings>;
    let speed = typeof data.speed === "number" ? data.speed : 1;
    if (Math.abs(speed - 0.82) < 0.02) speed = 0.68;
    if (Math.abs(speed - 1.18) < 0.02) speed = 1.45;
    if (!SPEEDS.some((s) => s.id === speed)) speed = 1;
    const difficulty = DIFFS.some((d) => d.id === data.difficulty) ? data.difficulty! : "novice";
    const scheme: Scheme = data.scheme === "keys" || data.scheme === "touch" ? data.scheme : "both";
    const halfMin = [3, 4, 5, 6].includes(data.halfMin ?? 0) ? data.halfMin! : 3;
    return { halfMin, difficulty, speed, sound: data.sound !== false, scheme };
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
  const [screen, setScreen] = useState<Screen>("home");
  const [manager, setManager] = useState<CareerState | null>(null);
  const [player, setPlayer] = useState<CareerState | null>(null);
  const [story, setStory] = useState<StoryState | null>(null);
  const [refCareer, setRefCareer] = useState<RefState | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [homeId, setHomeId] = useState("KHM");
  const [awayId, setAwayId] = useState("SPM");
  const [clubId, setClubId] = useState("KHM");
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
    if (legacy) localStorage.setItem(MANAGER_KEY, JSON.stringify(legacy));
    setPlayer(loadPlayer());
    setStory(loadStory());
    setRefCareer(loadRef());
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    return () => {
      simRef.current?.stop();
      simRef.current = null;
    };
  }, []);

  function persistSettings(next: Settings) {
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }
  function persistManager(next: CareerState | null) {
    setManager(next);
    if (next) localStorage.setItem(MANAGER_KEY, JSON.stringify(next));
    else localStorage.removeItem(MANAGER_KEY);
  }
  function persistPlayer(next: CareerState | null) {
    setPlayer(next);
    if (next) localStorage.setItem(PLAYER_KEY, JSON.stringify(next));
    else localStorage.removeItem(PLAYER_KEY);
  }
  function persistStory(next: StoryState | null) {
    setStory(next);
    if (next) localStorage.setItem(STORY_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORY_KEY);
  }
  function persistRef(next: RefState | null) {
    setRefCareer(next);
    if (next) localStorage.setItem(REF_KEY, JSON.stringify(next));
    else localStorage.removeItem(REF_KEY);
  }

  function boot(sim: MatchSim, meta: Play, again?: () => void) {
    audio.unlock();
    sim.volume = settings.sound ? 0.8 : 0;
    simRef.current?.stop();
    sim.onHud = (s) => setSnap(s);
    simRef.current = sim;
    installProbe(sim);
    againRef.current = again ?? null;
    setPlay(meta);
    setSnap(sim.snapshot());
    setPicked(null);
    setSubMsg("");
    setScreen("match");
    sim.start();
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
      halfMin: settings.halfMin,
      difficulty,
      formation: career.formation,
      homeRoster: toRoster(career, home, career.lineup),
      awayRoster: toRoster(career, away, career.lineup),
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
    const opts = { homeId: h, awayId: a, halfMin: settings.halfMin, difficulty: settings.difficulty, speed: settings.speed };
    const meta: Play = { origin: "home", index: -1, userHome: true };
    boot(new MatchSim(opts), meta, () => boot(new MatchSim(opts), meta, againRef.current ?? undefined));
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

  function startRefMatch() {
    if (!refCareer) return;
    const fx = refFixture(refCareer.nextIndex);
    if (!fx) return;
    boot(
      new MatchSim({
        homeId: fx.home,
        awayId: fx.away,
        halfMin: settings.halfMin,
        difficulty: settings.difficulty,
        speed: settings.speed,
        referee: true,
        shapeSalt: refCareer.nextIndex,
      }),
      { origin: "referee", index: refCareer.nextIndex, userHome: true },
    );
  }

  function leaveMatch() {
    const origin = play?.origin ?? "home";
    simRef.current?.stop();
    simRef.current = null;
    setSnap(null);
    const back: Screen = origin === "home" ? "home" : origin === "manager" ? "manager" : origin === "player" ? "player" : origin === "story" ? "story" : "referee";
    setScreen(back);
  }

  function finishMatch() {
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
      persistRef(applyRefMatch(refCareer, {
        correct: snap.refCorrect,
        wrong: snap.refWrong,
        fouls: snap.fouls[0] + snap.fouls[1],
        yellows: snap.yellows[0] + snap.yellows[1],
        reds: snap.reds[0] + snap.reds[1],
        pens: snap.pens[0] + snap.pens[1],
        offsides: snap.offsides[0] + snap.offsides[1],
      }, { hg: snap.score[0], ag: snap.score[1] }));
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

  return (
    <div className="min-h-dvh bg-bg text-fg">
      {screen === "home" && (
        <Home
          hydrated={hydrated}
          hasManager={Boolean(manager)}
          hasPlayer={Boolean(player)}
          hasStory={Boolean(story)}
          hasRef={Boolean(refCareer)}
          onStart={() => startQuick("KHM", "SPM")}
          onPick={() => setScreen("pick")}
          onClubs={() => setScreen("clubs")}
          onSettings={() => setScreen("settings")}
          onSaves={() => setScreen("saves")}
          onManager={() => setScreen(manager ? "manager" : "pickManager")}
          onPlayer={() => setScreen(player ? "player" : "pickPlayer")}
          onStory={() => setScreen(story ? "story" : "pickStory")}
          onRef={() => setScreen(refCareer ? "referee" : "refCreate")}
        />
      )}
      {screen === "clubs" && (
        <ClubBrowser onBack={() => setScreen("home")} onOpen={(id) => { setClubId(id); setScreen("club"); }} />
      )}
      {screen === "club" && <ClubPage id={clubId} onBack={() => setScreen("clubs")} />}
      {screen === "pickManager" && (
        <ClubPick title="Карьера тренера" text="Состав, трансферы, тренировки клуба. В матче вы управляете всей командой." onBack={() => setScreen("home")} onChoose={(id) => { persistManager(createManagerCareer(id)); setScreen("manager"); }} />
      )}
      {screen === "pickPlayer" && (
        <ClubPick title="Карьера игрока" text="Выберите клуб. Дальше создадите футболиста: на поле можно бегать только им." onBack={() => setScreen("home")} onChoose={(id) => { setClubId(id); setScreen("createPlayer"); }} />
      )}
      {screen === "createPlayer" && (
        <CreatePlayer
          teamId={clubId}
          onBack={() => setScreen("pickPlayer")}
          onDone={(draft) => {
            persistPlayer(createCareer(clubId, draft));
            setScreen("player");
          }}
        />
      )}
      {screen === "pickStory" && (
        <ClubPick
          title="Клуб Васи Иванова"
          text="Вася начинает сезон здесь. В конце года место в таблице решает финал: пьедестал — счастливый, ниже третьего — нет. Новый сезон сохраняет трансферы и победы."
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
          onHome={setHomeId}
          onAway={setAwayId}
          onSettings={persistSettings}
          onBack={() => setScreen("home")}
          onStart={() => startQuick()}
        />
      )}
      {screen === "settings" && <SettingsScreen settings={settings} onChange={persistSettings} onBack={() => setScreen("home")} />}
      {screen === "saves" && (
        <SavesFolder
          onBack={() => setScreen("home")}
          onOpen={(id) => setScreen(id)}
          manager={manager}
          player={player}
          story={story}
          referee={refCareer}
          settingsNote={`${DIFFS.find((d) => d.id === settings.difficulty)?.label ?? ""} · звук ${settings.sound ? "вкл" : "выкл"} · ${settings.scheme === "keys" ? "клавиатура" : settings.scheme === "touch" ? "сенсор" : "джойстик и клавиатура"}`}
          onClear={(id) => {
            if (id === "manager") persistManager(null);
            if (id === "player") persistPlayer(null);
            if (id === "story") persistStory(null);
            if (id === "referee") persistRef(null);
          }}
          onRewrite={(id) => {
            if (id === "manager") { persistManager(null); setScreen("pickManager"); }
            if (id === "player") { persistPlayer(null); setScreen("pickPlayer"); }
            if (id === "story") { persistStory(null); setScreen("pickStory"); }
            if (id === "referee") { persistRef(null); setScreen("refCreate"); }
          }}
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
      {screen === "refCreate" && <RefereeCreate onBack={() => setScreen("home")} onDone={(name) => { persistRef(createRef(name)); setScreen("referee"); }} />}
      {screen === "referee" && refCareer && (
        <RefereeDesk state={refCareer} onMatch={startRefMatch} onSimulate={simulateRef} onMenu={() => setScreen("home")} onReset={() => { persistRef(null); setScreen("home"); }} onSave={() => persistRef(refCareer)} onChange={persistRef} />
      )}
      {screen === "match" && snap && (
        <MatchLayer
          snap={snap}
          canvasRef={canvasRef}
          simRef={simRef}
          picked={picked}
          subMsg={subMsg}
          career={play?.origin === "manager" || play?.origin === "player" || play?.origin === "story"}
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
  onStart,
  onPick,
  onClubs,
  onSettings,
  onSaves,
  onManager,
  onPlayer,
  onStory,
  onRef,
}: {
  hydrated: boolean;
  hasManager: boolean;
  hasPlayer: boolean;
  hasStory: boolean;
  hasRef: boolean;
  onStart: () => void;
  onPick: () => void;
  onClubs: () => void;
  onSettings: () => void;
  onSaves: () => void;
  onManager: () => void;
  onPlayer: () => void;
  onStory: () => void;
  onRef: () => void;
}) {
  return (
    <main className="safe-top safe-bot mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6">
      <p className="font-display text-xs tracking-widest text-mint uppercase">Чувашская Премьер-Лига 2026</p>
      <h1 className="font-display mt-2 text-5xl leading-none uppercase sm:text-7xl">
        Чувашский
        <span className="block text-mint">мяч</span>
      </h1>
      <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
        {TEAMS.map((t) => (
          <div key={t.id} className="flex flex-col items-center gap-1">
            <Crest id={t.id} className="h-12 w-12" />
            <span className="text-center text-xs leading-tight text-fg/70">{t.name}</span>
            <span className="text-center text-[10px] text-mint">{clubRating(t.id)}</span>
          </div>
        ))}
      </div>
      <section className="mt-8">
        <h2 className="font-display text-xs tracking-widest text-fg/50 uppercase">Быстрый матч</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button className="btn-main" aria-label="Start" onClick={onStart}>
            Start
            <span className="mt-1 block text-xs font-sans font-normal normal-case tracking-normal text-bg/80">Химик-Август — Спартак</span>
          </button>
          <button className="btn-ghost" onClick={onPick}>Свой матч</button>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-display text-xs tracking-widest text-fg/50 uppercase">Карьера</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <button className="btn-ghost" onClick={onPlayer}>{hydrated && hasPlayer ? "Игрок: продолжить" : "Карьера игрока"}</button>
          <button className="btn-ghost" onClick={onManager}>{hydrated && hasManager ? "Тренер: продолжить" : "Карьера тренера"}</button>
          <button className="btn-ghost" onClick={onRef}>{hydrated && hasRef ? "Судья: продолжить" : "Карьера судьи"}<span className="mt-1 block font-sans text-xs font-normal normal-case tracking-normal text-fg/60">Бета</span></button>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-display text-xs tracking-widest text-fg/50 uppercase">История</h2>
        <button className="btn-ghost mt-2 w-full sm:w-auto" onClick={onStory}>{hydrated && hasStory ? "Продолжить историю Васи" : "История Васи Иванова"}</button>
      </section>
      <section className="mt-6">
        <h2 className="font-display text-xs tracking-widest text-fg/50 uppercase">Информация</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button className="btn-ghost" onClick={onClubs}>Клубы и игроки</button>
          <button className="btn-ghost" onClick={onSettings}>Настройки</button>
          <button className="btn-ghost" onClick={onSaves}>Папка сохранений</button>
        </div>
      </section>
      <p className="mt-auto pt-10 text-center text-xs tracking-widest text-fg/40">BY KOLOSOV MADE AI</p>
    </main>
  );
}

function ClubPick({ title, text, onBack, onChoose }: { title: string; text: string; onBack: () => void; onChoose: (id: string) => void }) {
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-5xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>Назад</button>
      <h2 className="font-display mt-3 text-3xl uppercase">{title}</h2>
      <p className="mt-2 max-w-xl text-sm text-fg/70">{text}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {TEAMS.map((t) => (
          <button key={t.id} className="card flex items-center gap-3 text-left" onClick={() => onChoose(t.id)}>
            <Crest id={t.id} className="h-14 w-14 shrink-0" />
            <span>
              <span className="font-display block text-lg uppercase">{t.name}</span>
              <span className="text-sm text-fg/70">{t.city} · {t.stadium} · рейтинг {clubRating(t.id)}</span>
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
  onHome: (id: string) => void;
  onAway: (id: string) => void;
  onSettings: (s: Settings) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-5xl px-4 py-6">
      <button className="text-sm text-mint" onClick={props.onBack}>Назад</button>
      <h2 className="font-display mt-3 text-3xl uppercase">Свой матч</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TeamColumn title="Хозяева" selected={props.homeId} onPick={props.onHome} />
        <TeamColumn title="Гости" selected={props.awayId} onPick={props.onAway} />
      </div>
      <MatchOptions settings={props.settings} onChange={props.onSettings} />
      <button className="btn-main mt-5 w-full sm:w-auto" disabled={props.homeId === props.awayId} onClick={props.onStart}>
        Start
      </button>
      {props.homeId === props.awayId && <p className="mt-2 text-sm text-mint">Нужны две разные команды</p>}
    </main>
  );
}

function SettingsScreen({ settings, onChange, onBack }: { settings: Settings; onChange: (s: Settings) => void; onBack: () => void }) {
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-3xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>Назад</button>
      <h2 className="font-display mt-3 text-3xl uppercase">Настройки</h2>
      <p className="mt-2 text-sm text-fg/70">Действуют на быстрый матч, карьеры, историю и судейство.</p>
      <MatchOptions settings={settings} onChange={onChange} />
    </main>
  );
}

function MatchOptions({ settings, onChange }: { settings: Settings; onChange: (s: Settings) => void }) {
  return (
    <div className="mt-4 grid gap-4">
      <div>
        <p className="text-xs tracking-widest text-fg/50 uppercase">Длительность тайма</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[3, 4, 5, 6].map((n) => (
            <button key={n} className={settings.halfMin === n ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, halfMin: n })}>{n} мин</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs tracking-widest text-fg/50 uppercase">Сложность</p>
        <p className="mt-1 text-sm text-fg/60">Выше уровень — соперник точнее играет и жёстче входит в отбор. Забить и отобрать мяч сложнее, но обе команды всё равно пасуют и прессингуют.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DIFFS.map((d) => (
            <button key={d.id} className={settings.difficulty === d.id ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, difficulty: d.id })}>{d.label}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs tracking-widest text-fg/50 uppercase">Скорость матча</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SPEEDS.map((s) => (
            <button key={s.id} className={settings.speed === s.id ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, speed: s.id })}>{s.label}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs tracking-widest text-fg/50 uppercase">Звук</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={settings.sound ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, sound: true })}>Вкл</button>
          <button className={!settings.sound ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, sound: false })}>Выкл</button>
        </div>
      </div>
      <div>
        <p className="text-xs tracking-widest text-fg/50 uppercase">Управление</p>
        <p className="mt-1 text-sm text-fg/60">Удерживайте пас и удар, чтобы набрать силу. Геймпад: крест/A пас, круг/B удар, квадрат/X отбор, треугольник/Y или L1 смена, R1/R2 рывок, Options/Start пауза.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={settings.scheme === "both" ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, scheme: "both" })}>Джойстик и клавиатура</button>
          <button className={settings.scheme === "touch" ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, scheme: "touch" })}>Сенсор</button>
          <button className={settings.scheme === "keys" ? "chip-on" : "chip"} onClick={() => onChange({ ...settings, scheme: "keys" })}>Только клавиатура</button>
        </div>
      </div>
      <KeysHelp />
    </div>
  );
}

function KeysHelp() {
  const rows = [
    ["W A S D или стрелки", "Бег"],
    ["Пробел или J, удерживать", "Пас, сила от нажатия"],
    ["F или K, удерживать", "Удар, сила от нажатия"],
    ["Shift", "Рывок"],
    ["Q или Tab", "Смена игрока"],
    ["C", "Отбор"],
    ["R", "Быстрая замена"],
    ["Esc", "Пауза"],
    ["Правая кнопка мыши", "Удар в сторону курсора"],
  ];
  return (
    <div>
      <p className="text-xs tracking-widest text-fg/50 uppercase">Информация</p>
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

function TeamColumn({ title, selected, onPick }: { title: string; selected: string; onPick: (id: string) => void }) {
  return (
    <section>
      <h3 className="font-display text-sm tracking-widest uppercase text-fg/60">{title}</h3>
      <div className="mt-2 grid gap-2">
        {TEAMS.map((t) => (
          <button key={t.id} className={selected === t.id ? "card card-on flex items-center gap-3" : "card flex items-center gap-3"} onClick={() => onPick(t.id)}>
            <Crest id={t.id} className="h-10 w-10" />
            <span className="text-left">
              <span className="block font-display uppercase">{t.name}</span>
              <span className="text-xs text-fg/60">{t.city} · рейтинг {clubRating(t.id)}</span>
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      ro.disconnect();
      document.body.style.overflow = prev;
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
      className="fixed inset-0 overflow-hidden bg-bg outline-none"
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
              <span className="font-display text-xs uppercase">{snap.half === 1 ? "1-й тайм" : "2-й тайм"}</span>
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
            <button className="chip" onClick={() => simRef.current?.togglePause()}>Пауза</button>
            {snap.phase !== "intro" && snap.phase !== "fulltime" && (
              <button className="chip" onClick={() => simRef.current?.simulateToEnd()}>Продолжить и выйти</button>
            )}
          </div>
        </div>
        {snap.call && (
          <div className="absolute top-36 right-3 left-3 text-center">
            <p className="font-display text-lg text-gold uppercase">{snap.call === "foul" ? "Фол?" : "Офсайд?"}</p>
            <p className="text-sm text-fg/80">{snap.callText}</p>
          </div>
        )}
        {snap.goal && (
          <div key={snap.goal.seq} className="goal-card safe-bot pointer-events-none absolute right-3 bottom-36 left-3">
            <p className="font-display text-xs tracking-widest text-mint uppercase">{snap.goal.own ? "Автогол" : "Гол"} · {snap.goal.minute}</p>
            <p className="font-display text-2xl uppercase">{snap.goal.name}</p>
            {snap.goal.assist && <p className="text-sm text-fg/70">Пас: {snap.goal.assist}</p>}
          </div>
        )}
      </div>
      {snap.referee ? <RefPad simRef={simRef} /> : showTouch && snap.phase !== "intro" && <TouchControls simRef={simRef} locked={snap.locked} />}
      {snap.phase === "intro" && (
        <div className="safe-bot absolute inset-x-0 bottom-0 max-h-[48%] overflow-auto px-3 pb-3">
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-fg/15 bg-bg/85 p-4 backdrop-blur-xl">
            <p className="font-display text-xs tracking-widest text-mint uppercase">Выход команд · {snap.stadium}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <LineList title={snap.homeName} rows={snap.xi} />
              <LineList title={snap.awayName} rows={snap.awayXi} />
            </div>
            <p className="mt-3 text-xs tracking-widest text-fg/50 uppercase">Форма — без обоих выборов матч не начнётся</p>
            <KitChoices snap={snap} onPick={(side, kit) => simRef.current?.setSideKit(side, kit)} />
            <p className="mt-3 text-sm text-fg/80">Сводка: {snap.homeName} {snap.homeShape} · {snap.awayName} {snap.awayShape}</p>
            <p className="mt-3 text-xs tracking-widest text-fg/50 uppercase">Погода</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className={snap.weather === "clear" ? "chip-on" : "chip"} onClick={() => simRef.current?.setWeather("clear")}>Ясно</button>
              <button className={snap.weather === "rain" ? "chip-on" : "chip"} onClick={() => simRef.current?.setWeather("rain")}>Дождь</button>
              <button className={snap.weather === "snow" ? "chip-on" : "chip"} onClick={() => simRef.current?.setWeather("snow")}>Снег</button>
            </div>
            <button className="btn-main mt-4" disabled={!snap.kitsReady} onClick={() => simRef.current?.beginPlay()}>
              {snap.kitsReady ? "На поле" : "Сначала выберите обе формы"}
            </button>
          </div>
        </div>
      )}
      {snap.paused && (
        <Pause simRef={simRef} snap={snap} picked={picked} subMsg={subMsg} onPick={onPick} onSubMsg={onSubMsg} onLeave={onLeave} />
      )}
      {snap.phase === "halftime" && (
        <Overlay title="Перерыв" text={`${snap.score[0]} : ${snap.score[1]}`}>
          <div className="flex flex-col gap-2">
            <button className="btn-main" onClick={() => simRef.current?.continueHalf()}>Второй тайм</button>
            <button className="btn-ghost" onClick={() => simRef.current?.simulateToEnd()}>Продолжить и выйти</button>
          </div>
        </Overlay>
      )}
      {snap.phase === "fulltime" && (
        <Overlay title="Финальный свисток" text={`${snap.homeName} ${snap.score[0]} : ${snap.score[1]} ${snap.awayName}`}>
          <ul className="mb-3 max-h-52 space-y-1 overflow-auto text-sm text-fg/80">
            <li>Голы: {snap.scorers.length === 0 ? "без голов" : snap.scorers.map((g) => `${g.minute} ${g.name}${g.own ? " (автогол)" : ""}${g.assist ? `, пас ${g.assist}` : ""}`).join(" · ")}</li>
            <li>Удары: {snap.shots[0]} — {snap.shots[1]}</li>
            <li>Владение: {snap.possPct[0]}% — {snap.possPct[1]}%</li>
            <li>Пасы: {snap.passes[0]} — {snap.passes[1]}</li>
            <li>Фолы: {snap.fouls[0]} — {snap.fouls[1]}</li>
            <li>Жёлтые: {snap.yellows[0]} — {snap.yellows[1]}</li>
            <li>Красные: {snap.reds[0]} — {snap.reds[1]}</li>
            <li>Пенальти: {snap.pens[0]} — {snap.pens[1]}</li>
            <li>Офсайды: {snap.offsides[0]} — {snap.offsides[1]}</li>
            {snap.added > 0 && <li>Компенсированное: +{snap.added}</li>}
            {snap.referee && <li>Судья: верно {snap.refCorrect}, ошибки {snap.refWrong}</li>}
          </ul>
          <div className="mb-3 rounded-2xl border border-gold/40 bg-gold/10 px-3 py-2">
            <p className="font-display text-xs tracking-widest text-gold uppercase">Критики · {snap.critic.mark}</p>
            <p className="font-display uppercase">{snap.critic.title}</p>
            <p className="text-sm text-fg/75">{snap.critic.text}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button className="btn-main" onClick={onDone}>{career ? "В карьеру" : "В меню"}</button>
            {!career && onAgain && <button className="btn-ghost" onClick={onAgain}>Заново</button>}
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

function TouchControls({ simRef, locked }: { simRef: RefObject<MatchSim | null>; locked: boolean }) {
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
        <Hold label="Пас" onDown={() => simRef.current?.arm("pass")} onUp={() => simRef.current?.release("pass")} />
        <Hold label="Удар" onDown={() => simRef.current?.arm("shoot")} onUp={() => simRef.current?.release("shoot")} />
        <Hold label="Рывок" onDown={() => simRef.current?.holdSprint(true)} onUp={() => simRef.current?.holdSprint(false)} />
        {!locked && <Tap label="Смена" onTap={() => simRef.current?.tap("switch")} />}
        <Tap label="Отбор" onTap={() => simRef.current?.tap("tackle")} />
        {!locked && <Tap label="Замена" onTap={() => simRef.current?.tap("quick")} />}
      </div>
    </div>
  );
}

function RefPad({ simRef }: { simRef: RefObject<MatchSim | null> }) {
  return (
    <div className="safe-bot pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3">
      <div className="pointer-events-auto mx-auto grid max-w-md grid-cols-3 gap-2">
        <Tap label="Фол" onTap={() => simRef.current?.judge("foul")} />
        <Tap label="Игра" onTap={() => simRef.current?.judge("advantage")} />
        <Tap label="Офсайд" onTap={() => simRef.current?.judge("offside")} />
        <Tap label="Жёлтая" onTap={() => simRef.current?.judge("yellow")} />
        <Tap label="Красная" onTap={() => simRef.current?.judge("red")} />
      </div>
    </div>
  );
}

function Tap({ label, onTap }: { label: string; onTap: () => void }) {
  return (
    <button className="h-11 min-w-14 rounded-full bg-pitch px-2 font-display text-xs tracking-wide text-fg uppercase" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onTap(); }}>
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
        <h2 className="font-display text-3xl uppercase">{snap.referee ? "Пауза" : "Тактика"}</h2>
        {!snap.referee && (
          <>
            <p className="text-sm text-fg/70">Схема сразу меняет позиции и то, куда игроки бегут. Сейчас {snap.formation}.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {FORMATION_IDS.map((id) => (
                <button key={id} className={snap.formation === id ? "chip-on" : "chip"} onClick={() => { simRef.current?.applyFormation(snap.userSide, id, true); onSubMsg(""); onPick(null); }}>
                  {id}
                </button>
              ))}
            </div>
            {!snap.locked && <p className="mt-3 text-sm text-fg/70">Замен осталось: {snap.subs}. Нажмите игрока основы, затем запасного.</p>}
            {snap.locked && <p className="mt-3 text-sm text-fg/70">На поле вы управляете только своим игроком. Схему команды всё равно можно сменить.</p>}
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
                          onSubMsg("Сначала выберите игрока на поле");
                          return;
                        }
                        const err = simRef.current?.substitute(picked, p.uid);
                        onSubMsg(err ?? `${p.name} вышел`);
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
          <button className="btn-main" onClick={() => simRef.current?.togglePause()}>Продолжить</button>
          {snap.phase !== "intro" && snap.phase !== "fulltime" && (
            <button className="btn-ghost" onClick={() => simRef.current?.simulateToEnd()}>Продолжить и выйти</button>
          )}
          <button className="btn-ghost" onClick={onLeave}>Выйти</button>
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
      <KitRow title="Ваша форма" side={you} picked={you === 0 ? snap.homeKit : snap.awayKit} colors={you === 0 ? snap.homeSwatch : snap.awaySwatch} onPick={onPick} />
      <KitRow title="Форма соперника" side={them} picked={them === 0 ? snap.homeKit : snap.awayKit} colors={them === 0 ? snap.homeSwatch : snap.awaySwatch} onPick={onPick} />
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
          Цвет клуба
        </button>
        <button className={picked === "inverse" ? "chip-on" : "chip"} onClick={() => onPick(side, "inverse")}>
          <i className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors[1] }} />
          Инверсия
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
  settingsNote,
}: {
  onBack: () => void;
  onOpen: (id: "manager" | "player" | "story" | "referee" | "settings") => void;
  onClear: (id: "manager" | "player" | "story" | "referee") => void;
  onRewrite: (id: "manager" | "player" | "story" | "referee") => void;
  manager: CareerState | null;
  player: CareerState | null;
  story: StoryState | null;
  referee: RefState | null;
  settingsNote: string;
}) {
  const files: { id: "manager" | "player" | "story" | "referee" | "settings"; title: string; note: string; filled: boolean }[] = [
    { id: "settings", title: "Настройки", note: settingsNote, filled: true },
    { id: "manager", title: "Карьера тренера", note: manager ? teamName(manager.teamId) : "пусто", filled: Boolean(manager) },
    { id: "player", title: "Карьера игрока", note: player ? teamName(player.teamId) : "пусто", filled: Boolean(player) },
    { id: "story", title: "История", note: story ? teamName(story.teamId) : "пусто", filled: Boolean(story) },
    { id: "referee", title: "Карьера судьи", note: referee ? referee.name : "пусто", filled: Boolean(referee) },
  ];
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-3xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>Назад</button>
      <h2 className="font-display mt-3 text-3xl uppercase">Папка сохранений</h2>
      <p className="mt-2 text-sm text-fg/70">Выберите сохранение и продолжайте. Перезапись стирает прогресс режима и начинает заново.</p>
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
                <button className="chip-on" onClick={() => onOpen(file.id)}>Продолжить</button>
              )}
              {mode && (
                <button className="chip" onClick={() => onRewrite(mode)}>{file.filled ? "Перезаписать" : "Начать"}</button>
              )}
              {mode && file.filled && (
                <button className="chip" onClick={() => onClear(mode)}>Удалить</button>
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
