import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, X, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

const TelegramOnboarding = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Debug log to see user state
    console.log('TWA Onboarding Check:', { 
      hasTelegramId: !!user?.telegramId, 
      hasEmail: !!user?.email,
      userId: user?.id 
    });

    if (user?.telegramId && (!user?.email || user.email === '')) {
      const storageKey = `tg_onboarding_shown_${user.id}`;
      const shown = localStorage.getItem(storageKey);
      
      if (!shown && user.id) {
        const timer = setTimeout(() => {
          console.log('Showing TWA Onboarding Modal');
          setShow(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleDismiss = () => {
    setShow(false);
    if (user?.id) {
      localStorage.setItem(`tg_onboarding_shown_${user.id}`, 'true');
    }
  };

  const handleGoToSettings = () => {
    handleDismiss();
    navigate('/profile');
  };

  return (
    <AnimatePresence>
      {show && (
        <Modal 
          isOpen={show} 
          onClose={handleDismiss}
          title="Welcome to Focus"
        >
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-apple-blue/10 rounded-3xl flex items-center justify-center">
                <Shield size={32} className="text-apple-blue" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white">Secure Your Account</h3>
                <p className="text-[#86868B] dark:text-[#A1A1AA] text-[15px] leading-relaxed">
                  To access Focus from a mobile or PC browser, please link an email and password to your profile.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05]">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                  <Mail size={20} className="text-apple-blue" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-[14px] dark:text-white">Email Address</p>
                  <p className="text-[12px] text-[#86868B] dark:text-[#A1A1AA]">For multi-device login</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05]">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                  <Lock size={20} className="text-apple-green" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-[14px] dark:text-white">Security Password</p>
                  <p className="text-[12px] text-[#86868B] dark:text-[#A1A1AA]">Keep your tasks private</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoToSettings}
                className="w-full h-14 bg-apple-blue text-white rounded-2xl font-bold text-[16px] shadow-lg shadow-apple-blue/20 flex items-center justify-center gap-2"
              >
                Go to Settings
                <ArrowRight size={18} />
              </motion.button>
              <button 
                onClick={handleDismiss}
                className="w-full h-12 text-[#86868B] dark:text-[#A1A1AA] font-bold text-[14px] hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default TelegramOnboarding;
