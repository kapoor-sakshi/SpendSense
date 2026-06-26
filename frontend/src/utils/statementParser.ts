/**
 * statementParser.ts
 * Parses real bank statements from CSV, TXT, or image/PDF files
 * and returns structured transaction objects.
 */

import { Transaction } from './mockData';

export type StatementUploadStatus =
  | 'Uploading'
  | 'Reading PDF'
  | 'Running OCR'
  | 'Extracting Transactions'
  | 'Analyzing'
  | 'Completed';

const MIN_TEXT_LENGTH = 100;

const SALARY_KEYWORDS = /\b(salary|paycheck|payroll|income|deposit|sal cr|salary credit|wages)\b/i;
const TRANSFER_KEYWORDS = /\b(transfer|neft|imps|rtgs|upi\/|sent to|received from)\b/i;

export function categorizeStatementEntry(description: string): {
  category: string;
  type: 'income' | 'expense';
  isSalary: boolean;
} {
  const d = description.toLowerCase();
  if (SALARY_KEYWORDS.test(d)) return { category: 'Salary', type: 'income', isSalary: true };
  if (/\b(neft cr|imps cr|upi cr|credit|refund|interest credit|dividend|cashback)\b/.test(d)) {
    return { category: 'Income', type: 'income', isSalary: false };
  }
  if (/\b(grocery|groceries|supermarket|bigbasket|blinkit|zepto|dmart)\b/.test(d)) return { category: 'Grocery', type: 'expense', isSalary: false };
  if (/\b(restaurant|swiggy|zomato|food|cafe|dining|mcdonald|kfc|pizza|starbucks)\b/.test(d)) return { category: 'Restaurant', type: 'expense', isSalary: false };
  if (/\b(fuel|petrol|diesel|shell|hpcl|iocl)\b/.test(d)) return { category: 'Fuel', type: 'expense', isSalary: false };
  if (/\b(amazon|flipkart|myntra|shopping|mall|zara)\b/.test(d)) return { category: 'Shopping', type: 'expense', isSalary: false };
  if (/\b(electricity|water|gas|broadband|wifi|bill|recharge|jio|airtel|utility)\b/.test(d)) return { category: 'Bills', type: 'expense', isSalary: false };
  if (/\b(emi|loan repayment|mortgage)\b/.test(d)) return { category: 'EMI', type: 'expense', isSalary: false };
  if (/\b(insurance|lic premium|policy premium)\b/.test(d)) return { category: 'Insurance', type: 'expense', isSalary: false };
  if (/\b(netflix|spotify|prime|hotstar|subscription|ott)\b/.test(d)) return { category: 'Subscription', type: 'expense', isSalary: false };
  if (TRANSFER_KEYWORDS.test(d)) return { category: 'Transfer', type: 'expense', isSalary: false };
  if (/\b(groww|sip|mutual|stock|investment|zerodha)\b/.test(d)) return { category: 'Investment', type: 'expense', isSalary: false };
  return { category: 'Others', type: 'expense', isSalary: false };
}

export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getStoredStatementHashes(userId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(`spendsense_stmt_hashes_${userId}`) || '[]');
  } catch { return []; }
}

export function storeStatementHash(userId: string, hash: string) {
  const hashes = getStoredStatementHashes(userId);
  if (!hashes.includes(hash)) {
    localStorage.setItem(`spendsense_stmt_hashes_${userId}`, JSON.stringify([...hashes, hash]));
  }
}

export interface ParsedTransaction {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
  rawLine: string;
}

/* ─────────────────────── Amount Helpers ─────────────────────── */

function parseAmount(str: string): number {
  const clean = str.replace(/₹|Rs\.?|INR|\$|,/gi, '').trim();
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.abs(val);
}

function inferType(description: string, creditField: string, debitField: string): 'income' | 'expense' {
  if (creditField && parseFloat(creditField.replace(/[₹$,\s]/g, '')) > 0) return 'income';
  if (debitField && parseFloat(debitField.replace(/[₹$,\s]/g, '')) > 0) return 'expense';
  return categorizeStatementEntry(description).type;
}

/* ─────────────────────── CSV Parser ─────────────────────── */

export function parseCSV(text: string, bankName: string): ParsedTransaction[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const results: ParsedTransaction[] = [];

  // Detect delimiter: comma, tab, or pipe
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes('|') ? '|' : ',';

  // Parse headers
  const headers = firstLine.split(delimiter).map(h => h.replace(/["']/g, '').trim().toLowerCase());

  // Map column indices intelligently
  const colIdx = {
    date: headers.findIndex(h => /date|dt|txn.?date|trans.?date|value.?date/.test(h)),
    description: headers.findIndex(h => /description|narration|particulars|details|remarks|txn.?desc|merchant|reference/.test(h)),
    debit: headers.findIndex(h => /debit|dr|withdrawal|deducted|paid|amount.?dr/.test(h)),
    credit: headers.findIndex(h => /credit|cr|deposit|received|amount.?cr/.test(h)),
    amount: headers.findIndex(h => h === 'amount' || h === 'amt'),
    balance: headers.findIndex(h => /balance|bal|closing/.test(h)),
    type: headers.findIndex(h => /type|txn.?type|trans.?type|cr.?dr/.test(h)),
  };

  // If no description column, try to use second column
  if (colIdx.description === -1 && headers.length > 1) {
    colIdx.description = 1;
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle quoted CSV values
    const cols = parseCSVLine(line, delimiter);
    if (cols.length < 2) continue;

    const rawDesc = colIdx.description >= 0 ? (cols[colIdx.description] || '') : cols[1] || '';
    const description = rawDesc.replace(/["']/g, '').trim();

    if (!description || description.length < 2) continue;

    // Parse date
    let dateStr = new Date().toISOString();
    if (colIdx.date >= 0 && cols[colIdx.date]) {
      const parsed = parseDate(cols[colIdx.date].replace(/["']/g, '').trim());
      if (parsed) dateStr = parsed;
    }

    // Parse amount
    let amount = 0;
    let type: 'income' | 'expense' = 'expense';

    const rawCredit = colIdx.credit >= 0 ? (cols[colIdx.credit] || '') : '';
    const rawDebit = colIdx.debit >= 0 ? (cols[colIdx.debit] || '') : '';
    const rawAmount = colIdx.amount >= 0 ? (cols[colIdx.amount] || '') : '';
    const rawType = colIdx.type >= 0 ? (cols[colIdx.type] || '') : '';

    // Check explicit CR/DR type column
    if (rawType) {
      const t = rawType.toLowerCase().trim();
      if (t.includes('cr') || t.includes('credit') || t === 'c') {
        type = 'income';
      } else if (t.includes('dr') || t.includes('debit') || t === 'd') {
        type = 'expense';
      }
    }

    if (rawCredit && parseAmount(rawCredit) > 0) {
      amount = parseAmount(rawCredit);
      type = 'income';
    } else if (rawDebit && parseAmount(rawDebit) > 0) {
      amount = parseAmount(rawDebit);
      type = 'expense';
    } else if (rawAmount) {
      amount = parseAmount(rawAmount);
      type = inferType(description, '', '');
    }

    if (rawType) {
      const t = rawType.toLowerCase().trim();
      if (t.includes('cr') || t.includes('credit') || t === 'c') type = 'income';
      else if (t.includes('dr') || t.includes('debit') || t === 'd') type = 'expense';
    }

    if (amount <= 0) continue;

    const catInfo = categorizeStatementEntry(description);
    if (catInfo.isSalary) type = 'income';

    results.push({
      title: cleanDescription(description),
      amount,
      type,
      date: dateStr,
      category: catInfo.category,
      rawLine: line,
    });
  }

  return results;
}

/* ─────────────────────── TXT / Plain Text Parser ─────────────────────── */

export function parseTXT(text: string, bankName: string): ParsedTransaction[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  const results: ParsedTransaction[] = [];

  // Different patterns for different bank statement formats
  // Pattern 1: "15 May 2024   ZOMATO ONLINE    Dr   ₹450.00"
  // Pattern 2: "2024-05-15  SALARY CREDIT   Cr  84900"
  // Pattern 3: "15/05/24  REF123  Description  450.00  Cr  12000.00"

  const txnPattern = /^(.{6,20}?)\s{2,}(.{5,}?)\s{2,}(dr|cr|debit|credit)?\s*[₹$]?\s*([\d,]+\.?\d{0,2})/i;
  const amountOnlyPattern = /(?:₹|Rs\.?\s*)?[\d,]+(?:\.\d{1,2})?/g;
  const datePattern = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s\d{2,4}|\d{1,2}[-\s][A-Za-z]{3}[-\s]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/i;

  for (const line of lines) {
    // Skip header-like lines
    if (/^(date|sl\.?\s*no|sr\.?\s*no|transaction|narration|description|balance|opening|closing|statement)/i.test(line)) {
      continue;
    }

    const match = txnPattern.exec(line);
    if (match) {
      const potentialDate = match[1].trim();
      const description = match[2].trim();
      const typeStr = (match[3] || '').toLowerCase();
      const amountStr = match[4];

      const amount = parseAmount(amountStr);
      if (amount <= 0) continue;

      const dateStr = parseDate(potentialDate) || new Date().toISOString();
      const type: 'income' | 'expense' = typeStr.includes('cr') || typeStr.includes('credit')
        ? 'income' : 'expense';

      const catInfo = categorizeStatementEntry(description);
      results.push({
        title: cleanDescription(description),
        amount,
        type: catInfo.isSalary ? 'income' : type,
        date: dateStr,
        category: catInfo.category,
        rawLine: line,
      });
      continue;
    }

    // Fallback: extract date + amounts from any line with sufficient content
    const dateMatch = datePattern.exec(line);
    const amounts = [...line.matchAll(amountOnlyPattern)].map(m => parseAmount(m[1])).filter(v => v > 10);

    if (dateMatch && amounts.length > 0) {
      // Get the description by removing the date and amount
      let desc = line
        .replace(datePattern, '')
        .replace(/[₹$]?[\d,]+\.?\d{2}/g, '')
        .replace(/\b(dr|cr|debit|credit|neft|imps|upi|rtgs)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (desc.length < 3) continue;

      const amount = amounts[0]; // Take first amount
      const lineUpper = line.toUpperCase();
      const type: 'income' | 'expense' =
        lineUpper.includes(' CR') || lineUpper.includes('CREDIT') || lineUpper.includes(' CR ') ? 'income' : 'expense';

      const dateStr = parseDate(dateMatch[0]) || new Date().toISOString();

      const catInfo = categorizeStatementEntry(desc);
      results.push({
        title: cleanDescription(desc),
        amount,
        type: catInfo.isSalary ? 'income' : type,
        date: dateStr,
        category: catInfo.category,
        rawLine: line,
      });
    }
  }

  return results;
}

/* ─────────────────────── OCR Text Parser (from Tesseract) ─────────────────────── */

export function parseOCRText(text: string, bankName: string): ParsedTransaction[] {
  const normalized = text.split('\n').map(l => l.replace(/\s{3,}/g, '\t')).join('\n');
  const csvResults = parseCSV(normalized, bankName);
  if (csvResults.length >= 2) return csvResults;
  const flexResults = parseFlexibleBankLines(text, bankName);
  if (flexResults.length >= 1) return flexResults;
  return parseTXT(text, bankName);
}

/* ─────────────────────── Date Parser ─────────────────────── */

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

const FLEX_AMOUNT_PATTERN = /(?:₹|Rs\.?\s*|INR\s*)?[\d,]+(?:\.\d{1,2})?/gi;
const DATE_START_PATTERN = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[-\s][A-Za-z]{3}[-\s]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/;

export function parseDate(raw: string): string | null {
  if (!raw || raw.trim().length < 4) return null;
  const cleaned = raw.trim();

  let m = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/.exec(cleaned);
  if (m) {
    const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  m = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/.exec(cleaned);
  if (m) {
    const year = parseInt(m[3]) + (parseInt(m[3]) > 50 ? 1900 : 2000);
    const d = new Date(year, parseInt(m[2]) - 1, parseInt(m[1]));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  m = /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/.exec(cleaned);
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  m = /^(\d{1,2})[-\s\/]([A-Za-z]{3})[-\s\/](\d{2,4})$/.exec(cleaned);
  if (m && MONTH_MAP[m[2].toLowerCase()] !== undefined) {
    const year = m[3].length === 2 ? parseInt(m[3]) + 2000 : parseInt(m[3]);
    const d = new Date(year, MONTH_MAP[m[2].toLowerCase()], parseInt(m[1]));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  m = /^(\d{1,2})\s([a-zA-Z]{3})\s(\d{4})$/.exec(cleaned);
  if (m && MONTH_MAP[m[2].toLowerCase()] !== undefined) {
    const d = new Date(parseInt(m[3]), MONTH_MAP[m[2].toLowerCase()], parseInt(m[1]));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  const d = new Date(cleaned);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d.toISOString();
  return null;
}

function extractAmounts(line: string): number[] {
  return [...line.matchAll(FLEX_AMOUNT_PATTERN)]
    .map(m => parseAmount(m[0]))
    .filter(a => a > 0 && a < 50_000_000);
}

export function parseFlexibleBankLines(text: string, bankName: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 5);

  for (const line of lines) {
    if (/^(date|sl\.?no|sr\.?no|txn|narration|particulars|opening|closing|statement period|account)/i.test(line)) continue;
    const dateMatch = DATE_START_PATTERN.exec(line);
    if (!dateMatch) continue;

    const dateRaw = dateMatch[1];
    const rest = line.slice(dateMatch[0].length).trim();
    const amounts = extractAmounts(rest);
    if (amounts.length === 0) continue;

    const txAmount = amounts.length >= 2 ? amounts[amounts.length - 2] : amounts[0];
    let desc = rest.replace(FLEX_AMOUNT_PATTERN, ' ').replace(/\b(dr|cr|debit|credit)\b/gi, '').replace(/\s+/g, ' ').trim();
    if (desc.length < 2) desc = 'Bank Transaction';

    const cat = categorizeStatementEntry(desc);
    let type: 'income' | 'expense' = cat.type;
    if (/\b(cr|credit)\b/i.test(line) || cat.isSalary) type = 'income';
    if (/\b(dr|debit)\b/i.test(line)) type = 'expense';

    results.push({
      title: cleanDescription(desc),
      amount: txAmount,
      type,
      date: parseDate(dateRaw) || new Date().toISOString(),
      category: cat.category,
      rawLine: line
    });
  }
  return results;
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist');
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => ('str' in item ? item.str : '') || '').join(' ') + '\n';
    }
    return text.trim();
  } catch (err) {
    console.warn('PDF text extraction failed, falling back to OCR:', err);
    return '';
  }
}

async function ocrPdfPages(file: File): Promise<{ text: string; confidence: number }> {
  const pdfjs = await import('pdfjs-dist');
  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const Tesseract = (await import('tesseract.js')).default;

  let combinedText = '';
  const confidences: number[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/png');
    });
    const result = await Tesseract.recognize(blob, 'eng', { logger: () => {} });
    combinedText += result.data.text + '\n';
    confidences.push(result.data.confidence);
    console.log(`[StatementOCR] Page ${i}/${pdf.numPages} OCR confidence: ${result.data.confidence.toFixed(1)}%`);
  }

  const confidence = confidences.length
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;
  console.log(`[StatementOCR] Average OCR confidence: ${confidence.toFixed(1)}%`);
  return { text: combinedText.trim(), confidence };
}

export async function extractStatementTextWithOcr(
  file: File,
  onProgress?: (step: StatementUploadStatus) => void
): Promise<{ text: string; ocrConfidence: number; usedOcr: boolean }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'csv' || ext === 'txt') {
    return { text: await file.text(), ocrConfidence: 100, usedOcr: false };
  }

  if (ext === 'pdf') {
    onProgress?.('Reading PDF');
    const pdfText = await extractPdfText(file);
    if (pdfText.length >= MIN_TEXT_LENGTH) {
      return { text: pdfText, ocrConfidence: 100, usedOcr: false };
    }
    onProgress?.('Running OCR');
    const ocrResult = await ocrPdfPages(file);
    return {
      text: ocrResult.text || pdfText,
      ocrConfidence: ocrResult.confidence,
      usedOcr: true
    };
  }

  if (['png', 'jpg', 'jpeg'].includes(ext)) {
    onProgress?.('Running OCR');
    const Tesseract = (await import('tesseract.js')).default;
    const result = await Tesseract.recognize(file, 'eng', { logger: () => {} });
    console.log(`[StatementOCR] Image OCR confidence: ${result.data.confidence.toFixed(1)}%`);
    return {
      text: result.data.text,
      ocrConfidence: result.data.confidence,
      usedOcr: true
    };
  }

  try {
    return { text: await file.text(), ocrConfidence: 100, usedOcr: false };
  } catch {
    return { text: '', ocrConfidence: 0, usedOcr: false };
  }
}

/* ─────────────────────── CSV Line Parser (handles quoted fields) ─────────────────────── */

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' || ch === "'") {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/* ─────────────────────── Description Cleaner ─────────────────────── */

function cleanDescription(raw: string): string {
  return raw
    .replace(/\b(neft|imps|upi|rtgs|ref|txn|no|ref\.?\s*no|transaction|id|[a-z0-9]{20,})\b/gi, '')
    .replace(/[^a-zA-Z0-9₹\s\-&@\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 60)
    || 'Transaction';
}

/* ─────────────────────── Main Entry Point ─────────────────────── */

export async function parseStatementFile(file: File, bankName: string): Promise<{
  transactions: ParsedTransaction[];
  totalAmount: number;
  totalIncome: number;
  totalExpense: number;
  parseMethod: string;
}> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let parsed: ParsedTransaction[] = [];
  let parseMethod = 'Unknown';

  if (ext === 'csv') {
    // Parse CSV directly
    const text = await file.text();
    parsed = parseCSV(text, bankName);
    parseMethod = 'CSV Parser';
  } else if (ext === 'txt' || ext === 'xls' || ext === 'xlsx') {
    // Parse as plain text
    const text = await file.text();
    parsed = parseTXT(text, bankName);
    parseMethod = 'Text Parser';
  } else if (ext === 'pdf' || ['png', 'jpg', 'jpeg'].includes(ext)) {
    const extracted = await extractStatementTextWithOcr(file);
    const text = extracted.text;
    parsed = parseOCRText(text, bankName);
    if (extracted.usedOcr) {
      parseMethod = `${ext === 'pdf' ? 'PDF Page OCR' : 'Image OCR'} (${Math.round(extracted.ocrConfidence)}% confidence)`;
    } else {
      parseMethod = 'PDF Text Extractor';
    }
  } else if (['webp', 'bmp'].includes(ext)) {
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const result = await Tesseract.recognize(file, 'eng', { logger: () => {} });
      parsed = parseOCRText(result.data.text, bankName);
      parseMethod = `OCR Scanner (${Math.round(result.data.confidence)}% confidence)`;
    } catch (err) {
      console.error('OCR failed:', err);
      parseMethod = 'OCR Failed';
    }
  } else {
    // Try as plain text for unknown extensions
    try {
      const text = await file.text();
      parsed = parseTXT(text, bankName);
      parseMethod = 'Text Parser';
    } catch {
      parseMethod = 'Parse Failed';
    }
  }

  // Deduplicate: remove entries with same title, amount, date
  const seen = new Set<string>();
  parsed = parsed.filter(p => {
    const key = `${p.amount}-${p.date}-${p.title.slice(0, 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const totalIncome = parsed.filter(p => p.type === 'income').reduce((s, p) => s + p.amount, 0);
  const totalExpense = parsed.filter(p => p.type === 'expense').reduce((s, p) => s + p.amount, 0);

  return {
    transactions: parsed,
    totalAmount: totalIncome + totalExpense,
    totalIncome,
    totalExpense,
    parseMethod,
  };
}
