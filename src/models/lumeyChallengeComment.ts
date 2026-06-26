import mongoose from "mongoose";

const lumeyChallengeCommentSchema = new mongoose.Schema(
  {
    submissionID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LumeyChallengeSubmission",
      required: true,
    },

    userID: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
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

export const LumeyChallengeComment = mongoose.model(
  "LumeyChallengeComment",
  lumeyChallengeCommentSchema,
);
