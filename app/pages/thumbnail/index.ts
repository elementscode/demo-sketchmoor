import { Request, Response, session, sql } from "@elements/app";
import { isMember, Shape } from "#app/shared/services/boards";
import { renderThumbnail } from "#app/shared/services/geometry";

/**
 * The board list's picture of a board. The url carries the board's
 * updatedAt, so the image caches until the next edit changes it.
 */
export default function route(req: Request, res: Response) {
  let userId = session.getOrThrow("userId");
  let boardId = String(req.params.id);

  if (!isMember(boardId, userId)) {
    res.status(404);
    res.end();
    return;
  }

  let rows = sql<Shape>(`select * from shapes where boardId = ${boardId} and not deleted`).all();

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
  res.end(renderThumbnail(rows));
}
