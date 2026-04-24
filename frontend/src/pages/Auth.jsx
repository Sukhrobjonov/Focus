import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import BentoCard from '../components/bento/BentoCard';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore(state => state.setAuth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, formData);
      setAuth(data.data.user, data.data.token);
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError?.errors) {
        setError(apiError.errors.map(e => e.message).join('. '));
      } else {
        setError(apiError?.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = async () => {
    if (!window.Telegram?.WebApp?.initData) return;
    
    setLoading(true);
    setError('');
    try {
      const initData = window.Telegram.WebApp.initData;
      const urlParams = new URLSearchParams(initData);
      const tgUser = JSON.parse(urlParams.get('user'));
      
      const { data } = await api.post('/auth/telegram', { tgUser });
      setAuth(data.data.user, data.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Telegram login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-[#0A0A0B] p-6 selection:bg-blue-500/30 transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        {/* Main Bento Card */}
        <div className="glass-card rounded-[40px] p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] flex flex-col gap-10">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center space-y-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-3xl bg-[#007AFF] flex items-center justify-center shadow-xl shadow-blue-500/20"
            >
              <CheckCircle2 size={40} color="white" strokeWidth={2.5} />
            </motion.div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                {isLogin ? 'Focus' : 'Join Focus'}
              </h1>
              <p className="text-[#86868B] dark:text-[#A1A1AA] text-[15px] font-medium leading-relaxed">
                {isLogin 
                  ? 'Sign in to your sanctuary.' 
                  : 'The journey to organized living starts here.'}
              </p>
            </div>
          </div>

          {/* Input Fields */}
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input 
                    label="Full Name" 
                    placeholder="Steve Jobs" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input 
              label="Email" 
              type="email" 
              placeholder="name@apple.com" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
            
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
            />

            {error && (
              <p className="text-[13px] font-semibold text-red-500 text-center animate-shake">
                {error}
              </p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 h-[58px] bg-[#007AFF] text-white rounded-2xl font-bold text-[17px] shadow-lg shadow-blue-500/20 hover:bg-[#0071E3] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          {/* Telegram Login Option */}
          {window.Telegram?.WebApp?.initData && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-[1px] bg-black/5 dark:bg-white/5" />
                <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">or</span>
                <div className="flex-1 h-[1px] bg-black/5 dark:bg-white/5" />
              </div>
              <button 
                onClick={handleTelegramLogin}
                className="w-full h-[58px] bg-[#229ED9] text-white rounded-2xl font-bold text-[17px] shadow-lg shadow-blue-500/10 hover:bg-[#1E8EC4] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 10.38 15.84 14.18 15.51 15.96C15.37 16.71 15.09 16.96 14.82 16.99C14.24 17.04 13.8 16.6 13.24 16.23C12.36 15.65 11.86 15.29 11.01 14.73C10.02 14.08 10.66 13.72 11.23 13.13C11.38 12.98 13.94 10.65 13.99 10.44C14 10.41 14 10.3 13.94 10.24C13.88 10.18 13.79 10.21 13.72 10.22C13.63 10.24 12.23 11.16 9.51 13C9.11 13.27 8.75 13.4 8.43 13.39C8.08 13.38 7.4 13.19 6.89 13.03C6.27 12.83 5.77 12.72 5.81 12.38C5.83 12.2 6.08 12.02 6.56 11.83C9.52 10.54 11.49 9.69 12.48 9.28C15.3 8.11 15.89 7.9 16.27 7.9C16.35 7.9 16.54 7.92 16.66 8.02C16.76 8.1 16.79 8.21 16.8 8.29C16.81 8.37 16.82 8.56 16.64 8.8Z" fill="white"/>
                </svg>
                Continue with Telegram
              </button>
            </div>
          )}

          {/* Toggle Button */}
          <div className="text-center pt-2">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[15px] font-semibold text-[#007AFF] hover:underline transition-all"
            >
              {isLogin ? "New here? Create an account" : "Have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Legal/Info Footer */}
        <p className="text-center mt-10 text-[#86868B] dark:text-[#A1A1AA]/50 text-[13px] font-medium opacity-60">
          Privacy is built in. Standard on Focus.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
