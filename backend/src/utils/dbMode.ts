import mongoose from 'mongoose';

export const isMongoConnected = (): boolean => mongoose.connection.readyState === 1;

/** True only when Mongo is up AND userId is a real Mongo ObjectId string. */
export const shouldUseMongoStore = (userId?: string): boolean => {
  if (!isMongoConnected() || !userId) return false;
  if (!mongoose.Types.ObjectId.isValid(userId)) return false;
  return String(new mongoose.Types.ObjectId(userId)) === userId;
};
