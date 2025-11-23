import React, { useRef, useEffect, useState } from 'react';
import { DiagramData, DiagramNode } from '../types';
import { RoughNode } from './RoughNode';
import { RoughEdge } from './RoughEdge';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { v4 as uuidv4 } from 'uuid';

interface DiagramCanvasProps {
  data: DiagramData | null;
  onNodeDrag: (id: string, x: number, y: number) => void;
  onNodeChange?: (id: string, updates: Partial<DiagramNode>) => void;
  onNodeSelect?: (id: string) => void;
  onEdgeCreate?: (fromId: string, toId: string) => void;
}

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-50">
      <button onClick={() => zoomIn()} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 border border-gray-200 text-gray-600 material-symbols-outlined">add</button>
      <button onClick={() => zoomOut()} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 border border-gray-200 text-gray-600 material-symbols-outlined">remove</button>
      <button onClick={() => resetTransform()} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 border border-gray-200 text-gray-600 material-symbols-outlined">center_focus_strong</button>
    </div>
  );
};

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({ data, onNodeDrag, onNodeChange, onNodeSelect, onEdgeCreate }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [connectionState, setConnectionState] = useState<{
      isConnecting: boolean;
      fromId: string | null;
      mousePos: { x: number, y: number };
      startNodeCenter: { x: number, y: number };
  }>({
      isConnecting: false,
      fromId: null,
      mousePos: { x: 0, y: 0 },
      startNodeCenter: { x: 0, y: 0 }
  });

  const handleConnectionStart = (nodeId: string, handle: string) => {
      if (!data) return;
      const node = data.nodes.find(n => n.id === nodeId);
      if (!node) return;

      setConnectionState({
          isConnecting: true,
          fromId: nodeId,
          mousePos: { x: node.x, y: node.y },
          startNodeCenter: { x: node.x, y: node.y } // Simplified start point
      });
  };

  const handleConnectionEnd = (toId: string) => {
      if (connectionState.isConnecting && connectionState.fromId && connectionState.fromId !== toId) {
          onEdgeCreate?.(connectionState.fromId, toId);
      }
      setConnectionState({ isConnecting: false, fromId: null, mousePos: { x: 0, y: 0 }, startNodeCenter: { x: 0, y: 0 } });
  };

  const handleMouseMove = (e: React.MouseEvent, scale: number, positionX: number, positionY: number) => {
      if (!connectionState.isConnecting) return;

      // Transform mouse coordinates to canvas coordinates
      // e.clientX/Y are screen coords.
      // We need relative to container.
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - positionX) / scale;
      const y = (e.clientY - rect.top - positionY) / scale;

      setConnectionState(prev => ({
          ...prev,
          mousePos: { x, y }
      }));
  };

  const handleMouseUp = () => {
      if (connectionState.isConnecting) {
           setConnectionState({ isConnecting: false, fromId: null, mousePos: { x: 0, y: 0 }, startNodeCenter: { x: 0, y: 0 } });
      }
  };

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
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#FDFBF7]">
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        minScale={0.2}
        maxScale={4}
        limitToBounds={false}
        wheel={{ step: 0.1 }}
        panning={{ velocityDisabled: true, disabled: connectionState.isConnecting }} // Disable pan when connecting
      >
        {({ state }) => {
            // Ensure state exists before accessing properties
            const scale = state ? state.scale : 1;
            const positionX = state ? state.positionX : 0;
            const positionY = state ? state.positionY : 0;

            return (
            <div
                className="w-full h-full"
                onMouseMove={(e) => handleMouseMove(e, scale, positionX, positionY)}
                onMouseUp={handleMouseUp}
            >
                <Controls />
                <TransformComponent
                    wrapperClass="w-full h-full"
                    contentClass="w-full h-full"
                    contentStyle={{ width: '100%', height: '100%' }}
                >
                    {/* Edges */}
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
                                allNodes={data.nodes}
                                index={i}
                            />
                        );
                    })}

                    {/* Temporary Connection Line */}
                    {connectionState.isConnecting && (
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 100 }}>
                            <line
                                x1={connectionState.startNodeCenter.x}
                                y1={connectionState.startNodeCenter.y}
                                x2={connectionState.mousePos.x}
                                y2={connectionState.mousePos.y}
                                stroke="#94a3b8"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                        </svg>
                    )}

                    {/* Nodes */}
                    {data.nodes.map((node, i) => (
                        <RoughNode
                            key={node.id}
                            node={node}
                            index={i}
                            scale={scale}
                            onDrag={onNodeDrag}
                            onNodeChange={onNodeChange}
                            onNodeSelect={onNodeSelect}
                            onConnectionStart={handleConnectionStart}
                            onConnectionEnd={handleConnectionEnd}
                        />
                    ))}
                </TransformComponent>
            </div>
            );
        }}
      </TransformWrapper>
    </div>
  );
};
