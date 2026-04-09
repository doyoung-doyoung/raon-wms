'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const DEFAULT_HOLIDAYS = {
  2025: [
    { date: '2025-01-01', name: 'วันขึ้นปีใหม่ (새해)', enabled: true },
    { date: '2025-02-12', name: 'วันมาฆบูชา', enabled: true },
    { date: '2025-04-06', name: 'วันจักรี', enabled: true },
    { date: '2025-04-13', name: 'วันสงกรานต์', enabled: true },
    { date: '2025-04-14', name: 'วันสงกรานต์', enabled: true },
    { date: '2025-04-15', name: 'วันสงกรานต์', enabled: true },
    { date: '2025-05-01', name: 'วันแรงงาน (노동절)', enabled: true },
    { date: '2025-05-05', name: 'วันฉัตรมงคล', enabled: true },
    { date: '2025-06-03', name: 'วันเฉลิมพระชนมพรรษา', enabled: true },
    { date: '2025-07-10', name: 'วันอาสาฬหบูชา', enabled: true },
    { date: '2025-07-11', name: 'วันเข้าพรรษา', enabled: true },
    { date: '2025-07-28', name: 'วันเฉลิมพระชนมพรรษา ร.10', enabled: true },
    { date: '2025-08-12', name: 'วันแม่แห่งชาติ', enabled: true },
    { date: '2025-10-13', name: 'วันนวมินทรมหาราช', enabled: true },
    { date: '2025-10-23', name: 'วันปิยมหาราช', enabled: true },
    { date: '2025-12-05', name: 'วันพ่อแห่งชาติ', enabled: true },
    { date: '2025-12-10', name: 'วันรัฐธรรมนูญ', enabled: true },
    { date: '2025-12-31', name: 'วันสิ้นปี', enabled: true },
  ],
  2026: [
    { date: '2026-01-01', name: 'วันขึ้นปีใหม่ (새해)', enabled: true },
    { date: '2026-02-05', name: 'วันมาฆบูชา', enabled: true },
    { date: '2026-04-06', name: 'วันจักรี', enabled: true },
    { date: '2026-04-13', name: 'วันสงกรานต์', enabled: true },
    { date: '2026-04-14', name: 'วันสงกรานต์', enabled: true },
    { date: '2026-04-15', name: 'วันสงกรานต์', enabled: true },
    { date: '2026-05-01', name: 'วันแรงงาน (노동절)', enabled: true },
    { date: '2026-05-04', name: 'วันฉัตรมงคล', enabled: true },
    { date: '2026-06-03', name: 'วันเฉลิมพระชนมพรรษา', enabled: true },
    { date: '2026-07-06', name: 'วันอาสาฬหบูชา', enabled: true },
    { date: '2026-07-07', name: 'วันเข้าพรรษา', enabled: true },
    { date: '2026-07-28', name: 'วันเฉลิมพระชนมพรรษา ร.10', enabled: true },
    { date: '2026-08-12', name: 'วันแม่แห่งชาติ', enabled: true },
    { date: '2026-10-13', name: 'วันนวมินทรมหาราช', enabled: true },
    { date: '2026-10-23', name: 'วันปิยมหาราช', enabled: true },
    { date: '2026-12-05', name: 'วันพ่อแห่งชาติ', enabled: true },
    { date: '2026-12-10', name: 'วันรัฐธรรมนูญ', enabled: true },
    { date: '2026-12-31', name: 'วันสิ้นปี', enabled: true },
  ],
}

const DEFAULT_MENU_SETTINGS = {
  announcements: { label: '📢 공지사항', visible: true },
  attendance:    { label: '⏰ 출퇴근', visible: true },
  leaves:        { label: '🗓️ 휴가/병가', visible: true },
  expenses:      { label: '💰 경비 청구', visible: true },
  documents:     { label: '📄 내 서류함', visible: true },
  warnings:      { label: '⚠️ 경고장', visible: false },
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('menu')
  const [menuSettings, setMenuSettings] = useState(DEFAULT_MENU_SETTINGS)
  const [selectedYear, setSelectedYear] = useState(2026)
  const [holidays, setHolidays] = useState(DEFAULT_HOLIDAYS)
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' })
  const [saved, setSaved] = useState(false)
  const [officeLocation, setOfficeLocation] = useState({ lat: '13.8199', lng: '100.5601', radius: 20, enabled: false })
  const [checkInTime, setCheckInTime]   = useState('09:00')
  const [checkOutTime, setCheckOutTime] = useState('18:00')

  // 퇴사 처리
  const [employees, setEmployees] = useState([])
  const [loadingEmp, setLoadingEmp] = useState(false)
  const [resignForm, setResignForm] = useState({ employeeId: '', employeeName: '', resignDate: '', reason: '' })
  const [resignDone, setResignDone] = useState(false)

  // 관리자 설정
  const [adminEmails, setAdminEmails] = useState([
    { email: session?.user?.email || '', name: session?.user?.name || '', role: '이사', addedAt: '2026-01-01' }
  ])
  const [newAdmin, setNewAdmin] = useState({ email: '', name: '', role: '이사' })

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.isAdmin)) {
      router.push('/dashboard')
    }
    if (session?.user?.email) {
      setAdminEmails([{ email: session.user.email, name: session.user.name, role: '이사', addedAt: '2026-01-01' }])
    }
  }, [status, session, router])

  useEffect(() => {
    if (activeTab === 'resignation') fetchEmployees()
  }, [activeTab])

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.menuItems) {
        const newSettings = { ...DEFAULT_MENU_SETTINGS }
        Object.keys(data.menuItems).forEach(k => {
          if (newSettings[k]) newSettings[k] = { ...newSettings[k], visible: data.menuItems[k].visible }
        })
        setMenuSettings(newSettings)
      }
      if (data.officeLocation) setOfficeLocation(data.officeLocation)
      if (data.checkInTime)  setCheckInTime(data.checkInTime)
      if (data.checkOutTime) setCheckOutTime(data.checkOutTime)
    }).catch(() => {})
  }, [])

  const fetchEmployees = async () => {
    setLoadingEmp(true)
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      setEmployees(Array.isArray(data) ? data.filter(e => e.status !== 'inactive') : [])
    } catch (e) { console.error(e) }
    setLoadingEmp(false)
  }

  const handleSave = async () => {
    const menuItems = {}
    Object.keys(menuSettings).forEach(k => {
      menuItems[k] = { visible: menuSettings[k].visible }
    })
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuItems, officeLocation, checkInTime, checkOutTime }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) return alert('GPS를 지원하지 않습니다.')
    navigator.geolocation.getCurrentPosition(pos => {
      setOfficeLocation(prev => ({ ...prev, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }))
    }, () => alert('위치를 가져올 수 없습니다.'))
  }

  const parseGoogleMapsUrl = (url) => {
    // Patterns: @lat,lng,zoom or ?q=lat,lng or /place/.../@lat,lng
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (atMatch) {
      setOfficeLocation(prev => ({ ...prev, lat: atMatch[1], lng: atMatch[2] }))
      return
    }
    const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (qMatch) {
      setOfficeLocation(prev => ({ ...prev, lat: qMatch[1], lng: qMatch[2] }))
      return
    }
    alert('좌표를 찾을 수 없습니다. 링크를 확인해주세요.')
  }

  const toggleMenu = (key, field) => {
    setMenuSettings(prev => ({ ...prev, [key]: { ...prev[key], [field]: !prev[key][field] } }))
  }

  const toggleHoliday = (year, idx) => {
    setHolidays(prev => ({ ...prev, [year]: prev[year].map((h, i) => i === idx ? { ...h, enabled: !h.enabled } : h) }))
  }

  const deleteHoliday = (year, idx) => {
    setHolidays(prev => ({ ...prev, [year]: prev[year].filter((_, i) => i !== idx) }))
  }

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) return
    setHolidays(prev => ({
      ...prev,
      [selectedYear]: [...(prev[selectedYear] || []), { ...newHoliday, enabled: true }].sort((a, b) => a.date.localeCompare(b.date))
    }))
    setNewHoliday({ date: '', name: '' })
  }

  const handleResign = async () => {
    if (!resignForm.employeeId || !resignForm.resignDate) return
    try {
      await fetch('/api/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resignForm.employeeId,
          status: 'inactive',
          resign_date: resignForm.resignDate,
          resign_reason: resignForm.reason,
        }),
      })
      setResignDone(true)
      setResignForm({ employeeId: '', employeeName: '', resignDate: '', reason: '' })
      fetchEmployees()
      setTimeout(() => setResignDone(false), 3000)
    } catch (e) { console.error(e) }
  }

  const addAdmin = () => {
    if (!newAdmin.email || !newAdmin.name) return
    setAdminEmails(prev => [...prev, { ...newAdmin, addedAt: new Date().toISOString().slice(0, 10) }])
    setNewAdmin({ email: '', name: '', role: '이사' })
  }

  const removeAdmin = (email) => {
    if (adminEmails.length <= 1) { alert('최소 1명의 관리자가 필요합니다.'); return }
    setAdminEmails(prev => prev.filter(a => a.email !== email))
  }

  const yearHolidays = holidays[selectedYear] || []
  const enabledCount = yearHolidays.filter(h => h.enabled).length

  const tabs = [
    { key: 'menu',        label: '🔧 메뉴 설정' },
    { key: 'holidays',    label: '🗓️ 공휴일' },
    { key: 'policy',      label: '📋 휴가 정책' },
    { key: 'resignation', label: '🚪 퇴사 처리' },
    { key: 'admins',      label: '👑 관리자' },
    { key: 'company',     label: '🏢 회사 정보' },
  ]

  if (status === 'loading') return null

  const inputStyle = { width: '100%', background: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#f1f3f9', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>⚙️ 설정</h1>
          <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>관리자 전용 시스템 설정</p>
        </div>
        <button onClick={handleSave} style={{
          padding: '9px 24px',
          background: saved ? 'rgba(34,197,94,0.15)' : '#4f62f7',
          color: saved ? '#4ade80' : '#fff',
          border: saved ? '1px solid rgba(34,197,94,0.3)' : 'none',
          borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {saved ? '✓ 저장됨' : '저장'}
        </button>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#1e2235', borderRadius: 10, padding: 4, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '7px 14px', border: 'none', borderRadius: 7,
            background: activeTab === tab.key ? '#4f62f7' : 'transparent',
            color: activeTab === tab.key ? '#fff' : '#8b91ab',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== 메뉴 설정 ===== */}
      {activeTab === 'menu' && (
        <div>
          <div style={{ background: 'rgba(79,98,247,0.06)', border: '1px solid rgba(79,98,247,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#818cf8' }}>
            💡 직원에게 보이는 메뉴를 숨기거나 비활성화할 수 있습니다. 관리자에게는 항상 표시됩니다.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {Object.entries(menuSettings).map(([key, setting]) => (
              <div key={key} style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 16 }}>{setting.label.split(' ')[0]}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9' }}>{setting.label.split(' ').slice(1).join(' ')}</div>
                    <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 2 }}>직원 메뉴에 표시</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#8b91ab' }}>표시</span>
                  <div onClick={() => toggleMenu(key, 'visible')} style={{ width: 40, height: 22, borderRadius: 11, cursor: 'pointer', background: setting.visible ? '#4f62f7' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.2s' }}>
                    <div style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'all 0.2s', left: setting.visible ? 21 : 3 }} />
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, background: setting.visible ? 'rgba(34,197,94,0.1)' : 'rgba(139,145,171,0.1)', color: setting.visible ? '#4ade80' : '#8b91ab' }}>
                    {setting.visible ? '표시 중' : '숨김'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 출퇴근 시간 설정 */}
          <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', margin: '0 0 4px' }}>⏰ 출퇴근 시간 기준</h3>
            <p style={{ fontSize: 12, color: '#8b91ab', marginTop: 0, marginBottom: 20 }}>리포트 지각/조기퇴근 집계 기준 시간</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 8, fontWeight: 600 }}>출근 시간</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={e => setCheckInTime(e.target.value)}
                    style={{ ...inputStyle, width: 130, fontSize: 18, fontWeight: 700, textAlign: 'center', padding: '10px 14px' }}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: '#f1f3f9', fontWeight: 500 }}>{checkInTime} 이후 = 지각</div>
                    <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 2 }}>기본값: 09:00</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 8, fontWeight: 600 }}>퇴근 시간</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={e => setCheckOutTime(e.target.value)}
                    style={{ ...inputStyle, width: 130, fontSize: 18, fontWeight: 700, textAlign: 'center', padding: '10px 14px' }}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: '#f1f3f9', fontWeight: 500 }}>{checkOutTime} 이전 = 조기퇴근</div>
                    <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 2 }}>기본값: 18:00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GPS 사무실 위치 설정 */}
          <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', margin: 0 }}>📍 사무실 위치 인증 (출퇴근)</h3>
                <p style={{ fontSize: 12, color: '#8b91ab', marginTop: 4 }}>활성화하면 지정 반경 안에서만 출퇴근 가능</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#8b91ab' }}>{officeLocation.enabled ? '활성' : '비활성'}</span>
                <div onClick={() => setOfficeLocation(p => ({ ...p, enabled: !p.enabled }))} style={{ width: 40, height: 22, borderRadius: 11, cursor: 'pointer', background: officeLocation.enabled ? '#22c55e' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.2s' }}>
                  <div style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'all 0.2s', left: officeLocation.enabled ? 21 : 3 }} />
                </div>
              </div>
            </div>

            {/* Google Maps 링크 붙여넣기 */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>Google Maps 링크 붙여넣기</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="https://maps.google.com/... 또는 좌표 링크"
                  style={{ ...inputStyle, flex: 1 }}
                  onPaste={e => {
                    e.preventDefault()
                    const text = e.clipboardData.getData('text')
                    parseGoogleMapsUrl(text)
                  }}
                  onChange={() => {}}
                  value=""
                />
                <button onClick={detectCurrentLocation} style={{ padding: '8px 14px', background: 'rgba(79,98,247,0.15)', border: '1px solid rgba(79,98,247,0.3)', borderRadius: 8, color: '#818cf8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  📍 현재 위치
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>Google Maps에서 위치 공유 → 링크 복사 후 위 입력란에 붙여넣기</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>위도 (Latitude)</div>
                <input value={officeLocation.lat} onChange={e => setOfficeLocation(p => ({ ...p, lat: e.target.value }))} style={inputStyle} placeholder="13.8199" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>경도 (Longitude)</div>
                <input value={officeLocation.lng} onChange={e => setOfficeLocation(p => ({ ...p, lng: e.target.value }))} style={inputStyle} placeholder="100.5601" />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>허용 반경 (미터) — 현재: {officeLocation.radius}m</div>
              <input type="range" min="10" max="200" step="5" value={officeLocation.radius}
                onChange={e => setOfficeLocation(p => ({ ...p, radius: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#4f62f7' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8b91ab', marginTop: 2 }}>
                <span>10m (정밀)</span><span style={{ color: '#4f62f7', fontWeight: 600 }}>{officeLocation.radius}m</span><span>200m (넓게)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 공휴일 관리 ===== */}
      {activeTab === 'holidays' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[2025, 2026, 2027].map(y => (
                <button key={y} onClick={() => setSelectedYear(y)} style={{ padding: '6px 16px', border: 'none', borderRadius: 8, background: selectedYear === y ? '#4f62f7' : '#1e2235', color: selectedYear === y ? '#fff' : '#8b91ab', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{y}년</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ label: '총 공휴일', value: yearHolidays.length, color: '#4f62f7' }, { label: '적용 중', value: enabledCount, color: '#4ade80' }, { label: '비활성', value: yearHolidays.length - enabledCount, color: '#f87171' }].map(item => (
                <div key={item.label} style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: '#8b91ab' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 공휴일 추가 */}
          <div style={{ background: '#141828', border: '1px solid rgba(79,98,247,0.2)', borderRadius: 14, padding: '16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#8b91ab', marginBottom: 4 }}>날짜</label>
              <input type="date" value={newHoliday.date} onChange={e => setNewHoliday(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#8b91ab', marginBottom: 4 }}>공휴일 이름</label>
              <input type="text" value={newHoliday.name} onChange={e => setNewHoliday(p => ({ ...p, name: e.target.value }))} placeholder="예: วันหยุดพิเศษ" style={inputStyle} />
            </div>
            <button onClick={addHoliday} style={{ padding: '8px 16px', background: '#4f62f7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>+ 추가</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {yearHolidays.map((holiday, idx) => (
              <div key={idx} style={{ background: '#141828', border: `1px solid ${holiday.enabled ? 'rgba(255,255,255,0.07)' : 'rgba(239,68,68,0.15)'}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: holiday.enabled ? 1 : 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#818cf8', minWidth: 90 }}>{holiday.date}</div>
                  <div style={{ fontSize: 13, color: '#f1f3f9' }}>{holiday.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div onClick={() => toggleHoliday(selectedYear, idx)} style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', background: holiday.enabled ? '#4f62f7' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.2s' }}>
                    <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'all 0.2s', left: holiday.enabled ? 18 : 2 }} />
                  </div>
                  <button onClick={() => deleteHoliday(selectedYear, idx)} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '3px 8px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 휴가 정책 ===== */}
      {activeTab === 'policy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#fbbf24' }}>
            ⚠️ 태국 노동법 기준으로 설정되어 있습니다. 변경 시 주의하세요.
          </div>
          {[
            { label: '🌴 연차 시작 일수', value: '6', sub: '입사 1년차 기본 연차' },
            { label: '📈 연차 증가 일수', value: '1', sub: '매년 추가되는 연차 일수' },
            { label: '📅 연차 최대 일수', value: '20', sub: '연차 최대 한도' },
            { label: '🏥 병가 유급 한도', value: '30', sub: '연간 유급 병가 일수' },
            { label: '🌸 경조사 유급 한도', value: '3', sub: '연간 유급 경조사 일수' },
            { label: '📢 휴가 사전 신청일', value: '5', sub: '최소 사전 신청 일수' },
            { label: '🏥 진단서 필요 일수', value: '3', sub: '병가 진단서 제출 기준' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#8b91ab' }}>{item.sub}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" defaultValue={item.value} style={{ width: 70, background: '#1e2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: '#f1f3f9', fontSize: 14, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
                <span style={{ fontSize: 13, color: '#8b91ab' }}>일</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== 퇴사 처리 ===== */}
      {activeTab === 'resignation' && (
        <div>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#f87171' }}>
            ⚠️ 퇴사 처리 후 직원은 시스템에 로그인할 수 없습니다. 신중하게 처리해주세요.
          </div>

          {resignDone && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#4ade80' }}>
              ✓ 퇴사 처리가 완료되었습니다.
            </div>
          )}

          <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f3f9', margin: '0 0 20px' }}>🚪 퇴사 처리</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 6 }}>직원 선택 *</label>
                {loadingEmp ? (
                  <div style={{ color: '#8b91ab', fontSize: 13 }}>불러오는 중...</div>
                ) : (
                  <select
                    value={resignForm.employeeId}
                    onChange={e => {
                      const emp = employees.find(emp => emp.id === e.target.value)
                      setResignForm(p => ({ ...p, employeeId: e.target.value, employeeName: emp?.name_ko || emp?.name_th || '' }))
                    }}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">직원을 선택하세요</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name_ko || emp.name_th} — {emp.position}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 6 }}>퇴사일 *</label>
                <input type="date" value={resignForm.resignDate} onChange={e => setResignForm(p => ({ ...p, resignDate: e.target.value }))} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 6 }}>퇴사 사유</label>
                <textarea value={resignForm.reason} onChange={e => setResignForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="퇴사 사유를 입력하세요..." rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {resignForm.employeeId && resignForm.resignDate && (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
                  <div style={{ color: '#f87171', fontWeight: 600, marginBottom: 4 }}>⚠️ 처리 확인</div>
                  <div style={{ color: '#c4c7d6' }}>
                    <strong>{resignForm.employeeName}</strong> 직원을 <strong>{resignForm.resignDate}</strong>부로 퇴사 처리합니다.
                  </div>
                </div>
              )}

              <button
                onClick={handleResign}
                disabled={!resignForm.employeeId || !resignForm.resignDate}
                style={{
                  padding: '11px', background: !resignForm.employeeId || !resignForm.resignDate ? 'rgba(239,68,68,0.3)' : '#ef4444',
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: !resignForm.employeeId || !resignForm.resignDate ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}>
                🚪 퇴사 처리 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 관리자 설정 ===== */}
      {activeTab === 'admins' && (
        <div>
          <div style={{ background: 'rgba(79,98,247,0.06)', border: '1px solid rgba(79,98,247,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#818cf8' }}>
            💡 관리자로 등록된 이메일은 모든 직원 정보와 관리 기능에 접근할 수 있습니다.
          </div>

          {/* 현재 관리자 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {adminEmails.map((admin, idx) => (
              <div key={idx} style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #4f62f7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700 }}>
                    {admin.name?.[0] || '👑'}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9' }}>{admin.name}</div>
                    <div style={{ fontSize: 12, color: '#8b91ab' }}>{admin.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, background: 'rgba(79,98,247,0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                    👑 {admin.role}
                  </span>
                  <span style={{ fontSize: 11, color: '#8b91ab' }}>{admin.addedAt}</span>
                  {adminEmails.length > 1 && (
                    <button onClick={() => removeAdmin(admin.email)} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '3px 8px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 관리자 추가 */}
          <div style={{ background: '#141828', border: '1px solid rgba(79,98,247,0.2)', borderRadius: 14, padding: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f3f9', margin: '0 0 16px' }}>+ 관리자 추가</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8b91ab', marginBottom: 4 }}>이름</label>
                <input type="text" value={newAdmin.name} onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))} placeholder="이사 이름" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8b91ab', marginBottom: 4 }}>Google 이메일 *</label>
                <input type="email" value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} placeholder="admin@company.com" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#8b91ab', marginBottom: 4 }}>역할</label>
              <select value={newAdmin.role} onChange={e => setNewAdmin(p => ({ ...p, role: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="이사">이사</option>
                <option value="매니저">매니저</option>
                <option value="HR담당">HR담당</option>
              </select>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#fbbf24' }}>
              ⚠️ 추가 후 반드시 <code>.env.local</code> 의 <code>ADMIN_EMAIL</code> 도 업데이트해야 합니다.
            </div>
            <button onClick={addAdmin} disabled={!newAdmin.email || !newAdmin.name} style={{
              width: '100%', padding: '10px', background: !newAdmin.email || !newAdmin.name ? 'rgba(79,98,247,0.3)' : '#4f62f7',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: !newAdmin.email || !newAdmin.name ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              👑 관리자 추가
            </button>
          </div>
        </div>
      )}

      {/* ===== 회사 정보 ===== */}
      {activeTab === 'company' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: '회사명 (한국어)', defaultValue: 'RAON' },
            { label: '회사명 (전체)', defaultValue: 'RAON Co., Ltd.' },
            { label: '주소 1', defaultValue: '2901-2907, 349 SJ INFINITE ONE BUSINESS COMPLEX TOWER 29th Floor,' },
            { label: '주소 2', defaultValue: 'VIBHAVADI RANGSIT ROAD, CHOM PHON, CHATUCHAK, BANGKOK 10900' },
            { label: '세금 ID', defaultValue: '0105566006796' },
            { label: '전화번호', defaultValue: '+66621247979' },
            { label: '이메일', defaultValue: 'raonthailand23@gmail.com' },
            { label: '이사 이름', defaultValue: 'น.ส. โดยอง จอง' },
          ].map((item, i) => (
            <div key={i}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 6 }}>{item.label}</label>
              <input type="text" defaultValue={item.defaultValue} style={inputStyle} />
            </div>
          ))}

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 6 }}>이사 서명 이미지</label>
            <div style={{ background: '#141828', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 10, padding: '24px', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => document.getElementById('sig-upload').click()}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✍️</div>
              <div style={{ fontSize: 13, color: '#8b91ab' }}>서명 이미지 업로드 (PNG/JPG)</div>
              <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>클릭하거나 파일을 드래그하세요</div>
              <input id="sig-upload" type="file" accept="image/*" style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
