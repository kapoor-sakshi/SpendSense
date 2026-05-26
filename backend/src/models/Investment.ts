import mongoose, { Schema } from 'mongoose';

const InvestmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  stockSymbol: { type: String, required: true }, // e.g. TCS, RELIANCE
  stockName: { type: String, required: true },
  quantity: { type: Number, required: true },
  buyPrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  investmentType: { type: String, enum: ['Stock', 'Mutual Fund', 'Gold'], default: 'Stock' },
  updatedAt: { type: Date, default: Date.now }
});

export const Investment = mongoose.models.Investment || mongoose.model('Investment', InvestmentSchema);
export default Investment;
