import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ContentProvider } from './content/ContentContext';
import './index.css';

const AdminApp = lazy(() => import('./admin/AdminApp.tsx'));

const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';

createRoot(document.getElementById('root')!).render(
  isAdmin ? (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0C]" />}>
      <AdminApp />
    </Suspense>
  ) : (
    <ContentProvider>
      <App />
    </ContentProvider>
  ),
);
