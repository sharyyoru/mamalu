"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChefHat, Users, Baby, Cake, ArrowRight } from "lucide-react";

interface ServiceCardProps {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: any;
  color: string;
  href: string;
  emoji: string;
  image: string;
  index?: number;
}

export default function EnhancedServiceCard({
  id,
  title,
  category,
  description,
  icon: Icon,
  color,
  href,
  emoji,
  image,
  index = 0,
}: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <Link
      href={href}
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className="relative overflow-hidden rounded-3xl card-3d bg-white shadow-lg hover:shadow-2xl transition-all duration-500">
        {/* Image Container */}
        <div className="aspect-[4/5] relative overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className={`object-cover transition-all duration-700 ${
              isHovered ? "scale-110" : "scale-100"
            } ${!isImageLoaded ? "blur-sm" : ""}`}
            onLoad={() => setIsImageLoaded(true)}
          />
          
          {/* Gradient Overlay */}
          <div 
            className={`absolute inset-0 bg-gradient-to-t transition-all duration-500 ${
              isHovered 
                ? "from-black/90 via-black/40 to-transparent" 
                : "from-black/70 via-black/20 to-transparent"
            }`}
          />
          
          {/* Floating Emoji */}
          <div 
            className={`absolute top-4 right-4 text-4xl transition-all duration-500 ${
              isHovered ? "scale-125 rotate-12" : "scale-100 rotate-0"
            }`}
          >
            {emoji}
          </div>
          
          {/* Category Badge */}
          <div 
            className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white transition-all duration-500 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
            style={{
              background: color,
            }}
          >
            {category}
          </div>
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            {/* Icon */}
            <div 
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-xl mb-4 transition-all duration-500 ${
                isHovered ? "scale-110 rotate-6" : "scale-100 rotate-0"
              }`}
            >
              <Icon className="h-7 w-7 text-white" />
            </div>
            
            {/* Title */}
            <h3 className="text-2xl font-bold mb-2 transition-all duration-500">
              {title}
            </h3>
            
            {/* Description */}
            <p className={`text-white/90 text-sm leading-relaxed transition-all duration-500 ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-80 translate-y-1"
            }`}>
              {description}
            </p>
            
            {/* CTA */}
            <div className={`flex items-center gap-2 mt-4 font-medium transition-all duration-500 ${
              isHovered ? "translate-x-2 opacity-100" : "translate-x-0 opacity-90"
            }`}>
              <span>Explore</span>
              <ArrowRight className={`h-4 w-4 transition-all duration-500 ${
                isHovered ? "translate-x-2" : "translate-x-0"
              }`} />
            </div>
          </div>
        </div>
        
        {/* Interactive Border Effect */}
        <div 
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: color,
            padding: '2px',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
            WebkitMaskComposite: 'xor',
          }}
        />
        
        {/* Shimmer Effect on Hover */}
        <div 
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: isHovered ? 'shimmer 1.5s infinite' : 'none',
          }}
        />
      </div>
    </Link>
  );
}
