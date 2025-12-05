import { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, BookOpen, ArrowRight } from "lucide-react";
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
  numberOfSessions: number;
  pricePerSession: number;
  fullPrice: number;
  startDate: string;
  spotsAvailable: number;
  instructor?: { name: string; image?: { asset: { _ref: string } } };
}

export default async function ClassesPage() {
  const classes: CookingClass[] = await getClasses() || [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
              Cooking Classes
            </h1>
            <p className="mt-6 text-lg text-stone-600">
              Learn authentic recipes and techniques from our expert chefs.
              Available in-person, online, or private sessions.
            </p>
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
                  <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center relative overflow-hidden">
                    {cls.mainImage ? (
                      <Image
                        src={urlFor(cls.mainImage).width(600).height(340).url()}
                        alt={cls.mainImage.alt || cls.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="h-12 w-12 text-amber-600/30" />
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
                    <h3 className="text-xl font-semibold text-stone-900 mb-2 group-hover:text-amber-600 transition-colors">
                      {cls.title}
                    </h3>
                    <p className="text-stone-600 text-sm mb-4">
                      {cls.description}
                    </p>
                    <div className="space-y-2 text-sm text-stone-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Starts {formatDate(cls.startDate)}
                      </div>
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
                      <div className="text-lg font-bold text-amber-600">
                        {formatPrice(cls.fullPrice)}
                      </div>
                      {cls.numberOfSessions > 1 && (
                        <div className="text-xs text-stone-500">
                          or {formatPrice(cls.pricePerSession)}/session
                        </div>
                      )}
                    </div>
                    <Button asChild href={`/classes/${cls.slug.current}`} size="sm">
                      Book Now
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
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
