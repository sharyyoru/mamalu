# Mamalu Kitchen

A modern culinary platform featuring recipes, products, cooking classes, and professional services.

**Backend powered by Mutant**

## Tech Stack

- **Framework:** Next.js 16 (App Router, SSR for SEO)
- **Styling:** Tailwind CSS v4
- **CMS:** Sanity.io (Blogs, Recipes, Products, Classes, Press)
- **Database & Auth:** Supabase (PostgreSQL)
- **Payments:** Stripe
- **Language:** TypeScript

## Features

- **Recipes** - Browse and search authentic recipes with ingredients and instructions
- **Products** - E-commerce with category filtering and shopping cart
- **Cooking Classes** - Book sessions with pay-per-session or full-course pricing
- **Events & Catering** - Professional catering services for all occasions
- **Food Consultancy** - Expert consulting for restaurants and food businesses
- **Blog & Press** - Content management via Sanity CMS
- **User Accounts** - Supabase authentication with order history

## Getting Started

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Sanity, Supabase, and Stripe credentials.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/
│   ├── blogs/
│   ├── classes/
│   ├── contact/
│   ├── products/
│   ├── recipes/
│   ├── press/
│   ├── services/
│   ├── cart/
│   ├── account/
│   ├── privacy/
│   └── terms/
├── components/
│   ├── layout/            # Header, Footer
│   └── ui/                # Button, Card, Input, Badge
├── lib/
│   ├── sanity/            # Sanity client and queries
│   ├── supabase/          # Supabase client (browser/server)
│   ├── stripe/            # Stripe client
│   └── utils.ts           # Utility functions
└── types/                 # TypeScript type definitions
```

## Environment Variables

See `.env.example` for required environment variables:

- `NEXT_PUBLIC_SANITY_PROJECT_ID` - Sanity project ID
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

Proprietary - Mamalu Kitchen © 2024
