// src/routes/buddy-routes.ts

import { Router, Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import {
  postAnnouncement,
  getBoard,
  getMyAnnouncement,
  removeAnnouncement,
  updateAnnouncement,
  requestToJoin,
  respondToJoinRequest,
  leaveGroup,
  getGroup,
  getMyGroup,
  sendMessage,
  getMessages,
} from "../services/buddy-service";

export function createBuddyRouter(io: SocketIOServer): Router {
  const router = Router();

  function handleError(res: Response, error: unknown) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    const status =
      message === "ANNOUNCEMENT_NOT_FOUND" ? 404
      : message === "GROUP_NOT_FOUND" ? 404
      : message === "REQUEST_NOT_FOUND" ? 404
      : message === "FORBIDDEN" ? 403
      : message === "NOT_A_MEMBER" ? 403
      : message === "CANNOT_JOIN_OWN_ANNOUNCEMENT" ? 403
      : message === "GROUP_FULL" ? 409
      : message === "ALREADY_A_MEMBER" ? 409
      : message === "REQUEST_ALREADY_SENT" ? 409
      : 400;

    return res.status(status).json({ success: false, error: message });
  }

  // ── Announcement board ────────────────────────────────────────────────────

  // POST /api/buddy/announcements — post a new announcement
  router.post("/announcements", async (req: Request, res: Response) => {
    try {
      const announcement = await postAnnouncement(req.body);
      return res.status(201).json({ success: true, announcement });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET /api/buddy/announcements — global board (pass ?userId=xxx to exclude own)
  router.get("/announcements", async (req: Request, res: Response) => {
    try {
      const currentUserId =
        typeof req.query.userId === "string" ? req.query.userId : undefined;
      const announcements = await getBoard(currentUserId);
      return res.json({ success: true, announcements });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET /api/buddy/announcements/mine — current user's active announcement
  router.get("/announcements/mine", async (req: Request, res: Response) => {
    try {
      const userId =
        typeof req.query.userId === "string" ? req.query.userId : "";
      const announcement = await getMyAnnouncement(userId);
      return res.json({ success: true, announcement });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // PATCH /api/buddy/announcements/:id — update announcement details
  router.patch("/announcements/:id", async (req: Request, res: Response) => {
    try {
      const announcement = await updateAnnouncement({
        announcementId: req.params.id,
        ownerUserId: req.body.ownerUserId,
        message: req.body.message,
        currentChapter: req.body.currentChapter,
        currentPage: req.body.currentPage,
        maxMembers: req.body.maxMembers,
      });
      return res.json({ success: true, announcement });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // DELETE /api/buddy/announcements/:id — remove from board
  router.delete("/announcements/:id", async (req: Request, res: Response) => {
    try {
      const ownerUserId =
        typeof req.query.userId === "string" ? req.query.userId : "";
      await removeAnnouncement(req.params.id, ownerUserId);
      return res.json({ success: true });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // ── Groups ────────────────────────────────────────────────────────────────

  // POST /api/buddy/groups/request — send a join request
  router.post("/groups/request", async (req: Request, res: Response) => {
    try {
      const group = await requestToJoin(
        {
          announcementId: req.body.announcementId,
          requesterUserId: req.body.requesterUserId,
          requesterDisplayName: req.body.requesterDisplayName,
        },
        io,
      );
      return res.status(201).json({ success: true, group });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // POST /api/buddy/groups/:id/respond — accept or decline a join request
  router.post("/groups/:id/respond", async (req: Request, res: Response) => {
    try {
      const group = await respondToJoinRequest(
        {
          groupId: req.params.id,
          actorUserId: req.body.actorUserId,
          targetUserId: req.body.targetUserId,
          accept: req.body.accept,
        },
        io,
      );
      return res.json({ success: true, group });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // POST /api/buddy/groups/:id/leave — leave a group
  router.post("/groups/:id/leave", async (req: Request, res: Response) => {
    try {
      await leaveGroup({ groupId: req.params.id, userId: req.body.userId }, io);
      return res.json({ success: true });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET /api/buddy/groups/:id — get group details
  router.get("/groups/:id", async (req: Request, res: Response) => {
    try {
      const userId =
        typeof req.query.userId === "string" ? req.query.userId : "";
      const group = await getGroup(req.params.id, userId);
      return res.json({ success: true, group });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET /api/buddy/groups/mine — get current user's active group
  router.get("/groups/mine", async (req: Request, res: Response) => {
    try {
      const userId =
        typeof req.query.userId === "string" ? req.query.userId : "";
      const group = await getMyGroup(userId);
      return res.json({ success: true, group });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // ── Messages ──────────────────────────────────────────────────────────────

  // POST /api/buddy/groups/:id/messages — send a message
  router.post("/groups/:id/messages", async (req: Request, res: Response) => {
    try {
      const message = await sendMessage(
        {
          groupId: req.params.id,
          senderUserId: req.body.senderUserId,
          senderDisplayName: req.body.senderDisplayName,
          type: req.body.type,
          text: req.body.text,
          progressChapter: req.body.progressChapter,
          progressPage: req.body.progressPage,
        },
        io,
      );
      return res.status(201).json({ success: true, message });
    } catch (error) {
      return handleError(res, error);
    }
  });

  // GET /api/buddy/groups/:id/messages — paginated message history
  router.get("/groups/:id/messages", async (req: Request, res: Response) => {
    try {
      const userId =
        typeof req.query.userId === "string" ? req.query.userId : "";
      const before =
        typeof req.query.before === "string" ? req.query.before : null;
      const limit =
        typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 50;

      const messages = await getMessages({
        groupId: req.params.id,
        userId,
        before,
        limit,
      });
      return res.json({ success: true, messages });
    } catch (error) {
      return handleError(res, error);
    }
  });

  return router;
}
