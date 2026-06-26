import mongoose, { Schema } from 'mongoose';

const UpiAccountSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  upiId: { type: String, required: true }, 
  bankName: { type: String, required: true }, // associated bank e.g. SBI
  verified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const UpiAccount = mongoose.models.UpiAccount || mongoose.model('UpiAccount', UpiAccountSchema);
export default UpiAccount;
