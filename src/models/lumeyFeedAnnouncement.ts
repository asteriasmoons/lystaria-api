import mongoose from "mongoose";

const lumeyFeedAnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    authorUserID: {
      type: String,
      required: true,
      index: true,
    },

    authorUsername: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const LumeyFeedAnnouncement = mongoose.model(
  "LumeyFeedAnnouncement",
  lumeyFeedAnnouncementSchema,
);
