"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Cake,
  Users,
  ChefHat,
  Baby,
  Coffee,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  FileText,
  Check,
  Crown,
  XCircle,
  RefreshCw,
  Phone,
  MessageCircle,
} from "lucide-react";

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  price_per_person: number;
  min_guests: number;
  max_guests: number;
  duration_minutes: number;
  includes: string[];
  is_popular: boolean;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  service_type: string;
  description: string;
  short_description: string;
  image_url: string;
  menu_pdf_url: string;
  base_price: number;
  features: string[];
  packages: ServicePackage[];
}

const categoryIcons: Record<string, any> = {
  birthday_deck: Cake,
  corporate_deck: Users,
  nanny_class: ChefHat,
  walkin_menu: Coffee,
};

const categoryColors: Record<string, string> = {
  kids: "from-pink-500 to-rose-500",
  adults: "from-indigo-500 to-purple-500",
  walkin: "from-amber-500 to-orange-500",
};

const categoryBg: Record<string, string> = {
  kids: "bg-gradient-to-br from-pink-50 to-rose-50",
  adults: "bg-gradient-to-br from-indigo-50 to-purple-50",
  walkin: "bg-gradient-to-br from-amber-50 to-orange-50",
};

export default function BookPage() {
  const searchParams = useSearchParams();
  const isCancelled = searchParams.get("cancelled") === "true";
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCancelledModal, setShowCancelledModal] = useState(isCancelled);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (isCancelled) {
      setShowCancelledModal(true);
    }
  }, [isCancelled]);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  };

  const kidsServices = services.filter((s) => s.category === "kids");
  const adultsServices = services.filter((s) => s.category === "adults");
  const walkinServices = services.filter((s) => s.category === "walkin");

  const formatPrice = (price: number) => {
    return `AED ${price.toLocaleString()}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Cancelled Booking Modal */}
      {showCancelledModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-3">
              Booking Cancelled
            </h2>
            <p className="text-stone-600 mb-6">
              No worries! Your payment was not processed. You can start a new booking whenever you&apos;re ready, or contact us if you need any help.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setShowCancelledModal(false)}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-full h-12"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Browse Services
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full h-12"
                  asChild
                >
                  <a href="https://wa.me/971XXXXXXXXX" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-full h-12"
                  asChild
                >
                  <Link href="/contact">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Book Your Experience
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Choose Your Culinary Adventure
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            From kids birthday parties to corporate team building - find the perfect cooking experience for any occasion
          </p>
          
          {/* Quick Category Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <button
              onClick={() => setActiveCategory(activeCategory === "kids" ? null : "kids")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                activeCategory === "kids"
                  ? "bg-white text-stone-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Baby className="h-5 w-5" />
              Kids
            </button>
            <button
              onClick={() => setActiveCategory(activeCategory === "adults" ? null : "adults")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                activeCategory === "adults"
                  ? "bg-white text-stone-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Users className="h-5 w-5" />
              Adults
            </button>
            <button
              onClick={() => setActiveCategory(activeCategory === "walkin" ? null : "walkin")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                activeCategory === "walkin"
                  ? "bg-white text-stone-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Coffee className="h-5 w-5" />
              Walk-in Menu
            </button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Kids Section */}
          {(!activeCategory || activeCategory === "kids") && kidsServices.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${categoryColors.kids}`}>
                  <Baby className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Kids</h2>
                  <p className="text-stone-500">Fun cooking experiences for little chefs</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kidsServices.map((service) => (
                  <ServiceCard key={service.id} service={service} category="kids" />
                ))}
              </div>
            </div>
          )}

          {/* Adults Section */}
          {(!activeCategory || activeCategory === "adults") && adultsServices.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${categoryColors.adults}`}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Adults</h2>
                  <p className="text-stone-500">Professional culinary experiences</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adultsServices.map((service) => (
                  <ServiceCard key={service.id} service={service} category="adults" />
                ))}
              </div>
            </div>
          )}

          {/* Walk-in Section */}
          {(!activeCategory || activeCategory === "walkin") && walkinServices.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${categoryColors.walkin}`}>
                  <Coffee className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Walk-in Menu</h2>
                  <p className="text-stone-500">Fresh, healthy meals ready to enjoy</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {walkinServices.map((service) => (
                  <ServiceCard key={service.id} service={service} category="walkin" />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-stone-100 to-stone-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            Need Help Choosing?
          </h2>
          <p className="text-lg text-stone-600 mb-8">
            Our team is here to help you plan the perfect experience. Contact us for personalized recommendations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-8" asChild>
              <Link href="/contact">
                Contact Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
              <a href="https://wa.me/971XXXXXXXXX" target="_blank" rel="noopener noreferrer">
                WhatsApp Us
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ service, category }: { service: Service; category: string }) {
  const Icon = categoryIcons[service.service_type] || ChefHat;
  const popularPackage = service.packages?.find((p) => p.is_popular);
  const lowestPrice = service.packages?.length
    ? Math.min(...service.packages.map((p) => p.price))
    : service.base_price;

  return (
    <Link href={`/book/${service.slug}`}>
      <Card className={`group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 ${categoryBg[category]}`}>
        <CardContent className="p-0">
          {/* Image/Header */}
          <div className={`relative h-48 bg-gradient-to-br ${categoryColors[category]} p-6 flex flex-col justify-between`}>
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Icon className="h-6 w-6 text-white" />
              </div>
              {service.menu_pdf_url && (
                <a
                  href={service.menu_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
                >
                  <FileText className="h-3 w-3" />
                  View Menu
                </a>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{service.name}</h3>
              {popularPackage && (
                <Badge className="mt-2 bg-white/20 text-white border-0">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Most Popular
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-stone-600 mb-4 line-clamp-2">
              {service.short_description || service.description}
            </p>

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <div className="space-y-2 mb-4">
                {(service.features as string[]).slice(0, 3).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-stone-600">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Packages Preview */}
            {service.packages && service.packages.length > 0 && (
              <div className="border-t border-stone-200/50 pt-4 mt-4">
                <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">
                  {service.packages.length} Package{service.packages.length > 1 ? "s" : ""} Available
                </p>
                <div className="flex flex-wrap gap-2">
                  {service.packages.slice(0, 3).map((pkg) => (
                    <Badge
                      key={pkg.id}
                      variant="secondary"
                      className={`text-xs ${pkg.is_popular ? "bg-stone-900 text-white" : ""}`}
                    >
                      {pkg.is_popular && <Crown className="h-3 w-3 mr-1" />}
                      {pkg.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Price & CTA */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-200/50">
              <div>
                <p className="text-xs text-stone-500">Starting from</p>
                <p className="text-2xl font-bold text-stone-900">
                  AED {lowestPrice?.toLocaleString() || "0"}
                </p>
              </div>
              <Button className={`bg-gradient-to-r ${categoryColors[category]} text-white rounded-full group-hover:scale-105 transition-transform`}>
                Book Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
