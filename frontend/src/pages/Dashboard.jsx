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
  Zap,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmingTrash, setConfirmingTrash] = useState(null);
  const queryClient = useQueryClient();
  const tasksPerPage = 4;

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
            className="!bg-apple-blue !text-white px-6 h-11 shadow-lg shadow-apple-blue/20 hover:shadow-apple-blue/40 transition-all font-bold rounded-2xl flex items-center justify-center gap-2 w-full md:w-auto text-[15px]"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Create Task</span>
          </Button>
        </motion.div>
      </header>

      {/* Top Grid: Reduced gap and fixed height h-40 (160px) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Completion (col-span-2) - Fixed h-40, Compact padding */}
        <BentoCard span={2} stagger={0} className={`${cardStyle} p-6 h-40 flex items-center justify-center gap-5`}>
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="24"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="6"
                className="text-apple-blue/10"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="24"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 24}
                initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 24) - (progress / 100) * (2 * Math.PI * 24) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
                className="text-apple-blue"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-apple-blue">{progress}%</span>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-lg font-bold dark:text-white leading-tight">Completion Rate</h3>
            <p className="text-[#86868B] dark:text-[#A1A1AA] font-semibold text-sm mt-0.5">
              {stats?.completedTasks || 0} tasks done
            </p>
          </div>
        </BentoCard>

        {/* Card 2: High Priority - Fixed h-40, Small icon */}
        <BentoCard span={1} stagger={1} className={`${cardStyle} p-5 h-40 flex flex-col justify-between`}>
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Zap size={18} className="text-green-500" fill="currentColor" />
          </div>
          <div>
            <p className="text-3xl font-black dark:text-white leading-none mb-1">{stats?.highPriority || 0}</p>
            <p className="text-xs font-bold text-[#86868B] dark:text-[#A1A1AA] uppercase tracking-wider">High Priority</p>
          </div>
        </BentoCard>

        {/* Card 3: Pending - Fixed h-40, Small icon */}
        <BentoCard span={1} stagger={2} className={`${cardStyle} p-5 h-40 flex flex-col justify-between`}>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Clock size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-3xl font-black dark:text-white leading-none mb-1">{stats?.pendingTasks || 0}</p>
            <p className="text-xs font-bold text-[#86868B] dark:text-[#A1A1AA] uppercase tracking-wider">Pending Tasks</p>
          </div>
        </BentoCard>
      </div>

      {/* Today Section with balanced gap (space-y-10) and no side padding */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 relative pl-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-apple-blue rounded-full" />
            <h2 className="text-xl font-black dark:text-white tracking-tight">Today's Focus</h2>
          </div>
        </div>

        {/* Task Grid with strict gaps and symmetrical padding */}
        <div className="min-h-[320px] py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-apple-blue/20 border-t-apple-blue rounded-full animate-spin mb-4" />
              <p className="text-[#86868B] font-bold">Syncing...</p>
            </div>
          ) : paginatedTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentPage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="contents"
                >
                  {paginatedTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      isCompact={true}
                      onToggle={(t) => toggleComplete.mutate(t)}
                      onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }}
                      onTrash={(t) => setConfirmingTrash(t)}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <BentoCard className={`${cardStyle} py-20 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-apple-blue/10`}>
              <div className="w-16 h-16 rounded-full bg-apple-blue/5 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-apple-blue" />
              </div>
              <h3 className="text-2xl font-black dark:text-white mb-1">All Clear</h3>
              <p className="text-[#86868B] dark:text-[#A1A1AA] text-base max-w-[280px] font-medium leading-snug">
                You're all caught up. Take a breath.
              </p>
            </BentoCard>
          )}
        </div>

        {/* Bottom Pagination for Symmetry */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <div className="flex items-center gap-1.5 bg-white/50 dark:bg-white/5 p-1 rounded-xl backdrop-blur-md">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-all focus:outline-none"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-1 px-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                      currentPage === i + 1 ? 'bg-apple-blue w-3' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`} 
                  />
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-all focus:outline-none"
              >
                <ChevronRight size={18} />
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
