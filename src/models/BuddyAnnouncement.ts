// src/models/BuddyAnnouncement.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBuddyAnnouncement extends Document {
  ownerUserId: string;
  ownerDisplayName: string;

  bookTitle: string;
  bookAuthor: string | null;
  bookCoverUrl: string | null;
  bookKey: string | null; // OpenLibrary or local book ID for deduplication

  message: string | null; // optional "looking for someone to discuss themes!" note
  currentChapter: number | null;
  currentPage: number | null;

  maxMembers: number; // 2–4
  groupId: string | null; // set once a group is formed and announcement is closed

  isActive: boolean; // false = removed from board (left, paired, expired)
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const BuddyAnnouncementSchema = new Schema<IBuddyAnnouncement>(
  {
    ownerUserId: { type: String, required: true, index: true },
    ownerDisplayName: { type: String, required: true },

    bookTitle: { type: String, required: true },
    bookAuthor: { type: String, default: null },
    bookCoverUrl: { type: String, default: null },
    bookKey: { type: String, default: null, index: true },

    message: { type: String, default: null },
    currentChapter: { type: Number, default: null },
    currentPage: { type: Number, default: null },

    maxMembers: { type: Number, default: 2, min: 2, max: 4 },
    groupId: { type: String, default: null },

    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
  },
);

export const BuddyAnnouncement: Model<IBuddyAnnouncement> =
  mongoose.models.BuddyAnnouncement ||
  mongoose.model<IBuddyAnnouncement>("BuddyAnnouncement", BuddyAnnouncementSchema);
