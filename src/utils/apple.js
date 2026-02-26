import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "../config.js";

const APPLE_JWKS_URL = new URL("https://appleid.apple.com/auth/keys");
const JWKS = createRemoteJWKSet(APPLE_JWKS_URL);

export async function verifyAppleIdentityToken(identityToken) {
  if (!config.appleBundleId) throw new Error("Missing APPLE_BUNDLE_ID");

  const { payload } = await jwtVerify(identityToken, JWKS, {
    issuer: "https://appleid.apple.com",
    audience: config.appleBundleId,
  });

  // payload.sub = stable Apple user identifier for your app
  // payload.email may exist depending on scopes and first login
  return payload;
}
