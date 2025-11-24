import React, { useState } from 'react';
import { OrganicButton } from '../../../shared/components/ui/OrganicButton';
import { toPng, toSvg } from 'html-to-image';
import download from 'downloadjs';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRef: React.RefObject<HTMLElement>;
}

type Format = 'PNG' | 'SVG';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, targetRef }) => {
  const [selectedFormat, setSelectedFormat] = useState<Format>('PNG');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!targetRef.current) {
        alert("Error: No se encontró el lienzo para exportar.");
        return;
    }

    setIsExporting(true);

    try {
        // Filter out UI elements that shouldn't be in the image (like toolbar)
        const filter = (node: HTMLElement) => {
            const exclusionClasses = ['z-20', 'shadow-xl']; // Heuristic to exclude floating toolbar if it has these classes
            // Better approach: rely on specific class or ID if possible, but for now:
            // If the node contains "pan_tool" icon, exclude it.
            if (node.innerText && (node.innerText.includes('pan_tool') || node.innerText.includes('edit'))) {
                // Check if it's a button
                if (node.tagName === 'BUTTON' || node.parentElement?.tagName === 'BUTTON') return false;
            }
            return true;
        };

        if (selectedFormat === 'PNG') {
            const dataUrl = await toPng(targetRef.current, { backgroundColor: '#FDFBF7' });
            download(dataUrl, 'trazo-diagram.png');
        } else {
            // SVG export simulation (html-to-image produces SVG wrapped HTML, roughjs produces SVGs internally)
            // For true SVG vector export we would need to extract the inner SVGs.
            // But html-to-image toSvg gives an SVG image of the DOM.
            const dataUrl = await toSvg(targetRef.current, { backgroundColor: '#FDFBF7' });
            download(dataUrl, 'trazo-diagram.svg');
        }
        onClose();
    } catch (error) {
        console.error("Export failed", error);
        alert("Hubo un error al exportar la imagen.");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-white border-2 border-off-black shadow-offset-hard rounded-xl p-6 animate-[scaleIn_0.2s_ease-out]">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-off-black transition-colors"
        >
            <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="font-grotesk text-2xl font-bold text-center mb-6">Lleva tu Trazo contigo</h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
            <button
                onClick={() => setSelectedFormat('PNG')}
                className={`flex flex-col items-center justify-center gap-3 p-4 border-2 rounded-lg transition-all focus:outline-none ${selectedFormat === 'PNG' ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-gray-200 hover:border-primary hover:bg-primary/5'}`}
            >
                <span className="material-symbols-outlined text-4xl">image</span>
                <span className="text-sm font-bold">Imagen (PNG)</span>
            </button>
            
            <button
                onClick={() => setSelectedFormat('SVG')}
                className={`relative flex flex-col items-center justify-center gap-3 p-4 border-2 rounded-lg transition-all focus:outline-none ${selectedFormat === 'SVG' ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-gray-200 hover:border-primary hover:bg-primary/5'}`}
            >
                <span className="material-symbols-outlined text-4xl">gesture</span>
                <span className="text-sm font-bold">Vector (SVG)</span>
            </button>
        </div>

        <OrganicButton
            className="w-full h-12 text-lg flex items-center justify-center gap-2"
            onClick={handleDownload}
            disabled={isExporting}
        >
            {isExporting ? (
                <>
                    <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                    Exportando...
                </>
            ) : 'Descargar'}
        </OrganicButton>
      </div>
    </div>
  );
};
