import { ParsedTransaction } from './statementParser';

/** Realistic HDFC-style sample statement transactions (matches typical official statement PDFs). */
export function getMockStatementTransactions(bankName: string): ParsedTransaction[] {
  const base = new Date();
  const month = base.getMonth();
  const year = base.getFullYear();

  const d = (day: number) => new Date(year, month, day).toISOString();

  return [
    { title: 'Salary Credit NEFT', amount: 85000, type: 'income', date: d(1), category: 'Salary', rawLine: '01/xx Salary Credit' },
    { title: 'UPI Swiggy', amount: 450, type: 'expense', date: d(3), category: 'Restaurant', rawLine: '03/xx UPI-SWIGGY' },
    { title: 'UPI Zomato', amount: 680, type: 'expense', date: d(5), category: 'Restaurant', rawLine: '05/xx UPI-ZOMATO' },
    { title: 'ATM Cash Withdrawal', amount: 5000, type: 'expense', date: d(7), category: 'Others', rawLine: '07/xx ATM WDL' },
    { title: 'Electricity Bill BESCOM', amount: 3200, type: 'expense', date: d(9), category: 'Bills', rawLine: '09/xx BESCOM' },
    { title: 'Amazon India', amount: 2499, type: 'expense', date: d(11), category: 'Shopping', rawLine: '11/xx AMAZON' },
    { title: 'Interest Credit', amount: 245, type: 'income', date: d(15), category: 'Income', rawLine: '15/xx INT CREDIT' },
    { title: 'Netflix Subscription', amount: 649, type: 'expense', date: d(17), category: 'Subscription', rawLine: '17/xx NETFLIX' },
    { title: 'HPCL Fuel', amount: 2800, type: 'expense', date: d(19), category: 'Fuel', rawLine: '19/xx HPCL' },
    { title: 'BigBasket Grocery', amount: 1850, type: 'expense', date: d(21), category: 'Grocery', rawLine: '21/xx BIGBASKET' },
    { title: 'NEFT Transfer Received', amount: 15000, type: 'income', date: d(23), category: 'Transfer', rawLine: '23/xx NEFT CR' },
    { title: 'EMI Home Loan', amount: 18500, type: 'expense', date: d(25), category: 'EMI', rawLine: '25/xx EMI HL' },
    { title: 'Jio Recharge', amount: 799, type: 'expense', date: d(27), category: 'Bills', rawLine: '27/xx JIO' },
    { title: 'Flipkart Shopping', amount: 3299, type: 'expense', date: d(28), category: 'Shopping', rawLine: '28/xx FLIPKART' },
  ].map(tx => ({ ...tx, title: `${tx.title} (${bankName})` }));
}

export function isMockableStatementFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ext === 'pdf' || ['png', 'jpg', 'jpeg'].includes(ext);
}
