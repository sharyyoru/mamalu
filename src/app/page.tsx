import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

const classTypes = [
  {
    id: "kids",
    title: "Kids Classes",
    description: "Fun cooking adventures for little chefs aged 4-12",
    icon: Baby,
    color: "from-pink-400 to-rose-500",
    bgColor: "bg-pink-50",
    href: "/classes?type=kids",
    emoji: "👨‍🍳",
  },
  {
    id: "family",
    title: "Family Classes",
    description: "Cook together, bond together - memories that last forever",
    icon: Users,
    color: "from-amber-400 to-orange-500",
    bgColor: "bg-amber-50",
    href: "/classes?type=family",
    emoji: "👨‍👩‍👧‍👦",
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
  },
];

const upcomingHighlights = [
  { title: "Little Bakers Workshop", date: "Dec 21", time: "10:00 AM", spots: 4 },
  { title: "Family Pizza Night", date: "Dec 22", time: "5:00 PM", spots: 6 },
  { title: "Kids Holiday Cookies", date: "Dec 23", time: "2:00 PM", spots: 2 },
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

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section - Modern & Playful */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-amber-300/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-rose-300/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-orange-300/20 rounded-full blur-2xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-sm">
                <Sparkles className="h-4 w-4" />
                #FeedingFamilies Since 2020
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight leading-tight">
                Where Little Chefs
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                  Become Big Cooks
                </span>
              </h1>
              
              <p className="mt-6 text-lg lg:text-xl text-stone-600 max-w-xl">
                Fun, healthy cooking classes for kids and families in Dubai. 
                Create delicious memories while learning essential life skills!
              </p>
              
              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25" asChild>
                  <Link href="/classes">
                    <Calendar className="h-5 w-5 mr-2" />
                    Book a Class
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-stone-300 hover:border-amber-500 hover:text-amber-600" asChild>
                  <Link href="/about">
                    <Play className="h-5 w-5 mr-2" />
                    Watch Our Story
                  </Link>
                </Button>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">2000+</div>
                  <div className="text-sm text-stone-500">Happy Kids</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">500+</div>
                  <div className="text-sm text-stone-500">Classes Held</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">4.9</div>
                  <div className="text-sm text-stone-500 flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> Rating
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right - Featured Image/Cards */}
            <div className="relative">
              <div className="relative z-10 grid grid-cols-2 gap-4">
                {classTypes.slice(0, 4).map((classType, idx) => (
                  <Link
                    key={classType.id}
                    href={classType.href}
                    className={`group p-6 rounded-2xl ${classType.bgColor} border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${idx === 0 ? 'col-span-2 sm:col-span-1' : ''}`}
                  >
                    <div className="text-4xl mb-3">{classType.emoji}</div>
                    <h3 className="font-bold text-stone-900 text-lg">{classType.title}</h3>
                    <p className="text-sm text-stone-600 mt-1">{classType.description}</p>
                    <div className="mt-3 flex items-center text-amber-600 text-sm font-medium group-hover:text-amber-700">
                      Explore <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Class Types Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">
              Choose Your Cooking Adventure
            </h2>
            <p className="mt-4 text-lg text-stone-600">
              From tiny tots to grown-ups, we have the perfect class for everyone!
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {classTypes.map((classType) => {
              const Icon = classType.icon;
              return (
                <Link
                  key={classType.id}
                  href={classType.href}
                  className="group relative overflow-hidden rounded-3xl p-8 bg-white border-2 border-stone-100 hover:border-transparent hover:shadow-2xl transition-all duration-500"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${classType.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${classType.bgColor} group-hover:bg-white/20 transition-colors mb-6`}>
                      <Icon className="h-8 w-8 text-stone-700 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 group-hover:text-white transition-colors">
                      {classType.title}
                    </h3>
                    <p className="mt-2 text-stone-600 group-hover:text-white/90 transition-colors">
                      {classType.description}
                    </p>
                    <div className="mt-4 flex items-center text-amber-600 group-hover:text-white font-medium">
                      View Classes <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Meet the Founder Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-stone-50 to-amber-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/founder-lama.jpg"
                  alt="Lama - Founder of Mamalu Kitchen"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span className="text-sm font-medium text-stone-700">Mom of 3 Boys</span>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-400 rounded-full opacity-20" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-rose-400 rounded-full opacity-20" />
            </div>
            
            {/* Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Meet Our Founder
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-6">
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
                <p className="font-medium text-stone-800">
                  &quot;My mission is simple: to create a cooking movement that brings 
                  families together, one recipe at a time.&quot;
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" variant="outline" asChild>
                  <Link href="/about">
                    Read Our Story
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Classes Preview */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">
                Upcoming Classes
              </h2>
              <p className="mt-2 text-lg text-stone-600">
                Grab your spot before they fill up!
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/classes">
                View All Classes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingHighlights.map((cls, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-2xl bg-gradient-to-br from-stone-50 to-amber-50 border border-stone-100 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    {cls.date}
                  </div>
                  <span className="text-sm text-rose-600 font-medium">
                    {cls.spots} spots left
                  </span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">{cls.title}</h3>
                <div className="flex items-center gap-4 text-stone-500 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {cls.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Dubai
                  </span>
                </div>
                <Button className="w-full mt-4 bg-stone-900 hover:bg-stone-800" asChild>
                  <Link href="/classes">Book Now</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              What Families Say
            </h2>
            <p className="mt-4 text-lg text-amber-100">
              Don&apos;t just take our word for it!
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-200 text-amber-200" />
                  ))}
                </div>
                <p className="text-lg mb-6">&quot;{testimonial.quote}&quot;</p>
                <div>
                  <p className="font-bold">{testimonial.author}</p>
                  <p className="text-amber-200 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-28 bg-stone-900 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Start Your Cooking Journey?
          </h2>
          <p className="text-lg text-stone-400 mb-10 max-w-2xl mx-auto">
            Join thousands of happy families who have discovered the joy of cooking together at Mamalu Kitchen!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" asChild>
              <Link href="/classes">
                Browse Classes
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-stone-600 text-white hover:bg-stone-800" asChild>
              <Link href="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
