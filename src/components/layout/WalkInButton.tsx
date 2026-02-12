"use client";

import { useState } from "react";
import { MessageCircle, X, ChefHat } from "lucide-react";

export function WalkInButton() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {expanded && (
        <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 p-5 w-72 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-stone-900">Walk-In Customers</h3>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-stone-400 hover:text-stone-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-stone-600 mb-4">
            Feeling spontaneous? Contact us on WhatsApp to check our last-minute availability!
          </p>
          <a
            href="https://wa.me/971527479512?text=Hi!%20I%27d%20like%20to%20check%20walk-in%20availability"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 animate-bounce"
        style={{ animationDuration: "2s" }}
        aria-label="Walk-in Customers"
      >
        <ChefHat className="h-7 w-7" />
        {!expanded && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold">
            !
          </span>
        )}
      </button>
    </div>
  );
}
