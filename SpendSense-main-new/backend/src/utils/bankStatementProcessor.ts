import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type UploadStatus =
  | 'Uploaded'
  | 'Processing'
  | 'Extracting Transactions'
  | 'Analyzing'
  | 'Completed';

export interface ParsedStatementTransaction {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
  debitAmount: number;
  creditAmount: number;
  merchantName: string;
  isTransfer: boolean;
  isSalary: boolean;
  rawLine?: string;
}

export interface ExtractedStatementData {
  isBankStatement: boolean;
  accountName: string;
  accountNumber: string;
  statementPeriod: string;
  openingBalance: number;
  closingBalance: number;
  transactions: ParsedStatementTransaction[];
  totalDebit: number;
  totalCredit: number;
  salaryEntries: ParsedStatementTransaction[];
  parseMethod: string;
  ocrConfidence?: number;
  progressLog?: string[];
  bankFormat?: string;
  usedOcr?: boolean;
}

export function computeFileHash(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const SALARY_KEYWORDS = /\b(salary|paycheck|payroll|income|deposit|sal cr|salary credit|wages|pay roll)\b/i;
const TRANSFER_KEYWORDS = /\b(transfer|neft|imps|rtgs|upi\/|sent to|received from|fund transfer)\b/i;

export function categorizeStatementEntry(description: string): {
  category: string;
  type: 'income' | 'expense';
  isSalary: boolean;
  isTransfer: boolean;
} {
  const d = description.toLowerCase();
  const isSalary = SALARY_KEYWORDS.test(d);
  const isTransfer = TRANSFER_KEYWORDS.test(d);

  if (isSalary) return { category: 'Salary', type: 'income', isSalary: true, isTransfer: false };
  if (/\b(neft cr|imps cr|upi cr|credit|refund|interest credit|dividend|cashback)\b/.test(d)) {
    return { category: 'Income', type: 'income', isSalary: false, isTransfer: false };
  }
  if (/\b(grocery|groceries|supermarket|bigbasket|blinkit|zepto|dmart)\b/.test(d)) {
    return { category: 'Grocery', type: 'expense', isSalary: false, isTransfer: isTransfer };
  }
  if (/\b(restaurant|swiggy|zomato|food|cafe|dining|mcdonald|kfc|pizza|starbucks)\b/.test(d)) {
    return { category: 'Restaurant', type: 'expense', isSalary: false, isTransfer: isTransfer };
  }
  if (/\b(fuel|petrol|diesel|shell|hpcl|iocl|bharat petroleum)\b/.test(d)) {
    return { category: 'Fuel', type: 'expense', isSalary: false, isTransfer: isTransfer };
  }
  if (/\b(amazon|flipkart|myntra|shopping|mall|zara)\b/.test(d)) {
    return { category: 'Shopping', type: 'expense', isSalary: false, isTransfer: isTransfer };
  }
  if (/\b(electricity|water|gas|broadband|wifi|bill|recharge|jio|airtel|utility)\b/.test(d)) {
    return { category: 'Bills', type: 'expense', isSalary: false, isTransfer: isTransfer };
  }
  if (/\b(emi|loan repayment|mortgage|loan emi)\b/.test(d)) {
    return { category: 'EMI', type: 'expense', isSalary: false, isTransfer: false };
  }
  if (/\b(insurance|lic premium|policy premium)\b/.test(d)) {
    return { category: 'Insurance', type: 'expense', isSalary: false, isTransfer: isTransfer };
  }
  if (/\b(netflix|spotify|prime|hotstar|subscription|ott)\b/.test(d)) {
    return { category: 'Subscription', type: 'expense', isSalary: false, isTransfer: isTransfer };
  }
  if (isTransfer) return { category: 'Transfer', type: 'expense', isSalary: false, isTransfer: true };
  if (/\b(groww|sip|mutual|stock|investment|zerodha)\b/.test(d)) {
    return { category: 'Investment', type: 'expense', isSalary: false, isTransfer: isTransfer };
  }
  return { category: 'Others', type: 'expense', isSalary: false, isTransfer: isTransfer };
}

export function isBankStatementContent(text: string, fileName: string): boolean {
  const lower = text.toLowerCase();
  const nameLower = fileName.toLowerCase();
  if (/statement|passbook|ledger|account.?summary/.test(nameLower)) return true;
  const keywords = [
    'account statement', 'bank statement', 'statement of account',
    'opening balance', 'closing balance', 'transaction history',
    'narration', 'particulars', 'debit', 'credit',
    'account number', 'ifsc', 'statement period', 'txn date'
  ];
  let score = keywords.filter(kw => lower.includes(kw)).length;
  return score >= 2 || (lower.includes('balance') && /\d{1,2}[\/\-]\d{1,2}/.test(lower));
}

function parseAmount(str: string): number {
  const val = parseFloat(str.replace(/₹|Rs\.?|INR|\$|,/gi, '').trim());
  return isNaN(val) ? 0 : Math.abs(val);
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

const AMOUNT_PATTERN = /(?:₹|Rs\.?\s*|INR\s*)?[\d,]+(?:\.\d{1,2})?/gi;
const DATE_START_PATTERN = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[-\s][A-Za-z]{3}[-\s]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/;

function parseDate(raw: string): string | null {
  if (!raw?.trim()) return null;
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
  return !isNaN(d.getTime()) && d.getFullYear() > 2000 ? d.toISOString() : null;
}

function extractAmountsFromLine(line: string): number[] {
  return [...line.matchAll(AMOUNT_PATTERN)]
    .map(m => parseAmount(m[0]))
    .filter(a => a > 0 && a < 50_000_000);
}

function buildTransactionFromLine(
  line: string,
  dateRaw: string,
  desc: string,
  amount: number,
  typeHint?: 'income' | 'expense'
): ParsedStatementTransaction | null {
  if (amount <= 0 || desc.length < 1) return null;
  const cat = categorizeStatementEntry(desc);
  let type: 'income' | 'expense' = typeHint || cat.type;
  const lineUpper = line.toUpperCase();
  if (lineUpper.includes(' CR') || lineUpper.includes('CREDIT') || cat.isSalary) type = 'income';
  if (lineUpper.includes(' DR') || lineUpper.includes('DEBIT')) type = 'expense';

  return {
    title: cleanDescription(desc),
    amount,
    type,
    date: parseDate(dateRaw) || new Date().toISOString(),
    category: cat.category,
    debitAmount: type === 'expense' ? amount : 0,
    creditAmount: type === 'income' ? amount : 0,
    merchantName: cleanDescription(desc),
    isTransfer: cat.isTransfer,
    isSalary: cat.isSalary,
    rawLine: line
  };
}

function parseFlexibleBankLines(text: string): ParsedStatementTransaction[] {
  const results: ParsedStatementTransaction[] = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 5);

  for (const line of lines) {
    if (/^(date|sl\.?no|sr\.?no|txn|narration|particulars|opening|closing|statement period|account)/i.test(line)) continue;

    const dateMatch = DATE_START_PATTERN.exec(line);
    if (!dateMatch) continue;

    const dateRaw = dateMatch[1];
    const rest = line.slice(dateMatch[0].length).trim();
    const amounts = extractAmountsFromLine(rest);
    if (amounts.length === 0) continue;

    const txAmount = amounts.length >= 2 ? amounts[amounts.length - 2] : amounts[0];
    let desc = rest
      .replace(AMOUNT_PATTERN, ' ')
      .replace(/\b(dr|cr|debit|credit)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (desc.length < 2) desc = 'Bank Transaction';

    const tx = buildTransactionFromLine(line, dateRaw, desc, txAmount);
    if (tx) results.push(tx);
  }

  return results;
}

function cleanDescription(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().substring(0, 80) || 'Transaction';
}

function extractMetadata(text: string) {
  const accountName =
    text.match(/account\s*holder[:\s]+([^\n]+)/i)?.[1]?.trim() ||
    text.match(/customer\s*name[:\s]+([^\n]+)/i)?.[1]?.trim() ||
    '';
  const accountNumber =
    text.match(/account\s*(?:no|number|#)[:\s]*[\*x]*(\d{4,})/i)?.[1] ||
    text.match(/a\/c\s*(?:no)?[:\s]*[\*x]*(\d{4,})/i)?.[1] ||
    '';
  const statementPeriod =
    text.match(/statement\s*period[:\s]+([^\n]+)/i)?.[1]?.trim() ||
    text.match(/from\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+to\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[0] ||
    '';
  const openingBalance = parseAmount(
    text.match(/opening\s*balance[:\s]*[₹$]?\s*([\d,]+\.?\d*)/i)?.[1] || '0'
  );
  const closingBalance = parseAmount(
    text.match(/closing\s*balance[:\s]*[₹$]?\s*([\d,]+\.?\d*)/i)?.[1] || '0'
  );
  return { accountName, accountNumber, statementPeriod, openingBalance, closingBalance };
}

function parseCSVText(text: string): ParsedStatementTransaction[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes('|') ? '|' : ',';
  const headers = lines[0].split(delimiter).map(h => h.replace(/["']/g, '').trim().toLowerCase());
  const colIdx = {
    date: headers.findIndex(h => /date|txn.?date/.test(h)),
    description: headers.findIndex(h => /description|narration|particulars|details|merchant/.test(h)),
    debit: headers.findIndex(h => /debit|dr|withdrawal/.test(h)),
    credit: headers.findIndex(h => /credit|cr|deposit/.test(h)),
    amount: headers.findIndex(h => h === 'amount' || h === 'amt'),
  };
  if (colIdx.description === -1 && headers.length > 1) colIdx.description = 1;

  const results: ParsedStatementTransaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.replace(/["']/g, '').trim());
    const description = colIdx.description >= 0 ? cols[colIdx.description] : cols[1] || '';
    if (!description || description.length < 2) continue;

    const rawCredit = colIdx.credit >= 0 ? cols[colIdx.credit] : '';
    const rawDebit = colIdx.debit >= 0 ? cols[colIdx.debit] : '';
    const rawAmount = colIdx.amount >= 0 ? cols[colIdx.amount] : '';
    let amount = 0;
    let debitAmount = 0;
    let creditAmount = 0;
    let type: 'income' | 'expense' = 'expense';

    if (rawCredit && parseAmount(rawCredit) > 0) {
      creditAmount = parseAmount(rawCredit);
      amount = creditAmount;
      type = 'income';
    } else if (rawDebit && parseAmount(rawDebit) > 0) {
      debitAmount = parseAmount(rawDebit);
      amount = debitAmount;
      type = 'expense';
    } else if (rawAmount) {
      amount = parseAmount(rawAmount);
      const cat = categorizeStatementEntry(description);
      type = cat.type;
      if (type === 'income') creditAmount = amount;
      else debitAmount = amount;
    }
    if (amount <= 0) continue;

    const cat = categorizeStatementEntry(description);
    if (cat.isSalary) type = 'income';

    const dateStr = colIdx.date >= 0 ? parseDate(cols[colIdx.date]) : null;
    results.push({
      title: cleanDescription(description),
      amount,
      type,
      date: dateStr || new Date().toISOString(),
      category: cat.category,
      debitAmount,
      creditAmount,
      merchantName: cleanDescription(description),
      isTransfer: cat.isTransfer,
      isSalary: cat.isSalary,
      rawLine: lines[i]
    });
  }
  return results;
}

function parsePlainText(text: string): ParsedStatementTransaction[] {
  const flexible = parseFlexibleBankLines(text);
  if (flexible.length > 0) return flexible;

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  const results: ParsedStatementTransaction[] = [];
  const datePattern = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2}|\d{1,2}[-\s][A-Za-z]{3}[-\s]\d{2,4})\b/;

  for (const line of lines) {
    if (/^(date|sl|sr|transaction|narration|opening|closing|statement)/i.test(line)) continue;
    const dateMatch = datePattern.exec(line);
    const amounts = extractAmountsFromLine(line);
    if (!dateMatch || amounts.length === 0) continue;

    let desc = line.replace(datePattern, '').replace(AMOUNT_PATTERN, '')
      .replace(/\b(dr|cr|debit|credit)\b/gi, '').replace(/\s+/g, ' ').trim();
    if (desc.length < 2) continue;

    const tx = buildTransactionFromLine(line, dateMatch[0], desc, amounts[0]);
    if (tx) results.push(tx);
  }
  return results;
}

export { parseAmount as parseAmountFromStr, parseDate as parseDateFromRaw, cleanDescription as cleanStatementDescription };

export async function processStatementFile(
  filePath: string,
  originalName: string,
  bankName: string,
  clientOcrText?: string
): Promise<ExtractedStatementData> {
  const { extractTextFromFileWithOcr } = await import('./bankStatementOcr');
  const { detectBankFormat, parseByBankFormat } = await import('./bankFormatParsers');

  const ocrResult = await extractTextFromFileWithOcr(filePath, originalName, undefined, clientOcrText);
  const text = ocrResult.text;
  const parseMethod = ocrResult.parseMethod;
  const metadata = extractMetadata(text);
  const isBankStatement = isBankStatementContent(text, originalName);

  let transactions = parseCSVText(text);
  if (transactions.length < 2) {
    const normalized = text.split('\n').map(l => l.replace(/\s{3,}/g, '\t')).join('\n');
    transactions = parseCSVText(normalized);
  }
  if (transactions.length < 2) {
    transactions = parsePlainText(text);
  }
  if (transactions.length < 2) {
    transactions = parseFlexibleBankLines(text);
  }

  const bankFormat = detectBankFormat(text, bankName);
  if (transactions.length < 2) {
    transactions = parseByBankFormat(text, bankFormat, (t) => {
      const flex = parseFlexibleBankLines(t);
      if (flex.length >= 1) return flex;
      return parsePlainText(t);
    });
  }

  const seen = new Set<string>();
  transactions = transactions.filter(t => {
    const key = `${t.amount}-${t.date.slice(0, 10)}-${t.title.slice(0, 15)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const salaryEntries = transactions.filter(t => t.isSalary || t.category === 'Salary');
  const totalDebit = transactions.reduce((s, t) => s + t.debitAmount, 0);
  const totalCredit = transactions.reduce((s, t) => s + t.creditAmount, 0);

  return {
    isBankStatement: isBankStatement || transactions.length >= 1 || /\.pdf$/i.test(originalName),
    accountName: metadata.accountName || bankName,
    accountNumber: metadata.accountNumber,
    statementPeriod: metadata.statementPeriod,
    openingBalance: metadata.openingBalance,
    closingBalance: metadata.closingBalance,
    transactions,
    totalDebit,
    totalCredit,
    salaryEntries,
    parseMethod,
    ocrConfidence: ocrResult.ocrConfidence,
    progressLog: ocrResult.progressLog,
    bankFormat,
    usedOcr: ocrResult.usedOcr
  };
}
