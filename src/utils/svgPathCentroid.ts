type Point = [number, number];
type Polygon = Point[];

/** Parse SVG path `d` into separate polygon rings (each `M` starts a new ring). */
function parsePathPolygons(d: string): Polygon[] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  if (!tokens) return [];

  const polygons: Polygon[] = [];
  let current: Polygon = [];
  let x = 0;
  let y = 0;
  let i = 0;

  const nextNumber = (): number | null => {
    const tok = tokens[i];
    if (tok === undefined || /[a-zA-Z]/.test(tok)) return null;
    i += 1;
    return parseFloat(tok);
  };

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (!cmd || !/[a-zA-Z]/.test(cmd)) continue;

    const relative = cmd === cmd.toLowerCase() && cmd !== 'z' && cmd !== 'Z';

    switch (cmd.toUpperCase()) {
      case 'M': {
        if (current.length > 0) polygons.push(current);
        current = [];
        for (;;) {
          const nx = nextNumber();
          const ny = nextNumber();
          if (nx == null || ny == null) break;
          let px = nx;
          let py = ny;
          if (relative) {
            px += x;
            py += y;
          }
          x = px;
          y = py;
          current.push([x, y]);
        }
        break;
      }
      case 'L': {
        for (;;) {
          const nx = nextNumber();
          const ny = nextNumber();
          if (nx == null || ny == null) break;
          let px = nx;
          let py = ny;
          if (relative) {
            px += x;
            py += y;
          }
          x = px;
          y = py;
          current.push([x, y]);
        }
        break;
      }
      case 'H': {
        for (;;) {
          const nx = nextNumber();
          if (nx == null) break;
          let px = nx;
          if (relative) px += x;
          x = px;
          current.push([x, y]);
        }
        break;
      }
      case 'V': {
        for (;;) {
          const ny = nextNumber();
          if (ny == null) break;
          let py = ny;
          if (relative) py += y;
          y = py;
          current.push([x, y]);
        }
        break;
      }
      default:
        break;
    }
  }

  if (current.length > 0) polygons.push(current);
  return polygons;
}

function polygonArea(ring: Polygon): number {
  let area = 0;
  for (let idx = 0; idx < ring.length; idx++) {
    const a = ring[idx];
    const b = ring[(idx + 1) % ring.length];
    if (!a || !b) continue;
    const [x1, y1] = a;
    const [x2, y2] = b;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

function segmentDistSq(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  let x = ax;
  let y = ay;
  let dx = bx - ax;
  let dy = by - ay;

  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = bx;
      y = by;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = px - x;
  dy = py - y;
  return dx * dx + dy * dy;
}

function pointToPolygonDist(x: number, y: number, polygon: Polygon[]): number {
  let inside = false;
  let minDistSq = Infinity;

  for (const ring of polygon) {
    for (let idx = 0, len = ring.length, prev = len - 1; idx < len; prev = idx++) {
      const a = ring[idx];
      const b = ring[prev];
      if (!a || !b) continue;
      const [ax, ay] = a;
      const [bx, by] = b;

      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) {
        inside = !inside;
      }

      minDistSq = Math.min(minDistSq, segmentDistSq(x, y, ax, ay, bx, by));
    }
  }

  return (inside ? 1 : -1) * Math.sqrt(minDistSq);
}

class LabelCell {
  x: number;
  y: number;
  h: number;
  d: number;
  max: number;

  constructor(x: number, y: number, h: number, polygon: Polygon[]) {
    this.x = x;
    this.y = y;
    this.h = h;
    this.d = pointToPolygonDist(x, y, polygon);
    this.max = this.d + h * Math.SQRT2;
  }
}

/** Mapbox polylabel: pole of inaccessibility — visual center inside polygon. */
function polylabel(polygon: Polygon[], precision = 0.5): Point {
  const outer = polygon[0];
  if (!outer?.length) return [0, 0];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [px, py] of outer) {
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const cellSize = Math.min(width, height);

  if (cellSize === 0) return [minX, minY];

  let h = cellSize / 2;
  const queue: LabelCell[] = [];

  for (let x = minX; x < maxX; x += cellSize) {
    for (let y = minY; y < maxY; y += cellSize) {
      queue.push(new LabelCell(x + h, y + h, h, polygon));
    }
  }

  let best = (() => {
    let area = 0;
    let cx = 0;
    let cy = 0;
    const first = outer[0];
    if (!first) return new LabelCell(0, 0, 0, polygon);
    for (let idx = 0, len = outer.length, prev = len - 1; idx < len; prev = idx++) {
      const a = outer[idx];
      const b = outer[prev];
      if (!a || !b) continue;
      const [ax, ay] = a;
      const [bx, by] = b;
      const f = ax * by - bx * ay;
      cx += (ax + bx) * f;
      cy += (ay + by) * f;
      area += f * 3;
    }
    if (area === 0) return new LabelCell(first[0], first[1], 0, polygon);
    return new LabelCell(cx / area, cy / area, 0, polygon);
  })();

  const bboxCell = new LabelCell(minX + width / 2, minY + height / 2, 0, polygon);
  if (bboxCell.d > best.d) best = bboxCell;

  queue.sort((a, b) => b.max - a.max);

  while (queue.length > 0) {
    const cell = queue.pop()!;
    if (cell.d > best.d) best = cell;
    if (cell.max - best.d <= precision) continue;

    h = cell.h / 2;
    queue.push(new LabelCell(cell.x - h, cell.y - h, h, polygon));
    queue.push(new LabelCell(cell.x + h, cell.y - h, h, polygon));
    queue.push(new LabelCell(cell.x - h, cell.y + h, h, polygon));
    queue.push(new LabelCell(cell.x + h, cell.y + h, h, polygon));
    queue.sort((a, b) => b.max - a.max);
  }

  return [best.x, best.y];
}

/**
 * Label anchor for an SVG region path.
 * Uses polylabel on the largest land polygon (standard map-label placement).
 */
export function computePathLabelPoint(d: string): { x: number; y: number } {
  const polygons = parsePathPolygons(d);
  if (polygons.length === 0) return { x: 0, y: 0 };

  const largest = [...polygons].sort((a, b) => polygonArea(b) - polygonArea(a))[0];
  if (!largest) return { x: 0, y: 0 };
  const [x, y] = polylabel([largest], 0.5);
  return { x, y };
}

/** @deprecated Use computePathLabelPoint — kept as alias for compatibility. */
export function computePathCentroid(d: string): { x: number; y: number } {
  return computePathLabelPoint(d);
}
