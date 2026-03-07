import { DailyPromptUsage } from "../models/DailyPromptUsage";
import { chicagoDateKey } from "../utils/chicagoDateKey";

const DAILY_LIMIT = 3;

export async function claimDailyPrompt(userId: string) {
  const dateKey = chicagoDateKey(new Date());

  const incRes = await DailyPromptUsage.updateOne(
    { userId, dateKey, count: { $lt: DAILY_LIMIT } },
    { $inc: { count: 1 } },
  );

  if (incRes.modifiedCount === 1) {
    const doc = await DailyPromptUsage.findOne({ userId, dateKey }).lean();

    const count = doc?.count ?? 1;

    return {
      allowed: true,
      remaining: Math.max(0, DAILY_LIMIT - count),
      dateKey,
    };
  }

  try {
    await DailyPromptUsage.create({
      userId,
      dateKey,
      count: 1,
    });

    return {
      allowed: true,
      remaining: DAILY_LIMIT - 1,
      dateKey,
    };
  } catch (err: any) {
    if (err?.code === 11000) {
      const doc = await DailyPromptUsage.findOne({ userId, dateKey }).lean();

      const count = doc?.count ?? DAILY_LIMIT;

      return {
        allowed: false,
        remaining: Math.max(0, DAILY_LIMIT - count),
        dateKey,
      };
    }

    throw err;
  }
}
