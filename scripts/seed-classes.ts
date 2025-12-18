/**
 * Seed Classes to Sanity from mamalukitchen.com
 * 
 * Run with: npx ts-node scripts/seed-classes.ts
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

// Classes data scraped from mamalukitchen.com/classes
const classesData = [
  // Kids Classes
  {
    title: "Little Chefs Academy",
    classType: "kids",
    description: "Fun cooking adventures for children aged 4-8. Learn basic kitchen skills, food safety, and create delicious recipes in a safe, supervised environment.",
    numberOfSessions: 4,
    pricePerSession: 150,
    fullPrice: 550,
    spotsAvailable: 12,
    ageRange: "4-8 years",
    duration: "1.5 hours",
  },
  {
    title: "Junior Master Chef",
    classType: "kids",
    description: "Advanced cooking techniques for kids aged 8-12. Master knife skills, international cuisines, and plating techniques like a pro chef.",
    numberOfSessions: 6,
    pricePerSession: 175,
    fullPrice: 950,
    spotsAvailable: 10,
    ageRange: "8-12 years",
    duration: "2 hours",
  },
  {
    title: "Baking Buddies",
    classType: "kids",
    description: "Learn the art of baking with fun recipes including cookies, cupcakes, breads, and pastries. Perfect for little ones who love sweet treats!",
    numberOfSessions: 4,
    pricePerSession: 160,
    fullPrice: 580,
    spotsAvailable: 8,
    ageRange: "5-10 years",
    duration: "1.5 hours",
  },
  // Family Classes
  {
    title: "Family Cooking Night",
    classType: "family",
    description: "Bond with your family while cooking a complete meal together. Learn teamwork in the kitchen and create lasting memories.",
    numberOfSessions: 1,
    pricePerSession: 350,
    fullPrice: 350,
    spotsAvailable: 6,
    ageRange: "All ages",
    duration: "2.5 hours",
  },
  {
    title: "Parent & Child Italian",
    classType: "family",
    description: "Make fresh pasta, pizza, and classic Italian dishes together. A delicious bonding experience for parent and child teams.",
    numberOfSessions: 3,
    pricePerSession: 300,
    fullPrice: 850,
    spotsAvailable: 8,
    ageRange: "6+ with parent",
    duration: "2 hours",
  },
  {
    title: "Weekend Brunch Club",
    classType: "family",
    description: "Learn to make the perfect brunch spread - from fluffy pancakes to eggs benedict. Families cook and dine together!",
    numberOfSessions: 2,
    pricePerSession: 280,
    fullPrice: 520,
    spotsAvailable: 10,
    ageRange: "All ages",
    duration: "2 hours",
  },
  // Birthday Parties
  {
    title: "Pizza Party Package",
    classType: "birthday",
    description: "The ultimate pizza party! Kids make their own pizzas with fun toppings, play kitchen games, and enjoy a birthday celebration.",
    numberOfSessions: 1,
    pricePerSession: 1500,
    fullPrice: 1500,
    spotsAvailable: 15,
    ageRange: "5-12 years",
    duration: "3 hours",
  },
  {
    title: "Cupcake Decorating Party",
    classType: "birthday",
    description: "A sweet celebration where kids decorate cupcakes with colorful frosting, sprinkles, and creative designs. Includes birthday treats!",
    numberOfSessions: 1,
    pricePerSession: 1200,
    fullPrice: 1200,
    spotsAvailable: 12,
    ageRange: "4-10 years",
    duration: "2.5 hours",
  },
  {
    title: "MasterChef Birthday",
    classType: "birthday",
    description: "A competitive cooking party inspired by MasterChef! Kids compete in fun challenges and everyone takes home their creations.",
    numberOfSessions: 1,
    pricePerSession: 1800,
    fullPrice: 1800,
    spotsAvailable: 10,
    ageRange: "8-14 years",
    duration: "3 hours",
  },
  // Adult Classes
  {
    title: "Mediterranean Mastery",
    classType: "adults",
    description: "Explore the flavors of the Mediterranean with authentic recipes from Greece, Lebanon, and Morocco. Wine pairing included!",
    numberOfSessions: 4,
    pricePerSession: 250,
    fullPrice: 900,
    spotsAvailable: 12,
    ageRange: "18+",
    duration: "3 hours",
  },
  {
    title: "Date Night Cooking",
    classType: "adults",
    description: "Perfect for couples! Cook a romantic three-course meal together. Includes wine, candles, and a beautiful dining experience.",
    numberOfSessions: 1,
    pricePerSession: 500,
    fullPrice: 500,
    spotsAvailable: 8,
    ageRange: "21+",
    duration: "3 hours",
  },
  {
    title: "Meal Prep Masterclass",
    classType: "adults",
    description: "Learn efficient meal prep techniques to save time and eat healthy all week. Take home a week's worth of prepared meals!",
    numberOfSessions: 2,
    pricePerSession: 300,
    fullPrice: 550,
    spotsAvailable: 10,
    ageRange: "18+",
    duration: "4 hours",
  },
];

async function seedClasses() {
  console.log("🌱 Starting Classes seeding...\n");

  console.log("📚 Creating classes...");
  
  for (const cls of classesData) {
    const slug = cls.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existingClass = await client.fetch(
      `*[_type == "cookingClass" && slug.current == $slug][0]`,
      { slug }
    );

    if (existingClass) {
      console.log(`  ⏭ Class "${cls.title}" already exists`);
      continue;
    }

    // Set start date to next week
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7 + Math.floor(Math.random() * 21)); // 7-28 days from now
    
    await client.create({
      _type: "cookingClass",
      title: cls.title,
      slug: { _type: "slug", current: slug },
      description: cls.description,
      classType: cls.classType,
      numberOfSessions: cls.numberOfSessions,
      pricePerSession: cls.pricePerSession,
      fullPrice: cls.fullPrice,
      spotsAvailable: cls.spotsAvailable,
      startDate: startDate.toISOString().split('T')[0],
      // Default values
      isActive: true,
      featured: cls.fullPrice > 800,
    });
    
    console.log(`  ✓ Created "${cls.title}" (${cls.classType}) - AED ${cls.fullPrice}`);
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   Created ${classesData.length} classes`);
}

seedClasses().catch(console.error);
