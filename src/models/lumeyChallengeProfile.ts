import mongoose from "mongoose";

const lumeyChallengeProfileSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
      unique: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    avatarName: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    favoriteGenre: {
      type: String,
      default: "",
    },

    readingStreak: {
      type: Number,
      default: 0,
    },

    challengePoints: {
      type: Number,
      default: 0,
    },

    challengesCompleted: {
      type: Number,
      default: 0,
    },

    followersCount: {
      type: Number,
      default: 0,
    },

    followingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const LumeyChallengeProfile = mongoose.model(
  "LumeyChallengeProfile",
  lumeyChallengeProfileSchema,
);
