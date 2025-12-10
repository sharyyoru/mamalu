# Mamalu Kitchen - Project Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Utility Functions](#utility-functions)
7. [Sanity CMS Queries](#sanity-cms-queries)
8. [Third-Party Integrations](#third-party-integrations)

---

## Overview

Mamalu Kitchen is a full-stack web application for a cooking school and kitchen rental business. It provides:
- **Cooking class booking system** with digital waiver signing
- **Kitchen rental management**
- **E-commerce for products**
- **Recipe & blog content management**
- **Admin portal** for business operations
- **Payment processing** via Stripe
- **Invoice & payment link generation**

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Styling |
| **Supabase** | Database (PostgreSQL) & Authentication |
| **Sanity.io** | Headless CMS for content |
| **Stripe** | Payment processing |
| **Vercel** | Hosting & deployment |

---

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin portal pages
│   │   ├── bookings/       # Booking management
│   │   ├── classes/        # Class management
│   │   ├── invoices/       # Invoice management
│   │   ├── payment-links/  # Payment link management
│   │   ├── users/          # User/CRM management
│   │   └── ...
│   ├── api/                # API routes
│   │   ├── admin/          # Admin-only APIs
│   │   ├── auth/           # Authentication APIs
│   │   ├── bookings/       # Booking APIs
│   │   ├── invoices/       # Invoice APIs
│   │   ├── payment-links/  # Payment link APIs
│   │   ├── payments/       # Payment processing APIs
│   │   └── user/           # User-facing APIs
│   └── (public pages)
├── components/
│   ├── admin/              # Admin UI components
│   └── ui/                 # Reusable UI components
└── lib/
    ├── sanity/             # Sanity CMS client & queries
    ├── stripe/             # Stripe client configuration
    ├── supabase/           # Supabase clients
    └── utils.ts            # Utility functions
```

---

## API Endpoints

### Authentication

#### `POST /api/auth/check-role`
Check if user has admin access.

**Request:**
```json
{
  "userId": "uuid",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "profile": { "id": "...", "role": "admin" },
  "hasAdminAccess": true
}
```

---

### Class Bookings

#### `POST /api/bookings/class`
Create a new class booking with waiver acceptance.

**Request:**
```json
{
  "classId": "sanity-class-id",
  "attendeeName": "John Doe",
  "attendeeEmail": "john@example.com",
  "attendeePhone": "+971501234567",
  "paymentType": "full",
  "sessionsBooked": 4,
  "numberOfGuests": 1,
  "dietaryRestrictions": "None",
  "notes": "Optional notes",
  "waiverAccepted": true,
  "waiverSignature": "John Doe",
  "waiverSignedAt": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "bookingNumber": "CLS-ABC123-XYZ",
    "totalAmount": 800
  }
}
```

**Functions:**
- `generateBookingNumber()` - Generates unique booking reference (CLS-TIMESTAMP-RANDOM)
- Validates class availability
- Calculates pricing based on payment type
- Updates Sanity spots count
- Stores waiver acceptance and signature

---

### Admin Bookings

#### `GET /api/admin/bookings`
Fetch all bookings with filtering and stats.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (pending, confirmed, cancelled) |
| payment_method | string | Filter by payment method |
| limit | number | Results per page (default: 100) |
| offset | number | Pagination offset |

**Response:**
```json
{
  "bookings": [...],
  "stats": {
    "total": 150,
    "confirmed": 120,
    "pending": 25,
    "pendingReceipts": 5,
    "revenue": 45000
  }
}
```

#### `GET /api/admin/bookings/[id]`
Get single booking details.

#### `PATCH /api/admin/bookings/[id]`
Update booking (status, payment info, etc.).

#### `DELETE /api/admin/bookings/[id]`
Cancel/delete booking.

---

### Payment Links

#### `GET /api/payment-links`
Fetch all payment links with creator info.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (active, paid, expired, cancelled) |

**Response:**
```json
{
  "paymentLinks": [
    {
      "id": "uuid",
      "link_code": "PAY-ABC12345",
      "title": "Private Session",
      "amount": 500,
      "status": "active",
      "stripe_payment_link_url": "https://buy.stripe.com/...",
      "creator": {
        "full_name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ]
}
```

#### `POST /api/payment-links`
Create a new Stripe payment link.

**Request:**
```json
{
  "title": "Private Cooking Session",
  "description": "1-hour private session",
  "amount": 800,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+971501234567",
  "singleUse": true,
  "notes": "Internal notes",
  "createdBy": "user-uuid"
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

**Process:**
1. Creates Stripe Product
2. Creates Stripe Price
3. Creates Stripe Payment Link
4. Stores record in database
5. Returns shareable URL

#### `PATCH /api/payment-links/[id]`
Update payment link (status, customer info).

#### `DELETE /api/payment-links/[id]`
Deactivate payment link in Stripe and database.

#### `POST /api/payment-links/verify`
Verify payment completion and update status.

**Request:**
```json
{
  "sessionId": "stripe-checkout-session-id"
}
```

---

### Invoices

#### `GET /api/invoices`
List all invoices with booking relations.

#### `POST /api/invoices`
Create new invoice with Stripe payment link.

**Request:**
```json
{
  "bookingId": "uuid (optional)",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+971501234567",
  "amount": 1200,
  "description": "Cooking Class - 4 Sessions",
  "lineItems": [
    { "name": "Session 1-4", "quantity": 4, "amount": 300 }
  ],
  "dueDate": "2024-02-01",
  "notes": "Payment due within 7 days",
  "sendImmediately": true
}
```

#### `GET /api/invoices/[id]`
Get single invoice details.

#### `POST /api/invoices/[id]/send`
Send invoice to customer via email.

---

### Payments

#### `POST /api/payments/create-checkout`
Create Stripe checkout session for booking payment.

**Request:**
```json
{
  "bookingId": "uuid",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

**Response:**
```json
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

#### `POST /api/payments/webhook`
Stripe webhook handler for payment events.

**Handled Events:**
- `checkout.session.completed` - Mark booking/payment link as paid
- `checkout.session.expired` - Handle expired sessions
- `payment_intent.succeeded` - Confirm payment
- `payment_intent.payment_failed` - Record failed payment
- `invoice.paid` - Update invoice status
- `charge.refunded` - Process refunds

#### `POST /api/payments/upload-receipt`
Upload payment receipt for manual payment verification.

#### `POST /api/payments/verify-receipt`
Admin verification of uploaded receipt.

#### `POST /api/payments/verify-stripe`
Verify Stripe payment session.

---

### Admin Users

#### `GET /api/admin/users`
Fetch all user profiles.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| role | string | Filter by role (customer, staff, admin, super_admin) |
| search | string | Search by name, email, or phone |
| limit | number | Results per page |
| offset | number | Pagination offset |

#### `POST /api/admin/users`
Create new user with Supabase Auth.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "phone": "+971501234567",
  "role": "customer"
}
```

#### `GET /api/admin/users/[id]`
Get single user profile.

#### `PATCH /api/admin/users/[id]`
Update user profile.

---

### Admin Classes

#### `GET /api/admin/classes`
Fetch classes with booking counts.

#### `GET /api/admin/classes/[id]/bookings`
Get all bookings for a specific class.

---

### User APIs

#### `GET /api/user/bookings`
Get current user's bookings.

#### `POST /api/user/bookings/reminder`
Send booking reminder to user.

---

## Database Schema

### Core Tables

#### `profiles`
User profiles linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (matches auth.users.id) |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| phone | TEXT | Phone number |
| role | TEXT | customer, staff, admin, super_admin |
| avatar_url | TEXT | Profile image URL |
| created_at | TIMESTAMP | Account creation date |

#### `class_bookings`
Cooking class bookings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| booking_number | TEXT | Unique reference (CLS-XXX-XXX) |
| class_id | TEXT | Sanity class ID |
| class_title | TEXT | Class name |
| user_id | UUID | Profile reference |
| attendee_name | TEXT | Booking name |
| attendee_email | TEXT | Contact email |
| attendee_phone | TEXT | Contact phone |
| payment_type | TEXT | full_course, per_session |
| sessions_booked | INT | Number of sessions |
| total_amount | DECIMAL | Total price |
| amount_paid | DECIMAL | Amount received |
| status | TEXT | pending, confirmed, cancelled |
| payment_method | TEXT | stripe, cash, bank_transfer |
| waiver_accepted | BOOLEAN | Waiver signed |
| waiver_signature | TEXT | Digital signature |
| waiver_signed_at | TIMESTAMP | Signature timestamp |
| waiver_ip_address | TEXT | Client IP for legal record |
| paid_at | TIMESTAMP | Payment date |
| created_at | TIMESTAMP | Booking date |

#### `payment_links`
Custom Stripe payment links.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| link_code | TEXT | Unique code (PAY-XXXXXXXX) |
| title | TEXT | Payment description |
| amount | DECIMAL | Payment amount |
| status | TEXT | active, paid, expired, cancelled |
| stripe_payment_link_id | TEXT | Stripe reference |
| stripe_payment_link_url | TEXT | Payment URL |
| created_by | UUID | Creator profile ID |
| paid_at | TIMESTAMP | Payment completion |

#### `invoices`
Invoice records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| invoice_number | TEXT | Unique reference (INV-XXX) |
| booking_id | UUID | Related booking |
| customer_name | TEXT | Bill to name |
| customer_email | TEXT | Bill to email |
| amount | DECIMAL | Invoice total |
| status | TEXT | draft, sent, paid, overdue |
| payment_link | TEXT | Stripe payment URL |
| due_date | DATE | Payment due date |

#### `payment_transactions`
Payment history log.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| booking_id | UUID | Related booking |
| transaction_type | TEXT | payment, refund, partial_refund |
| payment_method | TEXT | stripe, cash, bank_transfer |
| amount | DECIMAL | Transaction amount |
| status | TEXT | pending, completed, failed |
| stripe_payment_intent_id | TEXT | Stripe reference |

---

## Utility Functions

### `lib/utils.ts`

#### `cn(...inputs: ClassValue[])`
Merge Tailwind CSS classes with conflict resolution.

```typescript
cn("px-4 py-2", "px-6") // Returns "px-6 py-2"
```

#### `formatPrice(price: number): string`
Format number as AED currency.

```typescript
formatPrice(1500) // Returns "AED 1,500.00"
```

#### `formatDate(date: string): string`
Format ISO date string.

```typescript
formatDate("2024-01-15") // Returns "January 15, 2024"
```

---

## Sanity CMS Queries

### `lib/sanity/queries.ts`

#### Blog Queries
- `getBlogs()` - Get all blog posts
- `getBlogBySlug(slug)` - Get single blog post

#### Recipe Queries
- `getRecipes()` - Get all recipes
- `getRecipeBySlug(slug)` - Get single recipe
- `getRecipeCategories()` - Get recipe categories

#### Product Queries
- `getProducts()` - Get all products
- `getProductBySlug(slug)` - Get single product
- `getProductsByCategory(categorySlug)` - Get products by category
- `getProductCategories()` - Get product categories

#### Class Queries
- `getClasses()` - Get all active cooking classes
- `getClassBySlug(slug)` - Get single class by URL slug
- `getClassById(id)` - Get single class by Sanity ID

#### Press Queries
- `getPressArticles()` - Get all press mentions
- `getPressArticleBySlug(slug)` - Get single press article

#### Page Queries
- `getHomePage()` - Get homepage content
- `getAboutPage()` - Get about page content
- `getContactInfo()` - Get contact information
- `getSiteSettings()` - Get global site settings

---

## Third-Party Integrations

### Stripe

**Configuration Files:**
- `lib/stripe/server.ts` - Server-side Stripe client
- `lib/stripe/client.ts` - Client-side Stripe.js

**Features:**
- Payment Links generation
- Checkout Sessions
- Webhook handling
- Refund processing

**Environment Variables:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Supabase

**Configuration Files:**
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client (SSR)
- `lib/supabase/admin.ts` - Admin client (bypasses RLS)
- `lib/supabase/middleware.ts` - Auth middleware

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Sanity.io

**Configuration Files:**
- `lib/sanity/client.ts` - Sanity client
- `lib/sanity/queries.ts` - GROQ queries

**Environment Variables:**
```
NEXT_PUBLIC_SANITY_PROJECT_ID=xxx
NEXT_PUBLIC_SANITY_DATASET=production
```

---

## Digital Waiver System

When clients book a class, they must digitally sign a waiver and accept terms & conditions.

### Waiver Flow
1. Client fills booking form
2. Waiver modal appears with terms & conditions
3. Client types their full name as signature
4. System records: signature, timestamp, IP address
5. Booking proceeds with waiver stored

### Database Fields
- `waiver_accepted` (BOOLEAN) - Whether waiver was accepted
- `waiver_signature` (TEXT) - Typed signature
- `waiver_signed_at` (TIMESTAMP) - When signed
- `waiver_ip_address` (TEXT) - Client IP for legal record

### Legal Compliance
- Full waiver text displayed before signature
- Timestamp and IP recorded for legal validity
- Waiver acceptance required before booking completion
- Records stored permanently for liability protection

---

## Deployment

### Vercel (Production)
- Auto-deploys from GitHub main branch
- Environment variables configured in Vercel dashboard
- Stripe webhooks point to: `https://your-domain.vercel.app/api/payments/webhook`

### Local Development
```bash
npm run dev
```
- Runs on http://localhost:3000
- Use Stripe CLI for local webhook testing:
  ```bash
  stripe listen --forward-to localhost:3000/api/payments/webhook
  ```

---

*Last Updated: December 2024*
