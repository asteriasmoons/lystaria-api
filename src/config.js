import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5050),
  mongodbUri: process.env.MONGODB_URI,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTtl: process.env.REFRESH_TOKEN_TTL || "30d",

  appleBundleId: process.env.APPLE_BUNDLE_ID,
};
