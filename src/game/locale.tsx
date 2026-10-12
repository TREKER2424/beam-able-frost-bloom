import { createContext, useContext } from "react";

export type Lang = "ru" | "en";

const LangCtx = createContext<Lang>("ru");

export const LangProvider = LangCtx.Provider;

export function useLang(): Lang {
  return useContext(LangCtx);
}

export function tx(lang: Lang, ru: string, en: string) {
  return lang === "en" ? en : ru;
}
