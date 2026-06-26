"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestCategory = suggestCategory;
exports.getAIChatResponse = getAIChatResponse;
exports.generateAIReport = generateAIReport;
exports.generateAIPrediction = generateAIPrediction;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Call the actual Gemini API using fetch request
 */
async function callGeminiAPI(prompt, apiKey) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                },
            }),
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API returned error: ${response.status} - ${errText}`);
        }
        const data = (await response.json());
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!generatedText) {
            throw new Error('Invalid response structure from Gemini API');
        }
        return generatedText.trim();
    }
    catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
}
/**
 * Suggests a category based on the text/title entered
 */
function suggestCategory(title) {
    const lowercase = title.toLowerCase();
    if (lowercase.includes('uber') || lowercase.includes('ola') || lowercase.includes('cab') || lowercase.includes('auto') || lowercase.includes('petrol') || lowercase.includes('fuel') || lowercase.includes('shell') || lowercase.includes('diesel')) {
        return 'Fuel';
    }
    if (lowercase.includes('starbucks') || lowercase.includes('swiggy') || lowercase.includes('zomato') || lowercase.includes('mcdonald') || lowercase.includes('kfc') || lowercase.includes('restaurant') || lowercase.includes('burger') || lowercase.includes('pizza') || lowercase.includes('food') || lowercase.includes('cafe')) {
        return 'Food';
    }
    if (lowercase.includes('netflix') || lowercase.includes('spotify') || lowercase.includes('prime') || lowercase.includes('hotstar') || lowercase.includes('hulu') || lowercase.includes('movie') || lowercase.includes('cinema') || lowercase.includes('show')) {
        return 'Entertainment';
    }
    if (lowercase.includes('jio') || lowercase.includes('airtel') || lowercase.includes('vi ') || lowercase.includes('recharge') || lowercase.includes('mobile') || lowercase.includes('telecom') || lowercase.includes('fiber') || lowercase.includes('internet') || lowercase.includes('wifi')) {
        return 'Recharge';
    }
    if (lowercase.includes('zara') || lowercase.includes('amazon') || lowercase.includes('flipkart') || lowercase.includes('shopping') || lowercase.includes('myntra') || lowercase.includes('groceries') || lowercase.includes('mall') || lowercase.includes('tshirt') || lowercase.includes('shoes')) {
        return 'Shopping';
    }
    if (lowercase.includes('groww') || lowercase.includes('sip') || lowercase.includes('stock') || lowercase.includes('mutual') || lowercase.includes('share') || lowercase.includes('investment')) {
        return 'Investments';
    }
    if (lowercase.includes('rent') || lowercase.includes('landlord') || lowercase.includes('room') || lowercase.includes('apartment')) {
        return 'Rent';
    }
    return 'Others';
}
/**
 * Simulates Gemini AI response for chatbot queries when key is not present
 */
function localSimulationChat(query, data) {
    const lowercase = query.toLowerCase();
    if (lowercase.includes('food') || lowercase.includes('restaurant') || lowercase.includes('eat')) {
        const foodTx = data.transactions.filter((t) => t.category === 'Food');
        const total = foodTx.reduce((sum, t) => sum + t.amount, 0);
        return `You spent a total of **₹${total.toLocaleString('en-IN')}** on Food. Your largest transaction was **₹${Math.max(...foodTx.map((t) => t.amount), 0)}** at restaurant nodes. You can save about 15% by reducing weekly Swiggy deliveries!`;
    }
    if (lowercase.includes('save') || lowercase.includes('savings') || lowercase.includes('budget')) {
        const activeSubCost = data.subscriptions.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.cost, 0);
        return `Here are your custom savings tips based on active habits:
1. **Subscription Cleanup**: You have active subscriptions costing **₹${activeSubCost}/month**. Cancel low-use items like Disney+ Hotstar to save ₹299 instantly.
2. **Food Caps**: Reduce Swiggy/Zomato usage to weekends; weekday ordering accounts for a high share of discretionary expenses.
3. **Automate SIP**: Set up an auto-debit on the 1st of the month to invest in Groww index funds to lock in savings before spending.`;
    }
    if (lowercase.includes('emi') || lowercase.includes('loan') || lowercase.includes('debt')) {
        const activeLoans = data.loans.filter((l) => l.status === 'active');
        const totalEmi = activeLoans.reduce((sum, l) => sum + l.emiAmount, 0);
        if (activeLoans.length === 0)
            return `You have no active loan commitments currently. Excellent debt profile!`;
        const list = activeLoans.map((l, idx) => `${idx + 1}. **${l.loanName} (${l.bankName})**: Remaining ₹${l.remainingAmount.toLocaleString()} (EMI: ₹${l.emiAmount})`).join('\n');
        return `You have ${activeLoans.length} active loans:
${list}
Your total monthly EMI commitment is **₹${totalEmi.toLocaleString()}**.
*Tip: Pay an extra 10% on your highest-interest loan principal annually to reduce terms and save interest!*`;
    }
    if (lowercase.includes('netflix') || lowercase.includes('spotify') || lowercase.includes('subscription')) {
        const subs = data.subscriptions.filter((s) => s.status === 'active');
        const total = subs.reduce((sum, s) => sum + s.cost, 0);
        return `You are currently tracking **${subs.length}** active subscriptions costing **₹${total}/month**.
AI Insights: Canceling low-usage subscriptions like Disney+ Hotstar or secondary streaming links saves money.`;
    }
    if (lowercase.includes('groww') || lowercase.includes('investment') || lowercase.includes('portfolio') || lowercase.includes('stock')) {
        const totalBuy = data.investments.reduce((sum, i) => sum + (i.buyPrice * i.quantity), 0);
        const totalCurrent = data.investments.reduce((sum, i) => sum + (i.currentPrice * i.quantity), 0);
        const profit = totalCurrent - totalBuy;
        const profitPercent = totalBuy > 0 ? (profit / totalBuy) * 100 : 0;
        return `Your Groww portfolio is performing strongly:
- **Total Invested**: ₹${totalBuy.toLocaleString('en-IN')}
- **Current Value**: ₹${totalCurrent.toLocaleString('en-IN')}
- **Net Profit/Loss**: **+₹${profit.toLocaleString('en-IN')} (${profitPercent.toFixed(2)}%)**
AI suggests rebalancing some capital into Gold/Debt mutual funds during market volatility.`;
    }
    if (lowercase.includes('balance') || lowercase.includes('bank') || lowercase.includes('money')) {
        const bankDetails = data.banks.map((b) => `- ${b.bankName}: ₹${b.balance.toLocaleString('en-IN')}`).join('\n');
        const total = data.banks.reduce((sum, b) => sum + b.balance, 0);
        return `You have connected ${data.banks.length} bank accounts.
Current balances:
${bankDetails}
**Combined Total Balance: ₹${total.toLocaleString('en-IN')}**`;
    }
    return `Hello ${data.user.name}! I'm SpendSense AI, your personal financial advisor. I've analyzed your connected bank accounts, transactions, active EMIs, and subscriptions.

Here are a few quick things you can ask me:
- "How much did I spend on food this month?"
- "What is my combined bank balance?"
- "Provide tips to increase my credit score from ${data.user.creditScore}."
- "Show my Groww portfolio returns."
- "Which EMI is due next?"`;
}
/**
 * Handles chatbot natural language queries
 */
async function getAIChatResponse(query, data) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return localSimulationChat(query, data);
    }
    const prompt = `
You are SpendSense AI, an elite, professional, and friendly financial counselor.
Here is the user's financial dataset:
User Name: ${data.user.name}
Credit Score: ${data.user.creditScore}
Bank Accounts: ${JSON.stringify(data.banks)}
UPI IDs: ${JSON.stringify(data.upiIds)}

Recent Transactions:
${data.transactions.map((t) => `- Title: "${t.title}", Amt: ₹${t.amount}, Cat: "${t.category}", Mode: "${t.paymentMode}", Date: "${t.date}", Type: "${t.type}"`).join('\n')}

Active Loans & EMIs:
${data.loans.map((l) => `- "${l.loanName}" at ${l.bankName}, Balance: ₹${l.remainingAmount}/₹${l.totalAmount}, EMI: ₹${l.emiAmount}, Interest: ${l.interestRate}%, Due: ${l.nextEmiDate}`).join('\n')}

Active Insurance Policies:
${data.insurance.map((i) => `- "${i.policyName}" by ${i.provider}, Coverage: ₹${i.coverageAmount}, Premium: ₹${i.premiumAmount}/${i.paymentInterval}, Due: ${i.nextPremiumDate}`).join('\n')}

Active Subscriptions:
${data.subscriptions.map((s) => `- "${s.name}" costing ₹${s.cost}/${s.interval}, Next bill: ${s.nextBillingDate}, Frequency of use: ${s.usageFrequency}`).join('\n')}

Simulated Groww Investments Portfolio:
${data.investments.map((i) => `- Symbol: "${i.stockSymbol}" (${i.stockName}), Qty: ${i.quantity}, BuyPrice: ₹${i.buyPrice}, CurrentPrice: ₹${i.currentPrice}`).join('\n')}

User Query: "${query}"

Guidelines:
- Keep your response brief, clear, and actionable.
- Format with bold markdown text and bullet points.
- Do not make up facts; use the real values in the dataset.
- Provide custom, witty, or premium financial suggestions matching the CRED/fintech aesthetic.
`;
    try {
        return await callGeminiAPI(prompt, apiKey);
    }
    catch (error) {
        console.warn('Gemini API call failed, falling back to local simulator.');
        return localSimulationChat(query, data);
    }
}
/**
 * Generate monthly financial report using AI
 */
async function generateAIReport(month, year, data) {
    const apiKey = process.env.GEMINI_API_KEY;
    // Calculate totals and statistics
    const expenses = data.transactions.filter((t) => t.type === 'expense');
    const incomes = data.transactions.filter((t) => t.type === 'income');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    // Categorized expenses
    const categoryTotals = {};
    expenses.forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    // Find highest category
    let maxCat = 'None';
    let maxAmt = 0;
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
        if (amt > maxAmt) {
            maxAmt = amt;
            maxCat = cat;
        }
    });
    const totalEmi = data.loans.reduce((sum, l) => sum + l.emiAmount, 0);
    const emiBurdenPercent = totalIncome > 0 ? (totalEmi / totalIncome) * 100 : 0;
    const wasteAmount = data.subscriptions.filter((s) => s.usageFrequency === 'low').reduce((sum, s) => sum + s.cost, 0);
    const savings = Math.max(0, totalIncome - totalExpense);
    // Predictions for next month
    const futurePredictions = {};
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
        futurePredictions[cat] = Math.round(amt * 0.95);
    });
    if (!apiKey) {
        return {
            financialSummary: `You earned ₹${totalIncome.toLocaleString()} and spent ₹${totalExpense.toLocaleString()} in Month ${month}, Year ${year}. Your financial index is stable with a healthy savings margin of ₹${savings.toLocaleString()}. Food delivery and shopping represent the bulk of discretionary outgoings. Loan serviceability is within stable parameters.`,
            highestSpendingCategory: maxCat,
            savingsAmount: savings,
            overspendingWarnings: [
                totalExpense > 40000 ? 'Discretionary spending is high! Limit credit card swipe frequencies.' : 'Food expenses are slightly elevated.',
                'EMI commitments take up a notable share of monthly income. Avoid fresh loans.'
            ],
            emiBurdenPercentage: Math.round(emiBurdenPercent),
            subscriptionWasteAmount: wasteAmount,
            futurePredictions,
            suggestions: [
                'Consolidate debt if possible to reduce monthly EMI strain.',
                'Close low usage streaming services immediately to save.',
                'Allocate ₹5,000 from current savings to gold SIP to hedge equity risks.'
            ]
        };
    }
    const prompt = `
You are SpendSense AI. Analyze this financial summary for Month ${month}, Year ${year} and generate a JSON report.
Total Income: ₹${totalIncome}
Total Expense: ₹${totalExpense}
Savings: ₹${savings}
Categorized Spending: ${JSON.stringify(categoryTotals)}
EMIs: ₹${totalEmi} (Burden: ${emiBurdenPercent.toFixed(1)}% of income)
Subscriptions Marked Wasted (Usage low): ₹${wasteAmount}

Return ONLY a valid raw JSON object matching this TypeScript interface (no markdown, no backticks, no code block packaging):
{
  "financialSummary": "A concise paragraph summarizing their performance and habits.",
  "highestSpendingCategory": "${maxCat}",
  "savingsAmount": ${savings},
  "overspendingWarnings": ["Warning 1", "Warning 2"],
  "emiBurdenPercentage": ${Math.round(emiBurdenPercent)},
  "subscriptionWasteAmount": ${wasteAmount},
  "futurePredictions": { "Category1": 1200, "Category2": 800 },
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}
`;
    try {
        const rawResult = await callGeminiAPI(prompt, apiKey);
        const cleanJSON = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJSON);
    }
    catch (error) {
        console.error('Report Generation Error, fallback to simulated report:', error);
        return {
            financialSummary: `Offline AI Analysis: Total expenses ₹${totalExpense} against income ₹${totalIncome}. High concentration of spending in "${maxCat}". EMIs are active.`,
            highestSpendingCategory: maxCat,
            savingsAmount: savings,
            overspendingWarnings: ['Unable to fetch Gemini reports. Active local models indicate high lifestyle outlays.'],
            emiBurdenPercentage: Math.round(emiBurdenPercent),
            subscriptionWasteAmount: wasteAmount,
            futurePredictions,
            suggestions: ['Check internet connections.', 'Verify GEMINI_API_KEY configuration inside Settings.']
        };
    }
}
/**
 * Generates future spending predictions using AI
 */
async function generateAIPrediction(data) {
    const apiKey = process.env.GEMINI_API_KEY;
    // Calculate stats
    const expenses = data.transactions.filter((t) => t.type === 'expense');
    const incomes = data.transactions.filter((t) => t.type === 'income');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const emiTotal = data.loans.reduce((sum, l) => sum + l.emiAmount, 0);
    const categoryTotals = {};
    expenses.forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    const estimatedSpending = Math.round(totalExpense * 0.94 + emiTotal);
    const likelySavings = Math.max(0, Math.round(totalIncome - estimatedSpending));
    const riskLevel = emiTotal / (totalIncome || 1) > 0.4 ? 'High' : (totalExpense > 40000 ? 'Medium' : 'Low');
    const forecastData = {};
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
        forecastData[cat] = Math.round(amt * 0.94);
    });
    if (!apiKey) {
        return {
            estimatedSpending,
            likelySavings,
            riskLevel,
            forecastData
        };
    }
    const prompt = `
You are SpendSense AI Forecasting Engine. Analyze the user's spending profile and return a JSON object forecasting their next month's spending and risk level.
Total Income: ₹${totalIncome}
Total Expense: ₹${totalExpense}
Active EMIs: ₹${emiTotal}
Category totals: ${JSON.stringify(categoryTotals)}

Return ONLY a valid raw JSON object matching this TypeScript interface (no markdown, no backticks):
{
  "estimatedSpending": number,
  "likelySavings": number,
  "riskLevel": "Low" | "Medium" | "High",
  "forecastData": { "Food": 1500, "Shopping": 2000 }
}
`;
    try {
        const rawResult = await callGeminiAPI(prompt, apiKey);
        const cleanJSON = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJSON);
    }
    catch (error) {
        console.error('Predictions generation failed, fallback to local:', error);
        return {
            estimatedSpending,
            likelySavings,
            riskLevel,
            forecastData
        };
    }
}
