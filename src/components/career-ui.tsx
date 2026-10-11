import { useState } from "react";
import { Crest } from "@/components/crests";
import {
  acceptBid,
  beginNextSeason,
  careerLevel,
  careerRecord,
  championOf,
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
import { clubInfo, clubRating, clubShape, coachRating, FORMATION_IDS, playerAttrs, tableOf, teamById, TEAMS, type Role } from "@/game/data";

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
        <button className="text-sm text-mint" onClick={onMenu}>Меню</button>
        <button className="text-sm text-fg/50" onClick={onReset}>Сбросить карьеру</button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Crest id={me.id} className="h-14 w-14" />
        <div>
          <p className="font-display text-xs tracking-widest text-mint uppercase">{asPlayer ? "Карьера игрока" : "Карьера тренера"}</p>
          <h2 className="font-display text-3xl uppercase">{me.name}</h2>
          <p className="text-sm text-fg/70">Сезон {career.season || 1} · {me.city} · бюджет {formatRub(career.budget)} · зарплаты {formatRub(peopleOf(career, career.teamId).reduce((s, p) => s + wageOf(p), 0))} / тур</p>
        </div>
      </div>
      {created && (
        <div className="card mt-4">
          <p className="font-display text-xs tracking-widest text-mint uppercase">Ваш игрок</p>
          <p className="font-display text-xl uppercase">{created.name} · {created.pos} · #{created.num}</p>
          <p className="text-sm text-fg/70">Форма {formLabel(created.form)} ({created.form}) · свежесть {created.fitness} · OVR {created.ovr} · голы {created.goals}</p>
          <FormBar value={created.form} />
        </div>
      )}
      {!created && onCreate && (
        <button className="btn-main mt-4 w-full" onClick={onCreate}>Создать своего игрока</button>
      )}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {([
          ["home", "Обзор"],
          ["cup", "Турнир"],
          ["squad", "Состав"],
          ["market", "Трансферы"],
          ["train", "Тренировка"],
          ["calendar", "Календарь"],
          ["press", "Пресса"],
          ["save", "Сохранение"],
        ] as const).map(([id, label]) => (
          <button key={id} className={tab === id ? "chip-on shrink-0" : "chip shrink-0"} onClick={() => { setTab(id); setNote(""); }}>{label}</button>
        ))}
      </div>
      {note && <p className="mt-3 text-sm text-mint">{note}</p>}
      {tab === "home" && (
        <section className="mt-4">
          <p className="text-sm text-fg/70">{asPlayer ? "На поле бегаете только вы. Партнёры держат схему." : `${info.coach} · рейтинг тренера ${coachRating(career.teamId)} · ${info.style}`} · {me.stadium} · средний рейтинг {squadOvr(career, career.teamId)}</p>
          <NextActions career={career} onPlay={onPlay} onApply={apply} asPlayer={asPlayer} />
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
  asPlayer = false,
}: {
  career: CareerState;
  onPlay: () => void;
  onApply: (r: CareerState | string) => void;
  asPlayer?: boolean;
}) {
  const open = firstOpenIndex(career);
  if (open < 0) {
    const champ = championOf(career);
    const rec = careerRecord(career);
    return (
      <div className="mt-4">
        <p className="font-display text-2xl uppercase text-mint">Сезон {career.season || 1} завершён</p>
        <p className="mt-1 text-sm text-fg/70">Все команды сыграли друг с другом. Кубок вручается только сейчас. Новый сезон сохранит состав, деньги, уже совершённые трансферы и статистику побед. Непринятые предложения лучше закрыть на вкладке «Трансферы» — после кнопки окно закроется.</p>
        {champ && <p className="mt-2 text-sm">Чемпион: {teamById(champ.id).name} · {champ.pts} очков{champ.id === career.teamId ? " · кубок ваш" : ""}</p>}
        <p className="mt-2 text-sm text-fg/75">В архиве уже титулы {rec.titles}, пьедесталы {rec.podiums}, победы {rec.wins}. Этот сезон допишется туда при старте следующего.</p>
        <button className="btn-main mt-3" onClick={() => onApply(beginNextSeason(career))}>Новый сезон</button>
      </div>
    );
  }
  const fixture = career.fixtures[open]!;
  const user = fixture.home === career.teamId || fixture.away === career.teamId;
  const foeId = fixture.home === career.teamId ? fixture.away : fixture.home;
  const level = user ? careerLevel(career, foeId, asPlayer) : null;
  const label: Record<string, string> = {
    novice: "Новичок",
    amateur: "Любитель",
    pro: "Профессионал",
    world: "Мировой класс",
    legend: "Легенда Волги",
  };
  return (
    <div className="mt-4">
      <p className="text-sm text-fg/70">
        Следующий по календарю: {teamById(fixture.home).name} — {teamById(fixture.away).name}
        {level ? ` · ${asPlayer ? "рейтинг игрока" : "рейтинг тренера и команды"} ${level.mine} против ${level.theirs} · сложность ${label[level.diff]}` : ""}
      </p>
      {user && (
        <p className="mt-1 text-sm text-fg/80">
          Сводка: вы {career.formation}. {teamById(foeId).name} выходят {clubShape(foeId, open)}.
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {user ? (
          <>
            <button className="btn-main" onClick={onPlay}>Играть</button>
            <button className="btn-ghost" onClick={() => onApply(simulateIndex(career, open))}>Симулировать</button>
            <button className="btn-ghost" onClick={() => onApply(forfeitMatch(career, open))}>Техническое 0:3</button>
          </>
        ) : (
          <button className="btn-ghost" onClick={() => onApply(simulateIndex(career, open))}>Симулировать этот матч</button>
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
          <th className="w-[38%] py-2">Клуб</th>
          <th className="text-center">И</th>
          <th className="text-center">В</th>
          <th className="text-center">Н</th>
          <th className="text-center">П</th>
          <th className="text-center">М</th>
          <th className="text-center">О</th>
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
      <p className="text-sm text-fg/70">Нажмите позицию в основе, затем игрока из заявки. Форма влияет на силу в матче.</p>
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
                <span className="ml-2 font-display uppercase">{p ? `${p.num} ${p.name}` : "пусто"}</span>
                {p?.created && <span className="ml-2 text-xs text-mint">вы</span>}
                {p && <span className="mt-1 block text-xs text-fg/60">OVR {p.ovr} · форма {formLabel(p.form)} · свежесть {p.fitness}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <h3 className="font-display mt-5 text-sm tracking-widest uppercase text-fg/60">Заявка</h3>
      <ul className="mt-2 grid gap-2">
        {peopleOf(career, career.teamId).map((p) => (
          <li key={p.id}>
            <button
              className="card w-full text-left"
              onClick={() => {
                if (slot === null) {
                  onApply("Сначала выберите позицию в основе");
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
      {p.created && <span className="ml-2 text-xs text-mint">вы</span>}
      <span className="mt-1 block text-xs text-fg/60">{p.pos} · {p.age} лет · OVR {p.ovr} · скр {playerAttrs(p).speed} · точ {playerAttrs(p).accuracy} · жёст {playerAttrs(p).hardness} · форма {p.form} · {formatRub(playerValue(p))} · з/п {formatRub(wageOf(p))}{p.wantsMove ? " · просит трансфер" : ""}</span>
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
      <p className="text-sm text-fg/70">Запросить трансфер можно в любой момент. Уйти в другой клуб — только в конце сезона, когда все сыграли со всеми.</p>
      <div>
        <h3 className="font-display text-sm tracking-widest uppercase text-fg/60">{asPlayer ? "Ваш запрос" : "Запросы игроков"}</h3>
        <ul className="mt-2 grid gap-2">
          {mine.map((p) => {
            const bid = bids.find((b) => b.personId === p.id);
            return (
              <li key={p.id} className="card flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0"><PlayerLine p={p} /></span>
                <span className="flex flex-wrap gap-2">
                  {!done && (
                    <button className="chip shrink-0" onClick={() => onApply(requestTransfer(career, p.id))}>{p.wantsMove ? "Отозвать" : "Запросить трансфер"}</button>
                  )}
                  {bid && <button className="chip-on shrink-0" onClick={() => onApply(acceptBid(career, p.id))}>В {teamById(bid.from).name} · {formatRub(bid.fee)}</button>}
                </span>
              </li>
            );
          })}
        </ul>
        {done && bids.length === 0 && <p className="mt-2 text-sm text-fg/60">Запросов не было — предложений нет.</p>}
      </div>
      {!asPlayer && (
        <div>
          <h3 className="font-display text-sm tracking-widest uppercase text-fg/60">Купить сейчас</h3>
          <ul className="mt-2 grid gap-2">
            {others.map((p) => (
              <li key={p.id} className="card flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate font-display uppercase">{p.name}</span>
                  <span className="text-xs text-fg/60">{teamById(p.teamId).name} · {p.pos} · OVR {p.ovr} · {formatRub(playerValue(p))}</span>
                </span>
                <button className="chip-on shrink-0" onClick={() => onApply(buyPlayer(career, p.id))}>Купить</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!asPlayer && (
        <div>
          <h3 className="font-display text-sm tracking-widest uppercase text-fg/60">Продать сейчас</h3>
          <ul className="mt-2 grid gap-2">
            {peopleOf(career, career.teamId).map((p) => (
              <li key={p.id} className="card flex items-center justify-between gap-2">
                <span className="min-w-0"><PlayerLine p={p} /></span>
                {!p.created && <button className="chip shrink-0" onClick={() => onApply(sellPlayer(career, p.id))}>Продать</button>}
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
      <p className="text-sm text-fg/70">Осталось занятий до матча: {career.trainsLeft}. Мастерство поднимает рейтинг, но на пустой свежести игрок сдаёт.</p>
      <ul className="mt-3 grid gap-2">
        {list.map((p) => (
          <li key={p.id} className="card">
            <PlayerLine p={p} />
            <FormBar value={p.form} />
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="chip" onClick={() => onApply(train(career, p.id, "form"))}>Форма</button>
              <button className="chip" onClick={() => onApply(train(career, p.id, "fitness"))}>Свежесть</button>
              <button className="chip" onClick={() => onApply(train(career, p.id, "sharp"))}>Мастерство</button>
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
            <h3 className="font-display uppercase">Тур {round + 1}</h3>
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
                    <span className="text-xs text-fg/40">по очереди</span>
                  ) : user ? (
                    <span className="flex flex-wrap gap-2">
                      <button className="chip-on" onClick={onPlay}>Играть</button>
                      <button className="chip" onClick={() => onApply(simulateIndex(career, i))}>Симулировать</button>
                      <button className="chip" onClick={() => onApply(forfeitMatch(career, i))}>0:3</button>
                    </span>
                  ) : (
                    <button className="chip" onClick={() => onApply(simulateIndex(career, i))}>Симулировать</button>
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
          <p className="font-display text-xs tracking-widest text-gold uppercase">Кубок лиги</p>
          <p className="font-display mt-1 text-2xl uppercase">{teamById(champ.id).name}</p>
          <p className="text-sm text-fg/70">{champ.pts} очков. Чемпион назван, потому что все команды сыграли друг с другом.{champ.id === career.teamId ? " Кубок ваш." : ""}</p>
        </div>
      ) : (
        <p className="text-sm text-fg/70">Победителя ещё нет. Кубок вручат только в конце сезона, когда каждая команда сыграет с каждой.</p>
      )}
      {row && (
        <p className="mt-3 text-sm text-fg/80">
          Сезон {career.season || 1}. {teamById(career.teamId).name}: место {place}, игры {row.p}, победы {row.w}, ничьи {row.d}, поражения {row.l}, мячи {row.gf}:{row.ga}, очки {row.pts}.
        </p>
      )}
      <p className="mt-2 text-sm text-fg/70">За все закрытые сезоны: титулы {rec.titles}, пьедесталы {rec.podiums}, победы {rec.wins}.</p>
      {rec.honours.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {rec.honours.map((h) => (
            <li key={`${h.season}-${h.place}-${h.pts}`} className="card text-sm">Сезон {h.season}: {h.place}-е место · {h.w} побед · {h.pts} очков · мячи {h.gf}:{h.ga}</li>
          ))}
        </ul>
      )}
      {scorers.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {scorers.map((p) => (
            <li key={p.id} className="card text-sm">{p.name} · {p.goals} гол. · рейтинг {p.ovr}</li>
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
      <h3 className="font-display text-xl uppercase">Сохранение</h3>
      <p className="mt-2 text-sm text-fg/75">Прогресс этой карьеры пишется на устройство: календарь, деньги, состав, трансферы, пресса и архив сезонов. Новый сезон не стирает переходы. «Сбросить карьеру» стирает всё.</p>
      <p className="mt-2 text-sm text-fg/80">Сезон {career.season || 1} · {teamById(career.teamId).name} · бюджет {formatRub(career.budget)} · сыграно {played} из {career.fixtures.length}. {isSeasonOver(career) ? "Сезон закрыт — новый можно открыть на обзоре." : "Сезон ещё идёт."}</p>
      <button className="btn-main mt-4" onClick={() => { onSave(); setMsg("Записано."); }}>Записать прогресс</button>
      {msg && <p className="mt-2 text-sm text-mint">{msg}</p>}
    </section>
  );
}

export function ClubBrowser({ onBack, onOpen }: { onBack: () => void; onOpen: (id: string) => void }) {
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-5xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>Назад</button>
      <h2 className="font-display mt-3 text-3xl uppercase">Клубы лиги</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {TEAMS.map((t) => (
            <button key={t.id} className="card flex items-center gap-3 text-left" onClick={() => onOpen(t.id)}>
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

export function ClubPage({ id, onBack, onCareer }: { id: string; onBack: () => void; onCareer?: () => void }) {
  const t = teamById(id);
  const info = clubInfo(id);
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-5xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>Назад</button>
      <div className="mt-4 flex items-center gap-3">
        <Crest id={t.id} className="h-16 w-16" />
        <div>
          <h2 className="font-display text-3xl uppercase">{t.name}</h2>
          <p className="text-sm text-fg/70">{t.city} · основан {info.founded}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <p className="card text-sm">Стадион: {t.stadium}<br />Вместимость: {info.capacity.toLocaleString("ru-RU")}</p>
        <p className="card text-sm">Тренер: {info.coach} · рейтинг {coachRating(id)}<br />Стиль: {info.style}<br />Средний рейтинг игроков: {clubRating(id)}</p>
      </div>
      {onCareer && (
        <button className="btn-main mt-4" onClick={onCareer}>Карьера за этот клуб</button>
      )}
      <h3 className="font-display mt-5 text-sm tracking-widest uppercase text-fg/60">Заявка</h3>
      <ul className="mt-2 grid gap-2">
        {t.roster.map((p) => {
          const attrs = playerAttrs(p);
          return (
          <li key={`${p.num}-${p.name}`} className="card text-sm">
            <span className="font-display uppercase">{p.num} {p.name}</span>
            <span className="mt-1 block text-xs text-fg/60">{p.pos} · {p.age ?? "—"} лет · OVR {p.ovr} · скорость {attrs.speed} · точность {attrs.accuracy} · жёсткость {attrs.hardness}</span>
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
  const [name, setName] = useState("А. Волгин");
  const [pos, setPos] = useState<Role>("CAM");
  const [num, setNum] = useState(10);
  const t = teamById(teamId);
  return (
    <main className="safe-top safe-bot mx-auto min-h-dvh w-full max-w-xl px-4 py-6">
      <button className="text-sm text-mint" onClick={onBack}>Назад</button>
      <h2 className="font-display mt-3 text-3xl uppercase">Ваш игрок</h2>
      <p className="mt-2 text-sm text-fg/70">Он попадёт в {t.name}. Форма начинается высокой и меняется от тренировок и матчей.</p>
      <label className="mt-4 block text-sm text-fg/70">
        Имя
        <input className="mt-1 w-full rounded-2xl border border-fg/15 bg-card px-3 py-3 text-fg" value={name} maxLength={22} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {CREATE_ROLES.map((r) => (
          <button key={r} className={pos === r ? "chip-on" : "chip"} onClick={() => setPos(r)}>{r}</button>
        ))}
      </div>
      <label className="mt-3 block text-sm text-fg/70">
        Номер
        <input className="mt-1 w-24 rounded-2xl border border-fg/15 bg-card px-3 py-3 text-fg" type="number" min={1} max={99} value={num} onChange={(e) => setNum(Number(e.target.value) || 1)} />
      </label>
      <button
        className="btn-main mt-5"
        onClick={() => {
          const clean = name.trim();
          if (clean.length < 2) return;
          onDone({ name: clean, pos, num: Math.max(1, Math.min(99, num)) });
        }}
      >
        Подписать контракт
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
