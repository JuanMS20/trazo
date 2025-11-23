import React from 'react';
import { DiagramData } from '../types';
import { RoughNode } from './RoughNode';
import { RoughEdge } from './RoughEdge';

interface DiagramCanvasProps {
  data: DiagramData | null;
  onNodeDrag: (id: string, x: number, y: number) => void;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({ data, onNodeDrag }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 font-handwritten text-xl">
        Select text and click the bolt to visualize...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
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
    </div>
  );
};
