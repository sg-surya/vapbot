import React from 'react';

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg 
    viewBox="0 0 512 512" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff8a00" />
        <stop offset="100%" stop-color="#e52e71" />
      </linearGradient>
      
      <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur2" />
        <feMerge>
          <feMergeNode in="blur2" />
          <feMergeNode in="blur1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g filter="url(#neonGlow)">
      <g stroke="url(#brandGradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="256" y1="186" x2="196" y2="290" />
        <line x1="256" y1="186" x2="316" y2="290" />
        <line x1="196" y1="290" x2="316" y2="290" />
      </g>

      <g fill="#0f0f13" stroke="url(#brandGradient)" strokeWidth="10">
        <circle cx="256" cy="186" r="14" />
        <circle cx="196" cy="290" r="14" />
        <circle cx="316" cy="290" r="14" />
      </g>

      <path d="M 156 116 
               H 356 
               A 60 60 0 0 1 416 176 
               V 296 
               A 60 60 0 0 1 356 356 
               H 276 
               C 276 386 256 416 206 426 
               C 236 406 236 376 236 356 
               H 156 
               A 60 60 0 0 1 96 296 
               V 176 
               A 60 60 0 0 1 156 116 Z" 
            fill="none" 
            stroke="url(#brandGradient)" 
            strokeWidth="16" 
            strokeLinecap="round" 
            strokeLinejoin="round" />
    </g>
  </svg>
);
