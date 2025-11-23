import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Note } from '../types';

interface NoteContextType {
  notes: Note[];
  toggleFavorite: (id: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  deletePermanently: (id: string) => void;
  addNote: (note: Note) => void;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

const INITIAL_NOTES: Note[] = [
  { id: '1', title: 'Project Phoenix Ideas', type: 'Diagram', icon: 'schema', isFavorite: true },
  { id: '2', title: 'Q3 Marketing Strategy', type: 'Diagram', icon: 'hub', isFavorite: false },
  { id: '3', title: 'Recipe for Sourdough', type: 'Text', icon: 'article', isFavorite: false },
  { id: '4', title: 'Vacation Planning', type: 'List', icon: 'checklist', isFavorite: false },
  { id: '5', title: 'Weekly Journal', type: 'Text', icon: 'edit_note', isFavorite: false, isDeleted: true }, // In trash
  { id: '6', title: 'App User Flow', type: 'Flowchart', icon: 'account_tree', isFavorite: true },
];

export const NoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);

  const toggleFavorite = (id: string) => {
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, isFavorite: !note.isFavorite } : note
    ));
  };

  const moveToTrash = (id: string) => {
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, isDeleted: true } : note
    ));
  };

  const restoreFromTrash = (id: string) => {
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, isDeleted: false } : note
    ));
  };

  const deletePermanently = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const addNote = (note: Note) => {
    setNotes(prev => [note, ...prev]);
  };

  return (
    <NoteContext.Provider value={{ notes, toggleFavorite, moveToTrash, restoreFromTrash, deletePermanently, addNote }}>
      {children}
    </NoteContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
};
