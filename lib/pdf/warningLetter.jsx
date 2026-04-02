import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { DocHeader, Watermark } from './utils.jsx'
import path from 'path'

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 11, fontFamily: 'Sarabun', position: 'relative' },
  date: { textAlign: 'right', fontSize: 10, color: '#666666', marginBottom: 16 },
  docTitle: { textAlign: 'center', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  docSubTitle: { textAlign: 'center', fontSize: 10, color: '#666666', marginBottom: 20 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: '#cccccc', marginTop: 8, marginBottom: 14 },
  row: { flexDirection: 'row', marginBottom: 8 },
  rowLabel: { width: 90, fontSize: 11, color: '#555555' },
  rowValue: { flex: 1, fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, marginTop: 4 },
  reasonBox: {
    backgroundColor: '#fff5f5',
    borderWidth: 1, borderColor: '#ffcccc', borderStyle: 'solid',
    borderRadius: 4, padding: 10, marginBottom: 14,
  },
  reasonRow: { flexDirection: 'row', marginBottom: 6 },
  reasonNum: { width: 18, fontSize: 11, color: '#cc0000', fontWeight: 'bold' },
  reasonText: { flex: 1, fontSize: 11, lineHeight: 1.6 },
  bodyText: { fontSize: 11, lineHeight: 1.9, marginBottom: 10, textIndent: 28 },
  sigArea: { marginTop: 36, alignItems: 'center' },
  sigLabel: { fontSize: 10, color: '#666666', marginBottom: 8, textAlign: 'center', width: 180 },
  sigImage: { width: 100, height: 50, objectFit: 'contain', marginBottom: 2, alignSelf: 'center' },
  sigLine: { borderBottomWidth: 1, borderBottomColor: '#aaaaaa', width: 180, marginBottom: 4 },
  sigName: { fontSize: 10, textAlign: 'center', width: 180 },
  sigRole: { fontSize: 9, color: '#666666', textAlign: 'center', width: 180 },
})

export default function WarningLetterPDF({ data }) {
  const { issueDate, employeeName, employeeNameEn, position, startDate, address, warningNumber, reason1, reason2, reason3, directorName, directorRole } = data
  const sigPath = path.join(process.cwd(), 'public', 'signature.jpg')
  const warningLabel = warningNumber === 1 ? '1차' : warningNumber === 2 ? '2차' : warningNumber + '차'
  const warningLabelTh = warningNumber === 1 ? 'ครั้งที่ 1' : warningNumber === 2 ? 'ครั้งที่ 2' : 'ครั้งที่ ' + warningNumber

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark />
        <DocHeader />
        <Text style={styles.date}>{issueDate}</Text>
        <Text style={styles.docTitle}>หนังสือเตือน ({warningLabelTh})</Text>
        <Text style={styles.docSubTitle}>Warning Letter ({warningLabel} Warning) / 경고장 ({warningLabel})</Text>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>เรียน / 수신</Text>
          <Text style={styles.rowValue}>{employeeName}{employeeNameEn ? ' (' + employeeNameEn + ')' : ''}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>ตำแหน่ง / 직책</Text>
          <Text style={styles.rowValue}>{position}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>วันที่เริ่มงาน / 입사일</Text>
          <Text style={styles.rowValue}>{startDate}</Text>
        </View>
        {!!address && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>ที่อยู่ / 주소</Text>
            <Text style={styles.rowValue}>{address}</Text>
          </View>
        )}
        <View style={styles.divider} />
        <Text style={styles.bodyText}>
          บริษัท ราอน(ไทยแลนด์) จำกัด ขอแจ้งให้ท่านทราบว่า ท่านได้กระทำการอันเป็นการละเมิดระเบียบและข้อบังคับของบริษัท ดังรายละเอียดต่อไปนี้
        </Text>
        <Text style={styles.sectionTitle}>สาเหตุการออกหนังสือเตือน / 경고 사유:</Text>
        <View style={styles.reasonBox}>
          {!!reason1 && (
            <View style={styles.reasonRow}>
              <Text style={styles.reasonNum}>1.</Text>
              <Text style={styles.reasonText}>{reason1}</Text>
            </View>
          )}
          {!!reason2 && (
            <View style={styles.reasonRow}>
              <Text style={styles.reasonNum}>2.</Text>
              <Text style={styles.reasonText}>{reason2}</Text>
            </View>
          )}
          {!!reason3 && (
            <View style={styles.reasonRow}>
              <Text style={styles.reasonNum}>3.</Text>
              <Text style={styles.reasonText}>{reason3}</Text>
            </View>
          )}
        </View>
        <Text style={styles.bodyText}>
          บริษัทขอให้ท่านปรับปรุงพฤติกรรมดังกล่าวโดยเร็ว หากท่านยังคงกระทำการดังกล่าวซ้ำอีก บริษัทขอสงวนสิทธิ์ในการดำเนินการตามระเบียบของบริษัทอย่างเคร่งครัด
        </Text>
        <Text style={styles.bodyText}>
          หนังสือเตือนฉบับนี้ถือเป็นส่วนหนึ่งของบันทึกการจ้างงานของท่าน / 이 경고장은 귀하의 고용 기록의 일부로 보관됩니다.
        </Text>
        <View style={styles.sigArea}>
          <Text style={styles.sigLabel}>กรรมการบริษัท / Authorized Signatory</Text>
          <Image style={styles.sigImage} src={sigPath} />
          <View style={styles.sigLine} />
          <Text style={styles.sigName}>{directorName}</Text>
          <Text style={styles.sigRole}>{directorRole || 'กรรมการบริษัท (Managing Director)'}</Text>
        </View>
      </Page>
    </Document>
  )
}
