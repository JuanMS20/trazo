import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { motion } from 'framer-motion';
import Draggable from 'react-draggable';
import { DiagramNode } from '../types';
import clsx from 'clsx';

interface RoughNodeProps {
  node: DiagramNode;
  index: number;
  onDrag: (id: string, x: number, y: number) => void;
  onNodeChange?: (id: string, updates: Partial<DiagramNode>) => void;
  onNodeSelect?: (id: string) => void;
}

export const RoughNode: React.FC<RoughNodeProps> = ({ node, index, onDrag, onNodeChange, onNodeSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(node.text);

  useEffect(() => {
    setLocalText(node.text);
  }, [node.text]);

  useEffect(() => {
    if (svgRef.current) {
      const rc = rough.svg(svgRef.current);
      // Clear previous content
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }

      const options = {
        roughness: node.variant === 'infographic' ? 1.5 : 2.5, // Cleaner for infographic
        bowing: node.variant === 'infographic' ? 0.5 : 2,
        fill: node.color || 'white',
        fillStyle: 'hachure',
        fillWeight: 1,
        hachureGap: 4,
        stroke: node.variant === 'infographic' ? '#ffffff' : '#1e293b', // White stroke for dark bg look or contrasting? Let's stick to dark stroke usually, but infographic might look cool with white on dark?
        // Actually, canvas is light. So dark stroke is best.
        strokeWidth: node.variant === 'infographic' ? 3 : 2,
        disableMultiStroke: node.variant === 'infographic'
      };

      // Override stroke for infographic to be cleaner/thicker
      if (node.variant === 'infographic') {
          options.stroke = '#1e293b';
          options.roughness = 0.5;
          options.bowing = 0.2;
      }

      const w = node.width;
      const h = node.height;

      if (node.type === 'circle' || node.type === 'ellipse') {
        rc.ellipse(w / 2, h / 2, w - 4, h - 4, options);
      } else {
        rc.rectangle(2, 2, w - 4, h - 4, options);
      }
    }
  }, [node]);

  const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent canvas zoom/pan
      setIsEditing(true);
  };

  const handleBlur = () => {
      setIsEditing(false);
      if (localText !== node.text && onNodeChange) {
          onNodeChange(node.id, { text: localText });
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleBlur();
      }
  };

  return (
    <Draggable
        nodeRef={nodeRef}
        defaultPosition={{ x: node.x - node.width / 2, y: node.y - node.height / 2 }}
        onStop={(e, data) => {
            onDrag(node.id, data.x + node.width / 2, data.y + node.height / 2);
        }}
        disabled={isEditing}
    >
        <motion.div
        ref={nodeRef}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: index * 0.1,
        }}
        className={clsx(
            "absolute flex flex-col items-center justify-center text-center p-4 cursor-grab active:cursor-grabbing group",
            // For infographic, we might want to allow text to overflow or position specifically
        )}
        style={{
            width: node.width,
            height: node.height,
        }}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => {
            e.stopPropagation();
            onNodeSelect?.(node.id);
        }}
        >
        <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        />

        {isEditing ? (
            <textarea
                className="relative z-20 bg-transparent border-none outline-none font-caveat font-bold text-center resize-none overflow-hidden w-full h-full text-lg leading-tight"
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoFocus
                style={{ fontSize: 'inherit' }}
            />
        ) : node.variant === 'infographic' ? (
            // Infographic Content Layout
            <div className="relative z-10 flex flex-col items-center gap-2 pointer-events-none select-none">
                 {node.label && node.label !== 'Main' && (
                     <span className="font-display text-4xl font-bold text-off-black/20 absolute -top-2 right-4">
                         {node.label}
                     </span>
                 )}

                 <span className={clsx(
                     "font-caveat leading-tight text-off-black",
                     node.label === 'Main' ? "text-3xl font-bold text-primary-dark" : "text-xl font-bold"
                 )}>
                    {node.text}
                 </span>

                 {node.description && (
                     <span className="font-sans text-xs text-gray-600 max-w-[140px] leading-snug">
                         {node.description}
                     </span>
                 )}
            </div>
        ) : (
            // Standard Content Layout
            <>
                {node.icon && (
                    <span className="relative z-10 material-symbols-outlined text-3xl mb-1 text-off-black/80 pointer-events-none select-none">
                        {node.icon}
                    </span>
                )}
                <span className="relative z-10 text-lg font-caveat font-bold leading-tight pointer-events-none select-none text-off-black">
                    {node.text}
                </span>
            </>
        )}
        </motion.div>
    </Draggable>
  );
};
