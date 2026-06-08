/**
 * Seed Eazy Freezy Products to Sanity
 * 
 * Run with: npx ts-node scripts/seed-eazy-freezy-products.ts
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
  token: process.env.SANITY_API_TOKEN, // Optional: for write access
  apiVersion: '2024-01-01',
});

// Eazy Freezy Products scraped from mamalukitchen.com
const eazyFreezyProducts = [
  { title: "Truffle Sauce", price: 78.00, category: "sauces" },
  { title: "Rigatoni Pasta", price: 10.00, category: "pasta" },
  { title: "Gnocchi Potato", price: 30.00, category: "pasta" },
  { title: "Orecchiete Pasta", price: 25.00, category: "pasta" },
  { title: "Spinach Fatayer", price: 29.00, category: "savory" },
  {
    title: "Cheese Rolls",
    price: 38.10,
    category: "savory",
    description: "Crispy cheese rolls that can be baked or air fried. Perfect for lunch boxes and snacks. Ingredients: Spring Roll Wrappers, Akawi Cheese, Mozzarella Cheese, Flour, Eggs, Feta Cheese, Black Sesame Seeds, Parsley. Weight: 450g (18pcs)",
  },
  { title: "Mini Cheese Rolls", price: 39.00, category: "savory" },
  {
    title: "Musakhan Rolls",
    price: 60.00,
    category: "savory",
    description: "Crispy, flaky baked wraps filled with hormone-free chicken and sumac. Lunch box and dinner party friendly as well. Ingredients: Markook Bread, Chicken Breast, Lemon Powder, Onion, Sumac Powder, Himalayan Pink Salt, Black Pepper, Olive Oil, Pomegranate Molasses. Weight: 594g",
  },
  { title: "Churros", price: 28.00, category: "desserts" },
  { title: "Vegetable Gyoza", price: 28.00, category: "asian" },
  { title: "Prawn Gyoza", price: 28.00, category: "asian" },
  { title: "Kid Lunch Box Bundle", price: 165.00, category: "bundles" },
  { title: "Cheese Sambousek", price: 26.00, category: "savory" },
  { title: "Falafel", price: 25.00, category: "savory" },
  { title: "Stuffed Zucchini", price: 39.00, category: "mains" },
  { title: "Stuffed Cabbage Rolls", price: 60.00, category: "mains" },
  {
    title: "Beef Sambousek",
    price: 34.53,
    category: "savory",
    description: "Hormone-free beef sambousek made with flour, red onion, water, corn flour, labneh, pine seeds, oil, pomegranate molasses, salt, white pepper, black pepper, sweet pepper, cinnamon powder, seven spices, and nutmeg. Weight: 490g (14pcs)",
  },
  {
    title: "Mini Cheese Croissant",
    price: 35.00,
    category: "savory",
    description: "Mini cheese croissants made with wheat flour, butter, honey, water, salt, and halloumi cheese. Weight: 300g (10pcs)",
  },
  {
    title: "Mini Zataar Croissant",
    price: 36.00,
    category: "savory",
    description: "Mini zataar croissants made with wheat flour, butter, honey, water, salt, and zataar (sumac, thyme, sesame seeds, olive oil). Weight: 300g (10pcs)",
  },
  { title: "Bolognese Sauce With Hidden Vegetables", price: 60.00, category: "sauces" },
  { title: "Manti (Spinach Filling)", price: 30.00, category: "mains" },
  {
    title: "Mini Meat Kibbe",
    price: 43.35,
    category: "savory",
    description: "Mini meat kibbe that can be boiled, fried, or baked. Can also be cooked and served with hot natural yoghurt. Ingredients: Minced Beef, Burghul, Himalayan Pink Salt, Onion, Black Pepper, Seven Spices, Coconut Oil, Pinenuts. Weight: 360g (24pcs)",
  },
  { title: "Mini Pumpkin Kibbe", price: 40.00, category: "savory" },
  { title: "Ouzi", price: 50.00, category: "mains" },
  {
    title: "Quinoa Crusted Chicken Tenders",
    price: 43.34,
    category: "mains",
    description: "A kids favourite, crunchy baked chicken tenders made with hormone-free chicken breast and quinoa crust. Ingredients: Chicken Breast, Himalayan Pink Salt, Garlic Powder, Black Pepper, Quinoa, Bread Crumbs, Egg White, Olive Oil. Weight: 500g (12pcs)",
  },
  {
    title: "Shish Barak (Meat dumplings)",
    price: 38.10,
    category: "mains",
    description: "Mini meat dumplings that are cooked in a yoghurt sauce. Ingredients: Flour, Himalayan Pink Salt, Minced Beef, Olive Oil, Onion, Black Pepper, Seven Spices. Weight: 360g (60pcs)",
  },
  {
    title: "Smiley Face Pizza",
    price: 34.53,
    category: "kids",
    description: "Wholewheat smiley face pizzas perfect for lunch boxes and snacks on the go. Ingredients: Yeast, Flour, Honey, Olive Oil, Himalayan Pink Salt, Tomato Sauce, Garlic, Dry Oregano, Dry Basil, Mozzarella, Black Olives, Red Capsicum, White Button Mushroom. Weight: 360g (18pcs)",
  },
];

const categories = [
  { title: "Pasta", slug: "pasta" },
  { title: "Sauces", slug: "sauces" },
  { title: "Savory Snacks", slug: "savory" },
  { title: "Main Dishes", slug: "mains" },
  { title: "Asian", slug: "asian" },
  { title: "Desserts", slug: "desserts" },
  { title: "Kids Favorites", slug: "kids" },
  { title: "Bundles", slug: "bundles" },
];

async function seedProducts() {
  console.log("🌱 Starting Eazy Freezy product seeding...\n");

  // First, create categories
  console.log("📁 Creating categories...");
  const categoryRefs: Record<string, string> = {};
  
  for (const cat of categories) {
    const existingCat = await client.fetch(
      `*[_type == "productCategory" && slug.current == $slug][0]`,
      { slug: cat.slug }
    );

    if (existingCat) {
      categoryRefs[cat.slug] = existingCat._id;
      console.log(`  ✓ Category "${cat.title}" already exists`);
    } else {
      const newCat = await client.create({
        _type: "productCategory",
        title: cat.title,
        slug: { _type: "slug", current: cat.slug },
      });
      categoryRefs[cat.slug] = newCat._id;
      console.log(`  ✓ Created category "${cat.title}"`);
    }
  }

  // Then, create products
  console.log("\n📦 Creating products...");
  
  for (const product of eazyFreezyProducts) {
    const slug = product.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existingProduct = await client.fetch(
      `*[_type == "product" && slug.current == $slug][0]`,
      { slug }
    );

    const categoryRef = categoryRefs[product.category];

    if (existingProduct) {
      const description =
        product.description ||
        `Delicious ${product.title} from Mamalu Kitchen's Eazy Freezy collection. Ready to heat and serve!`;

      await client.patch(existingProduct._id).set({
        title: product.title,
        price: product.price,
        description,
        categories: categoryRef ? [{ _type: "reference", _ref: categoryRef }] : [],
      }).commit();

      console.log(`  ✓ Updated "${product.title}" - AED ${product.price}`);
      continue;
    }

    const description =
      product.description ||
      `Delicious ${product.title} from Mamalu Kitchen's Eazy Freezy collection. Ready to heat and serve!`;
    
    await client.create({
      _type: "product",
      title: product.title,
      slug: { _type: "slug", current: slug },
      description,
      price: product.price,
      inStock: true,
      featured: product.price > 50,
      categories: categoryRef ? [{ _type: "reference", _ref: categoryRef }] : [],
    });
    
    console.log(`  ✓ Created "${product.title}" - AED ${product.price}`);
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   Created ${categories.length} categories`);
  console.log(`   Created ${eazyFreezyProducts.length} products`);
}

seedProducts().catch(console.error);
