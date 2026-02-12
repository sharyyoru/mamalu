import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Baby, ChefHat, Sparkles, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Cooking Classes",
  description:
    "Join our hands-on cooking classes and learn authentic recipes from expert chefs.",
};

const categories = [
  { id: "kids", label: "Kids Classes", icon: Baby, color: "from-pink-500 to-rose-500", emoji: "👶", description: "Fun cooking adventures for little chefs aged 4-12" },
  { id: "adults", label: "Adult Classes", icon: ChefHat, color: "from-emerald-500 to-teal-600", emoji: "�‍🍳", description: "Master new cuisines and techniques with expert guidance" },
  { id: "rentals", label: "Rentals", icon: MapPin, color: "from-violet-500 to-purple-600", emoji: "�", description: "Book our private space for your special events" },
];

export default async function ClassesPage({
}) {

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-mesh py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-[#ff8c6b]/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-[#ffa891]/15 to-transparent rounded-full blur-3xl" />
          <Image src="/images/whisk-01.png" alt="" width={80} height={80} className="absolute top-[10%] left-[3%] opacity-[0.07] animate-doodle-float" />
          <Image src="/images/pot-01.png" alt="" width={70} height={70} className="absolute top-[15%] right-[4%] opacity-[0.06] animate-doodle-wiggle" style={{animationDelay: '1s'}} />
          <Image src="/images/rolling pin-01.png" alt="" width={75} height={75} className="absolute bottom-[10%] left-[8%] opacity-[0.06] animate-doodle-scale" style={{animationDelay: '2s'}} />
          <Image src="/images/pasta-01.png" alt="" width={70} height={70} className="absolute bottom-[15%] right-[6%] opacity-[0.05] animate-doodle-float" style={{animationDelay: '1.5s'}} />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass-peach text-[#ff8c6b] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Learn. Cook. Create.
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Cooking <span className="text-gradient">Classes</span>
            </h1>
            <p className="text-lg lg:text-xl text-stone-600 max-w-2xl mx-auto">
              From little bakers to master chefs, find the perfect class for you and your family
            </p>
          </div>

        </div>
      </section>

      {/* Category Cards */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/classes/${cat.id}`}
                  className="group glass-card rounded-3xl overflow-hidden card-hover"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Icon Header */}
                  <div className={`aspect-[4/3] relative overflow-hidden bg-gradient-to-br ${cat.color} p-8 flex flex-col items-center justify-center text-white`}>
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
                    </div>
                    <div className="relative z-10 text-center">
                      <div className="text-7xl mb-4 animate-float">
                        {cat.emoji}
                      </div>
                      <Icon className="h-16 w-16 mx-auto opacity-50" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-stone-900 mb-3 group-hover:text-[#ff8c6b] transition-colors">
                      {cat.label}
                    </h3>
                    <p className="text-stone-600 text-sm mb-6">
                      {cat.description}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                      <span className="text-sm text-stone-500">
                        Click to explore
                      </span>
                      <span className="flex items-center gap-1 text-[#ff8c6b] font-semibold group-hover:gap-2 transition-all">
                        Explore
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 gradient-mesh relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src="/images/apron.png" alt="" width={60} height={60} className="absolute top-[10%] left-[5%] opacity-[0.05] animate-doodle-float" />
          <Image src="/images/gloves-01.png" alt="" width={55} height={55} className="absolute bottom-[10%] right-[5%] opacity-[0.05] animate-doodle-wiggle" style={{animationDelay: '1s'}} />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="glass-card rounded-3xl p-8 sm:p-12 glow-peach-sm">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-stone-600 mb-6">
              We offer private classes and custom birthday party packages. Get in touch to discuss your needs!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="gradient-peach-glow text-white rounded-full px-6" asChild>
                <Link href="/contact" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Contact Us
                </Link>
              </Button>
              <Button variant="outline" className="glass border-0 rounded-full px-6" asChild>
                <Link href="/classes?type=birthday" className="flex items-center gap-2">
                  🎂 Birthday Parties
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
