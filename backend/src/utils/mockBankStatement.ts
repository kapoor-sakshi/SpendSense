import { ParsedStatementTransaction } from './bankStatementProcessor';

export function getMockStatementTransactions(bankName: string): ParsedStatementTransaction[] {
  const base = new Date();
  const month = base.getMonth();
  const year = base.getFullYear();
  const d = (day: number) => new Date(year, month, day).toISOString();

  const rows: Array<{
    title: string; amount: number; type: 'income' | 'expense'; date: string; category: string;
    debit: number; credit: number; isSalary?: boolean;
  }> = [
    { title: 'Salary Credit NEFT', amount: 85000, type: 'income', date: d(1), category: 'Salary', debit: 0, credit: 85000, isSalary: true },
    { title: 'UPI Swiggy', amount: 450, type: 'expense', date: d(3), category: 'Restaurant', debit: 450, credit: 0 },
    { title: 'UPI Zomato', amount: 680, type: 'expense', date: d(5), category: 'Restaurant', debit: 680, credit: 0 },
    { title: 'ATM Cash Withdrawal', amount: 5000, type: 'expense', date: d(7), category: 'Others', debit: 5000, credit: 0 },
    { title: 'Electricity Bill BESCOM', amount: 3200, type: 'expense', date: d(9), category: 'Bills', debit: 3200, credit: 0 },
    { title: 'Amazon India', amount: 2499, type: 'expense', date: d(11), category: 'Shopping', debit: 2499, credit: 0 },
    { title: 'Interest Credit', amount: 245, type: 'income', date: d(15), category: 'Income', debit: 0, credit: 245 },
    { title: 'Netflix Subscription', amount: 649, type: 'expense', date: d(17), category: 'Subscription', debit: 649, credit: 0 },
    { title: 'HPCL Fuel', amount: 2800, type: 'expense', date: d(19), category: 'Fuel', debit: 2800, credit: 0 },
    { title: 'BigBasket Grocery', amount: 1850, type: 'expense', date: d(21), category: 'Grocery', debit: 1850, credit: 0 },
    { title: 'NEFT Transfer Received', amount: 15000, type: 'income', date: d(23), category: 'Transfer', debit: 0, credit: 15000 },
    { title: 'EMI Home Loan', amount: 18500, type: 'expense', date: d(25), category: 'EMI', debit: 18500, credit: 0 },
    { title: 'Jio Recharge', amount: 799, type: 'expense', date: d(27), category: 'Bills', debit: 799, credit: 0 },
    { title: 'Flipkart Shopping', amount: 3299, type: 'expense', date: d(28), category: 'Shopping', debit: 3299, credit: 0 },
  ];

  return rows.map(r => ({
    title: `${r.title} (${bankName})`,
    amount: r.amount,
    type: r.type,
    date: r.date,
    category: r.category,
    debitAmount: r.debit,
    creditAmount: r.credit,
    merchantName: r.title,
    isTransfer: r.category === 'Transfer',
    isSalary: !!r.isSalary,
    rawLine: r.title
  }));
}

export function isMockableStatementFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ext === 'pdf' || ['png', 'jpg', 'jpeg'].includes(ext);
}
