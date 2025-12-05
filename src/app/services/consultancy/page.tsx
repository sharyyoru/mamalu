import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Lightbulb,
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Food Consultancy",
  description:
    "Expert food consultancy services for restaurants, food startups, and hospitality brands.",
};

const services = [
  {
    icon: BookOpen,
    title: "Menu Development",
    description:
      "Create innovative menus that delight customers and optimize profitability.",
  },
  {
    icon: Users,
    title: "Staff Training",
    description:
      "Professional culinary training programs for your kitchen and service staff.",
  },
  {
    icon: TrendingUp,
    title: "Business Strategy",
    description:
      "Strategic consulting to grow your food business and improve operations.",
  },
  {
    icon: Lightbulb,
    title: "Concept Development",
    description:
      "From idea to execution, we help bring your food concept to life.",
  },
];

const process = [
  {
    step: 1,
    title: "Discovery",
    description: "We learn about your business, goals, and challenges.",
  },
  {
    step: 2,
    title: "Analysis",
    description: "Deep dive into your operations, menu, and market position.",
  },
  {
    step: 3,
    title: "Strategy",
    description: "Develop actionable recommendations tailored to your needs.",
  },
  {
    step: 4,
    title: "Implementation",
    description: "Support you through execution with hands-on guidance.",
  },
];

export default function ConsultancyPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
              Food Consultancy
            </h1>
            <p className="mt-6 text-lg text-stone-600">
              Leverage our culinary expertise to elevate your food business.
              Strategic consulting for restaurants, food startups, and
              hospitality brands.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">
            Our Consulting Services
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card key={service.title} className="text-center">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <service.icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-stone-600">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">
            Our Process
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step) => (
              <div key={step.step} className="text-center">
                <div className="h-14 w-14 rounded-full bg-amber-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-stone-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Start Your Consultation
            </h2>
            <p className="text-stone-600">
              Tell us about your business and we&apos;ll schedule a discovery
              call.
            </p>
          </div>
          <form className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Your Name
                </label>
                <Input placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Email
                </label>
                <Input type="email" placeholder="john@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Business Name
              </label>
              <Input placeholder="Your Restaurant or Company" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Service Interested In
              </label>
              <select className="flex h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
                <option value="">Select a service</option>
                <option value="menu">Menu Development</option>
                <option value="training">Staff Training</option>
                <option value="strategy">Business Strategy</option>
                <option value="concept">Concept Development</option>
                <option value="full">Full Consulting Package</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Tell us about your business
              </label>
              <textarea
                rows={4}
                className="flex w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                placeholder="Share details about your business, current challenges, and goals..."
              />
            </div>
            <Button type="submit" className="w-full">
              Request Consultation
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
