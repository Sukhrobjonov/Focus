import React from 'react';
import { Link } from 'react-router-dom';
import BentoCard from '../components/bento/BentoCard';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-6" 
         style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <BentoCard className="flex flex-col items-center text-center gap-6 p-12" animate={true}>
          <h1 className="text-8xl font-black text-blue opacity-20" style={{ color: 'var(--accent-blue)' }}>404</h1>
          <div>
            <h2 className="text-2xl font-bold">Lost in Space?</h2>
            <p className="text-secondary mt-2">The page you're looking for doesn't exist or has moved.</p>
          </div>
          <Link to="/">
            <Button size="lg">Return Home</Button>
          </Link>
        </BentoCard>
      </div>
    </div>
  );
};

export default NotFound;
