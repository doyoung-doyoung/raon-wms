import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { DocHeader, Watermark } from './utils.jsx'
import path from 'path'

const LEAVE_TYPE_TH = {
  annual:    'ลาพักร้อน',
  sick:      'ลาป่วย',
  personal:  'ลากิจ',
  maternity: 'ลาคลอด',
  other:     'ลาอื่นๆ',
}
const LEAVE_TYPE_EN = {
  annual:    'Annual Leave',
  sick:      'Sick Leave',
  personal:  'Personal Leave',
  maternity: 'Maternity Leave',
  other:     'Other Leave',
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Sarabun', position: 'relative' },
  date: { textAlign: 'right', fontSize: 9, color: '#666666', marginBottom: 8 },
  docTitle: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
  docSubTitle: { textAlign: 'center', fontSize: 9, color: '#666666', marginBottom: 10 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: '#cccccc', marginTop: 4, marginBottom: 10 },
  statusBadge: {
    alignSelf: 'center',
    backgroundColor: '#dcfce7',
    borderWidth: 1, borderColor: '#86efac', borderRadius: 20,
    paddingTop: 3, paddingBottom: 3, paddingLeft: 14, paddingRight: 14,
    marginBottom: 12,
  },
  statusText: { color: '#166534', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 0.5, borderColor: '#e2e8f0',
    borderRadius: 6, padding: 10, marginBottom: 10,
  },
  row: { flexDirection: 'row', marginBottom: 5 },
  label: { width: 130, fontSize: 10, color: '#64748b' },
  value: { flex: 1, fontSize: 10, fontWeight: 'bold' },
  detailBox: {
    borderWidth: 0.5, borderColor: '#e2e8f0',
    borderRadius: 6, marginBottom: 10,
  },
  detailHead: {
    backgroundColor: '#f1f5f9', padding: '5 10',
    fontSize: 9, fontWeight: 'bold', color: '#475569',
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: '5 10', borderTopWidth: 0.5, borderTopColor: '#e2e8f0',
    fontSize: 10,
  },
  detailLabel: { color: '#64748b' },
  detailValue: { fontWeight: 'bold' },
  highlight: { color: '#0f766e', fontWeight: 'bold' },
  noteBox: {
    backgroundColor: '#f0fdf4', borderWidth: 0.5, borderColor: '#86efac',
    borderRadius: 6, padding: 8, marginBottom: 10,
  },
  noteText: { fontSize: 9, color: '#166534', lineHeight: 1.5 },
  sigArea: { marginTop: 14, alignItems: 'center' },
  sigLabel: { fontSize: 10, color: '#666666', marginBottom: 6, textAlign: 'center', width: 180 },
  sigImage: { width: 100, height: 50, objectFit: 'contain', marginBottom: 2, alignSelf: 'center' },
  sigLine: { borderBottomWidth: 1, borderBottomColor: '#aaaaaa', width: 180, marginBottom: 4 },
  sigName: { fontSize: 10, textAlign: 'center', width: 180 },
  sigRole: { fontSize: 9, color: '#666666', textAlign: 'center', width: 180 },
})

export default function LeaveApprovalPDF({ data }) {
  const {
    issueDate, employeeName, employeeNameEn, employeeId,
    position, leaveType, startDate, endDate, days,
    reason, isPaid, approvedBy, approvedAt,
    directorName, directorRole,
  } = data

  const sigPath = path.join(process.cwd(), 'public', 'signature.jpg')
  const leaveTypeTh = LEAVE_TYPE_TH[leaveType] || leaveType
  const leaveTypeEn = LEAVE_TYPE_EN[leaveType] || leaveType

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark />
        <DocHeader />
        <Text style={styles.date}>{issueDate + '\u00A0'}</Text>
        <Text style={styles.docTitle}>{'ใบอนุมัติการลา\u00A0'}</Text>
        <Text style={styles.docSubTitle}>{'Leave Approval Certificate\u00A0'}</Text>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{'อนุมัติแล้ว / Approved\u00A0'}</Text>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.row}>
            <Text style={styles.label}>{'ชื่อ / Name\u00A0'}</Text>
            <Text style={styles.value}>{(employeeName || '') + (employeeNameEn ? ' (' + employeeNameEn + ')' : '') + '\u00A0'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{'รหัส / Employee ID\u00A0'}</Text>
            <Text style={styles.value}>{(employeeId || '') + '\u00A0'}</Text>
          </View>
          <View style={[styles.row, { marginBottom: 0 }]}>
            <Text style={styles.label}>{'ตำแหน่ง / Position\u00A0'}</Text>
            <Text style={styles.value}>{(position || '') + '\u00A0'}</Text>
          </View>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.detailHead}>{'รายละเอียดการลา / Leave Details\u00A0'}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{'ประเภทการลา / Leave Type\u00A0'}</Text>
            <Text style={styles.highlight}>{leaveTypeTh + ' (' + leaveTypeEn + ')\u00A0'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{'วันที่เริ่ม / Start Date\u00A0'}</Text>
            <Text style={styles.detailValue}>{(startDate || '') + '\u00A0'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{'วันที่สิ้นสุด / End Date\u00A0'}</Text>
            <Text style={styles.detailValue}>{(endDate || '') + '\u00A0'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{'จำนวนวัน / Total Days\u00A0'}</Text>
            <Text style={styles.highlight}>{(days || '') + ' วัน / Days\u00A0'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{'ประเภท / Type\u00A0'}</Text>
            <Text style={styles.detailValue}>{isPaid ? 'ลาโดยได้รับค่าจ้าง / Paid Leave\u00A0' : 'ลาโดยไม่ได้รับค่าจ้าง / Unpaid Leave\u00A0'}</Text>
          </View>
          {!!reason && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{'เหตุผล\u00A0'}</Text>
              <Text style={[styles.detailValue, { flex: 1 }]}>{reason + '\u00A0'}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.detailHead}>{'การอนุมัติ / Approval Info\u00A0'}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{'อนุมัติโดย / Approved By\u00A0'}</Text>
            <Text style={styles.detailValue}>{(approvedBy || '') + '\u00A0'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{'วันที่อนุมัติ / Approved Date\u00A0'}</Text>
            <Text style={styles.detailValue}>{(approvedAt || '') + '\u00A0'}</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{'เอกสารฉบับนี้ออกให้เพื่อรับรองการอนุมัติการลาของพนักงาน กรุณาเก็บเอกสารนี้ไว้เป็นหลักฐาน\u00A0'}</Text>
          <Text style={styles.noteText}>{'This document certifies the approved leave request. Please keep this as your official record.\u00A0'}</Text>
        </View>

        <View style={styles.sigArea}>
          <Text style={styles.sigLabel}>{'ผู้อนุมัติ / Authorized Signatory\u00A0'}</Text>
          <Image style={styles.sigImage} src={sigPath} />
          <View style={styles.sigLine} />
          <Text style={styles.sigName}>{(directorName || '') + '\u00A0'}</Text>
          <Text style={styles.sigRole}>{(directorRole || 'กรรมการบริษัท (Managing Director)') + '\u00A0'}</Text>
        </View>
      </Page>
    </Document>
  )
}
