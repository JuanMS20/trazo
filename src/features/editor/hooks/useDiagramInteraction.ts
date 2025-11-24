import { useState } from 'react';
import { DiagramNode } from '../../../types';

interface UseDiagramDragProps {
    localNodes: DiagramNode[];
    setLocalNodes: React.Dispatch<React.SetStateAction<DiagramNode[]>>;
    simulationRef: React.MutableRefObject<any>;
    onNodeDrag: (id: string, x: number, y: number) => void;
}

export const useDiagramDrag = ({
    localNodes,
    setLocalNodes,
    simulationRef,
    onNodeDrag
}: UseDiagramDragProps) => {
    const [snapLines, setSnapLines] = useState<{ x?: number, y?: number }>({});

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

            if (snapX === undefined) {
                const left = x - draggingNode.width / 2;
                const right = x + draggingNode.width / 2;
                const otherLeft = other.x - other.width / 2;
                const otherRight = other.x + other.width / 2;

                if (Math.abs(left - otherLeft) < THRESHOLD) { newX = otherLeft + draggingNode.width / 2; snapX = otherLeft; }
                else if (Math.abs(left - otherRight) < THRESHOLD) { newX = otherRight + draggingNode.width / 2; snapX = otherRight; }
                else if (Math.abs(right - otherRight) < THRESHOLD) { newX = otherRight - draggingNode.width / 2; snapX = otherRight; }
                else if (Math.abs(right - otherLeft) < THRESHOLD) { newX = otherLeft - draggingNode.width / 2; snapX = otherLeft; }
            }

            if (snapY === undefined) {
                const top = y - draggingNode.height / 2;
                const bottom = y + draggingNode.height / 2;
                const otherTop = other.y - other.height / 2;
                const otherBottom = other.y + other.height / 2;

                if (Math.abs(top - otherTop) < THRESHOLD) { newY = otherTop + draggingNode.height / 2; snapY = otherTop; }
                else if (Math.abs(top - otherBottom) < THRESHOLD) { newY = otherBottom + draggingNode.height / 2; snapY = otherBottom; }
                else if (Math.abs(bottom - otherBottom) < THRESHOLD) { newY = otherBottom - draggingNode.height / 2; snapY = otherBottom; }
                else if (Math.abs(bottom - otherTop) < THRESHOLD) { newY = otherTop - draggingNode.height / 2; snapY = otherTop; }
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

    return {
        snapLines,
        handleNodeDrag,
        handleNodeDragStop
    };
};
