import React, { useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { CheckCircle2, Pencil, Trash2, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useQueryClient } from '@tanstack/react-query';

const TaskCard = ({ task, onToggle, onEdit, onTrash, isCompact = false }) => {
  const { theme } = useAuthStore();
  const isDarkMode = theme === 'dark';
  const queryClient = useQueryClient();
  
  const controls = useAnimation();
  const x = useMotionValue(0);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [swipedDir, setSwipedDir] = React.useState(0); // 0: none, 1: edit (right), -1: trash (left)

  // Silent Background Sync (Alternative to Sockets)
  // Refreshes the list when a completed task is old enough to be in trash
  useEffect(() => {
    if (task.isCompleted && task.completedAt) {
      const msIn24h = 24 * 60 * 60 * 1000;
      const diff = Date.now() - new Date(task.completedAt).getTime();
      const delay = msIn24h - diff;

      if (delay > 0) {
        const timer = setTimeout(() => {
          queryClient.invalidateQueries(['tasks']);
          queryClient.invalidateQueries(['stats']);
        }, delay + 5000); // 5s buffer for backend cron
        return () => clearTimeout(timer);
      }
    }
  }, [task.isCompleted, task.completedAt, queryClient]);

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
    if (type === 'edit') onEdit(task);
    if (type === 'trash') onTrash(task);
  };

  // Ultra-Responsive Global Dismissal (Capture Phase)
  useEffect(() => {
    const handleCaptureClick = (e) => {
      if (swipedDir !== 0) {
        // If clicking outside the swiped actions, close it instantly
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
    <div className={`relative w-full rounded-2xl overflow-hidden bg-transparent ${isCompact ? 'h-[3.75rem]' : 'min-h-[4rem]'}`}>
      
      {/* Background Actions: Bento-Block Layer */}
      {!isDesktop && (
        <div className={`absolute inset-0 flex items-center justify-between px-2 z-0 ${swipedDir === 0 ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          {/* Edit Block (Visible on Right Swipe) */}
          <button 
            onMouseDown={(e) => handleAction(e, 'edit')}
            onTouchStart={(e) => handleAction(e, 'edit')}
            className={`h-[calc(100%-12px)] aspect-square bg-apple-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-apple-blue/20 transition-all ${
              swipedDir === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            <Pencil size={20} strokeWidth={2.5} />
          </button>

          {/* Delete Block (Visible on Left Swipe) */}
          <button 
            onMouseDown={(e) => handleAction(e, 'trash')}
            onTouchStart={(e) => handleAction(e, 'trash')}
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
        className={`relative z-10 flex items-center justify-between ${isCompact ? 'py-2' : 'py-3'} px-4 w-full ${isCompact ? 'h-[3.75rem]' : 'min-h-[4rem]'} border select-none transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-[#1C1C1E] border-white/5 shadow-lg' 
            : 'bg-white border-zinc-200 shadow-sm'
        } rounded-2xl cursor-default ${!isDesktop ? 'active:cursor-grabbing' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(task); }}
            className="w-6 h-6 rounded-full border-2 border-[#D2D2D7] dark:border-[#424245] flex items-center justify-center transition-all bg-transparent flex-shrink-0 cursor-pointer"
          >
            {task.isCompleted && <CheckCircle2 size={16} className="text-apple-blue" strokeWidth={3} />}
          </button>
          
          <div className="min-w-0 flex flex-col justify-center">
            <h4 className={`text-[0.9375rem] font-semibold tracking-tight truncate leading-tight ${
              task.isCompleted ? 'line-through text-[#86868B]' : 'text-[#1D1D1F] dark:text-white'
            }`}>
              {task.title}
            </h4>
            <div className="flex items-center gap-x-2 mt-1">
              <span className={`px-2 py-0.5 rounded-md text-[0.5625rem] font-bold uppercase tracking-widest ${
                task.priority === 'URGENT' ? 'bg-apple-red/10 text-apple-red' : 
                task.priority === 'HIGH' ? 'bg-apple-orange/10 text-apple-orange' : 'bg-black/5 dark:bg-white/5 text-[#86868B] dark:text-[#A1A1AA]'
              }`}>
                {task.priority}
              </span>
              {task.dueDate && (
                <div className="flex items-center gap-1 text-[#86868B] dark:text-[#A1A1AA] text-[0.625rem] font-medium">
                  <Calendar size={11} />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Actions: Static Bento-Style Buttons (Solid Architecture) */}
        {isDesktop && (
          <div className="hidden lg:flex items-center gap-2 pr-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="w-10 h-10 rounded-xl bg-[#007AFF] text-white flex items-center justify-center hover:bg-[#0056b3] transition-all duration-200 hover:scale-105 focus:outline-none shadow-sm"
            >
              <Pencil size={20} strokeWidth={2.5} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onTrash(task); }}
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

export default TaskCard;
