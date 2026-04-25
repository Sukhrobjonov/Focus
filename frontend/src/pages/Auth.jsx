import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import BentoCard from '../components/bento/BentoCard';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { CheckCircle2, ArrowRight, Mail, ShieldCheck, ArrowLeft, Loader2, KeyRound, Lock as LockIcon } from 'lucide-react';
import { requestPasswordReset, resetPassword } from '../api/user';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [shake, setShake] = useState(0);
  const [otp, setOtp] = useState('');
  
  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email', 'code', 'new-password'
  const [resetData, setResetData] = useState({ email: '', code: '', newPassword: '' });
  
  const setAuth = useAuthStore(state => state.setAuth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!isLogin && !formData.name.trim()) errors.name = 'Name is required';
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isLogin) {
      if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else {
        const hasUpper = /[A-Z]/.test(formData.password);
        const hasLower = /[a-z]/.test(formData.password);
        const hasNumber = /[0-9]/.test(formData.password);
        
        if (!hasUpper || !hasLower || !hasNumber) {
          errors.password = 'Must contain upper, lower and number';
        }
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShake(prev => prev + 1);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const endpoint = isLogin ? '/users/login' : '/users/register';
      const { data } = await api.post(endpoint, formData);
      
      if (!isLogin) {
        setIsVerifying(true);
      } else {
        setAuth(data.data.user, data.data.token);
      }
    } catch (err) {
      setShake(prev => prev + 1);
      const apiError = err.response?.data;
      if (err.response?.status === 403 && apiError?.message?.includes('verify')) {
        setIsVerifying(true);
        return;
      }
      if (apiError?.errors) {
        setError(apiError.errors.map(e => e.message).join('. '));
      } else {
        setError(apiError?.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setShake(prev => prev + 1);
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/users/verify', { 
        email: formData.email, 
        code: otp 
      });
      setAuth(data.data.user, data.data.token);
    } catch (err) {
      setShake(prev => prev + 1);
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError('');
    try {
      await api.post('/users/resend-code', { email: formData.email });
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: null });
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
      
      const { data } = await api.post('/users/telegram', { tgUser });
      setAuth(data.data.user, data.data.token);
    } catch (err) {
      setShake(prev => prev + 1);
      setError(err.response?.data?.message || 'Telegram login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    if (e) e.preventDefault();
    if (!resetData.email) {
      setFieldErrors({ email: 'Email is required' });
      setShake(prev => prev + 1);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await requestPasswordReset(resetData.email);
      setForgotStep('code');
    } catch (err) {
      setShake(prev => prev + 1);
      setError(err.response?.data?.message || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetCode = async (e) => {
    if (e) e.preventDefault();
    if (resetData.code.length !== 6) {
      setShake(prev => prev + 1);
      return;
    }
    setForgotStep('new-password');
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!resetData.newPassword || resetData.newPassword.length < 6) {
      setFieldErrors({ newPassword: 'Password must be at least 6 characters' });
      setShake(prev => prev + 1);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword({ 
        email: resetData.email, 
        code: resetData.code, 
        newPassword: resetData.newPassword 
      });
      setIsForgotPassword(false);
      setIsLogin(true);
      setError('');
    } catch (err) {
      setShake(prev => prev + 1);
      setError(err.response?.data?.message || 'Reset failed');
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
        <div className="auth-container">
          
          <AnimatePresence mode="wait">
            {isVerifying ? (
              <motion.div 
                key="verify-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-10"
              >
                <div className="flex flex-col items-center text-center space-y-6">
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-3xl bg-apple-blue/10 flex items-center justify-center">
                    <Mail size={40} className="text-apple-blue" strokeWidth={2} />
                  </motion.div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">Check your email</h1>
                    <p className="text-[#86868B] dark:text-[#A1A1AA] text-[15px] font-medium leading-relaxed">
                      We've sent a 6-digit code to <br />
                      <span className="text-[#1D1D1F] dark:text-white font-bold">{formData.email}</span>
                    </p>
                  </div>
                </div>
                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="relative">
                    <input 
                      type="text" maxLength={6} value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className={`w-full h-16 bg-[#F5F5F7]/50 dark:bg-white/[0.03] border-2 rounded-2xl text-center text-3xl font-black tracking-[0.75em] pl-4 focus:outline-none focus:border-apple-blue/50 focus:ring-4 focus:ring-apple-blue/5 ${error ? 'border-apple-red' : 'border-black/5 dark:border-white/5'} transition-all`}
                      placeholder="000000" autoFocus
                    />
                    {error && <p className="text-[13px] font-bold text-red-500 text-center mt-4">{error}</p>}
                  </div>
                  <button type="submit" disabled={loading || otp.length !== 6} className="w-full h-[58px] bg-apple-blue text-white rounded-2xl font-bold text-[17px] shadow-lg shadow-apple-blue/20 hover:bg-[#0071E3] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={24} className="animate-spin" /> : 'Verify Address'}
                  </button>
                  <div className="flex flex-col items-center gap-4 pt-4">
                    <button type="button" onClick={handleResendCode} disabled={resending} className="text-[14px] font-semibold text-apple-blue hover:underline disabled:opacity-50">
                      {resending ? 'Sending new code...' : "Didn't get a code? Resend"}
                    </button>
                    <button type="button" onClick={() => setIsVerifying(false)} className="flex items-center gap-2 text-[14px] font-semibold text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors">
                      <ArrowLeft size={16} /> Use a different email
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : isForgotPassword ? (
              <motion.div 
                key="forgot-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-10"
              >
                <div className="flex flex-col items-center text-center space-y-6">
                  <motion.div className="w-20 h-20 rounded-3xl bg-apple-blue/10 flex items-center justify-center">
                    <KeyRound size={40} className="text-apple-blue" />
                  </motion.div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                      {forgotStep === 'email' ? 'Reset Password' : forgotStep === 'code' ? 'Check Email' : 'New Password'}
                    </h1>
                    <p className="text-[#86868B] dark:text-[#A1A1AA] text-[15px] font-medium leading-relaxed">
                      {forgotStep === 'email' ? 'Enter your email to receive a reset code.' : 
                       forgotStep === 'code' ? `We've sent a code to ${resetData.email}` : 
                       'Create a strong password for your sanctuary.'}
                    </p>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {forgotStep === 'email' && (
                    <motion.form key="step-email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleRequestReset} className="space-y-6">
                      <Input label="Email Address" type="email" value={resetData.email} onChange={e => setResetData({ ...resetData, email: e.target.value })} placeholder="name@apple.com" error={fieldErrors.email} shake={shake} />
                      <Button onClick={handleRequestReset} loading={loading} className="w-full h-14 rounded-2xl bg-apple-blue text-white font-bold">Send Reset Code</Button>
                      <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-center text-[15px] font-bold text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors">Back to Login</button>
                    </motion.form>
                  )}
                  {forgotStep === 'code' && (
                    <motion.form key="step-code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleVerifyResetCode} className="space-y-6">
                      <div className="relative">
                        <input type="text" maxLength={6} value={resetData.code} onChange={(e) => setResetData({ ...resetData, code: e.target.value.replace(/\D/g, '') })} className="w-full h-16 bg-[#F5F5F7]/50 dark:bg-white/[0.03] border-2 border-transparent rounded-2xl text-center text-3xl font-black tracking-[0.75em] focus:outline-none focus:border-apple-blue/50 transition-all" placeholder="000000" autoFocus />
                      </div>
                      <Button onClick={handleVerifyResetCode} disabled={resetData.code.length !== 6} className="w-full h-14 rounded-2xl bg-apple-blue text-white font-bold">Verify Code</Button>
                      <button type="button" onClick={() => setForgotStep('email')} className="w-full text-center text-[15px] font-bold text-[#86868B]">Try a different email</button>
                    </motion.form>
                  )}
                  {forgotStep === 'new-password' && (
                    <motion.form key="step-pass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleResetPassword} className="space-y-6">
                      <Input label="New Password" type="password" value={resetData.newPassword} onChange={e => setResetData({ ...resetData, newPassword: e.target.value })} placeholder="••••••••" error={fieldErrors.newPassword} shake={shake} />
                      <Button onClick={handleResetPassword} loading={loading} className="w-full h-14 rounded-2xl bg-apple-blue text-white font-bold">Reset Password</Button>
                    </motion.form>
                  )}
                </AnimatePresence>
                {error && <p className="text-[13px] font-bold text-red-500 text-center -mt-4">{error}</p>}
              </motion.div>
            ) : (
              <motion.div 
                key="auth-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-10"
              >
                <div className="flex flex-col items-center text-center space-y-6">
                  <motion.div whileHover={{ scale: 1.05 }} className="w-20 h-20 rounded-3xl bg-[#007AFF] flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <CheckCircle2 size={40} color="white" strokeWidth={2.5} />
                  </motion.div>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">{isLogin ? 'Focus' : 'Join Focus'}</h1>
                    <p className="text-[#86868B] dark:text-[#A1A1AA] text-[15px] font-medium leading-relaxed">{isLogin ? 'Sign in to your sanctuary.' : 'The journey to organized living starts here.'}</p>
                  </div>
                </div>
                <form onSubmit={handleSubmit} noValidate className="flex flex-col space-y-2">
                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Input label="Name" placeholder="Steve" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} error={fieldErrors.name} shake={shake} maxLength={50} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Input label="Email" type="email" placeholder="name@apple.com" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} error={fieldErrors.email} shake={shake} />
                  <div className="space-y-1">
                    <Input label="Password" type="password" placeholder="••••••••" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} error={fieldErrors.password} shake={shake} hideErrorSpace={!fieldErrors.password} />
                    {isLogin && (
                      <div className="flex justify-end pr-1 -mt-0.5">
                        <button type="button" onClick={() => { setIsForgotPassword(true); setForgotStep('email'); setResetData({ ...resetData, email: formData.email }); }} className="text-[12px] font-bold text-apple-blue hover:underline focus:outline-none opacity-80 hover:opacity-100 transition-opacity">Forgot password?</button>
                      </div>
                    )}
                  </div>
                  <AnimatePresence>{error && <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-[13px] font-bold text-red-500 text-center py-2">{error}</motion.p>}</AnimatePresence>
                  <button type="submit" disabled={loading} className="w-full h-[58px] bg-[#007AFF] text-white rounded-2xl font-bold text-[17px] shadow-lg shadow-blue-500/20 hover:bg-[#0071E3] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                    {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    {!loading && <ArrowRight size={20} />}
                  </button>
                </form>
                {window.Telegram?.WebApp?.initData && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 py-2"><div className="flex-1 h-[1px] bg-black/5 dark:bg-white/5" /><span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">or</span><div className="flex-1 h-[1px] bg-black/5 dark:bg-white/5" /></div>
                    <button onClick={handleTelegramLogin} className="w-full h-[58px] bg-[#229ED9] text-white rounded-2xl font-bold text-[17px] shadow-lg shadow-blue-500/10 hover:bg-[#1E8EC4] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 10.38 15.84 14.18 15.51 15.96C15.37 16.71 15.09 16.96 14.82 16.99C14.24 17.04 13.8 16.6 13.24 16.23C12.36 15.65 11.86 15.29 11.01 14.73C10.02 14.08 10.66 13.72 11.23 13.13C11.38 12.98 13.94 10.65 13.99 10.44C14 10.41 14 10.3 13.94 10.24C13.88 10.18 13.79 10.21 13.72 10.22C13.63 10.24 12.23 11.16 9.51 13C9.11 13.27 8.75 13.4 8.43 13.39C8.08 13.38 7.4 13.19 6.89 13.03C6.27 12.83 5.77 12.72 5.81 12.38C5.83 12.2 6.08 12.02 6.56 11.83C9.52 10.54 11.49 9.69 12.48 9.28C15.3 8.11 15.89 7.9 16.27 7.9C16.35 7.9 16.54 7.92 16.66 8.02C16.76 8.1 16.79 8.21 16.8 8.29C16.81 8.37 16.82 8.56 16.64 8.8Z" fill="white"/></svg>
                      Continue with Telegram
                    </button>
                  </div>
                )}
                <div className="text-center pt-2">
                  <button onClick={() => setIsLogin(!isLogin)} className="text-[15px] font-semibold text-[#007AFF] hover:underline transition-all">
                    {isLogin ? "New here? Create an account" : "Have an account? Sign in"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-center mt-10 text-[#86868B] dark:text-[#A1A1AA]/50 text-[13px] font-medium opacity-60">Privacy is built in. Standard on Focus.</p>
      </motion.div>
    </div>
  );
};

export default Auth;
