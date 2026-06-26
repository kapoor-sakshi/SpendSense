export interface TxMatchFields {
  amount: number;
  date: string;
  title: string;
  type: 'income' | 'expense' | string;
  paymentMode?: string;
}

const NOISE_WORDS = new Set([
  'hdfc', 'icici', 'sbi', 'axis', 'bank', 'payment', 'txn', 'transaction',
  'upi', 'neft', 'imps', 'rtgs', 'debit', 'credit', 'transfer', 'paid', 'received'
]);

function sameCalendarDay(a: string, b: string): boolean {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function sameMonth(a: string, b: string): boolean {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

function withinDays(a: string, b: string, days: number): boolean {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) <= days * 86400000;
}

function datesMatchForDedup(incoming: TxMatchFields, existing: TxMatchFields): boolean {
  if (sameCalendarDay(incoming.date, existing.date)) return true;
  if (withinDays(incoming.date, existing.date, 7)) return true;
  if (existing.paymentMode === 'UPI' && sameMonth(incoming.date, existing.date)) return true;
  return false;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\b(upi|neft|imps|rtgs|payment|txn|debit|credit|cr|dr)\b/gi, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function merchantTokens(title: string): string[] {
  return normalizeTitle(title)
    .split(' ')
    .filter(t => t.length >= 3 && !NOISE_WORDS.has(t));
}

export function isDuplicateTransaction(incoming: TxMatchFields, existing: TxMatchFields): boolean {
  if (incoming.type !== existing.type) return false;
  if (Math.abs(Number(incoming.amount) - Number(existing.amount)) > 0.01) return false;
  if (!datesMatchForDedup(incoming, existing)) return false;

  const inNorm = normalizeTitle(incoming.title);
  const exNorm = normalizeTitle(existing.title);
  if (!inNorm || !exNorm) return false;

  if (inNorm === exNorm) return true;
  if (inNorm.includes(exNorm) || exNorm.includes(inNorm)) return true;

  const inTokens = merchantTokens(incoming.title);
  const exTokens = merchantTokens(existing.title);
  if (inTokens.length === 0 || exTokens.length === 0) return false;

  return inTokens.some(t =>
    exTokens.some(e => e === t || e.includes(t) || t.includes(e))
  );
}

export function filterNewStatementTransactions<T extends TxMatchFields>(
  incoming: T[],
  existing: TxMatchFields[]
): { newTransactions: T[]; skipped: number } {
  const newTransactions = incoming.filter(
    item => !existing.some(ex => isDuplicateTransaction(item, ex))
  );
  return {
    newTransactions,
    skipped: incoming.length - newTransactions.length
  };
}

export function inferBankFromUpiId(upiId: string): string | undefined {
  const lower = upiId.toLowerCase();
  if (lower.includes('hdfc')) return 'HDFC';
  if (lower.includes('sbi')) return 'SBI';
  if (lower.includes('icici')) return 'ICICI';
  if (lower.includes('axis')) return 'Axis';
  if (lower.includes('paytm')) return 'Paytm';
  return undefined;
}
