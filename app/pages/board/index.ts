import { NotFoundError, Request, Response, redirect, session, sql } from "@elements/app";
import { randomUUID } from "node:crypto";
import html from "./template";
import { boardEvents, join, listMembers, shapes } from "#app/shared/services/boards";

export default function route(req: Request, res: Response) {
  let boardId = String(req.params.id);

  if (!session.isLoggedIn()) {
    redirect(`/signin?next=${encodeURIComponent(`/b/${boardId}`)}`);
    return;
  }

  if (!/^[0-9a-f-]{36}$/i.test(boardId)) {
    throw new NotFoundError("board not found");
  }

  let board = sql<{ id: string; title: string }>(
    `select id, title from boards where id = ${boardId}`,
  ).firstOrThrow("board not found");

  let userId = session.getOrThrow("userId");

  // Opening the link is the share: anyone signed in who has it joins the board.
  join(board.id, userId);

  let me = sql<{ id: string; name: string; color: string }>(
    `select id, name, color from users where id = ${userId}`,
  ).firstOrThrow("user not found");

  // One id per page view, so a user with two tabs is two cursors, and a
  // page never hears its own cursor back.
  let clientId = randomUUID();

  let listener = boardEvents
    .listen({ filter: (e) => e.boardId === board.id && e.clientId !== clientId })
    .on("disconnect", () => boardEvents.notify({ kind: "leave", boardId: board.id, clientId }));

  return new html({
    board,
    me,
    clientId,
    listener,
    members: listMembers(board.id),
    shapes: shapes.view({ boardId: board.id }),
  });
}
