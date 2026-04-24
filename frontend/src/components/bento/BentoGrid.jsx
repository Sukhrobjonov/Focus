import React from 'react';

const BentoGrid = ({ children, className = '' }) => {
  return (
    <div className={`bento-grid ${className}`}>
      {children}
    </div>
  );
};

export default BentoGrid;
