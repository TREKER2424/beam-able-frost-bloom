import { useState } from "react";
import { LeagueTable } from "@/components/career-ui";
import { Crest } from "@/components/crests";
import { leagueTitle, tableOf, teamById, type LeagueId } from "@/game/data";
import { tr } from "@/game/i18n";
import { beginRefSeason, refCareerDone, refCupAssignment, refFixture, refRank, refTable, setRefLeague, simulateRefCupOthers, type RefState } from "@/game/referee";

export function RefereeCreate({ onBack, onDone }: { onBack: () => void; onDone: (name: string) => void }) {
  const [name, setName] = useState(tr("А. Судейкин", "A. Sudeykin"));
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>{tr("Назад", "Back")}</button>
      <h2 className="font-display mt-4 text-3xl uppercase">{tr("Карьера судьи", "Referee career")}</h2>
      <p className="mt-2 text-sm text-fg/70">{tr("Матч всегда две минуты: каждый тайм по одной. Штрафной и пенальти назначаются сами по правилам, от места фола. Вы показываете жёлтую, красную, офсайд, «не офсайд», фол или отсутствие фола. Верные решения поднимают категорию.", "A match is always two minutes: one minute each half. Free kicks and penalties are given by the laws, from the foul. You show yellow, red, offside, not offside, foul or no foul. Correct calls raise your grade.")}</p>
      <label className="mt-4 block text-sm text-fg/70">
        {tr("Имя в протоколе", "Name on the teamsheet")}
        <input className="mt-1 w-full rounded-2xl border border-fg/15 bg-card px-3 py-3 text-fg" value={name} maxLength={22} onChange={(e) => setName(e.target.value)} />
      </label>
      <button className="btn-main mt-5" onClick={() => onDone(name.trim() || tr("А. Судейкин", "A. Sudeykin"))}>{tr("Начать судейство", "Start refereeing")}</button>
    </main>
  );
}

export function RefereeDesk({
  state,
  onMatch,
  onCup,
  onSimulate,
  onMenu,
  onReset,
  onSave,
  onChange,
}: {
  state: RefState;
  onMatch: () => void;
  onCup: () => void;
  onSimulate: () => void;
  onMenu: () => void;
  onReset: () => void;
  onSave: () => void;
  onChange: (s: RefState) => void;
}) {
  const [tab, setTab] = useState<"desk" | "leagues" | "table" | "cup" | "stats" | "save">("desk");
  const [msg, setMsg] = useState("");
  const fx = refFixture(state.nextIndex, state.league);
  const calls = state.correct + state.wrong;
  const accuracy = calls === 0 ? 0 : Math.round((state.correct / calls) * 100);
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <button className="text-sm text-mint" onClick={onMenu}>{tr("Меню", "Menu")}</button>
        <button className="text-sm text-fg/50" onClick={onReset}>{tr("Новая карьера", "New career")}</button>
      </div>
      <p className="mt-4 font-display text-xs tracking-widest text-gold uppercase">{tr("Судья", "Referee")} · {tr("сезон", "season")} {state.season || 1}</p>
      <h2 className="font-display mt-2 text-3xl uppercase">{state.name}</h2>
      <p className="mt-1 text-sm text-fg/70">{refRank(state.rating)} · {tr("рейтинг", "rating")} {state.rating} · {leagueTitle(state.league, true)} · {tr("закрыто сезонов", "seasons closed")} {state.seasonsDone || 0}</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-fg/15">
        <div className="h-full bg-gold" style={{ width: `${state.rating}%` }} />
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {([["desk", tr("Назначения", "Appointments")], ["leagues", tr("Лиги", "Leagues")], ["table", tr("Таблица", "Table")], ["cup", tr("Кубок", "Cup")], ["stats", tr("Статистика", "Stats")], ["save", tr("Сохранение", "Save")]] as const).map(([id, label]) => (
          <button key={id} className={tab === id ? "chip-on shrink-0" : "chip shrink-0"} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "desk" && (
        <>
          {fx ? (
            <div className="mt-6 flex flex-col gap-2">
              <button className="btn-main w-full" onClick={onMatch}>
                {tr("Судить матч", "Referee match")} {state.nextIndex + 1}
                <span className="mt-1 block font-sans text-xs font-normal normal-case text-bg/80">
                  {teamById(fx.home).name} — {teamById(fx.away).name}
                </span>
              </button>
              <button className="btn-ghost" onClick={onSimulate}>{tr("Симулировать назначение", "Simulate the appointment")}</button>
            </div>
          ) : (
            <div className="mt-6">
              <p className="font-display text-2xl uppercase text-mint">{refCareerDone(state) ? tr("Десять сезонов позади", "Ten seasons behind you") : tr("Назначения на сезон закрыты", "This season's appointments are closed")}</p>
              <p className="mt-2 text-sm text-fg/70">{refCareerDone(state)
                ? tr("Судейский путь пройден. Спасибо за десять сезонов. Начните карьеру заново — с чистого протокола.", "The refereeing path is complete. Thank you for ten seasons. Start the career again, with a clean record.")
                : tr("Личная статистика, рейтинг и число отсуженных матчей сохранятся. Список ниже начнётся заново.", "Your record, rating and matches refereed stay. The list below starts again.")}</p>
              <button className="btn-main mt-3" onClick={() => {
                if (refCareerDone(state)) {
                  onReset();
                  return;
                }
                const next = beginRefSeason(state);
                if (typeof next !== "string") onChange(next);
              }}>{refCareerDone(state) ? tr("Начать путь заново", "Start the path again") : tr("Новый сезон", "New season")}</button>
            </div>
          )}
          <ul className="mt-6 grid gap-2">
            {Array.from({ length: 8 }, (_, i) => refFixture(i, state.league)).map((item, i) => {
              if (!item) return null;
              const done = i < state.nextIndex;
              const score = state.results[i];
              return (
                <li key={i} className="card flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Crest id={item.home} className="h-8 w-8 shrink-0" />
                    <span className="truncate">{teamById(item.home).name} — {teamById(item.away).name}</span>
                  </span>
                  <span className="shrink-0 text-fg/50">{score ? `${score.hg}:${score.ag}` : done ? tr("отсужен", "refereed") : i === state.nextIndex ? tr("сейчас", "now") : tr("впереди", "ahead")}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {tab === "leagues" && (
        <div className="mt-6 grid gap-2">
          <p className="text-sm text-fg/70">{tr("Назначения меняются вместе с лигой. Рейтинг, карточки и точность остаются с вами.", "Appointments change with the league. Rating, cards and accuracy stay with you.")}</p>
          {(["chuvash", "volga", "siberia"] as LeagueId[]).map((id) => (
            <button key={id} className={state.league === id ? "card card-on text-left" : "card text-left"} onClick={() => onChange(setRefLeague(state, id))}>
              <span className="font-display uppercase">{leagueTitle(id, true)}</span>
              <span className="mt-1 block text-sm text-fg/70">{state.league === id ? tr("Сейчас судите здесь", "You referee here now") : tr("Перейти и судить эту лигу", "Switch and referee this league")}</span>
            </button>
          ))}
        </div>
      )}
      {tab === "table" && <RefTables state={state} />}
      {tab === "cup" && <RefCup state={state} onCup={onCup} onChange={onChange} />}
      {tab === "stats" && (
        <ul className="mt-6 grid gap-2 text-sm">
          <Stat label={tr("Сезон", "Season")} value={String(state.season || 1)} />
          <Stat label={tr("Закрыто сезонов", "Seasons closed")} value={String(state.seasonsDone || 0)} />
          <Stat label={tr("Матчи", "Matches")} value={String(state.matches)} />
          <Stat label={tr("Верные решения", "Correct calls")} value={String(state.correct)} />
          <Stat label={tr("Ошибки", "Mistakes")} value={String(state.wrong)} />
          <Stat label={tr("Точность", "Accuracy")} value={calls ? `${accuracy}%` : "—"} />
          <Stat label={tr("Фолы", "Fouls")} value={String(state.fouls)} />
          <Stat label={tr("Жёлтые", "Yellows")} value={String(state.yellows)} />
          <Stat label={tr("Красные", "Reds")} value={String(state.reds)} />
          <Stat label={tr("Пенальти", "Penalties")} value={String(state.pens)} />
          <Stat label={tr("Офсайды", "Offsides")} value={String(state.offsides)} />
          <Stat label={tr("Категория", "Grade")} value={refRank(state.rating)} />
        </ul>
      )}
      {tab === "save" && (
        <section className="card mt-6">
          <h3 className="font-display text-xl uppercase">{tr("Сохранение", "Save")}</h3>
          <p className="mt-2 text-sm text-fg/75">{tr("Карьера судьи, рейтинг и личная статистика пишутся на это устройство. Новый сезон не обнуляет решения, карточки и категорию — только календарь назначений.", "The referee career, rating and personal record are saved on this device. A new season does not wipe calls, cards or grade — only the appointment calendar.")}</p>
          <button className="btn-main mt-4" onClick={() => { onSave(); setMsg(tr("Записано.", "Saved.")); }}>{tr("Записать прогресс", "Save progress")}</button>
          {msg && <p className="mt-2 text-sm text-mint">{msg}</p>}
        </section>
      )}
    </main>
  );
}

function RefTables({ state }: { state: RefState }) {
  const [league, setLeague] = useState<LeagueId>(state.league);
  const rows = tableOf(refTable(state, league));
  const played = rows.reduce((sum, row) => sum + row.p, 0) / 2;
  return (
    <section className="mt-6">
      <p className="text-sm text-fg/70">{tr("Таблицы трёх лиг. Можно смотреть, как идут клубы, не меняя лигу, которую вы судите. Ваши назначения входят в счёт, остальные матчи тура доигрываются сами.", "Tables of the three leagues. You can watch the clubs without changing the league you referee. Your appointments count, and the rest of the matchday is played out.")}</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {(["chuvash", "volga", "siberia"] as LeagueId[]).map((id) => (
          <button key={id} className={league === id ? "chip-on shrink-0" : "chip shrink-0"} onClick={() => setLeague(id)}>{leagueTitle(id)}</button>
        ))}
      </div>
      <LeagueTable table={rows} mine="" />
      <p className="mt-2 text-xs text-fg/50">{played === 0 ? tr("Сезон только начался: счёт появится после первого тура.", "The season has just started: the score appears after the first matchday.") : tr(`Сыграно матчей: ${played}`, `Matches played: ${played}`)}</p>
    </section>
  );
}

function RefCup({ state, onCup, onChange }: { state: RefState; onCup: () => void; onChange: (s: RefState) => void }) {
  const round = state.cup.rounds[state.cup.round];
  const next = refCupAssignment(state);
  if (state.cup.champion) {
    return (
      <section className="mt-6">
        <p className="font-display text-2xl uppercase text-mint">{tr("Кубок у", "The cup belongs to")} {teamById(state.cup.champion).name}</p>
        <p className="mt-2 text-sm text-fg/70">{tr("Кубковые назначения закрыты. Лиговые матчи можно судить дальше.", "Cup appointments are closed. League matches can still be refereed.")}</p>
      </section>
    );
  }
  return (
    <section className="mt-6">
      <p className="font-display text-xs tracking-widest text-gold uppercase">{round?.title ? tr(round.title, roundTitleEn(round.title)) : tr("Кубок", "Cup")}</p>
      <p className="mt-2 text-sm text-fg/70">{tr("Отдельные матчи Кубка России. Длина та же: две минуты, тайм одну. Остальные пары можно не судить.", "Separate Russian Cup matches. Same length: two minutes, one each half. The other ties do not have to be refereed.")}</p>
      {next && (
        <button className="btn-main mt-3 w-full" onClick={onCup}>
          {tr("Судить кубок", "Referee the cup")}
          <span className="mt-1 block font-sans text-xs font-normal normal-case text-bg/80">{teamById(next.home).name} — {teamById(next.away).name}</span>
        </button>
      )}
      {round?.ties.some((t) => t.away && t.hg === null && t !== round.ties[next?.index ?? -1]) && (
        <button className="btn-ghost mt-2" onClick={() => onChange(simulateRefCupOthers(state))}>{tr("Симулировать остальные пары", "Simulate the other ties")}</button>
      )}
      <ul className="mt-4 grid gap-2">
        {round?.ties.map((tie, i) => (
          <li key={`${tie.home}-${tie.away}-${i}`} className="card flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <Crest id={tie.home} className="h-8 w-8 shrink-0" />
              <span className="truncate">{teamById(tie.home).name}{tie.away ? ` — ${teamById(tie.away).name}` : tr(" · без игры", " · bye")}</span>
            </span>
            <span className="shrink-0 text-fg/50">{!tie.away ? tr("проход", "through") : tie.hg === null ? i === next?.index ? tr("сейчас", "now") : tr("впереди", "ahead") : `${tie.hg}:${tie.ag}${tie.ph != null ? ` ${tr("пен.", "pens")} ${tie.ph}:${tie.pa}` : ""}`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <li className="card flex items-center justify-between gap-3">
      <span className="text-fg/70">{label}</span>
      <span className="font-display uppercase">{value}</span>
    </li>
  );
}

function roundTitleEn(title: string): string {
  if (title.includes("Отбороч")) return "Preliminary round";
  if (title.includes("1/8")) return "Round of 16";
  if (title.includes("1/4")) return "Quarter-final";
  if (title.includes("1/2")) return "Semi-final";
  if (title.includes("Финал")) return "Final";
  return title;
}
