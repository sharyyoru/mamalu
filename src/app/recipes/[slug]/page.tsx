import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChefHat, ArrowLeft, Printer } from "lucide-react";
import { formatDate } from "@/lib/utils";
// import { getRecipeBySlug } from "@/lib/sanity/queries";

interface RecipePageProps {
  params: Promise<{ slug: string }>;
}

// Placeholder data
const recipesData: Record<string, {
  _id: string;
  title: string;
  excerpt: string;
  cookingTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  categories: { _id: string; title: string }[];
  ingredients: string[];
  instructions: string[];
}> = {
  "classic-shakshuka": {
    _id: "1",
    title: "Classic Shakshuka",
    excerpt: "A hearty Middle Eastern breakfast of eggs poached in spiced tomato sauce.",
    cookingTime: 30,
    servings: 4,
    difficulty: "easy",
    categories: [{ _id: "1", title: "Breakfast" }],
    ingredients: [
      "2 tbsp olive oil",
      "1 onion, diced",
      "1 red bell pepper, diced",
      "4 cloves garlic, minced",
      "1 can (400g) crushed tomatoes",
      "1 tsp cumin",
      "1 tsp paprika",
      "1/2 tsp cayenne pepper",
      "6 eggs",
      "Fresh cilantro for garnish",
      "Crusty bread for serving",
    ],
    instructions: [
      "Heat olive oil in a large skillet over medium heat. Add onion and bell pepper, cook until softened, about 5 minutes.",
      "Add garlic and cook for another minute until fragrant.",
      "Pour in crushed tomatoes and add spices. Simmer for 10 minutes until slightly thickened.",
      "Make 6 wells in the sauce and crack an egg into each well.",
      "Cover and cook for 5-8 minutes until egg whites are set but yolks are still runny.",
      "Garnish with fresh cilantro and serve with crusty bread.",
    ],
  },
};

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = recipesData[slug];

  if (!recipe) {
    return { title: "Recipe Not Found" };
  }

  return {
    title: recipe.title,
    description: recipe.excerpt,
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const recipe = recipesData[slug];

  if (!recipe) {
    notFound();
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-stone-100 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild href="/recipes" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Recipes
          </Button>
          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.categories?.map((cat) => (
              <Badge key={cat._id} variant="secondary">
                {cat.title}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900">
            {recipe.title}
          </h1>
          <p className="mt-4 text-lg text-stone-600">{recipe.excerpt}</p>
          <div className="flex flex-wrap items-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-stone-600">
              <Clock className="h-5 w-5 text-amber-600" />
              {recipe.cookingTime} minutes
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <Users className="h-5 w-5 text-amber-600" />
              {recipe.servings} servings
            </div>
            <Badge
              variant={
                recipe.difficulty === "easy"
                  ? "success"
                  : recipe.difficulty === "medium"
                  ? "default"
                  : "destructive"
              }
            >
              {recipe.difficulty}
            </Badge>
          </div>
        </div>
      </section>

      {/* Recipe Content */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Image Placeholder */}
          <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center mb-12">
            <ChefHat className="h-20 w-20 text-amber-600/30" />
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Ingredients */}
            <div className="md:col-span-1">
              <h2 className="text-xl font-bold text-stone-900 mb-4">
                Ingredients
              </h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-stone-600"
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                    {ingredient}
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold text-stone-900 mb-4">
                Instructions
              </h2>
              <ol className="space-y-4">
                {recipe.instructions.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 font-semibold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-stone-600 pt-1">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
