import { useState } from "react";
import { Crest } from "@/components/crests";
import { teamById } from "@/game/data";
import { createRef, beginRefSeason, refFixture, refRank, type RefState } from "@/game/referee";

export function RefereeCreate({ onBack, onDone }: { onBack: () => void; onDone: (name: string) => void }) {
  const [name, setName] = useState("А. Судейкин");
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>Назад</button>
      <p className="mt-4 font-display text-xs tracking-widest text-gold uppercase">Бета</p>
      <h2 className="font-display mt-2 text-3xl uppercase">Карьера судьи</h2>
      <p className="mt-2 text-sm text-fg/70">Матч идёт сам. В игре чаще стыки: вы назначаете штрафные, пенальти и карточки. Верные решения поднимают категорию.</p>
      <label className="mt-4 block text-sm text-fg/70">
        Имя в протоколе
        <input className="mt-1 w-full rounded-2xl border border-fg/15 bg-card px-3 py-3 text-fg" value={name} maxLength={22} onChange={(e) => setName(e.target.value)} />
      </label>
      <button className="btn-main mt-5" onClick={() => onDone(name.trim() || "А. Судейкин")}>Начать судейство</button>
    </main>
  );
}

export function RefereeDesk({
  state,
  onMatch,
  onSimulate,
  onMenu,
  onReset,
  onSave,
  onChange,
}: {
  state: RefState;
  onMatch: () => void;
  onSimulate: () => void;
  onMenu: () => void;
  onReset: () => void;
  onSave: () => void;
  onChange: (s: RefState) => void;
}) {
  const [tab, setTab] = useState<"desk" | "stats" | "save">("desk");
  const [msg, setMsg] = useState("");
  const fx = refFixture(state.nextIndex);
  const calls = state.correct + state.wrong;
  const accuracy = calls === 0 ? 0 : Math.round((state.correct / calls) * 100);
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <button className="text-sm text-mint" onClick={onMenu}>Меню</button>
        <button className="text-sm text-fg/50" onClick={onReset}>Новая карьера</button>
      </div>
      <p className="mt-4 font-display text-xs tracking-widest text-gold uppercase">Судья · сезон {state.season || 1}</p>
      <h2 className="font-display mt-2 text-3xl uppercase">{state.name}</h2>
      <p className="mt-1 text-sm text-fg/70">{refRank(state.rating)} · рейтинг {state.rating} · закрыто сезонов {state.seasonsDone || 0}</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-fg/15">
        <div className="h-full bg-gold" style={{ width: `${state.rating}%` }} />
      </div>
      <div className="mt-4 flex gap-2">
        {([["desk", "Назначения"], ["stats", "Статистика"], ["save", "Сохранение"]] as const).map(([id, label]) => (
          <button key={id} className={tab === id ? "chip-on" : "chip"} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "desk" && (
        <>
          {fx ? (
            <div className="mt-6 flex flex-col gap-2">
              <button className="btn-main w-full" onClick={onMatch}>
                Судить матч {state.nextIndex + 1}
                <span className="mt-1 block font-sans text-xs font-normal normal-case text-bg/80">
                  {teamById(fx.home).name} — {teamById(fx.away).name}
                </span>
              </button>
              <button className="btn-ghost" onClick={onSimulate}>Симулировать назначение</button>
            </div>
          ) : (
            <div className="mt-6">
              <p className="font-display text-2xl uppercase text-mint">Назначения на сезон закрыты</p>
              <p className="mt-2 text-sm text-fg/70">Личная статистика, рейтинг и число отсуженных матчей сохранятся. Список ниже начнётся заново.</p>
              <button className="btn-main mt-3" onClick={() => {
                const next = beginRefSeason(state);
                if (typeof next !== "string") onChange(next);
              }}>Новый сезон</button>
            </div>
          )}
          <ul className="mt-6 grid gap-2">
            {Array.from({ length: 8 }, (_, i) => refFixture(i)).map((item, i) => {
              if (!item) return null;
              const done = i < state.nextIndex;
              const score = state.results[i];
              return (
                <li key={i} className="card flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Crest id={item.home} className="h-8 w-8 shrink-0" />
                    <span className="truncate">{teamById(item.home).name} — {teamById(item.away).name}</span>
                  </span>
                  <span className="shrink-0 text-fg/50">{score ? `${score.hg}:${score.ag}` : done ? "отсужен" : i === state.nextIndex ? "сейчас" : "впереди"}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {tab === "stats" && (
        <ul className="mt-6 grid gap-2 text-sm">
          <Stat label="Сезон" value={String(state.season || 1)} />
          <Stat label="Закрыто сезонов" value={String(state.seasonsDone || 0)} />
          <Stat label="Матчи" value={String(state.matches)} />
          <Stat label="Верные решения" value={String(state.correct)} />
          <Stat label="Ошибки" value={String(state.wrong)} />
          <Stat label="Точность" value={calls ? `${accuracy}%` : "—"} />
          <Stat label="Фолы" value={String(state.fouls)} />
          <Stat label="Жёлтые" value={String(state.yellows)} />
          <Stat label="Красные" value={String(state.reds)} />
          <Stat label="Пенальти" value={String(state.pens)} />
          <Stat label="Офсайды" value={String(state.offsides)} />
          <Stat label="Категория" value={refRank(state.rating)} />
        </ul>
      )}
      {tab === "save" && (
        <section className="card mt-6">
          <h3 className="font-display text-xl uppercase">Сохранение</h3>
          <p className="mt-2 text-sm text-fg/75">Карьера судьи, рейтинг и личная статистика пишутся на это устройство. Новый сезон не обнуляет решения, карточки и категорию — только календарь назначений.</p>
          <button className="btn-main mt-4" onClick={() => { onSave(); setMsg("Записано."); }}>Записать прогресс</button>
          {msg && <p className="mt-2 text-sm text-mint">{msg}</p>}
        </section>
      )}
    </main>
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

export { createRef };