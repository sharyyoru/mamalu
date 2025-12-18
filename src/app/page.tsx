"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import VideoPlayer from "@/components/layout/VideoPlayer";
import {
  ChefHat,
  Users,
  Baby,
  Cake,
  Calendar,
  Star,
  ArrowRight,
  Heart,
  Sparkles,
  Play,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const classTypes = [
  {
    id: "kids",
    title: "Kids Classes",
    description: "Fun cooking adventures for little chefs aged 4-12",
    icon: Baby,
    color: "from-[#ffa891] to-[#ff8c6b]",
    bgColor: "bg-pink-50",
    href: "/classes?type=kids",
    emoji: "👨‍🍳",
    image: "/images/class-kids.jpg",
  },
  {
    id: "family",
    title: "Family Classes",
    description: "Cook together, bond together - memories that last forever",
    icon: Users,
    color: "from-amber-200 to-stone-300",
    bgColor: "bg-amber-50",
    href: "/classes?type=family",
    emoji: "👨‍👩‍👧‍👦",
    image: "/images/class-family.jpg",
  },
  {
    id: "birthday",
    title: "Birthday Parties",
    description: "Celebrate with a unique cooking party experience",
    icon: Cake,
    color: "from-violet-400 to-purple-500",
    bgColor: "bg-violet-50",
    href: "/classes?type=birthday",
    emoji: "🎂",
    image: "/images/class-birthday.jpg",
  },
  {
    id: "adults",
    title: "Adult Classes",
    description: "Master new cuisines and techniques with expert guidance",
    icon: ChefHat,
    color: "from-emerald-400 to-teal-500",
    bgColor: "bg-emerald-50",
    href: "/classes?type=adults",
    emoji: "🍳",
    image: "/images/class-adults.jpg",
  },
];

const carouselClasses = [
  { id: 1, title: "Little Bakers Workshop", image: "/images/carousel-1.jpg", price: "AED 150", date: "Dec 21" },
  { id: 2, title: "Family Pizza Night", image: "/images/carousel-2.jpg", price: "AED 200", date: "Dec 22" },
  { id: 3, title: "Kids Holiday Cookies", image: "/images/carousel-3.jpg", price: "AED 120", date: "Dec 23" },
  { id: 4, title: "Pasta Making Class", image: "/images/carousel-4.jpg", price: "AED 180", date: "Dec 24" },
  { id: 5, title: "Healthy Snacks", image: "/images/carousel-5.jpg", price: "AED 130", date: "Dec 26" },
];

const testimonials = [
  {
    quote: "My kids absolutely love coming here! They've learned so much and actually want to help in the kitchen now.",
    author: "Sarah M.",
    role: "Mom of 2",
  },
  {
    quote: "The family classes are amazing. It's become our favorite weekend activity!",
    author: "Ahmed K.",
    role: "Dad of 3",
  },
  {
    quote: "Best birthday party ever! All the kids had a blast making their own pizzas.",
    author: "Fatima A.",
    role: "Party Parent",
  },
];

// Animated Food Doodles SVG Components
const FoodDoodle1 = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 100 100" fill="none">
    <path d="M50 10C55 25 70 30 70 50C70 70 55 80 50 90C45 80 30 70 30 50C30 30 45 25 50 10Z" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
    <circle cx="50" cy="50" r="8" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const FoodDoodle2 = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 80 80" fill="none">
    <path d="M10 40C10 40 20 20 40 20C60 20 70 40 70 40C70 40 60 60 40 60C20 60 10 40 10 40Z" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M30 35L35 45L45 30L50 45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FoodDoodle3 = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 60 60" fill="none">
    <circle cx="30" cy="30" r="20" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"/>
    <path d="M20 25C25 20 35 20 40 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M25 35C28 38 32 38 35 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Pizza Slice Doodle
const PizzaDoodle = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 80 80" fill="none">
    <path d="M40 10L10 70H70L40 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="30" cy="50" r="5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="50" cy="50" r="5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="40" cy="35" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Cupcake Doodle
const CupcakeDoodle = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 60 70" fill="none">
    <path d="M15 35H45L40 65H20L15 35Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 35C10 35 15 10 30 10C45 10 50 35 50 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="30" cy="20" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M30 5V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Spoon Doodle
const SpoonDoodle = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 30 80" fill="none">
    <ellipse cx="15" cy="15" rx="12" ry="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M15 25V75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Cookie Doodle
const CookieDoodle = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 60 60" fill="none">
    <circle cx="30" cy="30" r="25" stroke="currentColor" strokeWidth="2"/>
    <circle cx="20" cy="20" r="3" fill="currentColor"/>
    <circle cx="38" cy="25" r="3" fill="currentColor"/>
    <circle cx="25" cy="38" r="3" fill="currentColor"/>
    <circle cx="40" cy="40" r="2" fill="currentColor"/>
    <circle cx="30" cy="30" r="2" fill="currentColor"/>
  </svg>
);

// Chef Hat Doodle
const ChefHatDoodle = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 60 60" fill="none">
    <path d="M15 40H45V55H15V40Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M10 25C10 15 20 10 30 10C40 10 50 15 50 25C50 35 45 40 45 40H15C15 40 10 35 10 25Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Whisk Doodle
const WhiskDoodle = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 40 80" fill="none">
    <path d="M20 5V30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 30C10 30 5 50 10 65C15 80 20 70 20 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M30 30C30 30 35 50 30 65C25 80 20 70 20 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 30C20 30 20 50 20 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SquiggleLine = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 200 30" fill="none">
    <path d="M0 15C20 5 30 25 50 15C70 5 80 25 100 15C120 5 130 25 150 15C170 5 180 25 200 15" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Wavy Line
const WavyLine = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 300 20" fill="none">
    <path d="M0 10Q25 0 50 10T100 10T150 10T200 10T250 10T300 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselClasses.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev + 1) % carouselClasses.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev - 1 + carouselClasses.length) % carouselClasses.length);
  };

  return (
    <>
      <VideoPlayer isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
      <div className="overflow-hidden">
      {/* Hero Section with Floating Elements */}
      <section className="relative min-h-[100vh] flex items-center bg-gradient-to-br from-stone-50 via-[#ff8c6b]/5 to-stone-100 overflow-hidden">
        {/* Animated Doodles Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Food Doodles */}
          <FoodDoodle1 className="absolute top-20 left-[5%] w-16 h-16 text-[#ff8c6b]/30 animate-bounce" style={{ animationDuration: '3s' }} />
          <FoodDoodle2 className="absolute top-40 right-[10%] w-20 h-20 text-stone-300 animate-pulse" />
          <FoodDoodle3 className="absolute bottom-32 left-[15%] w-14 h-14 text-[#ff8c6b]/30 animate-bounce" style={{ animationDuration: '2.5s' }} />
          <PizzaDoodle className="absolute top-[15%] right-[20%] w-16 h-16 text-stone-300/60 animate-bounce" style={{ animationDuration: '3.5s' }} />
          <CupcakeDoodle className="absolute bottom-[20%] right-[8%] w-14 h-16 text-[#ff8c6b]/40 animate-pulse" />
          <CookieDoodle className="absolute top-[60%] left-[8%] w-12 h-12 text-stone-300/50 animate-bounce" style={{ animationDuration: '4s' }} />
          <ChefHatDoodle className="absolute top-[10%] left-[25%] w-12 h-12 text-[#ff8c6b]/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <SpoonDoodle className="absolute bottom-[30%] left-[3%] w-8 h-20 text-stone-300/50 animate-bounce rotate-12" style={{ animationDuration: '3.2s' }} />
          <WhiskDoodle className="absolute top-[30%] right-[5%] w-10 h-20 text-[#ff8c6b]/30 animate-pulse -rotate-12" />
          
          {/* Squiggly Lines */}
          <SquiggleLine className="absolute top-1/4 left-0 w-48 text-[#ff8c6b]/20 animate-pulse" />
          <SquiggleLine className="absolute bottom-1/4 right-0 w-48 text-stone-200 rotate-180 animate-pulse" style={{ animationDelay: '1s' }} />
          <WavyLine className="absolute top-[45%] left-[10%] w-32 text-[#ff8c6b]/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <WavyLine className="absolute bottom-[15%] right-[15%] w-40 text-stone-200/60 rotate-12 animate-pulse" style={{ animationDelay: '1.5s' }} />
          
          {/* Floating Blobs */}
          <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-[#ff8c6b]/20 to-stone-200/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-56 h-56 bg-gradient-to-br from-[#ff8c6b]/20 to-stone-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-br from-stone-200/30 to-[#ff8c6b]/20 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '4s' }} />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full">
          {/* Hero Content */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-[#ff8c6b] px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-lg shadow-[#ff8c6b]/10 animate-bounce" style={{ animationDuration: '2s' }}>
              <Sparkles className="h-4 w-4" />
              #FeedingFamilies Since 2020
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-stone-900 tracking-tight leading-tight">
              Where Little Chefs
              <span className="block text-[#ff8c6b]">
                Become Big Cooks
              </span>
            </h1>
            
            <p className="mt-6 text-lg lg:text-xl text-stone-600 max-w-2xl mx-auto">
              Fun, healthy cooking classes for kids and families in Dubai. 
              Create delicious memories while learning essential life skills!
            </p>
          </div>

          {/* Hero Buttons - Fixed Icon Placement */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button size="lg" className="h-14 px-8 bg-[#ff8c6b] hover:bg-[#e67854] text-white shadow-xl shadow-[#ff8c6b]/30 text-base font-semibold rounded-full" asChild>
              <Link href="/classes" className="flex items-center gap-3">
                <Calendar className="h-5 w-5" />
                <span>Book a Class</span>
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 border-2 border-stone-300 hover:border-[#ff8c6b] hover:text-[#ff8c6b] bg-white/80 backdrop-blur-sm text-base font-semibold rounded-full"
              onClick={() => setIsVideoOpen(true)}
            >
              <div className="flex items-center gap-3">
                <Play className="h-5 w-5" />
                <span>Watch Our Story</span>
              </div>
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-6 lg:gap-12 mb-16 bg-white/60 backdrop-blur-sm rounded-2xl py-6 px-8 max-w-2xl mx-auto shadow-lg">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#ff8c6b]">2000+</div>
              <div className="text-sm text-stone-500 font-medium">Happy Kids</div>
            </div>
            <div className="hidden sm:block w-px bg-stone-200" />
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#ff8c6b]">500+</div>
              <div className="text-sm text-stone-500 font-medium">Classes Held</div>
            </div>
            <div className="hidden sm:block w-px bg-stone-200" />
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-extrabold text-[#ff8c6b] flex items-center gap-1">
                4.9 <Star className="h-6 w-6 text-[#ff8c6b] fill-[#ff8c6b]" />
              </div>
              <div className="text-sm text-stone-500 font-medium">Rating</div>
            </div>
          </div>

          {/* Floating Class Type Boxes - Mobile-first grid, Desktop floating */}
          <div className="relative lg:h-[550px] max-w-5xl mx-auto">
            {/* Mobile: Grid Layout */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:hidden mb-8">
              <Link href="/classes?type=kids" className="bg-white rounded-xl p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all active:scale-95">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                    <Baby className="h-6 w-6 text-pink-500" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-sm">Kids Classes</div>
                    <div className="text-xs text-stone-500">Ages 4-12</div>
                  </div>
                </div>
              </Link>
              <Link href="/classes?type=family" className="bg-white rounded-xl p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all active:scale-95">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-[#ff8c6b]/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#ff8c6b]" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-sm">Family Classes</div>
                    <div className="text-xs text-stone-500">Cook Together</div>
                  </div>
                </div>
              </Link>
              <Link href="/classes?type=birthday" className="bg-white rounded-xl p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all active:scale-95">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Cake className="h-6 w-6 text-violet-500" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-sm">Birthday Parties</div>
                    <div className="text-xs text-stone-500">Celebrate!</div>
                  </div>
                </div>
              </Link>
              <Link href="/classes?type=adults" className="bg-white rounded-xl p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all active:scale-95">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <ChefHat className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-sm">Adult Classes</div>
                    <div className="text-xs text-stone-500">Level Up</div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop: Floating Layout */}
            {/* Central Image - Using center.png, centered horizontally */}
            <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full overflow-hidden shadow-2xl border-4 border-white z-10">
              <Image
                src="/images/center.png"
                alt="Mamalu Kitchen"
                fill
                className="object-cover object-[center_20%] scale-110"
                priority
              />
            </div>

            {/* Floating Info Boxes with Images - Desktop only - Enhanced UI */}
            <Link href="/classes?type=kids" className="hidden lg:block absolute top-0 left-10 group z-20">
              <div className="relative bg-stone-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 border border-stone-200 hover:border-stone-400">
                <div className="w-48 h-32 relative">
                  <Image src="/images/kids-classes.png" alt="Kids Classes" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-4 bg-stone-50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👶</span>
                    <div className="font-bold text-stone-900">Kids Classes</div>
                  </div>
                  <div className="text-sm text-stone-500">Ages 4-12</div>
                  <div className="mt-2 text-xs font-semibold text-stone-800 flex items-center gap-1">
                    Book Now <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/classes?type=family" className="hidden lg:block absolute top-0 right-10 group z-20">
              <div className="relative bg-stone-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 border border-stone-200 hover:border-stone-400">
                <div className="w-48 h-32 relative">
                  <Image src="/images/family-classes.png" alt="Family Classes" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-4 bg-stone-50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👨‍👩‍👧</span>
                    <div className="font-bold text-stone-900">Family Classes</div>
                  </div>
                  <div className="text-sm text-stone-500">Cook Together</div>
                  <div className="mt-2 text-xs font-semibold text-stone-800 flex items-center gap-1">
                    Book Now <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/classes?type=birthday" className="hidden lg:block absolute bottom-10 left-5 group z-20">
              <div className="relative bg-stone-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 border border-stone-200 hover:border-stone-400">
                <div className="w-48 h-32 relative">
                  <Image src="/images/birthday-parties.png" alt="Birthday Parties" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-4 bg-stone-50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎂</span>
                    <div className="font-bold text-stone-900">Birthday Parties</div>
                  </div>
                  <div className="text-sm text-stone-500">Celebrate!</div>
                  <div className="mt-2 text-xs font-semibold text-stone-800 flex items-center gap-1">
                    Book Now <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/classes?type=adults" className="hidden lg:block absolute bottom-10 right-5 group z-20">
              <div className="relative bg-stone-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 border border-stone-200 hover:border-stone-400">
                <div className="w-48 h-32 relative">
                  <Image src="/images/adult-classes.png" alt="Adult Classes" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-4 bg-stone-50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👨‍🍳</span>
                    <div className="font-bold text-stone-900">Adult Classes</div>
                  </div>
                  <div className="text-sm text-stone-500">Master Skills</div>
                  <div className="mt-2 text-xs font-semibold text-stone-800 flex items-center gap-1">
                    Book Now <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Decorative circles around center */}
            <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-2 border-dashed border-[#ff8c6b]/30 animate-spin" style={{ animationDuration: '30s' }} />
            <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-stone-200" />
          </div>
        </div>
      </section>

      {/* Class Carousel Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-[#ff8c6b] via-[#e67854] to-[#ff8c6b] relative overflow-hidden">
        {/* Background Doodles */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <FoodDoodle1 className="absolute top-10 left-20 w-24 h-24 text-white" />
          <FoodDoodle2 className="absolute bottom-10 right-20 w-20 h-20 text-white" />
          <SquiggleLine className="absolute top-1/2 left-0 w-full text-white/30" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Upcoming Classes
            </h2>
            <p className="text-lg text-amber-100">
              Grab your spot before they fill up!
            </p>
          </div>

          {/* Carousel */}
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-0 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
            >
              <ChevronLeft className="h-6 w-6 text-stone-700" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
            >
              <ChevronRight className="h-6 w-6 text-stone-700" />
            </button>

            {/* Carousel Items */}
            <div className="flex items-center justify-center gap-4 lg:gap-6 px-12 lg:px-16 overflow-hidden">
              {/* Previous Item */}
              <div className="hidden md:block w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden opacity-60 flex-shrink-0 transition-all duration-500 shadow-lg border-4 border-white/30">
                <div className="w-full h-full bg-gradient-to-br from-[#ff8c6b]/30 to-[#ff8c6b]/50 flex items-center justify-center">
                  <span className="text-4xl">{classTypes[(currentSlide - 1 + classTypes.length) % classTypes.length]?.emoji || "🍳"}</span>
                </div>
              </div>

              {/* Current Item */}
              <div className="relative flex-shrink-0 transition-all duration-500">
                <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden shadow-2xl border-4 border-white mx-auto">
                  <div className="w-full h-full bg-gradient-to-br from-white to-[#ff8c6b]/10 flex items-center justify-center">
                    <span className="text-6xl lg:text-8xl">{classTypes[currentSlide % classTypes.length]?.emoji || "👨‍🍳"}</span>
                  </div>
                </div>
                
                {/* Info Card Below */}
                <div className="mt-6 text-center">
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">
                    {carouselClasses[currentSlide]?.title}
                  </h3>
                  <p className="text-white/80 mb-4">{carouselClasses[currentSlide]?.date} • {carouselClasses[currentSlide]?.price}</p>
                  
                  {/* Booking Button */}
                  <Button size="lg" className="bg-white text-[#ff8c6b] hover:bg-[#ff8c6b]/10 shadow-lg font-semibold rounded-full px-8" asChild>
                    <Link href="/classes" className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Book Now
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Next Item */}
              <div className="hidden md:block w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden opacity-60 flex-shrink-0 transition-all duration-500 shadow-lg border-4 border-white/30">
                <div className="w-full h-full bg-gradient-to-br from-[#ff8c6b]/30 to-[#ff8c6b]/50 flex items-center justify-center">
                  <span className="text-4xl">{classTypes[(currentSlide + 1) % classTypes.length]?.emoji || "🍳"}</span>
                </div>
              </div>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {carouselClasses.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentSlide(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Founder Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-stone-50 to-[#ff8c6b]/10 relative overflow-hidden">
        {/* Doodles */}
        <FoodDoodle1 className="absolute top-10 right-10 w-20 h-20 text-[#ff8c6b]/20 animate-pulse" />
        <FoodDoodle3 className="absolute bottom-10 left-10 w-16 h-16 text-stone-200 animate-bounce" style={{ animationDuration: '3s' }} />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center justify-center">
            {/* Image - Proper cropping to show full head */}
            <div className="relative w-64 sm:w-72 lg:w-80 flex-shrink-0">
              <div className="relative aspect-[3/4] rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl lg:shadow-2xl">
                <Image
                  src="/images/founder-lama.jpg"
                  alt="Lama - Founder of Mamalu Kitchen"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
            
            {/* Content */}
            <div className="text-center lg:text-left max-w-lg">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                Meet Our Founder
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-4">
                Hi, I&apos;m Lama! 👋
              </h2>
              <div className="space-y-3 text-base lg:text-lg text-stone-600">
                <p>
                  Mamalu Kitchen was born from my journey as a mom of three amazing boys 
                  and my passion for helping fellow families simplify their lives with 
                  healthy, fuss-free food.
                </p>
                <p>
                  I believe that cooking should be fun, not a chore! That&apos;s why I created 
                  a space where kids and parents can learn together, make memories, and 
                  discover the joy of creating delicious meals.
                </p>
                <p className="font-semibold text-stone-800 italic text-lg lg:text-xl">
                  &quot;My mission is simple: to create a cooking movement that brings 
                  families together, one recipe at a time.&quot;
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-4 justify-center lg:justify-start">
                <Button size="lg" className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg" asChild>
                  <Link href="/about" className="flex items-center gap-2">
                    <span>Read Our Story</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
        <SquiggleLine className="absolute top-0 left-0 w-full text-amber-100" />
        <SquiggleLine className="absolute bottom-0 right-0 w-full text-stone-100 rotate-180" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900">
              What Families Say
            </h2>
            <p className="mt-4 text-lg text-stone-600">
              Don&apos;t just take our word for it!
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-gradient-to-br from-stone-50 to-[#ff8c6b]/10 border border-stone-200 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-[#ff8c6b] text-[#ff8c6b]" />
                  ))}
                </div>
                <p className="text-lg text-stone-700 mb-6">&quot;{testimonial.quote}&quot;</p>
                <div>
                  <p className="font-bold text-stone-900">{testimonial.author}</p>
                  <p className="text-[#ff8c6b] text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-28 bg-stone-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <FoodDoodle1 className="absolute top-10 left-10 w-32 h-32 text-white" />
          <FoodDoodle2 className="absolute bottom-10 right-10 w-28 h-28 text-white" />
          <FoodDoodle3 className="absolute top-1/2 left-1/4 w-20 h-20 text-white" />
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Start Your Cooking Journey?
          </h2>
          <p className="text-lg text-stone-400 mb-10 max-w-2xl mx-auto">
            Join thousands of happy families who have discovered the joy of cooking together at Mamalu Kitchen!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full text-base font-semibold shadow-xl shadow-amber-500/30" asChild>
              <Link href="/classes" className="flex items-center gap-3">
                <Calendar className="h-5 w-5" />
                <span>Browse Classes</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 border-2 border-stone-600 text-white hover:bg-stone-800 rounded-full text-base font-semibold" asChild>
              <Link href="/contact" className="flex items-center gap-3">
                <span>Contact Us</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
