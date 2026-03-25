'use client'

import { SessionProvider } from 'next-auth/react'
import { LangProvider } from '../lib/i18n/useLang'

export function Providers({ children }) {
  return (
    <SessionProvider>
      <LangProvider>
        {children}
      </LangProvider>
    </SessionProvider>
  )
}
