import { google } from 'googleapis'

// 서비스 계정으로 Google Sheets 인증
function getAuth() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'C:/raonwms/service-account.json',
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  })
  return auth
}

export async function getSheets() {
  const auth = await getAuth()
  return google.sheets({ version: 'v4', auth })
}

// ---- 공통 CRUD 함수 ----

// 시트에서 모든 행 읽기
export async function readSheet(spreadsheetId, sheetName = 'Sheet1') {
  const sheets = await getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  })
  const rows = res.data.values || []
  if (rows.length < 2) return []

  const headers = rows[0]
  return rows.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i] || '' })
    return obj
  })
}

// 시트에 새 행 추가
export async function appendRow(spreadsheetId, sheetName, rowData) {
  const sheets = await getSheets()
  // 헤더 읽기
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  })
  const headers = headerRes.data.values?.[0] || []
  const row = headers.map(h => rowData[h] ?? '')

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}

// ID로 행 찾아서 업데이트
export async function updateRow(spreadsheetId, sheetName, id, updateData) {
  const sheets = await getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  })
  const rows = res.data.values || []
  if (rows.length < 2) return

  const headers = rows[0]
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
}

// ID 생성 (타임스탬프 기반)
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}
