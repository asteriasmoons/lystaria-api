// src/models/UserProfile.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserProfile extends Document {
  userId: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true, trim: true, maxlength: 30 },
  },
  { timestamps: true },
);

export const UserProfile: Model<IUserProfile> =
  mongoose.models.UserProfile ||
  mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);
