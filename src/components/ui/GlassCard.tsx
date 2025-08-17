import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', style, onClick }) => {
  return (
    <div
      className={`bg-white/30 backdrop-blur-lg border border-white/30 shadow-2xl rounded-2xl p-8 ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard; 