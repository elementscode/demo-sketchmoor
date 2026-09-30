import { test, assert, equal, session, sql } from "@elements/app";
import { createBoard, isMember, join, listBoards, listMembers, renameBoard, shapes } from "./boards";

function makeUser(name: string): string {
  return sql<{ id: string }>(
    `insert into users (name, email, color, passwordHash)
          values (${name}, ${name.toLowerCase() + "@example.com"}, '#0090ff', 'x')
     returning id`,
  ).firstOrThrow().id;
}

async function message(fn: () => unknown): Promise<string> {
  try {
    await fn();
    return "";
  } catch (err: any) {
    return err.message;
  }
}

test("boards", () => {
  test("a new board lists its owner as its one member", () => {
    let owner = makeUser("Owner");
    let id = createBoard("  Roadmap ", owner);

    let boards = listBoards(owner);
    equal(boards.length, 1);
    equal(boards[0].id, id);
    equal(boards[0].title, "Roadmap");
    equal(boards[0].memberCount, 1);
  });

  test("opening the link joins the board, once", () => {
    let owner = makeUser("Owner");
    let guest = makeUser("Guest");
    let id = createBoard("Shared", owner);

    assert(!isMember(id, guest), "not a member before opening the link");
    equal(listBoards(guest).length, 0);

    join(id, guest);
    join(id, guest);

    assert(isMember(id, guest), "a member after");
    equal(listBoards(guest).map((b) => b.id), [id]);
    equal(listMembers(id).map((m) => m.name), ["Owner", "Guest"]);
  });

  test("a member can draw, and a stranger cannot", async () => {
    let owner = makeUser("Owner");
    let stranger = makeUser("Stranger");
    let id = createBoard("Private", owner);
    let draw = { kind: "rect" as const, x: 0, y: 0, w: 100, h: 50, z: 1, color: "#1f2328", strokeWidth: 4, points: "", text: "", deleted: false };

    session.login({ userId: stranger, userName: "Stranger" });
    equal(await message(() => shapes.view({ boardId: id }).insert({ ...draw, createdBy: stranger })), "you are not on this board");

    session.login({ userId: owner, userName: "Owner" });
    let row = shapes.view({ boardId: id }).insert({ ...draw, createdBy: stranger });

    // The handler stamps the author from the session, whatever the browser sent.
    equal(sql<{ createdBy: string }>(`select createdBy from shapes where id = ${row.id}`).firstOrThrow().createdBy, owner);
  });

  test("erasing is an update, so it can be undone, and a delete is refused", async () => {
    let owner = makeUser("Owner");
    let id = createBoard("Erase", owner);
    session.login({ userId: owner, userName: "Owner" });

    let view = shapes.view({ boardId: id });
    let row = view.insert({ kind: "note", x: 0, y: 0, w: 200, h: 200, z: 1, color: "#ffc53d", strokeWidth: 4, points: "", text: "hi", deleted: false, createdBy: owner });

    view.update({ ...row, deleted: true });
    equal(sql<{ deleted: boolean }>(`select deleted from shapes where id = ${row.id}`).firstOrThrow().deleted, true);

    view.update({ ...row, deleted: false });
    equal(sql<{ deleted: boolean }>(`select deleted from shapes where id = ${row.id}`).firstOrThrow().deleted, false);

    equal(await message(() => view.delete(row)), "shapes are erased, not deleted");
  });

  test("renaming needs membership and never leaves a blank title", async () => {
    let owner = makeUser("Owner");
    let stranger = makeUser("Stranger");
    let id = createBoard("Old", owner);

    session.login({ userId: stranger, userName: "Stranger" });
    equal(await message(() => renameBoard(id, "Hijacked")), "you are not on this board");

    session.login({ userId: owner, userName: "Owner" });
    renameBoard(id, "   ");
    equal(sql<{ title: string }>(`select title from boards where id = ${id}`).firstOrThrow().title, "Untitled board");
  });
});
