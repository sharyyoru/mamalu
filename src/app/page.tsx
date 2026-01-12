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
  Sparkles,
  Play,
  ShoppingBag,
  BookOpen,
  ChevronRight,
  Quote,
  Heart,
} from "lucide-react";

const classTypes = [
  {
    id: "kids",
    title: "Kids Classes",
    description: "Fun cooking adventures for little chefs aged 4-12",
    icon: Baby,
    color: "from-stone-800 to-stone-900",
    href: "/classes?type=kids",
    emoji: "👶",
    image: "/images/kids-classes.png",
  },
  {
    id: "family",
    title: "Family Classes",
    description: "Cook together, bond together - memories that last forever",
    icon: Users,
    color: "from-stone-800 to-stone-900",
    href: "/classes?type=family",
    emoji: "👨‍👩‍👧",
    image: "/images/family-classes.png",
  },
  {
    id: "birthday",
    title: "Birthday Parties",
    description: "Celebrate with a unique cooking party experience",
    icon: Cake,
    color: "from-stone-800 to-stone-900",
    href: "/classes?type=birthday",
    emoji: "🎂",
    image: "/images/birthday-parties.png",
  },
  {
    id: "adults",
    title: "Adult Classes",
    description: "Master new cuisines and techniques with expert guidance",
    icon: ChefHat,
    color: "from-stone-800 to-stone-900",
    href: "/classes?type=adults",
    emoji: "👨‍🍳",
    image: "/images/adult-classes.png",
  },
];

const testimonials = [
  {
    quote: "My kids absolutely love coming here! They've learned so much and actually want to help in the kitchen now.",
    author: "Sarah M.",
    role: "Mom of 2",
    avatar: "S",
  },
  {
    quote: "The family classes are amazing. It's become our favorite weekend activity!",
    author: "Ahmed K.",
    role: "Dad of 3",
    avatar: "A",
  },
  {
    quote: "Best birthday party ever! All the kids had a blast making their own pizzas.",
    author: "Fatima A.",
    role: "Party Parent",
    avatar: "F",
  },
];

const stats = [
  { value: "2000+", label: "Happy Kids" },
  { value: "500+", label: "Classes Held" },
  { value: "4.9", label: "Rating", icon: Star },
];

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <VideoPlayer isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
      
      <div className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-stone-50 via-white to-stone-100 overflow-hidden">
          {/* Animated Food Doodles Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Soft gradient blobs */}
            <div className="absolute top-20 left-[10%] w-64 h-64 bg-gradient-to-br from-stone-200/40 to-transparent rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 right-[10%] w-80 h-80 bg-gradient-to-br from-stone-300/30 to-transparent rounded-full blur-3xl animate-float-slow" />
            
            {/* Animated Food Doodles - 10x bigger */}
            <svg className="absolute top-[5%] left-[2%] w-[160px] h-[160px] text-stone-200 animate-float opacity-40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="50" cy="35" r="25" />
              <path d="M25 60 Q50 80 75 60" />
              <path d="M35 35 L35 25 M50 35 L50 20 M65 35 L65 25" />
            </svg>
            <svg className="absolute top-[10%] right-[3%] w-[140px] h-[140px] text-stone-200 animate-bounce opacity-35" style={{animationDuration: '3s'}} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <ellipse cx="50" cy="60" rx="35" ry="20" />
              <path d="M20 55 Q50 30 80 55" />
              <circle cx="35" cy="50" r="5" fill="currentColor" />
              <circle cx="55" cy="45" r="4" fill="currentColor" />
              <circle cx="65" cy="55" r="5" fill="currentColor" />
            </svg>
            <svg className="absolute bottom-[15%] left-[5%] w-[120px] h-[120px] text-stone-200 animate-pulse opacity-35" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="25" y="30" width="50" height="40" rx="5" />
              <path d="M30 30 Q50 10 70 30" />
              <circle cx="50" cy="50" r="10" />
            </svg>
            <svg className="absolute bottom-[25%] right-[8%] w-[100px] h-[100px] text-stone-200 animate-float opacity-30" style={{animationDelay: '1s'}} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M50 20 L50 80" />
              <ellipse cx="50" cy="20" rx="20" ry="10" />
            </svg>
            <svg className="absolute top-[35%] left-[0%] w-[80px] h-[80px] text-stone-200 animate-bounce opacity-30" style={{animationDuration: '4s'}} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="50" cy="50" r="30" />
              <path d="M30 50 L70 50 M50 30 L50 70" strokeDasharray="5 5" />
            </svg>
            <svg className="absolute top-[55%] right-[2%] w-[120px] h-[120px] text-stone-200 animate-pulse opacity-35" style={{animationDelay: '2s'}} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M30 70 Q30 30 50 30 Q70 30 70 70" />
              <path d="M40 70 L40 85 M60 70 L60 85" />
              <line x1="35" y1="85" x2="65" y2="85" />
            </svg>
            <svg className="absolute top-[70%] left-[15%] w-[100px] h-[100px] text-stone-200 animate-float opacity-25" style={{animationDelay: '0.5s'}} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M30 80 L50 20 L70 80 Z" />
              <circle cx="50" cy="55" r="8" />
            </svg>
            <svg className="absolute top-[25%] left-[40%] w-[90px] h-[90px] text-stone-200 animate-bounce opacity-20" style={{animationDuration: '5s'}} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <ellipse cx="50" cy="50" rx="30" ry="20" />
              <path d="M25 50 Q50 70 75 50" />
            </svg>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 glass text-stone-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 animate-float">
                  <Sparkles className="h-4 w-4 text-stone-900" />
                  #FeedingFamilies Since 2020
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight leading-[1.15]">
                  Where Little Chefs <span className="text-gradient">Become Big Cooks</span>
                </h1>
                
                <p className="mt-6 text-lg lg:text-xl text-stone-600 max-w-xl mx-auto lg:mx-0">
                  Fun, healthy cooking classes for kids and families in Dubai. 
                  Create delicious memories while learning essential life skills!
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-8">
                  <Button 
                    size="lg" 
                    className="h-14 px-8 gradient-peach-glow text-white text-base font-semibold rounded-full hover:scale-105 transition-transform" 
                    asChild
                  >
                    <Link href="/classes" className="flex items-center gap-3">
                      <Calendar className="h-5 w-5" />
                      Book a Class
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="h-14 px-8 glass hover:bg-white/90 text-base font-semibold rounded-full border-0"
                    onClick={() => setIsVideoOpen(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-stone-800 to-stone-700 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white ml-0.5" />
                      </div>
                      Watch Our Story
                    </div>
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-8 mt-12">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="text-center lg:text-left">
                      <div className="text-3xl lg:text-4xl font-extrabold text-gradient flex items-center gap-1 justify-center lg:justify-start">
                        {stat.value}
                        {stat.icon && <stat.icon className="h-6 w-6 fill-stone-800 text-stone-800" />}
                      </div>
                      <div className="text-sm text-stone-500 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Content - Class Cards */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  {classTypes.map((classType, idx) => {
                    const Icon = classType.icon;
                    return (
                      <Link
                        key={classType.id}
                        href={classType.href}
                        className={`group glass-card rounded-2xl p-4 sm:p-5 card-hover ${idx === 0 ? 'col-span-2 sm:col-span-1' : ''}`}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${classType.color} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-stone-900 text-lg group-hover:text-stone-600 transition-colors">
                              {classType.title}
                            </h3>
                            <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                              {classType.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end mt-4 text-stone-700 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          Book Now <ChevronRight className="h-4 w-4 ml-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 glass-card rounded-full px-4 py-2 shadow-xl animate-float hidden lg:flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                  <span className="text-sm font-semibold text-stone-700">Loved by families</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="py-8 -mt-8 relative z-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-4">
              <Link href="/classes" className="glass-card rounded-2xl p-6 text-center card-hover group">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <h3 className="mt-4 font-bold text-stone-900 group-hover:text-stone-600 transition-colors">Book a Class</h3>
                <p className="text-sm text-stone-500 mt-1 hidden sm:block">Find your perfect class</p>
              </Link>
              <Link href="/products" className="glass-card rounded-2xl p-6 text-center card-hover group">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-7 w-7 text-white" />
                </div>
                <h3 className="mt-4 font-bold text-stone-900 group-hover:text-stone-600 transition-colors">Shop Products</h3>
                <p className="text-sm text-stone-500 mt-1 hidden sm:block">Premium ingredients</p>
              </Link>
              <Link href="/recipes" className="glass-card rounded-2xl p-6 text-center card-hover group">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <h3 className="mt-4 font-bold text-stone-900 group-hover:text-stone-600 transition-colors">View Recipes</h3>
                <p className="text-sm text-stone-500 mt-1 hidden sm:block">Free recipe collection</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Classes Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 glass text-stone-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4 text-stone-900" />
                Our Classes
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900">
                Choose Your Adventure
              </h2>
              <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">
                From little bakers to master chefs, we have the perfect class for everyone
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {classTypes.map((classType, idx) => {
                const Icon = classType.icon;
                return (
                  <Link
                    key={classType.id}
                    href={classType.href}
                    className="group relative overflow-hidden rounded-3xl card-hover"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {/* Image */}
                    <div className="aspect-[3/4] relative">
                      <Image
                        src={classType.image}
                        alt={classType.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Content Overlay */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${classType.color} flex items-center justify-center shadow-xl mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          {classType.title}
                        </h3>
                        <p className="text-white/80 text-sm line-clamp-2">
                          {classType.description}
                        </p>
                        <div className="flex items-center gap-2 mt-4 text-white font-medium">
                          <span>Explore</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" className="gradient-peach-glow text-white rounded-full px-8 h-14 text-base font-semibold" asChild>
                <Link href="/classes" className="flex items-center gap-2">
                  View All Classes
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Meet the Founder Section */}
        <section className="py-20 lg:py-28 gradient-mesh relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-stone-300/30 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-stone-200/25 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Image */}
              <div className="relative order-2 lg:order-1">
                <div className="aspect-[3/4] max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl glow-peach">
                  <Image
                    src="/images/founder-lama.jpg"
                    alt="Lama - Founder of Mamalu Kitchen"
                    fill
                    className="object-cover object-top"
                    priority
                  />
                </div>
                {/* Floating Stats */}
                <div className="absolute -bottom-6 -right-6 glass-card rounded-2xl p-4 shadow-xl hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-stone-800 to-stone-700 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-white fill-white" />
                    </div>
                    <div>
                      <div className="font-bold text-stone-900">5+ Years</div>
                      <div className="text-sm text-stone-500">Feeding Families</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="order-1 lg:order-2 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 glass text-stone-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Sparkles className="h-4 w-4 text-stone-900" />
                  Meet Our Founder
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-6">
                  Hi, I&apos;m Lama! 👋
                </h2>
                <div className="space-y-4 text-lg text-stone-600">
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
                </div>
                <blockquote className="mt-6 p-6 glass-card rounded-2xl border-l-4 border-stone-800">
                  <p className="text-lg font-semibold text-stone-800 italic">
                    &quot;My mission is simple: to create a cooking movement that brings 
                    families together, one recipe at a time.&quot;
                  </p>
                </blockquote>
                <div className="mt-8">
                  <Button size="lg" className="glass hover:bg-white/90 text-stone-700 rounded-full px-8 border-0" asChild>
                    <Link href="/about" className="flex items-center gap-2">
                      Read Our Full Story
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 lg:py-28 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Heart className="h-4 w-4 fill-current" />
                Testimonials
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                What Families Say
              </h2>
            </div>

            {/* Testimonial Card */}
            <div className="relative">
              <div className="glass-dark rounded-3xl p-8 sm:p-12">
                <Quote className="h-12 w-12 text-white/20 mb-6" />
                <p className="text-xl sm:text-2xl text-white/90 font-medium leading-relaxed mb-8">
                  {testimonials[currentTestimonial].quote}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-stone-600 to-stone-500 flex items-center justify-center text-white font-bold text-xl">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">{testimonials[currentTestimonial].author}</div>
                    <div className="text-white/60">{testimonials[currentTestimonial].role}</div>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Testimonial Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonial(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentTestimonial 
                        ? 'w-8 bg-white' 
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28 gradient-mesh relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-stone-300/20 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="glass-card rounded-3xl p-8 sm:p-12 lg:p-16 glow-peach">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-4">
                Ready to Start Cooking?
              </h2>
              <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
                Join thousands of families who have discovered the joy of cooking together. 
                Book your first class today!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="h-14 px-8 gradient-peach-glow text-white text-base font-semibold rounded-full" asChild>
                  <Link href="/classes" className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Book Your First Class
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 glass border-0 text-base font-semibold rounded-full" asChild>
                  <Link href="/contact" className="flex items-center gap-2">
                    Contact Us
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
