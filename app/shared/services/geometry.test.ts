import { test, assert, equal } from "@elements/app";
import { bounds, packStroke, renderThumbnail, simplify } from "./geometry";
import type { Shape } from "./boards";

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
    h: 50,
    z: 1,
    color: "#1f2328",
    strokeWidth: 4,
    points: "",
    text: "",
    deleted: false,
    ...fields,
  };
}

test("geometry", () => {
  test("bounds flips an arrow drawn up and to the left", () => {
    equal(bounds({ x: 100, y: 100, w: -60, h: -40 }), { x: 40, y: 60, w: 60, h: 40 });
  });

  test("packStroke normalizes points into a padded box", () => {
    let packed = packStroke([10, 10, 110, 60], 4);

    equal({ x: packed.x, y: packed.y, w: packed.w, h: packed.h }, { x: 8, y: 8, w: 104, h: 54 });
    equal(packed.points.split(" ").length, 2);
    assert(packed.points.split(" ").every((p) => p.split(",").every((n) => +n >= 0 && +n <= 1000)), "points in range");
  });

  test("simplify keeps the ends and drops points too close together", () => {
    let flat = [0, 0, 0.5, 0, 1, 0, 10, 0, 10.2, 0, 20, 0];

    equal(simplify(flat, 2), [0, 0, 10, 0, 20, 0]);
  });

  test("renderThumbnail escapes text and skips erased shapes", () => {
    let svg = renderThumbnail([
      shape({ kind: "note", text: "<script>alert(1)</script>", color: "#ffc53d", w: 200, h: 200 }),
      shape({ id: "s2", kind: "text", text: "gone", deleted: true }),
    ]);

    assert(svg.startsWith("<svg"), "an svg");
    assert(!svg.includes("<script>"), "text is escaped");
    assert(!svg.includes("gone"), "erased shapes are not drawn");
  });
});
