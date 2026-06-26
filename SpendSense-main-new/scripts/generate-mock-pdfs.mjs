/**
 * Generates 3 sample PDFs matching SpendSense mock data:
 * 1. HDFC Bank Statement (mockBankStatement transactions)
 * 2. ACKO Health Insurance Policy (vault insurance mock)
 * 3. SBI Education Loan Agreement (vault loan mock)
 */
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'sample-pdfs');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function fmt(n) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  return `${day}/${mon}/${yr}`;
}

function writePdf(fileName, build) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(OUT_DIR, fileName);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    build(doc);
    doc.end();
    stream.on('finish', () => {
      console.log(`Created: ${filePath}`);
      resolve(filePath);
    });
    stream.on('error', reject);
  });
}

function getMockTransactions(bankName) {
  const base = new Date();
  const month = base.getMonth();
  const year = base.getFullYear();
  const d = (day) => new Date(year, month, day).toISOString();

  return [
    { title: 'Salary Credit NEFT', amount: 85000, type: 'income', date: d(1), debit: 0, credit: 85000 },
    { title: 'UPI-SWIGGY', amount: 450, type: 'expense', date: d(3), debit: 450, credit: 0 },
    { title: 'UPI-ZOMATO', amount: 680, type: 'expense', date: d(5), debit: 680, credit: 0 },
    { title: 'ATM Cash Withdrawal', amount: 5000, type: 'expense', date: d(7), debit: 5000, credit: 0 },
    { title: 'BESCOM Electricity', amount: 3200, type: 'expense', date: d(9), debit: 3200, credit: 0 },
    { title: 'AMAZON INDIA', amount: 2499, type: 'expense', date: d(11), debit: 2499, credit: 0 },
    { title: 'Interest Credit', amount: 245, type: 'income', date: d(15), debit: 0, credit: 245 },
    { title: 'NETFLIX', amount: 649, type: 'expense', date: d(17), debit: 649, credit: 0 },
    { title: 'HPCL Fuel', amount: 2800, type: 'expense', date: d(19), debit: 2800, credit: 0 },
    { title: 'BIGBASKET', amount: 1850, type: 'expense', date: d(21), debit: 1850, credit: 0 },
    { title: 'NEFT Transfer Received', amount: 15000, type: 'income', date: d(23), debit: 0, credit: 15000 },
    { title: 'EMI Home Loan', amount: 18500, type: 'expense', date: d(25), debit: 18500, credit: 0 },
    { title: 'JIO Recharge', amount: 799, type: 'expense', date: d(27), debit: 799, credit: 0 },
    { title: 'FLIPKART', amount: 3299, type: 'expense', date: d(28), debit: 3299, credit: 0 },
  ].map(tx => ({ ...tx, title: `${tx.title}` }));
}

async function generateBankStatementPdf() {
  const bankName = 'HDFC';
  const txs = getMockTransactions(bankName);
  let balance = 125000;

  await writePdf('mock-hdfc-bank-statement.pdf', (doc) => {
    doc.fontSize(18).fillColor('#004C8F').text('HDFC BANK', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#333').text('Account Statement', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#000');
    doc.text(`Account Holder: Demo User`);
    doc.text(`Account Number: XXXX3708`);
    doc.text(`Account Type: Savings`);
    doc.text(`Branch: Koramangala, Bangalore`);
    const now = new Date();
    doc.text(`Statement Period: 01/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${now.getDate()}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`);
    doc.moveDown(1);

    const colX = [50, 105, 280, 370, 440, 510];
    const headers = ['Date', 'Narration', 'Chq/Ref', 'Withdrawal', 'Deposit', 'Balance'];
    doc.font('Helvetica-Bold').fontSize(8);
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: i < 5 ? colX[i + 1] - colX[i] - 4 : 80 }));
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#004C8F');
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(7.5);
    doc.text(fmtDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString()), colX[0], doc.y, { width: 50 });
    doc.text('Opening Balance', colX[1], doc.y - 9, { width: 165 });
    doc.text('', colX[2], doc.y - 9, { width: 85 });
    doc.text('', colX[3], doc.y - 9, { width: 65 });
    doc.text('', colX[4], doc.y - 9, { width: 65 });
    doc.text(fmt(balance), colX[5], doc.y - 9, { width: 80, align: 'right' });
    doc.moveDown(0.6);

    for (const tx of txs) {
      if (doc.y > 720) {
        doc.addPage();
        doc.font('Helvetica-Bold').fontSize(8);
        headers.forEach((h, i) => doc.text(h, colX[i], 50, { width: i < 5 ? colX[i + 1] - colX[i] - 4 : 80 }));
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(7.5);
      }
      if (tx.credit > 0) balance += tx.credit;
      if (tx.debit > 0) balance -= tx.debit;

      const y = doc.y;
      doc.text(fmtDate(tx.date), colX[0], y, { width: 50 });
      doc.text(tx.title.substring(0, 28), colX[1], y, { width: 168 });
      doc.text(`REF${Math.floor(Math.random() * 900000 + 100000)}`, colX[2], y, { width: 85 });
      doc.text(tx.debit > 0 ? fmt(tx.debit) : '', colX[3], y, { width: 65, align: 'right' });
      doc.text(tx.credit > 0 ? fmt(tx.credit) : '', colX[4], y, { width: 65, align: 'right' });
      doc.text(fmt(balance), colX[5], y, { width: 80, align: 'right' });
      doc.moveDown(0.55);
    }

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text(`Closing Balance: Rs. ${fmt(balance)}`);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(8).fillColor('#666')
      .text('This is a sample mock statement generated for SpendSense AI demo purposes.', { align: 'center' });
  });
}

async function generateInsurancePdf() {
  await writePdf('mock-acko-insurance-policy.pdf', (doc) => {
    doc.fontSize(20).fillColor('#00C853').text('ACKO', { align: 'left' });
    doc.fontSize(14).fillColor('#333').text('Health Safeguard Policy', { align: 'left' });
    doc.moveDown(1.5);

    doc.fontSize(11).fillColor('#000').font('Helvetica-Bold').text('Policy Summary');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);
    const fields = [
      ['Policy Name', 'ACKO Health Safeguard'],
      ['Provider', 'ACKO General Insurance Ltd.'],
      ['Policy Type', 'Health'],
      ['Policy Number', 'ACKO-HS-2024-784521'],
      ['Coverage Amount', 'Rs. 25,00,000'],
      ['Premium Amount', 'Rs. 12,000 per year'],
      ['Payment Interval', 'Yearly'],
      ['Policy Status', 'Active'],
      ['Insured Member', 'Demo User'],
      ['Sum Insured', 'Rs. 25,00,000'],
      ['Room Rent Limit', 'Single AC Room'],
      ['Next Premium Due', new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')],
    ];
    fields.forEach(([k, v]) => {
      doc.font('Helvetica-Bold').text(`${k}: `, { continued: true });
      doc.font('Helvetica').text(v);
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(11).text('Coverage Benefits');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9);
    [
      'Hospitalization expenses covered up to sum insured',
      'Pre and post hospitalization (60/90 days)',
      'Day care procedures',
      'Ambulance charges up to Rs. 2,000',
      'No claim bonus up to 50%',
    ].forEach(b => doc.text(`• ${b}`));

    doc.moveDown(1.5);
    doc.fontSize(8).fillColor('#666')
      .text('Sample mock document — matches SpendSense vault insurance OCR mock (ACKO Health Safeguard).', { align: 'center' });
  });
}

async function generateLoanPdf() {
  await writePdf('mock-sbi-education-loan.pdf', (doc) => {
    doc.fontSize(18).fillColor('#22409A').text('STATE BANK OF INDIA', { align: 'center' });
    doc.fontSize(13).fillColor('#333').text('Education Loan — Sanction Letter', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(10).fillColor('#000').font('Helvetica');
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
    doc.text('To,');
    doc.text('Demo User');
    doc.text('Bangalore, Karnataka');
    doc.moveDown(1);

    doc.text('Dear Sir/Madam,');
    doc.moveDown(0.5);
    doc.text('We are pleased to inform you that your application for Education Loan has been sanctioned subject to the terms below:');
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('Loan Details');
    doc.moveDown(0.4);
    doc.font('Helvetica');
    const fields = [
      ['Loan Name', 'Education Debt Loan'],
      ['Bank', 'State Bank of India (SBI)'],
      ['Loan Account No.', 'SBI-EDU-8847291056'],
      ['Sanctioned Amount', 'Rs. 3,00,000'],
      ['Disbursed Amount', 'Rs. 3,00,000'],
      ['Outstanding Principal', 'Rs. 3,00,000'],
      ['Rate of Interest', '9.5% p.a. (floating)'],
      ['EMI Amount', 'Rs. 8,500 per month'],
      ['Tenure', '48 months'],
      ['EMIs Paid', '0'],
      ['Next EMI Date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')],
      ['Purpose', 'Higher Education'],
      ['Status', 'Active'],
    ];
    fields.forEach(([k, v]) => {
      doc.font('Helvetica-Bold').text(`${k}: `, { continued: true });
      doc.font('Helvetica').text(v);
      doc.moveDown(0.25);
    });

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('Repayment Schedule (Summary)');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9);
    doc.text('Month 1-48: EMI Rs. 8,500 (Principal + Interest)');
    doc.text('Total Interest (approx.): Rs. 1,08,000 over tenure');

    doc.moveDown(1.5);
    doc.fontSize(8).fillColor('#666')
      .text('Sample mock document — matches SpendSense vault loan OCR mock (SBI Education Debt Loan).', { align: 'center' });
  });
}

async function main() {
  await generateBankStatementPdf();
  await generateInsurancePdf();
  await generateLoanPdf();
  console.log(`\nAll 3 PDFs saved to: ${OUT_DIR}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
