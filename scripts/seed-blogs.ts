/**
 * Seed Blog Posts to Sanity for SEO/AEO
 * 
 * Run with: npx ts-node scripts/seed-blogs.ts
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

// SEO-optimized blog posts for Mamalu Kitchen
const blogPosts = [
  {
    title: "10 Easy Recipes to Cook with Your Kids This Weekend",
    slug: "easy-recipes-cook-with-kids-weekend",
    excerpt: "Discover simple, fun recipes that the whole family can enjoy making together. From homemade pizza to colorful fruit skewers, these dishes are perfect for young chefs.",
    category: "recipes",
    readTime: 8,
    featured: true,
    seoKeywords: ["cooking with kids", "easy family recipes", "weekend cooking", "kids in kitchen"],
  },
  {
    title: "The Ultimate Guide to Meal Prep for Busy Parents",
    slug: "meal-prep-guide-busy-parents",
    excerpt: "Learn how to save time and money by preparing healthy meals in advance. Our step-by-step guide will transform your weekly meal planning.",
    category: "tips",
    readTime: 12,
    featured: false,
    seoKeywords: ["meal prep", "busy parents", "healthy meals", "weekly planning"],
  },
  {
    title: "Why Cooking Classes Help Children Develop Life Skills",
    slug: "cooking-classes-children-life-skills",
    excerpt: "Explore the incredible benefits of cooking education for kids, from improved math skills to better nutrition awareness and confidence building.",
    category: "education",
    readTime: 6,
    featured: false,
    seoKeywords: ["kids cooking classes", "child development", "life skills", "cooking education"],
  },
  {
    title: "5 Healthy Lunch Box Ideas Your Kids Will Actually Eat",
    slug: "healthy-lunch-box-ideas-kids",
    excerpt: "Say goodbye to untouched lunches! These creative and nutritious lunch box ideas are kid-approved and parent-friendly.",
    category: "recipes",
    readTime: 5,
    featured: false,
    seoKeywords: ["healthy lunch", "kids lunch box", "school lunch ideas", "nutritious meals"],
  },
  {
    title: "How to Host the Perfect Cooking Birthday Party",
    slug: "cooking-birthday-party-guide",
    excerpt: "Planning a unique birthday celebration? Our complete guide to hosting a memorable cooking party that kids and parents will love.",
    category: "events",
    readTime: 10,
    featured: false,
    seoKeywords: ["birthday party ideas", "cooking party", "kids birthday", "unique celebration"],
  },
  {
    title: "Kitchen Safety Tips Every Parent Should Teach Their Kids",
    slug: "kitchen-safety-tips-kids",
    excerpt: "Keep your little chefs safe with these essential kitchen safety rules and age-appropriate tasks for children of all ages.",
    category: "tips",
    readTime: 7,
    featured: false,
    seoKeywords: ["kitchen safety", "kids cooking safety", "child safety kitchen", "cooking tips"],
  },
  {
    title: "From Picky Eater to Foodie: How Cooking Changes Children's Eating Habits",
    slug: "picky-eater-foodie-cooking-habits",
    excerpt: "Discover how involving children in cooking can transform even the pickiest eaters into adventurous food lovers.",
    category: "education",
    readTime: 9,
    featured: false,
    seoKeywords: ["picky eaters", "healthy eating habits", "kids nutrition", "food adventure"],
  },
  {
    title: "Mediterranean Cooking: A Family-Friendly Journey",
    slug: "mediterranean-cooking-family-friendly",
    excerpt: "Explore the delicious and healthy world of Mediterranean cuisine with recipes the whole family can enjoy together.",
    category: "recipes",
    readTime: 11,
    featured: false,
    seoKeywords: ["Mediterranean recipes", "healthy family meals", "cultural cooking", "international cuisine"],
  },
];

async function seedBlogs() {
  console.log("🌱 Starting Blog Posts seeding...\n");

  // First create an author
  let authorId: string;
  const existingAuthor = await client.fetch(
    `*[_type == "author" && name == "Lama"][0]`
  );

  if (existingAuthor) {
    authorId = existingAuthor._id;
    console.log(`  ✓ Author "Lama" already exists`);
  } else {
    const newAuthor = await client.create({
      _type: "author",
      name: "Lama",
      bio: "Founder of Mamalu Kitchen, mom of three, and passionate advocate for bringing families together through cooking.",
    });
    authorId = newAuthor._id;
    console.log(`  ✓ Created author "Lama"`);
  }

  console.log("\n📝 Creating blog posts...");
  
  for (const post of blogPosts) {
    const existingPost = await client.fetch(
      `*[_type == "blog" && slug.current == $slug][0]`,
      { slug: post.slug }
    );

    if (existingPost) {
      console.log(`  ⏭ Blog "${post.title}" already exists`);
      continue;
    }

    // Set publish date randomly in the past 30 days
    const publishDate = new Date();
    publishDate.setDate(publishDate.getDate() - Math.floor(Math.random() * 30));
    
    await client.create({
      _type: "blog",
      title: post.title,
      slug: { _type: "slug", current: post.slug },
      excerpt: post.excerpt,
      publishedAt: publishDate.toISOString(),
      featured: post.featured,
      readTime: post.readTime,
      category: post.category,
      author: { _type: "reference", _ref: authorId },
      // SEO fields
      seoTitle: post.title,
      seoDescription: post.excerpt,
      seoKeywords: post.seoKeywords,
    });
    
    console.log(`  ✓ Created "${post.title}"`);
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   Created ${blogPosts.length} blog posts`);
}

seedBlogs().catch(console.error);
