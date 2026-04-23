// src/models/SprintLeaderboard.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISprintLeaderboard extends Document {
  userId: string;
  displayName: string;
  totalPoints: number;
  totalPagesRead: number;
  sprintsParticipated: number;
  lastSprintAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
}

const SprintLeaderboardSchema = new Schema<ISprintLeaderboard>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    totalPoints: { type: Number, default: 0 },
    totalPagesRead: { type: Number, default: 0 },
    sprintsParticipated: { type: Number, default: 0 },
    lastSprintAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const SprintLeaderboard: Model<ISprintLeaderboard> =
  mongoose.models.SprintLeaderboard ||
  mongoose.model<ISprintLeaderboard>("SprintLeaderboard", SprintLeaderboardSchema);
