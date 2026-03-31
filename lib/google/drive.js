// Drive 업로드 대신 buffer 그대로 반환
export async function uploadPDFToDrive(pdfBuffer, fileName, folderName) {
  // 서비스 계정 Drive 저장공간 없음 → 이메일 첨부로 대체
  return {
    fileId: null,
    driveUrl: null,
    pdfBuffer, // buffer 그대로 반환
  }
}