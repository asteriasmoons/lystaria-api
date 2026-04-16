import { Router, Request, Response } from "express";
import {
  acceptInvite,
  createSharedEvent,
  getSharedEventByJoinCode,
  inviteAttendee,
  joinSharedEventByCode,
  leaveSharedEvent,
  listAttendees,
  updateSharedEvent,
} from "../services/shared-events-service";

const router = Router();

function handleError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  const status =
    message === "EVENT_NOT_FOUND"
      ? 404
      : message === "ATTENDEE_NOT_FOUND"
        ? 404
        : message === "NOT_A_MEMBER"
          ? 403
          : message === "FORBIDDEN"
            ? 403
            : message === "EVENT_NOT_JOINABLE"
              ? 403
              : message === "HOST_CANNOT_LEAVE"
                ? 403
                : message === "HOST_ALREADY_MEMBER"
                  ? 400
                  : message === "JOIN_CODE_GENERATION_FAILED"
                    ? 500
                    : 400;

  return res.status(status).json({
    success: false,
    error: message,
  });
}

router.post("/", async (req: Request, res: Response) => {
  try {
    const result = await createSharedEvent(req.body);
    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

router.get("/join-code/:joinCode", async (req: Request, res: Response) => {
  try {
    const joinCode = typeof req.params.joinCode === "string" ? req.params.joinCode : "";
    const currentUserId =
      typeof req.query.currentUserId === "string"
        ? req.query.currentUserId
        : undefined;

    const result = await getSharedEventByJoinCode(joinCode, currentUserId);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

router.post("/join-by-code", async (req: Request, res: Response) => {
  try {
    const result = await joinSharedEventByCode(req.body);
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

router.post("/:eventId/invite", async (req: Request, res: Response) => {
  try {
    const result = await inviteAttendee({
      eventId: typeof req.params.eventId === "string" ? req.params.eventId : "",
      actorUserId: req.body.actorUserId,
      inviteeUserId: req.body.inviteeUserId,
      inviteeDisplayName: req.body.inviteeDisplayName,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

router.post("/:eventId/accept", async (req: Request, res: Response) => {
  try {
    const result = await acceptInvite({
      eventId: typeof req.params.eventId === "string" ? req.params.eventId : "",
      userId: req.body.userId,
      displayName: req.body.displayName,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

router.post("/:eventId/leave", async (req: Request, res: Response) => {
  try {
    const result = await leaveSharedEvent({
      eventId: typeof req.params.eventId === "string" ? req.params.eventId : "",
      userId: req.body.userId,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

router.patch("/:eventId", async (req: Request, res: Response) => {
  try {
    const result = await updateSharedEvent({
      eventId: typeof req.params.eventId === "string" ? req.params.eventId : "",
      actorUserId: req.body.actorUserId,
      title: req.body.title,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      allDay: req.body.allDay,
      eventDescription: req.body.eventDescription,
      color: req.body.color,
      meetingUrl: req.body.meetingUrl,
      location: req.body.location,
      recurrenceRRule: req.body.recurrenceRRule,
      timeZoneId: req.body.timeZoneId,
      calendarId: req.body.calendarId,
      serverId: req.body.serverId,
      isJoinable: req.body.isJoinable,
      shareMode: req.body.shareMode,
      requiresApprovalToJoin: req.body.requiresApprovalToJoin,
      allowGuestsToInvite: req.body.allowGuestsToInvite,
      allowGuestsToEdit: req.body.allowGuestsToEdit,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

router.get("/:eventId/attendees", async (req: Request, res: Response) => {
  try {
    const eventId = typeof req.params.eventId === "string" ? req.params.eventId : "";
    const attendees = await listAttendees(eventId);
    return res.json({
      success: true,
      attendees,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

export default router;
