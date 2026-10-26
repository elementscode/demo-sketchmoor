![A shared whiteboard with live cursors, built by Claude Code on Elements: a sprint retro board of sticky notes in three columns, with Grace's live cursor underlining a note mid-stroke and Alan's named cursor beside the circled action items.](https://elements.dev/demos/01a0f3cc-bac6-7c63-807c-cad09fc8582f/poster?v=f6d2223845f3)

# A shared whiteboard with live cursors, built by Claude Code on Elements

> Sketchmoor is a full-stack app built with Claude Code on Elements.

Sticky notes, pen, shapes and arrows on shared boards, with named live cursors, real-time edits and per-person undo.

[Run this app on your machine](https://elements.dev/demos/01a0f3cc-bac6-7c63-807c-cad09fc8582f). Use this demo as inspiration, or as the starting point for your own app. Your agent creates a new app with this one as the scaffold, and you prompt it to add whatever features you want.

## How it's built

Sketchmoor needed boards that several people draw on at once, named cursors that follow each person's pointer, strokes that appear as they are drawn, undo for each person and accounts with shared links. Each of those is a part of Elements, so the agent spent its 22 minutes on the whiteboard itself.

- **Shapes that sync.** Shapes are a LiveTable, one view per board. Notes, pen strokes, rectangles, arrows and text are rows, and the board adds and moves them straight through the view, so every open copy updates as each edit lands.

- **Cursors and strokes in flight.** A channel carries what is seen but never stored: each person's named cursor, the stroke under their pen and a shape mid-drag. Each browser drops its own echo.

- **Undo for each person.** Erasing marks a shape as deleted, so it can come back. Each person keeps their own undo and redo steps, applied through the same view.

- **Shared by link.** Opening a board's link adds the signed-in user to its members, and every edit checks that membership.

- **Thumbnails from the data.** The board list shows each board drawn as an SVG from its shapes, cached until the next edit.

- **Data and sessions from SQL.** Migrations define the boards and seed three demo accounts sharing two boards, a sprint retro of sticky notes and an architecture sketch. Each person signs in with a session.

## Why Elements

Elements is an integrated full-stack app framework and a project server. The project server checks the agent's work as it builds: it type-checks the server and browser code, analyzes the program, applies migrations and runs the tests, then reports the results to the agent. A security mistake, such as calling a server-only function from the browser, is a compile error. The agent reads the report and fixes its own mistakes before it tells you a feature is done. The same checks run on every feature you ask for next.
