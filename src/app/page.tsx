"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import VideoPlayer from "@/components/layout/VideoPlayer";
import EnhancedHero from "@/components/ui/EnhancedHero";
import FloatingDoodles from "@/components/ui/FloatingDoodles";
import EnhancedServiceCard from "@/components/ui/EnhancedServiceCard";
import EnhancedPhotoGallery from "@/components/ui/EnhancedPhotoGallery";
import AnimatedSection from "@/components/ui/AnimatedSection";
import ScrollProgress from "@/components/ui/ScrollProgress";
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
  ChevronRight,
  Quote,
  Heart,
} from "lucide-react";

const serviceTypes = [
  {
    id: "birthday",
    title: "Birthdays",
    category: "Kids",
    description: "Fun cooking birthday parties for kids",
    icon: Cake,
    color: "from-pink-500 to-rose-500",
    href: "/book/birthday-deck",
    emoji: "🎂",
    image: "/images/birthday-parties.png",
  },
  {
    id: "corporate",
    title: "Corporate",
    category: "Adults",
    description: "Team building culinary experiences for companies",
    icon: Users,
    color: "from-indigo-500 to-purple-600",
    href: "/book/corporate-deck",
    emoji: "�",
    image: "/images/adult-classes.png",
  },
  {
    id: "nanny",
    title: "Nanny Class",
    category: "Adults",
    description: "Professional cooking training for caregivers",
    icon: ChefHat,
    color: "from-emerald-500 to-teal-600",
    href: "/book/nanny-class",
    emoji: "👨‍�",
    image: "/images/family-classes.png",
  },
  {
    id: "walkin",
    title: "Walk-in Menu",
    category: "Dine",
    description: "Fresh, healthy meals ready to enjoy on-site",
    icon: Baby,
    color: "from-amber-500 to-orange-500",
    href: "/book/walkin-menu",
    emoji: "☕",
    image: "/images/kids-classes.png",
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

const galleryPhotos = [
  { 
    src: "/images/Mamalou Kitchen - 103_edited.jpg", 
    alt: "Kids cooking class at Mamalu Kitchen",
    caption: "Little Chefs in Action",
    category: "Kids Classes"
  },
  { 
    src: "/images/IMG_3079_edited.jpg", 
    alt: "Family cooking together",
    caption: "Family Bonding",
    category: "Family Classes"
  },
  { 
    src: "/images/File_000-2.jpeg", 
    alt: "Birthday party cooking",
    caption: "Birthday Celebrations",
    category: "Parties"
  },
  { 
    src: "/images/Mamalou Kitchen - 151.jpg", 
    alt: "Adult cooking class",
    caption: "Culinary Adventures",
    category: "Adult Classes"
  },
  { 
    src: "/images/IMG_4199.jpg", 
    alt: "Professional kitchen setup",
    caption: "Our Professional Kitchen",
    category: "Facilities"
  },
  { 
    src: "/images/File_010.jpeg", 
    alt: "Cooking demonstration",
    caption: "Expert Chefs at Work",
    category: "Classes"
  },
  { 
    src: "/images/Mamalou Kitchen - 165.jpg", 
    alt: "Happy students with their creations",
    caption: "Proud Moments",
    category: "Achievements"
  },
  { 
    src: "/images/IMG_7324.jpg", 
    alt: "Colorful cooking ingredients",
    caption: "Fresh Ingredients",
    category: "Quality"
  },
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
      <ScrollProgress />
      
      <div className="overflow-hidden">
        {/* Enhanced Hero Section */}
        <EnhancedHero onVideoOpen={() => setIsVideoOpen(true)} />

        {/* Quick Actions Section */}
        <AnimatedSection 
          animation="fade-up" 
          delay={200}
          className="py-8 -mt-8 relative z-10 overflow-hidden"
        >
          <FloatingDoodles density="low" theme="cooking" />
          <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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
              <Link href="/book/birthday-deck" className="glass-card rounded-2xl p-6 text-center card-hover group">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Cake className="h-7 w-7 text-white" />
                </div>
                <h3 className="mt-4 font-bold text-stone-900 group-hover:text-stone-600 transition-colors">Birthday Parties</h3>
                <p className="text-sm text-stone-500 mt-1 hidden sm:block">Cooking birthday fun</p>
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* Featured Classes Section */}
        <AnimatedSection 
          animation="fade-up" 
          delay={400}
          className="py-20 lg:py-28"
        >
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
              {serviceTypes.map((classType, idx) => (
                <EnhancedServiceCard
                  key={classType.id}
                  id={classType.id}
                  title={classType.title}
                  category={classType.category}
                  description={classType.description}
                  icon={classType.icon}
                  color={classType.color}
                  href={classType.href}
                  emoji={classType.emoji}
                  image={classType.image}
                  index={idx}
                />
              ))}
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
        </AnimatedSection>

        {/* Enhanced Photo Gallery */}
        <section className="py-16 lg:py-24 bg-stone-900 relative overflow-hidden">
          <FloatingDoodles density="medium" theme="celebration" enableParallax={true} />
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 glass text-stone-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4 text-stone-900" />
                Life at Mamalu Kitchen
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Memories We Create Together
              </h2>
              <p className="mt-4 text-lg text-stone-300 max-w-2xl mx-auto">
                From happy little chefs to proud parents, see the joy of cooking through our eyes
              </p>
            </div>

            <EnhancedPhotoGallery
              photos={galleryPhotos}
              autoScroll={true}
              scrollInterval={4000}
              showControls={true}
              showThumbnails={true}
              className="max-w-5xl mx-auto"
            />
          </div>
        </section>

        {/* Doodle Divider */}
        <div className="relative py-6 bg-gradient-to-r from-stone-50 via-white to-stone-50 overflow-hidden">
          <div className="flex justify-center gap-12 opacity-[0.08]">
            <Image src="/images/pot big-01.png" alt="" width={50} height={50} className="animate-doodle-float" />
            <Image src="/images/knives-01.png" alt="" width={45} height={45} className="animate-doodle-wiggle" style={{animationDelay: '0.5s'}} />
            <Image src="/images/broccoli-01.png" alt="" width={50} height={50} className="animate-doodle-scale" style={{animationDelay: '1s'}} />
            <Image src="/images/noodles-01.png" alt="" width={45} height={45} className="animate-doodle-float" style={{animationDelay: '1.5s'}} />
            <Image src="/images/skewers-01.png" alt="" width={45} height={45} className="animate-doodle-wiggle" style={{animationDelay: '2s'}} />
          </div>
        </div>

        {/* Meet the Founder Section */}
        <section className="py-20 lg:py-28 gradient-mesh relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-stone-300/30 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-stone-200/25 to-transparent rounded-full blur-3xl" />
            <Image src="/images/rolling pin-01.png" alt="" width={80} height={80} className="absolute top-[10%] right-[5%] opacity-[0.06] animate-doodle-float" />
            <Image src="/images/recipe-01.png" alt="" width={60} height={60} className="absolute bottom-[10%] left-[3%] opacity-[0.06] animate-doodle-wiggle" style={{animationDelay: '1s'}} />
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
            <Image src="/images/girl-01.png" alt="" width={70} height={70} className="absolute top-[15%] left-[5%] opacity-[0.06] animate-doodle-float" />
            <Image src="/images/lunch-bag.png" alt="" width={60} height={60} className="absolute bottom-[15%] right-[5%] opacity-[0.06] animate-doodle-wiggle" style={{animationDelay: '1s'}} />
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
