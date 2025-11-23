import React from 'react';
import { motion } from 'framer-motion';

interface SuggestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: string) => void;
  activeType?: string;
}

// Abstract Thumbnails using SVGs
const Thumbnails = {
  flowchart: (
    <svg viewBox="0 0 100 60" className="w-full h-full text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="10" y="20" width="20" height="20" rx="2" />
      <path d="M30 30 H 45" />
      <circle cx="55" cy="30" r="10" />
      <path d="M65 30 H 80" />
      <rect x="80" y="20" width="15" height="20" rx="2" />
    </svg>
  ),
  cycle: (
    <svg viewBox="0 0 100 60" className="w-full h-full text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="50" cy="30" r="20" strokeDasharray="4 4" />
      <circle cx="50" cy="10" r="6" fill="currentColor" />
      <circle cx="70" cy="30" r="6" fill="currentColor" />
      <circle cx="50" cy="50" r="6" fill="currentColor" />
      <circle cx="30" cy="30" r="6" fill="currentColor" />
    </svg>
  ),
  hierarchy: (
    <svg viewBox="0 0 100 60" className="w-full h-full text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="40" y="5" width="20" height="10" rx="2" />
      <path d="M50 15 V 25" />
      <path d="M25 25 H 75" />
      <path d="M25 25 V 35" />
      <path d="M75 25 V 35" />
      <rect x="15" y="35" width="20" height="10" rx="2" />
      <rect x="65" y="35" width="20" height="10" rx="2" />
    </svg>
  ),
  infographic: (
    <svg viewBox="0 0 100 60" className="w-full h-full text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="50" cy="50" r="15" />
      <path d="M50 35 Q 20 30 20 15" />
      <path d="M50 35 Q 80 30 80 15" />
      <circle cx="20" cy="15" r="8" />
      <circle cx="80" cy="15" r="8" />
    </svg>
  ),
  comparison: (
    <svg viewBox="0 0 100 60" className="w-full h-full text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="15" y="10" width="30" height="40" rx="2" />
      <rect x="55" y="10" width="30" height="40" rx="2" />
      <path d="M50 20 V 40" strokeDasharray="2 2" />
    </svg>
  ),
  timeline: (
    <svg viewBox="0 0 100 60" className="w-full h-full text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="10" y1="30" x2="90" y2="30" />
        <circle cx="20" cy="30" r="4" fill="currentColor"/>
        <circle cx="50" cy="30" r="4" fill="currentColor"/>
        <circle cx="80" cy="30" r="4" fill="currentColor"/>
        <rect x="15" y="10" width="10" height="5" rx="1" opacity="0.5"/>
        <rect x="45" y="45" width="10" height="5" rx="1" opacity="0.5"/>
        <rect x="75" y="10" width="10" height="5" rx="1" opacity="0.5"/>
    </svg>
  )
};

const OPTIONS = [
  { id: 'flowchart', label: 'Flow', icon: Thumbnails.flowchart },
  { id: 'cycle', label: 'Cycle', icon: Thumbnails.cycle },
  { id: 'hierarchy', label: 'Tree', icon: Thumbnails.hierarchy },
  { id: 'comparison', label: 'Compare', icon: Thumbnails.comparison },
  { id: 'infographic', label: 'Infographic', icon: Thumbnails.infographic },
  { id: 'timeline', label: 'Timeline', icon: Thumbnails.timeline }, // Placeholder logic for timeline?
];

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ isOpen, onClose, onSelectType, activeType }) => {
  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: isOpen ? 0 : -320, opacity: isOpen ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-16 left-4 bottom-4 w-72 bg-[#212121] text-white rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden border border-white/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#2a2a2a]">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary animate-pulse">bolt</span>
            <h3 className="font-bold text-sm uppercase tracking-wider">AI Suggestions</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
            <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
            {OPTIONS.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => onSelectType(opt.id)}
                    className={`group relative flex flex-col gap-2 p-2 rounded-lg border transition-all ${
                        activeType === opt.id
                        ? 'bg-white/10 border-primary ring-1 ring-primary'
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                    <div className="aspect-video bg-black/20 rounded overflow-hidden p-2">
                        {opt.icon}
                    </div>
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white text-left pl-1">
                        {opt.label}
                    </span>
                </button>
            ))}
        </div>

        <div className="mt-6">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 px-1">Recent Styles</h4>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex-shrink-0 w-16 h-12 bg-white/5 rounded border border-white/5"></div>
                ))}
            </div>
        </div>
      </div>
    </motion.div>
  );
};
