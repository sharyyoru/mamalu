import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, Heart, ArrowRight } from "lucide-react";

const primaryLinks = [
  { name: "Home", href: "/" },
  { name: "Classes", href: "/book" },
  { name: "Shop", href: "/products" },
];

const secondaryLinks = {
  explore: [
    { name: "Blog", href: "/blogs" },
    { name: "Our Story", href: "/about" },
  ],
  services: [
    { name: "Mini Chef", href: "/minichef" },
    { name: "Big Chef", href: "/bigchef" },
    { name: "Rentals", href: "/book/rentals" },
  ],
  support: [
    { name: "Contact Us", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

const socialLinks = [
  { name: "Instagram", href: "https://www.instagram.com/mamalukitchen/", icon: Instagram },
  { name: "Facebook", href: "https://www.facebook.com/MAMALUSKITCHEN/", icon: Facebook },
  { name: "YouTube", href: "https://www.youtube.com/channel/UCBmhc9N-9imnv_CAITvp6oA", icon: Youtube },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Main Footer */}
      <div className="bg-gradient-to-b from-stone-900 to-stone-950 text-stone-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-3 lg:col-span-2">
              <Link href="/" className="inline-block group">
                <Image 
                  src="/graphics/mamalu-logo-transparent.png" 
                  alt="Mamalu Kitchen" 
                  width={80} 
                  height={80}
                  className="h-16 w-16 transition-transform group-hover:scale-105"
                />
              </Link>
              <p className="mt-4 text-stone-400 max-w-sm">
                Fun, healthy cooking classes for kids and families in Dubai. 
                Creating delicious memories since 2020.
              </p>
              
              {/* Contact Info */}
              <div className="mt-6 space-y-3">
                <a href="mailto:info@mamalukitchen.com" className="flex items-center gap-3 text-stone-400 hover:text-[#ff8c6b] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center">
                    <Mail className="h-4 w-4" />
                  </div>
                  info@mamalukitchen.com
                </a>
                <a href="https://wa.me/971527479512" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-stone-400 hover:text-[#ff8c6b] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center">
                    <Phone className="h-4 w-4" />
                  </div>
                  +971 52 747 9512
                </a>
                <div className="flex items-center gap-3 text-stone-400">
                  <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  Depachika Food Hall, Nakheel Mall, Palm Jumeirah, Dubai
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
