import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Flag, Save } from 'lucide-react';
import Modal from '../ui/Modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, updateTask } from '../../api/tasks';
import { toast } from 'sonner';

const TaskModal = ({ isOpen, onClose, task = null }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(0);

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setPriority(task.priority || 'MEDIUM');
    } else {
      setTitle('');
      setPriority('MEDIUM');
    }
    setError(false);
  }, [task, isOpen]);

  const mutation = useMutation({
    mutationFn: (taskData) => isEditing ? updateTask(task.id, taskData) : createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['stats']);
      toast.success(isEditing ? 'Task updated' : 'Task created');
      onClose();
    },
    onError: (err) => {
      const message = err.response?.data?.message || 'Failed to process task';
      toast.error('Action Failed', { description: message });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(true);
      setShake(prev => prev + 1);
      // No validation toast per user request
      return;
    }
    setError(false);
    mutation.mutate({ title, priority });
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    if (error) {
      setError(false);
    }
  };

  const priorities = [
    { id: 'LOW', label: 'Low', color: 'bg-zinc-100 dark:bg-white/5 text-zinc-500' },
    { id: 'MEDIUM', label: 'Medium', color: 'bg-zinc-100 dark:bg-white/5 text-zinc-500' },
    { id: 'HIGH', label: 'High', color: 'bg-apple-orange/10 text-apple-orange' },
    { id: 'URGENT', label: 'Urgent', color: 'bg-apple-red/10 text-apple-red' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Task" : "New Task"}>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#86868B] dark:text-white/40 uppercase tracking-widest px-1">
            {isEditing ? 'Task Title' : 'What needs to be done?'}
          </label>
          <motion.div
            key={shake}
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <input 
              autoFocus
              type="text" 
              value={title}
              onChange={handleTitleChange}
              className={`dark-modal-input w-full h-14 rounded-2xl px-5 text-[17px] font-medium outline-none transition-all focus:outline-none ${
                error 
                ? 'border-apple-red focus:ring-apple-red/20 ring-2 ring-apple-red/10' 
                : 'focus:ring-2 focus:ring-apple-blue/20'
              }`}
              placeholder="Focus on..."
            />
          </motion.div>
          <div className="h-5"> {/* Reserved space to prevent layout jump */}
            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[13px] font-bold text-apple-red px-1"
                >
                  Title is required
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#86868B] dark:text-white/40 uppercase tracking-widest px-1">Priority Level</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {priorities.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id)}
                className={`h-11 rounded-xl text-[13px] font-bold transition-all border-2 flex items-center justify-center gap-2 ${
                  priority === p.id 
                    ? 'border-apple-blue bg-apple-blue/5 text-apple-blue' 
                    : 'border-transparent bg-zinc-50 dark:bg-white/5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10'
                }`}
              >
                <Flag size={14} fill={priority === p.id ? 'currentColor' : 'none'} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <motion.button 
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="dark-modal-btn-secondary flex-1 h-12 rounded-2xl font-bold transition-all focus:outline-none"
          >
            Cancel
          </motion.button>
          <motion.button 
            type="submit"
            disabled={mutation.isPending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`dark-modal-btn-primary flex-1 h-12 rounded-2xl font-bold transition-all focus:outline-none flex items-center justify-center gap-2 ${mutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? <Save size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />)}
            {mutation.isPending ? 'Syncing...' : (isEditing ? 'Save Changes' : 'Create Task')}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
