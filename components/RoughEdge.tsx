import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';
import { motion } from 'framer-motion';
import { DiagramEdge, DiagramNode } from '../types';
import { calculateEdgePath } from '../utils/geometry';

interface RoughEdgeProps {
  edge: DiagramEdge;
  fromNode: DiagramNode;
  toNode: DiagramNode;
  allNodes: DiagramNode[];
  index: number;
}

export const RoughEdge: React.FC<RoughEdgeProps> = ({ edge, fromNode, toNode, allNodes, index }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      const rc = rough.svg(svgRef.current);
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }

      const pathData = calculateEdgePath(fromNode, toNode, allNodes);
      const { points, type } = pathData;

      if (!points || points.length < 2) return;

      const start = points[0];
      const end = points[points.length - 1];
      const control = points.length > 2 ? points[1] : null;

      const isInfographic = fromNode.variant === 'infographic' || toNode.variant === 'infographic';

      if (type === 'curved' && control) {
           const path = rc.curve(
              [
                  [start.x, start.y],
                  [control.x, control.y],
                  [end.x, end.y]
              ],
              {
                  roughness: isInfographic ? 0.5 : 1.2,
                  bowing: isInfographic ? 0.5 : 2,
                  stroke: isInfographic ? '#cbd5e1' : '#94a3b8',
                  strokeWidth: isInfographic ? 2 : 1.5
              }
          );
          svgRef.current.appendChild(path);
      } else {
          const line = rc.line(start.x, start.y, end.x, end.y, {
            roughness: 1.2,
            bowing: 2,
            stroke: '#94a3b8',
            strokeWidth: 1.5
          });
          svgRef.current.appendChild(line);
      }

      // Draw arrow head at the end
      // Calculate angle
      const lastPoint = points[points.length - 1];
      const prevPoint = points.length === 3 ? points[1] : points[0];

      const angle = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x);

      const arrowLen = 12;
      const x3 = lastPoint.x - arrowLen * Math.cos(angle - Math.PI / 6);
      const y3 = lastPoint.y - arrowLen * Math.sin(angle - Math.PI / 6);
      const x4 = lastPoint.x - arrowLen * Math.cos(angle + Math.PI / 6);
      const y4 = lastPoint.y - arrowLen * Math.sin(angle + Math.PI / 6);

      const arrow = rc.polygon([
          [lastPoint.x, lastPoint.y],
          [x3, y3],
          [x4, y4]
      ], {
          fill: isInfographic ? '#cbd5e1' : '#94a3b8',
          fillStyle: 'solid',
          stroke: 'none'
      });
      svgRef.current.appendChild(arrow);

      if (isInfographic) {
           const endCircle = rc.circle(lastPoint.x, lastPoint.y, 8, { fill: 'white', fillStyle: 'solid', stroke: '#cbd5e1' });
           svgRef.current.appendChild(endCircle);
      }
    }
  }, [edge, fromNode, toNode, allNodes]);

  return (
    <motion.svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: 1, pathLength: 1 }}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
    >
       <g ref={svgRef} />
    </motion.svg>
  );
};
