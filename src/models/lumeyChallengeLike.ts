import mongoose from "mongoose";

const lumeyChallengeLikeSchema = new mongoose.Schema(
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
    submissionID: 1,
    userID: 1,
  },
  {
    unique: true,
  },
);

export const LumeyChallengeLike = mongoose.model(
  "LumeyChallengeLike",
  lumeyChallengeLikeSchema,
);
