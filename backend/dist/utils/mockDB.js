"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDBState = exports.initializeNewUser = exports.seedUserData = exports.mockPredictions = exports.mockReports = exports.mockBills = exports.mockNotifications = exports.mockSubscriptions = exports.mockInvestments = exports.mockInsurance = exports.mockLoans = exports.mockTransactions = exports.mockUpiAccounts = exports.mockBankAccounts = exports.mockCredentials = exports.mockUsers = void 0;
// In-Memory global tables partitioned by userId
exports.mockUsers = {};
exports.mockCredentials = {};
exports.mockBankAccounts = {};
exports.mockUpiAccounts = {};
exports.mockTransactions = {};
exports.mockLoans = {};
exports.mockInsurance = {};
exports.mockInvestments = {};
exports.mockSubscriptions = {};
exports.mockNotifications = {};
exports.mockBills = {};
exports.mockReports = {};
exports.mockPredictions = {};
// Seeder helper to initialize isolated records with beautiful demo content
const seedUserData = (userId, name, email) => {
    exports.mockUsers[userId] = {
        id: userId,
        name,
        email,
        creditScore: 785
    };
    exports.mockBankAccounts[userId] = [
        { id: `bank_1_${userId}`, bankName: 'HDFC', accountNumber: '•••• 9842', balance: 128400.00, accountType: 'Savings' },
        { id: `bank_2_${userId}`, bankName: 'SBI', accountNumber: '•••• 3829', balance: 45250.50, accountType: 'Savings' },
        { id: `bank_3_${userId}`, bankName: 'Axis Bank', accountNumber: '•••• 5110', balance: 12050.00, accountType: 'Current' }
    ];
    exports.mockUpiAccounts[userId] = [
        { id: `upi_1_${userId}`, upiId: `${name.toLowerCase().replace(/\s+/g, '')}@okhdfc`, bankName: 'HDFC', verified: true },
        { id: `upi_2_${userId}`, upiId: `${name.toLowerCase().replace(/\s+/g, '')}@oksbi`, bankName: 'SBI', verified: true }
    ];
    exports.mockTransactions[userId] = [
        { id: `tx_1_${userId}`, amount: 450, title: 'Starbucks Coffee', category: 'Food', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'expense', paymentMode: 'UPI', upiId: `${name.toLowerCase().replace(/\s+/g, '')}@oksbi` },
        { id: `tx_2_${userId}`, amount: 15000, title: 'Rent payment HDFC', category: 'Rent', date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), type: 'expense', paymentMode: 'Bank', bankName: 'HDFC' },
        { id: `tx_3_${userId}`, amount: 84900, title: 'Salary Credited', category: 'Salary', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'income', paymentMode: 'Bank', bankName: 'HDFC' },
        { id: `tx_4_${userId}`, amount: 649, title: 'Netflix Premium', category: 'Entertainment', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'expense', paymentMode: 'UPI', upiId: `${name.toLowerCase().replace(/\s+/g, '')}@okhdfc` },
        { id: `tx_5_${userId}`, amount: 179, title: 'Spotify Premium', category: 'Entertainment', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), type: 'expense', paymentMode: 'UPI', upiId: `${name.toLowerCase().replace(/\s+/g, '')}@okhdfc` },
        { id: `tx_6_${userId}`, amount: 799, title: 'Jio Mobile Recharge', category: 'Recharge', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), type: 'expense', paymentMode: 'UPI', upiId: `${name.toLowerCase().replace(/\s+/g, '')}@oksbi` },
        { id: `tx_7_${userId}`, amount: 1250, title: 'Shell Petrol Pump', category: 'Fuel', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'expense', paymentMode: 'Bank', bankName: 'Axis Bank' },
        { id: `tx_8_${userId}`, amount: 3500, title: 'Zara Shopping', category: 'Shopping', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), type: 'expense', paymentMode: 'UPI', upiId: `${name.toLowerCase().replace(/\s+/g, '')}@oksbi` },
        { id: `tx_9_${userId}`, amount: 12000, title: 'Groww SIP Transfer', category: 'Investments', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), type: 'expense', paymentMode: 'Bank', bankName: 'SBI' },
        { id: `tx_10_${userId}`, amount: 4800, title: 'Swiggy Dinner Party', category: 'Food', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'expense', paymentMode: 'UPI', upiId: `${name.toLowerCase().replace(/\s+/g, '')}@okhdfc` }
    ];
    exports.mockLoans[userId] = [
        { id: `ln_1_${userId}`, loanName: 'Car Loan', bankName: 'HDFC', totalAmount: 800000, remainingAmount: 540000, emiAmount: 14850, interestRate: 8.75, durationMonths: 60, paidEmis: 18, nextEmiDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), status: 'active' },
        { id: `ln_2_${userId}`, loanName: 'Education Loan', bankName: 'SBI', totalAmount: 400000, remainingAmount: 280000, emiAmount: 9200, interestRate: 9.5, durationMonths: 48, paidEmis: 13, nextEmiDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), status: 'active' }
    ];
    exports.mockInsurance[userId] = [
        { id: `ins_1_${userId}`, policyName: 'HDFC Ergo Optima Secure', provider: 'HDFC Ergo', policyType: 'Health', coverageAmount: 1000000, premiumAmount: 15400, paymentInterval: 'Yearly', nextPremiumDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), status: 'active' },
        { id: `ins_2_${userId}`, policyName: 'LIC Tech Term Policy', provider: 'LIC of India', policyType: 'Life', coverageAmount: 15000000, premiumAmount: 9800, paymentInterval: 'Yearly', nextPremiumDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString(), status: 'active' }
    ];
    exports.mockInvestments[userId] = [
        { id: `inv_1_${userId}`, stockSymbol: 'TATACHEM', stockName: 'Tata Chemicals Ltd', quantity: 25, buyPrice: 940.50, currentPrice: 1084.20, investmentType: 'Stock', updatedAt: new Date().toISOString() },
        { id: `inv_2_${userId}`, stockSymbol: 'RELIANCE', stockName: 'Reliance Industries Ltd', quantity: 15, buyPrice: 2420.00, currentPrice: 2890.75, investmentType: 'Stock', updatedAt: new Date().toISOString() },
        { id: `inv_3_${userId}`, stockSymbol: 'INFY', stockName: 'Infosys Ltd', quantity: 30, buyPrice: 1610.00, currentPrice: 1445.60, investmentType: 'Stock', updatedAt: new Date().toISOString() },
        { id: `inv_4_${userId}`, stockSymbol: 'ZOMATO', stockName: 'Zomato Ltd', quantity: 120, buyPrice: 85.00, currentPrice: 196.40, investmentType: 'Stock', updatedAt: new Date().toISOString() }
    ];
    exports.mockSubscriptions[userId] = [
        { id: `sub_1_${userId}`, name: 'Netflix Premium', cost: 649, interval: 'Monthly', nextBillingDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), status: 'active', category: 'OTT', usageFrequency: 'medium' },
        { id: `sub_2_${userId}`, name: 'Spotify Premium', cost: 179, interval: 'Monthly', nextBillingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), status: 'active', category: 'OTT', usageFrequency: 'high' },
        { id: `sub_3_${userId}`, name: 'Amazon Prime', cost: 1499, interval: 'Yearly', nextBillingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), status: 'active', category: 'OTT', usageFrequency: 'low' },
        { id: `sub_4_${userId}`, name: 'Disney+ Hotstar', cost: 299, interval: 'Monthly', nextBillingDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), status: 'active', category: 'OTT', usageFrequency: 'low' },
        { id: `sub_5_${userId}`, name: 'JioFiber Home Broadband', cost: 824, interval: 'Monthly', nextBillingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'active', category: 'Internet', usageFrequency: 'high' }
    ];
    exports.mockNotifications[userId] = [
        { id: `not_1_${userId}`, title: 'Salary Credited', message: 'INR 84,900 has been credited to your HDFC Account.', type: 'success', isRead: false, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: `not_2_${userId}`, title: 'High Entertainment Expense', message: 'You have active monthly subscriptions worth INR 1,127 renewal due next week.', type: 'warning', isRead: false, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: `not_3_${userId}`, title: 'Groww Portfolio Alert', message: 'TATACHEM up by 15.2% from your buy price.', type: 'info', isRead: true, createdAt: new Date().toISOString() }
    ];
    exports.mockBills[userId] = [];
    exports.mockReports[userId] = [];
    exports.mockPredictions[userId] = [];
};
exports.seedUserData = seedUserData;
const initializeNewUser = (userId, name, email) => {
    exports.mockUsers[userId] = {
        id: userId,
        name,
        email,
        creditScore: 750
    };
    exports.mockBankAccounts[userId] = [];
    exports.mockUpiAccounts[userId] = [];
    exports.mockTransactions[userId] = [];
    exports.mockLoans[userId] = [];
    exports.mockInsurance[userId] = [];
    exports.mockInvestments[userId] = [];
    exports.mockSubscriptions[userId] = [];
    exports.mockNotifications[userId] = [
        {
            id: `not_welcome_${Date.now()}`,
            title: 'Welcome to SpendSense AI',
            message: 'Your isolated financial profile is successfully configured.',
            type: 'success',
            isRead: false,
            createdAt: new Date().toISOString()
        }
    ];
    exports.mockBills[userId] = [];
    exports.mockReports[userId] = [];
    exports.mockPredictions[userId] = [];
};
exports.initializeNewUser = initializeNewUser;
// Seed default developer user Demo User
(0, exports.seedUserData)('mock_user_id_123', 'Demo User', 'demo@spendsense.ai');
exports.mockCredentials['demo@spendsense.ai'] = {
    email: 'demo@spendsense.ai',
    passwordHash: '$2a$10$Y1l4sH7V73U8s/7E8D7x.eyvE9uJ/i2R/H4cWJ9T2Nq4gMvG3e43y', // hashed 'password123'
    userId: 'mock_user_id_123'
};
exports.mockCredentials['sakshi@spendsense.ai'] = {
    email: 'sakshi@spendsense.ai',
    passwordHash: '$2a$10$Y1l4sH7V73U8s/7E8D7x.eyvE9uJ/i2R/H4cWJ9T2Nq4gMvG3e43y', // hashed 'password123'
    userId: 'mock_user_id_123'
};
// State retriever filtered by user
const getUserDBState = (userId) => {
    // Ensure lists are initialized
    if (!exports.mockUsers[userId]) {
        (0, exports.seedUserData)(userId, 'Demo User', 'demo@spendsense.ai');
    }
    const userDetails = exports.mockUsers[userId];
    const userBanks = exports.mockBankAccounts[userId] || [];
    const userUpis = exports.mockUpiAccounts[userId] || [];
    return {
        user: {
            ...userDetails,
            banks: userBanks.map(b => ({
                bankName: b.bankName,
                accountNumber: b.accountNumber,
                balance: b.balance,
                accountType: b.accountType
            })),
            linkedUpiIds: userUpis.map(u => u.upiId)
        },
        banks: userBanks,
        upiIds: userUpis,
        transactions: exports.mockTransactions[userId] || [],
        loans: exports.mockLoans[userId] || [],
        insurance: exports.mockInsurance[userId] || [],
        investments: exports.mockInvestments[userId] || [],
        subscriptions: exports.mockSubscriptions[userId] || [],
        notifications: exports.mockNotifications[userId] || [],
        bills: exports.mockBills[userId] || [],
        reports: exports.mockReports[userId] || [],
        predictions: exports.mockPredictions[userId] || []
    };
};
exports.getUserDBState = getUserDBState;
