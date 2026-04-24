import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStats, fetchTasks, updateTask, trashTask } from '../api/tasks';
import { useAuthStore } from '../store/authStore';
import BentoGrid from '../components/bento/BentoGrid';
import BentoCard from '../components/bento/BentoCard';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Button from '../components/ui/Button';
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmingTrash, setConfirmingTrash] = useState(null);
  const queryClient = useQueryClient();
  const tasksPerPage = 10;

  // 1. Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  });

  // 2. Fetch Tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', { isDeleted: 'false' }],
    queryFn: () => fetchTasks({ isDeleted: 'false' })
  });

  const todayTasks = tasks?.filter(t => !t.isCompleted) || [];
  const totalPages = Math.ceil(todayTasks.length / tasksPerPage);
  const paginatedTasks = todayTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

  // 3. Reset page if it's now out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const toggleComplete = useMutation({
    mutationFn: (task) => updateTask(task.id, { isCompleted: !task.isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['stats']);
    }
  });

  const moveTaskToTrash = useMutation({
    mutationFn: (id) => trashTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['stats']);
      setConfirmingTrash(null);
    }
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Circular Progress Constants
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = stats?.completionRate || 0;
  const offset = circumference - (progress / 100) * circumference;

  const cardStyle = "bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[2rem] border-none shadow-none hover:shadow-xl transition-all duration-500";

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-1000">
      {/* Top Greeting & Action - No side padding for perfect edge alignment */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1D1D1F] dark:text-white leading-tight">
            {getGreeting()}, <span className="text-apple-blue">{user?.name?.split(' ')[0] || 'Focus User'}</span>
          </h1>
          <p className="text-[#86868B] dark:text-[#A1A1AA] mt-1 font-medium">
            Keep pushing forward.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full md:w-auto"
        >
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="!bg-apple-blue !text-white px-7 h-11 shadow-[0_8px_20px_rgba(0,122,255,0.3)] hover:shadow-[0_8px_25px_rgba(0,122,255,0.45)] transition-all font-bold rounded-xl flex items-center justify-center gap-2 w-full md:w-auto text-[15px]"
          >
            <Plus size={18} strokeWidth={3} />
            <span>New Task</span>
          </Button>
        </motion.div>
      </header>

      {/* Top Grid: Reduced gap and fixed height h-40 (160px) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Completion (col-span-2) - High-Fidelity Target Design */}
        <BentoCard span={2} stagger={0} className="relative overflow-hidden !bg-gradient-to-br !from-[#007AFF] !to-[#0051FF] rounded-[2.5rem] h-48 p-8 flex flex-col justify-between group shadow-xl shadow-blue-500/20" style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0051FF 100%)' }}>
          {/* Enhanced Concentric Rings Background */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/6 pointer-events-none opacity-20 z-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-white/80"
                style={{ 
                  width: `${i * 90}px`, 
                  height: `${i * 90}px`,
                  opacity: 1 - (i * 0.15)
                }}
              />
            ))}
          </div>

          {/* Top Info & Larger Target Icon */}
          <div className="flex justify-between items-start relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.25em]">Completion Rate</span>
              <span className="text-6xl font-black text-white tracking-tighter">{progress}%</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-inner">
              <div className="w-6 h-6 rounded-full border-[2px] border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </div>
            </div>
          </div>

          {/* Bottom Info with Functional Progress Bar */}
          <div className="relative z-10 w-full">
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-4 backdrop-blur-sm">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] rounded-full"
              />
            </div>
            <p className="text-white font-bold text-base tracking-tight">
              {stats?.completed || 0} tasks done. <span className="text-white/70 font-medium ml-1 opacity-80">Keep the flow!</span>
            </p>
          </div>
        </BentoCard>

        {/* Card 2: High Priority - Fixed h-48 */}
        <BentoCard span={1} stagger={1} className={`${cardStyle} p-7 h-48 flex flex-col justify-between`}>
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <Zap size={22} className="text-green-500" fill="currentColor" />
          </div>
          <div>
            <p className="text-4xl font-black dark:text-white leading-none mb-2">{stats?.highPriority || 0}</p>
            <p className="text-[11px] font-black text-[#86868B] dark:text-[#A1A1AA] uppercase tracking-widest">High Priority</p>
          </div>
        </BentoCard>

        {/* Card 3: Pending - Fixed h-48 */}
        <BentoCard span={1} stagger={2} className={`${cardStyle} p-7 h-48 flex flex-col justify-between`}>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <Clock size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="text-4xl font-black dark:text-white leading-none mb-2">{stats?.pendingTasks || 0}</p>
            <p className="text-[11px] font-black text-[#86868B] dark:text-[#A1A1AA] uppercase tracking-widest">Pending Tasks</p>
          </div>
        </BentoCard>
      </div>

      {/* Today Section - Complete Rewrite for Robustness */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 relative pl-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-apple-blue rounded-full shadow-[0_0_8px_rgba(0,122,255,0.5)]" />
            <h2 className="text-2xl font-black dark:text-white tracking-tight">Today's Focus</h2>
          </div>
          {totalPages > 1 && (
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-[#86868B] uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Task Grid - Strict 10-element pagination */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center py-20"
              >
                <div className="w-12 h-12 border-4 border-apple-blue/20 border-t-apple-blue rounded-full animate-spin mb-4" />
                <p className="text-[#86868B] font-black tracking-tight">Updating Grid...</p>
              </motion.div>
            ) : paginatedTasks.length > 0 ? (
              <motion.div
                key={`page-${currentPage}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {paginatedTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <TaskCard 
                      task={task} 
                      isCompact={true}
                      onToggle={(t) => toggleComplete.mutate(t)}
                      onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }}
                      onTrash={(t) => setConfirmingTrash(t)}
                    />
                  </motion.div>
                ))}
                {/* Visual placeholders for empty slots to maintain grid stability */}
                {Array.from({ length: Math.max(0, tasksPerPage - paginatedTasks.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-[74px] rounded-2xl border-2 border-dashed border-zinc-100 dark:border-white/5 opacity-30 hidden md:block" />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${cardStyle} py-20 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-apple-blue/10`}
              >
                <div className="w-20 h-20 rounded-full bg-apple-blue/5 flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} className="text-apple-blue" />
                </div>
                <h3 className="text-3xl font-black dark:text-white mb-2 tracking-tight">All Tasks Completed</h3>
                <p className="text-[#86868B] dark:text-[#A1A1AA] text-lg max-w-[320px] font-medium leading-snug">
                  You've mastered today's goals. Enjoy the clarity.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 pt-8">
            <div className="flex items-center gap-2 bg-white/50 dark:bg-white/5 p-2 rounded-2xl backdrop-blur-xl border border-white/10 shadow-lg">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-10 transition-all text-[#1D1D1F] dark:text-white active:scale-95"
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
              
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className="p-2 transition-all hover:scale-110 active:scale-90"
                  >
                    <div className={`h-2 rounded-full transition-all duration-300 ${
                      currentPage === i + 1 
                        ? 'bg-apple-blue w-8 shadow-[0_0_8px_rgba(0,122,255,0.4)]' 
                        : 'bg-zinc-300 dark:bg-zinc-800 w-2'
                    }`} />
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-10 transition-all text-[#1D1D1F] dark:text-white active:scale-95"
              >
                <ChevronRight size={24} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modals */}
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }} 
        task={editingTask}
      />

      <ConfirmationModal 
        isOpen={!!confirmingTrash}
        onClose={() => setConfirmingTrash(null)}
        onConfirm={() => moveTaskToTrash.mutate(confirmingTrash.id)}
        title="Move to Trash?"
        message={`"${confirmingTrash?.title}" will be archived.`}
      />
    </div>
  );
};

export default Dashboard;
