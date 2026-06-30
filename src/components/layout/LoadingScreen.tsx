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
      <div className="relative mb-6">
        <Image 
          src="/graphics/mamalu-logo-transparent.png"
          alt="Mamalu Kitchen"
          width={200}
          height={200}
          className="object-contain"
          priority
        />
      </div>

      <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: 'var(--font-mossy), cursive' }}>
        Mamalu Kitchen
      </h1>
    </div>
  );
}
