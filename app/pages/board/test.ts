import { test, assert, equal } from "@elements/app";
import type { Shape } from "#app/shared/services/boards";
import { fitCamera, initials, resize, visibleShapes, zoomAt } from "./canvas";

function shape(fields: Partial<Shape>): Shape {
  return {
    id: "s1",
    createdAt: new Date(),
    boardId: "b1",
    createdBy: "u1",
    kind: "rect",
    x: 0,
    y: 0,
    w: 100,
    h: 100,
    z: 1,
    color: "#1f2328",
    strokeWidth: 4,
    points: "",
    text: "",
    deleted: false,
    ...fields,
  };
}

test("board canvas", () => {
  test("visibleShapes lays ghosts over rows, adds new ones, and hides the erased", () => {
    let rows = [shape({ id: "a", z: 2 }), shape({ id: "b", z: 1, deleted: true })];
    let ghosts = [
      { id: "a", clientId: "c1", shape: { x: 50 }, at: 0 },
      { id: "n", clientId: "c1", shape: shape({ id: "n", z: 0, kind: "arrow" }), at: 0 },
    ];

    let out = visibleShapes(rows, ghosts);

    equal(out.map((s) => s.id), ["n", "a"]);
    equal(out[1].x, 50);
  });

  test("resize from the top-left corner keeps the opposite corner still", () => {
    let box = resize(shape({}), "nw", 20, 30, false);

    equal(box, { x: 20, y: 30, w: 80, h: 70 });
  });

  test("resize never inverts a box", () => {
    let box = resize(shape({}), "se", -500, -500, false);

    assert(box.w >= 12 && box.h >= 12, "stays at least the minimum size");
  });

  test("an arrow's end handle moves only its end", () => {
    equal(resize(shape({ kind: "arrow", w: 100, h: 0 }), "end", 10, 20, false), { x: 0, y: 0, w: 110, h: 20 });
  });

  test("fitCamera centres the drawing and never zooms past 100%", () => {
    let cam = fitCamera([shape({ x: 0, y: 0, w: 100, h: 100 })], 1000, 800);

    equal(cam.zoom, 1);
    equal(cam.x, 50 - 500);
    equal(cam.y, 50 - 400);
  });

  test("zoomAt keeps the point under the pointer still", () => {
    let cam = zoomAt({ x: 0, y: 0, zoom: 1 }, 2, 100, 100);

    equal(cam.zoom, 2);
    equal(100 / cam.zoom + cam.x, 100);
  });

  test("initials", () => {
    equal(initials("Grace Brewster Hopper"), "GB");
    equal(initials("Ada"), "A");
  });
});
