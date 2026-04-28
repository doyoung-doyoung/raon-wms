import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { DocHeader, Watermark, numToThaiWords } from './utils.jsx'
import path from 'path'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Sarabun',
    position: 'relative',
  },
  titleTh: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  titleEn: {
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
    marginBottom: 6,
  },
  periodBar: {
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
    marginBottom: 14,
  },
  empBox: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 4,
    marginBottom: 14,
  },
  empRow: {
    flexDirection: 'row',
    marginBottom: 3,
    fontSize: 10,
  },
  empLabel: {
    color: '#666666',
    width: 160,
  },
  empVal: {
    fontWeight: 'bold',
    flex: 1,
  },
  payGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  paySection: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#cccccc',
    borderRadius: 4,
  },
  payHead: {
    backgroundColor: '#f5f5f5',
    padding: '5 10',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#555555',
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '4 10',
    fontSize: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#eeeeee',
  },
  payLabel: {
    color: '#666666',
    flex: 1,
  },
  payVal: {
    color: '#333333',
  },
  paySubtotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '5 10',
    fontSize: 10,
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
  },
  incomeTotal: {
    color: '#0F6E56',
  },
  deductTotal: {
    color: '#993C1D',
  },
  netBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  netLabelTh: {
    fontSize: 11,
    color: '#666666',
  },
  netLabelEn: {
    fontSize: 9,
    color: '#888888',
    marginBottom: 4,
  },
  netAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  netWords: {
    fontSize: 9.5,
    color: '#666666',
  },
  sigArea: {
    marginTop: 20,
    alignItems: 'center',
  },
  sigImage: {
    width: 100,
    height: 50,
    marginBottom: 2,
    alignSelf: 'center',
  },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaaaaa',
    width: 160,
    marginBottom: 4,
  },
  sigName: {
    fontSize: 10,
    textAlign: 'center',
    width: 160,
  },
  sigRole: {
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
    width: 160,
  },
})

export default function PayslipPDF({ data }) {
  const {
    periodTh, periodEn, payDateTh,
    nameTh, nameEn, employeeId, position,
    startDateTh,
    baseSalary = 0, housing = 0, transport = 0,
    meal = 0, ot = 0, otherIncome = 0,
    expenseReimbursement = 0,
    tax = 0, socialSecurity = 0, otherDeduction = 0,
    directorName, directorRole,
  } = data

  const totalIncome = baseSalary + housing + transport + meal + ot + otherIncome + expenseReimbursement
  const totalDeduction = tax + socialSecurity + otherDeduction
  const netPay = totalIncome - totalDeduction
  const sigPath = path.join(process.cwd(), 'public', 'signature.jpg')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark />
        <DocHeader />

        <Text style={styles.titleTh}>{'สลิปเงินเดือน '}</Text>
        <Text style={styles.titleEn}>Payslip</Text>
        <Text style={styles.periodBar}>{'วันที่จ่าย / Pay date: ' + (payDateTh || '') + ' '}</Text>

        <View style={styles.empBox}>
          <View style={styles.empRow}>
            <Text style={styles.empLabel}>{'ชื่อ / Name '}</Text>
            <Text style={styles.empVal}>{(nameTh || '') + ' (' + (nameEn || '') + ') '}</Text>
          </View>
          <View style={styles.empRow}>
            <Text style={styles.empLabel}>{'รหัส / Employee ID '}</Text>
            <Text style={styles.empVal}>{(employeeId || '') + ' '}</Text>
          </View>
          <View style={styles.empRow}>
            <Text style={styles.empLabel}>{'ตำแหน่ง / Position '}</Text>
            <Text style={styles.empVal}>{(position || '') + ' '}</Text>
          </View>
          <View style={styles.empRow}>
            <Text style={styles.empLabel}>{'วันที่เริ่มงาน / Start date '}</Text>
            <Text style={styles.empVal}>{(startDateTh || '') + ' '}</Text>
          </View>
        </View>

        <View style={styles.payGrid}>
          <View style={styles.paySection}>
            <Text style={styles.payHead}>{'รายได้ / Income '}</Text>
            <View style={styles.payRow}><Text style={styles.payLabel}>{'เงินเดือน / Base salary '}</Text><Text style={styles.payVal}>{baseSalary.toLocaleString()}</Text></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>{'ค่าที่พัก / Housing '}</Text><Text style={styles.payVal}>{housing.toLocaleString()}</Text></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>{'ค่าเดินทาง / Transport '}</Text><Text style={styles.payVal}>{transport.toLocaleString()}</Text></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>{'ค่าอาหาร / Meal '}</Text><Text style={styles.payVal}>{meal.toLocaleString()}</Text></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>{'ค่าล่วงเวลา / OT '}</Text><Text style={styles.payVal}>{ot.toLocaleString()}</Text></View>
            {otherIncome > 0 && <View style={styles.payRow}><Text style={styles.payLabel}>{'อื่นๆ / Other '}</Text><Text style={styles.payVal}>{otherIncome.toLocaleString()}</Text></View>}
            {expenseReimbursement > 0 && <View style={styles.payRow}><Text style={styles.payLabel}>{'ค่าใช้จ่าย / Expense '}</Text><Text style={styles.payVal}>{expenseReimbursement.toLocaleString()}</Text></View>}
            <View style={styles.paySubtotal}>
              <Text>{'รวม / Total '}</Text>
              <Text style={styles.incomeTotal}>{totalIncome.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.paySection}>
            <Text style={styles.payHead}>{'รายหัก / Deductions '}</Text>
            <View style={styles.payRow}><Text style={styles.payLabel}>{'ภาษี / Income tax '}</Text><Text style={styles.payVal}>{tax.toLocaleString()}</Text></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>{'ประกันสังคม / Social sec. '}</Text><Text style={styles.payVal}>{socialSecurity.toLocaleString()}</Text></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>{'หักอื่นๆ / Other '}</Text><Text style={styles.payVal}>{otherDeduction.toLocaleString()}</Text></View>
            <View style={styles.paySubtotal}>
              <Text>{'รวมหัก / Total '}</Text>
              <Text style={styles.deductTotal}>{totalDeduction.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.netBox}>
          <Text style={styles.netLabelTh}>{'ยอดสุทธิที่ได้รับ '}</Text>
          <Text style={styles.netLabelEn}>Net Pay</Text>
          <Text style={styles.netAmount}>{'฿ ' + netPay.toLocaleString()}</Text>
          <Text style={styles.netWords}>{numToThaiWords(netPay)}</Text>
        </View>

        <View style={styles.sigArea}>
          <Text style={styles.sigLabel}>{'ผู้อนุมัติ / Approved by '}</Text>
          <Image style={styles.sigImage} src={sigPath} />
          <View style={styles.sigLine} />
          <Text style={styles.sigName}>{(directorName || '') + ' '}</Text>
          <Text style={styles.sigRole}>{(directorRole || '') + ' '}</Text>
        </View>
      </Page>
    </Document>
  )
}