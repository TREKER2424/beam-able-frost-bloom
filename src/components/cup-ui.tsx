import { useState } from "react";
import { Crest } from "@/components/crests";
import {
  cupPress,
  currentRound,
  forfeitCup,
  shapeCup,
  simulateOthers,
  simulateTie,
  swapCup,
  tieWinner,
  trainCup,
  userTieIndex,
  roundTitle,
  type CupState,
  type CupTie,
} from "@/game/cup";
import { formLabel, formatRub, type Person } from "@/game/career";
import { FORMATION_IDS, teamById, type Role } from "@/game/data";
import { tr } from "@/game/i18n";

const ROLES: Record<string, Role[]> = {
  "4-3-3": ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CAM", "LW", "ST", "RW"],
  "4-4-2": ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
  "3-5-2": ["GK", "CB", "CB", "CB", "LM", "CM", "CAM", "CM", "RM", "ST", "ST"],
  "4-2-3-1": ["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "LW", "CAM", "RW", "ST"],
};

export function CupDesk({
  cup,
  onChange,
  onPlay,
  onMenu,
  onReset,
  onRestart,
}: {
  cup: CupState;
  onChange: (c: CupState) => void;
  onPlay: () => void;
  onMenu: () => void;
  onReset: () => void;
  onRestart: () => void;
}) {
  const [tab, setTab] = useState<"home" | "bracket" | "squad" | "train" | "calendar" | "press" | "save">("home");
  const [note, setNote] = useState("");
  const [slot, setSlot] = useState<number | null>(null);
  const me = teamById(cup.teamId);
  const round = currentRound(cup);

  function apply(result: CupState | string) {
    if (typeof result === "string") setNote(result);
    else {
      setNote("");
      onChange(result);
    }
  }

  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <button className="text-sm text-mint" onClick={onMenu}>{tr("Меню", "Menu")}</button>
        <button className="text-sm text-fg/50" onClick={onReset}>{tr("Сбросить кубок", "Reset the cup")}</button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Crest id={me.id} className="h-14 w-14" />
        <div>
          <p className="font-display text-xs tracking-widest text-mint uppercase">{tr("Кубок России", "Russian Cup")}</p>
          <h2 className="font-display text-3xl uppercase">{me.name}</h2>
          <p className="text-sm text-fg/70">{roundTitle(round.id)} · {tr("все 24 клуба", "all 24 clubs")} · {tr("призовые", "prize money")} {formatRub(cup.budget)} · {tr("без трансферов", "no transfers")}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {([
          ["home", tr("Обзор", "Overview")],
          ["bracket", tr("Сетка", "Bracket")],
          ["squad", tr("Состав", "Squad")],
          ["train", tr("Тренировка", "Training")],
          ["calendar", tr("Календарь", "Calendar")],
          ["press", tr("Пресса", "Press")],
          ["save", tr("Сохранение", "Save")],
        ] as const).map(([id, label]) => (
          <button key={id} className={tab === id ? "chip-on shrink-0" : "chip shrink-0"} onClick={() => { setTab(id); setNote(""); }}>{label}</button>
        ))}
      </div>
      {note && <p className="mt-3 text-sm text-mint">{note}</p>}
      {tab === "home" && <Overview cup={cup} onPlay={onPlay} onApply={apply} onRestart={onRestart} />}
      {tab === "bracket" && <Bracket cup={cup} />}
      {tab === "squad" && <Squad cup={cup} slot={slot} onSlot={setSlot} onApply={apply} />}
      {tab === "train" && <Train cup={cup} onApply={apply} />}
      {tab === "calendar" && <Calendar cup={cup} onPlay={onPlay} onApply={apply} />}
      {tab === "press" && <Press cup={cup} />}
      {tab === "save" && <Save cup={cup} onSave={() => onChange(cup)} />}
      {cup.champion === cup.teamId && !cup.seenCutscene && <Cutscene name={me.name} onDone={() => onChange({ ...cup, seenCutscene: true })} />}
    </main>
  );
}

function Overview({
  cup,
  onPlay,
  onApply,
  onRestart,
}: {
  cup: CupState;
  onPlay: () => void;
  onApply: (r: CupState | string) => void;
  onRestart: () => void;
}) {
  const round = currentRound(cup);
  const index = userTieIndex(cup);
  const tie = index >= 0 ? round.ties[index] : round.ties.find((t) => t.home === cup.teamId || t.away === cup.teamId);
  if (cup.champion) {
    const holder = teamById(cup.champion);
    return (
      <section className="mt-4">
        <p className="font-display text-2xl uppercase text-mint">{cup.champion === cup.teamId ? tr("Кубок ваш", "The cup is yours") : tr(`Вылет. Кубок у ${holder.name}`, `Out. The cup belongs to ${holder.name}`)}</p>
        <p className="mt-2 text-sm text-fg/70">{tr("Турнир закрыт. Сетку можно начать заново: жеребьёвка снова соберёт все 24 клуба.", "The tournament is closed. The bracket can start again: the draw will gather all 24 clubs once more.")}</p>
        <button className="btn-main mt-3" onClick={onRestart}>{tr("Начать заново", "Start again")}</button>
      </section>
    );
  }
  if (cup.out) {
    return (
      <section className="mt-4">
        <p className="font-display text-2xl uppercase text-mint">{tr("Вылет", "Eliminated")}</p>
        <p className="mt-2 text-sm text-fg/70">{tr("Клуб выбыл из Кубка России. Техническое поражение и проигрыш в сетке здесь окончательные. Можно смотреть, кто забрал трофей, и начать заново.", "The club is out of the Russian Cup. A walkover and a loss in the bracket are final here. You can see who took the trophy, and start again.")}</p>
        <button className="btn-main mt-3" onClick={onRestart}>{tr("Начать заново", "Start again")}</button>
      </section>
    );
  }
  return (
    <section className="mt-4">
      <p className="text-sm text-fg/70">{tr("Жеребьёвка ставит рядом клубы с близким рейтингом и формой. Состав не меняется трансферами: только тактика и тренировки.", "The draw pairs clubs of similar rating and form. The squad does not change through transfers: only tactics and training.")}</p>
      {tie?.away && tie.hg === null && (
        <>
          <p className="mt-3 text-sm text-fg/80">{roundTitle(round.id)}: {teamById(tie.home).name} — {teamById(tie.away).name}. {tr("Схема", "Shape")} {cup.formation}, {tr("соперник близко по силе.", "the opponent is close in strength.")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn-main" onClick={onPlay}>{tr("Играть", "Play")}</button>
            <button className="btn-ghost" onClick={() => onApply(simulateTie(cup, index))}>{tr("Симулировать", "Simulate")}</button>
            <button className="btn-ghost" onClick={() => onApply(forfeitCup(cup))}>{tr("Техническое 0:3", "Walkover 0-3")}</button>
          </div>
        </>
      )}
      {tie && !tie.away && (
        <p className="mt-3 text-sm text-fg/80">{teamById(cup.teamId).name} {tr("сеяны и пропускают эту часть сетки. Сначала закрываются остальные пары.", "are seeded and skip this part of the bracket. The other ties are closed first.")}</p>
      )}
      {round.ties.some((t) => t.away && t.hg === null && t.home !== cup.teamId && t.away !== cup.teamId) && (
        <button className="btn-ghost mt-3" onClick={() => onApply(simulateOthers(cup))}>{tr("Симулировать остальные пары", "Simulate the other ties")}</button>
      )}
    </section>
  );
}

function scoreLine(tie: CupTie): string {
  if (!tie.away) return tr("без игры", "bye");
  if (tie.hg === null || tie.ag === null) return tr("ещё не сыгран", "not played");
  const pens = tie.ph != null && tie.pa != null ? ` (${tr("пен.", "pens")} ${tie.ph}:${tie.pa})` : "";
  return `${tie.hg}:${tie.ag}${pens}`;
}

function Bracket({ cup }: { cup: CupState }) {
  const cols = bracketColumns(cup);
  const currentId = cup.rounds[Math.min(cup.round, cup.rounds.length - 1)]?.id;
  return (
    <section className="mt-4">
      <p className="text-sm text-fg/60">{tr("Турнирная сетка. Ваша пара обведена, победитель подсвечен. Пустые колонки ждут жеребьёвки следующего круга.", "The bracket. Your tie is outlined, the winner is highlighted. Empty columns wait for the next round's draw.")}</p>
      <div className="mt-3 max-h-[70vh] overflow-auto rounded-2xl border border-fg/10 bg-bg/40 p-3">
        <div className="flex min-w-max items-stretch gap-6">
          {cols.map((col, ri) => (
            <div key={col.key} className="relative flex w-60 shrink-0 flex-col">
              {ri > 0 && <span className="absolute top-8 bottom-2 -left-6 w-px bg-fg/15" />}
              <h3 className={col.key === currentId ? "font-display text-sm tracking-widest text-mint uppercase" : "font-display text-sm tracking-widest text-fg/50 uppercase"}>{col.title}</h3>
              <div className="mt-2 flex flex-1 flex-col justify-around gap-2">
                {col.ties.map((tie, i) => (
                  <BracketTie key={`${col.key}-${i}`} tie={tie} mine={Boolean(tie && (tie.home === cup.teamId || tie.away === cup.teamId))} linked={ri > 0} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function bracketColumns(cup: CupState): { key: string; title: string; ties: (CupTie | null)[] }[] {
  const order: { id: string; title: string; pairs: number }[] = [
    { id: "prelim", title: roundTitle("prelim"), pairs: 16 },
    { id: "r16", title: roundTitle("r16"), pairs: 8 },
    { id: "qf", title: roundTitle("qf"), pairs: 4 },
    { id: "sf", title: roundTitle("sf"), pairs: 2 },
    { id: "final", title: roundTitle("final"), pairs: 1 },
  ];
  const first = Math.max(0, order.findIndex((r) => r.id === cup.rounds[0]?.id));
  return order.slice(first).map((meta) => {
    const found = cup.rounds.find((r) => r.id === meta.id);
    if (found) return { key: meta.id, title: found.title, ties: found.ties };
    return { key: meta.id, title: meta.title, ties: Array.from({ length: meta.pairs }, () => null) };
  });
}

function BracketTie({ tie, mine, linked }: { tie: CupTie | null; mine: boolean; linked: boolean }) {
  return (
    <div className={`relative ${mine ? "card card-on !p-0" : "card !p-0"}`}>
      {linked && <span className="absolute top-1/2 -left-6 h-px w-6 bg-fg/20" />}
      {tie ? <PlayedTie tie={tie} /> : <GhostTie />}
    </div>
  );
}

function PlayedTie({ tie }: { tie: CupTie }) {
  const winner = tieWinner(tie);
  const pens = tie.ph != null && tie.pa != null ? ` ${tr("пен.", "pens")} ${tie.ph}:${tie.pa}` : "";
  return (
    <div>
      <BracketRow id={tie.home} score={tie.away ? tie.hg : null} win={winner === tie.home} bye={!tie.away} />
      {tie.away ? (
        <BracketRow id={tie.away} score={tie.ag} win={winner === tie.away} bye={false} />
      ) : (
        <p className="border-t border-fg/10 px-2 py-1.5 text-xs text-fg/50">{tr("без игры, проходит дальше", "bye, goes through")}</p>
      )}
      {pens && <p className="border-t border-fg/10 px-2 py-1 text-xs text-gold">{pens}</p>}
    </div>
  );
}

function BracketRow({ id, score, win, bye }: { id: string; score: number | null; win: boolean; bye: boolean }) {
  const team = teamById(id);
  return (
    <div
      className="flex items-center gap-2 border-t border-fg/10 px-2 py-1.5 first:border-t-0"
      style={win ? { background: "color-mix(in srgb, var(--color-mint) 16%, transparent)" } : undefined}
    >
      <Crest id={id} className="h-7 w-7 shrink-0" />
      <span className={win ? "min-w-0 flex-1 truncate font-display text-sm text-mint uppercase" : "min-w-0 flex-1 truncate font-display text-sm uppercase"}>{team.name}</span>
      <span className="font-display text-sm tabular-nums">{bye ? "—" : score === null ? "·" : score}</span>
    </div>
  );
}

function GhostTie() {
  return (
    <div className="px-2 py-3 text-center">
      <p className="font-display text-xs tracking-widest text-fg/35 uppercase">{tr("Пара ещё не собрана", "Tie not drawn yet")}</p>
      <p className="mt-1 text-xs text-fg/40">{tr("Ждёт победителей прошлого круга", "Waiting for the winners of the last round")}</p>
    </div>
  );
}

function Squad({
  cup,
  slot,
  onSlot,
  onApply,
}: {
  cup: CupState;
  slot: number | null;
  onSlot: (n: number | null) => void;
  onApply: (r: CupState | string) => void;
}) {
  const roles = ROLES[cup.formation] ?? ROLES["4-3-3"]!;
  return (
    <section className="mt-4">
      <p className="text-sm text-fg/70">{tr("Нажмите позицию в основе, затем игрока заявки. Трансферов в кубке нет.", "Tap a starting place, then a squad player. There are no transfers in the cup.")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FORMATION_IDS.map((id) => (
          <button key={id} className={cup.formation === id ? "chip-on" : "chip"} onClick={() => onApply(shapeCup(cup, id))}>{id}</button>
        ))}
      </div>
      <ul className="mt-4 grid gap-2">
        {roles.map((role, i) => {
          const player = cup.people.find((q) => q.id === cup.lineup[i]);
          return (
            <li key={`${role}-${i}`}>
              <button className={slot === i ? "card card-on w-full text-left" : "card w-full text-left"} onClick={() => onSlot(slot === i ? null : i)}>
                <span className="text-xs text-fg/50">{role}</span>
                <span className="ml-2 font-display uppercase">{player ? `${player.num} ${player.name}` : tr("пусто", "empty")}</span>
                {player && <span className="mt-1 block text-xs text-fg/60">OVR {player.ovr} · {tr("форма", "form")} {formLabel(player.form)} · {tr("свежесть", "freshness")} {player.fitness}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <h3 className="font-display mt-5 text-sm tracking-widest uppercase text-fg/60">{tr("Заявка", "Squad list")}</h3>
      <ul className="mt-2 grid gap-2">
        {mine(cup).map((p) => (
          <li key={p.id}>
            <button className="card w-full text-left" onClick={() => onApply(slot === null ? tr("Сначала выберите позицию в основе", "Pick a starting place first") : swapCup(cup, slot, p.id))}>
              <span className="font-display uppercase">{p.num} {p.name}</span>
              <span className="mt-1 block text-xs text-fg/60">{p.pos} · OVR {p.ovr} · {tr("форма", "form")} {p.form} · {tr("свежесть", "freshness")} {p.fitness}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function mine(cup: CupState): Person[] {
  return cup.people.filter((p) => p.teamId === cup.teamId).sort((a, b) => b.ovr - a.ovr || a.num - b.num);
}

function Train({ cup, onApply }: { cup: CupState; onApply: (r: CupState | string) => void }) {
  const squad = mine(cup);
  return (
    <section className="mt-4">
      <p className="text-sm text-fg/70">{tr("На стадию осталось тренировок", "Sessions left this round")}: {cup.trainsLeft}. {tr("Форма влияет на следующую жеребьёвку.", "Form affects the next draw.")}</p>
      <ul className="mt-3 grid gap-2">
        {squad.map((p) => (
          <li key={p.id} className="card">
            <span className="font-display uppercase">{p.num} {p.name}</span>
            <span className="mt-1 block text-xs text-fg/60">{p.pos} · {tr("форма", "form")} {formLabel(p.form)} ({p.form}) · {tr("свежесть", "freshness")} {p.fitness} · OVR {p.ovr}</span>
            <span className="mt-2 flex flex-wrap gap-2">
              <button className="chip" onClick={() => onApply(trainCup(cup, p.id, "form"))}>{tr("Форма", "Form")}</button>
              <button className="chip" onClick={() => onApply(trainCup(cup, p.id, "fitness"))}>{tr("Свежесть", "Freshness")}</button>
              <button className="chip" onClick={() => onApply(trainCup(cup, p.id, "sharp"))}>{tr("Острота", "Sharpness")}</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Calendar({
  cup,
  onPlay,
  onApply,
}: {
  cup: CupState;
  onPlay: () => void;
  onApply: (r: CupState | string) => void;
}) {
  const index = userTieIndex(cup);
  return (
    <section className="mt-4 grid gap-4">
      {cup.rounds.map((round) => (
        <article key={round.id}>
          <h3 className="font-display text-sm tracking-widest uppercase text-fg/60">{roundTitle(round.id)}</h3>
          <ul className="mt-2 grid gap-2">
            {round.ties.map((tie, i) => {
              const mine = tie.home === cup.teamId || tie.away === cup.teamId;
              const open = mine && tie.hg === null && tie.away && index === i && round.id === currentRound(cup).id;
              return (
                <li key={`${round.id}-${i}`} className="card flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="block font-display uppercase">{teamById(tie.home).name}{tie.away ? ` — ${teamById(tie.away).name}` : ""}</span>
                    <span className="text-sm text-fg/60">{scoreLine(tie)}</span>
                  </span>
                  {open && (
                    <span className="flex flex-wrap gap-2">
                      <button className="chip-on" onClick={onPlay}>{tr("Играть", "Play")}</button>
                      <button className="chip" onClick={() => onApply(simulateTie(cup, i))}>{tr("Симулировать", "Simulate")}</button>
                      <button className="chip" onClick={() => onApply(forfeitCup(cup))}>{tr("0:3", "0-3")}</button>
                    </span>
                  )}
                  {!mine && tie.away && tie.hg === null && round.id === currentRound(cup).id && !cup.out && !cup.champion && (
                    <button className="chip" onClick={() => onApply(simulateTie(cup, i))}>{tr("Симулировать", "Simulate")}</button>
                  )}
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </section>
  );
}

function Press({ cup }: { cup: CupState }) {
  const items = cupPress(cup);
  return (
    <section className="mt-4 grid gap-3">
      {items.map((item, i) => (
        <article key={`${item.title}-${i}`} className="card">
          <p className="font-display text-xs tracking-widest text-mint uppercase">{item.tag}</p>
          <h3 className="font-display mt-1 text-xl uppercase">{item.title}</h3>
          <p className="mt-2 text-sm text-fg/75">{item.body}</p>
        </article>
      ))}
    </section>
  );
}

function Save({ cup, onSave }: { cup: CupState; onSave: () => void }) {
  const [msg, setMsg] = useState("");
  const played = cup.rounds.flatMap((r) => r.ties).filter((t) => t.hg !== null).length;
  return (
    <section className="card mt-4">
      <h3 className="font-display text-xl uppercase">{tr("Сохранение", "Save")}</h3>
      <p className="mt-2 text-sm text-fg/75">{tr("Кубок пишется отдельно от карьер лиги. Сброс стирает только эту сетку.", "The cup is saved apart from league careers. Reset wipes only this bracket.")}</p>
      <p className="mt-2 text-sm text-fg/80">{teamById(cup.teamId).name} · {tr("сыграно пар", "ties played")} {played}. {cup.champion ? tr("Турнир закрыт.", "The tournament is closed.") : cup.out ? tr("Клуб выбыл.", "The club is out.") : tr("Сетка ещё идёт.", "The bracket is still going.")}</p>
      <button className="btn-main mt-4" onClick={() => { onSave(); setMsg(tr("Записано.", "Saved.")); }}>{tr("Записать прогресс", "Save progress")}</button>
      {msg && <p className="mt-2 text-sm text-mint">{msg}</p>}
    </section>
  );
}

function Cutscene({ name, onDone }: { name: string; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const scenes = [
    { kicker: tr("Финал", "Final"), title: tr("Последний свисток", "The last whistle"), text: tr(`${name} доигрывают финал. Счёт уже не изменится.`, `${name} finish the final. The score will not change.`) },
    { kicker: tr("Трибуны", "The stands"), title: tr("Кубок над газоном", "The cup above the grass"), text: tr("Капитан поднимает трофей. Сетка из 24 клубов осталась позади.", "The captain lifts the trophy. A bracket of 24 clubs is behind them.") },
    { kicker: tr("Поздравляем", "Congratulations"), title: tr(`${name} — обладатель Кубка России`, `${name} — winners of the Russian Cup`), text: tr("Этот состав прошёл жеребьёвку без трансферов. Турнир можно начать заново.", "This squad came through the draw without transfers. The tournament can start again.") },
  ];
  const scene = scenes[step]!;
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-bg/80 px-4 pb-6 sm:items-center">
      <div className="card mx-auto w-full max-w-xl">
        <svg viewBox="0 0 64 64" className="mb-3 h-16 w-16" aria-hidden>
          <path d="M18 8h28v8c0 10-6 18-14 20-8-2-14-10-14-20z" fill="#e2b93b" />
          <path d="M18 12c-6 1-10 6-10 12 0 8 6 12 12 12M46 12c6 1 10 6 10 12 0 8-6 12-12 12" fill="none" stroke="#e2b93b" strokeWidth="3" />
          <path d="M28 36h8v8h6v6H22v-6h6z" fill="#e2b93b" />
        </svg>
        <p className="font-display text-xs tracking-widest text-gold uppercase">{scene.kicker}</p>
        <h2 className="font-display mt-2 text-4xl uppercase">{scene.title}</h2>
        <p className="mt-3 text-sm text-fg/75">{scene.text}</p>
        <button className="btn-main mt-4" onClick={() => (step < scenes.length - 1 ? setStep(step + 1) : onDone())}>{step < scenes.length - 1 ? tr("Дальше", "Next") : tr("Закрыть", "Close")}</button>
      </div>
    </div>
  );
}
