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
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] p-6 selection:bg-blue-500/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        {/* Main Bento Card */}
        <div className="glass-card rounded-[40px] p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] flex flex-col gap-10">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center space-y-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-3xl bg-[#007AFF] flex items-center justify-center shadow-xl shadow-blue-500/20"
            >
              <CheckCircle2 size={40} color="white" strokeWidth={2.5} />
            </motion.div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-[#1D1D1F]">
                {isLogin ? 'Focus' : 'Join Focus'}
              </h1>
              <p className="text-[#86868B] text-[15px] font-medium leading-relaxed">
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
        <p className="text-center mt-10 text-[#86868B] text-[13px] font-medium opacity-60">
          Privacy is built in. Standard on Focus.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
