import { Request, Response, redirect, session, sql } from "@elements/app";
import html from "./template";
import { listBoards } from "#app/shared/services/boards";

export default function route(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect("/signin");
    return;
  }

  let userId = session.getOrThrow("userId");

  let me = sql<{ name: string; color: string }>(`select name, color from users where id = ${userId}`).firstOrThrow("user not found");

  return new html({ boards: listBoards(userId), userName: me.name, userColor: me.color });
}
