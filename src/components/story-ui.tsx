import { useState } from "react";
import { Crest } from "@/components/crests";
import { LeagueTable } from "@/components/career-ui";
import { acceptBid, beginNextSeason, careerRecord, championOf, formatRub, isSeasonOver, nextUserFixture, ourPlace, pressFeed, requestTransfer } from "@/game/career";
import { clubShape, tableOf, teamById } from "@/game/data";
import { finaleScript, STORY, type StoryState } from "@/game/story";

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
        <button className="text-sm text-mint" onClick={onMenu}>Меню</button>
        <h2 className="font-display mt-3 text-3xl uppercase">Глава кончилась раньше таблицы</h2>
        <p className="mt-2 text-sm text-fg/70">Сезон ещё не закрыт, поэтому финала нет. Доиграйте календарь из карьеры или вернитесь к последнему матчу.</p>
      </main>
    );
  }

  if (chapter.kind === "talk") {
    return (
      <>
        <Novel
          title={chapter.title}
          place={chapter.place}
          lines={chapter.lines}
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
      <button className="text-sm text-mint" onClick={onMenu}>Меню</button>
      <p className="mt-4 font-display text-xs tracking-widest text-mint uppercase">История · сезон {state.career.season || 1} · {club.name}</p>
      {(state.career.season || 1) > 1 && <p className="mt-1 text-sm text-fg/70">Переходы и статистика побед прошлых лет на месте. Сюжет идёт заново.</p>}
      <h2 className="font-display mt-2 text-4xl uppercase">{chapter.title}</h2>
      <p className="mt-3 text-sm text-fg/75">{chapter.blurb}</p>
      {state.note && <p className="mt-3 text-sm text-mint">{state.note}</p>}
      {vasya && (
        <p className="mt-3 text-sm text-fg/70">{vasya.name} · рейтинг {vasya.ovr} · голы {vasya.goals}{vasya.wantsMove ? " · просит трансфер" : ""}</p>
      )}
      {next ? (
        <div className="mt-6 flex flex-col gap-2">
          <button className="btn-main" onClick={onPlay}>
            Играть
            <span className="mt-1 block font-sans text-xs font-normal normal-case text-bg/80">
              {teamById(next.fixture.home).name} — {teamById(next.fixture.away).name}
              {chapter.final ? " · место решит таблица" : ""}
            </span>
          </button>
          <p className="text-sm text-fg/75">
            Сводка: вы {state.career.formation}. {teamById(foeId).name} выходят {clubShape(foeId, next.index)}.
          </p>
          <button className="btn-ghost" onClick={onSimulate}>Симулировать матч</button>
        </div>
      ) : (
        <p className="mt-6 text-sm text-fg/70">Календарь этой главы уже сыгран.</p>
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
  return (
    <main className="safe-top safe-bot mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <button className="text-sm text-mint" onClick={onMenu}>Меню</button>
        <button className="text-sm text-fg/50" onClick={onReset}>Стереть историю</button>
      </div>
      <p className="mt-4 font-display text-xs tracking-widest text-mint uppercase">{script.where}</p>
      <h2 className="font-display mt-2 text-4xl uppercase">{script.title}</h2>
      <p className="mt-2 text-sm text-fg/75">
        {club.name} · сезон {state.career.season || 1} · {place}-е место
        {champ ? ` · чемпион ${teamById(champ.id).name}` : ""}. {script.happy ? "Счастливый финал: пьедестал." : "Неудачный финал: ниже первых трёх."}
      </p>
      {line && (
        <button className="card mt-6 min-h-48 w-full text-left" onClick={() => { if (!last) setI(i + 1); }}>
          <p className="font-display text-sm tracking-widest text-gold uppercase">{line.name}</p>
          <p className="mt-3 text-lg leading-relaxed">{line.text}</p>
          <p className="mt-6 text-xs text-fg/45">{i + 1} / {script.lines.length}{last ? "" : " · дальше"}</p>
        </button>
      )}
      {last && (
        <>
          <p className="mt-4 text-sm text-fg/70">Уже в архиве: титулы {rec.titles}, пьедесталы {rec.podiums}, победы {rec.wins}. Этот сезон допишется туда, когда начнёте следующий. Состав после трансферов не откатится. Если Васе уже предложили клуб — примите переход до кнопки, иначе окно закроется.</p>
          <StoryExtras state={state} onChange={onChange} />
          <button className="btn-main mt-4" onClick={onRestart}>{script.happy ? "Новый сезон" : "Начать всё заново"}</button>
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
        <button className="text-sm text-mint" onClick={onMenu}>Меню</button>
        <span className="text-xs tracking-widest text-fg/50 uppercase">{place}</span>
      </div>
      <div className="mt-6 flex items-end gap-4">
        <Crest id={clubId} className="h-16 w-16 shrink-0" />
        <div>
          <p className="font-display text-xs tracking-widest text-mint uppercase">Катсцена · сезон {season}</p>
          <h2 className="font-display text-4xl uppercase">{title}</h2>
        </div>
      </div>
      {season > 1 && <p className="mt-3 text-sm text-fg/70">Это уже не первый круг. Прошлые переходы и победы не стёрты.</p>}
      <button
        className="card mt-8 min-h-48 w-full text-left"
        onClick={() => {
          if (!last) setI(i + 1);
        }}
      >
        <p className="font-display text-sm tracking-widest text-gold uppercase">{line.name}</p>
        <p className="mt-3 text-lg leading-relaxed">{line.text}</p>
        <p className="mt-6 text-xs text-fg/45">{i + 1} / {lines.length}{last ? "" : " · дальше"}</p>
      </button>
      <div className="mt-4 flex gap-2">
        {lines.map((entry, n) => (
          <span key={`${entry.name}-${n}`} className={n === i ? "h-1.5 flex-1 rounded-full bg-mint" : "h-1.5 flex-1 rounded-full bg-fg/15"} />
        ))}
      </div>
      {last && (
        <button className="btn-main mt-6" onClick={onDone}>Дальше</button>
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
        <p className="font-display text-xs tracking-widest text-mint uppercase">Турнир</p>
        <p className="mt-1 text-sm text-fg/75">{row ? `Игры ${row.p} · мячи ${row.gf}:${row.ga} · очки ${row.pts}` : "Календарь ещё пуст."} Кубок только когда все клубы сыграют друг с другом.</p>
        <p className="mt-1 text-sm text-fg/70">Архив: титулы {rec.titles}, пьедесталы {rec.podiums}, победы {rec.wins}.</p>
      </section>
      {vasya && (
        <section className="card">
          <p className="font-display text-xs tracking-widest text-gold uppercase">Трансфер Васи</p>
          <p className="mt-1 text-sm text-fg/75">Уйти можно только в конце сезона. Сейчас клуб {teamById(state.career.teamId).name}. Переход останется и в следующем сезоне.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="chip" onClick={() => {
              const next = requestTransfer(state.career, vasya.id);
              if (typeof next === "string") onChange({ ...state, note: next });
              else onChange({ ...state, teamId: next.teamId, career: next, note: "" });
            }}>{vasya.wantsMove ? "Отозвать запрос" : "Вася просит трансфер"}</button>
            {bid && (
              <button className="chip-on" onClick={() => {
                const next = acceptBid(state.career, vasya.id);
                if (typeof next !== "string") onChange({ ...state, teamId: next.teamId, career: next, note: `Вася перешёл в ${teamById(next.teamId).name}. Бонус ${formatRub(next.budget - state.career.budget)}.` });
              }}>Принять {teamById(bid.from).name}</button>
            )}
          </div>
        </section>
      )}
      <section className="card">
        <p className="font-display text-xs tracking-widest text-mint uppercase">Пресса</p>
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
        <p className="font-display text-xs tracking-widest text-fg/50 uppercase">Сохранение</p>
        <p className="mt-1 text-sm text-fg/70">История Васи, трансферы и архив побед пишутся на это устройство. Новый сезон не стирает их. «Стереть историю» — это уже полный сброс.</p>
      </section>
    </div>
  );
}