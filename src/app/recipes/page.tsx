import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChefHat, ArrowRight } from "lucide-react";
import { getRecipes } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/client";

export const metadata: Metadata = {
  title: "Recipes",
  description:
    "Explore our collection of authentic recipes from traditional family dishes to modern culinary creations.",
};

interface Recipe {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  cookingTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  categories?: { _id: string; title: string; slug: { current: string } }[];
}

const difficultyColors = {
  easy: "success",
  medium: "default",
  hard: "destructive",
} as const;

export default async function RecipesPage() {
  const recipes: Recipe[] = await getRecipes() || [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900">
              Our Recipes
            </h1>
            <p className="mt-6 text-lg text-stone-600">
              From traditional family favorites to modern culinary innovations,
              discover dishes that will delight your taste buds.
            </p>
          </div>
        </div>
      </section>

      {/* Recipe Grid */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {recipes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recipes.map((recipe) => (
                <Card
                  key={recipe._id}
                  className="group overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center relative overflow-hidden">
                    {recipe.mainImage ? (
                      <Image
                        src={urlFor(recipe.mainImage).width(600).height(340).url()}
                        alt={recipe.mainImage.alt || recipe.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <ChefHat className="h-12 w-12 text-amber-600/30" />
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {recipe.categories?.map((cat) => (
                        <Badge key={cat._id} variant="secondary">
                          {cat.title}
                        </Badge>
                      ))}
                      <Badge variant={difficultyColors[recipe.difficulty]}>
                        {recipe.difficulty}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold text-stone-900 mb-2 group-hover:text-amber-600 transition-colors">
                      {recipe.title}
                    </h3>
                    <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                      {recipe.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {recipe.cookingTime} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {recipe.servings} servings
                      </div>
                    </div>
                    <Link
                      href={`/recipes/${recipe.slug.current}`}
                      className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700"
                    >
                      View recipe
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ChefHat className="h-16 w-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">
                No recipes yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
