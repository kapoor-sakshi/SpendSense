import mongoose, { Schema } from 'mongoose';

const StatementUploadSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileHash: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String },
  bankName: { type: String },
  status: {
    type: String,
    enum: ['Uploaded', 'Processing', 'Extracting Transactions', 'Analyzing', 'Completed'],
    default: 'Uploaded'
  },
  extractedData: { type: Schema.Types.Mixed },
  transactionCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

StatementUploadSchema.index({ userId: 1, fileHash: 1 }, { unique: true });

export const StatementUpload = mongoose.models.StatementUpload || mongoose.model('StatementUpload', StatementUploadSchema);
export default StatementUpload;
