'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLang } from '../../lib/i18n/useLang'
import LangSwitcher from '../../components/ui/LangSwitcher'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLang()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) router.push('/dashboard')
  }, [session, router])

  const handleLogin = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1020' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(79,98,247,0.3)', borderTop: '2px solid #4f62f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1020',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Noto Sans KR', 'Noto Sans Thai', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,98,247,0.08) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />

      {/* 언어 선택 - 우측 상단 */}
      <div style={{ position: 'absolute', top: 20, right: 24 }}>
        <LangSwitcher />
      </div>

      <div style={{
        background: '#141828', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 24, padding: '48px 40px',
        width: '100%', maxWidth: 400, textAlign: 'center',
        position: 'relative', animation: 'fadeIn 0.4s ease',
      }}>
        <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #4f62f7, #7c3aed)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 22 }}>✦</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: '0 0 6px', letterSpacing: '-0.3px' }}>{t('common.appName')}</h1>
        <p style={{ fontSize: 13, color: '#8b91ab', margin: '0 0 36px' }}>{t('login.subtitle')}</p>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 0 32px' }} />
        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', padding: '12px 20px',
          background: loading ? 'rgba(79,98,247,0.5)' : '#4f62f7',
          color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'all 0.2s', fontFamily: 'inherit',
        }}>
          {loading ? (
            <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />{t('login.loggingIn')}</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {t('login.googleLogin')}
            </>
          )}
        </button>
        <p style={{ marginTop: 20, fontSize: 12, color: '#8b91ab', lineHeight: 1.7 }}>{t('login.loginNote')}</p>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
