import React, { useState } from 'react';
import { ViewState } from './types';
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { Loading } from './views/Loading';
import { Workspace } from './views/Workspace';
import { NoteProvider } from './context/NoteContext';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);

  const renderView = () => {
    switch (currentView) {
      case ViewState.LOGIN:
        return <Login onNavigate={setCurrentView} />;
      case ViewState.DASHBOARD:
        return <Dashboard onNavigate={setCurrentView} />;
      case ViewState.LOADING:
        return <Loading onNavigate={setCurrentView} />;
      case ViewState.WORKSPACE:
        return <Workspace onNavigate={setCurrentView} />;
      default:
        return <Login onNavigate={setCurrentView} />;
    }
  };

  return (
    <NoteProvider>
      <main className="w-full h-screen text-off-black">
        {renderView()}
      </main>
    </NoteProvider>
  );
}