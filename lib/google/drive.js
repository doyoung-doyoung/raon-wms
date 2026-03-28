import { google } from 'googleapis'
import { Readable } from 'stream'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
}

export async function uploadPDFToDrive(pdfBuffer, fileName, folderName) {
  const auth = getAuth()
  const drive = google.drive({ version: 'v3', auth })

  // 폴더 찾기 또는 생성
  const folderRes = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  })

  let folderId
  if (folderRes.data.files.length > 0) {
    folderId = folderRes.data.files[0].id
  } else {
    const newFolder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    })
    folderId = newFolder.data.id
  }

  // PDF 업로드
  const stream = Readable.from(pdfBuffer)
  const uploaded = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: 'application/pdf',
      parents: [folderId],
    },
    media: {
      mimeType: 'application/pdf',
      body: stream,
    },
    fields: 'id, webViewLink',
  })

  return {
    fileId: uploaded.data.id,
    driveUrl: uploaded.data.webViewLink,
  }
}