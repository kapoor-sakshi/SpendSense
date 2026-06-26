import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import BankAccount from '../models/BankAccount';
import Bill from '../models/Bill';
import Notification from '../models/Notification';
import StatementUpload from '../models/StatementUpload';
import {
  computeFileHash,
  processStatementFile,
  UploadStatus
} from '../utils/bankStatementProcessor';
import { getMockStatementTransactions, isMockableStatementFile } from '../utils/mockBankStatement';
import { filterNewStatementTransactions } from '../utils/transactionDeduplication';
import { handleBankStatementUploaded, BANK_STATEMENT_UPLOADED } from './statementPipeline';
import {
  mockTransactions,
  mockBankAccounts,
  mockNotifications,
  mockBills,
  mockStatementHashes,
  TransactionStore,
  NotificationStore,
  BillStore
} from '../utils/mockDB';
import { shouldUseMongoStore } from '../utils/dbMode';

export interface StatementProcessResult {
  success: boolean;
  duplicate?: boolean;
  status: UploadStatus;
  event?: string;
  message: string;
  addedCount: number;
  skippedCount?: number;
  netDifference: number;
  transactions: any[];
  extracted?: Record<string, unknown>;
  analyticsTriggered: boolean;
  pipeline?: Record<string, unknown>;
}

async function checkDuplicateHash(userId: string, fileHash: string): Promise<boolean> {
  if (shouldUseMongoStore(userId)) {
    const existing = await StatementUpload.findOne({ userId, fileHash });
    return !!existing;
  }
  return (mockStatementHashes[userId] || []).includes(fileHash);
}

async function recordUpload(
  userId: string,
  fileHash: string,
  fileName: string,
  fileUrl: string,
  bankName: string,
  status: UploadStatus,
  extractedData?: Record<string, unknown>,
  transactionCount?: number
) {
  if (shouldUseMongoStore(userId)) {
    await StatementUpload.findOneAndUpdate(
      { userId, fileHash },
      { userId, fileHash, fileName, fileUrl, bankName, status, extractedData, transactionCount },
      { upsert: true, new: true }
    );
  } else {
    if (!mockStatementHashes[userId]) mockStatementHashes[userId] = [];
    if (!mockStatementHashes[userId].includes(fileHash)) {
      mockStatementHashes[userId].push(fileHash);
    }
  }
}

export async function processBankStatementUpload(
  userId: string,
  file: Express.Multer.File,
  bankName: string,
  clientOcrText?: string
): Promise<StatementProcessResult> {
  const fileHash = computeFileHash(file.path);
  const fileUrl = `/uploads/${file.filename}`;

  if (await checkDuplicateHash(userId, fileHash)) {
    return {
      success: false,
      duplicate: true,
      status: 'Completed',
      message: 'This bank statement has already been processed. Duplicate upload prevented.',
      addedCount: 0,
      netDifference: 0,
      transactions: [],
      analyticsTriggered: false
    };
  }

  await recordUpload(userId, fileHash, file.originalname, fileUrl, bankName, 'Uploaded');

  await recordUpload(userId, fileHash, file.originalname, fileUrl, bankName, 'Processing');

  let extracted = await processStatementFile(file.path, file.originalname, bankName, clientOcrText);

  if (extracted.transactions.length === 0 && isMockableStatementFile(file.originalname)) {
    const mockTxs = getMockStatementTransactions(bankName);
    const totalDebit = mockTxs.reduce((s, t) => s + t.debitAmount, 0);
    const totalCredit = mockTxs.reduce((s, t) => s + t.creditAmount, 0);
    extracted = {
      ...extracted,
      isBankStatement: true,
      accountName: extracted.accountName || `${bankName} Account`,
      accountNumber: extracted.accountNumber || 'XXXX3708',
      statementPeriod: extracted.statementPeriod || 'Current Month',
      openingBalance: 125000,
      closingBalance: 125000 + totalCredit - totalDebit,
      transactions: mockTxs,
      totalDebit,
      totalCredit,
      salaryEntries: mockTxs.filter(t => t.isSalary),
      parseMethod: 'Mock Statement Data (sample PDF)',
      usedOcr: false
    };
    console.log(`[BankStatement] Using mock data for ${file.originalname} — ${mockTxs.length} transactions`);
  } else if (extracted.transactions.length === 0) {
    await recordUpload(userId, fileHash, file.originalname, fileUrl, bankName, 'Completed', extracted as any, 0);
    return {
      success: false,
      status: 'Completed',
      message: 'No transaction table detected in uploaded statement.',
      addedCount: 0,
      netDifference: 0,
      transactions: [],
      extracted: {
        accountName: extracted.accountName,
        accountNumber: extracted.accountNumber,
        statementPeriod: extracted.statementPeriod,
        parseMethod: extracted.parseMethod,
        ocrConfidence: extracted.ocrConfidence,
        bankFormat: extracted.bankFormat,
        progressLog: extracted.progressLog
      },
      analyticsTriggered: false
    };
  }

  await recordUpload(userId, fileHash, file.originalname, fileUrl, bankName, 'Extracting Transactions');

  const existingTxFields = shouldUseMongoStore(userId)
    ? (await Transaction.find({ userId }).select('amount date title type paymentMode')).map(t => ({
        amount: t.amount,
        date: t.date instanceof Date ? t.date.toISOString() : String(t.date),
        title: t.title,
        type: t.type,
        paymentMode: t.paymentMode
      }))
    : (mockTransactions[userId] || []).map(t => ({
        amount: t.amount,
        date: t.date,
        title: t.title,
        type: t.type,
        paymentMode: t.paymentMode
      }));

  const { newTransactions, skipped } = filterNewStatementTransactions(
    extracted.transactions,
    existingTxFields
  );
  extracted.transactions = newTransactions;

  if (extracted.transactions.length === 0 && skipped > 0) {
    await recordUpload(userId, fileHash, file.originalname, fileUrl, bankName, 'Completed', extracted as any, 0);
    return {
      success: true,
      status: 'Completed',
      message: `All ${skipped} statement entries were already recorded (e.g. via UPI). No duplicates added.`,
      addedCount: 0,
      skippedCount: skipped,
      netDifference: 0,
      transactions: [],
      extracted: {
        accountName: extracted.accountName,
        parseMethod: extracted.parseMethod,
        bankFormat: extracted.bankFormat
      },
      analyticsTriggered: false
    };
  }

  let addedTxList: any[] = [];
  let balanceDiff = 0;

  if (shouldUseMongoStore(userId)) {
    for (const item of extracted.transactions) {
      const tx = new Transaction({
        userId,
        amount: item.amount,
        title: item.title,
        category: item.category,
        date: item.date,
        type: item.type,
        paymentMode: 'Bank',
        bankName,
        notes: item.isSalary ? 'Salary/Paycheck detected' : item.isTransfer ? 'Transfer entry' : undefined
      });
      await tx.save();
      addedTxList.push(tx);
      balanceDiff += item.type === 'income' ? item.amount : -item.amount;
    }

    const bank = await BankAccount.findOne({ userId, bankName });
    if (bank) {
      bank.balance += balanceDiff;
      await bank.save();
    }

    await Bill.create({
      userId,
      fileName: file.originalname,
      fileUrl,
      category: 'bank_statement',
      status: 'processed',
      extractedAmount: extracted.totalDebit + extracted.totalCredit,
      extractedMerchant: extracted.accountName || bankName
    });
  } else {
    for (const item of extracted.transactions) {
      const tx: TransactionStore = {
        id: `tx_stmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        amount: item.amount,
        title: item.title,
        category: item.category,
        date: item.date,
        type: item.type,
        paymentMode: 'Bank',
        bankName
      };
      if (!mockTransactions[userId]) mockTransactions[userId] = [];
      mockTransactions[userId] = [tx, ...mockTransactions[userId]];
      addedTxList.push(tx);
      balanceDiff += item.type === 'income' ? item.amount : -item.amount;
    }

    const bank = (mockBankAccounts[userId] || []).find(b => b.bankName === bankName);
    if (bank) bank.balance += balanceDiff;

    const bill: BillStore = {
      id: `doc_${Date.now()}`,
      fileName: file.originalname,
      fileUrl,
      fileType: 'bank_statement',
      status: 'processed',
      createdAt: new Date().toISOString()
    };
    if (!mockBills[userId]) mockBills[userId] = [];
    mockBills[userId].push(bill);
  }

  await recordUpload(userId, fileHash, file.originalname, fileUrl, bankName, 'Analyzing', extracted as any, addedTxList.length);

  const pipeline = await handleBankStatementUploaded(userId);

  await recordUpload(userId, fileHash, file.originalname, fileUrl, bankName, 'Completed', extracted as any, addedTxList.length);

  const skipNote = skipped > 0 ? ` ${skipped} duplicate(s) skipped (already recorded via UPI or manual entry).` : '';
  const notMessage = `Bank statement processed successfully. ${addedTxList.length} transactions added.${skipNote}`;
  if (shouldUseMongoStore(userId)) {
    await Notification.create({
      userId,
      title: 'Bank Statement Processed',
      message: notMessage,
      type: 'success'
    });
  } else {
    const not: NotificationStore = {
      id: `not_${Date.now()}`,
      title: 'Bank Statement Processed',
      message: notMessage,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    if (!mockNotifications[userId]) mockNotifications[userId] = [];
    mockNotifications[userId] = [not, ...mockNotifications[userId]];
  }

  return {
    success: true,
    status: 'Completed',
    event: BANK_STATEMENT_UPLOADED,
    message: notMessage,
    addedCount: addedTxList.length,
    skippedCount: skipped,
    netDifference: balanceDiff,
    transactions: addedTxList,
    extracted: {
      accountName: extracted.accountName,
      accountNumber: extracted.accountNumber,
      statementPeriod: extracted.statementPeriod,
      openingBalance: extracted.openingBalance,
      closingBalance: extracted.closingBalance,
      totalDebit: extracted.totalDebit,
      totalCredit: extracted.totalCredit,
      salaryEntries: extracted.salaryEntries.length,
      parseMethod: extracted.parseMethod,
      ocrConfidence: extracted.ocrConfidence,
      bankFormat: extracted.bankFormat,
      usedOcr: extracted.usedOcr,
      progressLog: extracted.progressLog
    },
    analyticsTriggered: true,
    pipeline
  };
}
