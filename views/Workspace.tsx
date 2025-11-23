import React, { useState, useRef, useEffect } from 'react';
import { ViewState, DiagramData } from '../types';
import { ExportModal } from '../components/ExportModal';
import { DiagramCanvas } from '../components/DiagramCanvas';
import { AiAgent } from '../utils/aiAgent';
import { GenerationLoader } from '../components/GenerationLoader';
import { SuggestionsPanel } from '../components/SuggestionsPanel';

interface WorkspaceProps {
  onNavigate: (view: ViewState) => void;
}

type ToolType = 'pan' | 'edit' | 'zoom';

export const Workspace: React.FC<WorkspaceProps> = ({ onNavigate }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [activeTool, setActiveTool] = useState<ToolType>('edit');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Agent state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');

  useEffect(() => {
    const savedContent = localStorage.getItem('trazo_editor_content');
    const savedDiagram = localStorage.getItem('trazo_diagram_data');

    if (savedContent) setEditorContent(savedContent);
    if (savedDiagram) {
        try {
            setDiagramData(JSON.parse(savedDiagram));
        } catch (e) {
            console.error("Failed to parse saved diagram", e);
        }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('trazo_editor_content', editorContent);
  }, [editorContent]);

  useEffect(() => {
    if (diagramData) {
        localStorage.setItem('trazo_diagram_data', JSON.stringify(diagramData));
    }
  }, [diagramData]);

  const handleSelection = (triggerEvent?: React.SyntheticEvent) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const text = textarea.value.substring(start, end);
      setSelectedText(text);

      let top = 0;
      let left = 0;

      if (triggerEvent && 'clientY' in triggerEvent.nativeEvent) {
          const mouseEvent = triggerEvent as React.MouseEvent;
          // Position context menu relative to viewport, but we handle it carefully
          // Since we are changing layout, let's keep it simple:
          // We will position it absolute to the window for now, or relative to the container.
          // However, the textarea is in a scrollable div.
          // Let's use the mouse position directly.
          top = mouseEvent.clientY;
          left = mouseEvent.clientX;
      } else {
          // If selected via keyboard, this is harder to get exact coords without extra libs.
          // Fallback to center or generic position?
          // For now, let's just not show the floating button on keyboard select to avoid glitches,
          // or show it near the mouse if available?
          // Actually, let's just skip it for now or assume mouse usage for this prototype feature.
          return;
      }

      setContextMenuPosition({ top, left });
      setShowContextMenu(true);
    } else {
        setShowContextMenu(false);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      handleSelection(e);
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
     // Optional: handle keyboard selection
  };

  const runAgentPipeline = async (text: string, forceType?: string) => {
    setIsProcessing(true);
    setShowContextMenu(false);
    setProcessStep(forceType ? `Generando ${forceType}...` : "Iniciando Agentes...");

    setDiagramData(null);

    try {
        // Ensure suggestions are open if we are generating
        if (!forceType && !showSuggestions) setShowSuggestions(true);

        const result = await AiAgent.analyzeAndGenerate(text, (step) => {
            setProcessStep(step);
        }, forceType);

        setDiagramData({
            ...result,
            type: result.type as any || 'flowchart'
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
      e.preventDefault(); // Prevent text deselection if possible
      runAgentPipeline(selectedText || editorContent || "Texto de ejemplo");
  };

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    if (tool === 'zoom') {
        setZoomLevel(prev => Math.min(prev + 0.1, 2));
        setTimeout(() => setActiveTool('edit'), 500);
    }
  };

  const handleNodeDrag = (id: string, x: number, y: number) => {
    setDiagramData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            nodes: prev.nodes.map(n => n.id === id ? { ...n, x, y } : n)
        };
    });
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background-light overflow-hidden text-slate-800">
      <header className="h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white z-20 shrink-0">
        <div className="flex items-center gap-4">
           <button onClick={() => onNavigate(ViewState.DASHBOARD)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
             <span className="material-symbols-outlined text-[20px]">grid_view</span>
           </button>
           <h2 className="font-serif text-xl font-medium text-gray-800">Untitled Document</h2>
        </div>
        
        <div className="flex gap-3 items-center">
             <div className="h-6 w-px bg-gray-300 mx-2"></div>

             {/* Toggle Suggestions */}
            <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${showSuggestions ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'hover:bg-gray-100 text-gray-600'}`}
                title="AI Suggestions"
            >
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span className="text-sm font-medium hidden md:inline">Visuals</span>
            </button>

            <button
                onClick={() => setIsExportModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white font-medium px-4 py-1.5 rounded-lg text-sm transition-colors shadow-sm"
            >
                Exportar
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar: Suggestions */}
        <SuggestionsPanel
            isOpen={showSuggestions}
            onClose={() => setShowSuggestions(false)}
            activeType={diagramData?.type}
            onSelectType={(type) => runAgentPipeline(selectedText || editorContent || "Texto de ejemplo", type)}
        />

        {/* Editor Column */}
        <div className="w-[400px] xl:w-[500px] bg-white h-full border-r border-gray-200 shadow-sm flex flex-col shrink-0 z-10 transition-all duration-300">
            <div className="flex-1 overflow-y-auto relative">
                <textarea
                    ref={textareaRef}
                    className="w-full h-full p-8 resize-none outline-none font-serif text-lg leading-relaxed text-gray-700 placeholder:text-gray-300 bg-transparent"
                    placeholder="Empieza a escribir tu historia..."
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    onMouseUp={handleMouseUp}
                    onKeyUp={handleKeyUp}
                />
            </div>

            {/* Status Bar for Editor */}
            <div className="h-8 border-t border-gray-100 px-4 flex items-center justify-between text-xs text-gray-400 bg-gray-50/50">
                <span>{editorContent.length} caracteres</span>
                <span>Guardado</span>
            </div>
        </div>

        {/* Canvas Column */}
        <div
            className="flex-1 bg-[#FDFBF7] relative overflow-hidden flex flex-col"
        >
            {/* Toolbar within Canvas Area */}
             <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-gray-200 shadow-sm rounded-full px-4 py-2 flex gap-4 z-20">
                <button
                    onClick={() => handleToolChange('pan')}
                    className={`p-1.5 rounded-full transition-colors ${activeTool === 'pan' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                    title="Mover lienzo"
                >
                    <span className="material-symbols-outlined text-[20px]">pan_tool</span>
                </button>
                <button
                    onClick={() => handleToolChange('edit')}
                    className={`p-1.5 rounded-full transition-colors ${activeTool === 'edit' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                    title="Seleccionar nodos"
                >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <div className="w-px bg-gray-300 h-6 self-center"></div>
                 <button
                    onClick={() => handleToolChange('zoom')}
                    className={`p-1.5 rounded-full transition-colors ${activeTool === 'zoom' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                    title="Zoom In"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
            </div>

            <div
                ref={canvasRef}
                className="flex-1 relative overflow-hidden"
                style={{ cursor: activeTool === 'pan' ? 'grab' : 'default' }}
            >
                {isProcessing && <GenerationLoader step={processStep} />}

                {/* Grid Background */}
                <div
                    className="absolute inset-0 transition-transform duration-200 pointer-events-none opacity-40"
                    style={{
                        backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        transform: `scale(${zoomLevel})`
                    }}
                ></div>

                <div className="absolute inset-0 w-full h-full">
                     <DiagramCanvas data={diagramData} onNodeDrag={handleNodeDrag} />
                </div>
            </div>
        </div>
      </div>

      {/* Floating Context Button - Improved Position Logic */}
      {showContextMenu && (
         <div
             className="fixed z-50 animate-bounce-in"
             style={{ top: contextMenuPosition.top - 50, left: contextMenuPosition.left - 20 }}
         >
              <button
                 onMouseDown={handleBoltClick} // Use onMouseDown to prevent focus loss on click
                 className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-primary shadow-lg hover:scale-110 transition-transform border border-gray-700"
                 title="Generar Visual"
             >
                 <span className="material-symbols-outlined text-xl">bolt</span>
             </button>
         </div>
       )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        targetRef={canvasRef}
      />
    </div>
  );
};
