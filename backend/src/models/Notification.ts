import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'danger'], default: 'info' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export default Notification;
