import { Metadata } from "next";
import Image from "next/image";
import { ChefHat, Heart, Award, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Mamalu Kitchen's story, our passion for authentic cooking, and our mission to bring families together through food.",
};

const values = [
  {
    icon: Heart,
    title: "Passion for Food",
    description:
      "Every recipe is crafted with love and dedication to authentic flavors.",
  },
  {
    icon: Award,
    title: "Quality First",
    description:
      "We source only the finest ingredients for our products and classes.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Building a community of food lovers who share our passion for cooking.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src="/images/apron.png" alt="" width={80} height={80} className="absolute top-[8%] left-[3%] opacity-[0.06] animate-doodle-float" />
          <Image src="/images/whisk-01.png" alt="" width={70} height={70} className="absolute top-[12%] right-[4%] opacity-[0.06] animate-doodle-wiggle" style={{animationDelay: '1s'}} />
          <Image src="/images/recipes_layout_07.png" alt="" width={50} height={50} className="absolute bottom-[10%] left-[6%] opacity-[0.05] animate-doodle-scale" style={{animationDelay: '2s'}} />
          <Image src="/images/salt-01.png" alt="" width={55} height={55} className="absolute bottom-[15%] right-[5%] opacity-[0.05] animate-doodle-float" style={{animationDelay: '1.5s'}} />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
              About Mamalu Kitchen
            </h1>
            <p className="mt-6 text-lg text-stone-600">
              Founded with a simple mission: to preserve and share the authentic
              flavors of home-cooked meals with the world.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-stone-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-stone-600">
                <p>
                  Mamalu Kitchen began as a small family venture, born from a
                  deep love for traditional cooking passed down through
                  generations. What started in a humble home kitchen has grown
                  into a beloved culinary destination.
                </p>
                <p>
                  Our founder&apos;s grandmother, Mama Lu, believed that food is
                  more than nourishment—it&apos;s a way to express love, preserve
                  culture, and bring families together. Her recipes and wisdom
                  form the foundation of everything we do.
                </p>
                <p>
                  Today, we continue Mama Lu&apos;s legacy by sharing authentic
                  recipes, offering premium cooking products, and teaching the
                  next generation of home cooks through our classes.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden">
                <Image
                  src="/images/Lama_Jammal_pic.jpeg"
                  alt="Lama - Founder of Mamalu Kitchen"
                  fill
                  className="object-cover"
                  quality={100}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">
            Our Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white p-8 rounded-xl shadow-sm text-center"
              >
                <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-stone-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
