import mongoose, { Schema } from 'mongoose';

const SubscriptionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // e.g. Netflix, Spotify
  cost: { type: Number, required: true },
  interval: { type: String, enum: ['Monthly', 'Yearly'], default: 'Monthly' },
  nextBillingDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
  category: { type: String, enum: ['OTT', 'Mobile', 'Internet', 'Utilities', 'Others'], default: 'OTT' },
  usageFrequency: { type: String, enum: ['low', 'medium', 'high'], default: 'high' } // AI analyzer inputs
});

export const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
export default Subscription;
