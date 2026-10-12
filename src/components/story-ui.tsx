import { useState } from "react";
import { Crest } from "@/components/crests";
import { LeagueTable } from "@/components/career-ui";
import { acceptBid, beginNextSeason, careerClosed, careerRecord, championOf, formatRub, isSeasonOver, nextUserFixture, ourPlace, pressFeed, requestTransfer, seasonRatingBump } from "@/game/career";
import { clubShape, tableOf, teamById } from "@/game/data";
import { finaleScript, say, STORY, type StoryState } from "@/game/story";
import { tr } from "@/game/i18n";

export function StoryBook({
  state,
  onChange,
  onPlay,
  onSimulate,
  onMenu,
  onReset,
}: {
  state: StoryState;
  onChange: (s: StoryState) => void;
  onPlay: () => void;
  onSimulate: () => void;
  onMenu: () => void;
  onReset: () => void;
}) {
  const chapter = STORY[state.step];
  const club = teamById(state.career.teamId);
  const closed = isSeasonOver(state.career);
  const vasya = state.career.people.find((p) => p.id === state.career.createdId);

  if (closed) {
    return (
      <Finale
        state={state}
        onMenu={onMenu}
        onReset={onReset}
        onChange={onChange}
        onRestart={() => {
          const next = beginNextSeason(state.career);
          if (typeof next === "string") onChange({ ...state, note: next });
          else onChange({ ...state, teamId: next.teamId, step: 0, rigged: false, note: "", career: next });
        }}
      />
    );
  }

  if (!chapter) {
    return (
      <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-3xl px-4 py-6">
        <button className="text-sm text-mint" onClick={onMenu}>{tr("Меню", "Menu")}</button>
        <h2 className="font-display mt-3 text-3xl uppercase">{tr("Глава кончилась раньше таблицы", "The chapter ended before the table")}</h2>
        <p className="mt-2 text-sm text-fg/70">{tr("Сезон ещё не закрыт, поэтому финала нет. Доиграйте календарь из карьеры или вернитесь к последнему матчу.", "The season is not closed, so there is no ending. Finish the calendar from the career, or go back to the last match.")}</p>
      </main>
    );
  }

  if (chapter.kind === "talk") {
    return (
      <>
        <Novel
          title={say(chapter.title)}
          place={say(chapter.place)}
          lines={chapter.lines.map((line) => ({ name: say(line.name), text: say(line.text) }))}
          clubId={club.id}
          season={state.career.season || 1}
          onMenu={onMenu}
          onDone={() => onChange({ ...state, step: state.step + 1, note: "" })}
        />
        <div className="mx-auto w-full max-w-3xl px-4 pb-10">
          <StoryExtras state={state} onChange={onChange} />
        </div>
      </>
    );
  }

  const next = nextUserFixture(state.career);
  const foeId = next ? (next.fixture.home === state.career.teamId ? next.fixture.away : next.fixture.home) : "";
  return (
    <main className="safe-top safe-bot mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6">
      <button className="text-sm text-mint" onClick={onMenu}>{tr("Меню", "Menu")}</button>
      <p className="mt-4 font-display text-xs tracking-widest text-mint uppercase">{tr("История", "Story")} · {tr("сезон", "season")} {state.career.season || 1} · {club.name}</p>
      {(state.career.season || 1) > 1 && <p className="mt-1 text-sm text-fg/70">{tr("Переходы и статистика побед прошлых лет на месте. Сюжет идёт заново.", "Moves and the win record from past years are still here. The story starts again.")}</p>}
      <h2 className="font-display mt-2 text-4xl uppercase">{say(chapter.title)}</h2>
      <p className="mt-3 text-sm text-fg/75">{say(chapter.blurb)}</p>
      {state.note && <p className="mt-3 text-sm text-mint">{state.note}</p>}
      {vasya && (
        <p className="mt-3 text-sm text-fg/70">{vasya.name} · {tr("рейтинг", "rating")} {vasya.ovr} · {tr("голы", "goals")} {vasya.goals}{vasya.wantsMove ? tr(" · просит трансфер", " · wants a move") : ""}</p>
      )}
      {next ? (
        <div className="mt-6 flex flex-col gap-2">
          <button className="btn-main" onClick={onPlay}>
            {tr("Играть", "Play")}
            <span className="mt-1 block font-sans text-xs font-normal normal-case text-bg/80">
              {teamById(next.fixture.home).name} — {teamById(next.fixture.away).name}
              {chapter.final ? tr(" · место решит таблица", " · the table will decide the place") : ""}
            </span>
          </button>
          <p className="text-sm text-fg/75">
            {tr("Сводка: вы", "Briefing: you play")} {state.career.formation}. {teamById(foeId).name} {tr("выходят", "line up")} {clubShape(foeId, next.index)}.
          </p>
          <button className="btn-ghost" onClick={onSimulate}>{tr("Симулировать матч", "Simulate the match")}</button>
        </div>
      ) : (
        <p className="mt-6 text-sm text-fg/70">{tr("Календарь этой главы уже сыгран.", "This chapter's calendar is already played.")}</p>
      )}
      <StoryExtras state={state} onChange={onChange} />
      <div className="mt-8">
        <LeagueTable table={tableOf(state.career.fixtures)} mine={state.career.teamId} />
      </div>
    </main>
  );
}

function Finale({
  state,
  onMenu,
  onReset,
  onChange,
  onRestart,
}: {
  state: StoryState;
  onMenu: () => void;
  onReset: () => void;
  onChange: (s: StoryState) => void;
  onRestart: () => void;
}) {
  const place = ourPlace(state.career) ?? 8;
  const script = finaleScript(place);
  const champ = championOf(state.career);
  const rec = careerRecord(state.career);
  const club = teamById(state.career.teamId);
  const [i, setI] = useState(0);
  const line = script.lines[i];
  const last = i >= script.lines.length - 1;
  const done = careerClosed(state.career);
  const table = tableOf(state.career.fixtures);
  const bump = seasonRatingBump(place, table.length);
  const bumpText = bump > 0
    ? tr(`За место средний рейтинг клуба +${bump}.`, `For the place, the club's average rating is +${bump}.`)
    : bump < 0
      ? tr(`За место средний рейтинг клуба ${bump}.`, `For the place, the club's average rating is ${bump}.`)
      : "";
  return (
    <main className="safe-top safe-bot mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <button className="text-sm text-mint" onClick={onMenu}>{tr("Меню", "Menu")}</button>
        <button className="text-sm text-fg/50" onClick={onReset}>{tr("Стереть историю", "Erase the story")}</button>
      </div>
      <p className="mt-4 font-display text-xs tracking-widest text-mint uppercase">{say(script.where)}</p>
      <h2 className="font-display mt-2 text-4xl uppercase">{say(script.title)}</h2>
      <p className="mt-2 text-sm text-fg/75">
        {club.name} · {tr("сезон", "season")} {state.career.season || 1} · {place}{tr("-е место", " place")}
        {champ ? tr(` · чемпион ${teamById(champ.id).name}`, ` · champion ${teamById(champ.id).name}`) : ""}. {script.happy ? tr("Счастливый финал: пьедестал.", "A happy ending: the podium.") : tr("Неудачный финал: ниже первых трёх.", "A bad ending: below the top three.")}
      </p>
      {line && (
        <button className="card mt-6 min-h-48 w-full text-left" onClick={() => { if (!last) setI(i + 1); }}>
          <p className="font-display text-sm tracking-widest text-gold uppercase">{say(line.name)}</p>
          <p className="mt-3 text-lg leading-relaxed">{say(line.text)}</p>
          <p className="mt-6 text-xs text-fg/45">{i + 1} / {script.lines.length}{last ? "" : tr(" · дальше", " · next")}</p>
        </button>
      )}
      {last && (
        <>
          {done ? (
            <p className="mt-4 text-sm text-fg/70">{tr("Десять сезонов позади. История Васи закрыта. Спасибо, что дошли до конца. Начните путь заново — с чистого сезона.", "Ten seasons are behind you. Vasya's story is closed. Thank you for seeing it through. Start the path again, from a clean season.")}</p>
          ) : (
            <p className="mt-4 text-sm text-fg/70">{tr("Уже в архиве: титулы", "Already in the archive: titles")} {rec.titles}, {tr("пьедесталы", "podiums")} {rec.podiums}, {tr("победы", "wins")} {rec.wins}. {tr("Этот сезон допишется туда, когда начнёте следующий. Состав после трансферов не откатится. Если Васе уже предложили клуб — примите переход до кнопки, иначе окно закроется.", "This season is written in when you start the next one. The squad after transfers will not roll back. If Vasya already has an offer, accept it before the button, or the window closes.")}</p>
          )}
          {!done && bumpText && <p className="mt-2 text-sm text-mint">{bumpText}</p>}
          {!done && <StoryExtras state={state} onChange={onChange} />}
          <button className="btn-main mt-4" onClick={done ? onReset : onRestart}>{done ? tr("Начать путь заново", "Start the path again") : script.happy ? tr("Новый сезон", "New season") : tr("Начать всё заново", "Start all over")}</button>
        </>
      )}
      {state.note && <p className="mt-3 text-sm text-mint">{state.note}</p>}
      <LeagueTable table={tableOf(state.career.fixtures)} mine={state.career.teamId} />
    </main>
  );
}

function Novel({
  title,
  place,
  lines,
  clubId,
  season,
  onDone,
  onMenu,
}: {
  title: string;
  place: string;
  lines: { name: string; text: string }[];
  clubId: string;
  season: number;
  onDone: () => void;
  onMenu: () => void;
}) {
  const [i, setI] = useState(0);
  const line = lines[i];
  const last = i >= lines.length - 1;
  if (!line) return null;
  return (
    <main className="safe-top safe-bot mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <button className="text-sm text-mint" onClick={onMenu}>{tr("Меню", "Menu")}</button>
        <span className="text-xs tracking-widest text-fg/50 uppercase">{say(place)}</span>
      </div>
      <div className="mt-6 flex items-end gap-4">
        <Crest id={clubId} className="h-16 w-16 shrink-0" />
        <div>
          <p className="font-display text-xs tracking-widest text-mint uppercase">{tr("Катсцена", "Cutscene")} · {tr("сезон", "season")} {season}</p>
          <h2 className="font-display text-4xl uppercase">{say(title)}</h2>
        </div>
      </div>
      {season > 1 && <p className="mt-3 text-sm text-fg/70">{tr("Это уже не первый круг. Прошлые переходы и победы не стёрты.", "This is not the first lap. Past moves and wins were not wiped.")}</p>}
      <button
        className="card mt-8 min-h-48 w-full text-left"
        onClick={() => {
          if (!last) setI(i + 1);
        }}
      >
        <p className="font-display text-sm tracking-widest text-gold uppercase">{say(line.name)}</p>
        <p className="mt-3 text-lg leading-relaxed">{say(line.text)}</p>
        <p className="mt-6 text-xs text-fg/45">{i + 1} / {lines.length}{last ? "" : tr(" · дальше", " · next")}</p>
      </button>
      <div className="mt-4 flex gap-2">
        {lines.map((entry, n) => (
          <span key={`${entry.name}-${n}`} className={n === i ? "h-1.5 flex-1 rounded-full bg-mint" : "h-1.5 flex-1 rounded-full bg-fg/15"} />
        ))}
      </div>
      {last && (
        <button className="btn-main mt-6" onClick={onDone}>{tr("Дальше", "Next")}</button>
      )}
    </main>
  );
}

function StoryExtras({ state, onChange }: { state: StoryState; onChange: (s: StoryState) => void }) {
  const vasya = state.career.people.find((p) => p.id === state.career.createdId);
  const bid = (state.career.bids ?? []).find((b) => b.personId === state.career.createdId);
  const articles = pressFeed(state.career).slice(0, 4);
  const row = tableOf(state.career.fixtures).find((r) => r.id === state.career.teamId);
  const rec = careerRecord(state.career);
  return (
    <div className="mt-6 grid gap-3">
      <section className="card">
        <p className="font-display text-xs tracking-widest text-mint uppercase">{tr("Турнир", "Competition")}</p>
        <p className="mt-1 text-sm text-fg/75">{row ? tr(`Игры ${row.p} · мячи ${row.gf}:${row.ga} · очки ${row.pts}`, `Played ${row.p} · goals ${row.gf}:${row.ga} · points ${row.pts}`) : tr("Календарь ещё пуст.", "The calendar is still empty.")} {tr("Кубок только когда все клубы сыграют друг с другом.", "The trophy comes only when every club has played every other club.")}</p>
        <p className="mt-1 text-sm text-fg/70">{tr("Архив: титулы", "Archive: titles")} {rec.titles}, {tr("пьедесталы", "podiums")} {rec.podiums}, {tr("победы", "wins")} {rec.wins}.</p>
      </section>
      {vasya && (
        <section className="card">
          <p className="font-display text-xs tracking-widest text-gold uppercase">{tr("Трансфер Васи", "Vasya's transfer")}</p>
          <p className="mt-1 text-sm text-fg/75">{tr("Уйти можно только в конце сезона. Сейчас клуб", "A move is only at the end of the season. The club now is")} {teamById(state.career.teamId).name}. {tr("Переход останется и в следующем сезоне.", "The move stays for the next season too.")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="chip" onClick={() => {
              const next = requestTransfer(state.career, vasya.id);
              if (typeof next === "string") onChange({ ...state, note: next });
              else onChange({ ...state, teamId: next.teamId, career: next, note: "" });
            }}>{vasya.wantsMove ? tr("Отозвать запрос", "Withdraw the request") : tr("Вася просит трансфер", "Vasya asks for a transfer")}</button>
            {bid && (
              <button className="chip-on" onClick={() => {
                const next = acceptBid(state.career, vasya.id);
                if (typeof next !== "string") onChange({ ...state, teamId: next.teamId, career: next, note: tr(`Вася перешёл в ${teamById(next.teamId).name}. Бонус ${formatRub(next.budget - state.career.budget)}.`, `Vasya joined ${teamById(next.teamId).name}. Bonus ${formatRub(next.budget - state.career.budget)}.` ) });
              }}>{tr("Принять", "Accept")} {teamById(bid.from).name}</button>
            )}
          </div>
        </section>
      )}
      <section className="card">
        <p className="font-display text-xs tracking-widest text-mint uppercase">{tr("Пресса", "Press")}</p>
        <ul className="mt-2 grid gap-2">
          {articles.map((item) => (
            <li key={item.title}>
              <p className="font-display uppercase">{item.title}</p>
              <p className="text-sm text-fg/70">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="card">
        <p className="font-display text-xs tracking-widest text-fg/50 uppercase">{tr("Сохранение", "Save")}</p>
        <p className="mt-1 text-sm text-fg/70">{tr("История Васи, трансферы и архив побед пишутся на это устройство. Новый сезон не стирает их. «Стереть историю» — это уже полный сброс.", "Vasya's story, transfers and the win archive are saved on this device. A new season does not wipe them. Erase the story is a full reset.")}</p>
      </section>
    </div>
  );
}