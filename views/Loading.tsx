import React, { useEffect } from 'react';
import { ViewState } from '../types';

interface LoadingProps {
  onNavigate: (view: ViewState) => void;
}

export const Loading: React.FC<LoadingProps> = ({ onNavigate }) => {
  
  // Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      onNavigate(ViewState.WORKSPACE);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onNavigate]);

  return (
    <div className="flex h-screen w-full bg-background-dark text-white overflow-hidden">
      {/* Sidebar Placeholder (Dimmed) */}
      <aside className="w-64 flex flex-col p-4 border-r border-white/10 bg-background-dark opacity-30 pointer-events-none">
        <div className="flex items-center gap-3 mb-8">
           <div className="size-10 rounded-full bg-gray-700"></div>
           <div className="flex flex-col gap-1">
             <div className="w-24 h-4 bg-gray-700 rounded"></div>
             <div className="w-16 h-3 bg-gray-700 rounded"></div>
           </div>
        </div>
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
             <div key={i} className="w-full h-10 bg-gray-700/50 rounded-lg"></div>
          ))}
        </div>
      </aside>

      {/* Main Content - Animation */}
      <main className="flex-1 flex flex-col items-center justify-center relative">
        {/* Dotted background */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#888 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Animation Placeholder - Using SVG to simulate the pencil spiral */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200" className="animate-[spin_10s_linear_infinite]">
               <path 
                  d="M100 100 m 0 0 l 0 0 a 5 5 0 0 1 5 5 a 10 10 0 0 1 -10 10 a 20 20 0 0 1 -20 -20 a 30 30 0 0 1 30 -30 a 40 40 0 0 1 40 40 a 50 50 0 0 1 -50 50 a 60 60 0 0 1 -60 -60"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  className="opacity-50"
               />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
               {/* Pencil Icon */}
               <span className="material-symbols-outlined text-6xl text-primary animate-bounce">edit</span>
            </div>
          </div>

          <div className="text-center">
             <h2 className="font-handwritten text-4xl font-bold mb-4">Bosquejando tus ideas...</h2>
             {/* Wavy Progress Bar */}
             <div className="w-64 h-4 relative overflow-hidden rounded-full bg-white/10">
               <div className="absolute top-0 left-0 h-full w-1/2 bg-primary animate-[slide_2s_ease-in-out_infinite]"></div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};