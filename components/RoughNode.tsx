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

      // Visual options
      const options: any = {
        roughness: node.variant === 'infographic' ? 1.5 : 2.5,
        bowing: node.variant === 'infographic' ? 0.5 : 2,
        fill: node.color || 'white',
        fillStyle: 'hachure',
        fillWeight: 1,
        hachureGap: 4,
        stroke: '#1e293b',
        strokeWidth: node.variant === 'infographic' ? 3 : 2,
        disableMultiStroke: node.variant === 'infographic'
      };

      // Specific overrides
      if (node.variant === 'infographic') {
          options.stroke = '#1e293b';
          options.roughness = 0.5;
          options.bowing = 0.2;
      }

      const w = node.width;
      const h = node.height;

      // Handle Node Types
      if (node.type === 'container') {
          // Container: Dashed, transparent, light stroke
          options.fill = 'transparent';
          options.fillStyle = 'solid'; // No hatch
          options.strokeLineDash = [5, 5];
          options.stroke = '#94a3b8'; // lighter grey
          options.strokeWidth = 2;
          rc.rectangle(2, 2, w - 4, h - 4, options);
      } else if (node.type === 'circle' || node.type === 'ellipse') {
          rc.ellipse(w / 2, h / 2, w - 4, h - 4, options);
      } else if (node.type === 'diamond') {
          // RoughJS has polygon, but no direct diamond primitive, simulate with polygon
          rc.polygon([[w/2, 2], [w-2, h/2], [w/2, h-2], [2, h/2]], options);
      } else {
          // Default rectangle
          rc.rectangle(2, 2, w - 4, h - 4, options);
      }
    }
  }, [node]);

  const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
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

  // Determine container specific styles
  const isContainer = node.type === 'container';

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
            "absolute p-4 cursor-grab active:cursor-grabbing group",
            isContainer ? "flex items-start justify-start" : "flex flex-col items-center justify-center text-center",
            // Lower z-index for container visually (handled by parent usually, but we can try here)
        )}
        style={{
            width: node.width,
            height: node.height,
            zIndex: isContainer ? 0 : 10 // Ensure containers stay behind
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
                className={clsx(
                    "relative z-20 bg-transparent border-none outline-none font-caveat font-bold resize-none overflow-hidden leading-tight",
                    isContainer ? "text-left w-full h-8 text-gray-500" : "text-center w-full h-full text-lg"
                )}
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
                <span className={clsx(
                    "relative z-10 font-caveat font-bold leading-tight pointer-events-none select-none text-off-black",
                    isContainer ? "text-sm text-gray-500 uppercase tracking-wider" : "text-lg"
                )}>
                    {node.text}
                </span>
            </>
        )}
        </motion.div>
    </Draggable>
  );
};
