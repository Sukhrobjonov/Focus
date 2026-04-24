import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, updateTask, trashTask } from '../api/tasks';
import { ListTodo, Search, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskModal from '../components/tasks/TaskModal';
import TaskCard from '../components/tasks/TaskCard';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Button from '../components/ui/Button';

const Tasks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmingTrash, setConfirmingTrash] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', { isDeleted: 'false' }],
    queryFn: () => fetchTasks({ isDeleted: 'false' })
  });

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
    <div className="w-full min-h-screen pb-32">
      {/* Bento-Style Header Architecture */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-4 mb-6">
         {/* Section 1: Page Identity (Stationary Anchor) */}
         <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-apple-blue flex items-center justify-center shadow-lg shadow-apple-blue/20 flex-shrink-0">
                <ListTodo size={24} color="white" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-white whitespace-nowrap">Active Tasks</h1>
                <p className="text-[#86868B] dark:text-[#A1A1AA] font-medium text-sm whitespace-nowrap">Your current focus list.</p>
            </div>
         </div>

         {/* Section 2: Action Group (Clean Bento-Wrap) */}
         <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
            <div className="relative w-full sm:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search focus..." 
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative overflow-hidden">













        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-apple-blue/20 border-t-apple-blue rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#86868B] dark:text-[#A1A1AA] font-medium">Syncing focus...</p>
          </div>
        ) : tasks?.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative"
              >
                <TaskCard 
                  task={task} 
                  onToggle={(t) => toggleComplete.mutate(t)}
                  onEdit={handleEdit}
                  onTrash={handleTrashRequest}
                />
              </motion.div>
            ))}
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
