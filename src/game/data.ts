import { getLang } from "./i18n";

export const HALF_W = 34;
export const HALF_L = 52.5;
export const GOAL_HW = 3.66;

export type LeagueId = "chuvash" | "volga" | "siberia";

export type Role =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "CDM"
  | "CM"
  | "LM"
  | "RM"
  | "CAM"
  | "LW"
  | "RW"
  | "ST";

export type PlayerDef = {
  name: string;
  pos: Role;
  ovr: number;
  speed: number;
  stamina: number;
  num: number;
  age?: number;
  form?: number;
  fitness?: number;
  id?: string;
  accuracy?: number;
  hardness?: number;
};

export type TeamDef = {
  id: string;
  code: string;
  name: string;
  city: string;
  stadium: string;
  home: string;
  away: string;
  league: LeagueId;
  roster: PlayerDef[];
};

export type Slot = { x: number; y: number; role: Role };

export const FORMATIONS: Record<string, Slot[]> = {
  "4-3-3": [
    {
      "x": 0,
      "y": -0.92,
      "role": "GK"
    },
    {
      "x": -0.78,
      "y": -0.5,
      "role": "LB"
    },
    {
      "x": -0.28,
      "y": -0.58,
      "role": "CB"
    },
    {
      "x": 0.28,
      "y": -0.58,
      "role": "CB"
    },
    {
      "x": 0.78,
      "y": -0.5,
      "role": "RB"
    },
    {
      "x": -0.42,
      "y": -0.08,
      "role": "CM"
    },
    {
      "x": 0.42,
      "y": -0.08,
      "role": "CM"
    },
    {
      "x": 0,
      "y": 0.12,
      "role": "CAM"
    },
    {
      "x": -0.7,
      "y": 0.4,
      "role": "LW"
    },
    {
      "x": 0,
      "y": 0.48,
      "role": "ST"
    },
    {
      "x": 0.7,
      "y": 0.4,
      "role": "RW"
    }
  ],
  "4-4-2": [
    {
      "x": 0,
      "y": -0.92,
      "role": "GK"
    },
    {
      "x": -0.78,
      "y": -0.5,
      "role": "LB"
    },
    {
      "x": -0.28,
      "y": -0.58,
      "role": "CB"
    },
    {
      "x": 0.28,
      "y": -0.58,
      "role": "CB"
    },
    {
      "x": 0.78,
      "y": -0.5,
      "role": "RB"
    },
    {
      "x": -0.7,
      "y": 0.02,
      "role": "LM"
    },
    {
      "x": -0.24,
      "y": -0.08,
      "role": "CM"
    },
    {
      "x": 0.24,
      "y": -0.08,
      "role": "CM"
    },
    {
      "x": 0.7,
      "y": 0.02,
      "role": "RM"
    },
    {
      "x": -0.18,
      "y": 0.46,
      "role": "ST"
    },
    {
      "x": 0.18,
      "y": 0.46,
      "role": "ST"
    }
  ],
  "3-5-2": [
    {
      "x": 0,
      "y": -0.92,
      "role": "GK"
    },
    {
      "x": -0.42,
      "y": -0.56,
      "role": "CB"
    },
    {
      "x": 0,
      "y": -0.6,
      "role": "CB"
    },
    {
      "x": 0.42,
      "y": -0.56,
      "role": "CB"
    },
    {
      "x": -0.82,
      "y": -0.05,
      "role": "LM"
    },
    {
      "x": -0.4,
      "y": -0.12,
      "role": "CM"
    },
    {
      "x": 0,
      "y": 0.02,
      "role": "CAM"
    },
    {
      "x": 0.4,
      "y": -0.12,
      "role": "CM"
    },
    {
      "x": 0.82,
      "y": -0.05,
      "role": "RM"
    },
    {
      "x": -0.18,
      "y": 0.46,
      "role": "ST"
    },
    {
      "x": 0.18,
      "y": 0.46,
      "role": "ST"
    }
  ],
  "4-2-3-1": [
    {
      "x": 0,
      "y": -0.92,
      "role": "GK"
    },
    {
      "x": -0.78,
      "y": -0.5,
      "role": "LB"
    },
    {
      "x": -0.28,
      "y": -0.58,
      "role": "CB"
    },
    {
      "x": 0.28,
      "y": -0.58,
      "role": "CB"
    },
    {
      "x": 0.78,
      "y": -0.5,
      "role": "RB"
    },
    {
      "x": -0.28,
      "y": -0.18,
      "role": "CDM"
    },
    {
      "x": 0.28,
      "y": -0.18,
      "role": "CDM"
    },
    {
      "x": -0.62,
      "y": 0.18,
      "role": "LW"
    },
    {
      "x": 0,
      "y": 0.16,
      "role": "CAM"
    },
    {
      "x": 0.62,
      "y": 0.18,
      "role": "RW"
    },
    {
      "x": 0,
      "y": 0.48,
      "role": "ST"
    }
  ]
};

export const FORMATION_IDS = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1"] as const;

export const TEAMS: TeamDef[] = [
  {
    "id": "KHM",
    "code": "KHM",
    "name": "Химик-Август",
    "city": "Вурнары",
    "stadium": "Стадион Химик",
    "home": "#981C1E",
    "away": "#F4F0EA",
    "league": "chuvash",
    "roster": [
      {
        "name": "И. Иванов",
        "pos": "GK",
        "ovr": 68,
        "speed": 62,
        "stamina": 88,
        "num": 1,
        "age": 27
      },
      {
        "name": "П. Андреев",
        "pos": "LB",
        "ovr": 63,
        "speed": 76,
        "stamina": 88,
        "num": 2,
        "age": 28
      },
      {
        "name": "А. Николаев",
        "pos": "CB",
        "ovr": 65,
        "speed": 68,
        "stamina": 85,
        "num": 3,
        "age": 32
      },
      {
        "name": "Р. Егоров",
        "pos": "CB",
        "ovr": 64,
        "speed": 76,
        "stamina": 79,
        "num": 4,
        "age": 27
      },
      {
        "name": "К. Орлов",
        "pos": "RB",
        "ovr": 66,
        "speed": 77,
        "stamina": 85,
        "num": 5,
        "age": 26
      },
      {
        "name": "В. Фёдоров",
        "pos": "CM",
        "ovr": 70,
        "speed": 75,
        "stamina": 92,
        "num": 6,
        "age": 32
      },
      {
        "name": "Д. Кузьмин",
        "pos": "CM",
        "ovr": 67,
        "speed": 74,
        "stamina": 89,
        "num": 8,
        "age": 29
      },
      {
        "name": "Л. Степанов",
        "pos": "CAM",
        "ovr": 68,
        "speed": 69,
        "stamina": 81,
        "num": 10,
        "age": 23
      },
      {
        "name": "Н. Григорьев",
        "pos": "LW",
        "ovr": 67,
        "speed": 73,
        "stamina": 84,
        "num": 11,
        "age": 28
      },
      {
        "name": "С. Васильев",
        "pos": "ST",
        "ovr": 72,
        "speed": 84,
        "stamina": 89,
        "num": 9,
        "age": 21
      },
      {
        "name": "А. Павлов",
        "pos": "RW",
        "ovr": 65,
        "speed": 77,
        "stamina": 87,
        "num": 7,
        "age": 25
      },
      {
        "name": "Г. Ермолаев",
        "pos": "GK",
        "ovr": 66,
        "speed": 61,
        "stamina": 88,
        "num": 12,
        "age": 23
      },
      {
        "name": "А. Воробьёв",
        "pos": "CB",
        "ovr": 70,
        "speed": 71,
        "stamina": 80,
        "num": 13,
        "age": 30
      },
      {
        "name": "М. Алексеев",
        "pos": "CM",
        "ovr": 67,
        "speed": 81,
        "stamina": 80,
        "num": 14,
        "age": 32
      },
      {
        "name": "Г. Зайцев",
        "pos": "ST",
        "ovr": 65,
        "speed": 67,
        "stamina": 91,
        "num": 15,
        "age": 26
      },
      {
        "name": "П. Павлов",
        "pos": "LW",
        "ovr": 69,
        "speed": 79,
        "stamina": 79,
        "num": 16,
        "age": 29
      }
    ]
  },
  {
    "id": "SPM",
    "code": "SPM",
    "name": "Спартак",
    "city": "Чебоксары",
    "stadium": "Олимпийский",
    "home": "#CC0000",
    "away": "#1E4ED8",
    "league": "chuvash",
    "roster": [
      {
        "name": "Д. Петров",
        "pos": "GK",
        "ovr": 64,
        "speed": 60,
        "stamina": 82,
        "num": 1,
        "age": 28
      },
      {
        "name": "С. Козлов",
        "pos": "LB",
        "ovr": 65,
        "speed": 70,
        "stamina": 82,
        "num": 2,
        "age": 22
      },
      {
        "name": "А. Белов",
        "pos": "CB",
        "ovr": 66,
        "speed": 73,
        "stamina": 92,
        "num": 4,
        "age": 26
      },
      {
        "name": "И. Морозов",
        "pos": "CB",
        "ovr": 63,
        "speed": 78,
        "stamina": 90,
        "num": 5,
        "age": 19
      },
      {
        "name": "В. Новиков",
        "pos": "RB",
        "ovr": 64,
        "speed": 68,
        "stamina": 80,
        "num": 3,
        "age": 22
      },
      {
        "name": "П. Лебедев",
        "pos": "CM",
        "ovr": 67,
        "speed": 75,
        "stamina": 80,
        "num": 6,
        "age": 27
      },
      {
        "name": "К. Михайлов",
        "pos": "CM",
        "ovr": 68,
        "speed": 70,
        "stamina": 87,
        "num": 8,
        "age": 31
      },
      {
        "name": "Р. Алексеев",
        "pos": "CAM",
        "ovr": 66,
        "speed": 78,
        "stamina": 90,
        "num": 10,
        "age": 21
      },
      {
        "name": "А. Киселёв",
        "pos": "LW",
        "ovr": 65,
        "speed": 78,
        "stamina": 85,
        "num": 11,
        "age": 19
      },
      {
        "name": "М. Смирнов",
        "pos": "ST",
        "ovr": 69,
        "speed": 81,
        "stamina": 87,
        "num": 9,
        "age": 20
      },
      {
        "name": "Н. Попов",
        "pos": "RW",
        "ovr": 67,
        "speed": 77,
        "stamina": 85,
        "num": 7,
        "age": 22
      },
      {
        "name": "И. Ермолаев",
        "pos": "GK",
        "ovr": 63,
        "speed": 61,
        "stamina": 79,
        "num": 12,
        "age": 23
      },
      {
        "name": "К. Николаев",
        "pos": "CB",
        "ovr": 67,
        "speed": 73,
        "stamina": 80,
        "num": 13,
        "age": 19
      },
      {
        "name": "Н. Смирнов",
        "pos": "CM",
        "ovr": 70,
        "speed": 77,
        "stamina": 79,
        "num": 14,
        "age": 21
      },
      {
        "name": "П. Павлов",
        "pos": "ST",
        "ovr": 74,
        "speed": 70,
        "stamina": 85,
        "num": 15,
        "age": 29
      },
      {
        "name": "Н. Назаров",
        "pos": "LW",
        "ovr": 70,
        "speed": 69,
        "stamina": 82,
        "num": 16,
        "age": 25
      }
    ]
  },
  {
    "id": "SHU",
    "code": "SHU",
    "name": "ФК Шумерля",
    "city": "Шумерля",
    "stadium": "Труд",
    "home": "#1F6B45",
    "away": "#F4F1E8",
    "league": "chuvash",
    "roster": [
      {
        "name": "Р. Воробьёв",
        "pos": "GK",
        "ovr": 60,
        "speed": 58,
        "stamina": 85,
        "num": 1,
        "age": 31
      },
      {
        "name": "И. Киселёв",
        "pos": "LB",
        "ovr": 63,
        "speed": 83,
        "stamina": 83,
        "num": 2,
        "age": 31
      },
      {
        "name": "И. Ермолаев",
        "pos": "CB",
        "ovr": 64,
        "speed": 77,
        "stamina": 87,
        "num": 3,
        "age": 21
      },
      {
        "name": "В. Павлов",
        "pos": "CB",
        "ovr": 64,
        "speed": 70,
        "stamina": 90,
        "num": 4,
        "age": 27
      },
      {
        "name": "Р. Попов",
        "pos": "RB",
        "ovr": 64,
        "speed": 78,
        "stamina": 85,
        "num": 5,
        "age": 29
      },
      {
        "name": "Л. Виноградов",
        "pos": "CM",
        "ovr": 60,
        "speed": 82,
        "stamina": 92,
        "num": 6,
        "age": 27
      },
      {
        "name": "Р. Николаев",
        "pos": "CM",
        "ovr": 60,
        "speed": 70,
        "stamina": 86,
        "num": 7,
        "age": 32
      },
      {
        "name": "Д. Савельев",
        "pos": "CAM",
        "ovr": 64,
        "speed": 82,
        "stamina": 88,
        "num": 8,
        "age": 32
      },
      {
        "name": "М. Григорьев",
        "pos": "LW",
        "ovr": 61,
        "speed": 73,
        "stamina": 79,
        "num": 9,
        "age": 29
      },
      {
        "name": "П. Григорьев",
        "pos": "ST",
        "ovr": 63,
        "speed": 80,
        "stamina": 90,
        "num": 10,
        "age": 32
      },
      {
        "name": "О. Медведев",
        "pos": "RW",
        "ovr": 67,
        "speed": 84,
        "stamina": 79,
        "num": 11,
        "age": 27
      },
      {
        "name": "Е. Марков",
        "pos": "GK",
        "ovr": 62,
        "speed": 59,
        "stamina": 79,
        "num": 12,
        "age": 19
      },
      {
        "name": "О. Тихонов",
        "pos": "CB",
        "ovr": 63,
        "speed": 79,
        "stamina": 84,
        "num": 13,
        "age": 33
      },
      {
        "name": "Г. Марков",
        "pos": "CM",
        "ovr": 59,
        "speed": 75,
        "stamina": 79,
        "num": 14,
        "age": 27
      },
      {
        "name": "П. Тихонов",
        "pos": "ST",
        "ovr": 63,
        "speed": 75,
        "stamina": 92,
        "num": 15,
        "age": 19
      },
      {
        "name": "Н. Новиков",
        "pos": "LW",
        "ovr": 60,
        "speed": 77,
        "stamina": 90,
        "num": 16,
        "age": 33
      }
    ]
  },
  {
    "id": "ENR",
    "code": "ENR",
    "name": "Энергия",
    "city": "Новочебоксарск",
    "stadium": "Химик-Арена",
    "home": "#E2B93B",
    "away": "#142033",
    "league": "chuvash",
    "roster": [
      {
        "name": "Г. Егоров",
        "pos": "GK",
        "ovr": 60,
        "speed": 66,
        "stamina": 88,
        "num": 1,
        "age": 26
      },
      {
        "name": "П. Зайцев",
        "pos": "LB",
        "ovr": 66,
        "speed": 80,
        "stamina": 82,
        "num": 2,
        "age": 19
      },
      {
        "name": "Т. Тихонов",
        "pos": "CB",
        "ovr": 68,
        "speed": 66,
        "stamina": 85,
        "num": 3,
        "age": 28
      },
      {
        "name": "П. Лебедев",
        "pos": "CB",
        "ovr": 65,
        "speed": 72,
        "stamina": 93,
        "num": 4,
        "age": 20
      },
      {
        "name": "М. Марков",
        "pos": "RB",
        "ovr": 64,
        "speed": 84,
        "stamina": 85,
        "num": 5,
        "age": 28
      },
      {
        "name": "К. Орлов",
        "pos": "CM",
        "ovr": 65,
        "speed": 72,
        "stamina": 84,
        "num": 6,
        "age": 19
      },
      {
        "name": "Г. Зайцев",
        "pos": "CM",
        "ovr": 66,
        "speed": 73,
        "stamina": 79,
        "num": 7,
        "age": 28
      },
      {
        "name": "К. Богданов",
        "pos": "CAM",
        "ovr": 68,
        "speed": 83,
        "stamina": 86,
        "num": 8,
        "age": 26
      },
      {
        "name": "О. Козлов",
        "pos": "LW",
        "ovr": 70,
        "speed": 71,
        "stamina": 88,
        "num": 9,
        "age": 31
      },
      {
        "name": "М. Смирнов",
        "pos": "ST",
        "ovr": 71,
        "speed": 70,
        "stamina": 81,
        "num": 10,
        "age": 22
      },
      {
        "name": "Г. Соколов",
        "pos": "RW",
        "ovr": 64,
        "speed": 70,
        "stamina": 93,
        "num": 11,
        "age": 34
      },
      {
        "name": "И. Тихонов",
        "pos": "GK",
        "ovr": 64,
        "speed": 60,
        "stamina": 88,
        "num": 12,
        "age": 30
      },
      {
        "name": "Л. Николаев",
        "pos": "CB",
        "ovr": 68,
        "speed": 77,
        "stamina": 86,
        "num": 13,
        "age": 21
      },
      {
        "name": "Д. Виноградов",
        "pos": "CM",
        "ovr": 65,
        "speed": 67,
        "stamina": 81,
        "num": 14,
        "age": 32
      },
      {
        "name": "Д. Григорьев",
        "pos": "ST",
        "ovr": 69,
        "speed": 81,
        "stamina": 91,
        "num": 15,
        "age": 22
      },
      {
        "name": "О. Волков",
        "pos": "LW",
        "ovr": 65,
        "speed": 78,
        "stamina": 93,
        "num": 16,
        "age": 19
      }
    ]
  },
  {
    "id": "ZNM",
    "code": "ZNM",
    "name": "Знамя",
    "city": "Канаш",
    "stadium": "Энергия",
    "home": "#7A1F2B",
    "away": "#F2C94C",
    "league": "chuvash",
    "roster": [
      {
        "name": "Н. Крылов",
        "pos": "GK",
        "ovr": 63,
        "speed": 65,
        "stamina": 79,
        "num": 1,
        "age": 22
      },
      {
        "name": "П. Соколов",
        "pos": "LB",
        "ovr": 63,
        "speed": 67,
        "stamina": 87,
        "num": 2,
        "age": 25
      },
      {
        "name": "М. Петров",
        "pos": "CB",
        "ovr": 64,
        "speed": 74,
        "stamina": 83,
        "num": 3,
        "age": 20
      },
      {
        "name": "Д. Николаев",
        "pos": "CB",
        "ovr": 62,
        "speed": 81,
        "stamina": 79,
        "num": 4,
        "age": 32
      },
      {
        "name": "Н. Виноградов",
        "pos": "RB",
        "ovr": 61,
        "speed": 68,
        "stamina": 81,
        "num": 5,
        "age": 19
      },
      {
        "name": "Е. Семенов",
        "pos": "CM",
        "ovr": 62,
        "speed": 67,
        "stamina": 83,
        "num": 6,
        "age": 33
      },
      {
        "name": "Е. Кузьмин",
        "pos": "CM",
        "ovr": 65,
        "speed": 77,
        "stamina": 84,
        "num": 7,
        "age": 34
      },
      {
        "name": "Н. Семенов",
        "pos": "CAM",
        "ovr": 66,
        "speed": 75,
        "stamina": 83,
        "num": 8,
        "age": 30
      },
      {
        "name": "Д. Осипов",
        "pos": "LW",
        "ovr": 68,
        "speed": 70,
        "stamina": 83,
        "num": 9,
        "age": 25
      },
      {
        "name": "М. Марков",
        "pos": "ST",
        "ovr": 66,
        "speed": 73,
        "stamina": 79,
        "num": 10,
        "age": 20
      },
      {
        "name": "С. Виноградов",
        "pos": "RW",
        "ovr": 66,
        "speed": 73,
        "stamina": 80,
        "num": 11,
        "age": 24
      },
      {
        "name": "А. Лебедев",
        "pos": "GK",
        "ovr": 64,
        "speed": 60,
        "stamina": 91,
        "num": 12,
        "age": 29
      },
      {
        "name": "С. Смирнов",
        "pos": "CB",
        "ovr": 62,
        "speed": 78,
        "stamina": 90,
        "num": 13,
        "age": 31
      },
      {
        "name": "Д. Степанов",
        "pos": "CM",
        "ovr": 61,
        "speed": 74,
        "stamina": 84,
        "num": 14,
        "age": 31
      },
      {
        "name": "Л. Орлов",
        "pos": "ST",
        "ovr": 69,
        "speed": 82,
        "stamina": 82,
        "num": 15,
        "age": 30
      },
      {
        "name": "А. Соколов",
        "pos": "LW",
        "ovr": 68,
        "speed": 79,
        "stamina": 88,
        "num": 16,
        "age": 32
      }
    ]
  },
  {
    "id": "ALT",
    "code": "ALT",
    "name": "Алатырь",
    "city": "Алатырь",
    "stadium": "Старт",
    "home": "#2E6BFF",
    "away": "#F7F7F2",
    "league": "chuvash",
    "roster": [
      {
        "name": "Д. Иванов",
        "pos": "GK",
        "ovr": 58,
        "speed": 65,
        "stamina": 87,
        "num": 1,
        "age": 32
      },
      {
        "name": "А. Иванов",
        "pos": "LB",
        "ovr": 62,
        "speed": 71,
        "stamina": 78,
        "num": 2,
        "age": 19
      },
      {
        "name": "Т. Киселёв",
        "pos": "CB",
        "ovr": 61,
        "speed": 81,
        "stamina": 94,
        "num": 3,
        "age": 25
      },
      {
        "name": "С. Савельев",
        "pos": "CB",
        "ovr": 59,
        "speed": 69,
        "stamina": 90,
        "num": 4,
        "age": 31
      },
      {
        "name": "Д. Орлов",
        "pos": "RB",
        "ovr": 58,
        "speed": 74,
        "stamina": 82,
        "num": 5,
        "age": 26
      },
      {
        "name": "Р. Орлов",
        "pos": "CM",
        "ovr": 60,
        "speed": 70,
        "stamina": 80,
        "num": 6,
        "age": 23
      },
      {
        "name": "Р. Марков",
        "pos": "CM",
        "ovr": 63,
        "speed": 84,
        "stamina": 90,
        "num": 7,
        "age": 21
      },
      {
        "name": "Р. Воробьёв",
        "pos": "CAM",
        "ovr": 62,
        "speed": 72,
        "stamina": 86,
        "num": 8,
        "age": 31
      },
      {
        "name": "П. Зайцев",
        "pos": "LW",
        "ovr": 63,
        "speed": 70,
        "stamina": 84,
        "num": 9,
        "age": 32
      },
      {
        "name": "А. Зайцев",
        "pos": "ST",
        "ovr": 63,
        "speed": 81,
        "stamina": 93,
        "num": 10,
        "age": 32
      },
      {
        "name": "Н. Зайцев",
        "pos": "RW",
        "ovr": 68,
        "speed": 77,
        "stamina": 84,
        "num": 11,
        "age": 25
      },
      {
        "name": "Н. Савельев",
        "pos": "GK",
        "ovr": 57,
        "speed": 63,
        "stamina": 82,
        "num": 12,
        "age": 23
      },
      {
        "name": "А. Петров",
        "pos": "CB",
        "ovr": 64,
        "speed": 68,
        "stamina": 82,
        "num": 13,
        "age": 22
      },
      {
        "name": "В. Морозов",
        "pos": "CM",
        "ovr": 64,
        "speed": 82,
        "stamina": 93,
        "num": 14,
        "age": 28
      },
      {
        "name": "Р. Смирнов",
        "pos": "ST",
        "ovr": 64,
        "speed": 81,
        "stamina": 78,
        "num": 15,
        "age": 27
      },
      {
        "name": "К. Иванов",
        "pos": "LW",
        "ovr": 62,
        "speed": 82,
        "stamina": 79,
        "num": 16,
        "age": 25
      }
    ]
  },
  {
    "id": "SKL",
    "code": "SKL",
    "name": "Сокол",
    "city": "Ядрин",
    "stadium": "Юность",
    "home": "#143024",
    "away": "#8FE388",
    "league": "chuvash",
    "roster": [
      {
        "name": "Н. Петров",
        "pos": "GK",
        "ovr": 64,
        "speed": 63,
        "stamina": 80,
        "num": 1,
        "age": 31
      },
      {
        "name": "Л. Медведев",
        "pos": "LB",
        "ovr": 60,
        "speed": 69,
        "stamina": 93,
        "num": 2,
        "age": 28
      },
      {
        "name": "П. Виноградов",
        "pos": "CB",
        "ovr": 63,
        "speed": 67,
        "stamina": 80,
        "num": 3,
        "age": 20
      },
      {
        "name": "Н. Лебедев",
        "pos": "CB",
        "ovr": 68,
        "speed": 67,
        "stamina": 83,
        "num": 4,
        "age": 23
      },
      {
        "name": "Д. Кузьмин",
        "pos": "RB",
        "ovr": 62,
        "speed": 66,
        "stamina": 91,
        "num": 5,
        "age": 27
      },
      {
        "name": "П. Попов",
        "pos": "CM",
        "ovr": 62,
        "speed": 71,
        "stamina": 88,
        "num": 6,
        "age": 23
      },
      {
        "name": "Е. Морозов",
        "pos": "CM",
        "ovr": 65,
        "speed": 77,
        "stamina": 84,
        "num": 7,
        "age": 21
      },
      {
        "name": "К. Алексеев",
        "pos": "CAM",
        "ovr": 60,
        "speed": 83,
        "stamina": 80,
        "num": 8,
        "age": 33
      },
      {
        "name": "П. Ермолаев",
        "pos": "LW",
        "ovr": 66,
        "speed": 73,
        "stamina": 82,
        "num": 9,
        "age": 29
      },
      {
        "name": "Г. Белов",
        "pos": "ST",
        "ovr": 66,
        "speed": 76,
        "stamina": 83,
        "num": 10,
        "age": 30
      },
      {
        "name": "М. Белов",
        "pos": "RW",
        "ovr": 66,
        "speed": 75,
        "stamina": 88,
        "num": 11,
        "age": 27
      },
      {
        "name": "Г. Лебедев",
        "pos": "GK",
        "ovr": 62,
        "speed": 63,
        "stamina": 84,
        "num": 12,
        "age": 26
      },
      {
        "name": "С. Попов",
        "pos": "CB",
        "ovr": 63,
        "speed": 74,
        "stamina": 79,
        "num": 13,
        "age": 21
      },
      {
        "name": "А. Белов",
        "pos": "CM",
        "ovr": 62,
        "speed": 74,
        "stamina": 82,
        "num": 14,
        "age": 24
      },
      {
        "name": "С. Смирнов",
        "pos": "ST",
        "ovr": 67,
        "speed": 81,
        "stamina": 89,
        "num": 15,
        "age": 27
      },
      {
        "name": "Р. Волков",
        "pos": "LW",
        "ovr": 69,
        "speed": 75,
        "stamina": 94,
        "num": 16,
        "age": 23
      }
    ]
  },
  {
    "id": "CVL",
    "code": "CVL",
    "name": "Цивиль",
    "city": "Цивильск",
    "stadium": "Волна",
    "home": "#0E6E8C",
    "away": "#E7F2EA",
    "league": "chuvash",
    "roster": [
      {
        "name": "Г. Виноградов",
        "pos": "GK",
        "ovr": 57,
        "speed": 62,
        "stamina": 84,
        "num": 1,
        "age": 22
      },
      {
        "name": "П. Макаров",
        "pos": "LB",
        "ovr": 58,
        "speed": 71,
        "stamina": 80,
        "num": 2,
        "age": 33
      },
      {
        "name": "М. Морозов",
        "pos": "CB",
        "ovr": 62,
        "speed": 77,
        "stamina": 86,
        "num": 3,
        "age": 27
      },
      {
        "name": "А. Степанов",
        "pos": "CB",
        "ovr": 57,
        "speed": 84,
        "stamina": 79,
        "num": 4,
        "age": 23
      },
      {
        "name": "Г. Иванов",
        "pos": "RB",
        "ovr": 64,
        "speed": 78,
        "stamina": 82,
        "num": 5,
        "age": 31
      },
      {
        "name": "Е. Белов",
        "pos": "CM",
        "ovr": 63,
        "speed": 73,
        "stamina": 83,
        "num": 6,
        "age": 32
      },
      {
        "name": "П. Морозов",
        "pos": "CM",
        "ovr": 58,
        "speed": 70,
        "stamina": 81,
        "num": 7,
        "age": 31
      },
      {
        "name": "Г. Зайцев",
        "pos": "CAM",
        "ovr": 57,
        "speed": 72,
        "stamina": 89,
        "num": 8,
        "age": 32
      },
      {
        "name": "О. Морозов",
        "pos": "LW",
        "ovr": 67,
        "speed": 73,
        "stamina": 88,
        "num": 9,
        "age": 23
      },
      {
        "name": "К. Марков",
        "pos": "ST",
        "ovr": 61,
        "speed": 83,
        "stamina": 78,
        "num": 10,
        "age": 32
      },
      {
        "name": "В. Лебедев",
        "pos": "RW",
        "ovr": 66,
        "speed": 80,
        "stamina": 88,
        "num": 11,
        "age": 19
      },
      {
        "name": "И. Егоров",
        "pos": "GK",
        "ovr": 55,
        "speed": 63,
        "stamina": 81,
        "num": 12,
        "age": 29
      },
      {
        "name": "П. Назаров",
        "pos": "CB",
        "ovr": 57,
        "speed": 68,
        "stamina": 88,
        "num": 13,
        "age": 31
      },
      {
        "name": "В. Волков",
        "pos": "CM",
        "ovr": 59,
        "speed": 79,
        "stamina": 91,
        "num": 14,
        "age": 27
      },
      {
        "name": "А. Макаров",
        "pos": "ST",
        "ovr": 64,
        "speed": 75,
        "stamina": 93,
        "num": 15,
        "age": 33
      },
      {
        "name": "Г. Алексеев",
        "pos": "LW",
        "ovr": 67,
        "speed": 69,
        "stamina": 80,
        "num": 16,
        "age": 28
      }
    ]
  },
  {
    "id": "NNN",
    "code": "NNN",
    "name": "Нижний Новгород",
    "city": "Нижний Новгород",
    "stadium": "Совкомбанк Арена",
    "home": "#1F4E9A",
    "away": "#F4F7FB",
    "league": "volga",
    "roster": [
      {
        "name": "Д. Фролов",
        "pos": "GK",
        "ovr": 73,
        "speed": 63,
        "stamina": 88,
        "num": 1,
        "age": 25
      },
      {
        "name": "Е. Киселёв",
        "pos": "LB",
        "ovr": 74,
        "speed": 83,
        "stamina": 82,
        "num": 2,
        "age": 20
      },
      {
        "name": "М. Медведев",
        "pos": "CB",
        "ovr": 75,
        "speed": 73,
        "stamina": 92,
        "num": 3,
        "age": 26
      },
      {
        "name": "В. Смирнов",
        "pos": "CB",
        "ovr": 76,
        "speed": 74,
        "stamina": 78,
        "num": 4,
        "age": 22
      },
      {
        "name": "О. Павлов",
        "pos": "RB",
        "ovr": 74,
        "speed": 67,
        "stamina": 88,
        "num": 5,
        "age": 20
      },
      {
        "name": "Р. Смирнов",
        "pos": "CM",
        "ovr": 75,
        "speed": 74,
        "stamina": 92,
        "num": 6,
        "age": 26
      },
      {
        "name": "О. Савельев",
        "pos": "CM",
        "ovr": 76,
        "speed": 77,
        "stamina": 79,
        "num": 7,
        "age": 21
      },
      {
        "name": "Д. Лебедев",
        "pos": "CAM",
        "ovr": 77,
        "speed": 66,
        "stamina": 88,
        "num": 8,
        "age": 21
      },
      {
        "name": "Д. Петров",
        "pos": "LW",
        "ovr": 76,
        "speed": 83,
        "stamina": 85,
        "num": 9,
        "age": 21
      },
      {
        "name": "О. Соколов",
        "pos": "ST",
        "ovr": 78,
        "speed": 80,
        "stamina": 81,
        "num": 10,
        "age": 26
      },
      {
        "name": "Л. Николаев",
        "pos": "RW",
        "ovr": 75,
        "speed": 71,
        "stamina": 88,
        "num": 11,
        "age": 33
      },
      {
        "name": "Н. Макаров",
        "pos": "GK",
        "ovr": 74,
        "speed": 59,
        "stamina": 91,
        "num": 12,
        "age": 28
      },
      {
        "name": "Р. Козлов",
        "pos": "CB",
        "ovr": 74,
        "speed": 73,
        "stamina": 82,
        "num": 13,
        "age": 21
      },
      {
        "name": "М. Семенов",
        "pos": "CM",
        "ovr": 74,
        "speed": 68,
        "stamina": 80,
        "num": 14,
        "age": 31
      },
      {
        "name": "В. Воробьёв",
        "pos": "ST",
        "ovr": 74,
        "speed": 77,
        "stamina": 82,
        "num": 15,
        "age": 28
      },
      {
        "name": "Е. Виноградов",
        "pos": "LW",
        "ovr": 74,
        "speed": 69,
        "stamina": 92,
        "num": 16,
        "age": 32
      }
    ]
  },
  {
    "id": "KHD",
    "code": "KHD",
    "name": "Химик",
    "city": "Дзержинск",
    "stadium": "Химик",
    "home": "#0A4C9A",
    "away": "#F2F6FB",
    "league": "volga",
    "roster": [
      {
        "name": "Е. Михайлов",
        "pos": "GK",
        "ovr": 71,
        "speed": 66,
        "stamina": 94,
        "num": 1,
        "age": 33
      },
      {
        "name": "Е. Виноградов",
        "pos": "LB",
        "ovr": 72,
        "speed": 80,
        "stamina": 86,
        "num": 2,
        "age": 21
      },
      {
        "name": "П. Савельев",
        "pos": "CB",
        "ovr": 73,
        "speed": 81,
        "stamina": 91,
        "num": 3,
        "age": 30
      },
      {
        "name": "Г. Волков",
        "pos": "CB",
        "ovr": 74,
        "speed": 77,
        "stamina": 80,
        "num": 4,
        "age": 26
      },
      {
        "name": "Е. Назаров",
        "pos": "RB",
        "ovr": 72,
        "speed": 73,
        "stamina": 86,
        "num": 5,
        "age": 33
      },
      {
        "name": "О. Павлов",
        "pos": "CM",
        "ovr": 73,
        "speed": 81,
        "stamina": 83,
        "num": 6,
        "age": 30
      },
      {
        "name": "К. Смирнов",
        "pos": "CM",
        "ovr": 74,
        "speed": 75,
        "stamina": 80,
        "num": 7,
        "age": 34
      },
      {
        "name": "В. Козлов",
        "pos": "CAM",
        "ovr": 75,
        "speed": 82,
        "stamina": 80,
        "num": 8,
        "age": 26
      },
      {
        "name": "Н. Белов",
        "pos": "LW",
        "ovr": 74,
        "speed": 67,
        "stamina": 90,
        "num": 9,
        "age": 26
      },
      {
        "name": "Е. Орлов",
        "pos": "ST",
        "ovr": 76,
        "speed": 70,
        "stamina": 92,
        "num": 10,
        "age": 25
      },
      {
        "name": "Т. Осипов",
        "pos": "RW",
        "ovr": 73,
        "speed": 72,
        "stamina": 93,
        "num": 11,
        "age": 34
      },
      {
        "name": "К. Богданов",
        "pos": "GK",
        "ovr": 70,
        "speed": 62,
        "stamina": 80,
        "num": 12,
        "age": 31
      },
      {
        "name": "П. Григорьев",
        "pos": "CB",
        "ovr": 74,
        "speed": 67,
        "stamina": 83,
        "num": 13,
        "age": 32
      },
      {
        "name": "О. Михайлов",
        "pos": "CM",
        "ovr": 74,
        "speed": 77,
        "stamina": 80,
        "num": 14,
        "age": 29
      },
      {
        "name": "Р. Фёдоров",
        "pos": "ST",
        "ovr": 74,
        "speed": 77,
        "stamina": 83,
        "num": 15,
        "age": 24
      },
      {
        "name": "А. Павлов",
        "pos": "LW",
        "ovr": 74,
        "speed": 78,
        "stamina": 89,
        "num": 16,
        "age": 32
      }
    ]
  },
  {
    "id": "POB",
    "code": "POB",
    "name": "Победа",
    "city": "Нижний Новгород",
    "stadium": "Северный",
    "home": "#9E1B32",
    "away": "#F6F3EE",
    "league": "volga",
    "roster": [
      {
        "name": "К. Романов",
        "pos": "GK",
        "ovr": 68,
        "speed": 59,
        "stamina": 92,
        "num": 1,
        "age": 24
      },
      {
        "name": "И. Новиков",
        "pos": "LB",
        "ovr": 69,
        "speed": 66,
        "stamina": 90,
        "num": 2,
        "age": 21
      },
      {
        "name": "А. Васильев",
        "pos": "CB",
        "ovr": 70,
        "speed": 70,
        "stamina": 86,
        "num": 3,
        "age": 25
      },
      {
        "name": "А. Белов",
        "pos": "CB",
        "ovr": 71,
        "speed": 78,
        "stamina": 91,
        "num": 4,
        "age": 28
      },
      {
        "name": "Г. Семенов",
        "pos": "RB",
        "ovr": 69,
        "speed": 75,
        "stamina": 88,
        "num": 5,
        "age": 25
      },
      {
        "name": "Д. Фёдоров",
        "pos": "CM",
        "ovr": 70,
        "speed": 83,
        "stamina": 79,
        "num": 6,
        "age": 32
      },
      {
        "name": "П. Новиков",
        "pos": "CM",
        "ovr": 71,
        "speed": 69,
        "stamina": 90,
        "num": 7,
        "age": 28
      },
      {
        "name": "В. Павлов",
        "pos": "CAM",
        "ovr": 72,
        "speed": 67,
        "stamina": 91,
        "num": 8,
        "age": 29
      },
      {
        "name": "Л. Голубев",
        "pos": "LW",
        "ovr": 71,
        "speed": 71,
        "stamina": 81,
        "num": 9,
        "age": 24
      },
      {
        "name": "И. Орлов",
        "pos": "ST",
        "ovr": 73,
        "speed": 69,
        "stamina": 86,
        "num": 10,
        "age": 32
      },
      {
        "name": "О. Григорьев",
        "pos": "RW",
        "ovr": 70,
        "speed": 73,
        "stamina": 85,
        "num": 11,
        "age": 26
      },
      {
        "name": "Н. Петров",
        "pos": "GK",
        "ovr": 66,
        "speed": 62,
        "stamina": 89,
        "num": 12,
        "age": 26
      },
      {
        "name": "Н. Медведев",
        "pos": "CB",
        "ovr": 71,
        "speed": 75,
        "stamina": 90,
        "num": 13,
        "age": 21
      },
      {
        "name": "В. Соколов",
        "pos": "CM",
        "ovr": 67,
        "speed": 77,
        "stamina": 85,
        "num": 14,
        "age": 25
      },
      {
        "name": "С. Морозов",
        "pos": "ST",
        "ovr": 73,
        "speed": 83,
        "stamina": 89,
        "num": 15,
        "age": 32
      },
      {
        "name": "Д. Алексеев",
        "pos": "LW",
        "ovr": 74,
        "speed": 67,
        "stamina": 85,
        "num": 16,
        "age": 20
      }
    ]
  },
  {
    "id": "SHP",
    "code": "SHP",
    "name": "Шахтёр",
    "city": "Пешелань",
    "stadium": "Шахтёр",
    "home": "#F58220",
    "away": "#1A1A1A",
    "league": "volga",
    "roster": [
      {
        "name": "Т. Осипов",
        "pos": "GK",
        "ovr": 66,
        "speed": 65,
        "stamina": 82,
        "num": 1,
        "age": 26
      },
      {
        "name": "А. Крылов",
        "pos": "LB",
        "ovr": 67,
        "speed": 75,
        "stamina": 81,
        "num": 2,
        "age": 20
      },
      {
        "name": "Т. Семенов",
        "pos": "CB",
        "ovr": 68,
        "speed": 80,
        "stamina": 86,
        "num": 3,
        "age": 27
      },
      {
        "name": "Л. Белов",
        "pos": "CB",
        "ovr": 69,
        "speed": 83,
        "stamina": 84,
        "num": 4,
        "age": 28
      },
      {
        "name": "Е. Иванов",
        "pos": "RB",
        "ovr": 67,
        "speed": 78,
        "stamina": 81,
        "num": 5,
        "age": 28
      },
      {
        "name": "Е. Марков",
        "pos": "CM",
        "ovr": 68,
        "speed": 69,
        "stamina": 88,
        "num": 6,
        "age": 33
      },
      {
        "name": "Н. Степанов",
        "pos": "CM",
        "ovr": 69,
        "speed": 81,
        "stamina": 87,
        "num": 7,
        "age": 31
      },
      {
        "name": "Л. Фролов",
        "pos": "CAM",
        "ovr": 70,
        "speed": 68,
        "stamina": 80,
        "num": 8,
        "age": 25
      },
      {
        "name": "Д. Николаев",
        "pos": "LW",
        "ovr": 69,
        "speed": 77,
        "stamina": 90,
        "num": 9,
        "age": 27
      },
      {
        "name": "И. Фёдоров",
        "pos": "ST",
        "ovr": 71,
        "speed": 83,
        "stamina": 87,
        "num": 10,
        "age": 33
      },
      {
        "name": "О. Фёдоров",
        "pos": "RW",
        "ovr": 68,
        "speed": 69,
        "stamina": 79,
        "num": 11,
        "age": 31
      },
      {
        "name": "А. Павлов",
        "pos": "GK",
        "ovr": 63,
        "speed": 59,
        "stamina": 85,
        "num": 12,
        "age": 19
      },
      {
        "name": "Г. Фролов",
        "pos": "CB",
        "ovr": 72,
        "speed": 79,
        "stamina": 84,
        "num": 13,
        "age": 27
      },
      {
        "name": "П. Осипов",
        "pos": "CM",
        "ovr": 65,
        "speed": 74,
        "stamina": 83,
        "num": 14,
        "age": 27
      },
      {
        "name": "Е. Зайцев",
        "pos": "ST",
        "ovr": 73,
        "speed": 80,
        "stamina": 83,
        "num": 15,
        "age": 24
      },
      {
        "name": "Р. Назаров",
        "pos": "LW",
        "ovr": 71,
        "speed": 78,
        "stamina": 80,
        "num": 16,
        "age": 22
      }
    ]
  },
  {
    "id": "SBR",
    "code": "SBR",
    "name": "Спартак Бор",
    "city": "Бор",
    "stadium": "Спартак",
    "home": "#CC0000",
    "away": "#F4F0EA",
    "league": "volga",
    "roster": [
      {
        "name": "В. Волков",
        "pos": "GK",
        "ovr": 64,
        "speed": 67,
        "stamina": 90,
        "num": 1,
        "age": 28
      },
      {
        "name": "К. Тихонов",
        "pos": "LB",
        "ovr": 65,
        "speed": 82,
        "stamina": 87,
        "num": 2,
        "age": 23
      },
      {
        "name": "Л. Козлов",
        "pos": "CB",
        "ovr": 66,
        "speed": 75,
        "stamina": 83,
        "num": 3,
        "age": 32
      },
      {
        "name": "Т. Савельев",
        "pos": "CB",
        "ovr": 67,
        "speed": 84,
        "stamina": 93,
        "num": 4,
        "age": 34
      },
      {
        "name": "Н. Воробьёв",
        "pos": "RB",
        "ovr": 65,
        "speed": 67,
        "stamina": 88,
        "num": 5,
        "age": 20
      },
      {
        "name": "О. Кузьмин",
        "pos": "CM",
        "ovr": 66,
        "speed": 77,
        "stamina": 92,
        "num": 6,
        "age": 31
      },
      {
        "name": "М. Зайцев",
        "pos": "CM",
        "ovr": 67,
        "speed": 69,
        "stamina": 79,
        "num": 7,
        "age": 28
      },
      {
        "name": "И. Михайлов",
        "pos": "CAM",
        "ovr": 68,
        "speed": 68,
        "stamina": 93,
        "num": 8,
        "age": 31
      },
      {
        "name": "И. Марков",
        "pos": "LW",
        "ovr": 67,
        "speed": 70,
        "stamina": 91,
        "num": 9,
        "age": 29
      },
      {
        "name": "С. Николаев",
        "pos": "ST",
        "ovr": 69,
        "speed": 80,
        "stamina": 84,
        "num": 10,
        "age": 29
      },
      {
        "name": "Р. Козлов",
        "pos": "RW",
        "ovr": 66,
        "speed": 74,
        "stamina": 80,
        "num": 11,
        "age": 32
      },
      {
        "name": "К. Кузьмин",
        "pos": "GK",
        "ovr": 65,
        "speed": 62,
        "stamina": 90,
        "num": 12,
        "age": 23
      },
      {
        "name": "М. Крылов",
        "pos": "CB",
        "ovr": 69,
        "speed": 75,
        "stamina": 82,
        "num": 13,
        "age": 21
      },
      {
        "name": "К. Марков",
        "pos": "CM",
        "ovr": 67,
        "speed": 77,
        "stamina": 81,
        "num": 14,
        "age": 20
      },
      {
        "name": "Л. Павлов",
        "pos": "ST",
        "ovr": 69,
        "speed": 71,
        "stamina": 90,
        "num": 15,
        "age": 31
      },
      {
        "name": "А. Соколов",
        "pos": "LW",
        "ovr": 72,
        "speed": 66,
        "stamina": 78,
        "num": 16,
        "age": 20
      }
    ]
  },
  {
    "id": "RVD",
    "code": "RVD",
    "name": "Радий-Волна-Д",
    "city": "Нижний Новгород",
    "stadium": "Волна",
    "home": "#12344D",
    "away": "#3DDCFF",
    "league": "volga",
    "roster": [
      {
        "name": "И. Голубев",
        "pos": "GK",
        "ovr": 63,
        "speed": 59,
        "stamina": 91,
        "num": 1,
        "age": 23
      },
      {
        "name": "Р. Медведев",
        "pos": "LB",
        "ovr": 64,
        "speed": 80,
        "stamina": 78,
        "num": 2,
        "age": 21
      },
      {
        "name": "Р. Марков",
        "pos": "CB",
        "ovr": 65,
        "speed": 69,
        "stamina": 85,
        "num": 3,
        "age": 22
      },
      {
        "name": "С. Козлов",
        "pos": "CB",
        "ovr": 66,
        "speed": 79,
        "stamina": 94,
        "num": 4,
        "age": 28
      },
      {
        "name": "В. Алексеев",
        "pos": "RB",
        "ovr": 64,
        "speed": 71,
        "stamina": 81,
        "num": 5,
        "age": 21
      },
      {
        "name": "К. Павлов",
        "pos": "CM",
        "ovr": 65,
        "speed": 82,
        "stamina": 87,
        "num": 6,
        "age": 22
      },
      {
        "name": "М. Морозов",
        "pos": "CM",
        "ovr": 66,
        "speed": 82,
        "stamina": 86,
        "num": 7,
        "age": 25
      },
      {
        "name": "И. Михайлов",
        "pos": "CAM",
        "ovr": 67,
        "speed": 70,
        "stamina": 78,
        "num": 8,
        "age": 23
      },
      {
        "name": "С. Михайлов",
        "pos": "LW",
        "ovr": 66,
        "speed": 83,
        "stamina": 79,
        "num": 9,
        "age": 30
      },
      {
        "name": "Н. Богданов",
        "pos": "ST",
        "ovr": 68,
        "speed": 72,
        "stamina": 84,
        "num": 10,
        "age": 19
      },
      {
        "name": "С. Попов",
        "pos": "RW",
        "ovr": 65,
        "speed": 76,
        "stamina": 89,
        "num": 11,
        "age": 28
      },
      {
        "name": "Н. Михайлов",
        "pos": "GK",
        "ovr": 62,
        "speed": 62,
        "stamina": 86,
        "num": 12,
        "age": 25
      },
      {
        "name": "Р. Новиков",
        "pos": "CB",
        "ovr": 61,
        "speed": 74,
        "stamina": 78,
        "num": 13,
        "age": 22
      },
      {
        "name": "П. Белов",
        "pos": "CM",
        "ovr": 63,
        "speed": 73,
        "stamina": 80,
        "num": 14,
        "age": 25
      },
      {
        "name": "О. Павлов",
        "pos": "ST",
        "ovr": 67,
        "speed": 67,
        "stamina": 78,
        "num": 15,
        "age": 34
      },
      {
        "name": "Р. Фёдоров",
        "pos": "LW",
        "ovr": 71,
        "speed": 75,
        "stamina": 84,
        "num": 16,
        "age": 25
      }
    ]
  },
  {
    "id": "ARZ",
    "code": "ARZ",
    "name": "Арзамас",
    "city": "Арзамас",
    "stadium": "Знамя",
    "home": "#123A70",
    "away": "#F4F7FB",
    "league": "volga",
    "roster": [
      {
        "name": "Т. Макаров",
        "pos": "GK",
        "ovr": 61,
        "speed": 65,
        "stamina": 86,
        "num": 1,
        "age": 34
      },
      {
        "name": "М. Егоров",
        "pos": "LB",
        "ovr": 62,
        "speed": 82,
        "stamina": 80,
        "num": 2,
        "age": 24
      },
      {
        "name": "А. Алексеев",
        "pos": "CB",
        "ovr": 63,
        "speed": 82,
        "stamina": 86,
        "num": 3,
        "age": 20
      },
      {
        "name": "К. Иванов",
        "pos": "CB",
        "ovr": 64,
        "speed": 79,
        "stamina": 81,
        "num": 4,
        "age": 24
      },
      {
        "name": "М. Тихонов",
        "pos": "RB",
        "ovr": 62,
        "speed": 69,
        "stamina": 88,
        "num": 5,
        "age": 27
      },
      {
        "name": "В. Кузьмин",
        "pos": "CM",
        "ovr": 63,
        "speed": 72,
        "stamina": 93,
        "num": 6,
        "age": 31
      },
      {
        "name": "Р. Тихонов",
        "pos": "CM",
        "ovr": 64,
        "speed": 82,
        "stamina": 85,
        "num": 7,
        "age": 33
      },
      {
        "name": "А. Медведев",
        "pos": "CAM",
        "ovr": 65,
        "speed": 82,
        "stamina": 78,
        "num": 8,
        "age": 30
      },
      {
        "name": "В. Новиков",
        "pos": "LW",
        "ovr": 64,
        "speed": 70,
        "stamina": 87,
        "num": 9,
        "age": 33
      },
      {
        "name": "Р. Макаров",
        "pos": "ST",
        "ovr": 66,
        "speed": 69,
        "stamina": 92,
        "num": 10,
        "age": 33
      },
      {
        "name": "К. Степанов",
        "pos": "RW",
        "ovr": 63,
        "speed": 77,
        "stamina": 91,
        "num": 11,
        "age": 22
      },
      {
        "name": "С. Марков",
        "pos": "GK",
        "ovr": 65,
        "speed": 65,
        "stamina": 81,
        "num": 12,
        "age": 21
      },
      {
        "name": "Е. Попов",
        "pos": "CB",
        "ovr": 61,
        "speed": 75,
        "stamina": 84,
        "num": 13,
        "age": 32
      },
      {
        "name": "П. Тихонов",
        "pos": "CM",
        "ovr": 64,
        "speed": 68,
        "stamina": 87,
        "num": 14,
        "age": 34
      },
      {
        "name": "С. Волков",
        "pos": "ST",
        "ovr": 63,
        "speed": 81,
        "stamina": 86,
        "num": 15,
        "age": 21
      },
      {
        "name": "Д. Новиков",
        "pos": "LW",
        "ovr": 69,
        "speed": 74,
        "stamina": 91,
        "num": 16,
        "age": 20
      }
    ]
  },
  {
    "id": "MVY",
    "code": "MVY",
    "name": "Металлург",
    "city": "Выкса",
    "stadium": "Металлург",
    "home": "#E05A00",
    "away": "#1A1A1A",
    "league": "volga",
    "roster": [
      {
        "name": "Н. Макаров",
        "pos": "GK",
        "ovr": 60,
        "speed": 65,
        "stamina": 91,
        "num": 1,
        "age": 27
      },
      {
        "name": "К. Белов",
        "pos": "LB",
        "ovr": 61,
        "speed": 74,
        "stamina": 79,
        "num": 2,
        "age": 31
      },
      {
        "name": "Р. Назаров",
        "pos": "CB",
        "ovr": 62,
        "speed": 71,
        "stamina": 83,
        "num": 3,
        "age": 20
      },
      {
        "name": "Г. Григорьев",
        "pos": "CB",
        "ovr": 63,
        "speed": 73,
        "stamina": 83,
        "num": 4,
        "age": 29
      },
      {
        "name": "Т. Романов",
        "pos": "RB",
        "ovr": 61,
        "speed": 72,
        "stamina": 79,
        "num": 5,
        "age": 23
      },
      {
        "name": "Н. Алексеев",
        "pos": "CM",
        "ovr": 62,
        "speed": 76,
        "stamina": 91,
        "num": 6,
        "age": 28
      },
      {
        "name": "В. Воробьёв",
        "pos": "CM",
        "ovr": 63,
        "speed": 70,
        "stamina": 93,
        "num": 7,
        "age": 19
      },
      {
        "name": "С. Голубев",
        "pos": "CAM",
        "ovr": 64,
        "speed": 74,
        "stamina": 82,
        "num": 8,
        "age": 25
      },
      {
        "name": "Л. Тихонов",
        "pos": "LW",
        "ovr": 63,
        "speed": 70,
        "stamina": 89,
        "num": 9,
        "age": 21
      },
      {
        "name": "М. Орлов",
        "pos": "ST",
        "ovr": 65,
        "speed": 69,
        "stamina": 83,
        "num": 10,
        "age": 30
      },
      {
        "name": "Е. Павлов",
        "pos": "RW",
        "ovr": 62,
        "speed": 67,
        "stamina": 94,
        "num": 11,
        "age": 32
      },
      {
        "name": "И. Лебедев",
        "pos": "GK",
        "ovr": 59,
        "speed": 60,
        "stamina": 91,
        "num": 12,
        "age": 27
      },
      {
        "name": "И. Иванов",
        "pos": "CB",
        "ovr": 63,
        "speed": 66,
        "stamina": 80,
        "num": 13,
        "age": 33
      },
      {
        "name": "С. Романов",
        "pos": "CM",
        "ovr": 64,
        "speed": 77,
        "stamina": 92,
        "num": 14,
        "age": 27
      },
      {
        "name": "С. Степанов",
        "pos": "ST",
        "ovr": 65,
        "speed": 76,
        "stamina": 85,
        "num": 15,
        "age": 25
      },
      {
        "name": "Р. Медведев",
        "pos": "LW",
        "ovr": 68,
        "speed": 82,
        "stamina": 85,
        "num": 16,
        "age": 20
      }
    ]
  },
  {
    "id": "ENI",
    "code": "ENI",
    "name": "Енисей",
    "city": "Красноярск",
    "stadium": "Центральный",
    "home": "#D71920",
    "away": "#0C2340",
    "league": "siberia",
    "roster": [
      {
        "name": "Н. Морозов",
        "pos": "GK",
        "ovr": 66,
        "speed": 62,
        "stamina": 91,
        "num": 1,
        "age": 20
      },
      {
        "name": "Д. Морозов",
        "pos": "LB",
        "ovr": 67,
        "speed": 73,
        "stamina": 86,
        "num": 2,
        "age": 32
      },
      {
        "name": "Л. Тихонов",
        "pos": "CB",
        "ovr": 68,
        "speed": 82,
        "stamina": 82,
        "num": 3,
        "age": 21
      },
      {
        "name": "М. Петров",
        "pos": "CB",
        "ovr": 69,
        "speed": 75,
        "stamina": 88,
        "num": 4,
        "age": 25
      },
      {
        "name": "О. Орлов",
        "pos": "RB",
        "ovr": 67,
        "speed": 81,
        "stamina": 79,
        "num": 5,
        "age": 28
      },
      {
        "name": "Н. Егоров",
        "pos": "CM",
        "ovr": 68,
        "speed": 80,
        "stamina": 84,
        "num": 6,
        "age": 34
      },
      {
        "name": "М. Зайцев",
        "pos": "CM",
        "ovr": 69,
        "speed": 69,
        "stamina": 81,
        "num": 7,
        "age": 31
      },
      {
        "name": "К. Григорьев",
        "pos": "CAM",
        "ovr": 70,
        "speed": 72,
        "stamina": 89,
        "num": 8,
        "age": 23
      },
      {
        "name": "А. Васильев",
        "pos": "LW",
        "ovr": 69,
        "speed": 77,
        "stamina": 89,
        "num": 9,
        "age": 32
      },
      {
        "name": "Е. Тихонов",
        "pos": "ST",
        "ovr": 71,
        "speed": 70,
        "stamina": 88,
        "num": 10,
        "age": 26
      },
      {
        "name": "С. Алексеев",
        "pos": "RW",
        "ovr": 68,
        "speed": 68,
        "stamina": 90,
        "num": 11,
        "age": 27
      },
      {
        "name": "П. Семенов",
        "pos": "GK",
        "ovr": 66,
        "speed": 60,
        "stamina": 91,
        "num": 12,
        "age": 22
      },
      {
        "name": "Н. Крылов",
        "pos": "CB",
        "ovr": 66,
        "speed": 67,
        "stamina": 80,
        "num": 13,
        "age": 29
      },
      {
        "name": "Д. Назаров",
        "pos": "CM",
        "ovr": 66,
        "speed": 71,
        "stamina": 79,
        "num": 14,
        "age": 28
      },
      {
        "name": "В. Морозов",
        "pos": "ST",
        "ovr": 74,
        "speed": 80,
        "stamina": 84,
        "num": 15,
        "age": 30
      },
      {
        "name": "Т. Макаров",
        "pos": "LW",
        "ovr": 71,
        "speed": 80,
        "stamina": 83,
        "num": 16,
        "age": 19
      }
    ]
  },
  {
    "id": "KDV",
    "code": "KDV",
    "name": "КДВ",
    "city": "Томск",
    "stadium": "Труд",
    "home": "#1F7A3A",
    "away": "#F4F7F2",
    "league": "siberia",
    "roster": [
      {
        "name": "В. Осипов",
        "pos": "GK",
        "ovr": 64,
        "speed": 60,
        "stamina": 86,
        "num": 1,
        "age": 24
      },
      {
        "name": "К. Новиков",
        "pos": "LB",
        "ovr": 65,
        "speed": 73,
        "stamina": 82,
        "num": 2,
        "age": 21
      },
      {
        "name": "Д. Голубев",
        "pos": "CB",
        "ovr": 66,
        "speed": 77,
        "stamina": 89,
        "num": 3,
        "age": 23
      },
      {
        "name": "П. Фёдоров",
        "pos": "CB",
        "ovr": 67,
        "speed": 83,
        "stamina": 84,
        "num": 4,
        "age": 22
      },
      {
        "name": "О. Васильев",
        "pos": "RB",
        "ovr": 65,
        "speed": 75,
        "stamina": 85,
        "num": 5,
        "age": 30
      },
      {
        "name": "В. Назаров",
        "pos": "CM",
        "ovr": 66,
        "speed": 81,
        "stamina": 88,
        "num": 6,
        "age": 32
      },
      {
        "name": "Д. Алексеев",
        "pos": "CM",
        "ovr": 67,
        "speed": 71,
        "stamina": 94,
        "num": 7,
        "age": 21
      },
      {
        "name": "К. Макаров",
        "pos": "CAM",
        "ovr": 68,
        "speed": 83,
        "stamina": 91,
        "num": 8,
        "age": 28
      },
      {
        "name": "О. Лебедев",
        "pos": "LW",
        "ovr": 67,
        "speed": 70,
        "stamina": 79,
        "num": 9,
        "age": 29
      },
      {
        "name": "Р. Романов",
        "pos": "ST",
        "ovr": 69,
        "speed": 82,
        "stamina": 80,
        "num": 10,
        "age": 31
      },
      {
        "name": "А. Романов",
        "pos": "RW",
        "ovr": 66,
        "speed": 77,
        "stamina": 84,
        "num": 11,
        "age": 27
      },
      {
        "name": "Л. Марков",
        "pos": "GK",
        "ovr": 66,
        "speed": 64,
        "stamina": 83,
        "num": 12,
        "age": 25
      },
      {
        "name": "Г. Морозов",
        "pos": "CB",
        "ovr": 69,
        "speed": 74,
        "stamina": 92,
        "num": 13,
        "age": 28
      },
      {
        "name": "Г. Фролов",
        "pos": "CM",
        "ovr": 67,
        "speed": 82,
        "stamina": 90,
        "num": 14,
        "age": 29
      },
      {
        "name": "В. Лебедев",
        "pos": "ST",
        "ovr": 70,
        "speed": 82,
        "stamina": 86,
        "num": 15,
        "age": 34
      },
      {
        "name": "К. Воробьёв",
        "pos": "LW",
        "ovr": 73,
        "speed": 80,
        "stamina": 82,
        "num": 16,
        "age": 30
      }
    ]
  },
  {
    "id": "SIB",
    "code": "SIB",
    "name": "Сибирь",
    "city": "Новосибирск",
    "stadium": "Спартак",
    "home": "#1B4F9C",
    "away": "#F4F7FB",
    "league": "siberia",
    "roster": [
      {
        "name": "О. Павлов",
        "pos": "GK",
        "ovr": 62,
        "speed": 62,
        "stamina": 79,
        "num": 1,
        "age": 29
      },
      {
        "name": "Т. Фролов",
        "pos": "LB",
        "ovr": 63,
        "speed": 82,
        "stamina": 94,
        "num": 2,
        "age": 30
      },
      {
        "name": "Т. Тихонов",
        "pos": "CB",
        "ovr": 64,
        "speed": 71,
        "stamina": 81,
        "num": 3,
        "age": 32
      },
      {
        "name": "Г. Тихонов",
        "pos": "CB",
        "ovr": 65,
        "speed": 71,
        "stamina": 82,
        "num": 4,
        "age": 19
      },
      {
        "name": "Л. Ермолаев",
        "pos": "RB",
        "ovr": 63,
        "speed": 69,
        "stamina": 81,
        "num": 5,
        "age": 34
      },
      {
        "name": "Д. Марков",
        "pos": "CM",
        "ovr": 64,
        "speed": 73,
        "stamina": 87,
        "num": 6,
        "age": 22
      },
      {
        "name": "О. Новиков",
        "pos": "CM",
        "ovr": 65,
        "speed": 81,
        "stamina": 94,
        "num": 7,
        "age": 33
      },
      {
        "name": "Д. Крылов",
        "pos": "CAM",
        "ovr": 66,
        "speed": 81,
        "stamina": 91,
        "num": 8,
        "age": 33
      },
      {
        "name": "Т. Алексеев",
        "pos": "LW",
        "ovr": 65,
        "speed": 80,
        "stamina": 86,
        "num": 9,
        "age": 19
      },
      {
        "name": "Д. Алексеев",
        "pos": "ST",
        "ovr": 67,
        "speed": 84,
        "stamina": 82,
        "num": 10,
        "age": 34
      },
      {
        "name": "Т. Крылов",
        "pos": "RW",
        "ovr": 64,
        "speed": 83,
        "stamina": 90,
        "num": 11,
        "age": 32
      },
      {
        "name": "С. Соколов",
        "pos": "GK",
        "ovr": 66,
        "speed": 68,
        "stamina": 83,
        "num": 12,
        "age": 24
      },
      {
        "name": "О. Фёдоров",
        "pos": "CB",
        "ovr": 61,
        "speed": 80,
        "stamina": 79,
        "num": 13,
        "age": 25
      },
      {
        "name": "Е. Семенов",
        "pos": "CM",
        "ovr": 65,
        "speed": 66,
        "stamina": 91,
        "num": 14,
        "age": 26
      },
      {
        "name": "Д. Егоров",
        "pos": "ST",
        "ovr": 65,
        "speed": 67,
        "stamina": 93,
        "num": 15,
        "age": 29
      },
      {
        "name": "Д. Иванов",
        "pos": "LW",
        "ovr": 70,
        "speed": 74,
        "stamina": 89,
        "num": 16,
        "age": 21
      }
    ]
  },
  {
    "id": "DBA",
    "code": "DBA",
    "name": "Динамо",
    "city": "Барнаул",
    "stadium": "Динамо",
    "home": "#1E4ED8",
    "away": "#F7F7F2",
    "league": "siberia",
    "roster": [
      {
        "name": "Р. Козлов",
        "pos": "GK",
        "ovr": 60,
        "speed": 61,
        "stamina": 82,
        "num": 1,
        "age": 24
      },
      {
        "name": "О. Зайцев",
        "pos": "LB",
        "ovr": 61,
        "speed": 82,
        "stamina": 85,
        "num": 2,
        "age": 19
      },
      {
        "name": "Н. Киселёв",
        "pos": "CB",
        "ovr": 62,
        "speed": 74,
        "stamina": 84,
        "num": 3,
        "age": 32
      },
      {
        "name": "Е. Фёдоров",
        "pos": "CB",
        "ovr": 63,
        "speed": 75,
        "stamina": 86,
        "num": 4,
        "age": 31
      },
      {
        "name": "В. Медведев",
        "pos": "RB",
        "ovr": 61,
        "speed": 77,
        "stamina": 85,
        "num": 5,
        "age": 28
      },
      {
        "name": "С. Воробьёв",
        "pos": "CM",
        "ovr": 62,
        "speed": 70,
        "stamina": 79,
        "num": 6,
        "age": 30
      },
      {
        "name": "Г. Фролов",
        "pos": "CM",
        "ovr": 63,
        "speed": 83,
        "stamina": 84,
        "num": 7,
        "age": 30
      },
      {
        "name": "Н. Виноградов",
        "pos": "CAM",
        "ovr": 64,
        "speed": 75,
        "stamina": 90,
        "num": 8,
        "age": 31
      },
      {
        "name": "К. Егоров",
        "pos": "LW",
        "ovr": 63,
        "speed": 71,
        "stamina": 83,
        "num": 9,
        "age": 28
      },
      {
        "name": "С. Богданов",
        "pos": "ST",
        "ovr": 65,
        "speed": 69,
        "stamina": 81,
        "num": 10,
        "age": 22
      },
      {
        "name": "Т. Назаров",
        "pos": "RW",
        "ovr": 62,
        "speed": 72,
        "stamina": 86,
        "num": 11,
        "age": 21
      },
      {
        "name": "Л. Орлов",
        "pos": "GK",
        "ovr": 58,
        "speed": 60,
        "stamina": 87,
        "num": 12,
        "age": 32
      },
      {
        "name": "А. Романов",
        "pos": "CB",
        "ovr": 59,
        "speed": 83,
        "stamina": 80,
        "num": 13,
        "age": 23
      },
      {
        "name": "М. Иванов",
        "pos": "CM",
        "ovr": 61,
        "speed": 83,
        "stamina": 92,
        "num": 14,
        "age": 33
      },
      {
        "name": "И. Воробьёв",
        "pos": "ST",
        "ovr": 68,
        "speed": 76,
        "stamina": 90,
        "num": 15,
        "age": 27
      },
      {
        "name": "П. Григорьев",
        "pos": "LW",
        "ovr": 63,
        "speed": 77,
        "stamina": 83,
        "num": 16,
        "age": 34
      }
    ]
  },
  {
    "id": "IRT",
    "code": "IRT",
    "name": "Иртыш",
    "city": "Омск",
    "stadium": "Красная Звезда",
    "home": "#F5C400",
    "away": "#111111",
    "league": "siberia",
    "roster": [
      {
        "name": "К. Савельев",
        "pos": "GK",
        "ovr": 58,
        "speed": 63,
        "stamina": 86,
        "num": 1,
        "age": 25
      },
      {
        "name": "П. Виноградов",
        "pos": "LB",
        "ovr": 59,
        "speed": 81,
        "stamina": 84,
        "num": 2,
        "age": 25
      },
      {
        "name": "Т. Лебедев",
        "pos": "CB",
        "ovr": 60,
        "speed": 70,
        "stamina": 85,
        "num": 3,
        "age": 27
      },
      {
        "name": "Е. Богданов",
        "pos": "CB",
        "ovr": 61,
        "speed": 81,
        "stamina": 89,
        "num": 4,
        "age": 29
      },
      {
        "name": "И. Медведев",
        "pos": "RB",
        "ovr": 59,
        "speed": 71,
        "stamina": 78,
        "num": 5,
        "age": 34
      },
      {
        "name": "А. Соколов",
        "pos": "CM",
        "ovr": 60,
        "speed": 69,
        "stamina": 80,
        "num": 6,
        "age": 26
      },
      {
        "name": "Г. Романов",
        "pos": "CM",
        "ovr": 61,
        "speed": 70,
        "stamina": 81,
        "num": 7,
        "age": 28
      },
      {
        "name": "Р. Воробьёв",
        "pos": "CAM",
        "ovr": 62,
        "speed": 81,
        "stamina": 81,
        "num": 8,
        "age": 31
      },
      {
        "name": "Е. Савельев",
        "pos": "LW",
        "ovr": 61,
        "speed": 84,
        "stamina": 92,
        "num": 9,
        "age": 31
      },
      {
        "name": "Н. Виноградов",
        "pos": "ST",
        "ovr": 63,
        "speed": 70,
        "stamina": 92,
        "num": 10,
        "age": 26
      },
      {
        "name": "В. Орлов",
        "pos": "RW",
        "ovr": 60,
        "speed": 79,
        "stamina": 84,
        "num": 11,
        "age": 21
      },
      {
        "name": "К. Богданов",
        "pos": "GK",
        "ovr": 56,
        "speed": 67,
        "stamina": 94,
        "num": 12,
        "age": 23
      },
      {
        "name": "В. Семенов",
        "pos": "CB",
        "ovr": 57,
        "speed": 74,
        "stamina": 82,
        "num": 13,
        "age": 20
      },
      {
        "name": "К. Егоров",
        "pos": "CM",
        "ovr": 56,
        "speed": 73,
        "stamina": 84,
        "num": 14,
        "age": 30
      },
      {
        "name": "А. Назаров",
        "pos": "ST",
        "ovr": 63,
        "speed": 80,
        "stamina": 88,
        "num": 15,
        "age": 21
      },
      {
        "name": "Т. Назаров",
        "pos": "LW",
        "ovr": 63,
        "speed": 75,
        "stamina": 87,
        "num": 16,
        "age": 30
      }
    ]
  },
  {
    "id": "TMP",
    "code": "TMP",
    "name": "Темп",
    "city": "Барнаул",
    "stadium": "Темп",
    "home": "#E2B93B",
    "away": "#3A2A08",
    "league": "siberia",
    "roster": [
      {
        "name": "С. Савельев",
        "pos": "GK",
        "ovr": 57,
        "speed": 67,
        "stamina": 82,
        "num": 1,
        "age": 28
      },
      {
        "name": "Т. Зайцев",
        "pos": "LB",
        "ovr": 58,
        "speed": 83,
        "stamina": 86,
        "num": 2,
        "age": 33
      },
      {
        "name": "М. Орлов",
        "pos": "CB",
        "ovr": 59,
        "speed": 80,
        "stamina": 91,
        "num": 3,
        "age": 26
      },
      {
        "name": "А. Киселёв",
        "pos": "CB",
        "ovr": 60,
        "speed": 67,
        "stamina": 87,
        "num": 4,
        "age": 23
      },
      {
        "name": "О. Петров",
        "pos": "RB",
        "ovr": 58,
        "speed": 75,
        "stamina": 88,
        "num": 5,
        "age": 22
      },
      {
        "name": "Е. Богданов",
        "pos": "CM",
        "ovr": 59,
        "speed": 71,
        "stamina": 85,
        "num": 6,
        "age": 33
      },
      {
        "name": "Т. Алексеев",
        "pos": "CM",
        "ovr": 60,
        "speed": 77,
        "stamina": 88,
        "num": 7,
        "age": 20
      },
      {
        "name": "Д. Ермолаев",
        "pos": "CAM",
        "ovr": 61,
        "speed": 79,
        "stamina": 84,
        "num": 8,
        "age": 26
      },
      {
        "name": "К. Фролов",
        "pos": "LW",
        "ovr": 60,
        "speed": 79,
        "stamina": 85,
        "num": 9,
        "age": 32
      },
      {
        "name": "Л. Назаров",
        "pos": "ST",
        "ovr": 62,
        "speed": 70,
        "stamina": 82,
        "num": 10,
        "age": 30
      },
      {
        "name": "Р. Алексеев",
        "pos": "RW",
        "ovr": 59,
        "speed": 67,
        "stamina": 92,
        "num": 11,
        "age": 25
      },
      {
        "name": "И. Медведев",
        "pos": "GK",
        "ovr": 53,
        "speed": 63,
        "stamina": 80,
        "num": 12,
        "age": 20
      },
      {
        "name": "К. Назаров",
        "pos": "CB",
        "ovr": 55,
        "speed": 77,
        "stamina": 91,
        "num": 13,
        "age": 31
      },
      {
        "name": "Р. Зайцев",
        "pos": "CM",
        "ovr": 60,
        "speed": 67,
        "stamina": 87,
        "num": 14,
        "age": 26
      },
      {
        "name": "О. Крылов",
        "pos": "ST",
        "ovr": 64,
        "speed": 74,
        "stamina": 92,
        "num": 15,
        "age": 25
      },
      {
        "name": "В. Тихонов",
        "pos": "LW",
        "ovr": 63,
        "speed": 68,
        "stamina": 93,
        "num": 16,
        "age": 22
      }
    ]
  },
  {
    "id": "BUR",
    "code": "BUR",
    "name": "Бурятия",
    "city": "Улан-Удэ",
    "stadium": "Центральный",
    "home": "#0033A0",
    "away": "#FFD100",
    "league": "siberia",
    "roster": [
      {
        "name": "В. Савельев",
        "pos": "GK",
        "ovr": 56,
        "speed": 66,
        "stamina": 90,
        "num": 1,
        "age": 21
      },
      {
        "name": "Л. Козлов",
        "pos": "LB",
        "ovr": 57,
        "speed": 71,
        "stamina": 86,
        "num": 2,
        "age": 33
      },
      {
        "name": "И. Богданов",
        "pos": "CB",
        "ovr": 58,
        "speed": 84,
        "stamina": 83,
        "num": 3,
        "age": 21
      },
      {
        "name": "Н. Егоров",
        "pos": "CB",
        "ovr": 59,
        "speed": 74,
        "stamina": 88,
        "num": 4,
        "age": 19
      },
      {
        "name": "А. Лебедев",
        "pos": "RB",
        "ovr": 57,
        "speed": 81,
        "stamina": 79,
        "num": 5,
        "age": 27
      },
      {
        "name": "О. Соколов",
        "pos": "CM",
        "ovr": 58,
        "speed": 69,
        "stamina": 83,
        "num": 6,
        "age": 23
      },
      {
        "name": "В. Попов",
        "pos": "CM",
        "ovr": 59,
        "speed": 77,
        "stamina": 83,
        "num": 7,
        "age": 32
      },
      {
        "name": "Т. Петров",
        "pos": "CAM",
        "ovr": 60,
        "speed": 79,
        "stamina": 91,
        "num": 8,
        "age": 28
      },
      {
        "name": "Е. Егоров",
        "pos": "LW",
        "ovr": 59,
        "speed": 82,
        "stamina": 86,
        "num": 9,
        "age": 28
      },
      {
        "name": "Л. Смирнов",
        "pos": "ST",
        "ovr": 61,
        "speed": 69,
        "stamina": 78,
        "num": 10,
        "age": 22
      },
      {
        "name": "П. Новиков",
        "pos": "RW",
        "ovr": 58,
        "speed": 81,
        "stamina": 86,
        "num": 11,
        "age": 23
      },
      {
        "name": "М. Голубев",
        "pos": "GK",
        "ovr": 56,
        "speed": 62,
        "stamina": 85,
        "num": 12,
        "age": 28
      },
      {
        "name": "Г. Богданов",
        "pos": "CB",
        "ovr": 59,
        "speed": 82,
        "stamina": 92,
        "num": 13,
        "age": 21
      },
      {
        "name": "К. Попов",
        "pos": "CM",
        "ovr": 56,
        "speed": 66,
        "stamina": 82,
        "num": 14,
        "age": 26
      },
      {
        "name": "Г. Козлов",
        "pos": "ST",
        "ovr": 63,
        "speed": 76,
        "stamina": 88,
        "num": 15,
        "age": 24
      },
      {
        "name": "С. Зайцев",
        "pos": "LW",
        "ovr": 62,
        "speed": 76,
        "stamina": 93,
        "num": 16,
        "age": 23
      }
    ]
  },
  {
    "id": "BAI",
    "code": "BAI",
    "name": "Байкал",
    "city": "Иркутск",
    "stadium": "Труд",
    "home": "#0E7490",
    "away": "#E7F6F8",
    "league": "siberia",
    "roster": [
      {
        "name": "К. Воробьёв",
        "pos": "GK",
        "ovr": 55,
        "speed": 65,
        "stamina": 91,
        "num": 1,
        "age": 34
      },
      {
        "name": "В. Голубев",
        "pos": "LB",
        "ovr": 56,
        "speed": 72,
        "stamina": 81,
        "num": 2,
        "age": 30
      },
      {
        "name": "О. Макаров",
        "pos": "CB",
        "ovr": 57,
        "speed": 73,
        "stamina": 84,
        "num": 3,
        "age": 28
      },
      {
        "name": "М. Иванов",
        "pos": "CB",
        "ovr": 58,
        "speed": 68,
        "stamina": 91,
        "num": 4,
        "age": 33
      },
      {
        "name": "Л. Егоров",
        "pos": "RB",
        "ovr": 56,
        "speed": 76,
        "stamina": 89,
        "num": 5,
        "age": 27
      },
      {
        "name": "Е. Савельев",
        "pos": "CM",
        "ovr": 57,
        "speed": 76,
        "stamina": 82,
        "num": 6,
        "age": 33
      },
      {
        "name": "Р. Новиков",
        "pos": "CM",
        "ovr": 58,
        "speed": 83,
        "stamina": 83,
        "num": 7,
        "age": 20
      },
      {
        "name": "С. Киселёв",
        "pos": "CAM",
        "ovr": 59,
        "speed": 84,
        "stamina": 92,
        "num": 8,
        "age": 25
      },
      {
        "name": "О. Назаров",
        "pos": "LW",
        "ovr": 58,
        "speed": 83,
        "stamina": 93,
        "num": 9,
        "age": 33
      },
      {
        "name": "А. Григорьев",
        "pos": "ST",
        "ovr": 60,
        "speed": 76,
        "stamina": 88,
        "num": 10,
        "age": 30
      },
      {
        "name": "П. Михайлов",
        "pos": "RW",
        "ovr": 57,
        "speed": 70,
        "stamina": 86,
        "num": 11,
        "age": 23
      },
      {
        "name": "И. Белов",
        "pos": "GK",
        "ovr": 59,
        "speed": 66,
        "stamina": 90,
        "num": 12,
        "age": 21
      },
      {
        "name": "Г. Козлов",
        "pos": "CB",
        "ovr": 59,
        "speed": 80,
        "stamina": 88,
        "num": 13,
        "age": 22
      },
      {
        "name": "Д. Морозов",
        "pos": "CM",
        "ovr": 59,
        "speed": 72,
        "stamina": 81,
        "num": 14,
        "age": 24
      },
      {
        "name": "С. Семенов",
        "pos": "ST",
        "ovr": 59,
        "speed": 69,
        "stamina": 87,
        "num": 15,
        "age": 26
      },
      {
        "name": "К. Фролов",
        "pos": "LW",
        "ovr": 60,
        "speed": 72,
        "stamina": 85,
        "num": 16,
        "age": 24
      }
    ]
  }
];

export const CLUB_INFO: Record<string, { capacity: number; coach: string; founded: number; style: string }> = {
  "KHM": {
    "capacity": 3050,
    "coach": "А. Петров",
    "founded": 1965,
    "style": "Высокий прессинг"
  },
  "SPM": {
    "capacity": 15000,
    "coach": "Р. Орлов",
    "founded": 1961,
    "style": "Владение мячом"
  },
  "SHU": {
    "capacity": 3500,
    "coach": "В. Егоров",
    "founded": 1970,
    "style": "Контратака"
  },
  "ENR": {
    "capacity": 6200,
    "coach": "Д. Волков",
    "founded": 1978,
    "style": "Фланговые забегания"
  },
  "ZNM": {
    "capacity": 4100,
    "coach": "С. Белов",
    "founded": 1954,
    "style": "Низкий блок"
  },
  "ALT": {
    "capacity": 2800,
    "coach": "И. Савельев",
    "founded": 1968,
    "style": "Вертикальные передачи"
  },
  "SKL": {
    "capacity": 2500,
    "coach": "Н. Крылов",
    "founded": 1982,
    "style": "Прессинг на своей половине"
  },
  "CVL": {
    "capacity": 2200,
    "coach": "М. Тихонов",
    "founded": 1991,
    "style": "Игра через опорного"
  },
  "NNN": {
    "capacity": 44899,
    "coach": "В. Гаранин",
    "founded": 2015,
    "style": "Владение мячом"
  },
  "KHD": {
    "capacity": 10000,
    "coach": "Главный тренер",
    "founded": 1946,
    "style": "Высокий прессинг"
  },
  "POB": {
    "capacity": 3000,
    "coach": "Главный тренер",
    "founded": 2023,
    "style": "Вертикальные передачи"
  },
  "SHP": {
    "capacity": 1500,
    "coach": "Главный тренер",
    "founded": 1994,
    "style": "Контратака"
  },
  "SBR": {
    "capacity": 2500,
    "coach": "Главный тренер",
    "founded": 1961,
    "style": "Фланговые забегания"
  },
  "RVD": {
    "capacity": 2000,
    "coach": "Главный тренер",
    "founded": 2008,
    "style": "Игра через опорного"
  },
  "ARZ": {
    "capacity": 3200,
    "coach": "Главный тренер",
    "founded": 2016,
    "style": "Низкий блок"
  },
  "MVY": {
    "capacity": 7000,
    "coach": "Главный тренер",
    "founded": 1957,
    "style": "Прессинг на своей половине"
  },
  "ENI": {
    "capacity": 15000,
    "coach": "Главный тренер",
    "founded": 1937,
    "style": "Владение мячом"
  },
  "KDV": {
    "capacity": 10000,
    "coach": "Главный тренер",
    "founded": 2023,
    "style": "Высокий прессинг"
  },
  "SIB": {
    "capacity": 12100,
    "coach": "Главный тренер",
    "founded": 1936,
    "style": "Фланговые забегания"
  },
  "DBA": {
    "capacity": 15000,
    "coach": "Главный тренер",
    "founded": 1957,
    "style": "Контратака"
  },
  "IRT": {
    "capacity": 4500,
    "coach": "Главный тренер",
    "founded": 1946,
    "style": "Низкий блок"
  },
  "TMP": {
    "capacity": 3000,
    "coach": "Главный тренер",
    "founded": 1989,
    "style": "Вертикальные передачи"
  },
  "BUR": {
    "capacity": 10000,
    "coach": "Главный тренер",
    "founded": 2014,
    "style": "Игра через опорного"
  },
  "BAI": {
    "capacity": 16800,
    "coach": "Главный тренер",
    "founded": 2018,
    "style": "Прессинг на своей половине"
  }
};

const STYLE_EN: Record<string, string> = {
  "Высокий прессинг": "High press",
  "Владение мячом": "Possession",
  "Контратака": "Counter-attack",
  "Фланговые забегания": "Wide runs",
  "Низкий блок": "Low block",
  "Вертикальные передачи": "Vertical passes",
  "Прессинг на своей половине": "Press on their own half",
  "Игра через опорного": "Play through the pivot",
  "Универсальный": "All-round",
};

export function styleLabel(style: string): string {
  return getLang() === "en" ? STYLE_EN[style] ?? style : style;
}

export function coachLabel(name: string): string {
  return name === "Главный тренер" ? (getLang() === "en" ? "Head coach" : name) : name;
}

export function leagueMeta(id: LeagueId | string): { title: string; name: string } {
  if (id === "volga") return { title: "Волжский", name: "Волжский мяч" };
  if (id === "siberia") return { title: "Сибирский", name: "Сибирский мяч" };
  return { title: "Чувашский", name: "Чувашский мяч" };
}

export function leagueTitle(id: LeagueId | string, full = false): string {
  const meta = leagueMeta(id);
  if (getLang() !== "en") return full ? meta.name : meta.title;
  if (id === "volga") return full ? "Volga Ball" : "Volga";
  if (id === "siberia") return full ? "Siberian Ball" : "Siberian";
  return full ? "Chuvash Ball" : "Chuvash";
}

/** Opponent shape. Same club lines up differently from match to match. */
export function clubShape(teamId: string, salt = 0): (typeof FORMATION_IDS)[number] {
  const style = clubInfo(teamId).style.toLowerCase();
  let pref = 0;
  if (style.includes("фланг")) pref = 2;
  else if (style.includes("вертикал") || style.includes("контрат")) pref = 1;
  else if (style.includes("низк") || style.includes("своей") || style.includes("опорн")) pref = 3;
  const shift = Math.abs(Math.trunc(salt)) % 3;
  return FORMATION_IDS[(pref + shift) % FORMATION_IDS.length]!;
}

export function clubInfo(id: string) {
  return CLUB_INFO[id] ?? { capacity: 3000, coach: "Главный тренер", founded: 1970, style: "Универсальный" };
}

export function teamById(id: string): TeamDef {
  const team = TEAMS.find((t) => t.id === id);
  if (team) return team;
  return {
    id,
    code: (id || "???").slice(0, 3),
    name: "Клуб снят",
    city: "—",
    stadium: "—",
    home: "#1F6B45",
    away: "#F4F1E8",
    league: "chuvash",
    roster: [],
  };
}

export const LEAGUE_ORDER: LeagueId[] = ["volga", "chuvash", "siberia"];

export function teamsIn(id: LeagueId | string): TeamDef[] {
  return TEAMS.filter((t) => t.league === id);
}

export function leagueIds(teamId: string): string[] {
  const league = TEAMS.find((t) => t.id === teamId)?.league ?? "chuvash";
  return teamsIn(league).map((t) => t.id);
}

export function neighborLeague(id: LeagueId | string, dir: number): LeagueId {
  const i = LEAGUE_ORDER.indexOf(id as LeagueId);
  const at = i < 0 ? 1 : i;
  return LEAGUE_ORDER[(at + dir + LEAGUE_ORDER.length) % LEAGUE_ORDER.length]!;
}

export function avgOvr(team: TeamDef): number {
  const xi = team.roster.slice(0, 11);
  if (!xi.length) return 60;
  return Math.round(xi.reduce((s, p) => s + p.ovr, 0) / xi.length);
}

export function clubRating(id: string): number {
  return avgOvr(teamById(id));
}

export function coachRating(id: string): number {
  const avg = clubRating(id);
  const style = clubInfo(id).style;
  const bump = style.includes("прессинг") || style.includes("Прессинг") ? 1 : style.includes("Владение") ? 2 : 0;
  return Math.max(58, Math.min(90, avg + bump));
}

export function playerAttrs(p: { name: string; pos: Role; ovr: number; speed: number; accuracy?: number; hardness?: number }) {
  if (p.accuracy != null && p.hardness != null) return { speed: p.speed, accuracy: p.accuracy, hardness: p.hardness };
  let h = 0;
  for (let i = 0; i < p.name.length; i++) h = (h * 33 + p.name.charCodeAt(i)) % 97;
  const atk = p.pos === "ST" || p.pos === "LW" || p.pos === "RW" || p.pos === "CAM";
  const def = p.pos === "CB" || p.pos === "CDM" || p.pos === "LB" || p.pos === "RB" || p.pos === "GK";
  const accuracy = Math.max(46, Math.min(94, Math.round(p.ovr + (atk ? 6 : def ? -3 : 1) + (h % 7) - 3)));
  const hardness = Math.max(40, Math.min(96, Math.round(p.ovr + (def ? 8 : atk ? -5 : 0) + ((h * 3) % 9) - 4)));
  return { speed: p.speed, accuracy, hardness };
}

export type Fixture = {
  round: number;
  home: string;
  away: string;
  hg: number | null;
  ag: number | null;
};

export function seasonFixtures(ids: string[]): Fixture[] {
  const n = ids.length;
  const list = ids.slice();
  const first: Fixture[][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: Fixture[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i]!;
      const b = list[n - 1 - i]!;
      const swap = r % 2 === 1 && i === 0;
      pairs.push({ round: r, home: swap ? b : a, away: swap ? a : b, hg: null, ag: null });
    }
    first.push(pairs);
    const fixed = list[0]!;
    const rest = list.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    list.splice(0, list.length, fixed, ...rest);
  }
  const second = first.map((pairs, i) =>
    pairs.map((p) => ({ round: i + (n - 1), home: p.away, away: p.home, hg: null, ag: null })),
  );
  return [...first.flat(), ...second.flat()];
}

export type TableRow = {
  id: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
};

export function tableOf(fixtures: Fixture[]): TableRow[] {
  const rows = new Map<string, TableRow>();
  for (const f of fixtures) {
    if (!rows.has(f.home)) rows.set(f.home, { id: f.home, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
    if (!rows.has(f.away)) rows.set(f.away, { id: f.away, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
  }
  for (const f of fixtures) {
    if (f.hg === null || f.ag === null) continue;
    const h = rows.get(f.home);
    const a = rows.get(f.away);
    if (!h || !a) continue;
    h.p++;
    a.p++;
    h.gf += f.hg;
    h.ga += f.ag;
    a.gf += f.ag;
    a.ga += f.hg;
    if (f.hg > f.ag) {
      h.w++;
      h.pts += 3;
      a.l++;
    } else if (f.hg < f.ag) {
      a.w++;
      a.pts += 3;
      h.l++;
    } else {
      h.d++;
      a.d++;
      h.pts++;
      a.pts++;
    }
  }
  return [...rows.values()].sort((a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf);
}

export function profile(role: Role): { line: number; flank: number } {
  switch (role) {
    case "GK":
      return { line: 0, flank: 0 };
    case "CB":
      return { line: 1, flank: 0 };
    case "LB":
      return { line: 1, flank: -1 };
    case "RB":
      return { line: 1, flank: 1 };
    case "CDM":
      return { line: 2, flank: 0 };
    case "CM":
      return { line: 2, flank: 0 };
    case "LM":
      return { line: 2, flank: -1 };
    case "RM":
      return { line: 2, flank: 1 };
    case "CAM":
      return { line: 3, flank: 0 };
    case "LW":
      return { line: 3, flank: -1 };
    case "RW":
      return { line: 3, flank: 1 };
    case "ST":
      return { line: 4, flank: 0 };
  }
}

export function slotFit(role: Role, slotRole: Role): number {
  if (role === "GK" || slotRole === "GK") return role === slotRole ? 2 : -8;
  const a = profile(role);
  const b = profile(slotRole);
  const d = Math.abs(a.line - b.line) + Math.abs(a.flank - b.flank);
  if (d === 0) return 2;
  if (d <= 1.5) return 0;
  return -3;
}

export function compatible(outRole: Role, inRole: Role): boolean {
  if (outRole === "GK" || inRole === "GK") return outRole === inRole;
  const a = profile(outRole);
  const b = profile(inRole);
  if (Math.abs(a.line - b.line) > 2) return false;
  if (a.flank * b.flank === -1 && a.flank !== 0) return false;
  return true;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simOtherScore(homeOvr: number, awayOvr: number, seed: number): [number, number] {
  const rng = mulberry32(seed);
  const poisson = (lambda: number) => {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= rng();
    } while (p > L && k < 8);
    return k - 1;
  };
  const hg = poisson(Math.max(0.35, 1.25 + (homeOvr - awayOvr) / 28));
  const ag = poisson(Math.max(0.3, 1.05 + (awayOvr - homeOvr) / 28));
  return [hg, ag];
}
