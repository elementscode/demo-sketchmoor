import type { Shape } from "#app/shared/services/boards";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Pen points are stored normalized to this range inside the shape's box. */
export const POINT_SCALE = 1000;

/** The shape's box with a positive width and height, whichever way an arrow points. */
export function bounds(s: Box): Box {
  return {
    x: Math.min(s.x, s.x + s.w),
    y: Math.min(s.y, s.y + s.h),
    w: Math.abs(s.w),
    h: Math.abs(s.h),
  };
}

/** A sticky note's paper, mixed from the ink color it was made with. */
export function notePaper(color: string): string {
  return `color-mix(in oklab, ${color} 28%, #fffdf5)`;
}

export function notePaperHex(color: string): string {
  let hex = color.replace("#", "");
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);
  let mix = (c: number, base: number) => Math.round(c * 0.28 + base * 0.72);

  return `rgb(${mix(r, 255)}, ${mix(g, 253)}, ${mix(b, 245)})`;
}

/**
 * Turns absolute points into a box and the "x,y x,y" string stored on a pen
 * shape. The box is padded by half the stroke so a dot still has a size.
 */
export function packStroke(flat: number[], strokeWidth: number): Box & { points: string } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < flat.length; i += 2) {
    minX = Math.min(minX, flat[i]);
    maxX = Math.max(maxX, flat[i]);
    minY = Math.min(minY, flat[i + 1]);
    maxY = Math.max(maxY, flat[i + 1]);
  }

  let pad = strokeWidth / 2;
  let box = { x: minX - pad, y: minY - pad, w: maxX - minX + strokeWidth, h: maxY - minY + strokeWidth };

  let parts: string[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    let px = Math.round(((flat[i] - box.x) / box.w) * POINT_SCALE);
    let py = Math.round(((flat[i + 1] - box.y) / box.h) * POINT_SCALE);
    parts.push(`${px},${py}`);
  }

  return { ...box, points: parts.join(" ") };
}

/** Absolute points to the same string, for drawing a stroke still in progress. */
export function strokePath(flat: number[], box: Box): string {
  let parts: string[] = [];

  for (let i = 0; i < flat.length; i += 2) {
    let px = ((flat[i] - box.x) / Math.max(box.w, 1)) * POINT_SCALE;
    let py = ((flat[i + 1] - box.y) / Math.max(box.h, 1)) * POINT_SCALE;
    parts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }

  return parts.join(" ");
}

/** Drops points closer than `min` to the last one kept, so a slow hand is not a heavy row. */
export function simplify(flat: number[], min: number): number[] {
  if (flat.length <= 4) {
    return flat;
  }

  let out = [flat[0], flat[1]];

  for (let i = 2; i < flat.length - 2; i += 2) {
    let dx = flat[i] - out[out.length - 2];
    let dy = flat[i + 1] - out[out.length - 1];

    if (dx * dx + dy * dy >= min * min) {
      out.push(flat[i], flat[i + 1]);
    }
  }

  out.push(flat[flat.length - 2], flat[flat.length - 1]);

  return out;
}

/** A text shape's type size, from the width picked when it was made. */
export function fontSize(strokeWidth: number): number {
  return 12 + strokeWidth * 4;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(text: string, perLine: number, maxLines: number): string[] {
  let lines: string[] = [];

  for (let para of text.split("\n")) {
    let line = "";

    for (let word of para.split(/\s+/)) {
      if ((line + " " + word).trim().length > perLine && line) {
        lines.push(line);
        line = word;
      } else {
        line = (line + " " + word).trim();
      }
    }

    lines.push(line);
  }

  return lines.slice(0, maxLines);
}

/** An svg picture of a board, for the board list. */
export function renderThumbnail(rows: Shape[]): string {
  let live = rows.filter((s) => !s.deleted).sort((a, b) => a.z - b.z);

  if (live.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"></svg>`;
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

  // Fit the drawing into a 16:10 frame with a margin, centred.
  let pad = 40;
  let w = maxX - minX + pad * 2;
  let h = maxY - minY + pad * 2;
  let frameW = Math.max(w, h * 1.6);
  let frameH = frameW / 1.6;
  let vx = minX - pad - (frameW - w) / 2;
  let vy = minY - pad - (frameH - h) / 2;

  let body: string[] = [];

  for (let s of live) {
    let b = bounds(s);

    switch (s.kind) {
      case "pen":
        body.push(
          `<g transform="translate(${s.x} ${s.y}) scale(${s.w / POINT_SCALE} ${s.h / POINT_SCALE})">` +
            `<polyline points="${s.points}" fill="none" stroke="${s.color}" stroke-width="${s.strokeWidth}" ` +
            `stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></g>`,
        );
        break;

      case "rect":
        body.push(
          `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="none" ` +
            `stroke="${s.color}" stroke-width="${s.strokeWidth}"/>`,
        );
        break;

      case "arrow": {
        let x2 = s.x + s.w;
        let y2 = s.y + s.h;
        let angle = Math.atan2(s.h, s.w);
        let head = 10 + s.strokeWidth * 2;
        let ax = x2 - head * Math.cos(angle - 0.45);
        let ay = y2 - head * Math.sin(angle - 0.45);
        let bx = x2 - head * Math.cos(angle + 0.45);
        let by = y2 - head * Math.sin(angle + 0.45);

        body.push(
          `<path d="M${s.x} ${s.y} L${x2} ${y2} M${ax} ${ay} L${x2} ${y2} L${bx} ${by}" fill="none" ` +
            `stroke="${s.color}" stroke-width="${s.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
        );
        break;
      }

      case "note": {
        body.push(
          `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" fill="${notePaperHex(s.color)}"/>`,
        );

        let lines = wrap(s.text, Math.max(6, Math.floor(b.w / 11)), Math.max(1, Math.floor((b.h - 24) / 24)));
        lines.forEach((line, i) => {
          body.push(
            `<text x="${b.x + 14}" y="${b.y + 30 + i * 24}" font-family="system-ui, sans-serif" font-size="18" ` +
              `fill="#1f2328">${escapeXml(line)}</text>`,
          );
        });
        break;
      }

      case "text": {
        let size = fontSize(s.strokeWidth);
        let lines = wrap(s.text, Math.max(6, Math.floor(b.w / (size * 0.55))), 6);
        lines.forEach((line, i) => {
          body.push(
            `<text x="${b.x}" y="${b.y + size * (i + 1)}" font-family="system-ui, sans-serif" font-size="${size}" ` +
              `font-weight="600" fill="${s.color}">${escapeXml(line)}</text>`,
          );
        });
        break;
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" ` +
    `viewBox="${vx} ${vy} ${frameW} ${frameH}" preserveAspectRatio="xMidYMid meet">${body.join("")}</svg>`
  );
}
