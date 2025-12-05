import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PartyPopper,
  Users,
  Utensils,
  Calendar,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Events & Catering",
  description:
    "Professional event catering services for corporate events, weddings, and private celebrations.",
};

const eventTypes = [
  {
    title: "Corporate Events",
    description: "Impress clients and reward teams with exceptional catering.",
    capacity: "10-500+ guests",
  },
  {
    title: "Weddings",
    description: "Create unforgettable culinary experiences for your special day.",
    capacity: "50-300 guests",
  },
  {
    title: "Private Parties",
    description: "Celebrate milestones with personalized menus and service.",
    capacity: "10-100 guests",
  },
  {
    title: "Cultural Events",
    description: "Authentic cuisine for cultural celebrations and festivals.",
    capacity: "20-200 guests",
  },
];

const whyChooseUs = [
  "Customized menus tailored to your preferences",
  "Fresh, locally-sourced ingredients",
  "Professional service staff",
  "Dietary accommodations (halal, vegetarian, vegan)",
  "Full event coordination support",
  "Flexible packages for all budgets",
];

export default function EventsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <PartyPopper className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
              Events & Catering
            </h1>
            <p className="mt-6 text-lg text-stone-600">
              From intimate gatherings to grand celebrations, we create
              exceptional culinary experiences for every occasion.
            </p>
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">
            Events We Cater
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {eventTypes.map((event) => (
              <Card key={event.title} className="text-center">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-sm text-stone-600 mb-4">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                    <Users className="h-4 w-4" />
                    {event.capacity}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-stone-900 mb-6">
                Why Choose Mamalu Kitchen
              </h2>
              <ul className="space-y-4">
                {whyChooseUs.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-stone-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl aspect-square flex items-center justify-center">
              <Utensils className="h-32 w-32 text-amber-600/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Request a Quote
            </h2>
            <p className="text-stone-600">
              Tell us about your event and we&apos;ll create a custom proposal.
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
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Event Date
                </label>
                <Input type="date" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Number of Guests
                </label>
                <Input type="number" placeholder="50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Event Type
              </label>
              <select className="flex h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
                <option value="">Select event type</option>
                <option value="corporate">Corporate Event</option>
                <option value="wedding">Wedding</option>
                <option value="private">Private Party</option>
                <option value="cultural">Cultural Event</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Tell us about your event
              </label>
              <textarea
                rows={4}
                className="flex w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                placeholder="Share any details about your event, dietary requirements, or special requests..."
              />
            </div>
            <Button type="submit" className="w-full">
              Submit Inquiry
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
