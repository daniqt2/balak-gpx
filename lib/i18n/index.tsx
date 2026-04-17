'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import es from './es.json'
import en from './en.json'

export type Lang = 'es' | 'en'

const translations = { es, en } as const

type Translations = typeof es

function get(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return path
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'string' ? cur : path
}

interface I18nContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    const stored = localStorage.getItem('balak-lang') as Lang | null
    if (stored === 'en' || stored === 'es') setLangState(stored)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('balak-lang', l)
  }

  function t(key: string, vars?: Record<string, string>): string {
    let str = get(translations[lang] as unknown as Record<string, unknown>, key)
    if (str === key) str = get(translations.es as unknown as Record<string, unknown>, key)
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v) })
    }
    return str
  }

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useT() {
  return useContext(I18nContext)
}

export type { Translations }
