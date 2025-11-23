import React, { useMemo, useRef, useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { DiagramCanvas } from '../DiagramCanvas';
import { DiagramData, DiagramNode } from '../../types';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';
import { generateSvgString } from '../../utils/svgGenerator';
import { v4 as uuidv4 } from 'uuid';

export const DiagramNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const data = node.attrs.data as DiagramData | null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const containerHeight = useMemo(() => {
    if (!data || !data.nodes || data.nodes.length === 0) return 400; // default height

    let minY = Infinity;
    let maxY = -Infinity;

    data.nodes.forEach(n => {
      minY = Math.min(minY, n.y - n.height / 2);
      maxY = Math.max(maxY, n.y + n.height / 2);
    });

    const height = maxY - minY;
    return Math.max(height + 150, 300); // Add padding, min height 300
  }, [data]);

  const handleNodeChange = (id: string, updates: Partial<DiagramNode>) => {
      if (!data) return;
      const updatedNodes = data.nodes.map(n => n.id === id ? { ...n, ...updates } : n);

      // Debouncing updates if needed.
      // Text updates are already onBlur.
      // Auto-resize happens occasionally.
      // To be safe, we can check if it's a size update and if the change is small, maybe ignore?
      // But RoughNode already checks > 5px.

      updateAttributes({
          data: { ...data, nodes: updatedNodes }
      });
  };

  const handleNodesForceUpdate = (nodes: DiagramNode[]) => {
      // This comes from physics simulation settling
      if (!data) return;

      // We only update if positions are different significantly?
      // Or just trust the caller (DiagramCanvas onEnd).

      updateAttributes({
          data: { ...data, nodes }
      });
  };

  const handleNodeSelect = (id: string) => {
      setSelectedNodeId(id);
  };

  const handleColorChange = (color: string) => {
      if (!selectedNodeId || !data) return;
      handleNodeChange(selectedNodeId, { color });
      setSelectedNodeId(null); // Close menu after selection
  };

  const handleNodeDrag = (id: string, x: number, y: number) => {
    if (!data) return;

    // We used to update here, but DiagramCanvas now handles local state.
    // However, DiagramCanvas calls this when drag stops?
    // Let's assume DiagramCanvas calls this onDragEnd.
    // Wait, DiagramCanvas uses react-draggable onStop -> onNodeDrag.
    // So this IS the commit.

    const updatedNodes = data.nodes.map(n =>
        n.id === id ? { ...n, x, y } : n
    );

    updateAttributes({
        data: {
            ...data,
            nodes: updatedNodes
        }
    });
  };

  const handleEdgeCreate = (fromId: string, toId: string) => {
      if (!data) return;
      const newEdge = {
          id: uuidv4(),
          fromId,
          toId
      };
      updateAttributes({
          data: {
              ...data,
              edges: [...data.edges, newEdge]
          }
      });
  };

  const handleExport = async (format: 'png' | 'svg') => {
      if (!containerRef.current) return;

      // Find the inner canvas container to export
      // DiagramCanvas renders a div with ref=containerRef, but we wrap it.
      // We want to capture the content.
      const element = containerRef.current.querySelector('.relative.w-full.h-full') as HTMLElement;
      if (!element) return;

      try {
          if (format === 'png') {
              const dataUrl = await htmlToImage.toPng(element, { backgroundColor: '#FDFBF7' });
              download(dataUrl, 'diagram.png');
          } else {
              if (data) {
                  const svgString = generateSvgString(data);
                  const blob = new Blob([svgString], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  download(url, 'diagram.svg');
                  URL.revokeObjectURL(url);
              }
          }
      } catch (error) {
          console.error('Export failed', error);
      }
  };

  if (!data) return <NodeViewWrapper>Empty Diagram</NodeViewWrapper>;

  return (
    <NodeViewWrapper
        className="diagram-node-view my-8 w-full relative group transition-all duration-200"
        style={{ height: containerHeight }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        data-selected={selected}
    >
      <div
        ref={containerRef}
        className={`w-full h-full bg-[#FDFBF7] rounded-xl border transition-all duration-200 ${selected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-transparent hover:border-gray-200'}`}
        onClick={() => setSelectedNodeId(null)} // Deselect when clicking background
      >
        <DiagramCanvas
            data={data}
            onNodeDrag={handleNodeDrag}
            onNodeChange={handleNodeChange}
            onNodeSelect={handleNodeSelect}
            onEdgeCreate={handleEdgeCreate}
            onNodesForceUpdate={handleNodesForceUpdate}
        />

        {/* Color Picker Menu */}
        {selectedNodeId && (
            <div
                className="absolute bg-white rounded-full shadow-lg border border-gray-200 p-1.5 flex gap-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                style={{
                    // Position relative to selected node?
                    // Hard to get screen coords here easily without ref forwarding galore.
                    // Let's position it central top or top-left of the canvas for now, or near the mouse?
                    // Actually, let's just center it at the top of the canvas for simplicity and reliability
                    top: 16,
                    left: '50%',
                    transform: 'translateX(-50%)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {['#ffffff', '#fef08a', '#bae6fd', '#fecaca'].map(c => (
                    <button
                        key={c}
                        onClick={() => handleColorChange(c)}
                        className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
            </div>
        )}

        {/* Floating Export Menu */}
        <div className={`absolute top-2 right-2 flex gap-2 transition-opacity duration-200 ${isHovering || selected ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1">
                <button
                    onClick={() => handleExport('png')}
                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 text-xs font-medium"
                    title="Download PNG"
                >
                    PNG
                </button>
                <div className="w-px bg-gray-200 my-1"></div>
                <button
                    onClick={() => handleExport('svg')}
                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 text-xs font-medium"
                    title="Download SVG"
                >
                    SVG
                </button>
            </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
