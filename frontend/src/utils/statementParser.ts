/**
 * statementParser.ts
 * Parses real bank statements from CSV, TXT, or image/PDF files
 * and returns structured transaction objects.
 */

import { Transaction } from './mockData';
import { suggestCategory } from '../context/AppContext';

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
  // Remove currency symbols, commas, spaces
  const clean = str.replace(/[₹$,\s]/g, '').trim();
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.abs(val);
}

function inferType(description: string, creditField: string, debitField: string, amountStr: string): 'income' | 'expense' {
  // If explicit credit/debit columns
  if (creditField && parseFloat(creditField.replace(/[₹$,\s]/g, '')) > 0) return 'income';
  if (debitField && parseFloat(debitField.replace(/[₹$,\s]/g, '')) > 0) return 'expense';

  // Keyword-based
  const d = description.toLowerCase();
  if (d.includes('credit') || d.includes('salary') || d.includes('refund') ||
      d.includes('received') || d.includes('cashback') || d.includes('interest credit') ||
      d.includes('neft cr') || d.includes('imps cr') || d.includes('upi cr')) {
    return 'income';
  }
  return 'expense';
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
      type = inferType(description, '', '', rawAmount);
    }

    // If type column was explicit, respect it
    if (rawType) {
      const t = rawType.toLowerCase().trim();
      if (t.includes('cr') || t.includes('credit') || t === 'c') type = 'income';
      else if (t.includes('dr') || t.includes('debit') || t === 'd') type = 'expense';
    }

    if (amount <= 0) continue;

    results.push({
      title: cleanDescription(description),
      amount,
      type,
      date: dateStr,
      category: suggestCategory(description),
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
  const amountOnlyPattern = /([₹$]?[\d,]+\.?\d{2})/g;
  const datePattern = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/i;

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

      results.push({
        title: cleanDescription(description),
        amount,
        type,
        date: dateStr,
        category: suggestCategory(description),
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

      results.push({
        title: cleanDescription(desc),
        amount,
        type,
        date: dateStr,
        category: suggestCategory(desc),
        rawLine: line,
      });
    }
  }

  return results;
}

/* ─────────────────────── OCR Text Parser (from Tesseract) ─────────────────────── */

export function parseOCRText(text: string, bankName: string): ParsedTransaction[] {
  // First try as structured table (CSV-like with spaces)
  // Normalize multiple spaces to tabs for table parsing
  const normalized = text
    .split('\n')
    .map(l => l.replace(/\s{3,}/g, '\t'))
    .join('\n');

  // Try CSV-like parsing first
  const csvResults = parseCSV(normalized, bankName);
  if (csvResults.length >= 2) return csvResults;

  // Fallback to TXT parsing
  return parseTXT(text, bankName);
}

/* ─────────────────────── Date Parser ─────────────────────── */

export function parseDate(raw: string): string | null {
  if (!raw || raw.trim().length < 4) return null;
  const cleaned = raw.trim();

  // Try formats:
  const formats = [
    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/,
    // DD/MM/YY
    /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/,
    // YYYY-MM-DD
    /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/,
    // DD MMM YYYY
    /^(\d{1,2})\s([a-zA-Z]{3})\s(\d{4})$/,
  ];

  const months: Record<string, number> = {
    jan:0, feb:1, mar:2, apr:3, may:4, jun:5,
    jul:6, aug:7, sep:8, oct:9, nov:10, dec:11
  };

  // DD/MM/YYYY
  let m = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/.exec(cleaned);
  if (m) {
    const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // DD/MM/YY
  m = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/.exec(cleaned);
  if (m) {
    const year = parseInt(m[3]) + (parseInt(m[3]) > 50 ? 1900 : 2000);
    const d = new Date(year, parseInt(m[2]) - 1, parseInt(m[1]));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // YYYY-MM-DD
  m = /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/.exec(cleaned);
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // DD MMM YYYY (e.g. "15 May 2024")
  m = /^(\d{1,2})\s([a-zA-Z]{3})\s(\d{4})$/.exec(cleaned);
  if (m) {
    const mon = months[m[2].toLowerCase()];
    if (mon !== undefined) {
      const d = new Date(parseInt(m[3]), mon, parseInt(m[1]));
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }

  // Try native Date parse as last resort
  const d = new Date(cleaned);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d.toISOString();

  return null;
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
  } else if (['pdf', 'png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext)) {
    // Use Tesseract OCR for images/PDF screenshots
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const result = await Tesseract.recognize(file, 'eng', {
        logger: () => {}, // suppress logs
      });
      const ocrText = result.data.text;
      parsed = parseOCRText(ocrText, bankName);
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
