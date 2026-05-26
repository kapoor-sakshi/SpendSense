import mongoose, { Schema } from 'mongoose';

const ReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  spendingAnalysis: { type: Map, of: Number }, // e.g. Food: 1500, Shopping: 3000
  highestSpendingCategory: { type: String },
  savingsAmount: { type: Number, default: 0 },
  overspendingWarnings: { type: [String], default: [] },
  emiBurdenPercentage: { type: Number, default: 0 },
  subscriptionWasteAmount: { type: Number, default: 0 },
  futurePredictions: { type: Map, of: Number }, // category predictions for next month
  financialSummary: { type: String }, // AI summary text
  suggestions: { type: [String], default: [] }, // AI tips list
  createdAt: { type: Date, default: Date.now }
});

export const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
export default Report;
