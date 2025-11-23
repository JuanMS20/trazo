import React, { useState, useRef } from 'react';
import { ViewState, DiagramData } from '../types';
import { ExportModal } from '../components/ExportModal';
import { DiagramCanvas } from '../components/DiagramCanvas';
import { generateDiagramFromText } from '../utils/diagramGenerator';

interface WorkspaceProps {
  onNavigate: (view: ViewState) => void;
}

type ToolType = 'pan' | 'edit' | 'zoom';

export const Workspace: React.FC<WorkspaceProps> = ({ onNavigate }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [activeTool, setActiveTool] = useState<ToolType>('edit');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');

  // Simulate context menu trigger
  const handleTextClick = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const text = target.innerText;
    setSelectedText(text);

    // Toggle context menu for demonstration
    if (!showContextMenu) {
        // Position near the click, slightly offset
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenuPosition({ top: rect.top + rect.height + 10, left: rect.left + 50 });
        setShowContextMenu(true);
    } else {
        setShowContextMenu(false);
    }
  };

  const handleBoltClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Generate a flowchart by default if bolt is clicked
      const data = generateDiagramFromText(selectedText || "Una vez que entendemos el problema...", 'flowchart');
      setDiagramData(data);
      setShowContextMenu(false);
  };

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    if (tool === 'zoom') {
        setZoomLevel(prev => Math.min(prev + 0.1, 2)); // Simulate zoom in
        setTimeout(() => setActiveTool('edit'), 500); // Switch back to edit after zoom action
    }
  };

  const handleContextOptionClick = (label: string) => {
    let type: DiagramData['type'] = 'flowchart';
    if (label === 'Mapa Mental') type = 'mindmap';
    if (label === 'Ciclo') type = 'cycle';
    if (label === 'Jerarquía') type = 'hierarchy';

    const data = generateDiagramFromText(selectedText || "Texto de ejemplo", type);
    setDiagramData(data);
    setShowContextMenu(false);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background-light overflow-hidden">
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between bg-transparent z-20">
        <div className="flex items-center gap-4">
           <button onClick={() => onNavigate(ViewState.DASHBOARD)} className="p-2 rounded-full hover:bg-black/5 transition-colors">
             <span className="material-symbols-outlined text-off-black">grid_view</span>
           </button>
           <h2 className="font-handwritten text-2xl font-bold text-off-black">Untitled Document</h2>
        </div>
        
        <button 
            onClick={() => setIsExportModalOpen(true)}
            className="bg-primary text-off-black font-bold px-6 py-2 rounded-[45%_55%_50%_50%/55%_45%_55%_45%] -rotate-1 hover:rotate-0 transition-transform shadow-sm hover:shadow-md"
        >
            Exportar
        </button>
      </header>

      {/* Main Split Pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Editor */}
        <div className="w-1/3 min-w-[400px] bg-white h-full overflow-y-auto border-r border-gray-100 shadow-lg z-10">
            <div className="max-w-2xl mx-auto p-12 pt-8">
                <h1 className="font-sans text-3xl font-bold text-off-black mb-6">Brainstorming Sesión</h1>
                
                <div className="font-serif text-lg leading-relaxed text-gray-700 space-y-6">
                    <p
                        onClick={handleTextClick}
                        className="cursor-pointer hover:bg-gray-50 p-1 -m-1 rounded transition-colors"
                    >
                        El primer paso es definir claramente el problema que intentamos resolver. Sin una comprensión sólida del problema, cualquier solución será una conjetura.
                    </p>

                    {/* Interactive Paragraph for Context Menu Demo */}
                    <div className="relative group">
                        <p 
                            onClick={handleTextClick}
                            className={`relative cursor-pointer transition-colors duration-300 rounded-lg p-1 -m-1 ${showContextMenu ? 'bg-primary/20' : 'hover:bg-gray-50'}`}
                        >
                            <span className={showContextMenu ? 'bg-primary/30' : ''}>
                                Una vez que entendemos el problema, podemos comenzar a idear posibles soluciones. Esta fase debe ser lo más abierta y libre posible, fomentando la creatividad y el pensamiento divergente.
                            </span>
                        </p>
                        
                        {/* Floating Bolt Button (Visible when "selected") */}
                        <div className={`absolute -right-12 top-1/2 -translate-y-1/2 transition-all duration-300 ${showContextMenu ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                            <button
                                onClick={handleBoltClick}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-off-black shadow-lg hover:scale-110 transition-transform"
                            >
                                <span className="material-symbols-outlined">bolt</span>
                            </button>
                        </div>
                    </div>

                    <p
                        onClick={handleTextClick}
                        className="cursor-pointer hover:bg-gray-50 p-1 -m-1 rounded transition-colors"
                    >
                        Después de la fase de ideación, debemos evaluar las soluciones propuestas frente a un conjunto de criterios predefinidos.
                    </p>
                </div>
            </div>
        </div>

        {/* Right Panel: Canvas */}
        <div className="flex-1 bg-[#FDFBF7] relative overflow-hidden" style={{ cursor: activeTool === 'pan' ? 'grab' : 'default' }}>
            {/* Dot Grid Background */}
            <div
                className="absolute inset-0 transition-transform duration-200 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    transform: `scale(${zoomLevel})`
                }}
            ></div>

            {/* Diagram Canvas Layer */}
            <div className="absolute inset-0 w-full h-full">
                 <DiagramCanvas data={diagramData} />
            </div>

            {/* Floating Toolbar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-xl rounded-[20px_20px_0_0] px-6 py-3 flex gap-6 z-20">
                <button
                    onClick={() => handleToolChange('pan')}
                    className={`p-2 rounded-full transition-colors ${activeTool === 'pan' ? 'text-off-black bg-gray-100 ring-2 ring-gray-300' : 'text-gray-500 hover:text-off-black hover:bg-gray-100'}`}
                >
                    <span className="material-symbols-outlined">pan_tool</span>
                </button>
                <button
                    onClick={() => handleToolChange('edit')}
                    className={`p-2 rounded-full transition-colors ${activeTool === 'edit' ? 'text-off-black bg-gray-100 ring-2 ring-gray-300' : 'text-gray-500 hover:text-off-black hover:bg-gray-100'}`}
                >
                    <span className="material-symbols-outlined">edit</span>
                </button>
                <button
                    onClick={() => handleToolChange('zoom')}
                    className={`p-2 rounded-full transition-colors ${activeTool === 'zoom' ? 'text-off-black bg-gray-100 ring-2 ring-gray-300' : 'text-gray-500 hover:text-off-black hover:bg-gray-100'}`}
                >
                    <span className="material-symbols-outlined">zoom_in</span>
                </button>
            </div>
        </div>
      </div>

      {/* Context Menu Popover (Fixed position for demo) */}
      {showContextMenu && (
        <div 
            className="absolute z-50 w-72 rounded-xl bg-[#212121] text-white shadow-2xl p-2 flex flex-col gap-1 animate-[fadeIn_0.2s_ease-out]"
            style={{ top: '40%', left: '360px' }} // Positioned relative to the mock layout
        >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 mb-1">
                <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Visualizar como...</span>
            </div>
            
            {[
                { icon: 'account_tree', label: 'Diagrama de Flujo' },
                { icon: 'psychology', label: 'Mapa Mental' },
                { icon: 'sync', label: 'Ciclo' },
                { icon: 'schema', label: 'Jerarquía' }
            ].map((item) => (
                <button
                    key={item.label}
                    onClick={() => handleContextOptionClick(item.label)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left group"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    </div>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <span className="material-symbols-outlined text-gray-500 text-sm">chevron_right</span>
                </button>
            ))}
        </div>
      )}

      {/* Export Modal */}
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
};
