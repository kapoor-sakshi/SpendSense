import {
  ParsedStatementTransaction,
  categorizeStatementEntry,
  parseDateFromRaw,
  parseAmountFromStr,
  cleanStatementDescription
} from './bankStatementProcessor';

export type BankFormat = 'HDFC' | 'ICICI' | 'SBI' | 'Axis' | 'Generic';

export function detectBankFormat(text: string, bankName: string): BankFormat {
  const lower = text.toLowerCase();
  const bank = bankName.toLowerCase();
  if (bank.includes('hdfc') || lower.includes('hdfc bank')) return 'HDFC';
  if (bank.includes('icici') || lower.includes('icici bank')) return 'ICICI';
  if (bank.includes('sbi') || lower.includes('state bank of india') || lower.includes('sbi ')) return 'SBI';
  if (bank.includes('axis') || lower.includes('axis bank')) return 'Axis';
  return 'Generic';
}

const DATE_IN_LINE = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[-\s][A-Za-z]{3}[-\s]\d{2,4})/;
const AMOUNT_IN_LINE = /(?:₹|Rs\.?\s*|INR\s*)?[\d,]+(?:\.\d{1,2})?/gi;

function parseRowWithDebitCredit(
  line: string,
  dateRaw: string,
  description: string,
  debit: number,
  credit: number,
  balance?: number
): ParsedStatementTransaction | null {
  let amount = 0;
  let type: 'income' | 'expense' = 'expense';
  if (credit > 0) { amount = credit; type = 'income'; }
  else if (debit > 0) { amount = debit; type = 'expense'; }
  else return null;

  const cat = categorizeStatementEntry(description);
  if (cat.isSalary) type = 'income';

  return {
    title: cleanStatementDescription(description),
    amount,
    type,
    date: parseDateFromRaw(dateRaw) || new Date().toISOString(),
    category: cat.category,
    debitAmount: debit,
    creditAmount: credit,
    merchantName: cleanStatementDescription(description),
    isTransfer: cat.isTransfer,
    isSalary: cat.isSalary,
    rawLine: line
  };
}

/** HDFC: Date | Narration | Chq/Ref | Value Dt | Withdrawal Amt | Deposit Amt | Closing Balance */
function parseHdfcLines(text: string): ParsedStatementTransaction[] {
  const results: ParsedStatementTransaction[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length < 12) continue;
    const dm = DATE_IN_LINE.exec(trimmed);
    if (!dm) continue;
    const amounts = [...trimmed.matchAll(AMOUNT_IN_LINE)].map(m => parseAmountFromStr(m[0])).filter(a => a > 0);
    if (amounts.length < 2) continue;

    const balance = amounts[amounts.length - 1];
    const credit = amounts.length >= 3 && amounts[amounts.length - 2] > 0 ? amounts[amounts.length - 2] : 0;
    const debit = amounts.length >= 3 ? amounts[amounts.length - 3] : amounts[0];
    let desc = trimmed.slice(dm.index! + dm[0].length)
      .replace(AMOUNT_IN_LINE, ' ').replace(/\s+/g, ' ').trim();
    if (desc.length < 2) desc = 'HDFC Transaction';

    const hasExplicitCr = /\b(deposit|cr)\b/i.test(trimmed);
    const hasExplicitDr = /\b(withdrawal|dr)\b/i.test(trimmed);
    let d = 0, c = 0;
    if (hasExplicitCr && !hasExplicitDr) c = amounts.length >= 2 ? amounts[amounts.length - 2] : amounts[0];
    else if (hasExplicitDr && !hasExplicitCr) d = amounts.length >= 2 ? amounts[amounts.length - 2] : amounts[0];
    else if (amounts.length >= 3) { d = amounts[amounts.length - 3]; c = amounts[amounts.length - 2]; }
    else d = amounts[0];

    const tx = parseRowWithDebitCredit(trimmed, dm[1], desc, d, c, balance);
    if (tx) results.push(tx);
  }
  return results;
}

function parseTabularBankLines(text: string): ParsedStatementTransaction[] {
  const results: ParsedStatementTransaction[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue;
    const parts = trimmed.split(/\t+| {2,}/).map(p => p.trim()).filter(Boolean);
    if (parts.length < 3) continue;

    const datePart = parts.find(p => DATE_IN_LINE.test(p));
    if (!datePart) continue;
    const dm = DATE_IN_LINE.exec(datePart);
    if (!dm) continue;

    const amounts = parts
      .map(p => parseAmountFromStr(p))
      .filter((a, i) => a > 0 && !DATE_IN_LINE.test(parts[i]));

    if (amounts.length === 0) continue;

    const descParts = parts.filter(p =>
      p !== datePart && parseAmountFromStr(p) === 0 && !/^(dr|cr|debit|credit)$/i.test(p)
    );
    const desc = descParts.join(' ').trim() || 'Bank Transaction';

    let debit = 0, credit = 0;
    const drIdx = parts.findIndex(p => /^dr$|debit|withdrawal/i.test(p));
    const crIdx = parts.findIndex(p => /^cr$|credit|deposit/i.test(p));
    if (drIdx >= 0 && amounts[0]) debit = amounts[0];
    if (crIdx >= 0 && amounts[0]) credit = amounts[0];
    if (!debit && !credit) {
      if (amounts.length >= 2) { debit = amounts[0]; credit = amounts[1]; }
      else debit = amounts[0];
    }

    const tx = parseRowWithDebitCredit(trimmed, dm[1], desc, debit, credit);
    if (tx) results.push(tx);
  }
  return results;
}

export function parseByBankFormat(
  text: string,
  format: BankFormat,
  fallbackParser: (t: string) => ParsedStatementTransaction[]
): ParsedStatementTransaction[] {
  let results: ParsedStatementTransaction[] = [];

  switch (format) {
    case 'HDFC':
      results = parseHdfcLines(text);
      break;
    case 'ICICI':
    case 'SBI':
    case 'Axis':
      results = parseTabularBankLines(text);
      if (results.length < 2) results = parseHdfcLines(text);
      break;
    default:
      results = parseTabularBankLines(text);
  }

  if (results.length < 2) results = fallbackParser(text);
  return results;
}
