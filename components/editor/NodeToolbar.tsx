import React, { useState, useRef, useEffect } from 'react';
import { DiagramNode } from '../../types';
import { ICON_PATHS, getIconPath } from '../../utils/iconLibrary';

interface NodeToolbarProps {
  node: DiagramNode;
  onChange: (updates: Partial<DiagramNode>) => void;
  onClose?: () => void;
}

const COLORS = ['#ffffff', '#fef08a', '#bae6fd', '#fecaca', '#bbf7d0', '#e9d5ff'];
const SHAPES = [
    { type: 'rectangle', icon: 'crop_square', label: 'Rectangle' },
    { type: 'circle', icon: 'circle', label: 'Circle' },
    { type: 'diamond', icon: 'diamond', label: 'Diamond' },
    { type: 'cylinder', icon: 'database', label: 'Cylinder' },
];

export const NodeToolbar: React.FC<NodeToolbarProps> = ({ node, onChange, onClose }) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close toolbar if clicking outside (handled by parent usually, but just in case)
  // Parent handles clicking background to deselect.

  const handleShapeChange = (type: any) => {
      onChange({ type });
  };

  const handleColorChange = (color: string) => {
      onChange({ color });
  };

  const handleIconSelect = (iconName: string) => {
      // Toggle off if already selected? Or just update.
      if (node.icon === iconName) {
          onChange({ icon: undefined });
      } else {
          onChange({ icon: iconName });
      }
      setShowIconPicker(false);
  };

  return (
    <div
        ref={toolbarRef}
        className="absolute bg-white rounded-xl shadow-xl border border-gray-200 p-2 flex flex-col gap-2 z-50 animate-in fade-in zoom-in-95 duration-200"
        style={{
            top: -60, // Position above the node? Or relative to canvas top?
            // The parent positions this element.
            // But if it's inside the node renderer, it moves with the node.
            // If it's in DiagramCanvas/NodeView but positioned absolute relative to canvas container...
            // DiagramNodeView positions it: top: 16, left: 50%.
            // Let's assume this component fills that container.
        }}
        onClick={(e) => e.stopPropagation()}
    >
        {/* Top Row: Shapes & Colors */}
        <div className="flex items-center gap-3">
            {/* Shapes */}
            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                {SHAPES.map(shape => (
                    <button
                        key={shape.type}
                        onClick={() => handleShapeChange(shape.type)}
                        className={`p-1.5 rounded-md transition-colors ${node.type === shape.type ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                        title={shape.label}
                    >
                        <span className="material-symbols-outlined text-xl leading-none">{shape.icon}</span>
                    </button>
                ))}
            </div>

            <div className="w-px h-6 bg-gray-200"></div>

            {/* Colors */}
            <div className="flex gap-1.5">
                {COLORS.map(c => (
                    <button
                        key={c}
                        onClick={() => handleColorChange(c)}
                        className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${node.color === c ? 'ring-2 ring-offset-1 ring-blue-400 border-gray-400' : 'border-gray-200'}`}
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
            </div>

            <div className="w-px h-6 bg-gray-200"></div>

            {/* Icon Trigger */}
            <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className={`p-1.5 rounded-md transition-colors ${showIconPicker || node.icon ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title="Icons"
            >
                <span className="material-symbols-outlined text-xl leading-none">mood</span>
            </button>
        </div>

        {/* Icon Picker Popover */}
        {showIconPicker && (
            <div className="absolute top-full right-0 mt-2 p-2 bg-white rounded-lg shadow-xl border border-gray-200 w-64 z-50">
                <div className="grid grid-cols-5 gap-2">
                    {Object.keys(ICON_PATHS).map(name => {
                        const path = getIconPath(name);
                        return (
                             <button
                                key={name}
                                onClick={() => handleIconSelect(name)}
                                className={`p-1 rounded-md hover:bg-gray-100 flex items-center justify-center h-10 border ${node.icon === name ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
                                title={name}
                             >
                                 <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-gray-700">
                                     <path d={path} />
                                 </svg>
                             </button>
                        );
                    })}
                    {/* Clear Icon Button */}
                    <button
                         onClick={() => handleIconSelect('')}
                         className="p-1 rounded-md hover:bg-red-50 text-red-500 flex items-center justify-center h-10 border border-transparent hover:border-red-200"
                         title="Remove Icon"
                    >
                         <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
