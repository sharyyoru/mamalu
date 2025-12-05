import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChefHat,
  UtensilsCrossed,
  ShoppingBag,
  BookOpen,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: UtensilsCrossed,
    title: "Authentic Recipes",
    description:
      "Explore our collection of traditional and modern recipes curated by expert chefs.",
    href: "/recipes",
  },
  {
    icon: ShoppingBag,
    title: "Artisan Products",
    description:
      "Shop our selection of premium ingredients and kitchen essentials.",
    href: "/products",
  },
  {
    icon: BookOpen,
    title: "Cooking Classes",
    description:
      "Learn from the best with our hands-on cooking classes for all skill levels.",
    href: "/classes",
  },
  {
    icon: Users,
    title: "Events & Catering",
    description:
      "Let us bring culinary excellence to your special occasions and corporate events.",
    href: "/services/events",
  },
];

const stats = [
  { label: "Recipes Shared", value: "500+" },
  { label: "Happy Students", value: "2,000+" },
  { label: "Events Catered", value: "300+" },
  { label: "Years Experience", value: "15+" },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Welcome to Mamalu Kitchen
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight">
              Where Every Meal Tells a{" "}
              <span className="text-amber-600">Story</span>
            </h1>
            <p className="mt-6 text-lg text-stone-600 max-w-2xl mx-auto">
              Discover the art of cooking with authentic recipes, premium
              products, and hands-on classes. Join us on a culinary journey that
              brings families together.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild href="/recipes">
                Explore Recipes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" asChild href="/classes">
                View Classes
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">
              Everything You Need for Culinary Excellence
            </h2>
            <p className="mt-4 text-lg text-stone-600">
              From recipes to products to classes, we&apos;ve got everything to
              elevate your cooking journey.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                    <feature.icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-stone-600 text-sm mb-4">
                    {feature.description}
                  </p>
                  <Link
                    href={feature.href}
                    className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700"
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-stone-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-amber-400">
                  {stat.value}
                </div>
                <div className="mt-2 text-stone-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-amber-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <ChefHat className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-stone-900">
                  Ready to Start Cooking?
                </h3>
                <p className="mt-1 text-stone-600">
                  Join our community and unlock exclusive recipes and discounts.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button size="lg" asChild href="/account">
                Get Started
              </Button>
              <Button size="lg" variant="outline" asChild href="/contact">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
