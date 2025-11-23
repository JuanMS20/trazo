import { DiagramNode } from '../types';

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
  // 1. Define bounding box for the search area
  // We don't want to search the whole infinite canvas.
  // We'll limit to the bounding box of start/end + padding,
  // plus including any nodes that intersect this area?
  // Simpler: Find bounds of all nodes + start/end to define the grid.

  // Actually, for performance, let's just use a grid around the start/end
  // with some margin. If the path needs to go way out, this simple approach fails,
  // but for "Manhattan routing" in a diagram, it usually stays somewhat local.
  // Let's include all nodes in the grid calculation to be safe, or at least
  // nodes that are "in the way".

  let minX = Math.min(start.x, end.x);
  let maxX = Math.max(start.x, end.x);
  let minY = Math.min(start.y, end.y);
  let maxY = Math.max(start.y, end.y);

  // Expand bounds to include relevant obstacles
  // A simple heuristic: include all nodes, but clamp the grid size if it gets too huge?
  // Let's start with a dynamic bounds based on all nodes + start/end.

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

  // Safety check to prevent massive memory usage
  if (width * height > 50000) {
      // Fallback to direct line if grid is too massive (e.g. nodes very far apart)
      return [start, { x: start.x, y: end.y }, end];
  }

  const grid = new Uint8Array(width * height); // 0 = empty, 1 = obstacle

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
      if (node.type === 'container') return; // Don't route around containers usually

      const left = node.x - node.width / 2 - padding;
      const right = node.x + node.width / 2 + padding;
      const top = node.y - node.height / 2 - padding;
      const bottom = node.y + node.height / 2 + padding;

      const gMin = toGrid({ x: left, y: top });
      const gMax = toGrid({ x: right, y: bottom });

      // Clamp to grid bounds
      const x0 = Math.max(0, gMin.x);
      const y0 = Math.max(0, gMin.y);
      const x1 = Math.min(width - 1, gMax.x);
      const y1 = Math.min(height - 1, gMax.y);

      for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
              grid[y * width + x] = 1;
          }
      }
  });

  // 3. A* Algorithm
  const startGrid = toGrid(start);
  const endGrid = toGrid(end);

  // Ensure start and end are walkable (sometimes they start inside the padding of the node)
  if (startGrid.x >= 0 && startGrid.x < width && startGrid.y >= 0 && startGrid.y < height)
      grid[startGrid.y * width + startGrid.x] = 0;
  if (endGrid.x >= 0 && endGrid.x < width && endGrid.y >= 0 && endGrid.y < height)
      grid[endGrid.y * width + endGrid.x] = 0;

  const openSet: { pos: GridPoint, f: number, g: number, parent?: GridPoint }[] = [];
  const closedSet = new Set<string>();

  openSet.push({ pos: startGrid, f: 0, g: 0 });

  const getKey = (p: GridPoint) => `${p.x},${p.y}`;

  const heuristic = (a: GridPoint, b: GridPoint) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  let finalNode: { pos: GridPoint, parent?: GridPoint } | undefined = undefined;

  // Directions: Up, Right, Down, Left
  const dirs = [{x:0, y:-1}, {x:1, y:0}, {x:0, y:1}, {x:-1, y:0}];

  while (openSet.length > 0) {
      // Get lowest f
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      if (current.pos.x === endGrid.x && current.pos.y === endGrid.y) {
          finalNode = current;
          break;
      }

      closedSet.add(getKey(current.pos));

      for (const dir of dirs) {
          const neighborPos = { x: current.pos.x + dir.x, y: current.pos.y + dir.y };

          if (neighborPos.x < 0 || neighborPos.x >= width || neighborPos.y < 0 || neighborPos.y >= height) continue;
          if (grid[neighborPos.y * width + neighborPos.x] === 1) continue;
          if (closedSet.has(getKey(neighborPos))) continue;

          const gScore = current.g + 1; // Cost is 1 per step
          const existing = openSet.find(n => n.pos.x === neighborPos.x && n.pos.y === neighborPos.y);

          if (!existing || gScore < existing.g) {
              const neighbor = existing || { pos: neighborPos, f: 0, g: 0 };
              neighbor.g = gScore;
              neighbor.f = gScore + heuristic(neighborPos, endGrid);
              neighbor.parent = current.pos;

              // Penalize turns to encourage straight lines?
              // Current implementation doesn't track direction, but Manhattan distance heuristic naturally prefers straight-ish paths.
              // We could add a "turn penalty" if we tracked incoming direction.

              if (!existing) openSet.push(neighbor);
          }
      }
  }

  if (!finalNode) {
      // No path found, return simple elbow
      return [start, { x: start.x, y: end.y }, end];
  }

  // 4. Reconstruct path
  const path: Point[] = [];
  let curr: GridPoint | undefined = finalNode.pos;

  // Reconstruct using a map for parents would be faster than searching the closed set logic
  // (but here I used a linked object structure in 'finalNode' but only saved 'parent' coordinate...
  // wait, my 'closedSet' just stores keys. 'openSet' nodes had parents.
  // I need to trace back. 'finalNode' has 'parent'. But 'parent' is just a coordinate.
  // I need to look up the node with that coordinate.
  // Actually, I should have stored the 'node' reference in a map `cameFrom`.

  // Let's Fix the reconstruction logic:
  // I'll re-run a simplified reconstruction assuming I have a 'cameFrom' map.
  // But since I didn't implement 'cameFrom', I'll just use the fact I have 'parent' in the object...
  // Ah, 'finalNode' is just one object. The others are lost in 'closedSet' or popped from 'openSet'.
  // I need to persist the closed set nodes or use a map.

  // Retrying the loop structure with a map for path reconstruction
  return findOrthogonalPathWithMap(startGrid, endGrid, width, height, grid, start, end, toWorld);
};

const findOrthogonalPathWithMap = (
    startGrid: GridPoint,
    endGrid: GridPoint,
    width: number,
    height: number,
    grid: Uint8Array,
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
         // Sort by F score
         openSet.sort((a, b) => (fScore.get(getKey(a)) || Infinity) - (fScore.get(getKey(b)) || Infinity));
         const current = openSet.shift()!;

         if (current.x === endGrid.x && current.y === endGrid.y) {
             // Reconstruct
             const path: Point[] = [];
             path.push(originalEnd);

             let curr = current;
             while (cameFrom.has(getKey(curr))) {
                 const prev = cameFrom.get(getKey(curr))!;

                 // Simplify: Only add points at turns?
                 // Let's first get all grid points
                 path.unshift(toWorld(curr));
                 curr = prev;
             }
             path.unshift(toWorld(startGrid)); // First grid center
             path[0] = originalStart; // Replace with exact start

             // Simplify Path (Remove collinear points)
             return simplifyPath(path);
         }

         const dirs = [{x:0, y:-1}, {x:1, y:0}, {x:0, y:1}, {x:-1, y:0}];

         for (const dir of dirs) {
            const neighbor = { x: current.x + dir.x, y: current.y + dir.y };

            if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height) continue;
            if (grid[neighbor.y * width + neighbor.x] === 1) continue;

            const tentativeG = (gScore.get(getKey(current)) || 0) + 1;

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

    // Fallback
    return [originalStart, {x: originalStart.x, y: originalEnd.y}, originalEnd];
};

const simplifyPath = (points: Point[]): Point[] => {
    if (points.length < 3) return points;

    const newPoints = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i-1];
        const curr = points[i];
        const next = points[i+1];

        // Check if collinear (horizontal or vertical)
        const isHorizontal = Math.abs(prev.y - curr.y) < 0.1 && Math.abs(curr.y - next.y) < 0.1;
        const isVertical = Math.abs(prev.x - curr.x) < 0.1 && Math.abs(curr.x - next.x) < 0.1;

        if (!isHorizontal && !isVertical) {
            newPoints.push(curr);
        }
    }

    newPoints.push(points[points.length - 1]);
    return newPoints;
};
