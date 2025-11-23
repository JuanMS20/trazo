import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { BubbleMenu } from '@tiptap/react/menus';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { Editor } from '@tiptap/core';
import { DiagramExtension } from '../extensions/DiagramExtension';
import { ViewState, DiagramData } from '../types';
import { AiAgent } from '../utils/aiAgent';
import { SuggestionsPanel } from '../components/SuggestionsPanel';
import { GenerationLoader } from '../components/GenerationLoader';

// Floating Menu Component
const FloatingMenu = ({ editor, onGenerate }: { editor: Editor, onGenerate: () => void }) => {
    return (
        <BubbleMenu editor={editor} shouldShow={({ editor }) => !editor.state.selection.empty && !editor.isActive('diagram')}>
             <button
                 onClick={onGenerate}
                 className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-primary shadow-lg hover:scale-110 transition-transform border border-gray-700"
                 title="Generar Visual"
             >
                 <span className="material-symbols-outlined text-xl">bolt</span>
             </button>
        </BubbleMenu>
    )
}

interface WorkspaceProps {
  onNavigate: (view: ViewState) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ onNavigate }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');

  // State for the currently selected diagram to control via SuggestionsPanel
  const [selectedDiagram, setSelectedDiagram] = useState<{ nodePos: number, data: DiagramData } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Empieza a escribir tu historia... Selecciona texto y haz clic en la estrella para visualizar.',
      }),
      DiagramExtension,
      BubbleMenuExtension,
    ],
    content: localStorage.getItem('trazo_editor_content') || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none max-w-none font-serif',
      },
    },
    onUpdate: ({ editor }) => {
      localStorage.setItem('trazo_editor_content', editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
       const { from, to } = editor.state.selection;

       // Check if a diagram is selected
       let diagramFound = false;
       editor.state.doc.nodesBetween(from, to, (node, pos) => {
           if (node.type.name === 'diagram') {
               setSelectedDiagram({ nodePos: pos, data: node.attrs.data });
               diagramFound = true;
               setShowSuggestions(true); // Auto-open suggestions when diagram selected? Or maybe just enable it.
               return false; // Stop iteration
           }
       });

       if (!diagramFound) {
           setSelectedDiagram(null);
       }
    }
  });

  const runAgentPipeline = async (text: string, forceType?: string) => {
    if (!editor) return;

    setIsProcessing(true);
    setProcessStep(forceType ? `Generando ${forceType}...` : "Iniciando Agentes...");

    try {
        if (!forceType) setShowSuggestions(false); // Hide during generation unless modifying

        const result = await AiAgent.analyzeAndGenerate(text, (step) => {
            setProcessStep(step);
        }, forceType);

        const finalData = {
            ...result,
            type: result.type as any || 'flowchart',
            sourceText: text // Persist original source text
        };

        if (selectedDiagram && forceType) {
            // If we are modifying an existing diagram (e.g. changing type via SuggestionsPanel)
            editor.chain().focus().setNodeSelection(selectedDiagram.nodePos).updateAttributes('diagram', { data: finalData }).run();
        } else {
            // New diagram insertion
            // Insert after current selection or at cursor
             editor.chain().focus().insertContent({
                 type: 'diagram',
                 attrs: { data: finalData }
             }).run();
        }

    } catch (error) {
        console.error("Agent Error:", error);
        alert("Error al generar el diagrama. Intenta de nuevo.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleBoltClick = () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    let text = "";

    if (empty) {
        // If empty, grab current paragraph?
        // editor.state.doc.textBetween(from, to) is empty.
        // Let's try to get the node at cursor
        const node = editor.state.doc.nodeAt(from);
        if (node && node.text) {
             text = node.text;
        } else {
            // Try getting the surrounding text block
            const range = editor.chain().focus().setTextSelection({ from, to }).run();
            // This is complex in Tiptap.
            // Simple fallback: if empty, alert user or grab previous paragraph
             alert("Selecciona un texto para visualizar.");
             return;
        }
    } else {
        text = editor.state.doc.textBetween(from, to, ' ');
    }

    runAgentPipeline(text);
  };

  // Listen to suggestions panel updates
  const handleSuggestionSelect = (type: string) => {
      // If a diagram is selected, re-run generation/layout on it with new type
      // But wait, re-running AI might change content. Does the user want just layout change or content regen?
      // "Suggestions Panel" usually implies style/layout.
      // If I re-run AI with `forceType`, it might regenerate content.
      // Ideally, we just re-layout. But `AiAgent` currently does both.
      // For now, let's assume we re-run pipeline with the text from the diagram?
      // Or if `selectedDiagram` has nodes, maybe we can just re-layout them?
      // The current `AiAgent` `analyzeAndGenerate` calls `layoutDiagram`.
      // Let's use `runAgentPipeline` with `forceType` for now. It will regen content which is okay for a prototype
      // or we can extract text from nodes.

      // Better approach for "Changing Type":
      // If we have text selected, we generate new.
      // If we have a diagram selected, we might want to preserve content.
      // But `AiAgent` generates structure based on text.
      // Let's assume re-generation for now as it's safer for "Infographic" vs "Flowchart" logic which differs in structure.

      if (selectedDiagram) {
           // Use persisted source text if available, otherwise reconstruct from nodes
           const text = selectedDiagram.data.sourceText || selectedDiagram.data.nodes.map(n => n.text).join(". ") || "Texto no disponible";
           runAgentPipeline(text, type);
      } else {
          // No diagram selected, maybe text selected?
           const { from, to, empty } = editor.state.selection;
           if (!empty) {
               const text = editor.state.doc.textBetween(from, to, ' ');
               runAgentPipeline(text, type);
           }
      }
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

            <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${showSuggestions ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'hover:bg-gray-100 text-gray-600'}`}
                title="AI Suggestions"
            >
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span className="text-sm font-medium hidden md:inline">Visuals</span>
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar: Suggestions */}
        <SuggestionsPanel
            isOpen={showSuggestions}
            onClose={() => setShowSuggestions(false)}
            activeType={selectedDiagram?.data.type}
            onSelectType={handleSuggestionSelect}
        />

        {/* Main Editor Area - Centered */}
        <div className="flex-1 overflow-y-auto bg-[#FDFBF7] relative flex justify-center">
            <div className="w-full max-w-[900px] bg-white min-h-screen shadow-sm my-8 px-12 py-12 relative">

                 {/* Custom Floating Menu for Text Selection */}
                 {editor && (
                     <FloatingMenu editor={editor} onGenerate={handleBoltClick} />
                 )}

                {isProcessing && (
                    <div className="absolute top-0 left-0 w-full h-full bg-white/80 z-40 flex items-center justify-center backdrop-blur-sm">
                         <GenerationLoader step={processStep} />
                    </div>
                )}

                <EditorContent editor={editor} className="h-full" />
            </div>
        </div>
      </div>
    </div>
  );
};
