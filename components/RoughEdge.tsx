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

      // Calculate rough start and end points
      // (For simplicity, we draw from center to center, but roughjs handles it nicely)
      // To make it better, we would calculate intersection points, but for now center-center is fine for MVP

      const x1 = fromNode.x;
      const y1 = fromNode.y;
      const x2 = toNode.x;
      const y2 = toNode.y;

      // Draw a slightly curved line or straight line
      const line = rc.line(x1, y1, x2, y2, {
        roughness: 1.2,
        bowing: 2,
        stroke: '#94a3b8',
        strokeWidth: 1.5
      });

      // Arrowhead logic (simple line for now, or use another rough path)
      // Simplified arrowhead simulation
      // ...

      svgRef.current.appendChild(line);
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
