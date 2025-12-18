import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, BookOpen, ArrowRight, Baby, Cake, ChefHat } from "lucide-react";
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
  { id: "all", label: "All Classes", icon: BookOpen, color: "bg-stone-100 text-stone-700 hover:bg-stone-200" },
  { id: "kids", label: "Kids Classes", icon: Baby, color: "bg-pink-100 text-pink-700 hover:bg-pink-200" },
  { id: "family", label: "Family Classes", icon: Users, color: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
  { id: "birthday", label: "Birthday Parties", icon: Cake, color: "bg-violet-100 text-violet-700 hover:bg-violet-200" },
  { id: "adults", label: "Adult Classes", icon: ChefHat, color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
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
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-stone-50 via-rose-50/30 to-stone-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
              Cooking Classes
            </h1>
            <p className="mt-4 text-lg text-stone-600">
              Learn authentic recipes and techniques from our expert chefs.
              Available in-person, online, or private sessions.
            </p>
          </div>

          {/* Category Filter */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <Link
                  key={cat.id}
                  href={cat.id === "all" ? "/classes" : `/classes?type=${cat.id}`}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all
                    ${isSelected 
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105" 
                      : cat.color}
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Classes Grid */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {classes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {classes.map((cls) => (
                <Card
                  key={cls._id}
                  className="group overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                >
                  <div className="aspect-video bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center relative overflow-hidden">
                    {cls.mainImage ? (
                      <Image
                        src={urlFor(cls.mainImage).width(600).height(340).url()}
                        alt={cls.mainImage.alt || cls.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="h-12 w-12 text-rose-500/30" />
                    )}
                  </div>
                  <CardContent className="p-6 flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge>{cls.classType}</Badge>
                      {cls.spotsAvailable <= 3 && (
                        <Badge variant="destructive">
                          Only {cls.spotsAvailable} spots left
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-stone-900 mb-2 group-hover:text-rose-500 transition-colors">
                      {cls.title}
                    </h3>
                    <p className="text-stone-600 text-sm mb-4">
                      {cls.description}
                    </p>
                    <div className="space-y-2 text-sm text-stone-500">
                      {cls.startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Starts {formatDate(cls.startDate)}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {cls.numberOfSessions} session
                        {cls.numberOfSessions > 1 ? "s" : ""}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {cls.spotsAvailable} spots available
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-rose-500">
                        {formatPrice(cls.fullPrice)}
                      </div>
                      {cls.numberOfSessions > 1 && (
                        <div className="text-xs text-stone-500">
                          or {formatPrice(cls.pricePerSession)}/session
                        </div>
                      )}
                    </div>
                    <Link href={`/classes/${cls.slug.current}`}>
                      <Button size="sm">
                        Book Now
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">
                No classes scheduled. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
