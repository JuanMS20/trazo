import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';
import { motion } from 'framer-motion';
import { DiagramEdge, DiagramNode } from '../types';

interface RoughEdgeProps {
  edge: DiagramEdge;
  fromNode: DiagramNode;
  toNode: DiagramNode;
  index: number;
}

export const RoughEdge: React.FC<RoughEdgeProps> = ({ edge, fromNode, toNode, index }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      const rc = rough.svg(svgRef.current);
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }

      const x1 = fromNode.x;
      const y1 = fromNode.y;
      const x2 = toNode.x;
      const y2 = toNode.y;

      const isInfographic = fromNode.variant === 'infographic' || toNode.variant === 'infographic';

      if (isInfographic) {
          // Curved styling for infographic
          // Calculate control point for curve
          // Simple quadratic curve offset
          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2 - 50; // Curve upwards

          const path = rc.curve(
              [
                  [x1, y1],
                  [cx, cy],
                  [x2, y2]
              ],
              {
                  roughness: 0.5,
                  bowing: 0.5,
                  stroke: '#cbd5e1', // Lighter gray
                  strokeWidth: 2
              }
          );
          svgRef.current.appendChild(path);

          // Add small circle at end?
          const endCircle = rc.circle(x2, y2, 8, { fill: 'white', fillStyle: 'solid', stroke: '#cbd5e1' });
          svgRef.current.appendChild(endCircle);

      } else {
          // Standard sketchy line
          const line = rc.line(x1, y1, x2, y2, {
            roughness: 1.2,
            bowing: 2,
            stroke: '#94a3b8',
            strokeWidth: 1.5
          });
          svgRef.current.appendChild(line);
      }
    }
  }, [edge, fromNode, toNode]);

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
