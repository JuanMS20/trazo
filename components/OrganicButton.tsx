import React from 'react';

interface OrganicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export const OrganicButton: React.FC<OrganicButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-handwritten font-bold flex items-center justify-center transition-all duration-200 transform active:scale-95";
  
  const variants = {
    primary: "bg-primary text-off-black border-2 border-off-black shadow-offset-hard hover:shadow-offset-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] rounded-[5px_15px_8px_12px/12px_8px_15px_5px]",
    secondary: "bg-white text-off-black border-2 border-off-black shadow-offset-hard hover:shadow-offset-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] organic-radius",
    ghost: "bg-transparent hover:bg-black/5 text-off-black rounded-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};