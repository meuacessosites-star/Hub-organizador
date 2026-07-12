import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <svg
      className={`${className} select-none shrink-0`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rounded Square in Indigo */}
      <rect x="4" y="4" width="42" height="42" rx="10" fill="#4f46e5" />
      
      {/* Rounded Square in Indigo */}
      <rect x="4" y="54" width="42" height="42" rx="10" fill="#4f46e5" />
      
      {/* Rounded Square in Fuchsia */}
      <rect x="54" y="54" width="42" height="42" rx="10" fill="#d946ef" />
      
      {/* Arrow pointing up-right */}
      <path
        d="M58 42 L92 8 M72 8 L92 8 L92 28"
        stroke="#6366f1"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
