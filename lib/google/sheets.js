import { google } from 'googleapis'

function getAuth() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  })
  return auth
}

export function getSheets() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

// ── 30초 TTL 인메모리 캐시 (Quota 방지) ──
const cache = new Map()
const CACHE_TTL = 30 * 1000 // 30초

function getCacheKey(spreadsheetId, sheetName) {
  return `${spreadsheetId}::${sheetName}`
}

function getCache(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null }
  return entry.data
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() })
}

function invalidateCache(spreadsheetId, sheetName) {
  cache.delete(getCacheKey(spreadsheetId, sheetName))
}

// ---- 공통 CRUD 함수 ----

// 시트에서 모든 행 읽기 (캐시 적용)
export async function readSheet(spreadsheetId, sheetName = 'Sheet1') {
  const key = getCacheKey(spreadsheetId, sheetName)
  const cached = getCache(key)
  if (cached) return cached

  const sheets = await getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  })
  const rows = res.data.values || []
  if (rows.length < 2) { setCache(key, []); return [] }

  const headers = rows[0].map(h => h.trim())
  const data = rows.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i] || '' })
    return obj
  })
  setCache(key, data)
  return data
}

// 시트에 새 행 추가 (캐시 무효화)
export async function appendRow(spreadsheetId, sheetName, rowData) {
  const sheets = await getSheets()
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  })
  const headers = (headerRes.data.values?.[0] || []).map(h => h.trim())
  const row = headers.map(h => rowData[h] ?? '')

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
  invalidateCache(spreadsheetId, sheetName)
}

// ID로 행 찾아서 업데이트 (캐시 무효화)
export async function updateRow(spreadsheetId, sheetName, id, updateData) {
  const sheets = await getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  })
  const rows = res.data.values || []
  if (rows.length < 2) return

  const headers = rows[0].map(h => h.trim())
  const idIdx = headers.indexOf('id')
  const rowIdx = rows.findIndex((row, i) => i > 0 && row[idIdx] === String(id))
  if (rowIdx === -1) throw new Error('Row not found')

  const updatedRow = headers.map((h, i) => updateData[h] ?? rows[rowIdx][i] ?? '')
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${rowIdx + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [updatedRow] },
  })
  invalidateCache(spreadsheetId, sheetName)
}

// ID 생성 (타임스탬프 기반)
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}
