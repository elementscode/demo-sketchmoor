![Sketchmoor, a shared whiteboard built with Elements: a sprint retro board of sticky notes in three columns, with Grace's live cursor underlining a note mid-stroke and Alan's named cursor beside the circled action items.](https://elements.dev/demos/01a0f3cc-bac6-7c63-807c-cad09fc8582f/poster?v=f6d2223845f3)

# Sketchmoor

> A demo app built with [Elements](https://elements.dev).

Sticky notes, pen, shapes and arrows on shared boards, with named live cursors, real-time edits and per-person undo.

**Demo:** [Sketchmoor](https://elements.dev/demos/01a0f3cc-bac6-7c63-807c-cad09fc8582f)

## Agent specs

What one run of the prompt below took, from an empty Elements project to this
app.

- **Agent:** Claude Code, Opus 5.5 Medium
- **Time:** 22 min
- **Cost:** $6.93 at API rates, September 2026

## Get started

```bash
elements create sketchmoor -scaffold=elementscode/demo-sketchmoor
```

## How it's built

Sketchmoor needed boards that several people draw on at once, named cursors that follow each person's pointer, strokes that appear as they are drawn, undo for each person and accounts with shared links. Each of those is a part of Elements, so the agent spent its 22 minutes on the whiteboard itself.

### What Elements gave the app

- **Shapes that sync.** `shapes` is a LiveTable in `app/shared/services/boards.ts`, one view per board. Notes, pen strokes, rectangles, arrows and text are rows, and the board page adds and moves them straight through the view, so every open copy of the board updates as each edit lands. The table's own handlers check that the editor is on the board.
- **Cursors and strokes in flight.** A `boardEvents` channel carries what is seen but never stored: each person's named cursor, the stroke under their pen and a shape mid-drag. The page sends them through the `emit` rpc, and each browser drops its own echo.
- **Undo for each person.** Erasing marks a shape as deleted, so an erased shape can come back. The board page keeps each person's own undo and redo steps in `app/pages/board/template.ehtml`, up to 200 deep, and applies them through the same view.
- **Shared by link.** Opening `/b/:id` calls `join`, which adds the signed-in user to the board's members, and every write checks that membership.
- **Thumbnails from the data.** `/b/:id/thumbnail.svg` draws each board's shapes as an SVG with `renderThumbnail` for the board list, cached until the next edit.
- **Data from SQL files.** Two migrations define the boards and seed three demo accounts sharing two boards, a sprint retro of sticky notes and an architecture sketch.

### What the agent got from the tooling

The agent ran 18 builds in 22 minutes. By the build's own timer, the median build finished in 43 milliseconds, so it checked its work after each edit and kept going. The build caught eleven errors in the tests where a helper's callback had become async, with a message that showed the corrected signature. The agent read 39 manual pages as it reached each part, from `recipes/collaborative-canvas` and `recipes/presence` to `livetable/mutations`, then wrote 22 tests and checked its pages at phone width in a real browser.

Start in `app/pages/board/template.ehtml`.

## Demo accounts

The seed creates two boards that all three accounts share: "Sprint 14 retro",
sticky notes in three columns, and "Checkout architecture", a sketch of
services, arrows and notes. Every account's password is `sketchmoor`, and the
sign-in page lists them. Open a board in two browsers signed in as different
people to see each other's cursors and edits live.

| Name         | Email                |
| ------------ | -------------------- |
| Ada Lovelace | ada@sketchmoor.dev   |
| Grace Hopper | grace@sketchmoor.dev |
| Alan Turing  | alan@sketchmoor.dev  |

## The prompt

```text
Build a collaborative whiteboard named sketchmoor.

- Sign up, log in, create boards, and share a board by link with anyone who
  has an account.
- Tools: pen with a few colors and widths, sticky notes with text, rectangles,
  arrows, text, and an eraser.
- Move and resize shapes and notes.
- Everyone on a board sees each other's cursors with their names, and every
  change as it happens.
- Undo and redo your own changes.
- A board list with thumbnails.

Seed three users and two boards with content (a retro board of sticky notes,
and an architecture sketch). Show the seeded logins on the sign-in page.

Drawing, shapes and cursors update in real time.
```

## License

MIT. See [LICENSE](LICENSE).
