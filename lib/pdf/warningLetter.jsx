import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { DocHeader, Watermark } from './utils.jsx'
import path from 'path'

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Sarabun', position: 'relative' },
  date: { textAlign: 'right', fontSize: 9, color: '#666666', marginBottom: 8 },
  docTitle: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
  docSubTitle: { textAlign: 'center', fontSize: 9, color: '#666666', marginBottom: 12 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: '#cccccc', marginTop: 4, marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 5 },
  rowLabel: { width: 120, fontSize: 10, color: '#555555' },
  rowValue: { flex: 1, fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 5, marginTop: 2 },
  reasonBox: {
    backgroundColor: '#fff5f5',
    borderWidth: 1, borderColor: '#ffcccc', borderStyle: 'solid',
    borderRadius: 4, padding: 8, marginBottom: 8,
  },
  reasonRow: { flexDirection: 'row', marginBottom: 4 },
  reasonNum: { width: 16, fontSize: 10, color: '#cc0000', fontWeight: 'bold' },
  reasonText: { flex: 1, fontSize: 10, lineHeight: 1.5 },
  bodyText: { fontSize: 10, lineHeight: 1.7, marginBottom: 4, marginLeft: 20 },
  sigArea: { marginTop: 16, alignItems: 'center' },
  sigLabel: { fontSize: 9, color: '#666666', marginBottom: 4, textAlign: 'center', width: 180 },
  sigImage: { width: 90, height: 45, objectFit: 'contain', marginBottom: 2, alignSelf: 'center' },
  sigLine: { borderBottomWidth: 1, borderBottomColor: '#aaaaaa', width: 180, marginBottom: 3 },
  sigName: { fontSize: 10, textAlign: 'center', width: 180 },
  sigRole: { fontSize: 9, color: '#666666', textAlign: 'center', width: 180 },
})

export default function WarningLetterPDF({ data }) {
  const { issueDate, employeeName, employeeNameEn, position, startDate, address, warningNumber, reason1, reason2, reason3, directorName, directorRole } = data
  const sigPath = path.join(process.cwd(), 'public', 'signature.jpg')
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th']
  const warningOrdinal = ordinals[warningNumber - 1] || `${warningNumber}th`
  const warningLabelTh = warningNumber === 1 ? 'ครั้งที่ 1' : warningNumber === 2 ? 'ครั้งที่ 2' : 'ครั้งที่ ' + warningNumber
  const displayName = employeeNameEn ? `${employeeName} (${employeeNameEn})` : (employeeName || '')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark />
        <DocHeader />
        <Text style={styles.date}>{issueDate}</Text>
        <Text style={styles.docTitle}>{'หนังสือเตือน (' + warningLabelTh + ')'}</Text>
        <Text style={styles.docSubTitle}>{'Warning Letter (' + warningOrdinal + ' Warning)'}</Text>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>{'เรียน / To'}</Text>
          <Text style={styles.rowValue}>{displayName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{'ตำแหน่ง / Position'}</Text>
          <Text style={styles.rowValue}>{position || ''}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{'วันเริ่มงาน / Start Date'}</Text>
          <Text style={styles.rowValue}>{startDate || ''}</Text>
        </View>
        {!!address && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{'ที่อยู่ / Address'}</Text>
            <Text style={styles.rowValue}>{address}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.bodyText}>{'บริษัท ราอน (ไทยแลนด์) จำกัด ขอแจ้งให้ท่านทราบว่า ท่านได้กระทำการอันเป็นการละเมิดระเบียบและข้อบังคับของบริษัท\u00A0'}</Text>
        <Text style={styles.bodyText}>{'ทั้งนี้ รายละเอียดของการกระทำดังกล่าวมีดังต่อไปนี้\u00A0'}</Text>

        <Text style={styles.sectionTitle}>{'สาเหตุการออกหนังสือเตือน / Reason for Warning:'}</Text>
        <View style={styles.reasonBox}>
          {!!reason1 && (
            <View style={styles.reasonRow}>
              <Text style={styles.reasonNum}>{'1.'}</Text>
              <Text style={styles.reasonText}>{reason1 + '\u00A0'}</Text>
            </View>
          )}
          {!!reason2 && (
            <View style={styles.reasonRow}>
              <Text style={styles.reasonNum}>{'2.'}</Text>
              <Text style={styles.reasonText}>{reason2 + '\u00A0'}</Text>
            </View>
          )}
          {!!reason3 && (
            <View style={styles.reasonRow}>
              <Text style={styles.reasonNum}>{'3.'}</Text>
              <Text style={styles.reasonText}>{reason3 + '\u00A0'}</Text>
            </View>
          )}
        </View>

        <Text style={styles.bodyText}>{'บริษัทขอให้ท่านปรับปรุงพฤติกรรมดังกล่าวโดยเร็ว หากท่านยังคงกระทำการในลักษณะดังกล่าวซ้ำอีก\u00A0'}</Text>
        <Text style={styles.bodyText}>{'ขอสงวนสิทธิ์ในการดำเนินการตามระเบียบและข้อบังคับของบริษัทอย่างเคร่งครัดต่อไป\u00A0'}</Text>
        <Text style={styles.bodyText}>{'หนังสือเตือนฉบับนี้ถือเป็นส่วนหนึ่งของบันทึกการจ้างงานของท่าน \u00A0'}</Text>

        <View style={styles.sigArea}>
          <Text style={styles.sigLabel}>{'กรรมการบริษัท / Authorized Signatory'}</Text>
          <Image style={styles.sigImage} src={sigPath} />
          <View style={styles.sigLine} />
          <Text style={styles.sigName}>{directorName || ''}</Text>
          <Text style={styles.sigRole}>{directorRole || 'กรรมการบริษัท (Managing Director)'}</Text>
        </View>
      </Page>
    </Document>
  )
}
