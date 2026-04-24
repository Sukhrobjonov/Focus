import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTrash, updateTask, emptyTrash, deleteTask } from '../api/tasks';
import { Trash2, RotateCcw, AlertCircle, Inbox, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence, useAnimation, useMotionValue } from 'framer-motion';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useAuthStore } from '../store/authStore';

const SwipeableTrashItem = ({ item, onRestore, onDelete }) => {
  const { theme } = useAuthStore();
  const isDarkMode = theme === 'dark';
  
  const controls = useAnimation();
  const x = useMotionValue(0);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [swipedDir, setSwipedDir] = React.useState(0); // 0: none, 1: restore (right), -1: delete (left)

  // Desktop Detection
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth > 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Instant Snap & State Sync
  const handleDragEnd = (_, info) => {
    const threshold = 40;
    const offset = info.offset.x;

    if (offset > threshold) {
      setSwipedDir(1);
      controls.start({ x: 80 });
    } else if (offset < -threshold) {
      setSwipedDir(-1);
      controls.start({ x: -80 });
    } else {
      setSwipedDir(0);
      controls.start({ x: 0 });
    }
  };

  const closeSwipe = () => {
    setSwipedDir(0);
    controls.start({ x: 0 });
  };

  const handleAction = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    closeSwipe();
    if (type === 'restore') onRestore(item.id);
    if (type === 'delete') onDelete(item);
  };

  // Ultra-Responsive Global Dismissal (Capture Phase)
  useEffect(() => {
    const handleCaptureClick = (e) => {
      if (swipedDir !== 0) {
        closeSwipe();
      }
    };

    if (swipedDir !== 0) {
      window.addEventListener('mousedown', handleCaptureClick, true);
      window.addEventListener('touchstart', handleCaptureClick, true);
    }
    return () => {
      window.removeEventListener('mousedown', handleCaptureClick, true);
      window.removeEventListener('touchstart', handleCaptureClick, true);
    };
  }, [swipedDir]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-transparent min-h-[64px]">
      
      {/* Background Actions: Bento-Block Layer */}
      {!isDesktop && (
        <div className={`absolute inset-0 flex items-center justify-between px-2 z-0 ${swipedDir === 0 ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          {/* Restore Bento Block (Left) */}
          <button 
            onMouseDown={(e) => handleAction(e, 'restore')}
            onTouchStart={(e) => handleAction(e, 'restore')}
            className={`h-[calc(100%-12px)] aspect-square bg-apple-green rounded-2xl flex items-center justify-center text-white shadow-lg shadow-apple-green/20 transition-all ${
              swipedDir === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            <RotateCcw size={20} strokeWidth={2.5} />
          </button>

          {/* Delete Bento Block (Right) */}
          <button 
            onMouseDown={(e) => handleAction(e, 'delete')}
            onTouchStart={(e) => handleAction(e, 'delete')}
            className={`h-[calc(100%-12px)] aspect-square bg-apple-red rounded-2xl flex items-center justify-center text-white shadow-lg shadow-apple-red/20 transition-all ${
              swipedDir === -1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            <Trash2 size={20} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Foreground Layer (Z-10): The Moveable Card */}
      <motion.div
        drag={!isDesktop ? "x" : false}
        dragConstraints={{ left: -80, right: 80 }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className={`relative z-10 flex items-center justify-between py-3 px-4 w-full min-h-[64px] border select-none transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-[#1C1C1E] border-white/5 shadow-lg' 
            : 'bg-white border-zinc-200 shadow-sm'
        } rounded-2xl cursor-default ${!isDesktop ? 'active:cursor-grabbing' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/5 flex-shrink-0">
            <Trash2 size={16} className="text-[#86868B] dark:text-[#A1A1AA]" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <h4 className="text-[15px] font-semibold tracking-tight truncate dark:text-white leading-tight">{item.title}</h4>
            <p className="text-[10px] text-[#86868B] dark:text-[#A1A1AA] font-medium mt-1 leading-tight">Deleted {new Date(item.deletedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Desktop Actions: Static Bento-Style Buttons (Solid Architecture) */}
        {isDesktop && (
          <div className="hidden lg:flex items-center gap-2 pr-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onRestore(item.id); }}
              className="w-10 h-10 rounded-xl bg-[#34C759] text-white flex items-center justify-center hover:bg-[#28a745] transition-all duration-200 hover:scale-105 focus:outline-none shadow-sm"
            >
              <RotateCcw size={20} strokeWidth={2.5} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="w-10 h-10 rounded-xl bg-[#FF3B30] text-white flex items-center justify-center hover:bg-[#c42b23] transition-all duration-200 hover:scale-105 focus:outline-none shadow-sm"
            >
              <Trash2 size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const Trash = () => {
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const { data: trashItems, isLoading } = useQuery({
    queryKey: ['trash'],
    queryFn: fetchTrash
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => updateTask(id, { isDeleted: false, deletedAt: null }),
    onSuccess: () => {
      queryClient.invalidateQueries(['trash']);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['stats']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['trash']);
      setConfirmingDelete(null);
    }
  });

  const emptyMutation = useMutation({
    mutationFn: emptyTrash,
    onSuccess: () => queryClient.invalidateQueries(['trash'])
  });

  const handleDeleteRequest = (item) => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      deleteMutation.mutate(item.id);
    } else {
      setConfirmingDelete(item);
    }
  };

  return (
    <div className="w-full min-h-screen pb-32">
      {/* Bento-Style Header Architecture */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-4 mb-6">
         {/* Section 1: Page Identity (Stationary Anchor) */}
         <div className="flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-apple-red flex items-center justify-center shadow-lg shadow-apple-red/20 flex-shrink-0">
                <Trash2 size={24} color="white" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-white whitespace-nowrap">Trash Can</h1>
                <p className="text-[#86868B] dark:text-[#A1A1AA] font-medium text-sm whitespace-nowrap">Items waiting for permanent deletion.</p>
            </div>
         </div>
         
         {trashItems?.length > 0 && (
           <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
             <motion.button 
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => emptyMutation.mutate()}
              className="h-[44px] bg-apple-red/10 dark:bg-apple-red/20 text-apple-red px-8 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-apple-red/20 transition-all border border-apple-red/10 dark:border-apple-red/20 w-full sm:w-auto"
             >
               <AlertCircle size={18} />
               <span>Empty Trash</span>
             </motion.button>
           </div>
         )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative overflow-hidden">












        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-apple-blue/20 border-t-apple-blue rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#86868B] dark:text-[#A1A1AA] font-medium">Syncing trash...</p>
          </div>
        ) : trashItems?.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {trashItems.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative"
              >
                <SwipeableTrashItem 
                  item={item} 
                  onRestore={(id) => restoreMutation.mutate(id)}
                  onDelete={handleDeleteRequest}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-24 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mx-auto">
               <Trash2 size={40} className="text-[#86868B] dark:text-[#3A3A3C]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold dark:text-white">Nothing to see here</h3>
              <p className="text-[#86868B] dark:text-[#A1A1AA] max-w-xs mx-auto font-medium text-sm">
                Your trash is currently empty.
              </p>
            </div>
          </div>
        )}
      </div>


      <ConfirmationModal 
        isOpen={!!confirmingDelete}
        onClose={() => setConfirmingDelete(null)}
        onConfirm={() => deleteMutation.mutate(confirmingDelete.id)}
        title="Permanent Delete?"
        message={`"${confirmingDelete?.title}" will be permanently removed from the database.`}
      />
    </div>
  );
};

export default Trash;
