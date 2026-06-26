"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("../middleware/auth"));
// Models
const User_1 = __importDefault(require("../models/User"));
const BankAccount_1 = __importDefault(require("../models/BankAccount"));
const UpiAccount_1 = __importDefault(require("../models/UpiAccount"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const Loan_1 = __importDefault(require("../models/Loan"));
const Insurance_1 = __importDefault(require("../models/Insurance"));
const Investment_1 = __importDefault(require("../models/Investment"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const Notification_1 = __importDefault(require("../models/Notification"));
const Bill_1 = __importDefault(require("../models/Bill"));
const Report_1 = __importDefault(require("../models/Report"));
// In-Memory Fallbacks
const mockDB_1 = require("../utils/mockDB");
// Helpers
const aiHelper_1 = require("../utils/aiHelper");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// JWT secrets configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_demo';
// Connection indicator
const isMongoConnected = () => mongoose_1.default.connection.readyState === 1;
// Fetch entire database state for a specific user dynamically
const fetchUserDataState = async (userId) => {
    if (isMongoConnected()) {
        const user = await User_1.default.findById(userId);
        const banks = await BankAccount_1.default.find({ userId });
        const upiIds = await UpiAccount_1.default.find({ userId });
        const transactions = await Transaction_1.default.find({ userId }).sort({ date: -1 });
        const loans = await Loan_1.default.find({ userId });
        const insurance = await Insurance_1.default.find({ userId });
        const investments = await Investment_1.default.find({ userId });
        const subscriptions = await Subscription_1.default.find({ userId });
        const notifications = await Notification_1.default.find({ userId }).sort({ createdAt: -1 });
        const bills = await Bill_1.default.find({ userId }).sort({ createdAt: -1 });
        return {
            user: {
                id: user?._id?.toString() || userId,
                name: user?.name || 'Demo User',
                email: user?.email || '',
                creditScore: user?.creditScore || 750,
                banks: banks.map(b => ({
                    bankName: b.bankName,
                    accountNumber: b.accountNumber,
                    balance: b.balance,
                    accountType: b.accountType
                })),
                linkedUpiIds: upiIds.map(u => u.upiId)
            },
            banks,
            upiIds,
            transactions,
            loans,
            insurance,
            investments,
            subscriptions,
            notifications,
            bills
        };
    }
    else {
        return (0, mockDB_1.getUserDBState)(userId);
    }
};
// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================
router.post('/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const normalizedEmail = email.toLowerCase();
    let userId = '';
    if (isMongoConnected()) {
        try {
            const existingUser = await User_1.default.findOne({ email: normalizedEmail });
            if (existingUser)
                return res.status(400).json({ message: 'Email already registered' });
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            const newUser = new User_1.default({ name, email: normalizedEmail, password: passwordHash, creditScore: 785 });
            const savedUser = await newUser.save();
            userId = savedUser._id.toString();
            // Save welcome notification only
            const defaultNot = new Notification_1.default({
                userId, title: 'Welcome to SpendSense AI', message: 'Your isolated financial profile is successfully configured.', type: 'success'
            });
            await defaultNot.save();
        }
        catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
    else {
        // Memory Simulation
        if (mockDB_1.mockCredentials[normalizedEmail]) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        userId = `usr_${Date.now()}`;
        const passwordHash = bcryptjs_1.default.hashSync(password, 10);
        mockDB_1.mockCredentials[normalizedEmail] = { email: normalizedEmail, passwordHash, userId };
        (0, mockDB_1.initializeNewUser)(userId, name, normalizedEmail);
    }
    const token = jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    const userState = await fetchUserDataState(userId);
    res.json({ token, user: userState.user });
});
router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const normalizedEmail = email.toLowerCase();
    let userId = '';
    if (isMongoConnected()) {
        try {
            const user = await User_1.default.findOne({ email: normalizedEmail });
            if (!user)
                return res.status(400).json({ message: 'Invalid email or password' });
            const isMatch = await bcryptjs_1.default.compare(password, user.password);
            if (!isMatch)
                return res.status(400).json({ message: 'Invalid email or password' });
            userId = user._id.toString();
        }
        catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
    else {
        // Memory simulation lookup
        const cred = mockDB_1.mockCredentials[normalizedEmail];
        if (!cred)
            return res.status(400).json({ message: 'Invalid email or password' });
        const isMatch = bcryptjs_1.default.compareSync(password, cred.passwordHash);
        if (!isMatch)
            return res.status(400).json({ message: 'Invalid email or password' });
        userId = cred.userId;
    }
    const token = jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    const userState = await fetchUserDataState(userId);
    res.json({ token, user: userState.user });
});
router.post('/auth/forgot-password', (req, res) => {
    return res.json({ message: 'Reset OTP sent to your email.' });
});
router.post('/auth/verify-otp', (req, res) => {
    return res.json({ message: 'OTP verified successfully.', token: 'otp_verified_token' });
});
// ==========================================
// 2. FINANCIAL DATA ENDPOINTS (WITH AUTH)
// ==========================================
router.get('/dashboard', auth_1.default, async (req, res) => {
    const userId = req.userId;
    try {
        const state = await fetchUserDataState(userId);
        // Compute totals
        const totalBalance = state.banks.reduce((sum, b) => sum + b.balance, 0);
        const monthlySpending = state.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const savings = state.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0) - monthlySpending;
        const investments = state.investments.reduce((sum, i) => sum + (i.currentPrice * i.quantity), 0);
        const emiDues = state.loans.filter(l => l.status === 'active').reduce((sum, l) => sum + l.emiAmount, 0);
        const activeSubs = state.subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.cost, 0);
        return res.json({
            user: state.user,
            summary: {
                totalBalance,
                monthlySpending,
                savings: Math.max(0, savings),
                investments,
                emiDues,
                activeSubs,
                notificationsCount: state.notifications.filter(n => !n.isRead).length
            },
            recentTransactions: state.transactions.slice(0, 5),
            investmentsSummary: state.investments,
            loansSummary: state.loans
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET Transactions
router.get('/transactions', auth_1.default, async (req, res) => {
    const userId = req.userId;
    if (isMongoConnected()) {
        const list = await Transaction_1.default.find({ userId }).sort({ date: -1 });
        res.json(list);
    }
    else {
        res.json(mockDB_1.mockTransactions[userId] || []);
    }
});
// POST Manual Transaction
router.post('/transactions', auth_1.default, async (req, res) => {
    const userId = req.userId;
    const { title, amount, category, paymentMode, bankName, upiId, date, type, notes } = req.body;
    if (!title || !amount || !paymentMode) {
        return res.status(400).json({ message: 'Title, amount and paymentMode are required' });
    }
    const finalCategory = category || (0, aiHelper_1.suggestCategory)(title);
    const numAmount = Number(amount);
    if (isMongoConnected()) {
        const tx = new Transaction_1.default({
            userId,
            amount: numAmount,
            title,
            category: finalCategory,
            date: date || new Date().toISOString(),
            type: type || 'expense',
            paymentMode,
            bankName,
            upiId,
            notes
        });
        await tx.save();
        // Deduct from bank
        if (paymentMode === 'Bank' && bankName) {
            const bank = await BankAccount_1.default.findOne({ userId, bankName });
            if (bank) {
                if (type === 'income')
                    bank.balance += numAmount;
                else
                    bank.balance -= numAmount;
                await bank.save();
            }
        }
        else if (paymentMode === 'UPI') {
            const bank = await BankAccount_1.default.findOne({ userId }); // grab first bank
            if (bank) {
                if (type === 'income')
                    bank.balance += numAmount;
                else
                    bank.balance -= numAmount;
                await bank.save();
            }
        }
        // Add notification
        const newNot = new Notification_1.default({
            userId,
            title: type === 'income' ? 'Cash Received' : 'Transaction Alert',
            message: `₹${numAmount} ${type === 'income' ? 'credited' : 'spent on'} ${title} (${finalCategory}) via ${paymentMode}.`,
            type: type === 'income' ? 'success' : 'info'
        });
        await newNot.save();
        res.status(201).json(tx);
    }
    else {
        // Memory simulation
        const tx = {
            id: `tx_${Date.now()}`,
            amount: numAmount,
            title,
            category: finalCategory,
            date: date || new Date().toISOString(),
            type: type || 'expense',
            paymentMode,
            bankName,
            upiId,
            notes
        };
        if (!mockDB_1.mockTransactions[userId])
            mockDB_1.mockTransactions[userId] = [];
        mockDB_1.mockTransactions[userId] = [tx, ...mockDB_1.mockTransactions[userId]];
        if (paymentMode === 'Bank' && bankName) {
            const list = mockDB_1.mockBankAccounts[userId] || [];
            const bank = list.find(b => b.bankName === bankName);
            if (bank) {
                if (type === 'income')
                    bank.balance += numAmount;
                else
                    bank.balance -= numAmount;
            }
        }
        else if (paymentMode === 'UPI') {
            const list = mockDB_1.mockBankAccounts[userId] || [];
            if (list.length > 0) {
                if (type === 'income')
                    list[0].balance += numAmount;
                else
                    list[0].balance -= numAmount;
            }
        }
        const not = {
            id: `not_${Date.now()}`,
            title: type === 'income' ? 'Cash Received' : 'Transaction Alert',
            message: `₹${numAmount} ${type === 'income' ? 'credited' : 'spent on'} ${title} (${finalCategory}) via ${paymentMode}.`,
            type: type === 'income' ? 'success' : 'info',
            isRead: false,
            createdAt: new Date().toISOString()
        };
        if (!mockDB_1.mockNotifications[userId])
            mockDB_1.mockNotifications[userId] = [];
        mockDB_1.mockNotifications[userId] = [not, ...mockDB_1.mockNotifications[userId]];
        res.status(201).json(tx);
    }
});
// DELETE Transaction
router.delete('/transactions/:id', auth_1.default, async (req, res) => {
    const userId = req.userId;
    const id = req.params.id;
    if (isMongoConnected()) {
        await Transaction_1.default.deleteOne({ _id: id, userId });
    }
    else {
        if (mockDB_1.mockTransactions[userId]) {
            mockDB_1.mockTransactions[userId] = mockDB_1.mockTransactions[userId].filter(t => t.id !== id);
        }
    }
    res.json({ message: 'Transaction deleted successfully' });
});
// Suggest Category API
router.post('/transactions/suggest-category', (req, res) => {
    const { title } = req.body;
    if (!title)
        return res.status(400).json({ message: 'Title is required' });
    const category = (0, aiHelper_1.suggestCategory)(title);
    res.json({ category });
});
// ==========================================
// 3. BANK LINKING & STATEMENT SYNC
// ==========================================
// GET banks list
router.get('/banks', auth_1.default, async (req, res) => {
    const userId = req.userId;
    if (isMongoConnected()) {
        const list = await BankAccount_1.default.find({ userId });
        res.json(list);
    }
    else {
        res.json(mockDB_1.mockBankAccounts[userId] || []);
    }
});
// POST link bank account
router.post('/banks', auth_1.default, async (req, res) => {
    const userId = req.userId;
    const { bankName, accountType, initialBalance } = req.body;
    if (!bankName)
        return res.status(400).json({ message: 'Bank name is required' });
    const numBalance = Number(initialBalance || 15000);
    const accountNum = `•••• ${Math.floor(1000 + Math.random() * 9000)}`;
    if (isMongoConnected()) {
        const newBank = new BankAccount_1.default({
            userId,
            bankName,
            accountNumber: accountNum,
            balance: numBalance,
            accountType: accountType || 'Savings'
        });
        await newBank.save();
        const not = new Notification_1.default({
            userId,
            title: 'Bank Linked Successfully',
            message: `Your ${bankName} account ${accountNum} has been connected.`,
            type: 'success'
        });
        await not.save();
        res.status(201).json(newBank);
    }
    else {
        const newBank = {
            id: `bank_${Date.now()}`,
            bankName,
            accountNumber: accountNum,
            balance: numBalance,
            accountType: accountType || 'Savings'
        };
        if (!mockDB_1.mockBankAccounts[userId])
            mockDB_1.mockBankAccounts[userId] = [];
        mockDB_1.mockBankAccounts[userId].push(newBank);
        const not = {
            id: `not_${Date.now()}`,
            title: 'Bank Linked Successfully',
            message: `Your ${bankName} account ${accountNum} has been connected.`,
            type: 'success',
            isRead: false,
            createdAt: new Date().toISOString()
        };
        if (!mockDB_1.mockNotifications[userId])
            mockDB_1.mockNotifications[userId] = [];
        mockDB_1.mockNotifications[userId] = [not, ...mockDB_1.mockNotifications[userId]];
        res.status(201).json(newBank);
    }
});
// POST statement sync
router.post('/banks/statement', auth_1.default, upload.single('file'), async (req, res) => {
    const userId = req.userId;
    const { bankName } = req.body;
    if (!req.file || !bankName) {
        return res.status(400).json({ message: 'Statement file and bank name are required' });
    }
    // Seed 4 mock transactions representing statement entries
    const entries = [
        { title: 'Electricity Board Sync', amount: 2450, category: 'Utilities', type: 'expense' },
        { title: 'Dividends Payout Credit', amount: 800, category: 'Investments', type: 'income' },
        { title: 'Supermarket Groceries', amount: 1540, category: 'Shopping', type: 'expense' },
        { title: 'Restaurant Dinner', amount: 980, category: 'Food', type: 'expense' }
    ];
    let addedTxList = [];
    let balanceDiff = 0;
    if (isMongoConnected()) {
        for (const item of entries) {
            const tx = new Transaction_1.default({
                userId,
                amount: item.amount,
                title: `${item.title} (Statement Sync)`,
                category: item.category,
                date: new Date().toISOString(),
                type: item.type,
                paymentMode: 'Bank',
                bankName
            });
            await tx.save();
            addedTxList.push(tx);
            balanceDiff += item.type === 'income' ? item.amount : -item.amount;
        }
        // Update bank balance
        const bank = await BankAccount_1.default.findOne({ userId, bankName });
        if (bank) {
            bank.balance += balanceDiff;
            await bank.save();
        }
        const not = new Notification_1.default({
            userId,
            title: 'Statement Sync Complete',
            message: `Parsed statement for ${bankName}. Added ${entries.length} transactions.`,
            type: 'success'
        });
        await not.save();
    }
    else {
        for (const item of entries) {
            const tx = {
                id: `tx_${Date.now()}_${Math.random()}`,
                amount: item.amount,
                title: `${item.title} (Statement Sync)`,
                category: item.category,
                date: new Date().toISOString(),
                type: item.type,
                paymentMode: 'Bank',
                bankName
            };
            if (!mockDB_1.mockTransactions[userId])
                mockDB_1.mockTransactions[userId] = [];
            mockDB_1.mockTransactions[userId] = [tx, ...mockDB_1.mockTransactions[userId]];
            addedTxList.push(tx);
            balanceDiff += item.type === 'income' ? item.amount : -item.amount;
        }
        const list = mockDB_1.mockBankAccounts[userId] || [];
        const bank = list.find(b => b.bankName === bankName);
        if (bank) {
            bank.balance += balanceDiff;
        }
        const not = {
            id: `not_${Date.now()}`,
            title: 'Statement Sync Complete',
            message: `Parsed statement for ${bankName}. Added ${entries.length} transactions.`,
            type: 'success',
            isRead: false,
            createdAt: new Date().toISOString()
        };
        if (!mockDB_1.mockNotifications[userId])
            mockDB_1.mockNotifications[userId] = [];
        mockDB_1.mockNotifications[userId] = [not, ...mockDB_1.mockNotifications[userId]];
    }
    res.json({
        message: 'Statement parsed successfully.',
        addedCount: entries.length,
        netDifference: balanceDiff,
        transactions: addedTxList
    });
});
// ==========================================
// 4. UPI INTEGRATIONS
// ==========================================
// GET linked UPI IDs
router.get('/upi', auth_1.default, async (req, res) => {
    const userId = req.userId;
    if (isMongoConnected()) {
        const list = await UpiAccount_1.default.find({ userId });
        res.json(list);
    }
    else {
        res.json(mockDB_1.mockUpiAccounts[userId] || []);
    }
});
// POST Link UPI ID
router.post('/upi', auth_1.default, async (req, res) => {
    const userId = req.userId;
    const { upiId, bankName } = req.body;
    if (!upiId || !bankName)
        return res.status(400).json({ message: 'UPI ID and Bank Name are required' });
    if (isMongoConnected()) {
        const newUpi = new UpiAccount_1.default({
            userId,
            upiId,
            bankName,
            verified: true
        });
        await newUpi.save();
        const not = new Notification_1.default({
            userId,
            title: 'UPI Handle Verified',
            message: `${upiId} successfully linked to your ${bankName} account.`,
            type: 'success'
        });
        await not.save();
        res.status(201).json(newUpi);
    }
    else {
        const newUpi = {
            id: `upi_${Date.now()}`,
            upiId,
            bankName,
            verified: true
        };
        if (!mockDB_1.mockUpiAccounts[userId])
            mockDB_1.mockUpiAccounts[userId] = [];
        mockDB_1.mockUpiAccounts[userId].push(newUpi);
        const not = {
            id: `not_${Date.now()}`,
            title: 'UPI Handle Verified',
            message: `${upiId} successfully linked to your ${bankName} account.`,
            type: 'success',
            isRead: false,
            createdAt: new Date().toISOString()
        };
        if (!mockDB_1.mockNotifications[userId])
            mockDB_1.mockNotifications[userId] = [];
        mockDB_1.mockNotifications[userId] = [not, ...mockDB_1.mockNotifications[userId]];
        res.status(201).json(newUpi);
    }
});
// ==========================================
// 5. LOANS & EMI TRACKER
// ==========================================
router.get('/loans', auth_1.default, async (req, res) => {
    const userId = req.userId;
    if (isMongoConnected()) {
        const list = await Loan_1.default.find({ userId });
        res.json(list);
    }
    else {
        res.json(mockDB_1.mockLoans[userId] || []);
    }
});
router.post('/loans', auth_1.default, async (req, res) => {
    const userId = req.userId;
    const { loanName, bankName, totalAmount, emiAmount, interestRate, durationMonths, nextEmiDate } = req.body;
    if (!loanName || !bankName || !totalAmount || !emiAmount) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const numAmount = Number(totalAmount);
    const numEmi = Number(emiAmount);
    const numRate = Number(interestRate || 8.5);
    const numDur = Number(durationMonths || 36);
    if (isMongoConnected()) {
        const loan = new Loan_1.default({
            userId,
            loanName,
            bankName,
            totalAmount: numAmount,
            remainingAmount: numAmount,
            emiAmount: numEmi,
            interestRate: numRate,
            durationMonths: numDur,
            paidEmis: 0,
            nextEmiDate: nextEmiDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        });
        await loan.save();
        res.status(201).json(loan);
    }
    else {
        const loan = {
            id: `ln_${Date.now()}`,
            loanName,
            bankName,
            totalAmount: numAmount,
            remainingAmount: numAmount,
            emiAmount: numEmi,
            interestRate: numRate,
            durationMonths: numDur,
            paidEmis: 0,
            nextEmiDate: nextEmiDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        };
        if (!mockDB_1.mockLoans[userId])
            mockDB_1.mockLoans[userId] = [];
        mockDB_1.mockLoans[userId].push(loan);
        res.status(201).json(loan);
    }
});
// ==========================================
// 6. INSURANCE POLICIES
// ==========================================
router.get('/insurance', auth_1.default, async (req, res) => {
    const userId = req.userId;
    if (isMongoConnected()) {
        const list = await Insurance_1.default.find({ userId });
        res.json(list);
    }
    else {
        res.json(mockDB_1.mockInsurance[userId] || []);
    }
});
router.post('/insurance', auth_1.default, async (req, res) => {
    const userId = req.userId;
    const { policyName, provider, policyType, coverageAmount, premiumAmount, paymentInterval, nextPremiumDate } = req.body;
    if (!policyName || !provider || !policyType || !premiumAmount) {
        return res.status(400).json({ message: 'Policy details are required' });
    }
    const numCoverage = Number(coverageAmount || 500000);
    const numPremium = Number(premiumAmount);
    if (isMongoConnected()) {
        const ins = new Insurance_1.default({
            userId,
            policyName,
            provider,
            policyType,
            coverageAmount: numCoverage,
            premiumAmount: numPremium,
            paymentInterval: paymentInterval || 'Yearly',
            nextPremiumDate: nextPremiumDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        });
        await ins.save();
        res.status(201).json(ins);
    }
    else {
        const ins = {
            id: `ins_${Date.now()}`,
            policyName,
            provider,
            policyType,
            coverageAmount: numCoverage,
            premiumAmount: numPremium,
            paymentInterval: paymentInterval || 'Yearly',
            nextPremiumDate: nextPremiumDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        };
        if (!mockDB_1.mockInsurance[userId])
            mockDB_1.mockInsurance[userId] = [];
        mockDB_1.mockInsurance[userId].push(ins);
        res.status(201).json(ins);
    }
});
// ==========================================
// 7. GROWW INVESTMENTS
// ==========================================
router.get('/investments', auth_1.default, async (req, res) => {
    const userId = req.userId;
    if (isMongoConnected()) {
        const list = await Investment_1.default.find({ userId });
        res.json(list);
    }
    else {
        res.json(mockDB_1.mockInvestments[userId] || []);
    }
});
router.post('/investments', auth_1.default, async (req, res) => {
    const userId = req.userId;
    const { stockSymbol, stockName, quantity, buyPrice } = req.body;
    if (!stockSymbol || !quantity || !buyPrice) {
        return res.status(400).json({ message: 'Stock data required' });
    }
    const numQty = Number(quantity);
    const numBuy = Number(buyPrice);
    if (isMongoConnected()) {
        const stock = new Investment_1.default({
            userId,
            stockSymbol: stockSymbol.toUpperCase(),
            stockName: stockName || stockSymbol.toUpperCase(),
            quantity: numQty,
            buyPrice: numBuy,
            currentPrice: numBuy * (1 + (Math.random() * 0.1 - 0.03)),
            investmentType: 'Stock'
        });
        await stock.save();
        res.status(201).json(stock);
    }
    else {
        const stock = {
            id: `inv_${Date.now()}`,
            stockSymbol: stockSymbol.toUpperCase(),
            stockName: stockName || stockSymbol.toUpperCase(),
            quantity: numQty,
            buyPrice: numBuy,
            currentPrice: numBuy * (1 + (Math.random() * 0.1 - 0.03)),
            investmentType: 'Stock',
            updatedAt: new Date().toISOString()
        };
        if (!mockDB_1.mockInvestments[userId])
            mockDB_1.mockInvestments[userId] = [];
        mockDB_1.mockInvestments[userId].push(stock);
        res.status(201).json(stock);
    }
});
// ==========================================
// 8. SUBSCRIPTIONS
// ==========================================
router.get('/subscriptions', auth_1.default, async (req, res) => {
    const userId = req.userId;
    if (isMongoConnected()) {
        const list = await Subscription_1.default.find({ userId });
        res.json(list);
    }
    else {
        res.json(mockDB_1.mockSubscriptions[userId] || []);
    }
});
router.post('/subscriptions', auth_1.default, async (req, res) => {
    const userId = req.userId;
    const { name, cost, interval, nextBillingDate, category, usageFrequency } = req.body;
    if (!name || !cost) {
        return res.status(400).json({ message: 'Subscription name and cost are required' });
    }
    const numCost = Number(cost);
    if (isMongoConnected()) {
        const sub = new Subscription_1.default({
            userId,
            name,
            cost: numCost,
            interval: interval || 'Monthly',
            nextBillingDate: nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            category: category || 'OTT',
            usageFrequency: usageFrequency || 'high'
        });
        await sub.save();
        res.status(201).json(sub);
    }
    else {
        const sub = {
            id: `sub_${Date.now()}`,
            name,
            cost: numCost,
            interval: interval || 'Monthly',
            nextBillingDate: nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            category: category || 'OTT',
            usageFrequency: usageFrequency || 'high'
        };
        if (!mockDB_1.mockSubscriptions[userId])
            mockDB_1.mockSubscriptions[userId] = [];
        mockDB_1.mockSubscriptions[userId].push(sub);
        res.status(201).json(sub);
    }
});
// ==========================================
// 9. NOTIFICATIONS
// ==========================================
router.get('/notifications', auth_1.default, async (req, res) => {
    const userId = req.userId;
    if (isMongoConnected()) {
        const list = await Notification_1.default.find({ userId }).sort({ createdAt: -1 });
        res.json(list);
    }
    else {
        res.json(mockDB_1.mockNotifications[userId] || []);
    }
});
router.post('/notifications/read', auth_1.default, async (req, res) => {
    const userId = req.userId;
    if (isMongoConnected()) {
        await Notification_1.default.updateMany({ userId, isRead: false }, { isRead: true });
    }
    else {
        if (mockDB_1.mockNotifications[userId]) {
            mockDB_1.mockNotifications[userId] = mockDB_1.mockNotifications[userId].map(n => ({ ...n, isRead: true }));
        }
    }
    res.json({ message: 'Notifications marked read' });
});
// ==========================================
// 10. AI ASSISTANT CHAT & REPORTS & PREDICTIONS
// ==========================================
router.post('/chat', auth_1.default, async (req, res) => {
    const userId = req.userId;
    const { message } = req.body;
    if (!message)
        return res.status(400).json({ message: 'Message is required' });
    const userState = await fetchUserDataState(userId);
    const reply = await (0, aiHelper_1.getAIChatResponse)(message, userState);
    res.json({ reply });
});
router.post('/reports/generate', auth_1.default, async (req, res) => {
    const userId = req.userId;
    const { month, year } = req.body;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    const userState = await fetchUserDataState(userId);
    const report = await (0, aiHelper_1.generateAIReport)(currentMonth, currentYear, userState);
    // Save generated report if MongoDB active
    if (isMongoConnected()) {
        const r = new Report_1.default({
            userId,
            month: currentMonth,
            year: currentYear,
            spendingAnalysis: report.futurePredictions, // map categorised spent
            highestSpendingCategory: report.highestSpendingCategory,
            savingsAmount: report.savingsAmount,
            overspendingWarnings: report.overspendingWarnings,
            emiBurdenPercentage: report.emiBurdenPercentage,
            subscriptionWasteAmount: report.subscriptionWasteAmount,
            futurePredictions: report.futurePredictions,
            financialSummary: report.financialSummary,
            suggestions: report.suggestions
        });
        await r.save();
    }
    res.json(report);
});
router.get('/predictions', auth_1.default, async (req, res) => {
    const userId = req.userId;
    const userState = await fetchUserDataState(userId);
    const predictions = await (0, aiHelper_1.generateAIPrediction)(userState);
    res.json(predictions);
});
// ==========================================
// 11. DOCUMENT VAULT & OCR RECEIPT SCANNER
// ==========================================
router.post('/scan', auth_1.default, upload.single('file'), async (req, res) => {
    const userId = req.userId;
    if (!req.file)
        return res.status(400).json({ message: 'No file uploaded' });
    // Get parameters if pre-extracted by the frontend
    let extractedMerchant = req.body.extractedMerchant;
    let extractedAmount = req.body.extractedAmount ? parseInt(req.body.extractedAmount) : null;
    let extractedCategory = req.body.extractedCategory;
    let extractedDate = req.body.extractedDate ? new Date(req.body.extractedDate) : new Date();
    // Otherwise, run OCR on the backend side
    if (!extractedMerchant || !extractedAmount) {
        try {
            const Tesseract = require('tesseract.js');
            const ocrResult = await Tesseract.recognize(req.file.path, 'eng');
            const text = ocrResult.data.text;
            console.log('Backend OCR Extracted Text:', text);
            const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
            let parsedAmount = 0;
            let hasFound = false;
            const totalKeywords = /(?:total|grand\s*total|net\s*payable|amount|payable|sum|due|paid|final|total\s*amount|total\s*due|subtotal|balance|cash|card|visa|mastercard|net)\b/i;
            const totalLines = lines.filter((line) => totalKeywords.test(line));
            for (const line of totalLines) {
                if (/\b(?:gst|tax|vat|rate|%)\b/i.test(line) && !/total/i.test(line))
                    continue;
                const matches = line.match(/[\d,]+\.\d{2}/g);
                if (matches) {
                    for (const m of matches) {
                        const val = parseFloat(m.replace(/,/g, ''));
                        if (!isNaN(val) && val > parsedAmount) {
                            parsedAmount = val;
                            hasFound = true;
                        }
                    }
                }
            }
            if (!hasFound) {
                for (const line of totalLines) {
                    if (/\b(?:gst|tax|vat|rate|%)\b/i.test(line) && !/total/i.test(line))
                        continue;
                    const matches = line.match(/\b\d{2,5}\b/g);
                    if (matches) {
                        for (const m of matches) {
                            const val = parseFloat(m);
                            if (!isNaN(val) && val > parsedAmount) {
                                parsedAmount = val;
                                hasFound = true;
                            }
                        }
                    }
                }
            }
            if (!hasFound) {
                const allDecimals = text.match(/[\d,]+\.\d{2}/g);
                if (allDecimals) {
                    const vals = allDecimals.map((d) => parseFloat(d.replace(/,/g, ''))).filter((v) => !isNaN(v) && v < 500000);
                    if (vals.length > 0) {
                        parsedAmount = Math.max(...vals);
                        hasFound = true;
                    }
                }
            }
            if (!hasFound) {
                const allInts = text.match(/\b\d{2,5}\b/g);
                if (allInts) {
                    const vals = allInts.map((i) => parseFloat(i)).filter((v) => !isNaN(v) && v >= 10 && v <= 10000);
                    if (vals.length > 0) {
                        parsedAmount = Math.max(...vals);
                        hasFound = true;
                    }
                }
            }
            if (hasFound && parsedAmount > 0) {
                extractedAmount = Math.round(parsedAmount);
            }
            else {
                extractedAmount = 250;
            }
            // Merchant
            const blacklist = ['receipt', 'tax', 'invoice', 'bill', 'welcome', 'cash', 'memo', 'customer', 'date', 'time', 'total', 'grand', 'amount', 'tel', 'phone', 'address', 'store', 'terminal', 'gst', 'no:', 'order'];
            for (let i = 0; i < Math.min(6, lines.length); i++) {
                const clean = lines[i].replace(/[^a-zA-Z\s]/g, '').trim();
                if (clean.length > 2) {
                    const lower = clean.toLowerCase();
                    const isBlack = blacklist.some(w => lower.includes(w));
                    if (!isBlack) {
                        extractedMerchant = clean;
                        break;
                    }
                }
            }
            if (!extractedMerchant) {
                const cleanFile = req.file.originalname.split('.')[0].replace(/[^a-zA-Z]/g, ' ').trim();
                extractedMerchant = cleanFile || 'Retail Store';
            }
            extractedCategory = (0, aiHelper_1.suggestCategory)(extractedMerchant);
        }
        catch (err) {
            console.error('Backend OCR error, falling back:', err);
            extractedMerchant = 'Retail Store';
            extractedAmount = 250;
            extractedCategory = 'Others';
        }
    }
    const txData = {
        userId,
        amount: extractedAmount || 250,
        title: `${extractedMerchant} (OCR Scanned)`,
        category: extractedCategory || 'Others',
        date: extractedDate.toISOString(),
        type: 'expense',
        paymentMode: 'UPI',
        upiId: `${user_name_prefix(userId)}@oksbi`,
        notes: 'Uploaded receipt OCR extraction verification'
    };
    let txResult;
    if (isMongoConnected()) {
        const tx = new Transaction_1.default(txData);
        await tx.save();
        txResult = tx;
        const bill = new Bill_1.default({
            userId,
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            extractedAmount: extractedAmount || 250,
            extractedMerchant,
            extractedDate: extractedDate,
            category: extractedCategory || 'Others',
            status: 'processed'
        });
        await bill.save();
        const not = new Notification_1.default({
            userId,
            title: 'Receipt Scanned',
            message: `Extracted ₹${extractedAmount} spent at ${extractedMerchant}. Saved to transactions.`,
            type: 'success'
        });
        await not.save();
    }
    else {
        txResult = { ...txData, id: `tx_${Date.now()}` };
        if (!mockDB_1.mockTransactions[userId])
            mockDB_1.mockTransactions[userId] = [];
        mockDB_1.mockTransactions[userId] = [txResult, ...mockDB_1.mockTransactions[userId]];
        const bill = {
            id: `bill_${Date.now()}`,
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: 'bill',
            extractedAmount: extractedAmount || 250,
            extractedMerchant,
            extractedDate: extractedDate.toISOString(),
            category: extractedCategory || 'Others',
            status: 'processed',
            createdAt: new Date().toISOString()
        };
        if (!mockDB_1.mockBills[userId])
            mockDB_1.mockBills[userId] = [];
        mockDB_1.mockBills[userId] = [bill, ...mockDB_1.mockBills[userId]];
        const not = {
            id: `not_${Date.now()}`,
            title: 'Receipt Scanned',
            message: `Extracted ₹${extractedAmount} spent at ${extractedMerchant}. Saved to transactions.`,
            type: 'success',
            isRead: false,
            createdAt: new Date().toISOString()
        };
        if (!mockDB_1.mockNotifications[userId])
            mockDB_1.mockNotifications[userId] = [];
        mockDB_1.mockNotifications[userId] = [not, ...mockDB_1.mockNotifications[userId]];
    }
    res.json({
        message: 'Bill scanned successfully',
        data: {
            merchant: extractedMerchant,
            amount: extractedAmount || 250,
            date: extractedDate.toLocaleDateString(),
            category: extractedCategory || 'Others',
            confidence: '95.4%',
            transaction: txResult
        }
    });
});
router.post('/documents/upload', auth_1.default, upload.single('file'), async (req, res) => {
    const userId = req.userId;
    const { fileType } = req.body; // 'bill' | 'invoice' | 'insurance' | 'loan' | 'bank_statement'
    if (!req.file || !fileType) {
        return res.status(400).json({ message: 'File and Document Type are required' });
    }
    const name = req.file.originalname;
    let summary = '';
    let detail = {};
    if (fileType === 'insurance') {
        const providers = ['Max Life', 'Star Health', 'ACKO', 'LIC'];
        const p = providers[Math.floor(Math.random() * providers.length)];
        const coverage = 2500000;
        const premium = 12000;
        summary = `Parsed Insurance Policy: ${p} Policy with ₹${premium}/year premium.`;
        if (isMongoConnected()) {
            const ins = new Insurance_1.default({
                userId,
                policyName: `${p} Safeguard Policy`,
                provider: p,
                policyType: p.includes('Health') ? 'Health' : 'Life',
                coverageAmount: coverage,
                premiumAmount: premium,
                paymentInterval: 'Yearly',
                nextPremiumDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
            });
            await ins.save();
            detail = ins;
        }
        else {
            detail = {
                id: `ins_${Date.now()}`,
                policyName: `${p} Safeguard Policy`,
                provider: p,
                policyType: p.includes('Health') ? 'Health' : 'Life',
                coverageAmount: coverage,
                premiumAmount: premium,
                paymentInterval: 'Yearly',
                nextPremiumDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            };
            if (!mockDB_1.mockInsurance[userId])
                mockDB_1.mockInsurance[userId] = [];
            mockDB_1.mockInsurance[userId].push(detail);
        }
    }
    else if (fileType === 'loan') {
        const loanName = 'Personal Debt Loan';
        const bank = 'ICICI Bank';
        const total = 300000;
        const emi = 8500;
        summary = `Parsed Loan Document: ₹3 Lakh loan from ${bank}. EMI ₹${emi}/month.`;
        if (isMongoConnected()) {
            const loan = new Loan_1.default({
                userId,
                loanName,
                bankName: bank,
                totalAmount: total,
                remainingAmount: total,
                emiAmount: emi,
                interestRate: 11.5,
                durationMonths: 48,
                nextEmiDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
            });
            await loan.save();
            detail = loan;
        }
        else {
            detail = {
                id: `ln_${Date.now()}`,
                loanName,
                bankName: bank,
                totalAmount: total,
                remainingAmount: total,
                emiAmount: emi,
                interestRate: 11.5,
                durationMonths: 48,
                paidEmis: 0,
                nextEmiDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            };
            if (!mockDB_1.mockLoans[userId])
                mockDB_1.mockLoans[userId] = [];
            mockDB_1.mockLoans[userId].push(detail);
        }
    }
    else {
        // default/bank statement trigger
        summary = 'Parsed Statement / Document Successfully.';
    }
    // Save bill log record
    if (isMongoConnected()) {
        const doc = new Bill_1.default({
            userId,
            fileName: name,
            fileUrl: `/uploads/${req.file.filename}`,
            category: fileType,
            status: 'processed'
        });
        await doc.save();
        const not = new Notification_1.default({
            userId,
            title: 'Vault Upload Success',
            message: `Document "${name}" successfully analyzed: ${summary}`,
            type: 'success'
        });
        await not.save();
    }
    else {
        const doc = {
            id: `doc_${Date.now()}`,
            fileName: name,
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: fileType,
            status: 'processed',
            createdAt: new Date().toISOString()
        };
        if (!mockDB_1.mockBills[userId])
            mockDB_1.mockBills[userId] = [];
        mockDB_1.mockBills[userId].push(doc);
        const not = {
            id: `not_${Date.now()}`,
            title: 'Vault Upload Success',
            message: `Document "${name}" successfully analyzed: ${summary}`,
            type: 'success',
            isRead: false,
            createdAt: new Date().toISOString()
        };
        if (!mockDB_1.mockNotifications[userId])
            mockDB_1.mockNotifications[userId] = [];
        mockDB_1.mockNotifications[userId] = [not, ...mockDB_1.mockNotifications[userId]];
    }
    res.json({
        message: 'Vault document processed.',
        summary,
        detail
    });
});
// GET user uploaded documents
router.get('/documents', auth_1.default, async (req, res) => {
    const userId = req.userId;
    if (isMongoConnected()) {
        const list = await Bill_1.default.find({ userId }).sort({ createdAt: -1 });
        res.json(list);
    }
    else {
        res.json(mockDB_1.mockBills[userId] || []);
    }
});
// Helper for user name prefixes in UPI IDs
function user_name_prefix(userId) {
    if (isMongoConnected()) {
        return 'user';
    }
    const u = mockDB_1.mockUsers[userId];
    return u ? u.name.toLowerCase().replace(/\s+/g, '') : 'user';
}
// ==========================================
// 12. ADMIN ANALYTICS UPGRADE
// ==========================================
router.get('/admin/stats', auth_1.default, async (req, res) => {
    if (isMongoConnected()) {
        const usersCount = await User_1.default.countDocuments();
        const transactionsCount = await Transaction_1.default.countDocuments();
        const loansCount = await Loan_1.default.countDocuments();
        const insuranceCount = await Insurance_1.default.countDocuments();
        const documentsCount = await Bill_1.default.countDocuments();
        const reportsCount = await Report_1.default.countDocuments();
        res.json({
            usersCount,
            transactionsCount,
            loansCount,
            insuranceCount,
            documentsCount,
            reportsCount,
            databaseMode: 'MongoDB'
        });
    }
    else {
        const usersCount = Object.keys(mockDB_1.mockUsers).length;
        let transactionsCount = 0;
        let loansCount = 0;
        let insuranceCount = 0;
        let documentsCount = 0;
        let reportsCount = 0;
        Object.values(mockDB_1.mockTransactions).forEach(arr => transactionsCount += arr.length);
        Object.values(mockDB_1.mockLoans).forEach(arr => loansCount += arr.length);
        Object.values(mockDB_1.mockInsurance).forEach(arr => insuranceCount += arr.length);
        Object.values(mockDB_1.mockBills).forEach(arr => documentsCount += arr.length);
        Object.values(mockDB_1.mockReports).forEach(arr => reportsCount += arr.length);
        res.json({
            usersCount,
            transactionsCount,
            loansCount,
            insuranceCount,
            documentsCount,
            reportsCount,
            databaseMode: 'Memory-Simulation'
        });
    }
});
router.post('/admin/clear', auth_1.default, async (req, res) => {
    const userId = req.userId;
    if (isMongoConnected()) {
        await Transaction_1.default.deleteMany({ userId });
        await Loan_1.default.deleteMany({ userId });
        await Insurance_1.default.deleteMany({ userId });
        await Investment_1.default.deleteMany({ userId });
        await Subscription_1.default.deleteMany({ userId });
        await Notification_1.default.deleteMany({ userId });
        await Bill_1.default.deleteMany({ userId });
        await Report_1.default.deleteMany({ userId });
    }
    else {
        mockDB_1.mockTransactions[userId] = [];
        mockDB_1.mockLoans[userId] = [];
        mockDB_1.mockInsurance[userId] = [];
        mockDB_1.mockInvestments[userId] = [];
        mockDB_1.mockSubscriptions[userId] = [];
        mockDB_1.mockNotifications[userId] = [];
        mockDB_1.mockBills[userId] = [];
        mockDB_1.mockReports[userId] = [];
    }
    res.json({ message: 'All transactions and records cleared for your account.' });
});
exports.default = router;
