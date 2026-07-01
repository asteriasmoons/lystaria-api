import mongoose from "mongoose";
import { lumeyDB } from "../config/databases";

const lumeyChallengeCommentLikeSchema = new mongoose.Schema(
  {
    commentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LumeyChallengeComment",
      required: true,
      index: true,
    },

    userID: {
      type: String,
      required: true,
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

lumeyChallengeCommentLikeSchema.index(
  {
    commentID: 1,
    userID: 1,
  },
  {
    unique: true,
  },
);

export const LumeyChallengeCommentLike =
  lumeyDB.models.LumeyChallengeCommentLike ||
  lumeyDB.model("LumeyChallengeCommentLike", lumeyChallengeCommentLikeSchema);
