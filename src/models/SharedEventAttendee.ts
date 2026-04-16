// src/models/SharedEventAttendee.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export type SharedEventParticipationStatus =
  | "owner"
  | "invited"
  | "joined"
  | "declined"
  | "left";

export interface ISharedEventAttendee extends Document {
  eventId: mongoose.Types.ObjectId;
  eventLocalId: string;
  userId: string;
  displayName: string;
  status: SharedEventParticipationStatus;
  isHost: boolean;
  invitedAt: Date;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SharedEventAttendeeSchema = new Schema<ISharedEventAttendee>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "SharedEvent",
      required: true,
      index: true,
    },
    eventLocalId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    displayName: { type: String, required: true },
    status: {
      type: String,
      enum: ["owner", "invited", "joined", "declined", "left"],
      required: true,
      default: "invited",
    },
    isHost: { type: Boolean, default: false },
    invitedAt: { type: Date, required: true, default: Date.now },
    joinedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

SharedEventAttendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const SharedEventAttendee: Model<ISharedEventAttendee> =
  mongoose.models.SharedEventAttendee ||
  mongoose.model<ISharedEventAttendee>(
    "SharedEventAttendee",
    SharedEventAttendeeSchema,
  );
