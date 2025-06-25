import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white/30 backdrop-blur-lg border border-white/30 shadow-2xl rounded-2xl p-8 ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard; 