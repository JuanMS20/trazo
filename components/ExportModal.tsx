import React from 'react';
import { OrganicButton } from './OrganicButton';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
            <button className="flex flex-col items-center justify-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all focus:ring-2 focus:ring-primary focus:outline-none">
                <span className="material-symbols-outlined text-4xl">image</span>
                <span className="text-sm font-bold">Imagen (PNG)</span>
            </button>
            
            <button className="relative flex flex-col items-center justify-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all focus:ring-2 focus:ring-primary focus:outline-none">
                <div className="absolute top-2 right-2 bg-primary text-[10px] font-bold px-1.5 rounded text-off-black">PRO</div>
                <span className="material-symbols-outlined text-4xl">gesture</span>
                <span className="text-sm font-bold">Vector (SVG)</span>
            </button>
        </div>

        <OrganicButton className="w-full h-12 text-lg" onClick={onClose}>
            Descargar
        </OrganicButton>
      </div>
    </div>
  );
};