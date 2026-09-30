import { Request, Response, redirect, session } from "@elements/app";
import html from "./template";
import { safeNext } from "#app/shared/services/auth";

export default function route(req: Request, res: Response) {
  let next = safeNext(req.query.next);

  if (session.isLoggedIn()) {
    redirect(next);
    return;
  }

  return new html({ next });
}
