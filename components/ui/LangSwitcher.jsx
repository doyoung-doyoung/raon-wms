'use client'

import { useLang, LANGUAGES } from '../../lib/i18n/useLang'
import { useState } from 'react'

export default function LangSwitcher({ compact = false }) {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)

  const current = LANGUAGES.find(l => l.code === lang)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: compact ? '4px 8px' : '6px 12px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          color: '#f1f3f9',
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      >
        <span>{current?.flag}</span>
        {!compact && <span>{current?.label}</span>}
        <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            background: '#1e2235',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 10,
            overflow: 'hidden',
            zIndex: 50,
            minWidth: 140,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false) }}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px',
                  background: l.code === lang ? 'rgba(79,98,247,0.15)' : 'transparent',
                  border: 'none',
                  color: l.code === lang ? '#818cf8' : '#c4c7d6',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: l.code === lang ? 600 : 400,
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (l.code !== lang) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (l.code !== lang) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 16 }}>{l.flag}</span>
                <span>{l.label}</span>
                {l.code === lang && <span style={{ marginLeft: 'auto', fontSize: 12 }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
