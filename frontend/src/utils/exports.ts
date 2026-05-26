import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Transaction } from './mockData';

/**
 * Exports transaction history list as a standard Excel file (.xlsx)
 */
export const exportToExcel = (transactions: Transaction[]) => {
  const formattedData = transactions.map(t => ({
    Date: new Date(t.date).toLocaleDateString(),
    Title: t.title,
    Amount: t.amount,
    Category: t.category,
    Type: t.type.toUpperCase(),
    'Payment Mode': t.paymentMode,
    'Bank/UPI': t.paymentMode === 'UPI' ? t.upiId : t.bankName,
    Notes: t.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  XLSX.writeFile(workbook, 'SpendSense_Transactions_Report.xlsx');
};

/**
 * Exports styled PDF monthly reports containing summaries, overspending flags, and breakdowns
 */
export const exportToPDF = (
  transactions: Transaction[], 
  report: {
    financialSummary: string;
    highestSpendingCategory: string;
    savingsAmount: number;
    emiBurdenPercentage: number;
    subscriptionWasteAmount: number;
  }
) => {
  const doc = new jsPDF();
  
  // Design Theme
  doc.setFillColor(15, 12, 30); // Deep Dark background color for top banner
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('SPENDSENSE AI — FINANCIAL SUMMARY REPORT', 15, 25);
  
  doc.setTextColor(15, 12, 30);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 15, 48);
  
  // Section: Summary Metrics
  doc.setFontSize(14);
  doc.text('1. Key Financial Analytics', 15, 58);
  doc.line(15, 60, 195, 60);
  
  doc.setFontSize(11);
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  doc.text(`Total Income: INR ${totalIncome.toLocaleString('en-IN')}`, 20, 70);
  doc.text(`Total Monthly Expenses: INR ${totalExpense.toLocaleString('en-IN')}`, 20, 78);
  doc.text(`Monthly Savings: INR ${report.savingsAmount.toLocaleString('en-IN')}`, 20, 86);
  doc.text(`Highest Outflow Category: ${report.highestSpendingCategory}`, 20, 94);
  doc.text(`EMI Debt Burden Index: ${report.emiBurdenPercentage}%`, 20, 102);
  doc.text(`Detected Monthly Subscription Waste: INR ${report.subscriptionWasteAmount.toLocaleString('en-IN')}`, 20, 110);

  // Section: AI Summary Paragraph
  doc.setFontSize(14);
  doc.text('2. AI Financial Counselor Summary', 15, 122);
  doc.line(15, 124, 195, 124);
  
  doc.setFontSize(10);
  const splitText = doc.splitTextToSize(report.financialSummary, 175);
  doc.text(splitText, 20, 132);

  // Section: Transaction timeline (first 10 items)
  doc.setFontSize(14);
  doc.text('3. Recent Transactions Log', 15, 160);
  doc.line(15, 162, 195, 162);

  doc.setFontSize(10);
  let y = 172;
  doc.text('Date', 20, y);
  doc.text('Merchant/Title', 45, y);
  doc.text('Category', 105, y);
  doc.text('Mode', 145, y);
  doc.text('Amount', 175, y);
  doc.line(15, y + 2, 195, y + 2);
  
  y += 8;
  transactions.slice(0, 10).forEach(t => {
    doc.text(new Date(t.date).toLocaleDateString(), 20, y);
    doc.text(t.title.length > 25 ? t.title.substring(0, 22) + '...' : t.title, 45, y);
    doc.text(t.category, 105, y);
    doc.text(t.paymentMode, 145, y);
    doc.text(`INR ${t.amount.toLocaleString()}`, 175, y);
    y += 8;
  });

  // Footer banner
  doc.setFillColor(15, 12, 30);
  doc.rect(0, 280, 210, 17, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('© 2026 SpendSense AI. Premium AI Financial Planner.', 70, 290);

  doc.save('SpendSense_Monthly_Report.pdf');
};
