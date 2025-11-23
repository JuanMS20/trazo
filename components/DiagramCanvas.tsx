import React, { useRef, useEffect, useState, useMemo } from 'react';
import { DiagramData, DiagramNode } from '../types';
import { RoughNode } from './RoughNode';
import { RoughEdge } from './RoughEdge';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import * as d3 from 'd3-force';
import { v4 as uuidv4 } from 'uuid';

interface DiagramCanvasProps {
  data: DiagramData | null;
  onNodeDrag: (id: string, x: number, y: number) => void;
  onNodeChange?: (id: string, updates: Partial<DiagramNode>) => void;
  onNodeSelect?: (id: string) => void;
  onEdgeCreate?: (fromId: string, toId: string) => void;
  onNodesForceUpdate?: (nodes: DiagramNode[]) => void;
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

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  data,
  onNodeDrag,
  onNodeChange,
  onNodeSelect,
  onEdgeCreate,
  onNodesForceUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<any>(null);

  const [localNodes, setLocalNodes] = useState<DiagramNode[]>([]);
  const [snapLines, setSnapLines] = useState<{ x?: number, y?: number }>({});

  useEffect(() => {
    if (data?.nodes) {
        setLocalNodes(data.nodes);
    }
  }, [data?.nodes]);

  // Setup Physics Simulation
  useEffect(() => {
    if (!localNodes.length) return;

    const nodes = localNodes.map(n => ({ ...n }));

    const simulation = d3.forceSimulation(nodes as any)
        .force("collide", d3.forceCollide().radius((d: any) => Math.max(d.width, d.height) / 2 + 10).strength(0.5).iterations(2))
        .force("charge", d3.forceManyBody().strength(-100))
        .alphaDecay(0.1)
        .stop();

    simulationRef.current = simulation;

    return () => {
        simulation.stop();
    };
  }, []);

  useEffect(() => {
      if (!simulationRef.current || !data?.nodes) return;

      const simulation = simulationRef.current;
      const currentNodes = localNodes;

      simulation.nodes(currentNodes);
      simulation.alpha(0.3).restart();

      simulation.on("tick", () => {
          setLocalNodes(prev => prev.map(n => {
              const d3Node = currentNodes.find(dn => dn.id === n.id) as any;
              // Only update if not currently being dragged/fixed?
              // Ideally d3Node.fx is set if dragged.
              if (d3Node && (d3Node.fx == null) && (d3Node.fy == null) && (Math.abs(d3Node.x - n.x) > 1 || Math.abs(d3Node.y - n.y) > 1)) {
                  return { ...n, x: d3Node.x, y: d3Node.y };
              }
              return n;
          }));
      });

      simulation.on("end", () => {
          if (onNodesForceUpdate) {
              onNodesForceUpdate(currentNodes);
          }
      });

  }, [data?.nodes.length]);

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
          startNodeCenter: { x: node.x, y: node.y }
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

  // Snapping Logic
  const handleNodeDrag = (id: string, x: number, y: number) => {
      const THRESHOLD = 5;
      let newX = x;
      let newY = y;
      let snapX: number | undefined;
      let snapY: number | undefined;

      const draggingNode = localNodes.find(n => n.id === id);
      if (!draggingNode) return;

      // Check alignment with other nodes
      localNodes.forEach(other => {
          if (other.id === id) return;

          // Center-to-Center X
          if (Math.abs(other.x - x) < THRESHOLD) {
              newX = other.x;
              snapX = other.x;
          }
          // Center-to-Center Y
          if (Math.abs(other.y - y) < THRESHOLD) {
              newY = other.y;
              snapY = other.y;
          }

          // Edge alignment?
          // Left align: (x - w/2) vs (other.x - other.w/2)
          // For simplicity, sticking to Center alignment as per primary requirement ("alinee con los centros").
          // The prompt says "centros o bordes". Let's add simple edge check if center didn't snap.

          if (snapX === undefined) {
              const left = x - draggingNode.width/2;
              const right = x + draggingNode.width/2;
              const otherLeft = other.x - other.width/2;
              const otherRight = other.x + other.width/2;

              if (Math.abs(left - otherLeft) < THRESHOLD) { newX = otherLeft + draggingNode.width/2; snapX = otherLeft; }
              else if (Math.abs(left - otherRight) < THRESHOLD) { newX = otherRight + draggingNode.width/2; snapX = otherRight; }
              else if (Math.abs(right - otherRight) < THRESHOLD) { newX = otherRight - draggingNode.width/2; snapX = otherRight; }
              else if (Math.abs(right - otherLeft) < THRESHOLD) { newX = otherLeft - draggingNode.width/2; snapX = otherLeft; }
          }

           if (snapY === undefined) {
              const top = y - draggingNode.height/2;
              const bottom = y + draggingNode.height/2;
              const otherTop = other.y - other.height/2;
              const otherBottom = other.y + other.height/2;

              if (Math.abs(top - otherTop) < THRESHOLD) { newY = otherTop + draggingNode.height/2; snapY = otherTop; }
              else if (Math.abs(top - otherBottom) < THRESHOLD) { newY = otherBottom + draggingNode.height/2; snapY = otherBottom; }
              else if (Math.abs(bottom - otherBottom) < THRESHOLD) { newY = otherBottom - draggingNode.height/2; snapY = otherBottom; }
              else if (Math.abs(bottom - otherTop) < THRESHOLD) { newY = otherTop - draggingNode.height/2; snapY = otherTop; }
          }
      });

      setSnapLines({ x: snapX, y: snapY });

      // Update local state immediately
      setLocalNodes(prev => prev.map(n => n.id === id ? { ...n, x: newX, y: newY } : n));

      // Override Physics
      if (simulationRef.current) {
          const simNode = simulationRef.current.nodes().find((n: any) => n.id === id);
          if (simNode) {
              simNode.fx = newX;
              simNode.fy = newY;
          }
          simulationRef.current.alpha(0.1).restart();
      }
  };

  const handleNodeDragStop = (id: string, x: number, y: number) => {
      setSnapLines({});
      onNodeDrag(id, x, y); // Commit to parent

      // Release Physics
      if (simulationRef.current) {
          const simNode = simulationRef.current.nodes().find((n: any) => n.id === id);
          if (simNode) {
              simNode.fx = null;
              simNode.fy = null;
          }
          simulationRef.current.alpha(0.3).restart();
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
        panning={{ velocityDisabled: true, disabled: connectionState.isConnecting }}
      >
        {({ state }) => {
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
                    {/* Snap Lines */}
                    {snapLines.x !== undefined && (
                        <div
                            className="absolute top-0 bottom-0 border-l border-cyan-500 border-dashed z-0 pointer-events-none"
                            style={{ left: snapLines.x, width: 1, height: '100%' }}
                        />
                    )}
                    {snapLines.y !== undefined && (
                        <div
                            className="absolute left-0 right-0 border-t border-cyan-500 border-dashed z-0 pointer-events-none"
                            style={{ top: snapLines.y, height: 1, width: '100%' }}
                        />
                    )}

                    {/* Edges */}
                    {data.edges.map((edge, i) => {
                        const fromNode = localNodes.find(n => n.id === edge.fromId) || data.nodes.find(n => n.id === edge.fromId);
                        const toNode = localNodes.find(n => n.id === edge.toId) || data.nodes.find(n => n.id === edge.toId);

                        if (!fromNode || !toNode) return null;

                        return (
                            <RoughEdge
                                key={edge.id}
                                edge={edge}
                                fromNode={fromNode}
                                toNode={toNode}
                                allNodes={localNodes} // Use local nodes for routing to update in real-time
                                index={i}
                            />
                        );
                    })}

                    {/* Temporary Connection */}
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
                    {(localNodes.length > 0 ? localNodes : data.nodes).map((node, i) => (
                        <RoughNode
                            key={node.id}
                            node={node}
                            index={i}
                            scale={scale}
                            onDrag={handleNodeDrag}
                            onDragStop={handleNodeDragStop}
                            onNodeChange={(id, updates) => {
                                setLocalNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
                                onNodeChange?.(id, updates);
                                if (updates.width || updates.height) {
                                    if (simulationRef.current) {
                                        simulationRef.current.nodes(localNodes);
                                        simulationRef.current.alpha(0.3).restart();
                                    }
                                }
                            }}
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
