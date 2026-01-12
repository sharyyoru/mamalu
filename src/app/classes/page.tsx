import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, BookOpen, ArrowRight, Baby, Cake, ChefHat, Sparkles, MapPin } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { getClasses } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/client";

export const metadata: Metadata = {
  title: "Cooking Classes",
  description:
    "Join our hands-on cooking classes and learn authentic recipes from expert chefs.",
};

interface CookingClass {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  classType: string;
  category?: string;
  numberOfSessions: number;
  pricePerSession: number;
  fullPrice: number;
  startDate: string;
  spotsAvailable: number;
  instructorId?: string;
}

const categories = [
  { id: "all", label: "All Classes", icon: BookOpen, color: "from-stone-600 to-stone-700" },
  { id: "kids", label: "Kids", icon: Baby, color: "from-pink-500 to-rose-500", emoji: "👶" },
  { id: "family", label: "Family", icon: Users, color: "from-[#ff8c6b] to-[#ffa891]", emoji: "👨‍👩‍👧" },
  { id: "birthday", label: "Birthday", icon: Cake, color: "from-violet-500 to-purple-600", emoji: "🎂" },
  { id: "adults", label: "Adults", icon: ChefHat, color: "from-emerald-500 to-teal-600", emoji: "👨‍🍳" },
];

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = params.type || "all";
  const classes: CookingClass[] = await getClasses(selectedCategory === "all" ? undefined : selectedCategory) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-mesh py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-[#ff8c6b]/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-[#ffa891]/15 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass-peach text-[#ff8c6b] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Learn. Cook. Create.
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Cooking <span className="text-gradient">Classes</span>
            </h1>
            <p className="text-lg lg:text-xl text-stone-600 max-w-2xl mx-auto">
              From little bakers to master chefs, find the perfect class for you and your family
            </p>
          </div>

          {/* Category Filter */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <Link
                  key={cat.id}
                  href={cat.id === "all" ? "/classes" : `/classes?type=${cat.id}`}
                  className={`
                    flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all
                    ${isSelected 
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-lg` 
                      : "glass hover:bg-white/90 text-stone-700"}
                  `}
                >
                  {cat.emoji ? <span className="text-lg">{cat.emoji}</span> : <Icon className="h-4 w-4" />}
                  {cat.label}
                </Link>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-12 flex flex-wrap justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient">{classes.length}</div>
              <div className="text-sm text-stone-500">Available Classes</div>
            </div>
            <div className="hidden sm:block w-px bg-stone-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient">4-12</div>
              <div className="text-sm text-stone-500">Age Range</div>
            </div>
            <div className="hidden sm:block w-px bg-stone-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient">Dubai</div>
              <div className="text-sm text-stone-500">Location</div>
            </div>
          </div>
        </div>
      </section>

      {/* Classes Grid */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {classes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {classes.map((cls, idx) => (
                <Link
                  key={cls._id}
                  href={`/classes/${cls.slug.current}`}
                  className="group glass-card rounded-3xl overflow-hidden card-hover"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Image */}
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {cls.mainImage ? (
                      <Image
                        src={urlFor(cls.mainImage).width(600).height(450).url()}
                        alt={cls.mainImage.alt || cls.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#ff8c6b]/20 to-[#ffa891]/30 flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-[#ff8c6b]/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-stone-700">
                        {cls.classType}
                      </span>
                      {cls.spotsAvailable <= 3 && cls.spotsAvailable > 0 && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500 text-white">
                          {cls.spotsAvailable} spots left!
                        </span>
                      )}
                    </div>
                    
                    {/* Price Badge */}
                    <div className="absolute top-4 right-4">
                      <div className="px-4 py-2 rounded-full bg-gradient-to-r from-[#ff8c6b] to-[#ffa891] text-white font-bold shadow-lg">
                        {formatPrice(cls.fullPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-stone-900 mb-2 group-hover:text-[#ff8c6b] transition-colors line-clamp-1">
                      {cls.title}
                    </h3>
                    <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                      {cls.description}
                    </p>
                    
                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-stone-500 mb-4">
                      {cls.startDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-[#ff8c6b]" />
                          {formatDate(cls.startDate)}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-[#ff8c6b]" />
                        {cls.numberOfSessions} session{cls.numberOfSessions > 1 ? "s" : ""}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-[#ff8c6b]" />
                        {cls.spotsAvailable} spots
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                      <span className="text-sm text-stone-500">
                        {cls.numberOfSessions > 1 && `${formatPrice(cls.pricePerSession)}/session`}
                      </span>
                      <span className="flex items-center gap-1 text-[#ff8c6b] font-semibold group-hover:gap-2 transition-all">
                        Book Now
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#ff8c6b]/20 to-[#ffa891]/10 flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-[#ff8c6b]" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">No classes available</h2>
              <p className="text-stone-500 mb-6">Check back soon for new classes!</p>
              <Button className="gradient-peach-glow text-white rounded-full" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 gradient-mesh">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card rounded-3xl p-8 sm:p-12 glow-peach-sm">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-stone-600 mb-6">
              We offer private classes and custom birthday party packages. Get in touch to discuss your needs!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="gradient-peach-glow text-white rounded-full px-6" asChild>
                <Link href="/contact" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Contact Us
                </Link>
              </Button>
              <Button variant="outline" className="glass border-0 rounded-full px-6" asChild>
                <Link href="/classes?type=birthday" className="flex items-center gap-2">
                  🎂 Birthday Parties
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
