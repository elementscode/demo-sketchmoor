![Sketchmoor, a shared whiteboard built with Elements: a sprint retro board of sticky notes in three columns, with Grace's live cursor underlining a note mid-stroke and Alan's named cursor beside the circled action items.](POSTER_URL)

# Sketchmoor

> A demo app built with [Elements](https://elements.dev).

Sticky notes, pen, shapes and arrows on shared boards, with named live cursors, real-time edits and per-person undo.

**Demo:** [Sketchmoor](TBD)

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
