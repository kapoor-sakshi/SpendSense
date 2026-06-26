import mongoose, { Schema } from 'mongoose';

const ReportDataSchema = new Schema({
  spendingSummary: { type: Schema.Types.Mixed },
  categoryAnalysis: { type: Schema.Types.Mixed },
  bankAnalysis: { type: Schema.Types.Mixed },
  UPIAnalysis: { type: Schema.Types.Mixed },
  loanAnalysis: { type: Schema.Types.Mixed },
  insuranceAnalysis: { type: Schema.Types.Mixed },
  investmentAnalysis: { type: Schema.Types.Mixed },
  subscriptionsAnalysis: { type: Schema.Types.Mixed },
  futurePredictions: { type: Schema.Types.Mixed },
  financialSummary: { type: String },
  highestSpendingCategory: { type: String },
  savingsAmount: { type: Number },
  overspendingWarnings: { type: [String] },
  emiBurdenPercentage: { type: Number },
  subscriptionWasteAmount: { type: Number },
  suggestions: { type: [String] }
}, { _id: false });

const ReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true, index: true },
  reportMonth: { type: String },
  generatedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Pending', 'Collecting Data', 'Analyzing', 'Generated'],
    default: 'Generated'
  },
  financialHealthScore: { type: Number, default: 0 },
  pdfUrl: { type: String, default: null },
  reportData: { type: ReportDataSchema },
  chartData: { type: Schema.Types.Mixed },
  predictionData: { type: Schema.Types.Mixed },
  // Legacy flat fields kept for backward compatibility
  spendingAnalysis: { type: Map, of: Number },
  highestSpendingCategory: { type: String },
  savingsAmount: { type: Number, default: 0 },
  overspendingWarnings: { type: [String], default: [] },
  emiBurdenPercentage: { type: Number, default: 0 },
  subscriptionWasteAmount: { type: Number, default: 0 },
  futurePredictions: { type: Map, of: Number },
  financialSummary: { type: String },
  suggestions: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

ReportSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });
ReportSchema.index({ userId: 1, generatedAt: -1 });

export const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
export default Report;
