import type { Shape, ShapeKind } from "#app/shared/services/boards";
import { bounds, POINT_SCALE, type Box } from "#app/shared/services/geometry";

export type Tool = "select" | "hand" | "pen" | "note" | "rect" | "arrow" | "text" | "eraser";

export type Handle = "nw" | "ne" | "sw" | "se" | "start" | "end";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

/** A shape as someone is dragging, resizing or drawing it, before it is written. */
export interface Ghost {
  id: string;
  clientId: string;
  shape: Partial<Shape>;
  at: number;
}

/** A pen stroke still under someone's hand, in board coordinates. */
export interface Ink {
  id: string;
  clientId: string;
  color: string;
  strokeWidth: number;
  flat: number[];
  at: number;
}

export interface Cursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  at: number;
}

export interface Change {
  id: string;
  before: Partial<Shape>;
  after: Partial<Shape>;
}

/** One undo step. An eraser drag is one step however many shapes it took. */
export interface Step {
  id: string;
  changes: Change[];
}

export interface Editing {
  id: string;
  kind: ShapeKind;
  text: string;
  original: string;
  isNew: boolean;
  height: number;
}

export interface BoardUi {
  tool: Tool;
  color: string;
  strokeWidth: number;
  camera: Camera;
  selected: string;
  editing: Editing | null;
  draft: string;
  ghosts: Ghost[];
  inks: Ink[];
  cursors: Cursor[];
  undo: Step[];
  redo: Step[];
  title: string;
  copied: boolean;
  panning: boolean;
  ready: boolean;
  clientId: string;
}

export const COLORS = ["#1f2328", "#e5484d", "#f76b15", "#ffc53d", "#30a46c", "#0090ff", "#8e4ec6"];

export const WIDTHS = [
  { value: 2, label: "Thin" },
  { value: 4, label: "Medium" },
  { value: 8, label: "Thick" },
];

export const TOOLS: { id: Tool; label: string; key: string }[] = [
  { id: "select", label: "Select and move", key: "V" },
  { id: "hand", label: "Pan", key: "H" },
  { id: "pen", label: "Pen", key: "P" },
  { id: "note", label: "Sticky note", key: "N" },
  { id: "rect", label: "Rectangle", key: "R" },
  { id: "arrow", label: "Arrow", key: "A" },
  { id: "text", label: "Text", key: "T" },
  { id: "eraser", label: "Eraser", key: "E" },
];

export const NOTE_SIZE = 200;

export const MIN_ZOOM = 0.2;

export const MAX_ZOOM = 4;

export function newId(): string {
  return crypto.randomUUID();
}

/** The shape with anything mid-gesture laid over it. */
export function withGhost(row: Shape, ghosts: Ghost[]): Shape {
  let ghost = ghosts.find((g) => g.id === row.id);

  return ghost ? { ...row, ...ghost.shape } : row;
}

/**
 * Everything the board draws, in stacking order: stored shapes not erased,
 * each with its ghost laid over it, then ghosts of shapes not stored yet.
 */
export function visibleShapes(rows: Iterable<Shape>, ghosts: Ghost[]): Shape[] {
  let out: Shape[] = [];
  let seen = new Set<string>();

  for (let row of rows) {
    seen.add(row.id);

    let shape = withGhost(row, ghosts);
    if (!shape.deleted) {
      out.push(shape);
    }
  }

  for (let g of ghosts) {
    if (!seen.has(g.id) && g.shape.kind && !g.shape.deleted) {
      out.push({ ...(g.shape as Shape), id: g.id });
    }
  }

  return out.sort((a, b) => a.z - b.z);
}

/** Pen points scaled into the shape's current box, in its own pixels. */
let scaledCache = new Map<string, string>();

export function penPoints(s: Shape): string {
  let key = `${s.w}:${s.h}:${s.points}`;
  let hit = scaledCache.get(key);

  if (hit !== undefined) {
    return hit;
  }

  let sx = s.w / POINT_SCALE;
  let sy = s.h / POINT_SCALE;
  let out = s.points
    .split(" ")
    .map((pair) => {
      let [px, py] = pair.split(",");
      return `${(+px * sx).toFixed(1)},${(+py * sy).toFixed(1)}`;
    })
    .join(" ");

  if (scaledCache.size > 2000) {
    scaledCache.clear();
  }
  scaledCache.set(key, out);

  return out;
}

export function inkPoints(flat: number[]): string {
  let parts: string[] = [];

  for (let i = 0; i < flat.length; i += 2) {
    parts.push(`${flat[i].toFixed(1)},${flat[i + 1].toFixed(1)}`);
  }

  return parts.join(" ");
}

/** The arrowhead as a path in the shape's own box. */
export function arrowPath(s: Shape): string {
  let b = bounds(s);
  let x1 = s.x - b.x;
  let y1 = s.y - b.y;
  let x2 = x1 + s.w;
  let y2 = y1 + s.h;
  let angle = Math.atan2(s.h, s.w);
  let head = 10 + s.strokeWidth * 2;
  let ax = x2 - head * Math.cos(angle - 0.45);
  let ay = y2 - head * Math.sin(angle - 0.45);
  let bx = x2 - head * Math.cos(angle + 0.45);
  let by = y2 - head * Math.sin(angle + 0.45);

  return `M${x1} ${y1} L${x2} ${y2} M${ax} ${ay} L${x2} ${y2} L${bx} ${by}`;
}

/** The box after dragging one of its handles by (dx, dy). */
export function resize(orig: Shape, handle: Handle, dx: number, dy: number, keepRatio: boolean): Box {
  if (handle === "start") {
    return { x: orig.x + dx, y: orig.y + dy, w: orig.w - dx, h: orig.h - dy };
  }

  if (handle === "end") {
    return { x: orig.x, y: orig.y, w: orig.w + dx, h: orig.h + dy };
  }

  let b = bounds(orig);
  let left = b.x;
  let top = b.y;
  let right = b.x + b.w;
  let bottom = b.y + b.h;

  if (handle === "nw" || handle === "sw") {
    left = Math.min(left + dx, right - 12);
  } else {
    right = Math.max(right + dx, left + 12);
  }

  if (handle === "nw" || handle === "ne") {
    top = Math.min(top + dy, bottom - 12);
  } else {
    bottom = Math.max(bottom + dy, top + 12);
  }

  let box = { x: left, y: top, w: right - left, h: bottom - top };

  if (keepRatio && b.w > 0 && b.h > 0) {
    let scale = Math.max(box.w / b.w, box.h / b.h);
    let w = b.w * scale;
    let h = b.h * scale;

    box.x = handle === "nw" || handle === "sw" ? right - w : left;
    box.y = handle === "nw" || handle === "ne" ? bottom - h : top;
    box.w = w;
    box.h = h;
  }

  return box;
}

/** The camera that fits every shape into a viewport, or the origin when there are none. */
export function fitCamera(rows: Shape[], width: number, height: number, bottomInset: number = 0): Camera {
  let live = rows.filter((s) => !s.deleted);

  if (live.length === 0 || width === 0 || height === 0) {
    return { x: -width / 2 + 200, y: -height / 2 + 200, zoom: 1 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let s of live) {
    let b = bounds(s);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }

  let pad = Math.min(60, width * 0.06);
  let usable = height - bottomInset;
  let zoom = Math.min((width - pad * 2) / (maxX - minX), (usable - pad * 2) / (maxY - minY), 1);
  zoom = Math.max(MIN_ZOOM, zoom);

  return {
    x: (minX + maxX) / 2 - width / 2 / zoom,
    y: (minY + maxY) / 2 - usable / 2 / zoom,
    zoom,
  };
}

/** Zooms by `factor` keeping the board point under (sx, sy) where it is on screen. */
export function zoomAt(cam: Camera, factor: number, sx: number, sy: number): Camera {
  let zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cam.zoom * factor));
  let wx = sx / cam.zoom + cam.x;
  let wy = sy / cam.zoom + cam.y;

  return { x: wx - sx / zoom, y: wy - sy / zoom, zoom };
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}
