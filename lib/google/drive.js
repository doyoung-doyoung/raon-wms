import { google } from 'googleapis'
import { Readable } from 'stream'

function getAuth() {
  return new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  })
}

// 파일을 Google Drive에 업로드하고 공유 URL 반환
export async function uploadFileToDrive(buffer, fileName, mimeType, folderId) {
  const auth = await getAuth()
  const drive = google.drive({ version: 'v3', auth })

  const targetFolder = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID

  const stream = Readable.from(buffer)

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: targetFolder ? [targetFolder] : [],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink, webContentLink',
  })

  const fileId = res.data.id

  // 누구나 볼 수 있도록 권한 설정
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  return {
    fileId,
    viewUrl: res.data.webViewLink,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
  }
}

// PDF 업로드 (기존 코드 호환)
export async function uploadPDFToDrive(pdfBuffer, fileName) {
  try {
    const result = await uploadFileToDrive(pdfBuffer, fileName, 'application/pdf')
    return {
      fileId: result.fileId,
      driveUrl: result.viewUrl,
      pdfBuffer,
    }
  } catch (err) {
    console.error('Drive PDF 업로드 실패:', err.message)
    return { fileId: null, driveUrl: null, pdfBuffer }
  }
}
