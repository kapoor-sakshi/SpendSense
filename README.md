# SpendSense AI — Premium AI Financial Management Platform

SpendSense AI is a next-generation, premium, and futuristic AI-powered financial management and analytics dashboard. It offers deep visual tracking, automated receipt scanners, simulated UPI banking, real-time stock portfolio trackers (Groww-like), and interactive AI chatbot advising.

Designed using modern dark glassmorphism layout rules inspired by CRED, Groww, and Mint.

---

## 🚀 Key Features

1. **AI Financial Dashboard**: real-time balance metrics, monthly spending trajectories, active EMIs, and interactive Recharts.
2. **Simulated UPI System**: link bank accounts, tie active UPI IDs, view transactional timelines and heatmaps.
3. **Receipt Scanner & OCR**: upload bills and invoices to automatically parse dates, merchants, and categories using OCR.
4. **Groww Investment Simulator**: manual share adding, real-time Profit & Loss indicators, risk assessment, and market behaviors.
5. **Subscription & OTT Watch**: track Netflix, Spotify, broadband; receive renewal notifications and flag wasted/unused plans.
6. **Smart AI Advisor Chatbot**: natural language financial queries linked directly to your actual spending spreadsheets (powered by Google Gemini).
7. **Admin Panel**: control uploaded files, manage user statuses, and configure API integrations.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Framer Motion, Tesseract.js, jsPDF, XLSX
- **Backend**: Node.js, Express.js, TypeScript, Mongoose
- **Database**: MongoDB (with offline LocalStorage fallback)
- **AI Integration**: Google Gemini API (with local rule-based NLP simulator)

---

## 📂 Project Structure

```text
spendsense-ai/
├── package.json (Monorepo setup)
├── README.md
├── backend/
│   ├── src/
│   │   ├── server.ts (Entry point)
│   │   ├── models/ (Mongoose schemas)
│   │   ├── routes/ (API endpoints)
│   │   └── utils/ (Gemini helpers & mock DB)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/ (Next.js App router pages)
    │   ├── components/ (Reusable UI components)
    │   ├── context/ (State manager)
    │   └── utils/ (Mock data seeds & exports)
    └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or above)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- (Optional) MongoDB local instance or MongoDB Atlas Connection String.

### Installation

1. **Install Monorepo Dependencies** (run in project root):
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/spendsense
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

   *Note: If no `MONGODB_URI` or `GEMINI_API_KEY` are provided, the system automatically falls back to Simulated DB Mode and Simulated AI Mode, meaning the app will be 100% functional out of the box.*

3. **Configure Frontend Environment**:
   Create a `.env.local` file in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

---

## 🏃 Running the Application

In the root directory, you can spin up both servers concurrently:

```bash
npm run dev
```

- **Frontend client**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🧪 Testing and Demos

### Mock Credentials
For testing the dashboard without signing up:
- **Email**: `sakshi@spendsense.ai`
- **Password**: `password123` (or any password)

This loads a pre-populated financial history including 3 connected banks, stock portfolios, car loans, and streaming subscriptions.
