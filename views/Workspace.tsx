import React, { useState, useRef, useEffect } from 'react';
import { ViewState, DiagramData } from '../types';
import { ExportModal } from '../components/ExportModal';
import { DiagramCanvas } from '../components/DiagramCanvas';
import { AiAgent } from '../utils/aiAgent';
import { GenerationLoader } from '../components/GenerationLoader';

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
  const [editorContent, setEditorContent] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Agent state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');

  const handleSelection = (triggerEvent?: React.SyntheticEvent) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const text = textarea.value.substring(start, end);
      setSelectedText(text);

      // If triggered by mouse, we use mouse coordinates (passed via triggerEvent if available)
      // If keyboard (onSelect), we might need to approximate or just use a default position?
      // Textarea cursor coordinates are hard.
      // For MVP, if no mouse event, we center it or put it near the textarea.

      let top = 0;
      let left = 0;

      if (triggerEvent && 'clientY' in triggerEvent.nativeEvent) {
          const mouseEvent = triggerEvent as React.MouseEvent;
          top = mouseEvent.clientY + 10;
          left = mouseEvent.clientX + 10;
      } else {
          // Fallback for keyboard selection: Position near the center of the textarea or bottom right
          // Ideally we would calculate caret position, but that requires a library or complex logic.
          const rect = textarea.getBoundingClientRect();
          top = rect.top + rect.height / 2;
          left = rect.left + rect.width / 2;
      }

      setContextMenuPosition({ top, left });
      setShowContextMenu(true);
    } else {
      // setShowContextMenu(false); // Optional: hide on deselect
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      handleSelection(e);
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
      // specific keys like Shift+Arrow or Ctrl+A might trigger selection
      // It's easier to just check selection on every keyup or use onSelect
      handleSelection();
  };

  const handleSelect = (e: React.SyntheticEvent) => {
      // onSelect fires when selection changes
      handleSelection(e);
  };

  const runAgentPipeline = async (text: string) => {
    setIsProcessing(true);
    setShowContextMenu(false);
    setProcessStep("Iniciando Agentes...");

    try {
        const result = await AiAgent.analyzeAndGenerate(text, (step) => {
            setProcessStep(step);
        });

        setDiagramData({
            ...result,
            type: 'flowchart'
        });
    } catch (error) {
        console.error("Agent Error:", error);
        alert("Error al generar el diagrama. Intenta de nuevo.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleBoltClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      runAgentPipeline(selectedText || editorContent || "Texto de ejemplo");
  };

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    if (tool === 'zoom') {
        setZoomLevel(prev => Math.min(prev + 0.1, 2)); // Simulate zoom in
        setTimeout(() => setActiveTool('edit'), 500); // Switch back to edit after zoom action
    }
  };

  const handleContextOptionClick = (label: string) => {
    runAgentPipeline(selectedText || editorContent || "Texto de ejemplo");
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
        <div className="w-1/3 min-w-[400px] bg-white h-full border-r border-gray-100 shadow-lg z-10 flex flex-col">
            <div className="flex-1 p-8 pt-8 overflow-y-auto relative">
                <textarea
                    ref={textareaRef}
                    className="w-full h-full resize-none outline-none font-serif text-lg leading-relaxed text-gray-700 placeholder:text-gray-300"
                    placeholder="Escribe aquí tu historia, ideas o notas. Selecciona el texto para visualizar..."
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    onSelect={handleSelect}
                    onMouseUp={handleMouseUp}
                    onKeyUp={handleKeyUp}
                />
                
                {/* Floating Context Menu Button (Visible when selection exists) */}
                {showContextMenu && (
                    <div
                        className="absolute z-20 animate-bounce-in"
                        style={{ top: contextMenuPosition.top - 60, left: contextMenuPosition.left }}
                    >
                         <button
                            onClick={handleBoltClick}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-off-black shadow-lg hover:scale-110 transition-transform"
                            title="Generar Visual"
                        >
                            <span className="material-symbols-outlined text-2xl">bolt</span>
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Right Panel: Canvas */}
        <div className="flex-1 bg-[#FDFBF7] relative overflow-hidden" style={{ cursor: activeTool === 'pan' ? 'grab' : 'default' }}>

            {/* Processing Loader Overlay */}
            {isProcessing && <GenerationLoader step={processStep} />}

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

      {/* Extended Context Menu Popover (When bolt is NOT clicked directly, or could be a separate interaction) */}

      {showContextMenu && !isProcessing && (
        <div 
            className="absolute z-50 w-64 rounded-xl bg-[#212121] text-white shadow-2xl p-2 flex flex-col gap-1 animate-[fadeIn_0.2s_ease-out]"
            style={{ top: contextMenuPosition.top + 10, left: contextMenuPosition.left }}
        >
             <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-1">
                 <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Generar...</span>
                 </div>
                 <button onClick={() => setShowContextMenu(false)} className="text-gray-500 hover:text-white">
                    <span className="material-symbols-outlined text-sm">close</span>
                 </button>
            </div>
            
             {[
                { icon: 'bolt', label: 'Automático' },
                { icon: 'account_tree', label: 'Diagrama de Flujo' },
                { icon: 'psychology', label: 'Mapa Mental' },
                { icon: 'sync', label: 'Ciclo' },
                { icon: 'schema', label: 'Jerarquía' }
            ].map((item) => (
                <button
                    key={item.label}
                    onClick={() => item.label === 'Automático' ? handleBoltClick({ stopPropagation: () => {} } as any) : handleContextOptionClick(item.label)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left group"
                >
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                        <span className="material-symbols-outlined text-sm">{item.icon}</span>
                    </div>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                </button>
            ))}
        </div>
      )}

      {/* Export Modal */}
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
};
