import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X } from 'lucide-react';
import Modal from './Modal';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmation">
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-apple-red/5 rounded-2xl border border-apple-red/10">
          <div className="w-12 h-12 rounded-full bg-apple-red/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="text-apple-red" size={24} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#1D1D1F] dark:text-white leading-tight">{title}</h3>
            <p className="text-[14px] text-[#86868B] dark:text-[#A1A1AA] font-medium mt-1">{message}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 text-[#1D1D1F] dark:text-white font-bold transition-all"
          >
            Cancel
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 h-12 rounded-2xl bg-apple-red text-white font-bold shadow-lg shadow-apple-red/20 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Move to Trash
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
