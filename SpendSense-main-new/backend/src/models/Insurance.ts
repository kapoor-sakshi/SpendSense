import mongoose, { Schema } from 'mongoose';

const InsuranceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  policyName: { type: String, required: true }, // e.g. HDFC Ergo Health, LIC e-Term
  provider: { type: String, required: true },
  policyType: { type: String, enum: ['Health', 'Life', 'Vehicle', 'Investment-Linked'], required: true },
  coverageAmount: { type: Number, required: true },
  premiumAmount: { type: Number, required: true },
  paymentInterval: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], default: 'Yearly' },
  nextPremiumDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired', 'lapsed'], default: 'active' }
});

export const Insurance = mongoose.models.Insurance || mongoose.model('Insurance', InsuranceSchema);
export default Insurance;
