import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PartyPopper, Lightbulb, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Discover Mamalu Kitchen's professional services including event catering and food consultancy.",
};

const services = [
  {
    icon: PartyPopper,
    title: "Events & Catering",
    description:
      "From intimate gatherings to grand celebrations, we bring exceptional culinary experiences to your special occasions. Our team handles everything from menu planning to execution.",
    features: [
      "Corporate events and conferences",
      "Private parties and celebrations",
      "Wedding catering",
      "Custom menu design",
      "Full-service event coordination",
    ],
    href: "/services/events",
    cta: "Plan Your Event",
  },
  {
    icon: Lightbulb,
    title: "Food Consultancy",
    description:
      "Leverage our culinary expertise to elevate your food business. We provide comprehensive consulting services for restaurants, food startups, and hospitality brands.",
    features: [
      "Menu development and optimization",
      "Kitchen workflow consulting",
      "Staff training programs",
      "Brand and concept development",
      "Quality control systems",
    ],
    href: "/services/consultancy",
    cta: "Get Consultation",
  },
];

export default function ServicesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
              Our Services
            </h1>
            <p className="mt-6 text-lg text-stone-600">
              Professional culinary services to bring exceptional food
              experiences to your events and business.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {services.map((service) => (
              <Card key={service.title} className="overflow-hidden">
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-xl bg-amber-100 flex items-center justify-center mb-6">
                    <service.icon className="h-7 w-7 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-4">
                    {service.title}
                  </h2>
                  <p className="text-stone-600 mb-6">{service.description}</p>
                  <ul className="space-y-2 mb-8">
                    {service.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-stone-600"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild href={service.href}>
                    {service.cta}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
