// src/models/SharedEvent.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export type SharedEventShareMode = "personal" | "invite_only" | "shared";

export interface ISharedEvent extends Document {
  localEventId: string;
  ownerUserId: string;
  ownerDisplayName: string;
  title: string;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  eventDescription: string | null;
  color: string | null;
  meetingUrl: string | null;
  location: string | null;
  recurrenceRRule: string | null;
  timeZoneId: string | null;
  calendarId: string | null;
  serverId: string | null;

  isSharedEvent: boolean;
  isJoinable: boolean;
  shareMode: SharedEventShareMode;
  requiresApprovalToJoin: boolean;
  allowGuestsToInvite: boolean;
  allowGuestsToEdit: boolean;

  joinCode: string;
  attendeeCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const SharedEventSchema = new Schema<ISharedEvent>(
  {
    localEventId: { type: String, required: true, index: true },
    ownerUserId: { type: String, required: true, index: true },
    ownerDisplayName: { type: String, required: true },

    title: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    allDay: { type: Boolean, required: true },

    eventDescription: { type: String, default: null },
    color: { type: String, default: null },
    meetingUrl: { type: String, default: null },
    location: { type: String, default: null },
    recurrenceRRule: { type: String, default: null },
    timeZoneId: { type: String, default: null },
    calendarId: { type: String, default: null },
    serverId: { type: String, default: null },

    isSharedEvent: { type: Boolean, default: true },
    isJoinable: { type: Boolean, default: true },
    shareMode: {
      type: String,
      enum: ["personal", "invite_only", "shared"],
      default: "shared",
    },
    requiresApprovalToJoin: { type: Boolean, default: false },
    allowGuestsToInvite: { type: Boolean, default: false },
    allowGuestsToEdit: { type: Boolean, default: false },

    joinCode: { type: String, required: true, unique: true, index: true },
    attendeeCount: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  },
);

export const SharedEvent: Model<ISharedEvent> =
  mongoose.models.SharedEvent ||
  mongoose.model<ISharedEvent>("SharedEvent", SharedEventSchema);
