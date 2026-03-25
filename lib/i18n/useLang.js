'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Supported languages
export const LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('ko')
  const [messages, setMessages] = useState({})

  // Load messages for current language
  const loadMessages = useCallback(async (langCode) => {
    try {
      const mod = await import(`../../locales/${langCode}.json`)
      setMessages(mod.default)
    } catch (e) {
      console.error('Failed to load locale:', langCode)
    }
  }, [])

  useEffect(() => {
    // Read saved language from localStorage
    const saved = typeof window !== 'undefined'
      ? localStorage.getItem('raon-lang') || 'ko'
      : 'ko'
    setLangState(saved)
    loadMessages(saved)
  }, [loadMessages])

  const setLang = (code) => {
    setLangState(code)
    if (typeof window !== 'undefined') {
      localStorage.setItem('raon-lang', code)
    }
    loadMessages(code)
  }

  // Translate function: t('nav.dashboard') or t('dashboard.greeting', { name: 'Dodo' })
  const t = useCallback((key, vars = {}) => {
    const keys = key.split('.')
    let val = messages
    for (const k of keys) {
      val = val?.[k]
      if (val === undefined) return key
    }
    if (typeof val !== 'string') return key
    // Replace {{variable}} placeholders
    return val.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
  }, [messages])

  return (
    <LangContext.Provider value={{ lang, setLang, t, messages }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
