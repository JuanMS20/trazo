import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';
import { motion } from 'framer-motion';
import Draggable from 'react-draggable';
import { DiagramNode } from '../types';

interface RoughNodeProps {
  node: DiagramNode;
  index: number;
  onDrag: (id: string, x: number, y: number) => void;
}

export const RoughNode: React.FC<RoughNodeProps> = ({ node, index, onDrag }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (svgRef.current) {
      const rc = rough.svg(svgRef.current);
      // Clear previous content
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }

      const options = {
        roughness: 2.5,
        bowing: 2,
        fill: node.color || 'white',
        fillStyle: 'hachure',
        fillWeight: 1,
        hachureGap: 4,
        stroke: '#1e293b',
        strokeWidth: 2,
        disableMultiStroke: false
      };

      let shape;
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
    <Draggable
        nodeRef={nodeRef}
        defaultPosition={{ x: node.x - node.width / 2, y: node.y - node.height / 2 }}
        // Instead of controlled position, we use defaultPosition and sync on stop/drag
        // But for diagram updates (edges), we might need controlled or callback
        onStop={(e, data) => {
            // Calculate center
            onDrag(node.id, data.x + node.width / 2, data.y + node.height / 2);
        }}
    >
        <motion.div
        ref={nodeRef}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
            opacity: 1,
            scale: 1,
            // Subtle wobble removed from here if Draggable conflicts, but let's try keeping it
            // Draggable applies transform: translate. Framer motion applies transform too.
            // They might conflict.
            // Better to wrap inner content with wobble or use Draggable purely.
            // For robustness: Remove Framer Motion transform animations on the Draggable root.
        }}
        transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: index * 0.1,
        }}
        className="absolute flex flex-col items-center justify-center text-center p-2 cursor-grab active:cursor-grabbing"
        style={{
            // Position handled by Draggable via transform
            width: node.width,
            height: node.height,
        }}
        >
        <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        />

        {node.icon && (
            <span className="relative z-10 material-symbols-outlined text-3xl mb-1 text-off-black/80 pointer-events-none select-none">
                {node.icon}
            </span>
        )}

        <span className="relative z-10 text-lg font-caveat font-bold leading-tight pointer-events-none select-none text-off-black">
            {node.text}
        </span>
        </motion.div>
    </Draggable>
  );
};
