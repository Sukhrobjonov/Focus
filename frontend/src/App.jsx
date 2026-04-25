import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import Trash from './pages/Trash';
import NotFound from './pages/NotFound';
import AppShell from './components/layout/AppShell';
import { useAuthStore } from './store/authStore';
import TelegramOnboarding from './components/ui/TelegramOnboarding';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

function App() {
  const { user, initialized, checkAuth, initTheme } = useAuthStore();

  useEffect(() => {
    initTheme();
    checkAuth();
    
    // Telegram WebApp setup
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    // Auto-sync on window focus (switching back to tab)
    const handleFocus = () => {
      checkAuth();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkAuth, initTheme]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="w-12 h-12 rounded-full border-4 border-apple-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster 
        position="top-center" 
        expand={false}
        closeButton
        theme="system"
        className="apple-toast-container"
      />
      <Routes>
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
        
        <Route element={user ? <AppShell /> : <Navigate to="/auth" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/trash" element={<Trash />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {user && <TelegramOnboarding />}
    </Router>
  );
}

export default App;
