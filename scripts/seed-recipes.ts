/**
 * Seed Recipes to Sanity from mamalukitchen.com
 * 
 * Run with: npx ts-node scripts/seed-recipes.ts
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

if (!projectId) {
  console.error('❌ Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local');
  process.exit(1);
}

console.log(`📌 Using Sanity Project: ${projectId}, Dataset: ${dataset}\n`);

const client = createClient({
  projectId,
  dataset,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
});

// Recipe categories
const recipeCategories = [
  { title: "Breakfast", slug: "breakfast" },
  { title: "Lunch", slug: "lunch" },
  { title: "Dinner", slug: "dinner" },
  { title: "Snacks", slug: "snacks" },
  { title: "Desserts", slug: "desserts" },
  { title: "Kids Favorites", slug: "kids-favorites" },
  { title: "Quick & Easy", slug: "quick-easy" },
  { title: "Healthy", slug: "healthy" },
];

// Recipes scraped/inspired from mamalukitchen.com/recipes
const recipesData = [
  {
    title: "Rainbow Veggie Pasta",
    category: "dinner",
    excerpt: "A colorful pasta dish loaded with hidden vegetables that kids will love. Perfect for picky eaters!",
    cookingTime: 25,
    prepTime: 15,
    servings: 4,
    difficulty: "easy",
    ingredients: [
      "400g pasta of choice",
      "1 zucchini, grated",
      "1 carrot, grated",
      "1 cup spinach, chopped",
      "2 cups marinara sauce",
      "1/2 cup parmesan cheese",
      "2 tbsp olive oil",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Cook pasta according to package directions. Reserve 1/2 cup pasta water.",
      "In a large pan, heat olive oil over medium heat.",
      "Add grated zucchini and carrot, sauté for 3-4 minutes until softened.",
      "Add spinach and cook until wilted.",
      "Pour in marinara sauce and simmer for 5 minutes.",
      "Toss cooked pasta with the vegetable sauce, adding pasta water if needed.",
      "Top with parmesan cheese and serve immediately."
    ],
    featured: true,
  },
  {
    title: "Mini Pizza Faces",
    category: "kids-favorites",
    excerpt: "Fun mini pizzas where kids can create their own funny faces using healthy toppings!",
    cookingTime: 15,
    prepTime: 20,
    servings: 6,
    difficulty: "easy",
    ingredients: [
      "6 English muffins, halved",
      "1 cup pizza sauce",
      "2 cups mozzarella cheese, shredded",
      "Cherry tomatoes, halved",
      "Black olives, sliced",
      "Bell peppers, cut into shapes",
      "Mushrooms, sliced"
    ],
    instructions: [
      "Preheat oven to 375°F (190°C).",
      "Place English muffin halves on a baking sheet.",
      "Spread pizza sauce on each muffin half.",
      "Sprinkle with mozzarella cheese.",
      "Let kids create funny faces using the vegetable toppings.",
      "Bake for 10-12 minutes until cheese is melted and bubbly.",
      "Let cool slightly before serving."
    ],
    featured: true,
  },
  {
    title: "Banana Oat Pancakes",
    category: "breakfast",
    excerpt: "Healthy and delicious pancakes made with oats and bananas. No added sugar needed!",
    cookingTime: 15,
    prepTime: 10,
    servings: 4,
    difficulty: "easy",
    ingredients: [
      "2 ripe bananas",
      "2 eggs",
      "1 cup rolled oats",
      "1/2 cup milk",
      "1 tsp vanilla extract",
      "1/2 tsp cinnamon",
      "Butter for cooking",
      "Fresh berries for topping"
    ],
    instructions: [
      "Blend oats in a blender until fine like flour.",
      "Add bananas, eggs, milk, vanilla, and cinnamon. Blend until smooth.",
      "Heat a non-stick pan over medium heat with a little butter.",
      "Pour 1/4 cup batter per pancake.",
      "Cook until bubbles form on surface, then flip.",
      "Cook another 1-2 minutes until golden.",
      "Serve with fresh berries and a drizzle of honey."
    ],
    featured: false,
  },
  {
    title: "Cheesy Veggie Quesadillas",
    category: "lunch",
    excerpt: "Crispy quesadillas packed with cheese and colorful vegetables. A lunchtime favorite!",
    cookingTime: 10,
    prepTime: 15,
    servings: 4,
    difficulty: "easy",
    ingredients: [
      "8 flour tortillas",
      "2 cups cheddar cheese, shredded",
      "1 bell pepper, diced",
      "1/2 cup corn kernels",
      "1/4 cup black beans",
      "1/4 cup salsa",
      "Sour cream for serving"
    ],
    instructions: [
      "Mix diced vegetables, corn, and black beans in a bowl.",
      "Place a tortilla in a dry skillet over medium heat.",
      "Sprinkle cheese on half the tortilla.",
      "Add vegetable mixture over the cheese.",
      "Fold tortilla in half and cook until golden, about 2 minutes per side.",
      "Cut into wedges and serve with salsa and sour cream."
    ],
    featured: false,
  },
  {
    title: "Fruit Rainbow Skewers",
    category: "snacks",
    excerpt: "Beautiful and healthy fruit skewers arranged in rainbow colors. Perfect for parties!",
    cookingTime: 0,
    prepTime: 20,
    servings: 8,
    difficulty: "easy",
    ingredients: [
      "Strawberries",
      "Orange segments",
      "Pineapple chunks",
      "Green grapes",
      "Blueberries",
      "Purple grapes",
      "Wooden skewers",
      "Yogurt for dipping"
    ],
    instructions: [
      "Wash and prepare all fruits.",
      "Thread fruits onto skewers in rainbow order: red, orange, yellow, green, blue, purple.",
      "Arrange on a serving platter.",
      "Serve with yogurt dipping sauce on the side.",
      "Keep refrigerated until ready to serve."
    ],
    featured: false,
  },
  {
    title: "Chocolate Avocado Mousse",
    category: "desserts",
    excerpt: "Creamy chocolate mousse made with avocado for a healthy twist. Kids won't guess the secret ingredient!",
    cookingTime: 0,
    prepTime: 10,
    servings: 4,
    difficulty: "easy",
    ingredients: [
      "2 ripe avocados",
      "1/4 cup cocoa powder",
      "1/4 cup honey or maple syrup",
      "1/4 cup milk",
      "1 tsp vanilla extract",
      "Pinch of salt",
      "Whipped cream for topping"
    ],
    instructions: [
      "Cut avocados in half and remove pits.",
      "Scoop avocado flesh into a food processor.",
      "Add cocoa powder, honey, milk, vanilla, and salt.",
      "Blend until completely smooth, scraping sides as needed.",
      "Divide into serving cups.",
      "Refrigerate for 30 minutes to firm up.",
      "Top with whipped cream before serving."
    ],
    featured: true,
  },
  {
    title: "Chicken Veggie Fried Rice",
    category: "dinner",
    excerpt: "Quick and healthy fried rice loaded with vegetables and tender chicken pieces.",
    cookingTime: 20,
    prepTime: 15,
    servings: 4,
    difficulty: "medium",
    ingredients: [
      "3 cups cooked rice, cooled",
      "2 chicken breasts, diced",
      "1 cup mixed vegetables (peas, carrots, corn)",
      "2 eggs, beaten",
      "3 tbsp soy sauce",
      "2 green onions, chopped",
      "2 tbsp vegetable oil",
      "1 tsp sesame oil"
    ],
    instructions: [
      "Heat oil in a large wok over high heat.",
      "Cook diced chicken until golden, about 5-6 minutes. Set aside.",
      "Add mixed vegetables to the wok and stir-fry for 2 minutes.",
      "Push vegetables to the side and scramble eggs in the empty space.",
      "Add cold rice and stir-fry for 3-4 minutes.",
      "Return chicken to the wok.",
      "Add soy sauce and sesame oil, toss to combine.",
      "Garnish with green onions and serve."
    ],
    featured: false,
  },
  {
    title: "Homemade Hummus with Veggie Sticks",
    category: "healthy",
    excerpt: "Creamy homemade hummus served with colorful vegetable sticks. A nutritious snack!",
    cookingTime: 0,
    prepTime: 15,
    servings: 6,
    difficulty: "easy",
    ingredients: [
      "1 can chickpeas, drained",
      "1/4 cup tahini",
      "2 tbsp lemon juice",
      "1 clove garlic",
      "2 tbsp olive oil",
      "Salt to taste",
      "Carrots, cucumbers, celery for dipping"
    ],
    instructions: [
      "Add chickpeas, tahini, lemon juice, garlic, and salt to a food processor.",
      "Blend while slowly drizzling in olive oil.",
      "Add water as needed for desired consistency.",
      "Blend until completely smooth.",
      "Transfer to a serving bowl and drizzle with olive oil.",
      "Serve with cut vegetable sticks."
    ],
    featured: false,
  },
];

async function seedRecipes() {
  console.log("🌱 Starting Recipes seeding...\n");

  // First, create categories
  console.log("📁 Creating recipe categories...");
  const categoryRefs: Record<string, string> = {};
  
  for (const cat of recipeCategories) {
    const existingCat = await client.fetch(
      `*[_type == "recipeCategory" && slug.current == $slug][0]`,
      { slug: cat.slug }
    );

    if (existingCat) {
      categoryRefs[cat.slug] = existingCat._id;
      console.log(`  ✓ Category "${cat.title}" already exists`);
    } else {
      const newCat = await client.create({
        _type: "recipeCategory",
        title: cat.title,
        slug: { _type: "slug", current: cat.slug },
      });
      categoryRefs[cat.slug] = newCat._id;
      console.log(`  ✓ Created category "${cat.title}"`);
    }
  }

  // Then, create recipes
  console.log("\n🍳 Creating recipes...");
  
  for (const recipe of recipesData) {
    const slug = recipe.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existingRecipe = await client.fetch(
      `*[_type == "recipe" && slug.current == $slug][0]`,
      { slug }
    );

    if (existingRecipe) {
      console.log(`  ⏭ Recipe "${recipe.title}" already exists`);
      continue;
    }

    const categoryRef = categoryRefs[recipe.category];
    
    await client.create({
      _type: "recipe",
      title: recipe.title,
      slug: { _type: "slug", current: slug },
      excerpt: recipe.excerpt,
      cookingTime: recipe.cookingTime,
      prepTime: recipe.prepTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      featured: recipe.featured,
      categories: categoryRef ? [{ _type: "reference", _ref: categoryRef }] : [],
      publishedAt: new Date().toISOString(),
    });
    
    console.log(`  ✓ Created "${recipe.title}" (${recipe.difficulty}) - ${recipe.cookingTime + recipe.prepTime} min total`);
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   Created ${recipeCategories.length} categories`);
  console.log(`   Created ${recipesData.length} recipes`);
}

seedRecipes().catch(console.error);
