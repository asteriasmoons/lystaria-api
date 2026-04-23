// src/models/Sprint.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export type SprintStatus = "waiting" | "active" | "submitting" | "finished";

export interface ISprintParticipant {
  userId: string;
  displayName: string;
  startPage: number;
  endPage: number | null;
  pagesRead: number | null;
  pointsAwarded: number | null;
  joinedAt: Date;
  submittedAt: Date | null;
}

export interface ISprint extends Document {
  startedByUserId: string;
  startedByDisplayName: string;
  durationMinutes: number;
  startsAt: Date;
  endsAt: Date;
  status: SprintStatus;
  participants: ISprintParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

const SprintParticipantSchema = new Schema<ISprintParticipant>(
  {
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    startPage: { type: Number, required: true },
    endPage: { type: Number, default: null },
    pagesRead: { type: Number, default: null },
    pointsAwarded: { type: Number, default: null },
    joinedAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
  },
  { _id: false },
);

const SprintSchema = new Schema<ISprint>(
  {
    startedByUserId: { type: String, required: true },
    startedByDisplayName: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 5, max: 60 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["waiting", "active", "submitting", "finished"],
      default: "waiting",
      index: true,
    },
    participants: { type: [SprintParticipantSchema], default: [] },
  },
  { timestamps: true },
);

export const Sprint: Model<ISprint> =
  mongoose.models.Sprint ||
  mongoose.model<ISprint>("Sprint", SprintSchema);
