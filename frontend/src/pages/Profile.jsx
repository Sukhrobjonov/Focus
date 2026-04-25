import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Palette, Bell, LogOut, ChevronRight, CheckCircle2, AlertCircle, X, Edit2, Lock, Trash2, Camera, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { getAvatarUrl } from '../utils/avatarHelper';
import { updateProfile, requestDeletion, confirmDeletion } from '../api/user';
import Input from '../components/ui/Input';
import { Eye, EyeOff, Mail, Lock as LockIcon, ArrowLeft } from 'lucide-react';

const Profile = () => {
  const { user, logout, theme, toggleTheme, setUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [activeModal, setActiveModal] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [shake, setShake] = useState(0);

  // Deletion States
  const [deletionStep, setDeletionStep] = useState('confirm'); // 'confirm', 'request', 'verify'
  const [deletionOtp, setDeletionOtp] = useState('');
  const [deletionForm, setDeletionForm] = useState({ email: '', password: '' });

  // Password Change States
  const [passwordStep, setPasswordStep] = useState('input'); // 'input', 'verify'
  const [passwordOtp, setPasswordOtp] = useState('');

  // Form States
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    avatarUrl: ''
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [previewUrl, setPreviewUrl] = useState(null);

  const prevModalRef = useRef(null);
  
  // Initialize form data when user changes or modal opens
  useEffect(() => {
    if (user && activeModal === 'edit-profile') {
      const names = user.name ? user.name.split(' ') : ['', ''];
      setProfileData({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: user.email || '',
        avatarUrl: user.avatar || ''
      });
      setPreviewUrl(getAvatarUrl(user.avatar));
    }
    
    // Reset deletion state ONLY when the modal is first opened
    if (activeModal === 'delete-account' && prevModalRef.current !== 'delete-account') {
      setDeletionStep('confirm');
      setDeletionOtp('');
      setDeletionForm({ email: user?.email || '', password: '' });
    }
    
    setIsVerifyingEmail(false);
    setNewEmailCode('');
    setFieldErrors({});
    prevModalRef.current = activeModal;
  }, [user, activeModal]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Create local preview for immediate feedback
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // 2. If it's a direct upload (no modal), sync to backend immediately
    if (!activeModal) {
      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        const updatedUser = await updateProfile(formData);
        
        setTimeout(() => {
          setUser(updatedUser.user);
          setIsUploading(false);
          triggerSuccess();
        }, 600);
      } catch (err) {
        console.error('Avatar upload failed:', err);
        setIsUploading(false);
      }
    } else {
      // If in modal, we just keep the file for handleSaveProfile
      setProfileData(prev => ({ ...prev, avatarFile: file }));
    }
  };

  const validateProfile = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!profileData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (profileData.firstName.trim().length < 2) {
      errors.firstName = 'Name must be at least 2 characters';
    }
    
    if (!user.telegramId && !profileData.email.trim()) {
      errors.email = 'Email is required';
    } else if (profileData.email && !emailRegex.test(profileData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShake(prev => prev + 1);
      return false;
    }
    return true;
  };

  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [newEmailCode, setNewEmailCode] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    const fullName = `${profileData.firstName} ${profileData.lastName || ''}`.trim();
    
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('name', fullName);
      if (profileData.email) {
        formData.append('email', profileData.email);
      }
      
      if (profileData.avatarFile) {
        formData.append('avatar', profileData.avatarFile);
      }

      const { user: updatedUser, verificationNeeded } = await updateProfile(formData);
      
      if (verificationNeeded) {
        setIsVerifyingEmail(true);
        setIsUploading(false);
      } else {
        setTimeout(() => {
          setUser(updatedUser.user);
          setIsUploading(false);
          triggerSuccess();
        }, 800);
      }
    } catch (err) {
      setFieldErrors({ global: err.response?.data?.message || 'Update failed' });
      setShake(prev => prev + 1);
      setIsUploading(false);
    }
  };

  const handleVerifyNewEmail = async (e) => {
    e.preventDefault();
    if (newEmailCode.length !== 6) {
      setShake(prev => prev + 1);
      return;
    }

    try {
      setIsUploading(true);
      const { data } = await api.post('/users/verify', { 
        email: profileData.email, 
        code: newEmailCode 
      });
      setUser(data.data.user);
      setIsVerifyingEmail(false);
      setIsUploading(false);
      triggerSuccess();
    } catch (err) {
      setFieldErrors({ global: err.response?.data?.message || 'Verification failed' });
      setShake(prev => prev + 1);
      setIsUploading(false);
    }
  };

  const handleRequestDeletion = async (e) => {
    if (e) e.preventDefault();
    setFieldErrors({});
    
    // If they have an email, validate email/password
    if (user.email) {
      if (!deletionForm.email) {
        setFieldErrors({ email: 'Email is required' });
        setShake(prev => prev + 1);
        return;
      }
      // Only require password if the user actually has one (non-TG users always have one)
      if (user.hasPassword && !deletionForm.password) {
        setFieldErrors({ password: 'Password is required' });
        setShake(prev => prev + 1);
        return;
      }
    }

    try {
      setIsUploading(true);
      const res = await requestDeletion(deletionForm);
      // Backend returns { success, data: { hasEmail }, message }
      if (res.data?.hasEmail) {
        setDeletionStep('verify');
      } else {
        // No email, just go to confirm text step
        setDeletionStep('confirm-text');
      }
      setIsUploading(false);
    } catch (err) {
      setFieldErrors({ global: err.response?.data?.message || 'Failed to request deletion' });
      setShake(prev => prev + 1);
      setIsUploading(false);
    }
  };

  const handleConfirmDeletion = async (e) => {
    if (e) e.preventDefault();
    
    // If it's a code, validate length. If it's text, validate string.
    const isTextStep = deletionStep === 'confirm-text';
    const val = isTextStep ? deletionOtp : deletionOtp; // both use deletionOtp state for input

    if (!isTextStep && val.length !== 6) {
      setShake(prev => prev + 1);
      return;
    }

    if (isTextStep && val !== 'DELETE') {
      setFieldErrors({ global: 'Please type DELETE in all caps' });
      setShake(prev => prev + 1);
      return;
    }

    try {
      setIsUploading(true);
      const userId = user.id;
      await confirmDeletion(val);
      // Close modal and clean up BEFORE logout to avoid null pointer errors in render
      setActiveModal(null);
      setDeletionStep('none');
      
      logout();
      navigate('/auth');
    } catch (err) {
      setFieldErrors({ global: err.response?.data?.message || 'Deletion failed' });
      setShake(prev => prev + 1);
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Priority 1: User has an email (with or without password)
    if (user.email) {
      setDeletionStep('request');
      setDeletionForm(prev => ({ ...prev, email: user.email }));
    } 
    // Priority 2: User has NO email but HAS a password (e.g. TG user who set a password)
    else if (user.hasPassword) {
      setDeletionStep('confirm-password'); // New step for password-only deletion
    }
    // Priority 3: User has NO email and NO password (pure TG user)
    else if (user.telegramId) {
      handleRequestDeletion();
    } 
    else {
      setDeletionStep('request');
    }
  };

  const validatePassword = () => {
    const errors = {};
    if (user.hasPassword && !passwordData.current) errors.current = 'Current password is required';
    if (!passwordData.new) {
      errors.new = 'New password is required';
    } else if (passwordData.new.length < 8) {
      errors.new = 'Password must be at least 8 characters';
    } else {
      const hasUpper = /[A-Z]/.test(passwordData.new);
      const hasLower = /[a-z]/.test(passwordData.new);
      const hasNumber = /[0-9]/.test(passwordData.new);
      
      if (!hasUpper || !hasLower || !hasNumber) {
        errors.new = 'Must contain upper, lower and number';
      }
    }

    if (passwordData.new !== passwordData.confirm) errors.confirm = 'Passwords do not match';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShake(prev => prev + 1);
      return false;
    }
    return true;
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    
    try {
      setIsUploading(true);
      await api.post('/users/request-password-change', {
        currentPassword: passwordData.current
      });
      setPasswordStep('verify');
      setIsUploading(false);
    } catch (err) {
      setFieldErrors({ global: err.response?.data?.message || 'Failed to request password change' });
      setShake(prev => prev + 1);
      setIsUploading(false);
    }
  };

  const handleConfirmPasswordChange = async (e) => {
    e.preventDefault();
    if (passwordOtp.length !== 6) {
      setShake(prev => prev + 1);
      return;
    }

    try {
      setIsUploading(true);
      const { data } = await api.post('/users/confirm-password-change', {
        code: passwordOtp,
        newPassword: passwordData.new
      });
      
      setUser(data.data.user);
      setIsUploading(false);
      triggerSuccess();
      setPasswordData({ current: '', new: '', confirm: '' });
      setPasswordOtp('');
      setPasswordStep('input');
    } catch (err) {
      setFieldErrors({ global: err.response?.data?.message || 'Update failed' });
      setShake(prev => prev + 1);
      setIsUploading(false);
    }
  };

  const triggerSuccess = () => {
    setShowSuccess(true);
    setFieldErrors({});
    setTimeout(() => {
      setShowSuccess(false);
      setActiveModal(null);
    }, 1500);
  };

  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarMenuRef = useRef(null);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
        setShowAvatarMenu(false);
      }
    };
    if (showAvatarMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAvatarMenu]);

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true);
      // Sending null/empty string to clear avatar
      const updatedUser = await updateProfile({ avatar: '' });
      
      setUser(updatedUser);
      setPreviewUrl(null);
      setProfileData(prev => ({ ...prev, avatarUrl: '', avatarFile: null }));
      setShowAvatarMenu(false);
      setIsUploading(false);
      triggerSuccess();
    } catch (err) {
      console.error('Failed to remove avatar:', err);
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    setShowAvatarMenu(false);
    fileInputRef.current?.click();
  };

  const settingsGroups = [
    {
      title: 'ACCOUNT & SECURITY',
      items: [
        { id: 'edit-profile', icon: User, label: 'Edit Profile', color: 'text-[#007AFF]', action: () => setActiveModal('edit-profile') },
        { id: 'password', icon: Shield, label: 'Change Password', color: 'text-[#34C759]', action: () => setActiveModal('password') },
      ]
    },
    {
      title: 'PREFERENCES',
      items: [
        { id: 'appearance', icon: Palette, label: 'Appearance', sub: theme === 'dark' ? 'Dark Mode' : 'Light Mode', action: toggleTheme },
        { id: 'notifications', icon: Bell, label: 'Notifications', sub: 'Enabled' },
      ]
    }
  ];

  const handleInputChange = (modal, field, value) => {
    let finalValue = value;
    
    // Strict character limits in state
    if (modal === 'profile') {
      if (field === 'firstName' || field === 'lastName') {
        finalValue = value.slice(0, 25);
      } else if (field === 'email') {
        finalValue = value.slice(0, 50);
      }
      setProfileData({ ...profileData, [field]: finalValue });
    } else {
      // Password modal or others
      finalValue = value.slice(0, 50);
      setPasswordData({ ...passwordData, [field]: finalValue });
    }

    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: null });
    }
  };

  const renderModalContent = () => {
    if (showSuccess) {
      return (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-apple-green/10 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 size={48} className="text-apple-green" />
          </motion.div>
          <p className="text-xl font-bold text-[#1D1D1F] dark:text-white">Success!</p>
          <p className="text-[#86868B] dark:text-[#A1A1AA]">Your changes have been applied.</p>
        </div>
      );
    }

    if (isVerifyingEmail) {
      return (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-apple-blue/10 rounded-full flex items-center justify-center">
              <Mail size={32} className="text-apple-blue" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white">Verify New Email</h3>
              <p className="text-[#86868B] dark:text-[#A1A1AA] text-[14px]">
                We've sent a code to <br />
                <span className="font-bold text-[#1D1D1F] dark:text-white">{profileData.email}</span>
              </p>
            </div>
          </div>
          <form onSubmit={handleVerifyNewEmail} className="space-y-6">
            <div className="relative">
              <input 
                type="text"
                maxLength={6}
                value={newEmailCode}
                onChange={(e) => setNewEmailCode(e.target.value.replace(/\D/g, ''))}
                className="w-full h-14 bg-black/5 dark:bg-white/5 border-2 border-transparent rounded-2xl text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-apple-blue/50 transition-all"
                placeholder="000000"
                autoFocus
              />
            </div>
            {fieldErrors.global && <p className="text-[13px] font-bold text-apple-red text-center">{fieldErrors.global}</p>}
            <div className="flex flex-col gap-3">
              <button 
                type="submit"
                disabled={isUploading || newEmailCode.length !== 6}
                className="w-full h-12 bg-apple-blue text-white rounded-2xl font-bold shadow-lg shadow-apple-blue/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading && <Loader2 size={18} className="animate-spin" />}
                Verify & Save
              </button>
              <button 
                type="button"
                onClick={() => setIsVerifyingEmail(false)}
                className="text-[14px] font-semibold text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    switch (activeModal) {
      case 'edit-profile':
        return (
          <form onSubmit={handleSaveProfile} noValidate className="space-y-6">
            <div className="flex flex-col items-center mb-4">
               <div 
                onClick={handleAvatarClick}
                className="w-24 h-24 rounded-full bg-apple-blue/10 flex items-center justify-center mb-3 relative group cursor-pointer overflow-hidden border-2 border-transparent hover:border-apple-blue/30 transition-all"
               >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-apple-blue" />
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploading ? (
                      <Loader2 size={24} className="text-white animate-spin" />
                    ) : (
                      <Camera size={24} color="white" />
                    )}
                  </div>
               </div>
               <button 
                type="button"
                onClick={handleAvatarClick}
                className="text-[0.8125rem] font-bold text-apple-blue uppercase tracking-widest hover:underline focus:outline-none"
               >
                 {isUploading ? 'Processing...' : 'Change Avatar'}
               </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="First Name"
                  type="text" 
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange('profile', 'firstName', e.target.value)}
                  placeholder="First Name"
                  error={fieldErrors.firstName}
                  shake={shake}
                  maxLength={25}
                />
                <Input 
                  label="Last Name"
                  type="text" 
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange('profile', 'lastName', e.target.value)}
                  placeholder="Last Name"
                  error={fieldErrors.lastName}
                  shake={shake}
                  maxLength={25}
                />
              </div>
              <Input 
                label="Email Address"
                type="email" 
                value={profileData.email}
                onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                placeholder="name@apple.com"
                error={fieldErrors.email}
                shake={shake}
                required={!user.telegramId}
              />

              <AnimatePresence>
                {fieldErrors.global && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[13px] font-bold text-apple-red text-center"
                  >
                    {fieldErrors.global}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-4 pt-4">
              <motion.button 
                type="button" 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveModal(null)}
                className="dark-modal-btn-secondary flex-1 h-12 rounded-2xl font-bold transition-all focus:outline-none"
              >
                Cancel
              </motion.button>
              <motion.button 
                type="submit" 
                disabled={isUploading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`dark-modal-btn-primary flex-1 h-12 rounded-2xl font-bold transition-all focus:outline-none flex items-center justify-center gap-2 ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : null}
                {isUploading ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </form>
        );
      case 'password':
        return (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {passwordStep === 'input' ? (
                <motion.form 
                  key="pass-input"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleUpdatePassword} 
                  noValidate 
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    {user.hasPassword && (
                      <Input 
                        label="Current Password"
                        type="password"
                        value={passwordData.current}
                        onChange={(e) => handleInputChange('password', 'current', e.target.value)}
                        placeholder="••••••••"
                        error={fieldErrors.current}
                        shake={shake}
                      />
                    )}
                    <Input 
                      label={user.hasPassword ? 'New Password' : 'Set Password'}
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => handleInputChange('password', 'new', e.target.value)}
                      placeholder="••••••••"
                      error={fieldErrors.new}
                      shake={shake}
                    />
                    <Input 
                      label={`Confirm ${user.hasPassword ? 'New ' : ''}Password`}
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => handleInputChange('password', 'confirm', e.target.value)}
                      placeholder="••••••••"
                      error={fieldErrors.confirm}
                      shake={shake}
                    />
                    {fieldErrors.global && <p className="text-[13px] font-bold text-apple-red text-center">{fieldErrors.global}</p>}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <motion.button 
                      type="button" 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveModal(null)}
                      className="dark-modal-btn-secondary flex-1 h-12 rounded-2xl font-bold transition-all focus:outline-none"
                    >
                      Cancel
                    </motion.button>
                    <motion.button 
                      type="submit" 
                      disabled={isUploading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="dark-modal-btn-primary flex-1 h-12 rounded-2xl font-bold transition-all focus:outline-none flex items-center justify-center gap-2"
                    >
                      {isUploading && <Loader2 size={18} className="animate-spin" />}
                      Change Password
                    </motion.button>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  key="pass-verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-apple-green/10 rounded-full flex items-center justify-center">
                      <Shield size={32} className="text-apple-green" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white">Verify Your Identity</h3>
                      <p className="text-[#86868B] dark:text-[#A1A1AA] text-[14px]">
                        We've sent a code to <br />
                        <span className="font-bold text-[#1D1D1F] dark:text-white">{user.email}</span>
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleConfirmPasswordChange} className="space-y-6">
                    <div className="relative">
                      <input 
                        type="text"
                        maxLength={6}
                        value={passwordOtp}
                        onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-14 bg-black/5 dark:bg-white/5 border-2 border-transparent rounded-2xl text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-apple-blue/50 transition-all"
                        placeholder="000000"
                        autoFocus
                      />
                    </div>
                    {fieldErrors.global && <p className="text-[13px] font-bold text-apple-red text-center">{fieldErrors.global}</p>}
                    <div className="flex flex-col gap-3">
                      <button 
                        type="submit"
                        disabled={isUploading || passwordOtp.length !== 6}
                        className="w-full h-12 bg-apple-blue text-white rounded-2xl font-bold shadow-lg shadow-apple-blue/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isUploading && <Loader2 size={18} className="animate-spin" />}
                        Verify & Update
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPasswordStep('input')}
                        className="text-[14px] font-semibold text-zinc-500 hover:text-zinc-700"
                      >
                        Back
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      case 'delete-account':
        return (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {deletionStep === 'confirm' && (
                <motion.div 
                  key="confirm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-apple-red/10 rounded-full flex items-center justify-center">
                      <AlertCircle size={32} className="text-apple-red" />
                    </div>
                    <div className="text-center">
                      <p className="text-[#1D1D1F] dark:text-white text-lg font-bold">Are you absolutely sure?</p>
                      <p className="text-[#86868B] dark:text-[#A1A1AA] text-[15px] font-medium leading-relaxed mt-1">
                        This action is permanent. All your tasks, settings, and premium status will be lost forever.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDeleteAccount}
                      className="btn-destructive-lock w-full h-12 rounded-2xl font-bold transition-all focus:outline-none"
                    >
                      Continue to Delete
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveModal(null)}
                      className="dark-modal-btn-secondary w-full h-12 rounded-2xl font-bold transition-all focus:outline-none"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {deletionStep === 'request' && (
                <motion.div 
                  key="request"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-1">
                    <p className="text-[#1D1D1F] dark:text-white text-lg font-bold">Verify Identity</p>
                    <p className="text-[#86868B] dark:text-[#A1A1AA] text-[14px]">Please confirm your credentials to continue.</p>
                  </div>
                  <form onSubmit={handleRequestDeletion} className="space-y-4">
                    <Input 
                      label="Email"
                      type="email"
                      value={deletionForm.email}
                      onChange={(e) => setDeletionForm({ ...deletionForm, email: e.target.value })}
                      error={fieldErrors.email}
                      shake={shake}
                    />
                    {user.hasPassword && (
                      <Input 
                        label="Password"
                        type="password"
                        value={deletionForm.password}
                        onChange={(e) => setDeletionForm({ ...deletionForm, password: e.target.value })}
                        error={fieldErrors.password}
                        shake={shake}
                      />
                    )}
                    {fieldErrors.global && (
                      <p className="text-[13px] font-bold text-apple-red text-center">{fieldErrors.global}</p>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => setDeletionStep('confirm')}
                        className="dark-modal-btn-secondary flex-1 h-12 rounded-2xl font-bold"
                      >
                        Back
                      </button>
                      <button 
                        type="submit"
                        disabled={isUploading}
                        className="dark-modal-btn-primary flex-1 h-12 rounded-2xl font-bold bg-apple-red hover:bg-red-600 text-white"
                      >
                        {isUploading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Send Code'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {deletionStep === 'confirm-password' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2 text-center">
                    <p className="text-[17px] font-semibold text-[#1D1D1F] dark:text-white">Verify Your Password</p>
                    <p className="text-[13px] text-[#86868B] dark:text-[#A1A1AA] leading-relaxed">
                      Please enter your account password to confirm permanent deletion.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Input 
                      label="Password"
                      type="password"
                      value={deletionOtp}
                      onChange={(e) => setDeletionOtp(e.target.value)}
                      placeholder="Enter your password"
                      error={fieldErrors.global}
                      shake={shake}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      className="dark-modal-btn-secondary flex-1 h-12 rounded-2xl font-bold"
                      onClick={() => setDeletionStep('confirm')}
                      disabled={isUploading}
                    >
                      Back
                    </button>
                    <button 
                      type="button"
                      disabled={isUploading || !deletionOtp}
                      className="dark-modal-btn-primary flex-1 h-12 rounded-2xl font-bold bg-apple-red hover:bg-red-600 text-white shadow-lg shadow-apple-red/20 disabled:opacity-50"
                      onClick={handleConfirmDeletion}
                    >
                      {isUploading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Delete Account'}
                    </button>
                  </div>
                </motion.div>
              )}

              {deletionStep === 'confirm-text' && (
                <motion.div 
                  key="confirm-text"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-apple-red/10 rounded-full flex items-center justify-center">
                      <Trash2 size={32} className="text-apple-red" />
                    </div>
                    <div>
                      <p className="text-[#1D1D1F] dark:text-white text-lg font-bold">Final Confirmation</p>
                      <p className="text-[#86868B] dark:text-[#A1A1AA] text-[14px] leading-relaxed">
                        To permanently delete your account, please type <br />
                        <span className="font-bold text-apple-red">DELETE</span> below.
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleConfirmDeletion} className="space-y-6">
                    <div className="relative">
                      <input 
                        type="text"
                        value={deletionOtp}
                        onChange={(e) => setDeletionOtp(e.target.value)}
                        className={`
                          w-full h-14 bg-black/5 dark:bg-white/5 border-2 rounded-2xl 
                          text-center text-xl font-bold tracking-widest
                          focus:outline-none focus:border-apple-red/50
                          ${fieldErrors.global ? 'border-apple-red' : 'border-transparent'}
                          transition-all
                        `}
                        placeholder="TYPE HERE"
                        autoFocus
                      />
                      {fieldErrors.global && (
                        <p className="text-[13px] font-bold text-apple-red text-center mt-3">{fieldErrors.global}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <button 
                        type="submit"
                        disabled={isUploading || deletionOtp !== 'DELETE'}
                        className="w-full h-12 bg-apple-red text-white rounded-2xl font-bold shadow-lg shadow-apple-red/20 disabled:opacity-50"
                      >
                        {isUploading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Confirm Deletion'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setDeletionStep('confirm')}
                        className="text-[14px] font-semibold text-zinc-500"
                      >
                        Back
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {deletionStep === 'verify' && (
                <motion.div 
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-apple-blue/10 rounded-full flex items-center justify-center">
                      <Mail size={32} className="text-apple-blue" />
                    </div>
                    <div>
                      <p className="text-[#1D1D1F] dark:text-white text-lg font-bold">Check your email</p>
                      <p className="text-[#86868B] dark:text-[#A1A1AA] text-[14px] leading-relaxed">
                        We've sent a 6-digit deletion code to <br />
                        <span className="font-bold text-[#1D1D1F] dark:text-white">{deletionForm.email}</span>
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleConfirmDeletion} className="space-y-6">
                    <div className="relative">
                      <input 
                        type="text"
                        maxLength={6}
                        value={deletionOtp}
                        onChange={(e) => setDeletionOtp(e.target.value.replace(/\D/g, ''))}
                        className={`
                          w-full h-14 bg-black/5 dark:bg-white/5 border-2 rounded-2xl 
                          text-center text-2xl font-black tracking-[0.5em] pl-4
                          focus:outline-none focus:border-apple-blue/50
                          ${fieldErrors.global ? 'border-apple-red' : 'border-transparent'}
                          transition-all
                        `}
                        placeholder="000000"
                        autoFocus
                      />
                      {fieldErrors.global && (
                        <p className="text-[13px] font-bold text-apple-red text-center mt-3">{fieldErrors.global}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <button 
                        type="submit"
                        disabled={isUploading || deletionOtp.length !== 6}
                        className="w-full h-12 bg-apple-red text-white rounded-2xl font-bold shadow-lg shadow-apple-red/20 disabled:opacity-50"
                      >
                        {isUploading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Permanently Delete'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setDeletionStep('request')}
                        className="text-[14px] font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      >
                        Change Details
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full lg:max-w-[50rem] mx-auto space-y-6 sm:space-y-12 pb-20 px-1 sm:px-0"
    >
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight dark:text-white">Settings</h1>
        <p className="text-[#86868B] dark:text-[#A1A1AA] font-medium text-base sm:text-lg">Personalize your experience.</p>
      </header>

      {/* Hidden File Input for Avatar */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Container */}
      <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 p-5 sm:p-8 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6 shadow-sm relative overflow-visible">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-[#1C1C1E] shadow-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            {user?.avatar ? (
              <img src={getAvatarUrl(user.avatar)} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-1/2 h-1/2 text-zinc-400 dark:text-zinc-500" />
            )}
          </div>
          
          <button 
            type="button"
            className="absolute bottom-0 right-0 z-20 w-7 h-7 sm:w-8 sm:h-8 bg-apple-blue rounded-full border-2 border-white dark:border-[#1C1C1E] flex items-center justify-center text-white shadow-lg cursor-pointer focus:outline-none hover:scale-110 transition-transform active:scale-95"
            onClick={() => setShowAvatarMenu(!showAvatarMenu)}
          >
            {showAvatarMenu ? <X size={12} /> : <Edit2 size={12} />}
          </button>

          {/* Avatar Options Dropdown (Bento Style) */}
          <AnimatePresence>
            {showAvatarMenu && (
              <motion.div
                ref={avatarMenuRef}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute top-full left-0 mt-3 w-44 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden py-1"
              >
                <button 
                  onClick={handleUploadClick}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <Camera size={16} className="text-[#007AFF]" />
                  <span className="text-[13px] sm:text-[14px] font-bold text-[#007AFF]">Upload New Photo</span>
                </button>
                
                {user?.avatar && (
                  <button 
                    onClick={handleRemoveAvatar}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left border-t border-zinc-100 dark:border-white/5"
                  >
                    <Trash2 size={16} className="text-apple-red" />
                    <span className="text-[13px] sm:text-[14px] font-bold text-apple-red">Remove Current Photo</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 min-w-0 w-full">
          <h2 className="text-lg sm:text-2xl font-bold dark:text-white leading-tight break-words">{user?.name || 'Focus User'}</h2>
          <p className="text-[#86868B] dark:text-[#A1A1AA] font-medium text-xs sm:text-base mt-1 break-all">{user?.email || (user?.telegramId ? 'Telegram User (Email not set)' : 'admin@focus.app')}</p>
        </div>
        <div className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-[0.6875rem] sm:text-[0.8125rem] font-bold uppercase tracking-widest shadow-sm shrink-0 mt-2 sm:mt-0 ${
          user?.isPremium 
            ? 'bg-apple-blue/10 text-apple-blue' 
            : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'
        }`}>
          {user?.isPremium ? 'Premium' : 'Basic'}
        </div>
      </section>

      {/* Grouped Settings Blocks */}
      <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-6">
        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-[0.6875rem] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest ml-1">{group.title}</h3>
            
            {/* The Parent Container - One per Group */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/[0.05] dark:border-white/5 shadow-sm overflow-hidden">
              {group.items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between py-4 px-5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] focus:outline-none relative group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/5 transition-transform group-hover:scale-105">
                      <item.icon size={20} className={item.color || 'text-[#86868B] dark:text-[#A1A1AA]'} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold dark:text-white leading-tight">{item.label}</p>
                      {item.sub && <p className="text-[0.8125rem] text-[#86868B] dark:text-[#A1A1AA] font-medium mt-0.5">{item.sub}</p>}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  
                  {/* Refined Indented Divider */}
                  {idx !== group.items.length - 1 && (
                    <div className="absolute bottom-0 left-14 right-0 h-[1px] bg-black/[0.03] dark:bg-white/[0.03]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Danger Zone Block */}
        <div className="space-y-3 pt-0 md:col-span-2 mt-2 md:mt-4">
          <h3 className="text-[0.6875rem] font-bold text-apple-red/60 uppercase tracking-widest ml-1">DANGER ZONE</h3>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-apple-red/10 dark:border-apple-red/20 shadow-sm overflow-hidden">
             <button 
              onClick={() => setActiveModal('delete-account')}
              className="w-full flex items-center justify-between py-4 px-5 hover:bg-apple-red/5 transition-colors focus:outline-none"
             >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-apple-red/10">
                    <Trash2 size={20} className="text-apple-red" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-apple-red leading-tight">Delete Account</p>
                    <p className="text-[0.8125rem] text-apple-red/60 font-medium mt-0.5">Permanently remove all your data</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-apple-red/40" />
             </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeModal && (
          <Modal 
            isOpen={!!activeModal} 
            onClose={() => !showSuccess && setActiveModal(null)}
            title={
              activeModal === 'edit-profile' ? 'Edit Profile' : 
              activeModal === 'password' ? 'Security' : 
              activeModal === 'delete-account' ? 'Final Warning' : ''
            }
          >
            {renderModalContent()}
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Profile;
