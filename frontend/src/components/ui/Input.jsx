import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({ label, error, type = 'text', className = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-[13px] font-semibold text-[#86868B] ml-1 tracking-tight">
          {label}
        </label>
      )}
      
      <div className="relative group">
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={`
            w-full bg-[#F5F5F7]/50 border border-black/5 rounded-2xl px-4 py-3.5 text-[15px]
            placeholder:text-[#86868B]/50 text-[#1D1D1F]
            transition-all duration-200
            focus:outline-none focus:bg-white focus:border-[#007AFF]/30 focus:ring-4 focus:ring-[#007AFF]/5
            group-hover:border-black/10
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
      </div>

      {error && (
        <span className="text-[11px] font-semibold text-red-500 ml-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
