import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { motion } from 'framer-motion';
import Draggable from 'react-draggable';
import { DiagramNode } from '../../../types';
import clsx from 'clsx';
import { getIconPath } from '../../../shared/utils/iconLibrary';

interface RoughNodeProps {
  node: DiagramNode;
  index: number;
  scale?: number;
  onDrag: (id: string, x: number, y: number) => void;
  onDragStop: (id: string, x: number, y: number) => void;
  onNodeChange?: (id: string, updates: Partial<DiagramNode>) => void;
  onNodeSelect?: (id: string) => void;
  onConnectionStart?: (nodeId: string, handle: 'top' | 'right' | 'bottom' | 'left') => void;
  onConnectionEnd?: (nodeId: string) => void;
}

export const RoughNode: React.FC<RoughNodeProps> = ({
  node,
  index,
  scale = 1,
  onDrag,
  onDragStop,
  onNodeChange,
  onNodeSelect,
  onConnectionStart,
  onConnectionEnd
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(node.text);
  const textMeasureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalText(node.text);
  }, [node.text]);

  // Auto-resize logic
  useEffect(() => {
      if (textMeasureRef.current && onNodeChange) {
          const { scrollWidth, scrollHeight } = textMeasureRef.current;

          // Calculate new dimensions with padding
          const padding = node.variant === 'infographic' ? 40 : 32;
          const minW = 100;
          const minH = 60;

          const newWidth = Math.max(minW, scrollWidth + padding);
          const newHeight = Math.max(minH, scrollHeight + padding);

          // Only update if dimensions changed significantly (> 5px) to avoid loops
          if (Math.abs(newWidth - node.width) > 5 || Math.abs(newHeight - node.height) > 5) {
               onNodeChange(node.id, { width: newWidth, height: newHeight });
          }
      }
  }, [localText, node.variant, node.width, node.height, node.icon]);

  useEffect(() => {
    if (svgRef.current) {
      // Clear previous content
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }

      const rc = rough.svg(svgRef.current);

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
      let shapeNode: SVGElement | null = null;

      // Draw Shape
      if (node.type === 'container') {
          options.fill = 'transparent';
          options.fillStyle = 'solid';
          options.strokeLineDash = [5, 5];
          options.stroke = '#94a3b8';
          options.strokeWidth = 2;
          shapeNode = rc.rectangle(2, 2, w - 4, h - 4, options);
      } else if (node.type === 'circle' || node.type === 'ellipse') {
          shapeNode = rc.ellipse(w / 2, h / 2, w - 4, h - 4, options);
      } else if (node.type === 'diamond') {
          shapeNode = rc.polygon([[w/2, 2], [w-2, h/2], [w/2, h-2], [2, h/2]], options);
      } else if (node.type === 'cylinder') {
          // Draw Cylinder parts and append them individually
          const ry = 10;

          // Body (Rectangle)
          const body = rc.rectangle(2, ry + 2, w - 4, h - 2 * ry - 4, { ...options, stroke: 'none' });
          svgRef.current.appendChild(body);

          // Left Line
          const leftLine = rc.line(2, ry + 2, 2, h - ry - 2, options);
          svgRef.current.appendChild(leftLine);

          // Right Line
          const rightLine = rc.line(w - 2, ry + 2, w - 2, h - ry - 2, options);
          svgRef.current.appendChild(rightLine);

          // Bottom Ellipse
          const bottomEllipse = rc.ellipse(w / 2, h - ry - 2, w - 4, ry * 2, options);
          svgRef.current.appendChild(bottomEllipse);

          // Top Ellipse
          const topEllipse = rc.ellipse(w / 2, ry + 2, w - 4, ry * 2, options);
          svgRef.current.appendChild(topEllipse);

          // Since we appended manually, we don't set shapeNode here to avoid double append
          shapeNode = null;

      } else {
          // Default rectangle
          shapeNode = rc.rectangle(2, 2, w - 4, h - 4, options);
      }

      if (shapeNode) {
          svgRef.current.appendChild(shapeNode);
      }

      // Draw Icon if present
      if (node.icon) {
          const iconPath = getIconPath(node.icon);
          if (iconPath) {
              const iconSize = 24;
              const scaleFactor = 2.5;
              const scaledSize = iconSize * scaleFactor;

              const tx = (w - scaledSize) / 2;
              const ty = (h - scaledSize) / 2 - 10;

              const iconNode = rc.path(iconPath, {
                  ...options,
                  stroke: '#1e293b',
                  fill: node.color === '#ffffff' ? '#e2e8f0' : '#ffffff',
                  fillStyle: 'solid',
                  roughness: 0.5,
                  bowing: 0.2,
                  strokeWidth: 1
              });

              // Apply transform to the generated path node
              iconNode.setAttribute("transform", `translate(${tx}, ${ty}) scale(${scaleFactor})`);
              svgRef.current.appendChild(iconNode);
          }
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

  // Connection Handles
  const renderHandles = () => {
      if (isEditing || node.type === 'container') return null;

      const handleClass = "absolute w-3 h-3 bg-blue-400 rounded-full border border-white opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair z-50";

      return (
        <>
           {/* Top */}
           <div
             className={clsx(handleClass, "-top-1.5 left-1/2 -translate-x-1/2")}
             onMouseDown={(e) => { e.stopPropagation(); onConnectionStart?.(node.id, 'top'); }}
           />
           {/* Right */}
           <div
             className={clsx(handleClass, "top-1/2 -right-1.5 -translate-y-1/2")}
             onMouseDown={(e) => { e.stopPropagation(); onConnectionStart?.(node.id, 'right'); }}
           />
           {/* Bottom */}
           <div
             className={clsx(handleClass, "-bottom-1.5 left-1/2 -translate-x-1/2")}
             onMouseDown={(e) => { e.stopPropagation(); onConnectionStart?.(node.id, 'bottom'); }}
           />
           {/* Left */}
           <div
             className={clsx(handleClass, "top-1/2 -left-1.5 -translate-y-1/2")}
             onMouseDown={(e) => { e.stopPropagation(); onConnectionStart?.(node.id, 'left'); }}
           />
        </>
      );
  };

  // Determine container specific styles
  const isContainer = node.type === 'container';

  return (
    <Draggable
        nodeRef={nodeRef}
        defaultPosition={{ x: node.x - node.width / 2, y: node.y - node.height / 2 }}
        onDrag={(e, data) => {
            onDrag(node.id, data.x + node.width / 2, data.y + node.height / 2);
        }}
        onStop={(e, data) => {
            onDragStop(node.id, data.x + node.width / 2, data.y + node.height / 2);
        }}
        disabled={isEditing}
        scale={scale}
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
        )}
        style={{
            width: node.width,
            height: node.height,
            zIndex: isContainer ? 0 : 10
        }}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => {
            e.stopPropagation();
            onNodeSelect?.(node.id);
        }}
        onMouseUp={() => onConnectionEnd?.(node.id)}
        >
        <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        />

        {renderHandles()}

        {/* Hidden measurement div */}
        <div
            ref={textMeasureRef}
            className={clsx(
                "absolute opacity-0 pointer-events-none whitespace-pre-wrap break-words",
                isContainer ? "text-sm text-gray-500 uppercase tracking-wider text-left" : "text-lg font-caveat font-bold leading-tight text-center",
                node.variant === 'infographic' && "text-xl font-bold"
            )}
            style={{
                maxWidth: '300px', // Max width constraint
                width: 'max-content'
            }}
        >
            {localText}
        </div>

        {isEditing ? (
            <textarea
                className={clsx(
                    "relative z-20 bg-transparent border-none outline-none font-caveat font-bold resize-none overflow-hidden leading-tight",
                    isContainer ? "text-left w-full h-8 text-gray-500" : "text-center w-full h-full text-lg",
                    // If icon is present, push text down?
                    node.icon && "mt-12"
                )}
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoFocus
                style={{ fontSize: 'inherit' }}
            />
        ) : node.variant === 'infographic' ? (
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
            <div className={clsx("relative z-10 flex flex-col items-center", node.icon && "mt-12")}>
                <span className={clsx(
                    "font-caveat font-bold leading-tight pointer-events-none select-none text-off-black",
                    isContainer ? "text-sm text-gray-500 uppercase tracking-wider" : "text-lg"
                )}>
                    {node.text}
                </span>
            </div>
        )}
        </motion.div>
    </Draggable>
  );
};
