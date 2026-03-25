import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'
import './globals.css'

export const metadata = {
  title: 'RAON Work Management System',
  description: 'RAON 내부 업무 관리 시스템',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e2235',
                color: '#f1f3f9',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#4f62f7', secondary: '#fff' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
