import React from 'react';

interface GardenGlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const GardenGlassCard: React.FC<GardenGlassCardProps> = ({ children, className = '', style, onClick }) => {
  return (
    <div
      className={`bg-white/90 backdrop-blur-lg border border-white/40 shadow-2xl rounded-2xl p-8 hover:shadow-teal-100/20 transition-all duration-300 ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GardenGlassCard;
