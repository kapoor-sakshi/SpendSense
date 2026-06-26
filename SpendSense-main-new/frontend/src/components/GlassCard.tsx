import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'purple' | 'blue' | 'green' | 'none';
  onClick?: () => void;
  id?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  glowColor = 'none', 
  onClick,
  id
}) => {
  const glowClasses = {
    none: 'border-slate-200/60 hover:border-slate-300/80 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)]',
    purple: 'border-purple-500/25 hover:border-purple-500/40 shadow-[0_8px_30px_rgba(124,58,237,0.04)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.08)]',
    blue: 'border-blue-500/25 hover:border-blue-500/40 shadow-[0_8px_30px_rgba(37,99,235,0.04)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]',
    green: 'border-emerald-500/25 hover:border-emerald-500/40 shadow-[0_8px_30px_rgba(16,185,129,0.04)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)]'
  };

  return (
    <div 
      onClick={onClick}
      id={id}
      className={`
        relative backdrop-blur-md bg-white/75 border rounded-2xl p-6
        transition-all duration-300 ease-out select-none
        ${onClick ? 'cursor-pointer transform hover:-translate-y-0.5' : ''}
        ${glowClasses[glowColor]}
        ${className}
      `}
    >
      {/* Premium Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl pointer-events-none" />
      {children}
    </div>
  );
};

export default GlassCard;
