import mongoose, { Schema } from 'mongoose';

const PredictionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  estimatedSpending: { type: Number, required: true },
  likelySavings: { type: Number, required: true },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  forecastData: { type: Map, of: Number }, // e.g. Food: 1200, Rent: 15000
  createdAt: { type: Date, default: Date.now }
});

export const Prediction = mongoose.models.Prediction || mongoose.model('Prediction', PredictionSchema);
export default Prediction;
