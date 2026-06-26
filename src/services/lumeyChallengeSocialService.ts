import { LumeyChallengeSubmission } from "../models/lumeyChallengeSubmission";
import { LumeyChallengeComment } from "../models/lumeyChallengeComment";
import { LumeyChallengeLike } from "../models/lumeyChallengeLike";
import { LumeyChallengeProfile } from "../models/lumeyChallengeProfile";

export async function getChallengeFeed() {
  const submissions = await LumeyChallengeSubmission.find()
    .sort({ submittedDate: -1 })
    .lean();

  const comments = await LumeyChallengeComment.find()
    .sort({ createdDate: 1 })
    .lean();

  const likes = await LumeyChallengeLike.find()
    .sort({ createdDate: -1 })
    .lean();

  const profiles = await LumeyChallengeProfile.find()
    .sort({ username: 1 })
    .lean();

  return {
    submissions,
    comments,
    likes,
    profiles,
  };
}

export async function createSubmission(input: any) {
  if (!input.challengeID) throw new Error("challengeID is required.");
  if (!input.userID) throw new Error("userID is required.");

  const submission = await LumeyChallengeSubmission.create({
    challengeID: input.challengeID,
    entryID: input.entryID ?? "",
    userID: input.userID,
    username: cleanString(input.username) || "Reader",
    linkedBookIDs: cleanStringArray(input.linkedBookIDs),
    linkedSessionIDs: cleanStringArray(input.linkedSessionIDs),
    linkedReviewIDs: cleanStringArray(input.linkedReviewIDs),
    linkedReadingListIDs: cleanStringArray(input.linkedReadingListIDs),
    submissionNote: cleanString(input.submissionNote),
    proofSummary: cleanString(input.proofSummary),
    validationStatus: input.validationStatus || "submitted",
    validationMessage: cleanString(input.validationMessage),
    submittedDate: input.submittedDate
      ? new Date(input.submittedDate)
      : new Date(),
    approvedDate: input.approvedDate ? new Date(input.approvedDate) : undefined,
    likeCount: Number(input.likeCount ?? 0),
    commentCount: Number(input.commentCount ?? 0),
  });

  await ensureProfile({
    userID: submission.userID,
    username: submission.username,
  });

  return submission;
}

export async function toggleLike(input: {
  submissionID: string;
  userID: string;
}) {
  if (!input.submissionID) throw new Error("submissionID is required.");
  if (!input.userID) throw new Error("userID is required.");

  const submission = await LumeyChallengeSubmission.findById(
    input.submissionID,
  );
  if (!submission) throw new Error("Submission not found.");

  const existingLike = await LumeyChallengeLike.findOne({
    submissionID: input.submissionID,
    userID: input.userID,
  });

  if (existingLike) {
    await existingLike.deleteOne();

    submission.likeCount = Math.max(0, submission.likeCount - 1);
    await submission.save();

    return {
      liked: false,
      likeCount: submission.likeCount,
    };
  }

  await LumeyChallengeLike.create({
    submissionID: input.submissionID,
    userID: input.userID,
    createdDate: new Date(),
  });

  submission.likeCount += 1;
  await submission.save();

  return {
    liked: true,
    likeCount: submission.likeCount,
  };
}

export async function addComment(input: {
  submissionID: string;
  userID: string;
  username?: string;
  text: string;
}) {
  if (!input.submissionID) throw new Error("submissionID is required.");
  if (!input.userID) throw new Error("userID is required.");

  const text = cleanString(input.text);
  if (!text) throw new Error("Comment text is required.");

  const submission = await LumeyChallengeSubmission.findById(
    input.submissionID,
  );
  if (!submission) throw new Error("Submission not found.");

  const comment = await LumeyChallengeComment.create({
    submissionID: input.submissionID,
    userID: input.userID,
    username: cleanString(input.username) || "Reader",
    text,
    createdDate: new Date(),
  });

  submission.commentCount += 1;
  await submission.save();

  await ensureProfile({
    userID: comment.userID,
    username: comment.username,
  });

  return comment;
}

export async function deleteComment(commentID: string) {
  if (!commentID) throw new Error("commentID is required.");

  const comment = await LumeyChallengeComment.findById(commentID);
  if (!comment) throw new Error("Comment not found.");

  const submission = await LumeyChallengeSubmission.findById(
    comment.submissionID,
  );

  await comment.deleteOne();

  if (submission) {
    submission.commentCount = Math.max(0, submission.commentCount - 1);
    await submission.save();
  }

  return {
    deleted: true,
  };
}

export async function getUserProfile(userID: string) {
  if (!userID) throw new Error("userID is required.");

  const existing = await LumeyChallengeProfile.findOne({ userID });

  if (existing) return existing;

  return ensureProfile({
    userID,
    username: "Reader",
  });
}

export async function updateUserProfile(userID: string, input: any) {
  if (!userID) throw new Error("userID is required.");

  const profile = await ensureProfile({
    userID,
    username: cleanString(input.username) || "Reader",
  });

  profile.username = cleanString(input.username) || profile.username;
  profile.avatarName = cleanString(input.avatarName) || profile.avatarName;
  profile.bio = cleanString(input.bio) || profile.bio;
  profile.favoriteGenre =
    cleanString(input.favoriteGenre) || profile.favoriteGenre;

  if (typeof input.readingStreak === "number") {
    profile.readingStreak = input.readingStreak;
  }

  if (typeof input.challengePoints === "number") {
    profile.challengePoints = input.challengePoints;
  }

  if (typeof input.challengesCompleted === "number") {
    profile.challengesCompleted = input.challengesCompleted;
  }

  if (typeof input.followersCount === "number") {
    profile.followersCount = input.followersCount;
  }

  if (typeof input.followingCount === "number") {
    profile.followingCount = input.followingCount;
  }

  await profile.save();

  return profile;
}

async function ensureProfile(input: { userID: string; username: string }) {
  const existing = await LumeyChallengeProfile.findOne({
    userID: input.userID,
  });

  if (existing) {
    if (input.username.trim()) {
      existing.username = input.username.trim();
      await existing.save();
    }

    return existing;
  }

  return LumeyChallengeProfile.create({
    userID: input.userID,
    username: input.username.trim() || "Reader",
    avatarName: "",
    bio: "",
    favoriteGenre: "",
    readingStreak: 0,
    challengePoints: 0,
    challengesCompleted: 0,
    followersCount: 0,
    followingCount: 0,
  });
}

function cleanString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}
