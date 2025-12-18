/**
 * Seed Eazy Freezy Products to Sanity
 * 
 * Run with: npx ts-node scripts/seed-eazy-freezy-products.ts
 * 
 * Note: You need to have SANITY_PROJECT_ID and SANITY_TOKEN env variables set
 */

import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'your-project-id',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
});

// Eazy Freezy Products scraped from mamalukitchen.com
const eazyFreezyProducts = [
  { title: "Truffle Sauce", price: 78.00, category: "sauces" },
  { title: "Rigatoni Pasta", price: 10.00, category: "pasta" },
  { title: "Gnocchi Potato", price: 30.00, category: "pasta" },
  { title: "Orecchiete Pasta", price: 25.00, category: "pasta" },
  { title: "Spinach Fatayer", price: 29.00, category: "savory" },
  { title: "Cheese Rolls", price: 38.10, category: "savory" },
  { title: "Mini Cheese Rolls", price: 39.00, category: "savory" },
  { title: "Musakhan Rolls", price: 60.00, category: "savory" },
  { title: "Churros", price: 28.00, category: "desserts" },
  { title: "Vegetable Gyoza", price: 28.00, category: "asian" },
  { title: "Prawn Gyoza", price: 28.00, category: "asian" },
  { title: "Kid Lunch Box Bundle", price: 165.00, category: "bundles" },
  { title: "Cheese Sambousek", price: 26.00, category: "savory" },
  { title: "Falafel", price: 25.00, category: "savory" },
  { title: "Stuffed Zucchini", price: 39.00, category: "mains" },
  { title: "Stuffed Cabbage Rolls", price: 60.00, category: "mains" },
  { title: "Beef Sambousek", price: 34.53, category: "savory" },
  { title: "Mini Zataar Croissant", price: 36.00, category: "savory" },
  { title: "Bolognese Sauce With Hidden Vegetables", price: 60.00, category: "sauces" },
  { title: "Manti (Spinach Filling)", price: 30.00, category: "mains" },
  { title: "Mini Meat Kibbe", price: 43.35, category: "savory" },
  { title: "Mini Pumpkin Kibbe", price: 40.00, category: "savory" },
  { title: "Ouzi", price: 50.00, category: "mains" },
  { title: "Quinoa Crusted Chicken Tenders", price: 43.34, category: "mains" },
  { title: "Smiley Face Pizza", price: 34.53, category: "kids" },
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

    if (existingProduct) {
      console.log(`  ⏭ Product "${product.title}" already exists`);
      continue;
    }

    const categoryRef = categoryRefs[product.category];
    
    await client.create({
      _type: "product",
      title: product.title,
      slug: { _type: "slug", current: slug },
      description: `Delicious ${product.title} from Mamalu Kitchen's Eazy Freezy collection. Ready to heat and serve!`,
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
