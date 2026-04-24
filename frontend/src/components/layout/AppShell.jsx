import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User, CheckCircle2, LayoutDashboard, ListTodo, Trash2, UserCircle, Settings, Sun, Moon } from 'lucide-react';
import Button from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarUrl } from '../../utils/avatarHelper';

const AppShell = () => {
  const { user, logout, theme, toggleTheme } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/' },
    { id: 'tasks', label: 'Tasks', icon: ListTodo, path: '/tasks' },
    { id: 'trash', label: 'Trash', icon: Trash2, path: '/trash' },
    { id: 'profile', label: 'Settings', icon: Settings, path: '/profile' },
  ];

  return (
    <div className="min-h-screen flex bg-[#F5F5F7] dark:bg-[#0A0A0B] transition-colors duration-500">
      
      {/* Smart Responsive Sidebar (Left) */}
      <aside className="hidden md:flex flex-col items-center lg:items-stretch md:w-20 lg:w-72 h-screen sticky top-0 bg-white dark:bg-[#1C1C1E] border-r border-black/[0.05] dark:border-[#2C2C2E] py-8 pb-6 z-[100] transition-all duration-300 px-2 flex-shrink-0">
        
        {/* Top Section (Logo + Nav) */}
        <div className="flex-1 flex flex-col items-center lg:items-stretch w-full">
          <div className="flex items-center justify-between mb-10 px-2 lg:px-4 w-full">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 cursor-pointer mx-auto lg:mx-0"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#0051A8] flex items-center justify-center shadow-lg shadow-apple-blue/20 flex-shrink-0">
                <CheckCircle2 size={22} color="white" strokeWidth={2.5} />
              </div>
              <span className="hidden lg:block font-bold text-[20px] tracking-tight text-[#1D1D1F] dark:text-white">Focus</span>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="hidden lg:flex w-9 h-9 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-all duration-200 focus:outline-none"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? (
                    <Sun size={20} strokeWidth={2} className="text-orange-400" />
                  ) : (
                    <Moon size={20} strokeWidth={2} className="text-blue-600" />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>

          <nav className="space-y-2 w-full flex flex-col items-center lg:items-stretch">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`sidebar-link w-12 lg:w-full h-12 lg:h-[50px] flex items-center justify-center lg:justify-start gap-3 lg:px-4 transition-all group relative focus:outline-none ${
                    isActive 
                      ? 'sidebar-link-active text-apple-blue dark:text-white sidebar-glow' 
                      : 'text-[#86868B] dark:text-[#A1A1AA] hover:bg-black/[0.03] dark:hover:bg-white/10 hover:text-[#1D1D1F] dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-apple-blue/5 dark:bg-white/5 rounded-xl lg:rounded-2xl border border-apple-blue/10 dark:border-white/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon size={20} className="relative z-10 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="hidden lg:block text-[15px] font-semibold relative z-10 truncate">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section (Compact Lock) */}
        <div className="flex flex-col gap-3 pt-6 border-t border-black/5 dark:border-[#2C2C2E] px-2 w-full items-center lg:items-stretch">
          <motion.div 
            whileHover={{ scale: 1.02, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }}
            onClick={() => navigate('/profile')}
            className="profile-card w-12 h-12 lg:w-full lg:h-[50px] flex items-center justify-center lg:justify-start gap-3 lg:px-4 bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm transition-all cursor-pointer overflow-hidden rounded-[12px] lg:rounded-2xl flex-shrink-0"
          >
             <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5 aspect-square transition-all duration-200">
                {getAvatarUrl(user?.avatar) ? (
                  <img 
                    src={getAvatarUrl(user?.avatar)} 
                    alt="Avatar" 
                    className="w-full h-full object-cover flex-shrink-0" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/5 dark:bg-white/10 group-hover:bg-black/10 dark:group-hover:bg-white/20 transition-all duration-200">
                    <User size={20} strokeWidth={2} className="text-blue-600 dark:text-slate-400 flex-shrink-0" />
                  </div>
                )}
             </div>
             <div className="hidden lg:block flex-1 overflow-hidden">
                <p className="text-[15px] font-semibold text-[#1D1D1F] dark:text-white truncate">
                  {user?.name || 'Focus User'}
                </p>
             </div>
          </motion.div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout} 
            className="btn-destructive-lock profile-card w-12 h-12 lg:w-full lg:h-[50px] flex items-center justify-center lg:justify-start gap-3 lg:px-4 transition-all font-bold focus:outline-none rounded-xl lg:rounded-2xl flex-shrink-0"
          >
            <LogOut size={20} strokeWidth={2.5} className="flex-shrink-0" />
            <span className="hidden lg:block text-[15px] truncate">Sign Out</span>
          </motion.button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-50 h-[64px] flex items-center justify-between px-5 sm:px-8 bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-black/5 dark:border-[#2C2C2E] transition-colors duration-300">
          <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => navigate('/')}>
            <div className="bento-icon-box bg-gradient-to-br from-[#007AFF] to-[#0051A8] shadow-lg shadow-apple-blue/20 !border-none shrink-0">
              <CheckCircle2 size={20} color="white" strokeWidth={2.5} />
            </div>
            <span className="block font-bold text-[17px] sm:text-[19px] tracking-tight text-[#1D1D1F] dark:text-white truncate max-w-[120px] sm:max-w-none">Focus</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle: Absolute Set Parity */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="bento-icon-box focus:outline-none"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? (
                    <Sun size={20} strokeWidth={2} className="text-orange-400" />
                  ) : (
                    <Moon size={20} strokeWidth={2} className="text-blue-600" />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {/* Profile Button: Absolute Set Parity */}
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')} 
              className="bento-icon-box focus:outline-none group"
            >
              {getAvatarUrl(user?.avatar) ? (
                <img 
                  src={getAvatarUrl(user?.avatar)} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User size={20} strokeWidth={2} className="text-blue-600 dark:text-slate-400" />
              )}
            </motion.button>

            {/* Logout Button: Absolute Set Parity */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bento-icon-box focus:outline-none !bg-red-500/10 dark:!bg-red-500/20 !border-red-500/20"
            >
              <LogOut size={20} strokeWidth={2} className="text-red-500" />
            </motion.button>
          </div>
        </header>

        {/* Main Content Area - Fluid Spacing */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-5 sm:px-8 pb-32 md:pb-12 pt-6 md:pt-8">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[420px] h-[72px] bg-white dark:bg-[#1C1C1E] backdrop-blur-xl border border-white/20 dark:border-[#2C2C2E] rounded-[24px] p-2 flex items-center justify-around shadow-[0_15px_40px_rgba(0,0,0,0.12)] transition-colors duration-300">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center w-14 h-14 transition-all nav-item focus:outline-none"
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-glow"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-apple-blue/[0.08] dark:bg-white/5 sidebar-link-active"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                    />
                  )}
                </AnimatePresence>
                <item.icon 
                  size={22} 
                  className={`transition-colors duration-300 relative z-10 ${isActive ? 'text-apple-blue dark:text-white' : 'text-[#86868B] dark:text-[#A1A1AA]'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] font-bold mt-1 transition-colors duration-300 relative z-10 ${isActive ? 'text-apple-blue dark:text-white' : 'text-[#86868B] dark:text-[#A1A1AA]'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppShell;
