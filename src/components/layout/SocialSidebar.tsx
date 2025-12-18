"use client";

import { useState } from "react";
import { Instagram, Facebook, Youtube, Twitter, ChevronLeft, ChevronRight } from "lucide-react";

const socialLinks = [
  { name: "Instagram", href: "https://instagram.com/mamalukitchen", icon: Instagram, color: "hover:bg-pink-500" },
  { name: "Facebook", href: "https://facebook.com/mamalukitchen", icon: Facebook, color: "hover:bg-blue-600" },
  { name: "YouTube", href: "https://youtube.com/@mamalukitchen", icon: Youtube, color: "hover:bg-red-500" },
  { name: "Twitter", href: "https://twitter.com/mamalukitchen", icon: Twitter, color: "hover:bg-sky-500" },
];

export function SocialSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 hidden md:flex">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-rose-500 to-rose-600 rounded-r-lg flex items-center justify-center text-white shadow-lg hover:from-rose-600 hover:to-rose-700 transition-all"
      >
        {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>

      {/* Social Links Container */}
      <div
        className={`bg-white/95 backdrop-blur-sm shadow-xl rounded-r-2xl overflow-hidden transition-all duration-300 ${
          isExpanded ? "w-14 opacity-100" : "w-0 opacity-0"
        }`}
      >
        <div className="flex flex-col p-2 gap-2">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 ${social.color} hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg`}
                title={social.name}
              >
                <Icon className="h-5 w-5" />
              </a>
            );
          })}
        </div>
      </div>

      {/* Animated Decorative Elements */}
      <div className="absolute -left-2 top-0 w-4 h-4 bg-rose-300 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }} />
      <div className="absolute -left-1 bottom-0 w-3 h-3 bg-rose-200 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
    </div>
  );
}
