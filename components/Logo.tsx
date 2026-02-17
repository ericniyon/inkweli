
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', variant = 'dark' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const mainColor = variant === 'dark' ? 'text-slate-900' : 'text-white';
  const accentColor = '#4F46E5'; // Indigo-600

  return (
    <div className={`relative flex items-center justify-center ${sizes[size]} ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Abstract 'U' / Vessel of knowledge */}
        <path 
          d="M25 30V65C25 78.8071 36.1929 90 50 90C63.8071 90 75 78.8071 75 65V30" 
          stroke="currentColor" 
          strokeWidth="12" 
          strokeLinecap="round"
          className={mainColor}
        />
        
        {/* Upward terminal for the 'U' - Arrowhead motif */}
        <path 
          d="M75 30L65 40M75 30L85 40" 
          stroke="currentColor" 
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={mainColor}
        />

        {/* The 'Think Up' Spark / Rising Idea */}
        <circle 
          cx="50" 
          cy="45" 
          r="10" 
          fill={accentColor}
          className="animate-pulse"
        />
        
        {/* Subtle decorative 'ascent' lines */}
        <path 
          d="M50 25V10" 
          stroke={accentColor} 
          strokeWidth="6" 
          strokeLinecap="round"
          style={{ opacity: 0.6 }}
        />
      </svg>
    </div>
  );
};

export default Logo;
