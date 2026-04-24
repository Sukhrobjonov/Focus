import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, updateTask, trashTask } from '../api/tasks';
import { ListTodo, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskModal from '../components/tasks/TaskModal';
import TaskCard from '../components/tasks/TaskCard';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Button from '../components/ui/Button';

const pageSlideVariants = {
  enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit: (direction) => ({ x: direction > 0 ? '-100%' : '100%' })
};

const Tasks = () => {
  const [direction, setDirection] = useState(0);

  const changePage = (newPage) => {
    setDirection(newPage > currentPage ? 1 : -1);
    setCurrentPage(newPage);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmingTrash, setConfirmingTrash] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(window.innerWidth < 768 ? 5 : 14);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleResize = () => setTasksPerPage(window.innerWidth < 768 ? 5 : 14);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', { isDeleted: 'false' }],
    queryFn: () => fetchTasks({ isDeleted: 'false' })
  });

  const filteredTasks = tasks?.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const toggleComplete = useMutation({
    mutationFn: ({ id, isCompleted }) => updateTask(id, { isCompleted: !isCompleted }),
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

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleTrashRequest = (task) => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      moveTaskToTrash.mutate(task.id);
    } else {
      setConfirmingTrash(task);
    }
  };

  return (
    <div className="w-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-4 mb-6">
         <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-apple-blue flex items-center justify-center shadow-lg shadow-apple-blue/20 flex-shrink-0">
                <ListTodo size={24} color="white" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-white whitespace-nowrap">Active Tasks</h1>
                <p className="text-[#86868B] dark:text-[#A1A1AA] font-medium text-sm whitespace-nowrap">Your current focus list.</p>
            </div>
         </div>

         <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
            <div className="relative w-full sm:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search focus..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="h-[44px] w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 pl-11 pr-4 text-[15px] text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-zinc-900 transition-all rounded-xl"
               />
            </div>
            <Button 
                onClick={() => setIsModalOpen(true)}
                className="h-[44px] !bg-apple-blue !text-white px-8 shadow-md shadow-apple-blue/20 hover:shadow-lg transition-all duration-300 font-bold text-[15px] border-none whitespace-nowrap flex items-center justify-center gap-2 rounded-xl shrink-0 w-full sm:w-auto"
            >
                <Plus size={20} strokeWidth={3} />
                <span>New Task</span>
            </Button>
         </div>
      </header>

      <div className="relative h-[364px] md:h-[516px] overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-apple-blue/20 border-t-apple-blue rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#86868B] dark:text-[#A1A1AA] font-medium">Syncing focus...</p>
          </div>
        ) : paginatedTasks.length > 0 ? (
          <AnimatePresence custom={direction} initial={false}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start absolute inset-x-0 top-0 will-change-transform"
            >
              <AnimatePresence mode="popLayout">
              {paginatedTasks.map((task) => (
                <motion.div 
                  key={task.id}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskCard 
                    task={task} 
                    isCompact={true}
                    onToggle={(t) => toggleComplete.mutate(t)}
                    onEdit={handleEdit}
                    onTrash={handleTrashRequest}
                  />
                </motion.div>
              ))}

              {/* Visual Placeholders for Empty Slots - Always visible for stability */}
              {Array.from({ length: Math.max(0, tasksPerPage - paginatedTasks.length) }).map((_, i) => (
                <div 
                  key={`empty-${i}`} 
                  className="h-[60px] rounded-2xl border border-dashed border-zinc-200 dark:border-white/10 opacity-20" 
                />
              ))}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="py-24 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mx-auto">
               <ListTodo size={40} className="text-[#86868B] dark:text-[#3A3A3C]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold dark:text-white">Clear Horizon</h3>
              <p className="text-[#86868B] dark:text-[#A1A1AA] max-w-xs mx-auto font-medium text-sm">
                You have no active tasks. Time to recharge.
              </p>
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 mt-6">
          <div className="flex items-center gap-2 md:gap-1 bg-white/50 dark:bg-[#1C1C1E]/80 p-1.5 md:p-1 rounded-2xl backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-lg">
            <button 
              onClick={() => changePage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-all focus:outline-none"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1 px-2 md:px-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => changePage(i + 1)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentPage === i + 1 
                      ? 'w-6 bg-apple-blue' 
                      : 'bg-[#D2D2D7] dark:bg-[#424245]'
                  }`}
                />
              ))}
            </div>

            <button 
              onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition-all focus:outline-none"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

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
        message={`"${confirmingTrash?.title}" will be stored in the trashbox for 14 days before permanent deletion.`}
      />
    </div>
  );
};

export default Tasks;
