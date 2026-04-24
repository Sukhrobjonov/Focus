import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Palette, Bell, LogOut, ChevronRight, CheckCircle2, AlertCircle, X, Edit2, Lock, Trash2, Camera, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { getAvatarUrl } from '../utils/avatarHelper';
import { updateProfile } from '../api/user';

const Profile = () => {
  const { user, logout, theme, toggleTheme, setUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [activeModal, setActiveModal] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form States
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    avatarUrl: ''
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [previewUrl, setPreviewUrl] = useState(null);

  // Initialize form data when user changes or modal opens
  useEffect(() => {
    if (user && activeModal === 'edit-profile') {
      const names = user.name ? user.name.split(' ') : ['', ''];
      setProfileData({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        avatarUrl: user.avatar || ''
      });
      setPreviewUrl(getAvatarUrl(user.avatar));
    }
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
        
        // Brief delay for premium feel
        setTimeout(() => {
          setUser(updatedUser);
          setIsUploading(false);
          triggerSuccess();
        }, 600);
      } catch (err) {
        console.error('Avatar upload failed:', err);
        setIsUploading(false);
      }
    } else {
      // If in modal, we just keep the file for handleSaveProfile
      // We'll store it in a temp state or just let the input be read later
      setProfileData(prev => ({ ...prev, avatarFile: file }));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
    
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('name', fullName);
      
      if (profileData.avatarFile) {
        formData.append('avatar', profileData.avatarFile);
      }

      const updatedUser = await updateProfile(formData);
      
      setTimeout(() => {
        setUser(updatedUser);
        setIsUploading(false);
        triggerSuccess();
      }, 800);
    } catch (err) {
      console.error('Profile update failed:', err);
      setIsUploading(false);
    }
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
        alert("Passwords do not match");
        return;
    }
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setShowSuccess(true);
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

    switch (activeModal) {
      case 'edit-profile':
        return (
          <form onSubmit={handleSaveProfile} className="space-y-6">
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
                <div className="space-y-2">
                  <label className="text-[0.6875rem] font-bold text-[#86868B] dark:text-white/40 uppercase tracking-widest px-1">First Name</label>
                  <input 
                    type="text" 
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    className="dark-modal-input w-full h-12 rounded-2xl px-4 focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all focus:outline-none"
                    placeholder="First Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.6875rem] font-bold text-[#86868B] dark:text-white/40 uppercase tracking-widest px-1">Last Name</label>
                  <input 
                    type="text" 
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    className="dark-modal-input w-full h-12 rounded-2xl px-4 focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all focus:outline-none"
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>
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
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[0.6875rem] font-bold text-[#86868B] dark:text-white/40 uppercase tracking-widest px-1">Current Password</label>
                <input 
                  type="password" 
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  className="dark-modal-input w-full h-12 rounded-2xl px-4 focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[0.6875rem] font-bold text-[#86868B] dark:text-white/40 uppercase tracking-widest px-1">New Password</label>
                <input 
                  type="password" 
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  className="dark-modal-input w-full h-12 rounded-2xl px-4 focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[0.6875rem] font-bold text-[#86868B] dark:text-white/40 uppercase tracking-widest px-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  className="dark-modal-input w-full h-12 rounded-2xl px-4 focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="dark-modal-btn-primary flex-1 h-12 rounded-2xl font-bold transition-all focus:outline-none"
              >
                Update Password
              </motion.button>
            </div>
          </form>
        );
      case 'delete-account':
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
               <div className="w-16 h-16 bg-apple-red/10 rounded-full flex items-center justify-center">
                  <AlertCircle size={32} className="text-apple-red" />
               </div>
               <div className="text-center">
                 <p className="text-[#86868B] dark:text-[#A1A1AA] text-[1.0625rem] font-medium leading-relaxed">
                   This action is permanent and cannot be undone. All your tasks will be lost forever.
                 </p>
               </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-destructive-lock w-full h-12 rounded-2xl font-bold transition-all focus:outline-none"
              >
                Yes, Delete Everything
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveModal(null)}
                className="dark-modal-btn-secondary w-full h-12 rounded-2xl font-bold transition-all focus:outline-none"
              >
                No, Keep My Account
              </motion.button>
            </div>
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

        <div className="flex-1 min-w-0 w-full overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-bold dark:text-white leading-tight truncate">{user?.name || 'Focus User'}</h2>
          <p className="text-[#86868B] dark:text-[#A1A1AA] font-medium text-xs sm:text-base mt-0.5 truncate">{user?.email || 'admin@focus.app'}</p>
        </div>
        <div className="bg-apple-blue/10 text-apple-blue px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-[0.6875rem] sm:text-[0.8125rem] font-bold uppercase tracking-widest shadow-sm shrink-0 mt-2 sm:mt-0">
          Premium
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
