"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "te";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (en: string, te: string) => string;
  isTe: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LS_LANG_KEY = "swarnatry_lang";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(LS_LANG_KEY) as Language;
      if (saved === "en" || saved === "te") {
        setLanguageState(saved);
        if (saved === "te") {
          document.documentElement.classList.add("lang-te");
          document.body.classList.add("lang-te");
        } else {
          document.documentElement.classList.remove("lang-te");
          document.body.classList.remove("lang-te");
        }
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LS_LANG_KEY, lang);
    } catch {}
    if (typeof document !== "undefined") {
      if (lang === "te") {
        document.documentElement.classList.add("lang-te");
        document.body.classList.add("lang-te");
      } else {
        document.documentElement.classList.remove("lang-te");
        document.body.classList.remove("lang-te");
      }
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "te" : "en");
  };

  const t = (en: string, te: string): string => {
    return language === "te" ? te : en;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isTe: language === "te",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return safe fallback if used outside provider
    return {
      language: "en",
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (en, te) => en,
      isTe: false,
    };
  }
  return context;
}
