import React, { useRef, useEffect, useState } from 'react';
import { DiagramData } from '../types';
import { RoughNode } from './RoughNode';
import { RoughEdge } from './RoughEdge';
import { motion } from 'framer-motion';

interface DiagramCanvasProps {
  data: DiagramData | null;
  onNodeDrag: (id: string, x: number, y: number) => void;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({ data, onNodeDrag }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Center the graph when data changes
  useEffect(() => {
    if (!data || !containerRef.current) return;

    // Calculate bounding box of the graph
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    data.nodes.forEach(node => {
      minX = Math.min(minX, node.x - node.width / 2);
      minY = Math.min(minY, node.y - node.height / 2);
      maxX = Math.max(maxX, node.x + node.width / 2);
      maxY = Math.max(maxY, node.y + node.height / 2);
    });

    if (minX === Infinity) return;

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const graphCenterX = minX + graphWidth / 2;
    const graphCenterY = minY + graphHeight / 2;

    // Get container center
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const viewCenterX = containerWidth / 2;
    const viewCenterY = containerHeight / 2; // Position it slightly higher

    // Calculate offset to move graph center to view center
    // We add a slight top padding/bias so it's not smack in the middle if it's tall
    setOffset({
        x: viewCenterX - graphCenterX,
        y: Math.max(50, viewCenterY - graphCenterY - 50)
    });

  }, [data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 font-handwritten text-xl opacity-60">
        <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl">draw</span>
            <span>Selecciona texto y haz click en el rayo...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <motion.div
        className="absolute w-full h-full"
        initial={false}
        animate={{ x: offset.x, y: offset.y }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      >
        {/* Edges rendered first so they are behind nodes */}
        {data.edges.map((edge, i) => {
            const fromNode = data.nodes.find(n => n.id === edge.fromId);
            const toNode = data.nodes.find(n => n.id === edge.toId);

            if (!fromNode || !toNode) return null;

            return (
                <RoughEdge
                    key={edge.id}
                    edge={edge}
                    fromNode={fromNode}
                    toNode={toNode}
                    index={i}
                />
            );
        })}

        {data.nodes.map((node, i) => (
            <RoughNode
                key={node.id}
                node={node}
                index={i}
                onDrag={onNodeDrag}
            />
        ))}
      </motion.div>
    </div>
  );
};
