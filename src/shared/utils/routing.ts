import { DiagramNode } from '../../types';

interface Point {
  x: number;
  y: number;
}

interface GridPoint {
  x: number;
  y: number;
}

const GRID_SIZE = 20; // Size of grid cells

export const findOrthogonalPath = (
  start: Point,
  end: Point,
  nodes: DiagramNode[],
  padding: number = 20
): Point[] => {

  let minX = Math.min(start.x, end.x);
  let maxX = Math.max(start.x, end.x);
  let minY = Math.min(start.y, end.y);
  let maxY = Math.max(start.y, end.y);

  // Expand bounds to include relevant obstacles
  nodes.forEach(node => {
      minX = Math.min(minX, node.x - node.width/2 - padding);
      maxX = Math.max(maxX, node.x + node.width/2 + padding);
      minY = Math.min(minY, node.y - node.height/2 - padding);
      maxY = Math.max(maxY, node.y + node.height/2 + padding);
  });

  // Add some buffer
  minX -= 100;
  minY -= 100;
  maxX += 100;
  maxY += 100;

  // 2. Setup Grid
  const width = Math.ceil((maxX - minX) / GRID_SIZE);
  const height = Math.ceil((maxY - minY) / GRID_SIZE);

  // Safety check
  if (width * height > 50000) {
      return [start, { x: start.x, y: end.y }, end];
  }

  // Cost Grid: 1 = normal, 100 = obstacle
  const grid = new Uint16Array(width * height);
  for(let i=0; i<grid.length; i++) grid[i] = 1;

  const toGrid = (p: Point): GridPoint => ({
      x: Math.floor((p.x - minX) / GRID_SIZE),
      y: Math.floor((p.y - minY) / GRID_SIZE)
  });

  const toWorld = (g: GridPoint): Point => ({
      x: g.x * GRID_SIZE + minX + GRID_SIZE/2, // Center of cell
      y: g.y * GRID_SIZE + minY + GRID_SIZE/2
  });

  // Mark obstacles
  nodes.forEach(node => {
      if (node.type === 'container') return;

      const left = node.x - node.width / 2 - padding;
      const right = node.x + node.width / 2 + padding;
      const top = node.y - node.height / 2 - padding;
      const bottom = node.y + node.height / 2 + padding;

      const gMin = toGrid({ x: left, y: top });
      const gMax = toGrid({ x: right, y: bottom });

      const x0 = Math.max(0, gMin.x);
      const y0 = Math.max(0, gMin.y);
      const x1 = Math.min(width - 1, gMax.x);
      const y1 = Math.min(height - 1, gMax.y);

      for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
              grid[y * width + x] = 100; // High cost for obstacles
          }
      }
  });

  const startGrid = toGrid(start);
  const endGrid = toGrid(end);

  // Clear start/end
  if (startGrid.x >= 0 && startGrid.x < width && startGrid.y >= 0 && startGrid.y < height)
      grid[startGrid.y * width + startGrid.x] = 1;
  if (endGrid.x >= 0 && endGrid.x < width && endGrid.y >= 0 && endGrid.y < height)
      grid[endGrid.y * width + endGrid.x] = 1;

  // A* with Map
  return findOrthogonalPathWithMap(startGrid, endGrid, width, height, grid, start, end, toWorld);
};

const findOrthogonalPathWithMap = (
    startGrid: GridPoint,
    endGrid: GridPoint,
    width: number,
    height: number,
    grid: Uint16Array,
    originalStart: Point,
    originalEnd: Point,
    toWorld: (g: GridPoint) => Point
): Point[] => {

    const cameFrom = new Map<string, GridPoint>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const openSet: GridPoint[] = [startGrid];

    const getKey = (p: GridPoint) => `${p.x},${p.y}`;

    gScore.set(getKey(startGrid), 0);
    fScore.set(getKey(startGrid), Math.abs(startGrid.x - endGrid.x) + Math.abs(startGrid.y - endGrid.y));

    while(openSet.length > 0) {
         openSet.sort((a, b) => (fScore.get(getKey(a)) || Infinity) - (fScore.get(getKey(b)) || Infinity));
         const current = openSet.shift()!;

         if (current.x === endGrid.x && current.y === endGrid.y) {
             const path: Point[] = [];
             path.push(originalEnd);

             let curr = current;
             while (cameFrom.has(getKey(curr))) {
                 const prev = cameFrom.get(getKey(curr))!;
                 path.unshift(toWorld(curr));
                 curr = prev;
             }
             path.unshift(toWorld(startGrid));
             path[0] = originalStart;

             const simplified = simplifyPath(path);
             // Apply smoothing (Fillet)
             return smoothPath(simplified);
         }

         const dirs = [{x:0, y:-1}, {x:1, y:0}, {x:0, y:1}, {x:-1, y:0}];

         for (const dir of dirs) {
            const neighbor = { x: current.x + dir.x, y: current.y + dir.y };

            if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height) continue;

            // Cost calculation
            const cellCost = grid[neighbor.y * width + neighbor.x];
            const tentativeG = (gScore.get(getKey(current)) || 0) + cellCost;

            if (tentativeG < (gScore.get(getKey(neighbor)) || Infinity)) {
                cameFrom.set(getKey(neighbor), current);
                gScore.set(getKey(neighbor), tentativeG);
                fScore.set(getKey(neighbor), tentativeG + Math.abs(neighbor.x - endGrid.x) + Math.abs(neighbor.y - endGrid.y));

                if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
         }
    }

    return [originalStart, {x: originalStart.x, y: originalEnd.y}, originalEnd];
};

const simplifyPath = (points: Point[]): Point[] => {
    if (points.length < 3) return points;
    const newPoints = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i-1];
        const curr = points[i];
        const next = points[i+1];
        const isHorizontal = Math.abs(prev.y - curr.y) < 0.1 && Math.abs(curr.y - next.y) < 0.1;
        const isVertical = Math.abs(prev.x - curr.x) < 0.1 && Math.abs(curr.x - next.x) < 0.1;
        if (!isHorizontal && !isVertical) {
            newPoints.push(curr);
        }
    }
    newPoints.push(points[points.length - 1]);
    return newPoints;
};

// Fillet (Round Corners) Logic
export const smoothPath = (points: Point[], radius: number = 12): Point[] => {
    if (points.length < 3) return points;

    const smoothPoints: Point[] = [];
    smoothPoints.push(points[0]);

    for (let i = 1; i < points.length - 1; i++) {
        const p1 = points[i-1];
        const p2 = points[i];
        const p3 = points[i+1];

        // Vector 1 (p1 -> p2)
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const len1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y);

        // Vector 2 (p2 -> p3)
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        const len2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y);

        // Clamped radius
        const r = Math.min(radius, len1/2, len2/2);

        // Start of curve (backed off from p2 towards p1)
        const c1 = {
            x: p2.x - (v1.x / len1) * r,
            y: p2.y - (v1.y / len1) * r
        };

        // End of curve (advanced from p2 towards p3)
        const c2 = {
            x: p2.x + (v2.x / len2) * r,
            y: p2.y + (v2.y / len2) * r
        };

        // We push a "Control Point" logic for RoughJS or SVG
        // But here 'points' returns a polyline.
        // For 'RoughEdge' to draw a curve, it needs a specific structure?
        // RoughJS 'curve' takes points. 'linearPath' takes points.
        // If I return points for a bezier, I need to know how 'RoughEdge' consumes them.

        // Let's assume RoughEdge draws a path string or uses 'linearPath'.
        // If I want real curves, I need to return a path format that RoughEdge understands,
        // OR I return a dense list of points approximating the curve?
        // OR I return "Command Points" (Start, Control, End).

        // Looking at utils/geometry.ts, calculateEdgePath returns { points, type }.
        // If type is 'orthogonal', it expects points.
        // If I want curves, I should probably return type 'curved' but with multiple segments?
        // RoughJS curve() fits a curve through points.

        // To keep it simple and compatible with typical polyline renderers:
        // I will return the corner points: Start, CurveStart, Control(p2), CurveEnd, End
        // And let the renderer handle it?
        // RoughEdge probably uses 'linearPath' for orthogonal.

        // Option A: Subdivide the bezier into small lines.
        // Option B: Change the return type structure to support Bezier commands.

        // Let's go with Option A (Subdivision) for "sketchy" look and compatibility.
        // It's robust.

        // Add start of curve
        smoothPoints.push(c1);

        // Subdivide Quad Bezier (c1 -> p2 -> c2)
        const steps = 5;
        for (let t = 1; t <= steps; t++) {
             const k = t / (steps + 1);
             const x = (1-k)*(1-k)*c1.x + 2*(1-k)*k*p2.x + k*k*c2.x;
             const y = (1-k)*(1-k)*c1.y + 2*(1-k)*k*p2.y + k*k*c2.y;
             smoothPoints.push({x, y});
        }

        // Add end of curve
        smoothPoints.push(c2);
    }

    smoothPoints.push(points[points.length - 1]);
    return smoothPoints;
};
