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

  // Local state for nodes to allow smooth physics updates without committing every tick
  const [localNodes, setLocalNodes] = useState<DiagramNode[]>([]);

  useEffect(() => {
    if (data?.nodes) {
        // Only update local nodes if the IDs or count changed significantly,
        // OR if it's a fresh load.
        // We want to avoid overwriting local physics state with "stale" props
        // unless the props are definitely newer (e.g. undo/redo).
        // For now, let's sync.
        setLocalNodes(data.nodes);
    }
  }, [data?.nodes]);

  // Setup Physics Simulation
  useEffect(() => {
    if (!localNodes.length) return;

    // We only want to run simulation if we need to resolve overlaps
    // But keeping it alive allows "magic" feel.
    // However, we must be careful not to fight with user dragging.

    const nodes = localNodes.map(n => ({ ...n })); // Copy for d3 mutation

    const simulation = d3.forceSimulation(nodes as any)
        .force("collide", d3.forceCollide().radius((d: any) => Math.max(d.width, d.height) / 2 + 10).strength(0.5).iterations(2))
        .force("charge", d3.forceManyBody().strength(-100))
        .alphaDecay(0.1)
        .stop(); // Start stopped, tick manually or on event

    simulationRef.current = simulation;

    // We can define a function to "poke" the simulation

    return () => {
        simulation.stop();
    };
  }, []); // Run once on mount? Or recreate when nodes change?
  // Recreating is safer for adding/removing nodes.

  // Re-run simulation when nodes change size or count
  useEffect(() => {
      if (!simulationRef.current || !data?.nodes) return;

      const simulation = simulationRef.current;
      const currentNodes = localNodes;

      // Update nodes in simulation
      simulation.nodes(currentNodes);

      // Warm up / Tick
      simulation.alpha(0.3).restart();

      simulation.on("tick", () => {
          // Update local state with new positions
          // We need to be careful about React render cycle loop.
          // Maybe just use a ref for positions and force update?
          // Or throttle state updates.

          setLocalNodes(prev => prev.map(n => {
              const d3Node = currentNodes.find(dn => dn.id === n.id) as any;
              if (d3Node && (Math.abs(d3Node.x - n.x) > 1 || Math.abs(d3Node.y - n.y) > 1)) {
                  return { ...n, x: d3Node.x, y: d3Node.y };
              }
              return n;
          }));

          // If we want to persist to Tiptap eventually, we do it after simulation settles (onEnd)
      });

      simulation.on("end", () => {
          // Sync back to parent if changed?
          if (onNodesForceUpdate) {
              onNodesForceUpdate(currentNodes);
          }
      });

  }, [data?.nodes.length]); // Only full restart on node count change?
  // What about size change?
  // If a node resizes, we want to kick the simulation.

  // Actually, 'localNodes' shouldn't be in the dependency array of the effect that sets it.

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

                    {/* Nodes - Use localNodes for rendering to show physics */}
                    {(localNodes.length > 0 ? localNodes : data.nodes).map((node, i) => (
                        <RoughNode
                            key={node.id}
                            node={node}
                            index={i}
                            scale={scale}
                            onDrag={(id, x, y) => {
                                // Update local state immediately (Visual)
                                setLocalNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));

                                // Kick simulation to move others away while dragging?
                                if (simulationRef.current) {
                                    const simNode = simulationRef.current.nodes().find((n: any) => n.id === id);
                                    if (simNode) {
                                        simNode.fx = x; // Fix position while dragging
                                        simNode.fy = y;
                                    }
                                    simulationRef.current.alpha(0.1).restart();
                                }
                            }}
                            onDragStop={(id, x, y) => {
                                // Commit final position to Tiptap History
                                onNodeDrag(id, x, y);

                                // Release fixed position in simulation
                                if (simulationRef.current) {
                                    const simNode = simulationRef.current.nodes().find((n: any) => n.id === id);
                                    if (simNode) {
                                        simNode.fx = null;
                                        simNode.fy = null;
                                    }
                                    // Let it settle
                                    simulationRef.current.alpha(0.3).restart();
                                }
                            }}
                            onNodeChange={(id, updates) => {
                                // Update local state
                                setLocalNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));

                                // Propagate to parent
                                onNodeChange?.(id, updates);

                                // Kick physics if size changed
                                if (updates.width || updates.height) {
                                    if (simulationRef.current) {
                                        simulationRef.current.nodes(localNodes); // Refresh data
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
