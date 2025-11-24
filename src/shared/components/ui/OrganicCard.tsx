import React from 'react';
import { Note } from '../../types';

interface OrganicCardProps {
  note: Note;
  onClick: () => void;
}

export const OrganicCard: React.FC<OrganicCardProps> = ({ note, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-3 border-2 border-off-black/10 bg-white p-4 organic-radius shadow-offset-hard transition-transform duration-200 hover:-translate-y-1 hover:border-off-black"
    >
      <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-[inherit] bg-gray-50 group-hover:bg-primary/10 transition-colors">
        <svg className="absolute h-full w-full text-off-black/5" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,20 C 50,0 150,0 200,20" fill="transparent" stroke="currentColor" strokeWidth="2" />
          <path d="M 0,60 C 50,40 150,40 200,60" fill="transparent" stroke="currentColor" strokeWidth="2" />
          <path d="M 0,100 C 50,80 150,80 200,100" fill="transparent" stroke="currentColor" strokeWidth="2" />
          <path d="M 0,140 C 50,120 150,120 200,140" fill="transparent" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span className="material-symbols-outlined text-5xl text-off-black/20 group-hover:text-off-black/40 transition-colors">
          {note.icon}
        </span>
      </div>
      <div>
        <p className="font-handwritten text-xl font-bold text-off-black truncate">{note.title}</p>
        <p className="font-sans text-xs font-medium text-off-black/60 uppercase tracking-wider">{note.type}</p>
      </div>
    </div>
  );
};