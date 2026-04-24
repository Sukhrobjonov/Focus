import React from 'react';
import { motion } from 'framer-motion';

const BentoCard = ({ 
  children, 
  span = 1, 
  row = 1, 
  className = '', 
  animate = true,
  stagger = 0
}) => {

  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.98 } : false}
      animate={animate ? { opacity: 1, scale: 1 } : false}
      transition={{ 
        duration: 0.4, 
        delay: stagger * 0.08,
        ease: [0.23, 1, 0.32, 1] 
      }}
      whileHover={{ 
        scale: 1.01,
        y: -2,
        boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.1)",
      }}
      className={`bento-card cursor-pointer border border-black/5 dark:border-white/5 ${className}`}
      style={{
        transition: "background-color 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out"
      }}
    >
      {children}
    </motion.div>
  );
};

export default BentoCard;
