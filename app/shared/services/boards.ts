import { Channel, ForbiddenError, LiveTable, session, sql } from "@elements/app";

export type ShapeKind = "pen" | "note" | "rect" | "arrow" | "text";

export interface Shape {
  id: string;
  createdAt: Date;
  boardId: string;
  createdBy: string;
  kind: ShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  color: string;
  strokeWidth: number;
  points: string;
  text: string;
  deleted: boolean;
}

export interface Board {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  updatedAt: Date;
  memberCount: number;
}

export interface Member {
  id: string;
  name: string;
  color: string;
}

/**
 * Everything on a board that is seen live but never stored: cursors, the
 * stroke under someone's pen, and a shape mid-drag. Each one names the page
 * view that sent it, so a browser can drop its own echo and tidy up after a
 * page that left.
 */
export type BoardEvent =
  | { kind: "cursor"; boardId: string; clientId: string; name: string; color: string; x: number; y: number }
  | { kind: "ink"; boardId: string; clientId: string; id: string; color: string; strokeWidth: number; points: number[] }
  | { kind: "ghost"; boardId: string; clientId: string; id: string; shape: Partial<Shape> }
  | { kind: "settle"; boardId: string; clientId: string; id: string }
  | { kind: "away"; boardId: string; clientId: string }
  | { kind: "leave"; boardId: string; clientId: string };

export const boardEvents = new Channel<BoardEvent>("board-events");

let memberCache = new Set<string>();

export function isMember(boardId: string, userId: string): boolean {
  let key = `${boardId}:${userId}`;

  if (memberCache.has(key)) {
    return true;
  }

  let found = !sql(`select 1 from boardMembers where boardId = ${boardId} and userId = ${userId}`).empty();
  if (found) {
    memberCache.add(key);
  }

  return found;
}

function requireMember(boardId: string | undefined): string {
  let userId = session.getOrThrow("userId");

  if (!boardId || !isMember(boardId, userId)) {
    throw new ForbiddenError("you are not on this board");
  }

  return userId;
}

export let shapes: LiveTable<Shape> = new LiveTable<Shape>({
  fields: [
    "boardId",
    "createdBy",
    "kind",
    "x",
    "y",
    "w",
    "h",
    "z",
    "color",
    "strokeWidth",
    "points",
    "text",
    "deleted",
  ],

  insert: (item) => {
    let userId = requireMember(item.boardId);

    return shapes.insert({ ...item, createdBy: userId });
  },

  update: (item) => {
    requireMember(item.boardId);

    return shapes.update(item);
  },

  // Erasing is an update to `deleted`, so undo can bring a shape back.
  delete: () => {
    throw new ForbiddenError("shapes are erased, not deleted");
  },
});

/** Adds the user to the board, which is what opening a shared link does. */
export function join(boardId: string, userId: string) {
  sql(
    `insert into boardMembers (boardId, userId)
          values (${boardId}, ${userId})
     on conflict do nothing`,
  );

  memberCache.add(`${boardId}:${userId}`);
}

export function listBoards(userId: string): Board[] {
  return sql<Board>(
    `select b.id, b.title, b.ownerId, u.name as ownerName, b.updatedAt,
            (select count(*)::int from boardMembers m2 where m2.boardId = b.id) as memberCount
       from boards b
       join boardMembers m on m.boardId = b.id and m.userId = ${userId}
       join users u on u.id = b.ownerId
      order by b.updatedAt desc`,
  ).all();
}

export function listMembers(boardId: string): Member[] {
  return sql<Member>(
    `select u.id, u.name, u.color
       from boardMembers m
       join users u on u.id = m.userId
      where m.boardId = ${boardId}
      order by m.createdAt`,
  ).all();
}

export function createBoard(title: string, userId: string): string {
  let name = title.trim() || "Untitled board";

  let board = sql<{ id: string }>(
    `insert into boards (title, ownerId) values (${name}, ${userId}) returning id`,
  ).firstOrThrow();

  join(board.id, userId);

  return board.id;
}

/** @rpc */
export function emit(events: BoardEvent[]) {
  for (let event of events) {
    requireMember(event.boardId);
    boardEvents.notify(event);
  }
}

/** @rpc */
export function renameBoard(boardId: string, title: string) {
  requireMember(boardId);

  let name = title.trim() || "Untitled board";
  sql(`update boards set title = ${name} where id = ${boardId}`);
}
