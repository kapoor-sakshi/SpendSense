import mongoose, { Schema } from 'mongoose';

const TransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true, default: 'Others' }, // e.g. Food, Shopping, Fuel, Recharge
  date: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['income', 'expense'], required: true },
  paymentMode: { type: String, enum: ['UPI', 'Bank', 'Cash'], required: true },
  upiId: { type: String }, // e.type user@paytm
  bankName: { type: String }, // e.g. SBI, HDFC
  notes: { type: String }
});

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export default Transaction;
