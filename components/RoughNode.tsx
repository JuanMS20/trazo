import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';
import { motion } from 'framer-motion';
import { DiagramNode } from '../types';

interface RoughNodeProps {
  node: DiagramNode;
  index: number;
}

export const RoughNode: React.FC<RoughNodeProps> = ({ node, index }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      const rc = rough.svg(svgRef.current);
      // Clear previous content
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }

      const options = {
        roughness: 1.5,
        bowing: 1.5,
        fill: node.color || 'white',
        fillStyle: 'solid', // or 'hachure' for sketchier look
        stroke: '#1e293b',
        strokeWidth: 2
      };

      let shape;
      const padding = 10; // Internal padding for drawing
      const w = node.width;
      const h = node.height;

      if (node.type === 'rectangle') {
        shape = rc.rectangle(2, 2, w - 4, h - 4, options);
      } else if (node.type === 'circle' || node.type === 'ellipse') {
        shape = rc.ellipse(w / 2, h / 2, w - 4, h - 4, options);
      } else if (node.type === 'diamond') {
        shape = rc.polygon([
           [w / 2, 2],
           [w - 2, h / 2],
           [w / 2, h - 2],
           [2, h / 2]
        ], options);
      } else {
        shape = rc.rectangle(2, 2, w - 4, h - 4, options);
      }

      svgRef.current.appendChild(shape);
    }
  }, [node]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: index * 0.1
      }}
      className="absolute flex items-center justify-center text-center p-2"
      style={{
        left: node.x - node.width / 2,
        top: node.y - node.height / 2,
        width: node.width,
        height: node.height,
      }}
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      />
      <span className="relative z-10 text-sm font-handwritten leading-tight pointer-events-none select-none">
        {node.text}
      </span>
    </motion.div>
  );
};
