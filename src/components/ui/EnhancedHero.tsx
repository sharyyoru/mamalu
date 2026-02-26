"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  ChefHat, 
  Play, 
  Calendar, 
  Star, 
  Heart,
  Sparkles,
  ArrowRight
} from "lucide-react";
import FloatingDoodles from "./FloatingDoodles";

interface EnhancedHeroProps {
  onVideoOpen?: () => void;
}

export default function EnhancedHero({ onVideoOpen }: EnhancedHeroProps) {
  const [mounted, setMounted] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);

  const stats = [
    { value: "2000+", label: "Happy Kids", icon: Heart },
    { value: "500+", label: "Classes Held", icon: ChefHat },
    { value: "4.9", label: "Rating", icon: Star },
  ];

  useEffect(() => {
    setMounted(true);
    
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <section className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden">
      {/* Animated background doodles */}
      <FloatingDoodles density="high" interactive={true} enableParallax={true} theme="mixed" />
      
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff8c6b' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Animated badge */}
          <div className="animate-hero-text animate-delay-200">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-orange-200 mb-6">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">Dubai's #1 Family Cooking Experience</span>
              <Sparkles className="w-4 h-4 text-orange-500" />
            </div>
          </div>

          {/* Main headline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display text-gray-900 leading-tight animate-hero-text">
              <span className="block">Cooking Fun</span>
              <span className="block text-orange-500">for Everyone!</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-hero-text animate-delay-300">
              Join us at Mamalu Kitchen for unforgettable cooking adventures that bring families together, 
              one delicious recipe at a time.
            </p>
          </div>

          {/* Animated stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 animate-hero-text animate-delay-400">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className={`text-center transition-all duration-500 ${
                  currentStat === index ? 'scale-110' : 'scale-100 opacity-70'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <stat.icon className="w-5 h-5 text-orange-500" />
                  <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                </div>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-hero-button">
            <Button 
                size="lg" 
                className="button-glow bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.dispatchEvent(new CustomEvent("openMamaluMenu"))}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book a Class
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onVideoOpen}
              className="button-glow border-2 border-orange-300 text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Video
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 items-center animate-hero-text animate-delay-600">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm text-gray-600 ml-2">4.9/5 Rating</span>
            </div>
            <div className="text-sm text-gray-500">•</div>
            <div className="text-sm text-gray-600">Trusted by 2000+ families</div>
            <div className="text-sm text-gray-500">•</div>
            <div className="text-sm text-gray-600">Dubai's favorite cooking school</div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-10 animate-doodle-float">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
          <ChefHat className="w-8 h-8 text-orange-500" />
        </div>
      </div>
      
      <div className="absolute bottom-20 left-10 animate-doodle-bounce">
        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
          <Heart className="w-6 h-6 text-pink-500" />
        </div>
      </div>
    </section>
  );
}
