import mongoose, { Schema } from 'mongoose';

const BankAccountSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String, required: true }, // e.g. SBI, HDFC, Axis Bank, Kotak, BOB
  accountNumber: { type: String, required: true }, // e.g. •••• 1234
  balance: { type: Number, required: true, default: 0 },
  accountType: { type: String, enum: ['Savings', 'Current'], default: 'Savings' },
  createdAt: { type: Date, default: Date.now }
});

export const BankAccount = mongoose.models.BankAccount || mongoose.model('BankAccount', BankAccountSchema);
export default BankAccount;
