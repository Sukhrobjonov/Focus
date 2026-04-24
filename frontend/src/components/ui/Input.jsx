import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Input = ({ label, error, type = 'text', className = '', shake = 0, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-[13px] font-semibold text-[#86868B] dark:text-[#A1A1AA] ml-1 tracking-tight">
          {label}
        </label>
      )}
      
      <motion.div 
        key={shake}
        animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative group"
      >
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={`
            w-full bg-[#F5F5F7]/50 dark:bg-white/[0.03] border rounded-2xl px-4 py-3.5 text-[15px]
            placeholder:text-[#86868B]/50 dark:placeholder:text-[#A1A1AA]/30 text-[#1D1D1F] dark:text-white
            transition-all duration-200
            focus:outline-none focus:bg-white dark:focus:bg-white/[0.08] 
            ${error 
              ? 'border-apple-red focus:border-apple-red/50 focus:ring-4 focus:ring-apple-red/5 ring-1 ring-apple-red/10' 
              : 'border-black/5 dark:border-white/5 focus:border-[#007AFF]/30 dark:focus:border-[#007AFF]/50 focus:ring-4 focus:ring-[#007AFF]/5 dark:focus:ring-[#007AFF]/10'
            }
            group-hover:border-black/10 dark:group-hover:border-white/10 dark:group-hover:bg-white/[0.05]
          `}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] transition-colors p-1"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </motion.div>

      <div className="min-h-[16px]">
        <AnimatePresence mode="wait">
          {error && (
            <motion.span 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[11px] font-bold text-apple-red ml-1 block"
            >
              {error}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Input;
