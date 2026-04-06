import { auth } from '../../auth/[...nextauth]/route'
import { uploadFileToDrive } from '../../../../lib/google/drive'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) return Response.json({ error: '파일이 없습니다.' }, { status: 400 })

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return Response.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'JPG, PNG, PDF 파일만 업로드 가능합니다.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()
    const fileName = `receipt_${session.user.email}_${Date.now()}.${ext}`

    try {
      const { fileId, viewUrl, downloadUrl } = await uploadFileToDrive(
        buffer, fileName, file.type
      )
      return Response.json({ success: true, fileId, viewUrl, downloadUrl })
    } catch (driveErr) {
      // Drive API 비활성화 시 → 파일명만 반환 (관리자가 수동 확인)
      console.warn('Drive 업로드 실패 (API 비활성화):', driveErr.message)
      return Response.json({
        success: true,
        driveDisabled: true,
        viewUrl: null,
        fileName: file.name,
        message: 'Google Drive API가 비활성화되어 있습니다. 영수증 파일명만 저장됩니다.',
      })
    }
  } catch (error) {
    console.error('영수증 업로드 에러:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
