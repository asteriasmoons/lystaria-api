import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, index: true, unique: true, sparse: true },
    name: { type: String },
    passwordHash: { type: String },

    appleSub: { type: String, index: true, unique: true, sparse: true },

    // Optional: allow revoking refresh tokens by changing this value
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", UserSchema);
