"use client";

import { useState, useEffect } from "react";

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 300);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    // Fallback: hide after 2 seconds regardless
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 flex flex-col items-center justify-center transition-opacity duration-500 ${
        progress >= 100 ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Animated Logo */}
      <div className="relative mb-8">
        {/* Outer ring */}
        <div className="w-32 h-32 rounded-full border-4 border-amber-100 animate-pulse" />
        
        {/* Spinning ring */}
        <div 
          className="absolute inset-0 w-32 h-32 rounded-full border-4 border-transparent border-t-amber-500 animate-spin"
          style={{ animationDuration: '1s' }}
        />
        
        {/* Inner circle with chef hat icon */}
        <div className="absolute inset-4 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg 
            className="w-12 h-12 text-amber-500 animate-bounce" 
            style={{ animationDuration: '1.5s' }}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
      </div>

      {/* Brand name */}
      <h1 className="text-2xl font-bold text-stone-800 mb-2 animate-pulse">
        Mamalu Kitchen
      </h1>
      <p className="text-stone-500 text-sm mb-6">Feeding Families with Love</p>

      {/* Progress bar */}
      <div className="w-48 h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-200"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Floating food icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] text-4xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>🍳</div>
        <div className="absolute top-[30%] right-[15%] text-3xl animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.2s' }}>🧁</div>
        <div className="absolute bottom-[25%] left-[20%] text-3xl animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '1.8s' }}>🍕</div>
        <div className="absolute bottom-[30%] right-[10%] text-4xl animate-bounce" style={{ animationDelay: '0.9s', animationDuration: '2.4s' }}>👨‍🍳</div>
        <div className="absolute top-[50%] left-[5%] text-2xl animate-bounce" style={{ animationDelay: '1.2s', animationDuration: '2s' }}>🥗</div>
        <div className="absolute top-[15%] right-[25%] text-2xl animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '2.1s' }}>🍪</div>
      </div>
    </div>
  );
}
