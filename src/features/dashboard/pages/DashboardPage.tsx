import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrganicButton } from '../../../shared/components/ui/OrganicButton';
import { OrganicCard } from '../../../shared/components/ui/OrganicCard';
import { useNotes } from '../../../core/context/NoteContext';

interface DashboardProps {
  onNavigate?: any;
}

type FilterType = 'ALL' | 'FAVORITES' | 'TRASH';

export const DashboardPage: React.FC<DashboardProps> = () => {
  const navigate = useNavigate();
  const { notes } = useNotes();
  const [filter, setFilter] = useState<FilterType>('ALL');

  const filteredNotes = notes.filter(note => {
    if (filter === 'TRASH') return note.isDeleted;
    if (note.isDeleted) return false; // Don't show deleted notes in other views
    if (filter === 'FAVORITES') return note.isFavorite;
    return true;
  });

  const getTitle = () => {
    switch (filter) {
      case 'FAVORITES': return 'Favoritos';
      case 'TRASH': return 'Papelera';
      default: return 'Mis Trazos';
    }
  };

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
            <button
              onClick={() => setFilter('ALL')}
              className={`group relative flex flex-col items-center justify-center gap-1 w-full transition-colors ${filter === 'ALL' ? 'text-off-black' : 'text-off-black/40 hover:text-off-black'}`}
            >
                {filter === 'ALL' && (
                 <span className="absolute inset-0 -z-10 flex justify-center items-center opacity-50">
                     <svg width="50" height="50" viewBox="0 0 100 100" className="text-primary fill-current opacity-20 scale-150">
                        <path d="M50 10 C 80 10, 90 40, 90 50 C 90 80, 60 90, 50 90 C 20 90, 10 60, 10 50 C 10 20, 30 10, 50 10" />
                     </svg>
                 </span>
                )}
                <span className="material-symbols-outlined text-3xl">home</span>
                <span className="text-[10px] font-bold">Home</span>
            </button>
            
            <button
              onClick={() => setFilter('FAVORITES')}
              className={`group relative flex flex-col items-center justify-center gap-1 w-full transition-colors ${filter === 'FAVORITES' ? 'text-off-black' : 'text-off-black/40 hover:text-off-black'}`}
            >
                 {filter === 'FAVORITES' && (
                 <span className="absolute inset-0 -z-10 flex justify-center items-center opacity-50">
                     <svg width="50" height="50" viewBox="0 0 100 100" className="text-primary fill-current opacity-20 scale-150">
                        <path d="M50 10 C 80 10, 90 40, 90 50 C 90 80, 60 90, 50 90 C 20 90, 10 60, 10 50 C 10 20, 30 10, 50 10" />
                     </svg>
                 </span>
                )}
                <span className="material-symbols-outlined text-3xl">star</span>
                <span className="text-[10px] font-bold">Favorites</span>
            </button>

            <button
              onClick={() => setFilter('TRASH')}
              className={`group relative flex flex-col items-center justify-center gap-1 w-full transition-colors ${filter === 'TRASH' ? 'text-off-black' : 'text-off-black/40 hover:text-off-black'}`}
            >
                 {filter === 'TRASH' && (
                 <span className="absolute inset-0 -z-10 flex justify-center items-center opacity-50">
                     <svg width="50" height="50" viewBox="0 0 100 100" className="text-primary fill-current opacity-20 scale-150">
                        <path d="M50 10 C 80 10, 90 40, 90 50 C 90 80, 60 90, 50 90 C 20 90, 10 60, 10 50 C 10 20, 30 10, 50 10" />
                     </svg>
                 </span>
                )}
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
              {getTitle()}
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" className="opacity-40" />
              </svg>
            </h1>
            <OrganicButton 
                onClick={() => navigate('/editor')}
                className="px-6 h-12 text-lg"
            >
                Nuevo Trazo
            </OrganicButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                <OrganicCard key={note.id} note={note} onClick={() => navigate(`/editor/${note.id}`)} />
                ))
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                    <span className="material-symbols-outlined text-6xl mb-4">sentiment_dissatisfied</span>
                    <p className="font-handwritten text-2xl">No hay trazos aquí</p>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
