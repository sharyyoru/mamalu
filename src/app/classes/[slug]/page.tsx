import { Metadata } from "next";
import { notFound } from "next/navigation";
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
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
// import { getClassBySlug } from "@/lib/sanity/queries";

interface ClassPageProps {
  params: Promise<{ slug: string }>;
}

// Placeholder data
const classesData: Record<string, {
  _id: string;
  title: string;
  description: string;
  classType: string;
  numberOfSessions: number;
  pricePerSession: number;
  fullPrice: number;
  startDate: string;
  spotsAvailable: number;
  schedule: string[];
  whatYouLearn: string[];
  instructor: { name: string; bio: string };
}> = {
  "middle-eastern-essentials": {
    _id: "1",
    title: "Middle Eastern Essentials",
    description:
      "Master the fundamentals of Middle Eastern cooking including hummus, falafel, and shawarma.",
    classType: "In-Person",
    numberOfSessions: 4,
    pricePerSession: 150,
    fullPrice: 500,
    startDate: "2024-02-15",
    spotsAvailable: 8,
    schedule: [
      "Session 1: The Art of Hummus & Mezze",
      "Session 2: Perfect Falafel & Tahini Sauces",
      "Session 3: Shawarma & Grilled Meats",
      "Session 4: Desserts & Sweet Treats",
    ],
    whatYouLearn: [
      "Traditional techniques passed down through generations",
      "How to balance spices for authentic flavor",
      "Tips for achieving perfect textures",
      "Recipe cards for all dishes covered",
      "Access to private recipe collection",
    ],
    instructor: {
      name: "Chef Ahmad",
      bio: "With over 20 years of experience in Middle Eastern cuisine, Chef Ahmad brings authentic flavors and techniques to every class.",
    },
  },
};

export async function generateMetadata({
  params,
}: ClassPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cls = classesData[slug];

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
  const cls = classesData[slug];

  if (!cls) {
    notFound();
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild href="/classes" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Badge className="mb-4">{cls.classType}</Badge>
              <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                {cls.title}
              </h1>
              <p className="text-lg text-stone-600 mb-6">{cls.description}</p>
              <div className="flex flex-wrap gap-6 text-stone-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  Starts {formatDate(cls.startDate)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  {cls.numberOfSessions} sessions
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-600" />
                  {cls.spotsAvailable} spots left
                </div>
              </div>
            </div>

            {/* Booking Card */}
            <Card className="lg:col-span-1">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Book This Class
                </h3>

                {/* Full Class Option */}
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-stone-900">
                        Full Course
                      </span>
                      <p className="text-sm text-stone-600">
                        All {cls.numberOfSessions} sessions
                      </p>
                    </div>
                    <span className="text-xl font-bold text-amber-600">
                      {formatPrice(cls.fullPrice)}
                    </span>
                  </div>
                  <Badge variant="success" className="text-xs">
                    Save {formatPrice(cls.pricePerSession * cls.numberOfSessions - cls.fullPrice)}
                  </Badge>
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

                <Button className="w-full" size="lg">
                  Book Now
                </Button>
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
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-6">
                  What You&apos;ll Learn
                </h2>
                <ul className="space-y-3">
                  {cls.whatYouLearn.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span className="text-stone-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Schedule */}
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-6">
                  Class Schedule
                </h2>
                <div className="space-y-4">
                  {cls.schedule.map((session, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 bg-stone-50 rounded-lg"
                    >
                      <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 font-semibold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="pt-2 text-stone-700">{session}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Instructor */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-stone-900 mb-4">
                    Your Instructor
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-amber-600/50" />
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900">
                        {cls.instructor.name}
                      </div>
                      <div className="text-sm text-stone-500">
                        Professional Chef
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600">{cls.instructor.bio}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
