import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Mamalu Kitchen. We'd love to hear from you about our recipes, products, classes, or catering services.",
};

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Us",
    details: ["123 Culinary Street", "Dubai, UAE"],
  },
  {
    icon: Phone,
    title: "Call Us",
    details: ["+971 4 123 4567", "+971 50 123 4567"],
  },
  {
    icon: Mail,
    title: "Email Us",
    details: ["hello@mamalukitchen.com", "classes@mamalukitchen.com"],
  },
  {
    icon: Clock,
    title: "Opening Hours",
    details: ["Mon - Fri: 9AM - 6PM", "Sat - Sun: 10AM - 4PM"],
  },
];

export default function ContactPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
              Contact Us
            </h1>
            <p className="mt-6 text-lg text-stone-600">
              Have a question or want to work with us? We&apos;d love to hear
              from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-stone-50 p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-stone-900 mb-6">
                Send us a message
              </h2>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      First Name
                    </label>
                    <Input placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Last Name
                    </label>
                    <Input placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Email
                  </label>
                  <Input type="email" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Phone
                  </label>
                  <Input type="tel" placeholder="+971 50 123 4567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Subject
                  </label>
                  <Input placeholder="How can we help?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="flex w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-8">
                Get in touch
              </h2>
              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900">
                        {item.title}
                      </h3>
                      {item.details.map((detail, idx) => (
                        <p key={idx} className="text-stone-600">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
