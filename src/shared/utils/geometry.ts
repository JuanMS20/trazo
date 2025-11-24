import { DiagramNode } from '../../types';
import { findOrthogonalPath } from './routing';

interface Point {
  x: number;
  y: number;
}

// Calculate intersection between a line segment (from -> to) and a rectangle (node)
// Returns the point on the border of the node
export const getRectIntersection = (from: Point, node: DiagramNode): Point => {
  // Ensure node properties are valid numbers
  const cx = node.x || 0;
  const cy = node.y || 0;
  const w = node.width || 100;
  const h = node.height || 60;

  const dx = from.x - cx;
  const dy = from.y - cy;

  // If points are the same, return center (shouldn't happen often)
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  // Calculate slopes
  const slope = dy / dx;
  const absSlope = Math.abs(slope);

  // Diagonal slope of the rectangle
  const rectSlope = h / w;

  let ix, iy;

  if (absSlope <= rectSlope) {
    // Intersects left or right vertical side
    if (dx > 0) {
       // Right side
       ix = cx + w / 2;
    } else {
       // Left side
       ix = cx - w / 2;
    }
    iy = cy + (ix - cx) * slope;
  } else {
    // Intersects top or bottom horizontal side
    if (dy > 0) {
      // Bottom side
      iy = cy + h / 2;
    } else {
      // Top side
      iy = cy - h / 2;
    }
    // Avoid division by zero if slope is huge (vertical line)
    if (Math.abs(slope) > 0.001) {
        ix = cx + (iy - cy) / slope;
    } else {
        ix = cx;
    }
  }

  return { x: ix, y: iy };
};

// Check if a line segment (p1 -> p2) intersects a given node
export const lineIntersectsNode = (p1: Point, p2: Point, node: DiagramNode, padding = 10): boolean => {
    const cx = node.x || 0;
    const cy = node.y || 0;
    const w = node.width || 100;
    const h = node.height || 60;

    const left = cx - w / 2 - padding;
    const right = cx + w / 2 + padding;
    const top = cy - h / 2 - padding;
    const bottom = cy + h / 2 + padding;

    // Simple bounding box rejection
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    if (maxX < left || minX > right || maxY < top || minY > bottom) return false;

    // Check intersection with the 4 lines of the rect
    // We can use the "Line Intersection" formula or Liang-Barsky
    // For simplicity, checking against the 4 segments of the rect

    const rectLines = [
        [{x: left, y: top}, {x: right, y: top}],
        [{x: right, y: top}, {x: right, y: bottom}],
        [{x: right, y: bottom}, {x: left, y: bottom}],
        [{x: left, y: bottom}, {x: left, y: top}]
    ];

    for (const line of rectLines) {
        if (segmentsIntersect(p1, p2, line[0], line[1])) return true;
    }

    // Also check if the line is completely *inside* the rect (though less likely for routing)
    // or if one point is inside
    if (pointInRect(p1, left, right, top, bottom) || pointInRect(p2, left, right, top, bottom)) return true;

    return false;
};

const segmentsIntersect = (a: Point, b: Point, c: Point, d: Point): boolean => {
    const det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
    if (det === 0) return false;

    const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
    const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;

    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
};

const pointInRect = (p: Point, left: number, right: number, top: number, bottom: number) => {
    return p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
};

export const calculateEdgePath = (
    fromNode: DiagramNode,
    toNode: DiagramNode,
    allNodes: DiagramNode[]
): { points: Point[], type: 'straight' | 'curved' | 'orthogonal' } => {

    // 1. Get start and end points on the borders
    // Start point: intersection of center-to-center line with fromNode
    const endCenter = { x: toNode.x || 0, y: toNode.y || 0 };
    const startCenter = { x: fromNode.x || 0, y: fromNode.y || 0 };

    const startPoint = getRectIntersection(endCenter, fromNode);
    const endPoint = getRectIntersection(startCenter, toNode);

    // 2. Check for obstacles
    let hasObstacle = false;
    for (const node of allNodes) {
        if (node.id === fromNode.id || node.id === toNode.id) continue;
        // Ignore container nodes for collision usually? Or maybe not.
        // Let's ignore containers as they wrap things.
        if (node.type === 'container') continue;

        if (lineIntersectsNode(startPoint, endPoint, node)) {
            hasObstacle = true;
            break;
        }
    }

    // 3. If obstacle, calculate orthogonal path
    if (hasObstacle) {
        const points = findOrthogonalPath(startCenter, endCenter, allNodes);

        // Adjust start/end to be on the border?
        // The pathfinder returns center-to-center often or near it.
        // Let's re-clip the first and last segment.

        if (points.length >= 2) {
            points[0] = getRectIntersection(points[1], fromNode);
            points[points.length - 1] = getRectIntersection(points[points.length - 2], toNode);
        }

        return {
            type: 'orthogonal',
            points
        };
    }

    // 4. Infographic variant override (keep curved)
    if (fromNode.variant === 'infographic') {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const midX = (startPoint.x + endPoint.x) / 2;
        const midY = (startPoint.y + endPoint.y) / 2;

        const len = Math.sqrt(dx*dx + dy*dy);
        const safeLen = len === 0 ? 1 : len;
        let offset = 100;

        const controlPoint = {
            x: midX - (dy / safeLen) * offset,
            y: midY + (dx / safeLen) * offset
        };

        return {
            type: 'curved',
            points: [startPoint, controlPoint, endPoint]
        };
    }

    return {
        type: 'straight',
        points: [startPoint, endPoint]
    };
};
