# Mamalu Kitchen - Technical Documentation

**Version:** 0.1.0  
**Last Updated:** December 9, 2025  
**Platform:** Next.js 16 with React 19

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Routes Reference](#api-routes-reference)
6. [Frontend Pages](#frontend-pages)
7. [Authentication & Authorization](#authentication--authorization)
8. [Payment System](#payment-system)
9. [Content Management](#content-management)
10. [Environment Variables](#environment-variables)

---

## Overview

Mamalu Kitchen is a full-featured culinary platform that provides:

- **Cooking Classes** - Book and manage cooking class sessions
- **Recipe Collection** - Browse and learn authentic recipes
- **E-commerce** - Shop artisan kitchen products
- **Event Services** - Catering and private events
- **Consultancy** - Food business consulting services
- **Kitchen Rental** - Commercial kitchen space rental
- **Admin Portal** - Comprehensive management dashboard

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.7 | React framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Lucide React | 0.555.0 | Icons |
| class-variance-authority | 0.7.1 | Component variants |

### Backend & Services
| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | 2.86.2 | Database, Auth, Storage |
| Sanity CMS | 4.20.3 | Content management |
| Stripe | 20.0.0 | Payment processing |

### Database
- **PostgreSQL** (via Supabase)
- Row Level Security (RLS) enabled
- UUID primary keys

---

## Project Structure

```
mamalu/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (public)/           # Public pages
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── about/          # About page
│   │   │   ├── classes/        # Class listings and booking
│   │   │   ├── recipes/        # Recipe collection
│   │   │   ├── products/       # E-commerce
│   │   │   ├── blogs/          # Blog posts
│   │   │   ├── services/       # Events & Consultancy
│   │   │   └── contact/        # Contact form
│   │   ├── account/            # User account pages
│   │   ├── admin/              # Admin portal
│   │   ├── api/                # API routes
│   │   ├── booking/            # Booking success/cancel pages
│   │   ├── payment/            # Payment success page
│   │   └── studio/             # Sanity Studio
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   └── admin/              # Admin-specific components
│   └── lib/
│       ├── sanity/             # Sanity client config
│       ├── stripe/             # Stripe server config
│       ├── supabase/           # Supabase clients
│       └── utils.ts            # Utility functions
├── supabase/
│   ├── migrations/             # Database migrations
│   └── schema.sql              # Full database schema
└── public/                     # Static assets
```

---

## Database Schema

### Core Tables

#### `profiles`
Extended user profiles linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | References auth.users(id) |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| phone | TEXT | Phone number |
| role | user_role | customer, student, instructor, staff, admin, super_admin |
| skill_level | skill_level | beginner, intermediate, advanced, professional |
| dietary_restrictions | TEXT[] | Array of dietary restrictions |
| referral_code | TEXT | Unique referral code |
| total_spend | DECIMAL | Lifetime spending |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### `class_bookings`
Cooking class booking records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| booking_number | TEXT | Auto-generated (BK-YYYYMMDD-XXXXXX) |
| user_id | UUID | References profiles |
| class_id | TEXT | Sanity class ID |
| class_title | TEXT | Class name |
| attendee_name | TEXT | Attendee's name |
| attendee_email | TEXT | Attendee's email |
| payment_type | payment_type | per_session, full_course |
| sessions_booked | INTEGER | Number of sessions |
| total_amount | DECIMAL | Total price |
| status | booking_status | pending, confirmed, cancelled, completed |
| payment_method | TEXT | stripe, cash, invoice, pending |
| stripe_checkout_session_id | TEXT | Stripe session ID |
| paid_at | TIMESTAMPTZ | Payment timestamp |
| receipt_url | TEXT | Cash receipt upload URL |
| receipt_verified | BOOLEAN | Admin verified receipt |
| number_of_guests | INTEGER | Group booking size |

#### `invoices`
Invoice records for payments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| invoice_number | TEXT | Auto-generated (INV-YYMM-0001) |
| booking_id | UUID | Optional booking reference |
| customer_name | TEXT | Customer name |
| customer_email | TEXT | Customer email |
| amount | DECIMAL | Invoice amount |
| status | TEXT | draft, pending, sent, paid, cancelled |
| payment_link | TEXT | Stripe payment link URL |
| due_date | TIMESTAMPTZ | Payment due date |
| paid_at | TIMESTAMPTZ | Payment timestamp |

#### `payment_links`
Custom Stripe payment links for ad-hoc payments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| link_code | TEXT | Shareable code (PAY-XXXXXXXX) |
| title | TEXT | Payment description |
| amount | DECIMAL | Payment amount |
| stripe_payment_link_id | TEXT | Stripe payment link ID |
| stripe_payment_link_url | TEXT | Shareable Stripe URL |
| status | TEXT | active, paid, expired, cancelled |
| single_use | BOOLEAN | Deactivate after one payment |
| paid_at | TIMESTAMPTZ | Payment timestamp |
| customer_email | TEXT | Payer's email (filled on payment) |

#### `payment_transactions`
Full audit trail of all payments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| booking_id | UUID | Optional booking reference |
| invoice_id | UUID | Optional invoice reference |
| transaction_type | TEXT | payment, refund, partial_refund |
| payment_method | TEXT | stripe, cash |
| amount | DECIMAL | Transaction amount |
| status | TEXT | pending, completed, failed |
| stripe_payment_intent_id | TEXT | Stripe reference |

#### Additional Tables
- `orders` - E-commerce orders
- `order_items` - Order line items
- `event_inquiries` - Event/catering inquiries
- `consultancy_inquiries` - Consultancy service inquiries
- `contact_messages` - Contact form submissions
- `newsletter_subscribers` - Email subscribers
- `wishlists` - User product wishlists
- `leads` - Sales CRM leads

---

## API Routes Reference

### Authentication

#### `GET /api/auth/check-role`
Check user's role for authorization.

**Response:**
```json
{
  "role": "admin",
  "email": "user@example.com"
}
```

---

### Bookings

#### `POST /api/bookings/class`
Create a new class booking.

**Request Body:**
```json
{
  "classId": "sanity-class-id",
  "attendeeName": "John Doe",
  "attendeeEmail": "john@example.com",
  "attendeePhone": "+971501234567",
  "paymentType": "full",
  "sessionsBooked": 4,
  "numberOfGuests": 2,
  "dietaryRestrictions": "Vegetarian",
  "notes": "Additional notes"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "bookingNumber": "CLS-XXX-XXXX",
    "totalAmount": 1200
  }
}
```

#### `GET /api/user/bookings`
Get authenticated user's bookings.

#### `POST /api/user/bookings/reminder`
Toggle reminder for a booking.

**Request Body:**
```json
{
  "bookingId": "uuid",
  "enabled": true
}
```

---

### Admin Bookings

#### `GET /api/admin/bookings`
Fetch all bookings with filtering.

**Query Parameters:**
- `status` - Filter by status (pending, confirmed, cancelled)
- `payment_method` - Filter by payment method
- `limit` - Results limit (default: 100)
- `offset` - Pagination offset

#### `PATCH /api/admin/bookings/[id]`
Update booking status.

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Admin notes"
}
```

---

### Payments

#### `POST /api/payments/create-checkout`
Create Stripe checkout session for a booking.

**Request Body:**
```json
{
  "bookingId": "uuid",
  "successUrl": "https://...",
  "cancelUrl": "https://..."
}
```

**Response:**
```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

#### `POST /api/payments/upload-receipt`
Upload cash payment receipt.

**Request Body:** FormData
- `receipt` - File (image/pdf)
- `bookingId` - Booking UUID

#### `POST /api/payments/verify-receipt`
Admin: Verify uploaded receipt.

**Request Body:**
```json
{
  "bookingId": "uuid",
  "approved": true
}
```

#### `POST /api/payments/verify-stripe`
Manually verify Stripe payment status.

**Request Body:**
```json
{
  "bookingId": "uuid"
}
```

#### `POST /api/payments/webhook`
Stripe webhook endpoint for payment events.

**Handled Events:**
- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.paid`
- `charge.refunded`

---

### Invoices

#### `GET /api/invoices`
Fetch all invoices.

**Query Parameters:**
- `status` - Filter by status

#### `POST /api/invoices`
Create new invoice with Stripe payment link.

**Request Body:**
```json
{
  "bookingId": "uuid (optional)",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+971...",
  "amount": 500,
  "description": "Custom invoice",
  "dueDate": "2025-01-15",
  "sendImmediately": true
}
```

#### `PATCH /api/invoices/[id]`
Update invoice status.

#### `POST /api/invoices/[id]/send`
Send invoice to customer.

---

### Payment Links

#### `GET /api/payment-links`
Fetch all custom payment links.

**Query Parameters:**
- `status` - Filter by status (active, paid, cancelled)

#### `POST /api/payment-links`
Create custom payment link.

**Request Body:**
```json
{
  "title": "Private Cooking Session",
  "description": "1-hour private session",
  "amount": 800,
  "customerName": "John Doe (optional)",
  "customerEmail": "john@example.com (optional)",
  "singleUse": true,
  "notes": "Internal notes"
}
```

**Response:**
```json
{
  "success": true,
  "paymentLink": { ... },
  "stripeUrl": "https://buy.stripe.com/..."
}
```

#### `PATCH /api/payment-links/[id]`
Update payment link (status, customer info).

#### `DELETE /api/payment-links/[id]`
Cancel/deactivate payment link.

---

### Admin Users

#### `GET /api/admin/users`
Fetch all user profiles.

#### `GET /api/admin/users/[id]`
Get specific user profile.

#### `PATCH /api/admin/users/[id]`
Update user profile/role.

---

### Classes (Sanity)

#### `GET /api/classes/[slug]`
Fetch class details from Sanity CMS.

#### `GET /api/admin/classes`
Fetch classes for admin.

#### `GET /api/admin/classes/[id]/bookings`
Fetch bookings for specific class.

---

### Other Endpoints

#### `GET /api/admin/instructors`
Fetch instructor profiles.

#### `POST /api/admin/upload`
Upload files to Supabase storage.

---

## Frontend Pages

### Public Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, features, stats |
| `/about` | About Mamalu Kitchen |
| `/classes` | Cooking class listings |
| `/classes/[slug]` | Class details |
| `/classes/[slug]/book` | Booking form |
| `/recipes` | Recipe collection |
| `/recipes/[slug]` | Recipe details |
| `/products` | Product shop |
| `/products/[slug]` | Product details |
| `/blogs` | Blog posts |
| `/blogs/[slug]` | Blog post details |
| `/services` | Services overview |
| `/services/events` | Events & catering |
| `/services/consultancy` | Food consultancy |
| `/contact` | Contact form |
| `/press` | Press & media |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

### User Account

| Route | Description |
|-------|-------------|
| `/account` | User dashboard |
| `/account/bookings` | My bookings |
| `/cart` | Shopping cart |

### Booking Flow

| Route | Description |
|-------|-------------|
| `/booking/success` | Payment success page |
| `/booking/cancelled` | Booking cancelled page |
| `/payment/success` | Invoice payment success |

### Admin Portal

| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard |
| `/admin/login` | Admin login |
| `/admin/users` | User management |
| `/admin/users/[id]` | User details |
| `/admin/users/new` | Create user |
| `/admin/leads` | Sales leads CRM |
| `/admin/classes` | Class management |
| `/admin/classes/[id]` | Class details |
| `/admin/classes/instructors` | Instructor management |
| `/admin/bookings` | Booking management |
| `/admin/invoices` | Invoice management |
| `/admin/payment-links` | Custom payment links |
| `/admin/orders` | E-commerce orders |
| `/admin/memberships` | Membership plans |
| `/admin/rentals` | Kitchen rental bookings |
| `/admin/inquiries` | Event/consultancy inquiries |
| `/admin/marketing` | Marketing campaigns |
| `/admin/notifications` | Push notifications |
| `/admin/analytics` | Reports & analytics |
| `/admin/settings` | System settings |

### Content Studio

| Route | Description |
|-------|-------------|
| `/studio` | Sanity Studio CMS |

---

## Authentication & Authorization

### User Roles

| Role | Access Level |
|------|--------------|
| `customer` | Public pages, own bookings |
| `student` | Customer + enrolled classes |
| `renter` | Customer + rental access |
| `instructor` | Limited admin (own classes) |
| `staff` | Full admin portal |
| `admin` | Full admin + user management |
| `super_admin` | All access + settings |

### Authentication Flow

1. **Supabase Auth** handles registration/login
2. Profile auto-created via database trigger
3. Role stored in `profiles.role`
4. Admin routes check role before rendering
5. API routes validate session & role

### Row Level Security (RLS)

All tables have RLS policies:
- Users can read/update own records
- Admin roles can access all records
- Service role has full access (for webhooks)

---

## Payment System

### Payment Methods

1. **Stripe (Card)**
   - Checkout Sessions for bookings
   - Payment Links for invoices
   - Webhook for confirmation

2. **Cash/Bank Transfer**
   - Receipt upload to Supabase Storage
   - Admin verification required

### Payment Flow

```
User Books Class
       │
       ▼
   Booking Created (status: pending)
       │
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
  Pay with Card              Pay with Cash
       │                             │
       ▼                             │
Create Stripe Session                │
       │                             ▼
       ▼                    Upload Receipt
Redirect to Stripe                   │
       │                             │
       ▼                             ▼
  Payment Success            Admin Verifies
       │                             │
       ▼                             ▼
Webhook Updates DB          Manual Confirmation
       │                             │
       └──────────┬──────────────────┘
                  │
                  ▼
          status: confirmed
```

### Custom Payment Links

For ad-hoc payments (consultancy, custom services):

1. Admin creates payment link with amount
2. System generates Stripe Payment Link
3. Link is shareable to customer
4. Customer pays via link
5. Webhook updates payment_links table
6. Single-use links auto-deactivate

---

## Content Management

### Sanity CMS

Content types managed in Sanity:
- Cooking Classes
- Recipes
- Products
- Blog Posts
- Instructors
- Testimonials
- FAQ Items

### Sanity Studio

Access at `/studio` (requires Sanity authentication)

### Image Handling

```typescript
import { urlFor } from "@/lib/sanity/client";

// Generate optimized image URL
const imageUrl = urlFor(image).width(800).height(600).url();
```

---

## Environment Variables

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=xxx
NEXT_PUBLIC_SANITY_DATASET=production

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Site
NEXT_PUBLIC_SITE_URL=https://mamalu.vercel.app
```

---

## Deployment

### Vercel Deployment

1. Connected to GitHub: `sharyyoru/mamalu`
2. Auto-deploys on push to `main`
3. Environment variables set in Vercel dashboard

### Database Migrations

Run migrations in Supabase SQL Editor:
```sql
-- Run latest migration
\i supabase/migrations/add_payment_links.sql
```

---

## Support

For technical support or questions:
- **Email:** support@mamalu.com
- **GitHub:** github.com/sharyyoru/mamalu

---

*This documentation is auto-generated and maintained alongside the codebase.*
