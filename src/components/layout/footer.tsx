import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin, Heart, ArrowRight } from "lucide-react";

const primaryLinks = [
  { name: "Home", href: "/" },
  { name: "Classes", href: "/classes" },
  { name: "Shop", href: "/products" },
];

const secondaryLinks = {
  explore: [
    { name: "Recipes", href: "/recipes" },
    { name: "Blog", href: "/blogs" },
    { name: "Our Story", href: "/about" },
  ],
  services: [
    { name: "Private Events", href: "/services/events" },
    { name: "Food Consultancy", href: "/services/consultancy" },
    { name: "Birthday Parties", href: "/classes?type=birthday" },
  ],
  support: [
    { name: "Contact Us", href: "/contact" },
    { name: "Press", href: "/press" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

const socialLinks = [
  { name: "Instagram", href: "#", icon: Instagram },
  { name: "Facebook", href: "#", icon: Facebook },
  { name: "Twitter", href: "#", icon: Twitter },
  { name: "YouTube", href: "#", icon: Youtube },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-[#ff8c6b] via-[#ffa891] to-[#ff8c6b] py-12 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to Start Your Culinary Journey?
          </h3>
          <p className="text-white/80 mb-6">
            Join thousands of families creating delicious memories together
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/classes" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#ff8c6b] font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Book a Class
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full border border-white/30 hover:bg-white/30 transition-all"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-gradient-to-b from-stone-900 to-stone-950 text-stone-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-3 lg:col-span-2">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <Image 
                  src="/graphics/mamalu-logo.avif" 
                  alt="Mamalu Kitchen" 
                  width={60} 
                  height={60}
                  className="h-14 w-auto"
                />
                <span className="text-2xl font-bold text-white group-hover:text-[#ff8c6b] transition-colors">Mamalu</span>
              </Link>
              <p className="mt-4 text-stone-400 max-w-sm">
                Fun, healthy cooking classes for kids and families in Dubai. 
                Creating delicious memories since 2020.
              </p>
              
              {/* Contact Info */}
              <div className="mt-6 space-y-3">
                <a href="mailto:hello@mamalukitchen.com" className="flex items-center gap-3 text-stone-400 hover:text-[#ff8c6b] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center">
                    <Mail className="h-4 w-4" />
                  </div>
                  hello@mamalukitchen.com
                </a>
                <a href="tel:+971501234567" className="flex items-center gap-3 text-stone-400 hover:text-[#ff8c6b] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center">
                    <Phone className="h-4 w-4" />
                  </div>
                  +971 50 123 4567
                </a>
                <div className="flex items-center gap-3 text-stone-400">
                  <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  Dubai, UAE
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-3 mt-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:bg-[#ff8c6b] hover:text-white transition-all hover:scale-110"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon className="h-5 w-5" />
                    <span className="sr-only">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Primary Links */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Main</h3>
              <ul className="space-y-3">
                {primaryLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-stone-400 hover:text-[#ff8c6b] transition-colors flex items-center gap-1 group"
                    >
                      <span>{link.name}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Explore */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Explore</h3>
              <ul className="space-y-3">
                {secondaryLinks.explore.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-stone-400 hover:text-[#ff8c6b] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Services</h3>
              <ul className="space-y-3">
                {secondaryLinks.services.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-stone-400 hover:text-[#ff8c6b] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h3>
              <ul className="space-y-3">
                {secondaryLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-stone-400 hover:text-[#ff8c6b] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-stone-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-stone-500 flex items-center gap-1">
                &copy; {new Date().getFullYear()} Mamalu Kitchen. Made with 
                <Heart className="h-4 w-4 text-[#ff8c6b] fill-[#ff8c6b]" /> 
                in Dubai
              </p>
              <p className="text-sm text-stone-600">
                Powered by <span className="text-[#ff8c6b]">Mutant</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
