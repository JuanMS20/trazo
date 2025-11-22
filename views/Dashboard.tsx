import React from 'react';
import { ViewState, Note } from '../types';
import { OrganicButton } from '../components/OrganicButton';
import { OrganicCard } from '../components/OrganicCard';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
}

const SAMPLE_NOTES: Note[] = [
  { id: '1', title: 'Project Phoenix Ideas', type: 'Diagram', icon: 'schema' },
  { id: '2', title: 'Q3 Marketing Strategy', type: 'Diagram', icon: 'hub' },
  { id: '3', title: 'Recipe for Sourdough', type: 'Text', icon: 'article' },
  { id: '4', title: 'Vacation Planning', type: 'List', icon: 'checklist' },
  { id: '5', title: 'Weekly Journal', type: 'Text', icon: 'edit_note' },
  { id: '6', title: 'App User Flow', type: 'Flowchart', icon: 'account_tree' },
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="flex h-screen w-full bg-cream text-off-black font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 flex flex-col items-center border-r border-dashed border-off-black/10 py-6 bg-white/50">
        <div className="mb-10 flex flex-col items-center gap-1">
            <div className="flex size-10 items-center justify-center rounded-full bg-off-black text-white">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 700" }}>draw</span>
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase mt-1">Trazo</span>
        </div>
        
        <nav className="flex flex-col gap-8 w-full">
            <button className="group relative flex flex-col items-center justify-center gap-1 w-full text-off-black">
                 <span className="absolute inset-0 -z-10 flex justify-center items-center opacity-50">
                     <svg width="50" height="50" viewBox="0 0 100 100" className="text-primary fill-current opacity-20 scale-150">
                        <path d="M50 10 C 80 10, 90 40, 90 50 C 90 80, 60 90, 50 90 C 20 90, 10 60, 10 50 C 10 20, 30 10, 50 10" />
                     </svg>
                 </span>
                <span className="material-symbols-outlined text-3xl">home</span>
                <span className="text-[10px] font-bold">Home</span>
            </button>
            
            <button className="flex flex-col items-center gap-1 text-off-black/40 hover:text-off-black transition-colors">
                <span className="material-symbols-outlined text-3xl">star</span>
                <span className="text-[10px] font-bold">Favorites</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-off-black/40 hover:text-off-black transition-colors">
                <span className="material-symbols-outlined text-3xl">delete</span>
                <span className="text-[10px] font-bold">Trash</span>
            </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-handwritten text-5xl font-bold relative">
              My Trazos
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" className="opacity-40" />
              </svg>
            </h1>
            <OrganicButton 
                onClick={() => onNavigate(ViewState.LOADING)}
                className="px-6 h-12 text-lg"
            >
                Nuevo Trazo
            </OrganicButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {SAMPLE_NOTES.map((note) => (
              <OrganicCard key={note.id} note={note} onClick={() => onNavigate(ViewState.WORKSPACE)} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};