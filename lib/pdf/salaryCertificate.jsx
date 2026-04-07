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
  date: {
    textAlign: 'right',
    fontSize: 10,
    color: '#666666',
    marginBottom: 14,
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
    marginBottom: 16,
  },
  bodyTh: {
    fontSize: 11,
    lineHeight: 2,
    marginBottom: 8,
  },
  bodyEn: {
    fontSize: 10,
    color: '#555555',
    lineHeight: 1.8,
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    borderTopStyle: 'dashed',
    paddingTop: 8,
    marginTop: 8,
  },
  highlight: {
    fontWeight: 'bold',
  },
  footerNote: {
    fontSize: 9.5,
    color: '#666666',
    lineHeight: 1.6,
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    paddingTop: 8,
    marginTop: 14,
  },
  sigArea: {
    marginTop: 30,
    alignItems: 'center',
  },
  sigLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
    width: 180,
  },
  sigImage: {
    width: 100,
    height: 50,
    objectFit: 'contain',
    marginBottom: 2,
    alignSelf: 'center',
  },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaaaaa',
    width: 180,
    marginBottom: 4,
  },
  sigName: {
    fontSize: 10,
    textAlign: 'center',
    width: 180,
  },
  sigRole: {
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
    width: 180,
  },
})

export default function SalaryCertificatePDF({ data }) {
  const {
    issueDate, issueDateEn, nameTh, nameEn, employeeId,
    idCardAddress, currentAddress, startDateTh, startDateEn,
    position, salary, directorName, directorRole,
  } = data

  const sigPath = path.join(process.cwd(), 'public', 'signature.jpg')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark />
        <DocHeader />

        <Text style={styles.date}>{'วันที่ ' + issueDate + ' '}</Text>
        <Text style={[styles.date, { marginBottom: 14 }]}>{'Date: ' + issueDateEn + ' '}</Text>

        <Text style={styles.titleTh}>{'หนังสือรับรองเงินเดือน และรับรองการทำงาน\u00A0'}</Text>
        <Text style={styles.titleEn}>Salary & Employment Certificate</Text>

        <View style={styles.bodyTh}>
          <Text>{'บริษัท ราอน (ไทยแลนด์) จำกัด ขอรับรองว่า '}<Text style={styles.highlight}>{nameTh + ' (' + nameEn + ') '}</Text></Text>
          <Text>{'เลขประจำตัว '}<Text style={styles.highlight}>{employeeId + ' '}</Text></Text>
          <Text>{'ที่อยู่ตามบัตรประชาชน: '}<Text style={styles.highlight}>{(idCardAddress || '') + ' '}</Text></Text>
          <Text>{'ที่อยู่ปัจจุบัน (ติดต่อได้): '}<Text style={styles.highlight}>{(currentAddress || '') + ' '}</Text></Text>
          <Text>{' '}</Text>
          <Text>{'ได้เข้ามาปฏิบัติงานกับบริษัทตั้งแต่วันที่\u00A0'}<Text style={styles.highlight}>{startDateTh + '\u00A0'}</Text>{'จนถึงปัจจุบัน\u00A0'}</Text>
          <Text>{'ในตำแหน่ง\u00A0'}<Text style={styles.highlight}>{(position || '') + '\u00A0'}</Text></Text>
          <Text>{'ได้รับค่าจ้างเดือนละ\u00A0'}<Text style={styles.highlight}>{Number(salary).toLocaleString() + '\u00A0'}</Text>{'บาท (' + numToThaiWords(Number(salary)) + ')\u00A0'}</Text>
          <Text>{'ซึ่งอัตรานี้ไม่รวมค่าตอบแทนและเงินพิเศษอื่นๆ\u00A0'}</Text>
        </View>

        <View style={styles.bodyEn}>
          <Text>
            RAON (Thailand) Co., Ltd. hereby certifies that <Text style={styles.highlight}>{nameEn}</Text>, National ID <Text style={styles.highlight}>{employeeId}</Text>, has been employed with the company since <Text style={styles.highlight}>{startDateEn}</Text> up to the present, holding the position of <Text style={styles.highlight}>{position}</Text>, with a monthly salary of <Text style={styles.highlight}>{Number(salary).toLocaleString()} THB</Text> per month.
          </Text>
        </View>

        <View style={styles.footerNote}>
          <Text>{'หนังสือฉบับนี้ออกให้เพื่อใช้เป็นหลักฐานประกอบการใดๆ ตามที่พนักงานขอ และไม่มีภาระผูกพันใดๆต่อบริษัท\u00A0'}</Text>
        </View>

        <View style={styles.sigArea}>
          <Text style={styles.sigLabel}>กรรมการบริษัท / Authorized Signatory</Text>
          <Image style={styles.sigImage} src={sigPath} />
          <View style={styles.sigLine} />
          <Text style={styles.sigName}>{directorName}</Text>
          <Text style={styles.sigRole}>{directorRole}</Text>
        </View>
      </Page>
    </Document>
  )
}