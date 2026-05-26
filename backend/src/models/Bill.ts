import mongoose, { Schema } from 'mongoose';

const BillSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  extractedAmount: { type: Number },
  extractedMerchant: { type: String },
  extractedDate: { type: Date },
  category: { type: String, default: 'Others' },
  status: { type: String, enum: ['processed', 'pending', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export const Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);
export default Bill;
