import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const UserSettingsSchema = new Schema(
  {
    user: { type: String, immutable: true },
    termsAcceptedDate: Date
  },
  {
    timestamps: true // adds created_at, updated_at
  }
);

export default mongoose.model('UserSettings', UserSettingsSchema);
