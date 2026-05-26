import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Encrypted with bcryptjs
  profileImage: { type: String, default: '' },
  creditScore: { type: Number, default: 750 },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
