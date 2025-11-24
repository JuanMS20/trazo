import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-force';
import { DiagramNode } from '../../../types';

export const useDiagramPhysics = (
    initialNodes: DiagramNode[] = [],
    onNodesForceUpdate?: (nodes: DiagramNode[]) => void
) => {
    const [localNodes, setLocalNodes] = useState<DiagramNode[]>([]);
    const simulationRef = useRef<any>(null);

    useEffect(() => {
        if (initialNodes) {
            setLocalNodes(initialNodes);
        }
    }, [initialNodes]);

    // Setup Physics Simulation
    useEffect(() => {
        if (!localNodes.length) return;

        // Create a copy to avoid mutating props directly if they were passed by reference
        // (though we use localNodes state which is good)
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
    }, []); // Run once on mount (or when we decide to re-init) - actually logic in component was empty deps

    useEffect(() => {
        if (!simulationRef.current || !initialNodes) return;

        const simulation = simulationRef.current;
        // We use localNodes for current state, but we need to sync with new data if data changes significantly
        // The original code re-ran this effect on [data?.nodes.length]

        // However, if we want to restart simulation with current localNodes:
        const currentNodes = localNodes;

        simulation.nodes(currentNodes);
        simulation.alpha(0.3).restart();

        simulation.on("tick", () => {
            setLocalNodes(prev => prev.map(n => {
                const d3Node = currentNodes.find((dn: any) => dn.id === n.id) as any;
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

    }, [initialNodes.length]); // Re-run when node count changes

    return {
        localNodes,
        setLocalNodes,
        simulationRef
    };
};
