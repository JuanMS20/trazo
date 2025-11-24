import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { EditorPage } from './features/editor/pages/EditorPage';
import { NoteProvider } from './core/context/NoteContext';

export default function App() {
  return (
    <NoteProvider>
      <BrowserRouter>
        <main className="w-full h-screen text-off-black">
          <Routes>
            <Route path="/" element={<LoginPage onNavigate={() => {}} />} />
            {/* Note: onNavigate prop is deprecated with router, but component expects it. We will fix component next. */}
            <Route path="/login" element={<LoginPage onNavigate={() => {}} />} />
            <Route path="/dashboard" element={<DashboardPage onNavigate={() => {}} />} />
            <Route path="/editor" element={<EditorPage onNavigate={() => {}} />} />
            <Route path="/editor/:id" element={<EditorPage onNavigate={() => {}} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </NoteProvider>
  );
}
