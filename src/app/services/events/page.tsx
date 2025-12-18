"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PartyPopper,
  Users,
  Utensils,
  CheckCircle,
  Loader2,
  CheckCheck,
} from "lucide-react";

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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    eventDate: "",
    guestCount: "",
    eventType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          source: "events_page",
          type: "event_inquiry",
          message: `Event Type: ${formData.eventType}\nDate: ${formData.eventDate}\nGuests: ${formData.guestCount}\n\nDetails: ${formData.message}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit");
      
      setIsSubmitted(true);
      setFormData({ name: "", email: "", eventDate: "", guestCount: "", eventType: "", message: "" });
    } catch {
      setError("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
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
          
          {isSubmitted ? (
            <div className="text-center py-12 bg-green-50 rounded-2xl">
              <CheckCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-stone-900 mb-2">Thank You!</h3>
              <p className="text-stone-600">We&apos;ve received your inquiry and will contact you soon.</p>
              <Button onClick={() => setIsSubmitted(false)} variant="outline" className="mt-4">
                Submit Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Your Name
                  </label>
                  <Input 
                    placeholder="John Doe" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Email
                  </label>
                  <Input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Event Date
                  </label>
                  <Input 
                    type="date" 
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Number of Guests
                  </label>
                  <Input 
                    type="number" 
                    placeholder="50" 
                    value={formData.guestCount}
                    onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Event Type
                </label>
                <select 
                  className="flex h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  required
                >
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
                  className="flex w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                  placeholder="Share any details about your event, dietary requirements, or special requests..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Inquiry"
                )}
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
