import mongoose from "mongoose";
import { lumeyDB } from "../config/databases";

const lumeyChallengeLikeSchema = new mongoose.Schema(
  {
    feedItemID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LumeyChallengeFeedItem",
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

lumeyChallengeLikeSchema.index(
  {
    feedItemID: 1,
    userID: 1,
  },
  {
    unique: true,
  },
);

export const LumeyChallengeLike =
  lumeyDB.models.LumeyChallengeLike ||
  lumeyDB.model("LumeyChallengeLike", lumeyChallengeLikeSchema);