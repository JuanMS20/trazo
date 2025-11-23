import React, { useMemo, useRef, useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { DiagramCanvas } from '../DiagramCanvas';
import { DiagramData } from '../../types';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';

export const DiagramNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const data = node.attrs.data as DiagramData | null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

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

  const handleNodeDrag = (id: string, x: number, y: number) => {
    if (!data) return;

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
              const dataUrl = await htmlToImage.toSvg(element, { backgroundColor: '#FDFBF7' });
              download(dataUrl, 'diagram.svg');
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
      >
        <DiagramCanvas data={data} onNodeDrag={handleNodeDrag} />

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
