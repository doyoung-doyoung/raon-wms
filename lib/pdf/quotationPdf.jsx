import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const COMPANY = {
  nameEn: 'RAON (THAILAND) CO., LTD.',
  nameTh: 'บริษัท ราอน(ไทยแลนด์) จำกัด  สำนักงานใหญ่\u00A0',
  addr1: '2901-2907, 349 SJ INFINITE ONE BUSINESS COMPLEX TOWER 29th Floor,',
  addr2: 'VIBHAVADI RANGSIT ROAD, CHOM PHON, CHATUCHAK, BANGKOK 10900',
  tel: '+66(0)62 124 7979',
  taxId: '0 1055 66069 79 6',
  bankName: 'KASIKORN BANK PUBLIC COMPANY LIMITED',
  bankAccount: '174-2-88990-0',
  bankBeneficiary: 'RAON (THAILAND) COMPANY LIMITED',
  bankBranch: 'EMQUARTIER',
  swiftCode: 'KASITHBK',
}

function fmt(n) {
  const num = Number(n) || 0
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return String(dateStr)
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const s = StyleSheet.create({
  page:        { padding: 36, fontSize: 9, fontFamily: 'Sarabun' },
  // ── Header ──
  headerRow:   { flexDirection: 'row', marginBottom: 10 },
  coLeft:      { flex: 6 },
  coRight:     { flex: 4, alignItems: 'flex-end' },
  coNameEn:    { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  coNameTh:    { fontSize: 9,  color: '#555', marginBottom: 3 },
  coAddr:      { fontSize: 8,  color: '#666', lineHeight: 1.6 },
  coInfoRow:   { flexDirection: 'row', marginTop: 1 },
  coInfoLbl:   { fontSize: 8, color: '#555', width: 42 },
  coInfoVal:   { fontSize: 8, color: '#333' },
  docTitle:    { fontSize: 22, fontWeight: 'bold', color: '#111', letterSpacing: 0.5 },
  docNumRow:   { flexDirection: 'row', marginTop: 5, alignItems: 'center' },
  docNumLbl:   { fontSize: 8, color: '#555', width: 75 },
  docNumVal:   { fontSize: 8, color: '#222', fontWeight: 'bold' },
  // ── Divider ──
  divider:     { borderBottomWidth: 0.5, borderBottomColor: '#bbb', marginBottom: 8 },
  dividerDark: { borderBottomWidth: 1,   borderBottomColor: '#555', marginBottom: 0 },
  // ── Client ──
  clientSect:  { flexDirection: 'row', marginBottom: 8 },
  clientLeft:  { flex: 7 },
  clientRight: { flex: 3, alignItems: 'flex-end', justifyContent: 'flex-end' },
  clientRow:   { flexDirection: 'row', marginBottom: 2.5 },
  clientLbl:   { fontSize: 9, color: '#555', width: 52 },
  clientVal:   { fontSize: 9, color: '#111', flex: 1, fontWeight: 'bold' },
  currBadge:   { borderWidth: 1, borderColor: '#4f62f7', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  currTxt:     { fontSize: 9, fontWeight: 'bold', color: '#4f62f7' },
  // ── Table ──
  tHead:       { flexDirection: 'row', borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#666', backgroundColor: '#f5f5f5', paddingVertical: 4 },
  tRow:        { flexDirection: 'row', borderBottomWidth: 0.3, borderColor: '#ddd', paddingVertical: 3 },
  tRowLast:    { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#888', paddingVertical: 3 },
  cDetail:     { flex: 5, paddingRight: 4 },
  cUnit:       { flex: 1.2, textAlign: 'center' },
  cUnitLbl:    { flex: 1,   textAlign: 'center' },
  cCost:       { flex: 2.2, textAlign: 'right', paddingRight: 6 },
  cTotal:      { flex: 2.2, textAlign: 'right' },
  th:          { fontSize: 8, fontWeight: 'bold', color: '#333' },
  td:          { fontSize: 8.5, color: '#333' },
  tdBold:      { fontSize: 8.5, color: '#111', fontWeight: 'bold' },
  dtail:       { fontSize: 8, color: '#555', marginLeft: 10, marginTop: 1 },
  mgmtRow:     { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#888', paddingVertical: 3 },
  // ── Totals ──
  totSect:     { flexDirection: 'row', marginTop: 4, marginBottom: 10 },
  remCol:      { flex: 5, paddingRight: 8 },
  totCol:      { flex: 5 },
  totRow:      { flexDirection: 'row', paddingVertical: 2 },
  totLbl:      { flex: 3, fontSize: 8.5, color: '#444', textAlign: 'right', paddingRight: 8 },
  totVal:      { flex: 2, fontSize: 8.5, color: '#222', textAlign: 'right', fontWeight: 'bold' },
  gtRow:       { flexDirection: 'row', paddingVertical: 3, borderTopWidth: 0.5, borderTopColor: '#666', marginTop: 2 },
  gtLbl:       { flex: 3, fontSize: 9, fontWeight: 'bold', color: '#111', textAlign: 'right', paddingRight: 8 },
  gtVal:       { flex: 2, fontSize: 9, fontWeight: 'bold', color: '#111', textAlign: 'right' },
  remLbl:      { fontSize: 8, color: '#555', marginBottom: 3 },
  remTxt:      { fontSize: 8, color: '#333', lineHeight: 1.5 },
  // ── Payment ──
  paySect:     { flexDirection: 'row', borderTopWidth: 0.5, borderColor: '#888', paddingTop: 8, marginBottom: 12 },
  payLeft:     { flex: 4, paddingRight: 12 },
  payRight:    { flex: 6 },
  payTitle:    { fontSize: 8.5, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  payTxt:      { fontSize: 8, color: '#444', lineHeight: 1.6 },
  bankRow:     { flexDirection: 'row', marginBottom: 2 },
  bankLbl:     { fontSize: 8, color: '#666', width: 65 },
  bankVal:     { fontSize: 8, color: '#222', flex: 1 },
  // ── Signatures ──
  sigSect:     { flexDirection: 'row', marginTop: 14, borderTopWidth: 0.5, borderColor: '#ccc', paddingTop: 10 },
  sigCol:      { flex: 1, alignItems: 'center' },
  sigTitle:    { fontSize: 8, color: '#666', marginBottom: 28 },
  sigLine:     { borderBottomWidth: 0.5, borderColor: '#999', width: 120, marginBottom: 4 },
  sigName:     { fontSize: 8, color: '#222', textAlign: 'center' },
  sigDate:     { fontSize: 7.5, color: '#888', textAlign: 'center', marginTop: 2 },
  // Watermark
  watermark:   { position: 'absolute', top: '40%', left: '22%', fontSize: 80, color: '#000', opacity: 0.07, transform: 'rotate(-30deg)', fontWeight: 'bold' },
})

export default function QuotationPDF({ data }) {
  const {
    docType      = 'quotation',
    docNumber    = '',
    invoiceNumber= '',
    docDate      = '',
    clientType   = 'domestic',
    currency     = 'THB',
    client       = {},
    items        = [],
    managementFeeRate   = 0,
    managementFeeAmount = 0,
    subtotal     = 0,
    vatAmount    = 0,
    whtAmount    = 0,
    grandTotal   = 0,
    paymentDays  = 3,
    remark       = '',
    issuedBy               = '',
    directorApprovedByName = '',
    directorApprovedAt     = '',
    customerApprovedAt     = '',
    paidAt                 = '',
    paidNote               = '',
  } = data

  const isDomestic = clientType === 'domestic'
  const isReceipt  = docType === 'receipt'
  const isInvoice  = docType === 'invoice'

  const displayNum   = isInvoice || isReceipt ? (invoiceNumber || docNumber) : docNumber
  const displayTitle = { quotation: 'QUOTATION', invoice: 'INVOICE', receipt: 'RECEIPT' }[docType] || 'QUOTATION'
  const numLabel     = isInvoice ? 'Invoice No.' : isReceipt ? 'Receipt No.' : 'Quotation No.'

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* watermark */}
        {isReceipt && <Text style={s.watermark}>PAID</Text>}

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View style={s.coLeft}>
            <Text style={s.coNameEn}>{COMPANY.nameEn}</Text>
            <Text style={s.coNameTh}>{COMPANY.nameTh}</Text>
            <Text style={s.coAddr}>{COMPANY.addr1}</Text>
            <Text style={s.coAddr}>{COMPANY.addr2}</Text>
            <View style={s.coInfoRow}>
              <Text style={s.coInfoLbl}>Office</Text>
              <Text style={s.coInfoVal}>{COMPANY.tel}</Text>
            </View>
            <View style={s.coInfoRow}>
              <Text style={s.coInfoLbl}>Tax ID</Text>
              <Text style={s.coInfoVal}>{COMPANY.taxId}</Text>
            </View>
          </View>
          <View style={s.coRight}>
            <Text style={s.docTitle}>{displayTitle}</Text>
            <View style={{ marginTop: 8 }}>
              <View style={s.docNumRow}>
                <Text style={s.docNumLbl}>{numLabel}</Text>
                <Text style={s.docNumVal}>: {displayNum}</Text>
              </View>
              <View style={s.docNumRow}>
                <Text style={s.docNumLbl}>Date</Text>
                <Text style={s.docNumVal}>: {fmtDate(docDate)}</Text>
              </View>
              {isReceipt && paidAt && (
                <View style={s.docNumRow}>
                  <Text style={s.docNumLbl}>Paid Date</Text>
                  <Text style={s.docNumVal}>: {fmtDate(paidAt)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Client Info ── */}
        <View style={s.clientSect}>
          <View style={s.clientLeft}>
            <View style={s.clientRow}>
              <Text style={s.clientLbl}>Client</Text>
              <Text style={s.clientVal}>: {client.name || ''}</Text>
            </View>
            <View style={s.clientRow}>
              <Text style={s.clientLbl}>Address</Text>
              <Text style={s.clientVal}>: {client.address || ''}</Text>
            </View>
            {client.taxId ? (
              <View style={s.clientRow}>
                <Text style={s.clientLbl}>Tax ID</Text>
                <Text style={s.clientVal}>: {client.taxId}</Text>
              </View>
            ) : null}
            <View style={s.clientRow}>
              <Text style={s.clientLbl}>Email</Text>
              <Text style={s.clientVal}>: {client.email || ''}{client.tel ? `   ${client.tel}` : ''}</Text>
            </View>
          </View>
          <View style={s.clientRight}>
            <View style={s.currBadge}>
              <Text style={s.currTxt}>{currency}</Text>
            </View>
          </View>
        </View>

        {/* ── Table Header ── */}
        <View style={s.tHead}>
          <Text style={[s.th, s.cDetail]}>Detail</Text>
          <Text style={[s.th, s.cUnit]}>Unit</Text>
          <Text style={[s.th, s.cUnitLbl]}></Text>
          <Text style={[s.th, s.cCost]}>Cost</Text>
          <Text style={[s.th, s.cTotal]}>Total</Text>
        </View>

        {/* ── Items ── */}
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1 && Number(managementFeeRate) === 0
          return (
            <View key={idx}>
              <View style={isLast ? s.tRowLast : s.tRow}>
                <Text style={[s.tdBold, s.cDetail]}>{item.name || ''}</Text>
                <Text style={[s.td, s.cUnit]}>{item.qty || 1}</Text>
                <Text style={[s.td, s.cUnitLbl]}>Set</Text>
                <Text style={[s.td, s.cCost]}>{fmt(item.unitPrice)}</Text>
                <Text style={[s.td, s.cTotal]}>{fmt(item.total)}</Text>
              </View>
              {(item.details || []).filter(d => d && d.trim()).map((detail, di) => (
                <View key={di} style={{ flexDirection: 'row', paddingVertical: 1.5 }}>
                  <Text style={[s.dtail, s.cDetail]}>{'- ' + detail}</Text>
                  <Text style={[s.td, s.cUnit]}></Text>
                  <Text style={[s.td, s.cUnitLbl]}></Text>
                  <Text style={[s.td, s.cCost]}></Text>
                  <Text style={[s.td, s.cTotal]}></Text>
                </View>
              ))}
            </View>
          )
        })}

        {/* ── Management Fee ── */}
        {Number(managementFeeRate) > 0 && (
          <View style={s.mgmtRow}>
            <Text style={[s.td, s.cDetail]}>Management Fee</Text>
            <Text style={[s.td, { flex: 2.2, textAlign: 'center' }]}>{managementFeeRate}%</Text>
            <Text style={[s.td, s.cCost]}></Text>
            <Text style={[s.td, s.cTotal]}>{fmt(managementFeeAmount)}</Text>
          </View>
        )}

        {/* ── Totals ── */}
        <View style={s.totSect}>
          <View style={s.remCol}>
            {remark ? (
              <>
                <Text style={s.remLbl}>Remark:</Text>
                <Text style={s.remTxt}>{remark}</Text>
              </>
            ) : null}
          </View>
          <View style={s.totCol}>
            <View style={s.totRow}>
              <Text style={s.totLbl}>Total Amount (A)</Text>
              <Text style={s.totVal}>{fmt(subtotal)}</Text>
            </View>
            {isDomestic && (
              <>
                <View style={s.totRow}>
                  <Text style={s.totLbl}>VAT 7% (B)</Text>
                  <Text style={s.totVal}>{fmt(vatAmount)}</Text>
                </View>
                <View style={s.totRow}>
                  <Text style={s.totLbl}>WHT 3% (C)</Text>
                  <Text style={s.totVal}>{fmt(whtAmount)}</Text>
                </View>
                <View style={s.gtRow}>
                  <Text style={s.gtLbl}>Grand Total (A+B-C)</Text>
                  <Text style={s.gtVal}>{fmt(grandTotal)}</Text>
                </View>
              </>
            )}
            {!isDomestic && (
              <View style={s.gtRow}>
                <Text style={s.gtLbl}>Grand Total</Text>
                <Text style={s.gtVal}>{fmt(grandTotal)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Payment ── */}
        <View style={s.paySect}>
          <View style={s.payLeft}>
            <Text style={s.payTitle}>Terms of Payment</Text>
            <Text style={s.payTxt}>{`Full Payment within ${paymentDays || 3} days`}</Text>
            <Text style={s.payTxt}>of invoice issuance</Text>
            {isReceipt && paidNote ? (
              <Text style={[s.payTxt, { marginTop: 6, color: '#005500' }]}>{`Note: ${paidNote}`}</Text>
            ) : null}
          </View>
          <View style={s.payRight}>
            <Text style={s.payTitle}>Payment Details</Text>
            <View style={s.bankRow}>
              <Text style={s.bankLbl}>Bank Name</Text>
              <Text style={s.bankVal}>: {COMPANY.bankName}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLbl}>Account No.</Text>
              <Text style={s.bankVal}>: {COMPANY.bankAccount}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLbl}>Beneficiary</Text>
              <Text style={s.bankVal}>: {COMPANY.bankBeneficiary}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLbl}>Bank Branch</Text>
              <Text style={s.bankVal}>: {COMPANY.bankBranch}</Text>
            </View>
            <View style={s.bankRow}>
              <Text style={s.bankLbl}>Swift Code</Text>
              <Text style={s.bankVal}>: {COMPANY.swiftCode}</Text>
            </View>
          </View>
        </View>

        {/* ── Signatures ── */}
        <View style={s.sigSect}>
          <View style={s.sigCol}>
            <Text style={s.sigTitle}>Issued by</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{issuedBy || '..................................'}</Text>
            <Text style={s.sigDate}>Date: {fmtDate(docDate) || '..................................'}</Text>
          </View>
          <View style={s.sigCol}>
            <Text style={s.sigTitle}>Approved by (Director)</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{directorApprovedByName || 'Raon (Thailand) Co., Ltd.'}</Text>
            <Text style={s.sigDate}>Date: {directorApprovedAt ? fmtDate(directorApprovedAt) : '..................................'}</Text>
          </View>
          <View style={s.sigCol}>
            <Text style={s.sigTitle}>Approved by (Customer)</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{client.name || '..................................'}</Text>
            <Text style={s.sigDate}>Date: {customerApprovedAt ? fmtDate(customerApprovedAt) : '..................................'}</Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}
