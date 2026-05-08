'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLang } from '../../lib/i18n/useLang'
import LangSwitcher from '../../components/ui/LangSwitcher'

// settings key → nav href 매핑
const NAV_VISIBILITY_MAP = {
  announcements:   '/announcements',
  attendance:      '/attendance',
  leaves:          '/leaves',
  expenses:        '/expenses',
  documentRequest: '/documents/request',
  warnings:        '/warnings',
  quotations:      '/quotations',
  clients:         '/clients',
}

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLang()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hiddenNavHrefs, setHiddenNavHrefs] = useState(new Set())

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated' || session?.isAdmin) return
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (!data.menuItems) return
      const hidden = new Set()
      Object.entries(NAV_VISIBILITY_MAP).forEach(([key, href]) => {
        const s = data.menuItems[key]
        if (s && s.visible === false) hidden.add(href)
      })
      setHiddenNavHrefs(hidden)
    }).catch(() => {})
  }, [status, session])

  if (status === 'loading' || !session) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1020', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(79,98,247,0.3)', borderTop: '2px solid #4f62f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const isAdmin = session.isAdmin

  const navGroups = [
    {
      group: 'main',
      items: [
        { href: '/dashboard', icon: '⊞', labelKey: 'nav.dashboard' },
        { href: '/announcements', icon: '📢', labelKey: 'nav.announcements' },
      ]
    },
    {
      group: 'hr',
      items: [
        { href: '/employees', icon: '👥', labelKey: 'nav.employees', adminOnly: true },
        { href: '/attendance', icon: '⏰', labelKey: 'nav.attendance' },
        { href: '/leaves', icon: '🗓️', labelKey: 'nav.leaves' },
        { href: '/payroll', icon: '💰', labelKey: 'nav.payroll', adminOnly: true },
      ]
    },
    {
      group: 'documents',
      items: [
        { href: '/documents/request', icon: '📝', labelKey: 'nav.documentRequest' },
        { href: '/documents/approve', icon: '✅', labelKey: 'nav.documentApprove', adminOnly: true },
        { href: '/warnings', icon: '⚠️', labelKey: 'nav.warnings' },
        { href: '/expenses', icon: '💰', labelKey: 'nav.expenses' },
      ]
    },
    {
      group: 'accounting',
      items: [
        { href: '/quotations', icon: '📋', labelKey: 'nav.quotations' },
        { href: '/clients',    icon: '👥', labelKey: 'nav.clients' },
      ]
    },
    {
      group: 'settings',
      items: [
        { href: '/reports', icon: '📊', labelKey: 'nav.reports', adminOnly: true },
        { href: '/settings', icon: '⚙️', labelKey: 'nav.settings', adminOnly: true },
      ]
    },
  ]

  const visibleNav = navGroups.map(g => ({
    ...g,
    items: g.items.filter(item => {
      if (item.adminOnly && !isAdmin) return false
      if (!isAdmin && hiddenNavHrefs.has(item.href)) return false
      return true
    })
  })).filter(g => g.items.length > 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1020', fontFamily: "'Noto Sans KR', 'Noto Sans Thai', sans-serif" }}>
      <aside style={{
        width: sidebarOpen ? 220 : 64, minHeight: '100vh',
        background: '#141828', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #4f62f7, #7c3aed)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, cursor: 'pointer' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}>✦</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f3f9', lineHeight: 1.2 }}>{t('common.appName')}</div>
              <div style={{ fontSize: 11, color: '#8b91ab' }}>Work Management</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', overflow: 'auto' }}>
          {visibleNav.map(group => (
            <div key={group.group} style={{ marginBottom: 16 }}>
              {sidebarOpen && (
                <div style={{ fontSize: 10, fontWeight: 600, color: '#8b91ab', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 4 }}>
                  {t(`nav.groups.${group.group}`)}
                </div>
              )}
              {group.items.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: sidebarOpen ? '8px 10px' : '8px',
                      borderRadius: 9,
                      background: active ? 'rgba(79,98,247,0.15)' : 'transparent',
                      color: active ? '#818cf8' : '#8b91ab',
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.15s', marginBottom: 2,
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      {sidebarOpen && <span>{t(item.labelKey)}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {sidebarOpen && (
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
              <LangSwitcher />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9 }}>
            {session.user.image && (
              <img src={session.user.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
            )}
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f3f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user.name}</div>
                <div style={{ fontSize: 10, color: '#8b91ab' }}>{isAdmin ? `👑 ${t('common.adminBadge')}` : t('common.status.active')}</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={() => signOut({ callbackUrl: '/login' })} style={{
              width: '100%', padding: '7px', background: 'rgba(239,68,68,0.1)', color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              marginTop: 6, fontFamily: 'inherit',
            }}>
              {t('common.logout')}
            </button>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, padding: '28px 32px', overflow: 'auto', animation: 'fadeIn 0.25s ease' }}>
        {children}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; } a { color: inherit; }
      `}</style>
    </div>
  )
}
