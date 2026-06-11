"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Mail, Clock, CheckCircle, Loader2, Send, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Us",
    details: ["Mamalu Kitchen", "Depachika Food Hall, Nakheel Mall", "Center of Palm Jumeirah", "Dubai - United Arab Emirates"],
  },
  {
    icon: Phone,
    title: "Call / WhatsApp",
    details: ["+971 52 747 9512"],
    href: "https://wa.me/971527479512",
  },
  {
    icon: Mail,
    title: "Email Us",
    details: ["info@mamalukitchen.com"],
    href: "mailto:info@mamalukitchen.com",
  },
  {
    icon: Clock,
    title: "Opening Hours",
    details: ["Every day: 9AM - 10PM"],
  },
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          source: "contact_page",
          type: formData.subject || "General Inquiry",
          message: formData.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry");
      }

      setIsSubmitted(true);
      setFormData({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const galleryImages = [
    "/kitchen-photos/_C3A0991.JPG",
    "/kitchen-photos/_C3A0993.JPG",
    "/kitchen-photos/_C3A0995.JPG",
    "/kitchen-photos/_C3A0997.JPG",
    "/kitchen-photos/_C3A0998.JPG",
    "/kitchen-photos/_C3A1001.JPG",
    "/kitchen-photos/WhatsApp Image 2022-08-01 at 11.23.42 AM.jpeg",
    "/kitchen-photos/WhatsApp Image 2022-08-01 at 11.23.44 AM.jpeg",
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % galleryImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [galleryImages.length]);


  return (
    <div className="bg-white min-h-screen">

      {/* Hero Header */}
      <section className="bg-gradient-to-br from-stone-50 via-[#ff7f5c]/5 to-stone-100 py-16 lg:py-20 text-center">
        <h1 className="text-4xl sm:text-5xl" style={{ fontFamily: 'var(--font-mossy), cursive' }}>
          Contact Us
        </h1>
        <p className="mt-4 text-lg text-stone-600 max-w-xl mx-auto px-4">
          Have a question or want to work with us? We&apos;d love to hear from you.
        </p>
      </section>

      {/* ── Section 1: Our Location + Gallery Slider ── */}
      <section className="px-6 sm:px-10 lg:px-20 py-16 lg:py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          {/* Left: Location */}
          <div>
            <h2 className="text-4xl sm:text-5xl mb-8" style={{ fontFamily: 'var(--font-mossy), cursive' }}>
              Our Location
            </h2>
            <div className="space-y-1 text-stone-600 text-base leading-relaxed">
              <p>Mamalu Kitchen</p>
              <p>Depachika Food Hall, Nakheel Mall inside ,</p>
              <p>Center of Palm Jumeirah,</p>
              <p>Dubai - United Arab Emirates</p>
            </div>
            <div className="mt-8 space-y-1 text-stone-600">
              <p>Every day: 9AM – 10PM</p>
              <p>
                <a href="https://wa.me/971527479512" target="_blank" rel="noopener noreferrer" className="hover:text-[#ff8c6b] transition-colors">
                  +971 52 747 9512
                </a>
              </p>
            </div>
          </div>

          {/* Right: Gallery Slider */}
          <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-lg shadow-md">
            {galleryImages.map((src, idx) => (
              <div
                key={src}
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: idx === currentSlide ? 1 : 0 }}
              >
                <Image src={src} alt="Mamalu Kitchen" fill className="object-cover" priority={idx === 0} />
              </div>
            ))}
            <button
              onClick={() => setCurrentSlide(prev => (prev - 1 + galleryImages.length) % galleryImages.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition z-10"
            >
              <ChevronLeft className="h-4 w-4 text-stone-700" />
            </button>
            <button
              onClick={() => setCurrentSlide(prev => (prev + 1) % galleryImages.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition z-10"
            >
              <ChevronRight className="h-4 w-4 text-stone-700" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {galleryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? "bg-white w-4" : "bg-white/50 w-1.5"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Contact Us Form ── */}
      <section className="px-6 sm:px-10 lg:px-20 py-16 relative">
        <div className="max-w-2xl mx-auto relative">

          {/* Phone doodle — left */}
          <div className="hidden sm:block absolute -left-24 top-0 pointer-events-none">
            <Image src="/images/phone 01-01.png" alt="" width={90} height={110} className="opacity-90" />
          </div>

          {/* Envelope doodle — right */}
          <div className="hidden sm:block absolute -right-24 bottom-24 pointer-events-none">
            <Image src="/images/email-01.png" alt="" width={90} height={80} className="opacity-90" />
          </div>

          <h1 className="text-4xl sm:text-5xl text-center mb-12" style={{ fontFamily: 'var(--font-mossy), cursive' }}>
            Contact Us
          </h1>

          {isSubmitted ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-2">Message Sent!</h3>
              <p className="text-stone-500 mb-6">We&apos;ll get back to you within 24 hours.</p>
              <button onClick={() => setIsSubmitted(false)} className="text-[#ff8c6b] underline">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">First Name *</label>
                  <Input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" required className="border-stone-200 focus:border-[#ff7f5c] focus:ring-[#ff7f5c]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Last Name *</label>
                  <Input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" required className="border-stone-200 focus:border-[#ff7f5c] focus:ring-[#ff7f5c]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Email *</label>
                <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required className="border-stone-200 focus:border-[#ff7f5c] focus:ring-[#ff7f5c]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Phone</label>
                <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+971 50 123 4567" className="border-stone-200 focus:border-[#ff7f5c] focus:ring-[#ff7f5c]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Subject *</label>
                <Input name="subject" value={formData.subject} onChange={handleChange} placeholder="How can we help?" required className="border-stone-200 focus:border-[#ff7f5c] focus:ring-[#ff7f5c]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Message *</label>
                <textarea name="message" value={formData.message} onChange={handleChange} rows={4} required className="flex w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f5c] focus:border-[#ff7f5c]" placeholder="Tell us more about your inquiry..." />
              </div>

              {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

              <Button type="submit" className="w-full bg-[#ff7f5c] hover:bg-[#e67854] text-white h-12" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : <><Send className="h-4 w-4 mr-2" />Send Message</>}
              </Button>
            </form>
          )}

          {/* Footer info */}
          <div className="mt-14 text-center space-y-1 text-stone-600">
            <p>
              For collaborations :{" "}
              <a href="mailto:info@mamalukitchen.com" className="hover:text-[#ff8c6b] transition-colors">
                info@mamalukitchen.com
              </a>
            </p>
            <p>
              Tel{" "}
              <a href="https://wa.me/971527479512" target="_blank" rel="noopener noreferrer" className="hover:text-[#ff8c6b] transition-colors">
                +971 52 747 9512
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-12 bg-stone-50 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl mb-6" style={{ fontFamily: 'var(--font-mossy), cursive' }}>What People Say</h2>
          <blockquote className="text-stone-600 text-lg leading-relaxed italic mb-3">
            &ldquo;The nanny classes were one of the best investments I have ever made!&rdquo;
          </blockquote>
          <p className="text-stone-800 font-semibold">— Maya A.</p>
        </div>
      </section>

    </div>
  );
}
