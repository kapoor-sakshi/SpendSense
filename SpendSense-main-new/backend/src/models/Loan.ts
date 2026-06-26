import mongoose, { Schema } from 'mongoose';

const LoanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  loanName: { type: String, required: true }, // e.g. Car Loan, Home Loan, Education Loan
  bankName: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  emiAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true }, // in %
  durationMonths: { type: Number, required: true },
  paidEmis: { type: Number, default: 0 },
  nextEmiDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
});

export const Loan = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);
export default Loan;
