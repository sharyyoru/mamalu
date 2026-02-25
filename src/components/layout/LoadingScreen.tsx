"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide after 2 seconds
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${
        !isLoading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Cookie GIF Animation */}
      <div className="relative mb-6">
        <Image 
          src="/graphics/855807969076Cookie.gif"
          alt="Loading..."
          width={120}
          height={120}
          className="object-contain"
          priority
          unoptimized
        />
      </div>

      {/* Brand name */}
      <h1 className="text-2xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'var(--font-mossy), cursive' }}>
        Mamalu Kitchen
      </h1>
      <p className="text-stone-500 text-sm">Feeding Families with Love</p>
    </div>
  );
}
