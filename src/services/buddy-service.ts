// src/services/buddy-service.ts

import { BuddyAnnouncement, IBuddyAnnouncement } from "../models/BuddyAnnouncement";
import { BuddyGroup, IBuddyGroup } from "../models/BuddyGroup";
import { BuddyMessage, IBuddyMessage } from "../models/BuddyMessage";
import { Server as SocketIOServer } from "socket.io";

// 30 days TTL for announcements
const ANNOUNCEMENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

type PostAnnouncementInput = {
  ownerUserId: string;
  ownerDisplayName: string;
  bookTitle: string;
  bookAuthor?: string | null;
  bookCoverUrl?: string | null;
  bookKey?: string | null;
  message?: string | null;
  currentChapter?: number | null;
  currentPage?: number | null;
  maxMembers?: number;
};

type RequestToJoinInput = {
  announcementId: string;
  requesterUserId: string;
  requesterDisplayName: string;
};

type RespondToJoinRequestInput = {
  groupId: string;
  actorUserId: string; // must be group owner
  targetUserId: string;
  accept: boolean;
};

type LeaveGroupInput = {
  groupId: string;
  userId: string;
};

type SendMessageInput = {
  groupId: string;
  senderUserId: string;
  senderDisplayName: string;
  type?: "text" | "progress_update" | "system";
  text: string;
  progressChapter?: number | null;
  progressPage?: number | null;
};

type GetMessagesInput = {
  groupId: string;
  userId: string;
  before?: string | null; // message _id cursor for pagination
  limit?: number;
};

type UpdateAnnouncementInput = {
  announcementId: string;
  ownerUserId: string;
  message?: string | null;
  currentChapter?: number | null;
  currentPage?: number | null;
  maxMembers?: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertMember(group: IBuddyGroup, userId: string) {
  const member = group.members.find((m) => m.userId === userId);
  if (!member || member.status === "left") throw new Error("NOT_A_MEMBER");
  return member;
}

function activeJoinedCount(group: IBuddyGroup): number {
  return group.members.filter((m) => m.status === "joined").length;
}

// ---------------------------------------------------------------------------
// Announcement board
// ---------------------------------------------------------------------------

export async function postAnnouncement(
  input: PostAnnouncementInput,
): Promise<IBuddyAnnouncement> {
  // Deactivate any existing active announcement from this user first
  await BuddyAnnouncement.updateMany(
    { ownerUserId: input.ownerUserId, isActive: true },
    { isActive: false },
  );

  const expiresAt = new Date(Date.now() + ANNOUNCEMENT_TTL_MS);

  const announcement = await BuddyAnnouncement.create({
    ownerUserId: input.ownerUserId,
    ownerDisplayName: input.ownerDisplayName,
    bookTitle: input.bookTitle,
    bookAuthor: input.bookAuthor ?? null,
    bookCoverUrl: input.bookCoverUrl ?? null,
    bookKey: input.bookKey ?? null,
    message: input.message ?? null,
    currentChapter: input.currentChapter ?? null,
    currentPage: input.currentPage ?? null,
    maxMembers: input.maxMembers ?? 2,
    isActive: true,
    expiresAt,
  });

  return announcement;
}

export async function getBoard(
  currentUserId?: string,
): Promise<IBuddyAnnouncement[]> {
  const now = new Date();

  // Expire stale announcements in the background
  BuddyAnnouncement.updateMany(
    { isActive: true, expiresAt: { $lt: now } },
    { isActive: false },
  ).catch(() => {});

  return BuddyAnnouncement.find({
    isActive: true,
    expiresAt: { $gte: now },
    // Exclude the current user's own announcement from the board view
    ...(currentUserId ? { ownerUserId: { $ne: currentUserId } } : {}),
  }).sort({ createdAt: -1 });
}

export async function getMyAnnouncement(
  ownerUserId: string,
): Promise<IBuddyAnnouncement | null> {
  return BuddyAnnouncement.findOne({ ownerUserId, isActive: true });
}

export async function removeAnnouncement(
  announcementId: string,
  ownerUserId: string,
): Promise<void> {
  const announcement = await BuddyAnnouncement.findById(announcementId);
  if (!announcement) throw new Error("ANNOUNCEMENT_NOT_FOUND");
  if (announcement.ownerUserId !== ownerUserId) throw new Error("FORBIDDEN");

  announcement.isActive = false;
  await announcement.save();
}

export async function updateAnnouncement(
  input: UpdateAnnouncementInput,
): Promise<IBuddyAnnouncement> {
  const announcement = await BuddyAnnouncement.findById(input.announcementId);
  if (!announcement) throw new Error("ANNOUNCEMENT_NOT_FOUND");
  if (announcement.ownerUserId !== input.ownerUserId) throw new Error("FORBIDDEN");

  if (typeof input.message !== "undefined") announcement.message = input.message;
  if (typeof input.currentChapter !== "undefined")
    announcement.currentChapter = input.currentChapter;
  if (typeof input.currentPage !== "undefined")
    announcement.currentPage = input.currentPage;
  if (typeof input.maxMembers !== "undefined")
    announcement.maxMembers = input.maxMembers;

  await announcement.save();
  return announcement;
}

// ---------------------------------------------------------------------------
// Group & join flow
// ---------------------------------------------------------------------------

export async function requestToJoin(
  input: RequestToJoinInput,
  io: SocketIOServer,
): Promise<IBuddyGroup> {
  const announcement = await BuddyAnnouncement.findById(input.announcementId);
  if (!announcement || !announcement.isActive)
    throw new Error("ANNOUNCEMENT_NOT_FOUND");
  if (announcement.ownerUserId === input.requesterUserId)
    throw new Error("CANNOT_JOIN_OWN_ANNOUNCEMENT");

  // Find or create the group for this announcement
  let group = await BuddyGroup.findOne({ announcementId: input.announcementId });

  if (!group) {
    group = await BuddyGroup.create({
      announcementId: String(announcement._id),
      bookTitle: announcement.bookTitle,
      bookAuthor: announcement.bookAuthor,
      bookCoverUrl: announcement.bookCoverUrl,
      bookKey: announcement.bookKey,
      maxMembers: announcement.maxMembers,
      members: [
        {
          userId: announcement.ownerUserId,
          displayName: announcement.ownerDisplayName,
          status: "joined",
          isOwner: true,
          joinedAt: announcement.createdAt,
          requestedAt: announcement.createdAt,
        },
      ],
      isActive: true,
    });

    // Link group back to announcement
    announcement.groupId = String(group._id);
    await announcement.save();
  }

  // Check capacity
  const joinedCount = activeJoinedCount(group);
  if (joinedCount >= group.maxMembers) throw new Error("GROUP_FULL");

  // Check if already a member
  const existing = group.members.find((m) => m.userId === input.requesterUserId);
  if (existing) {
    if (existing.status === "joined") throw new Error("ALREADY_A_MEMBER");
    if (existing.status === "pending") throw new Error("REQUEST_ALREADY_SENT");
    // status === "left" — allow re-request
    existing.status = "pending";
    existing.requestedAt = new Date();
    existing.joinedAt = null;
  } else {
    group.members.push({
      userId: input.requesterUserId,
      displayName: input.requesterDisplayName,
      status: "pending",
      isOwner: false,
      joinedAt: null,
      requestedAt: new Date(),
    });
  }

  await group.save();

  // Notify the group owner in real-time
  io.to(String(group._id)).emit("buddy:join_request", {
    groupId: String(group._id),
    requesterUserId: input.requesterUserId,
    requesterDisplayName: input.requesterDisplayName,
  });

  return group;
}

export async function respondToJoinRequest(
  input: RespondToJoinRequestInput,
  io: SocketIOServer,
): Promise<IBuddyGroup> {
  const group = await BuddyGroup.findById(input.groupId);
  if (!group || !group.isActive) throw new Error("GROUP_NOT_FOUND");

  const actor = group.members.find((m) => m.userId === input.actorUserId);
  if (!actor || !actor.isOwner) throw new Error("FORBIDDEN");

  const target = group.members.find((m) => m.userId === input.targetUserId);
  if (!target || target.status !== "pending") throw new Error("REQUEST_NOT_FOUND");

  if (input.accept) {
    const joinedCount = activeJoinedCount(group);
    if (joinedCount >= group.maxMembers) throw new Error("GROUP_FULL");

    target.status = "joined";
    target.joinedAt = new Date();

    // If group is now at capacity, close the announcement from the board
    const newJoinedCount = activeJoinedCount(group);
    if (newJoinedCount >= group.maxMembers) {
      await BuddyAnnouncement.findByIdAndUpdate(group.announcementId, {
        isActive: false,
      });
    }

    // System message
    await BuddyMessage.create({
      groupId: String(group._id),
      senderUserId: "system",
      senderDisplayName: "system",
      type: "system",
      text: `${target.displayName} joined the group.`,
    });

    io.to(String(group._id)).emit("buddy:member_joined", {
      groupId: String(group._id),
      userId: target.userId,
      displayName: target.displayName,
    });
  } else {
    target.status = "left";

    io.to(String(group._id)).emit("buddy:join_declined", {
      groupId: String(group._id),
      userId: target.userId,
    });
  }

  await group.save();
  return group;
}

export async function leaveGroup(
  input: LeaveGroupInput,
  io: SocketIOServer,
): Promise<void> {
  const group = await BuddyGroup.findById(input.groupId);
  if (!group || !group.isActive) throw new Error("GROUP_NOT_FOUND");

  const member = assertMember(group, input.userId);
  member.status = "left";
  member.joinedAt = null;

  // If the owner leaves, reopen the announcement and assign a new owner
  if (member.isOwner) {
    const nextOwner = group.members.find(
      (m) => m.userId !== input.userId && m.status === "joined",
    );

    if (nextOwner) {
      nextOwner.isOwner = true;

      // Reopen the announcement under the new owner
      await BuddyAnnouncement.findByIdAndUpdate(group.announcementId, {
        isActive: true,
        ownerUserId: nextOwner.userId,
        ownerDisplayName: nextOwner.displayName,
        expiresAt: new Date(Date.now() + ANNOUNCEMENT_TTL_MS),
      });
    } else {
      // No one left — close the group and announcement entirely
      group.isActive = false;
      await BuddyAnnouncement.findByIdAndUpdate(group.announcementId, {
        isActive: false,
      });
    }
  } else {
    // Non-owner left — reopen the announcement if it was closed due to capacity
    const joinedCount = activeJoinedCount(group);
    if (joinedCount < group.maxMembers) {
      await BuddyAnnouncement.findByIdAndUpdate(group.announcementId, {
        isActive: true,
        expiresAt: new Date(Date.now() + ANNOUNCEMENT_TTL_MS),
      });
    }
  }

  await BuddyMessage.create({
    groupId: String(group._id),
    senderUserId: "system",
    senderDisplayName: "system",
    type: "system",
    text: `${member.displayName} left the group.`,
  });

  await group.save();

  io.to(String(group._id)).emit("buddy:member_left", {
    groupId: String(group._id),
    userId: input.userId,
    displayName: member.displayName,
  });
}

export async function getGroup(
  groupId: string,
  userId: string,
): Promise<IBuddyGroup> {
  const group = await BuddyGroup.findById(groupId);
  if (!group) throw new Error("GROUP_NOT_FOUND");
  assertMember(group, userId);
  return group;
}

export async function getMyGroup(userId: string): Promise<IBuddyGroup | null> {
  return BuddyGroup.findOne({
    isActive: true,
    members: { $elemMatch: { userId, status: "joined" } },
  });
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function sendMessage(
  input: SendMessageInput,
  io: SocketIOServer,
): Promise<IBuddyMessage> {
  const group = await BuddyGroup.findById(input.groupId);
  if (!group || !group.isActive) throw new Error("GROUP_NOT_FOUND");
  assertMember(group, input.senderUserId);

  const message = await BuddyMessage.create({
    groupId: input.groupId,
    senderUserId: input.senderUserId,
    senderDisplayName: input.senderDisplayName,
    type: input.type ?? "text",
    text: input.text,
    progressChapter: input.progressChapter ?? null,
    progressPage: input.progressPage ?? null,
  });

  io.to(input.groupId).emit("buddy:message", {
    groupId: input.groupId,
    message: {
      _id: String(message._id),
      senderUserId: message.senderUserId,
      senderDisplayName: message.senderDisplayName,
      type: message.type,
      text: message.text,
      progressChapter: message.progressChapter,
      progressPage: message.progressPage,
      createdAt: message.createdAt,
    },
  });

  return message;
}

export async function getMessages(
  input: GetMessagesInput,
): Promise<IBuddyMessage[]> {
  const group = await BuddyGroup.findById(input.groupId);
  if (!group) throw new Error("GROUP_NOT_FOUND");
  assertMember(group, input.userId);

  const limit = Math.min(input.limit ?? 50, 100);

  const query: Record<string, unknown> = { groupId: input.groupId };
  if (input.before) {
    query["_id"] = { $lt: input.before };
  }

  return BuddyMessage.find(query).sort({ _id: -1 }).limit(limit);
}
