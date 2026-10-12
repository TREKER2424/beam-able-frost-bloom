import { useState } from "react";
import { Crest } from "@/components/crests";
import { audio } from "@/game/audio";
import { tr } from "@/game/i18n";
import {
  acceptBid,
  beginNextSeason,
  careerClosed,
  careerLevel,
  careerRecord,
  championOf,
  coachCopy,
  CREATE_ROLES,
  firstOpenIndex,
  forfeitMatch,
  formatRub,
  formLabel,
  isSeasonOver,
  peopleOf,
  personById,
  playerValue,
  pressFeed,
  requestTransfer,
  seasonRatingBump,
  sellPlayer,
  setFormation,
  simulateIndex,
  squadOvr,
  swapLineup,
  train,
  wageOf,
  buyPlayer,
  type CareerState,
  type Person,
} from "@/game/career";
import { clubInfo, clubRating, clubShape, coachLabel, coachRating, FORMATION_IDS, playerAttrs, styleLabel, tableOf, teamById, type Role, type TeamDef } from "@/game/data";

type Tab = "home" | "cup" | "squad" | "market" | "train" | "calendar" | "press" | "save";

export function CareerDesk({
  career,
  onChange,
  onPlay,
  onMenu,
  onReset,
  onCreate,
  asPlayer = false,
}: {
  career: CareerState;
  onChange: (c: CareerState) => void;
  onPlay: () => void;
  onMenu: () => void;
  onReset: () => void;
  onCreate?: () => void;
  asPlayer?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("home");
  const [note, setNote] = useState("");
  const [slot, setSlot] = useState<number | null>(null);
  const me = teamById(career.teamId);
  const info = clubInfo(career.teamId);
  const created = personById(career, career.createdId);
  const table = tableOf(career.fixtures);

  function apply(result: CareerState | string) {
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
        <button className="text-sm text-fg/50" onClick={onReset}>{tr("Сбросить карьеру", "Reset career")}</button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Crest id={me.id} className="h-14 w-14" />
        <div>
          <p className="font-display text-xs tracking-widest text-mint uppercase">{asPlayer ? tr("Карьера игрока", "Player career") : tr("Карьера тренера", "Manager career")}</p>
          <h2 className="font-display text-3xl uppercase">{me.name}</h2>
          <p className="text-sm text-fg/70">{tr("Сезон", "Season")} {career.season || 1} · {me.city} · {tr("бюджет", "budget")} {formatRub(career.budget)} · {tr("зарплаты", "wages")} {formatRub(peopleOf(career, career.teamId).reduce((s, p) => s + wageOf(p), 0))} / {tr("тур", "round")}</p>
        </div>
      </div>
      {created && (
        <div className="card mt-4">
          <p className="font-display text-xs tracking-widest text-mint uppercase">{tr("Ваш игрок", "Your player")}</p>
          <p className="font-display text-xl uppercase">{created.name} · {created.pos} · #{created.num}</p>
          <p className="text-sm text-fg/70">{tr("Форма", "Form")} {formLabel(created.form)} ({created.form}) · {tr("свежесть", "freshness")} {created.fitness} · OVR {created.ovr} · {tr("голы", "goals")} {created.goals}</p>
          <FormBar value={created.form} />
        </div>
      )}
      {!created && onCreate && (
        <button className="btn-main mt-4 w-full" onClick={onCreate}>{tr("Создать своего игрока", "Create your player")}</button>
      )}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {([
          ["home", tr("Обзор", "Overview")],
          ["cup", tr("Турнир", "Competition")],
          ["squad", tr("Состав", "Squad")],
          ["market", tr("Трансферы", "Transfers")],
          ["train", tr("Тренировка", "Training")],
          ["calendar", tr("Календарь", "Calendar")],
          ["press", tr("Пресса", "Press")],
          ["save", tr("Сохранение", "Save")],
        ] as const).map(([id, label]) => (
          <button key={id} className={tab === id ? "chip-on shrink-0" : "chip shrink-0"} onClick={() => { setTab(id); setNote(""); }}>{label}</button>
        ))}
      </div>
      {note && <p className="mt-3 text-sm text-mint">{note}</p>}
      {tab === "home" && (
        <section className="mt-4">
          <p className="text-sm text-fg/70">{asPlayer ? tr("На поле бегаете только вы. Партнёры держат схему.", "On the pitch you run only as yourself. Teammates keep the shape.") : (() => { const coach = coachCopy(career.coach); return coach ? `${coach.name} · ${coach.title} · ${tr("рейтинг", "rating")} ${coach.rating}. ${coach.story}` : `${coachLabel(info.coach)} · ${tr("рейтинг тренера", "coach rating")} ${coachRating(career.teamId)} · ${styleLabel(info.style)}`; })()} · {me.stadium} · {tr("средний рейтинг", "average rating")} {squadOvr(career, career.teamId)}</p>
          <NextActions career={career} onPlay={onPlay} onApply={apply} onRetire={onReset} asPlayer={asPlayer} />
          <LeagueTable table={table} mine={career.teamId} />
        </section>
      )}
      {tab === "cup" && <TournamentTab career={career} />}
      {tab === "squad" && (
        <SquadTab career={career} slot={slot} onSlot={setSlot} onApply={apply} />
      )}
      {tab === "market" && <MarketTab career={career} onApply={apply} asPlayer={asPlayer} />}
      {tab === "train" && <TrainTab career={career} onApply={apply} asPlayer={asPlayer} />}
      {tab === "calendar" && (
        <CalendarTab career={career} onApply={apply} onPlay={onPlay} />
      )}
      {tab === "press" && <PressTab career={career} />}
      {tab === "save" && <SaveTab career={career} onSave={() => onChange(career)} />}
    </main>
  );
}

function NextActions({
  career,
  onPlay,
  onApply,
  onRetire,
  asPlayer = false,
}: {
  career: CareerState;
  onPlay: () => void;
  onApply: (r: CareerState | string) => void;
  onRetire: () => void;
  asPlayer?: boolean;
}) {
  const open = firstOpenIndex(career);
  if (open < 0) {
    const champ = championOf(career);
    const rec = careerRecord(career);
    const table = tableOf(career.fixtures);
    const place = table.findIndex((r) => r.id === career.teamId) + 1;
    const bump = place > 0 ? seasonRatingBump(place, table.length) : 0;
    const bumpText = bump > 0
      ? tr(`За место средний рейтинг клуба +${bump}.`, `For the place, the club's average rating is +${bump}.`)
      : bump < 0
        ? tr(`За место средний рейтинг клуба ${bump}.`, `For the place, the club's average rating is ${bump}.`)
        : "";
    if (careerClosed(career)) {
      return (
        <div className="mt-4">
          <p className="font-display text-2xl uppercase text-mint">{tr("Десять сезонов позади", "Ten seasons behind you")}</p>
          <p className="mt-2 text-sm text-fg/75">{tr("Карьера пройдена до конца. Спасибо за путь. Сохранения этого режима закроются, когда начнёте заново.", "The career is complete. Thank you for the road. This mode's save closes when you start again.")}</p>
          {champ && <p className="mt-2 text-sm">{tr("Чемпион", "Champion")}: {teamById(champ.id).name} · {champ.pts} {tr("очков", "points")}{champ.id === career.teamId ? tr(" · кубок ваш", " · the trophy is yours") : ""}</p>}
          <p className="mt-2 text-sm text-fg/75">{tr("В архиве титулы", "In the archive: titles")} {rec.titles}, {tr("пьедесталы", "podiums")} {rec.podiums}, {tr("победы", "wins")} {rec.wins}.</p>
          <button className="btn-main mt-3" onClick={onRetire}>{tr("Начать путь заново", "Start the path again")}</button>
        </div>
      );
    }
    return (
      <div className="mt-4">
        <p className="font-display text-2xl uppercase text-mint">{tr("Сезон", "Season")} {career.season || 1} {tr("завершён", "is over")}</p>
        <p className="mt-1 text-sm text-fg/70">{tr("Все команды сыграли друг с другом. Кубок вручается только сейчас. Новый сезон сохранит состав, деньги, уже совершённые трансферы и статистику побед. Непринятые предложения лучше закрыть на вкладке «Трансферы» — после кнопки окно закроется.", "Every team has played every other team. The trophy is handed out only now. A new season keeps the squad, the money, completed transfers and the win record. Close unused offers on the Transfers tab — the window shuts after the button.")}</p>
        {champ && <p className="mt-2 text-sm">{tr("Чемпион", "Champion")}: {teamById(champ.id).name} · {champ.pts} {tr("очков", "points")}{champ.id === career.teamId ? tr(" · кубок ваш", " · the trophy is yours") : ""}</p>}
        {bumpText && <p className="mt-2 text-sm text-mint">{bumpText} {tr("Прибавка ляжет на игроков вашего клуба в новом сезоне.", "The change lands on your club's players in the new season.")}</p>}
        <p className="mt-2 text-sm text-fg/75">{tr("В архиве уже титулы", "The archive already has titles")} {rec.titles}, {tr("пьедесталы", "podiums")} {rec.podiums}, {tr("победы", "wins")} {rec.wins}. {tr("Этот сезон допишется туда при старте следующего.", "This season is written in when the next one starts.")}</p>
        <button className="btn-main mt-3" onClick={() => onApply(beginNextSeason(career))}>{tr("Новый сезон", "New season")}</button>
      </div>
    );
  }
  const fixture = career.fixtures[open]!;
  const user = fixture.home === career.teamId || fixture.away === career.teamId;
  const foeId = fixture.home === career.teamId ? fixture.away : fixture.home;
  const level = user ? careerLevel(career, foeId, asPlayer) : null;
  const label: Record<string, string> = {
    novice: tr("Новичок", "Novice"),
    amateur: tr("Любитель", "Amateur"),
    pro: tr("Профессионал", "Professional"),
    world: tr("Мировой класс", "World class"),
    legend: tr("Легенда Волги", "Volga legend"),
  };
  return (
    <div className="mt-4">
      <p className="text-sm text-fg/70">
        {tr("Следующий по календарю", "Next on the calendar")}: {teamById(fixture.home).name} — {teamById(fixture.away).name}
        {level ? ` · ${asPlayer ? tr("рейтинг игрока", "player rating") : tr("рейтинг тренера и команды", "coach and club rating")} ${level.mine} ${tr("против", "vs")} ${level.theirs} · ${tr("сложность", "difficulty")} ${label[level.diff]}` : ""}
      </p>
      {user && (
        <p className="mt-1 text-sm text-fg/80">
          {tr("Сводка: вы", "Briefing: you play")} {career.formation}. {teamById(foeId).name} {tr("выходят", "line up")} {clubShape(foeId, open)}.
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {user ? (
          <>
            <button className="btn-main" onClick={onPlay}>{tr("Играть", "Play")}</button>
            <button className="btn-ghost" onClick={() => onApply(simulateIndex(career, open))}>{tr("Симулировать", "Simulate")}</button>
            <button className="btn-ghost" onClick={() => onApply(forfeitMatch(career, open))}>{tr("Техническое 0:3", "Walkover 0-3")}</button>
          </>
        ) : (
          <button className="btn-ghost" onClick={() => onApply(simulateIndex(career, open))}>{tr("Симулировать этот матч", "Simulate this match")}</button>
        )}
      </div>
    </div>
  );
}

function FormBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-fg/15">
      <div className="h-full bg-mint" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function LeagueTable({ table, mine }: { table: ReturnType<typeof tableOf>; mine: string }) {
  return (
    <table className="mt-5 w-full table-fixed text-left text-xs sm:text-sm">
      <thead className="text-fg/50">
        <tr>
          <th className="w-[38%] py-2">{tr("Клуб", "Club")}</th>
          <th className="text-center">{tr("И", "P")}</th>
          <th className="text-center">{tr("В", "W")}</th>
          <th className="text-center">{tr("Н", "D")}</th>
          <th className="text-center">{tr("П", "L")}</th>
          <th className="text-center">{tr("М", "GD")}</th>
          <th className="text-center">{tr("О", "Pts")}</th>
        </tr>
      </thead>
      <tbody>
        {table.map((row, i) => (
          <tr key={row.id} className={row.id === mine ? "bg-pitch/30" : ""}>
            <td className="truncate py-2 pr-1"><span className="mr-1 text-fg/40">{i + 1}</span>{teamById(row.id).name}</td>
            <td className="text-center tabular-nums">{row.p}</td>
            <td className="text-center tabular-nums">{row.w}</td>
            <td className="text-center tabular-nums">{row.d}</td>
            <td className="text-center tabular-nums">{row.l}</td>
            <td className="text-center tabular-nums">{row.gf}:{row.ga}</td>
            <td className="text-center font-display tabular-nums">{row.pts}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SquadTab({
  career,
  slot,
  onSlot,
  onApply,
}: {
  career: CareerState;
  slot: number | null;
  onSlot: (n: number | null) => void;
  onApply: (r: CareerState | string) => void;
}) {
  const slots = (career.formation && FORMATION_IDS.includes(career.formation as (typeof FORMATION_IDS)[number])
    ? career.lineup
    : career.lineup);
  const formationSlots = (awaitForm(career.formation));
  return (
    <section className="mt-4">
      <p className="text-sm text-fg/70">{tr("Нажмите позицию в основе, затем игрока из заявки. Форма влияет на силу в матче.", "Tap a starting place, then a player from the squad. Form changes how strong he is in the match.")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FORMATION_IDS.map((id) => (
          <button key={id} className={career.formation === id ? "chip-on" : "chip"} onClick={() => onApply(setFormation(career, id))}>{id}</button>
        ))}
      </div>
      <ul className="mt-4 grid gap-2">
        {formationSlots.map((role, i) => {
          const p = personById(career, slots[i] ?? "");
          return (
            <li key={`${role}-${i}`}>
              <button className={slot === i ? "card card-on w-full text-left" : "card w-full text-left"} onClick={() => onSlot(slot === i ? null : i)}>
                <span className="text-xs text-fg/50">{role}</span>
                <span className="ml-2 font-display uppercase">{p ? `${p.num} ${p.name}` : tr("пусто", "empty")}</span>
                {p?.created && <span className="ml-2 text-xs text-mint">{tr("вы", "you")}</span>}
                {p && <span className="mt-1 block text-xs text-fg/60">OVR {p.ovr} · {tr("форма", "form")} {formLabel(p.form)} · {tr("свежесть", "freshness")} {p.fitness}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <h3 className="font-display mt-5 text-sm tracking-widest uppercase text-fg/60">{tr("Заявка", "Squad list")}</h3>
      <ul className="mt-2 grid gap-2">
        {peopleOf(career, career.teamId).map((p) => (
          <li key={p.id}>
            <button
              className="card w-full text-left"
              onClick={() => {
                if (slot === null) {
                  onApply(tr("Сначала выберите позицию в основе", "Pick a starting place first"));
                  return;
                }
                onApply(swapLineup(career, slot, p.id));
              }}
            >
              <PlayerLine p={p} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function awaitForm(formation: string): Role[] {
  const map: Record<string, Role[]> = {
    "4-3-3": ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CAM", "LW", "ST", "RW"],
    "4-4-2": ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
    "3-5-2": ["GK", "CB", "CB", "CB", "LM", "CM", "CAM", "CM", "RM", "ST", "ST"],
    "4-2-3-1": ["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "LW", "CAM", "RW", "ST"],
  };
  return map[formation] ?? map["4-3-3"]!;
}

function PlayerLine({ p }: { p: Person }) {
  return (
    <>
      <span className="font-display uppercase">{p.num} {p.name}</span>
      {p.created && <span className="ml-2 text-xs text-mint">{tr("вы", "you")}</span>}
      <span className="mt-1 block text-xs text-fg/60">{p.pos} · {p.age} {tr("лет", "yrs")} · OVR {p.ovr} · {tr("скр", "pac")} {playerAttrs(p).speed} · {tr("точ", "acc")} {playerAttrs(p).accuracy} · {tr("жёст", "str")} {playerAttrs(p).hardness} · {tr("форма", "form")} {p.form} · {formatRub(playerValue(p))} · {tr("з/п", "wage")} {formatRub(wageOf(p))}{p.wantsMove ? tr(" · просит трансфер", " · wants a move") : ""}</span>
    </>
  );
}

function MarketTab({ career, onApply, asPlayer = false }: { career: CareerState; onApply: (r: CareerState | string) => void; asPlayer?: boolean }) {
  const others = career.people.filter((p) => p.teamId !== career.teamId).sort((a, b) => playerValue(b) - playerValue(a)).slice(0, 24);
  const mine = peopleOf(career, career.teamId).filter((p) => (asPlayer ? p.created : true));
  const bids = career.bids ?? [];
  const done = isSeasonOver(career);
  return (
    <section className="mt-4 grid gap-4">
      <p className="text-sm text-fg/70">{tr("Запросить трансфер можно в любой момент. Уйти в другой клуб — только в конце сезона, когда все сыграли со всеми.", "You can request a transfer at any time. A move to another club waits until the end of the season, when everyone has played everyone.")}</p>
      <div>
        <h3 className="font-display text-sm tracking-widest uppercase text-fg/60">{asPlayer ? tr("Ваш запрос", "Your request") : tr("Запросы игроков", "Player requests")}</h3>
        <ul className="mt-2 grid gap-2">
          {mine.map((p) => {
            const bid = bids.find((b) => b.personId === p.id);
            return (
              <li key={p.id} className="card flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0"><PlayerLine p={p} /></span>
                <span className="flex flex-wrap gap-2">
                  {!done && (
                    <button className="chip shrink-0" onClick={() => onApply(requestTransfer(career, p.id))}>{p.wantsMove ? tr("Отозвать", "Withdraw") : tr("Запросить трансфер", "Request transfer")}</button>
                  )}
                  {bid && <button className="chip-on shrink-0" onClick={() => onApply(acceptBid(career, p.id))}>{tr("В", "To")} {teamById(bid.from).name} · {formatRub(bid.fee)}</button>}
                </span>
              </li>
            );
          })}
        </ul>
        {done && bids.length === 0 && <p className="mt-2 text-sm text-fg/60">{tr("Запросов не было — предложений нет.", "There were no requests, so there are no offers.")}</p>}
      </div>
      {!asPlayer && (
        <div>
          <h3 className="font-display text-sm tracking-widest uppercase text-fg/60">{tr("Купить сейчас", "Buy now")}</h3>
          <ul className="mt-2 grid gap-2">
            {others.map((p) => (
              <li key={p.id} className="card flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate font-display uppercase">{p.name}</span>
                  <span className="text-xs text-fg/60">{teamById(p.teamId).name} · {p.pos} · OVR {p.ovr} · {formatRub(playerValue(p))}</span>
                </span>
                <button className="chip-on shrink-0" onClick={() => onApply(buyPlayer(career, p.id))}>{tr("Купить", "Buy")}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!asPlayer && (
        <div>
          <h3 className="font-display text-sm tracking-widest uppercase text-fg/60">{tr("Продать сейчас", "Sell now")}</h3>
          <ul className="mt-2 grid gap-2">
            {peopleOf(career, career.teamId).map((p) => (
              <li key={p.id} className="card flex items-center justify-between gap-2">
                <span className="min-w-0"><PlayerLine p={p} /></span>
                {!p.created && <button className="chip shrink-0" onClick={() => onApply(sellPlayer(career, p.id))}>{tr("Продать", "Sell")}</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function TrainTab({ career, onApply, asPlayer = false }: { career: CareerState; onApply: (r: CareerState | string) => void; asPlayer?: boolean }) {
  const list = peopleOf(career, career.teamId).filter((p) => (asPlayer ? p.created : true));
  return (
    <section className="mt-4">
      <p className="text-sm text-fg/70">{tr("Осталось занятий до матча", "Sessions left before the match")}: {career.trainsLeft}. {tr("Мастерство поднимает рейтинг, но на пустой свежести игрок сдаёт.", "Sharpness raises the rating, but a player with no freshness fades.")}</p>
      <ul className="mt-3 grid gap-2">
        {list.map((p) => (
          <li key={p.id} className="card">
            <PlayerLine p={p} />
            <FormBar value={p.form} />
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="chip" onClick={() => onApply(train(career, p.id, "form"))}>{tr("Форма", "Form")}</button>
              <button className="chip" onClick={() => onApply(train(career, p.id, "fitness"))}>{tr("Свежесть", "Freshness")}</button>
              <button className="chip" onClick={() => onApply(train(career, p.id, "sharp"))}>{tr("Мастерство", "Sharpness")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CalendarTab({
  career,
  onApply,
  onPlay,
}: {
  career: CareerState;
  onApply: (r: CareerState | string) => void;
  onPlay: () => void;
}) {
  const rounds = new Map<number, { f: (typeof career.fixtures)[number]; i: number }[]>();
  career.fixtures.forEach((f, i) => {
    const list = rounds.get(f.round) ?? [];
    list.push({ f, i });
    rounds.set(f.round, list);
  });
  return (
    <section className="mt-4 grid gap-3">
      {[...rounds.entries()].map(([round, matches]) => (
        <article key={round} className="card">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display uppercase">{tr("Тур", "Matchday")} {round + 1}</h3>
          </div>
          <ul className="mt-2 grid gap-2">
            {matches.map(({ f, i }) => {
              const open = firstOpenIndex(career);
              const user = f.home === career.teamId || f.away === career.teamId;
              return (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>{teamById(f.home).name} — {teamById(f.away).name}</span>
                  {f.hg !== null ? (
                    <span className="tabular-nums">{f.hg}:{f.ag}</span>
                  ) : i !== open ? (
                    <span className="text-xs text-fg/40">{tr("по очереди", "in order")}</span>
                  ) : user ? (
                    <span className="flex flex-wrap gap-2">
                      <button className="chip-on" onClick={onPlay}>{tr("Играть", "Play")}</button>
                      <button className="chip" onClick={() => onApply(simulateIndex(career, i))}>{tr("Симулировать", "Simulate")}</button>
                      <button className="chip" onClick={() => onApply(forfeitMatch(career, i))}>{tr("0:3", "0-3")}</button>
                    </span>
                  ) : (
                    <button className="chip" onClick={() => onApply(simulateIndex(career, i))}>{tr("Симулировать", "Simulate")}</button>
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

function TournamentTab({ career }: { career: CareerState }) {
  const table = tableOf(career.fixtures);
  const champ = championOf(career);
  const place = table.findIndex((r) => r.id === career.teamId) + 1;
  const row = table.find((r) => r.id === career.teamId);
  const scorers = peopleOf(career, career.teamId).filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals);
  const rec = careerRecord(career);
  return (
    <section className="mt-4">
      {champ ? (
        <div className="card">
          <p className="font-display text-xs tracking-widest text-gold uppercase">{tr("Кубок лиги", "League trophy")}</p>
          <p className="font-display mt-1 text-2xl uppercase">{teamById(champ.id).name}</p>
          <p className="text-sm text-fg/70">{champ.pts} {tr("очков. Чемпион назван, потому что все команды сыграли друг с другом.", "points. The champion is named because every team has played every other team.")}{champ.id === career.teamId ? tr(" Кубок ваш.", " The trophy is yours.") : ""}</p>
        </div>
      ) : (
        <p className="text-sm text-fg/70">{tr("Победителя ещё нет. Кубок вручат только в конце сезона, когда каждая команда сыграет с каждой.", "There is no winner yet. The trophy is given only at the end of the season, when every team has played every other team.")}</p>
      )}
      {row && (
        <p className="mt-3 text-sm text-fg/80">
          {tr("Сезон", "Season")} {career.season || 1}. {teamById(career.teamId).name}: {tr("место", "place")} {place}, {tr("игры", "played")} {row.p}, {tr("победы", "wins")} {row.w}, {tr("ничьи", "draws")} {row.d}, {tr("поражения", "losses")} {row.l}, {tr("мячи", "goals")} {row.gf}:{row.ga}, {tr("очки", "points")} {row.pts}.
        </p>
      )}
      <p className="mt-2 text-sm text-fg/70">{tr("За все закрытые сезоны: титулы", "Across closed seasons: titles")} {rec.titles}, {tr("пьедесталы", "podiums")} {rec.podiums}, {tr("победы", "wins")} {rec.wins}.</p>
      {rec.honours.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {rec.honours.map((h) => (
            <li key={`${h.season}-${h.place}-${h.pts}`} className="card text-sm">{tr("Сезон", "Season")} {h.season}: {h.place}{tr("-е место", " place")} · {h.w} {tr("побед", "wins")} · {h.pts} {tr("очков", "points")} · {tr("мячи", "goals")} {h.gf}:{h.ga}</li>
          ))}
        </ul>
      )}
      {scorers.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {scorers.map((p) => (
            <li key={p.id} className="card text-sm">{p.name} · {p.goals} {tr("гол.", "goals")} · {tr("рейтинг", "rating")} {p.ovr}</li>
          ))}
        </ul>
      )}
      <LeagueTable table={table} mine={career.teamId} />
    </section>
  );
}

function PressTab({ career }: { career: CareerState }) {
  const items = pressFeed(career);
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

function SaveTab({ career, onSave }: { career: CareerState; onSave: () => void }) {
  const [msg, setMsg] = useState("");
  const played = career.fixtures.filter((f) => f.hg !== null).length;
  return (
    <section className="card mt-4">
      <h3 className="font-display text-xl uppercase">{tr("Сохранение", "Save")}</h3>
      <p className="mt-2 text-sm text-fg/75">{tr("Прогресс этой карьеры пишется на устройство: календарь, деньги, состав, трансферы, пресса и архив сезонов. Новый сезон не стирает переходы. «Сбросить карьеру» стирает всё.", "This career is saved on the device: calendar, money, squad, transfers, press and the season archive. A new season does not wipe moves. Reset career wipes everything.")}</p>
      <p className="mt-2 text-sm text-fg/80">{tr("Сезон", "Season")} {career.season || 1} · {teamById(career.teamId).name} · {tr("бюджет", "budget")} {formatRub(career.budget)} · {tr("сыграно", "played")} {played} {tr("из", "of")} {career.fixtures.length}. {isSeasonOver(career) ? tr("Сезон закрыт — новый можно открыть на обзоре.", "The season is closed — a new one can be opened from Overview.") : tr("Сезон ещё идёт.", "The season is still going.")}</p>
      <button className="btn-main mt-4" onClick={() => { onSave(); setMsg(tr("Записано.", "Saved.")); }}>{tr("Записать прогресс", "Save progress")}</button>
      {msg && <p className="mt-2 text-sm text-mint">{msg}</p>}
    </section>
  );
}

export function ClubBrowser({ teams, onBack, onOpen }: { teams: TeamDef[]; onBack: () => void; onOpen: (id: string) => void }) {
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-5xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>{tr("Назад", "Back")}</button>
      <h2 className="font-display mt-3 text-3xl uppercase">{tr("Клубы лиги", "League clubs")}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {teams.map((t) => (
            <button key={t.id} className="card flex items-center gap-3 text-left" onClick={() => onOpen(t.id)}>
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

export function ClubPage({ id, onBack, onCareer }: { id: string; onBack: () => void; onCareer?: () => void }) {
  const t = teamById(id);
  const info = clubInfo(id);
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-5xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>{tr("Назад", "Back")}</button>
      <div className="mt-4 flex items-center gap-3">
        <Crest id={t.id} className="h-16 w-16" />
        <div>
          <h2 className="font-display text-3xl uppercase">{t.name}</h2>
          <p className="text-sm text-fg/70">{t.city} · {tr("основан", "founded")} {info.founded}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <p className="card text-sm">{tr("Стадион", "Stadium")}: {t.stadium}<br />{tr("Вместимость", "Capacity")}: {info.capacity.toLocaleString(tr("ru-RU", "en-US"))}</p>
        <p className="card text-sm">{tr("Тренер", "Coach")}: {coachLabel(info.coach)} · {tr("рейтинг", "rating")} {coachRating(id)}<br />{tr("Стиль", "Style")}: {styleLabel(info.style)}<br />{tr("Средний рейтинг игроков", "Average player rating")}: {clubRating(id)}</p>
      </div>
      {onCareer && (
        <button className="btn-main mt-4" onClick={onCareer}>{tr("Карьера за этот клуб", "Career at this club")}</button>
      )}
      <h3 className="font-display mt-5 text-sm tracking-widest uppercase text-fg/60">{tr("Заявка", "Squad list")}</h3>
      <ul className="mt-2 grid gap-2">
        {t.roster.map((p) => {
          const attrs = playerAttrs(p);
          return (
          <li key={`${p.num}-${p.name}`} className="card text-sm">
            <span className="font-display uppercase">{p.num} {p.name}</span>
            <span className="mt-1 block text-xs text-fg/60">{p.pos} · {p.age ?? "—"} {tr("лет", "yrs")} · OVR {p.ovr} · {tr("скорость", "pace")} {attrs.speed} · {tr("точность", "accuracy")} {attrs.accuracy} · {tr("жёсткость", "strength")} {attrs.hardness}</span>
          </li>
          );
        })}
      </ul>
    </main>
  );
}

export function CreatePlayer({
  teamId,
  onBack,
  onDone,
}: {
  teamId: string;
  onBack: () => void;
  onDone: (draft: { name: string; pos: Role; num: number }) => void;
}) {
  const [name, setName] = useState(tr("А. Волгин", "A. Volgin"));
  const [pos, setPos] = useState<Role>("CAM");
  const [num, setNum] = useState(10);
  const t = teamById(teamId);
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>{tr("Назад", "Back")}</button>
      <h2 className="font-display mt-3 text-3xl uppercase">{tr("Ваш игрок", "Your player")}</h2>
      <p className="mt-2 text-sm text-fg/70">{tr("Он попадёт в", "He joins")} {t.name}. {tr("Форма начинается высокой и меняется от тренировок и матчей. Вратаря выбрать нельзя.", "Form starts high and changes with training and matches. A goalkeeper cannot be chosen.")}</p>
      <label className="mt-4 block text-sm text-fg/70">
        {tr("Имя", "Name")}
        <input className="mt-1 w-full rounded-2xl border border-fg/15 bg-card px-3 py-3 text-fg" value={name} maxLength={22} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {CREATE_ROLES.map((r) => (
          <button key={r} className={pos === r ? "chip-on" : "chip"} onClick={() => setPos(r)}>{r}</button>
        ))}
      </div>
      <label className="mt-3 block text-sm text-fg/70">
        {tr("Номер", "Number")}
        <input className="mt-1 w-24 rounded-2xl border border-fg/15 bg-card px-3 py-3 text-fg" type="number" min={1} max={99} value={num} onChange={(e) => setNum(Number(e.target.value) || 1)} />
      </label>
      <button
        className="btn-main mt-5"
        onClick={() => {
          const clean = name.trim();
          if (clean.length < 2 || pos === "GK") return;
          onDone({ name: clean, pos, num: Math.max(1, Math.min(99, num)) });
        }}
      >
        {tr("Подписать контракт", "Sign the contract")}
      </button>
    </main>
  );
}

export function PlayerDesk(props: {
  career: CareerState;
  onChange: (c: CareerState) => void;
  onPlay: () => void;
  onMenu: () => void;
  onReset: () => void;
}) {
  return <CareerDesk {...props} asPlayer />;
}
