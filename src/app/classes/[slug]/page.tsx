import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  ArrowLeft,
  CheckCircle,
  MapPin,
  ChefHat,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { getClassBySlug } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/client";
import { createAdminClient } from "@/lib/supabase/admin";

interface ClassPageProps {
  params: Promise<{ slug: string }>;
}

interface CookingClass {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  body?: any[];
  classType: string;
  numberOfSessions: number;
  sessionDuration: number;
  pricePerSession: number;
  fullPrice: number;
  startDate: string;
  schedule?: Array<{
    sessionNumber: number;
    title: string;
    description: string;
    date: string;
  }>;
  whatYouLearn?: string[];
  requirements?: string[];
  spotsAvailable: number;
  maxSpots: number;
  location: string;
  instructorId?: string;
}

interface Instructor {
  id: string;
  full_name: string;
  instructor_title: string | null;
  instructor_bio: string | null;
  instructor_image_url: string | null;
  avatar_url: string | null;
  instructor_specialties: string[] | null;
  instructor_experience_years: number | null;
}

async function getInstructor(instructorId: string): Promise<Instructor | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, instructor_title, instructor_bio, instructor_image_url, avatar_url, instructor_specialties, instructor_experience_years")
    .eq("id", instructorId)
    .single();
    
  return data;
}

export async function generateMetadata({
  params,
}: ClassPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cls: CookingClass | null = await getClassBySlug(slug);

  if (!cls) {
    return { title: "Class Not Found" };
  }

  return {
    title: cls.title,
    description: cls.description,
  };
}

export default async function ClassPage({ params }: ClassPageProps) {
  const { slug } = await params;
  const cls: CookingClass | null = await getClassBySlug(slug);

  if (!cls) {
    notFound();
  }

  // Fetch instructor from database
  const instructor = cls.instructorId ? await getInstructor(cls.instructorId) : null;
  
  const savings = cls.pricePerSession * cls.numberOfSessions - cls.fullPrice;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" onClick={() => window.dispatchEvent(new CustomEvent("openMamaluMenu"))}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Classes
            </Button>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {cls.mainImage && (
                <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
                  <Image
                    src={urlFor(cls.mainImage).width(800).height(450).url()}
                    alt={cls.mainImage.alt || cls.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-4">
                <Badge>{cls.classType}</Badge>
                {cls.spotsAvailable <= 3 && cls.spotsAvailable > 0 && (
                  <Badge variant="destructive">
                    Only {cls.spotsAvailable} spots left
                  </Badge>
                )}
                {cls.spotsAvailable === 0 && (
                  <Badge variant="destructive">Sold Out</Badge>
                )}
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                {cls.title}
              </h1>
              <p className="text-lg text-stone-600 mb-6">{cls.description}</p>
              
              <div className="flex flex-wrap gap-6 text-stone-600">
                {cls.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-600" />
                    Starts {formatDate(cls.startDate)}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  {cls.numberOfSessions} session{cls.numberOfSessions > 1 ? "s" : ""} 
                  {cls.sessionDuration && ` × ${cls.sessionDuration}h`}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-600" />
                  {cls.spotsAvailable} of {cls.maxSpots} spots available
                </div>
                {cls.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-600" />
                    {cls.location}
                  </div>
                )}
              </div>
            </div>

            {/* Booking Card */}
            <Card className="lg:col-span-1 h-fit sticky top-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Book This Class
                </h3>

                {/* Full Course Option */}
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-stone-900">
                        Full Course
                      </span>
                      <p className="text-sm text-stone-600">
                        All {cls.numberOfSessions} session{cls.numberOfSessions > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-xl font-bold text-amber-600">
                      {formatPrice(cls.fullPrice)}
                    </span>
                  </div>
                  {savings > 0 && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      Save {formatPrice(savings)}
                    </Badge>
                  )}
                </div>

                {/* Per Session Option */}
                {cls.numberOfSessions > 1 && (
                  <div className="border border-stone-200 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-stone-900">
                          Per Session
                        </span>
                        <p className="text-sm text-stone-600">
                          Pay as you go
                        </p>
                      </div>
                      <span className="text-xl font-bold text-stone-700">
                        {formatPrice(cls.pricePerSession)}
                      </span>
                    </div>
                  </div>
                )}

                {cls.spotsAvailable > 0 ? (
                  <Link href={`/classes/${cls.slug.current}/book`}>
                    <Button className="w-full" size="lg">
                      Book Now
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    Sold Out
                  </Button>
                )}
                <p className="text-xs text-stone-500 text-center mt-3">
                  Secure payment powered by Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* What You'll Learn */}
              {cls.whatYouLearn && cls.whatYouLearn.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-6">
                    What You&apos;ll Learn
                  </h2>
                  <ul className="space-y-3">
                    {cls.whatYouLearn.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="text-stone-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Schedule */}
              {cls.schedule && cls.schedule.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-6">
                    Class Schedule
                  </h2>
                  <div className="space-y-4">
                    {cls.schedule.map((session, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-4 p-4 bg-stone-50 rounded-lg"
                      >
                        <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 font-semibold flex items-center justify-center flex-shrink-0">
                          {session.sessionNumber || idx + 1}
                        </div>
                        <div className="pt-1">
                          <p className="font-medium text-stone-900">{session.title}</p>
                          {session.description && (
                            <p className="text-sm text-stone-600 mt-1">{session.description}</p>
                          )}
                          {session.date && (
                            <p className="text-xs text-stone-400 mt-1">{formatDate(session.date)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {cls.requirements && cls.requirements.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-6">
                    Requirements
                  </h2>
                  <ul className="space-y-2">
                    {cls.requirements.map((req: string, idx: number) => (
                      <li key={idx} className="text-stone-600">• {req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Instructor */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-stone-900 mb-4">
                    Your Instructor
                  </h3>
                  {instructor ? (
                    <>
                      <div className="flex items-center gap-4 mb-4">
                        {(instructor.instructor_image_url || instructor.avatar_url) ? (
                          <Image
                            src={instructor.instructor_image_url || instructor.avatar_url || ""}
                            alt={instructor.full_name}
                            width={64}
                            height={64}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                            <ChefHat className="h-8 w-8 text-amber-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-stone-900">
                            {instructor.full_name}
                          </div>
                          <div className="text-sm text-amber-600">
                            {instructor.instructor_title || "Professional Chef"}
                          </div>
                          {instructor.instructor_experience_years && (
                            <div className="text-xs text-stone-500">
                              {instructor.instructor_experience_years} years experience
                            </div>
                          )}
                        </div>
                      </div>
                      {instructor.instructor_bio && (
                        <p className="text-sm text-stone-600 mb-4">{instructor.instructor_bio}</p>
                      )}
                      {instructor.instructor_specialties && instructor.instructor_specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {instructor.instructor_specialties.map((s: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4 text-stone-500">
                      <ChefHat className="h-12 w-12 mx-auto mb-2 text-stone-300" />
                      <p className="text-sm">Instructor TBA</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location Card */}
              {cls.location && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-stone-900 mb-4">
                      Location
                    </h3>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-stone-700">{cls.location}</p>
                        <p className="text-sm text-stone-500 mt-1">
                          {cls.classType === "online" ? "Online via Zoom" : "In-person class"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
