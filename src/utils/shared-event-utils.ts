import crypto from "crypto";

const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(length = 8): string {
  let result = "";

  for (let i = 0; i < length; i += 1) {
    const index = crypto.randomInt(0, JOIN_CODE_CHARS.length);
    result += JOIN_CODE_CHARS[index];
  }

  return result;
}
