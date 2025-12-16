# WhatsApp Monitoring System - Setup Guide

## Overview
This system allows super admins to connect WhatsApp Business accounts and monitor messages for cash mentions and suspicious payment activity using AI-powered pattern matching.

---

## 🔒 Security Updates Completed

### Payment Links API - Now Secured ✅
All payment links API routes now require authentication:
- **Required roles**: `staff`, `admin`, or `super_admin`
- **Protected endpoints**:
  - `GET /api/payment-links` - List all payment links
  - `POST /api/payment-links` - Create new payment link
  - `GET /api/payment-links/[id]` - Get single payment link
  - `PATCH /api/payment-links/[id]` - Update payment link
  - `DELETE /api/payment-links/[id]` - Delete payment link

**Authentication is enforced at the API level**, not just the UI.

---

## 📋 Step 1: Database Setup

### Run Supabase SQL Script

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase-whatsapp-setup.sql` from your project root
4. Copy and paste the entire SQL script
5. Click **Run** to execute

This will create:
- ✅ 4 tables: `whatsapp_accounts`, `whatsapp_messages`, `flagged_messages`, `whatsapp_reports`
- ✅ Indexes for performance optimization
- ✅ Row Level Security (RLS) policies
- ✅ Storage bucket for media files
- ✅ Helper functions for reports and statistics

### Verify Database Setup

Check in Supabase Table Editor:
- `whatsapp_accounts` - Should exist
- `whatsapp_messages` - Should exist
- `flagged_messages` - Should exist
- `whatsapp_reports` - Should exist

Check in Storage:
- Bucket `whatsapp-media` - Should exist

---

## 📱 Step 2: WhatsApp Business API Setup

### Prerequisites
- Facebook Business Manager account
- WhatsApp Business Account
- Phone number for WhatsApp Business

### Get WhatsApp Business API Access

1. **Go to Meta for Developers**
   - Visit: https://developers.facebook.com/
   - Log in with your Facebook account

2. **Create or Select an App**
   - Go to "My Apps"
   - Create a new app or select existing
   - Choose "Business" as app type

3. **Add WhatsApp Product**
   - In your app dashboard, click "Add Product"
   - Find "WhatsApp" and click "Set Up"

4. **Get Required Credentials**
   You'll need these values:
   - **Phone Number ID** (from WhatsApp > API Setup)
   - **WhatsApp Business Account ID**
   - **Access Token** (temporary or permanent)
   - **App Secret** (from Settings > Basic)

5. **Configure Webhook**
   - In WhatsApp > Configuration
   - Click "Edit" next to Webhook
   - Enter your webhook URL: `https://yourdomain.com/api/webhooks/whatsapp`
   - Enter verify token: `mamalu_whatsapp_2024` (or custom)
   - Subscribe to `messages` webhook field

---

## 🔧 Step 3: Environment Variables

Add these to your `.env.local` file:

```bash
# WhatsApp Configuration
WHATSAPP_VERIFY_TOKEN=mamalu_whatsapp_2024
WHATSAPP_APP_SECRET=your_app_secret_here
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Existing Supabase variables (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🚀 Step 4: Connect WhatsApp Account

### Option A: Using the API

```bash
POST /api/whatsapp/connect
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "phoneNumber": "+971501234567",
  "businessAccountId": "your_phone_number_id",
  "whatsappBusinessAccountId": "your_waba_id",
  "accessToken": "your_access_token",
  "displayName": "Main Support Line"
}
```

### Option B: Using the Dashboard (Coming Soon)
Navigate to `/admin/whatsapp` and click "Connect WhatsApp Account"

### Response
You'll receive:
- Account details
- Webhook URL to configure in Meta
- Webhook verify token

---

## 🤖 Step 5: AI Flagging System

### How It Works

The system automatically analyzes incoming messages for:

1. **Cash Keywords** (30% confidence boost per match)
   - cash, money, pay cash, cash payment, نقدي, نقد, كاش

2. **Currency Patterns** (20% confidence boost per match)
   - "100 AED", "AED 500", "50 dirham", "DHS 200"

3. **Payment Requests** (25% confidence boost per match)
   - "pay me", "send money", "transfer money", "payment due"

4. **Suspicious Patterns** (40% confidence boost per match)
   - "no receipt", "off the books", "under the table", "keep it secret"

### Confidence Scoring
- **< 30%**: Not flagged
- **30-60%**: Low confidence flag
- **60-80%**: Medium confidence flag
- **80-100%**: High confidence flag

### Automatic Actions
When a message is flagged:
1. Stored in `flagged_messages` table
2. Status set to `pending` review
3. Super admin can review and mark as:
   - ✅ Confirmed violation
   - ❌ False positive
   - ⏸️ Dismissed

---

## 📊 Step 6: Access the Dashboard

### For Super Admins

1. Log in to admin portal: `/admin`
2. Navigate to **WhatsApp Monitoring** in sidebar
3. View connected accounts
4. Review flagged messages
5. Generate reports

### Dashboard Features

- **Overview Stats**: Total messages, pending flags, connected accounts
- **Account Switcher**: Toggle between multiple WhatsApp accounts
- **Flagged Messages**: Review and take action on suspicious messages
- **Real-time Updates**: Messages appear as they're received

---

## 🔌 API Endpoints Reference

### Accounts
- `GET /api/whatsapp/accounts` - List all connected accounts
- `POST /api/whatsapp/connect` - Connect new account
- `PATCH /api/whatsapp/connect` - Update account settings
- `DELETE /api/whatsapp/accounts?account_id=xxx` - Disconnect account

### Messages
- `GET /api/whatsapp/messages` - List messages
  - Query params: `account_id`, `flagged_only`, `from_number`, `start_date`, `end_date`, `limit`, `offset`

### Reports
- `GET /api/whatsapp/reports` - Get reports
  - Query params: `account_id`, `report_type`, `start_date`, `end_date`
- `POST /api/whatsapp/reports` - Generate new report
- `PATCH /api/whatsapp/reports` - Get flagged message statistics

### Webhook
- `GET /api/webhooks/whatsapp` - Webhook verification (WhatsApp calls this)
- `POST /api/webhooks/whatsapp` - Receive messages (WhatsApp calls this)

---

## 🧪 Testing

### Test Webhook Locally

1. Use ngrok to expose local server:
   ```bash
   ngrok http 3000
   ```

2. Update webhook URL in Meta to ngrok URL:
   ```
   https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp
   ```

3. Send test message to your WhatsApp Business number

4. Check logs in terminal for webhook receipt

### Test AI Flagging

Send these test messages to your WhatsApp Business number:
- ✅ "Can I pay in cash?" - Should flag
- ✅ "I'll bring 500 AED cash tomorrow" - Should flag (high confidence)
- ✅ "Pay me the money without receipt" - Should flag (suspicious)
- ❌ "I need to cash out my vacation days" - Should NOT flag (context)

---

## 📈 Monitoring & Maintenance

### Daily Tasks
- Review pending flagged messages
- Generate daily reports

### Weekly Tasks
- Review false positive rate
- Adjust keyword patterns if needed
- Check webhook health

### Monthly Tasks
- Analyze trends in cash mentions
- Review super admin access logs
- Update access tokens if needed

---

## 🔐 Security Best Practices

1. **Access Tokens**: Rotate regularly (every 60 days)
2. **Webhook Verification**: Always verify webhook signatures in production
3. **RLS Policies**: Never disable Row Level Security
4. **Super Admin Access**: Limit to trusted personnel only
5. **Audit Logs**: Monitor who reviews flagged messages

---

## 🐛 Troubleshooting

### Webhook Not Receiving Messages
- Check webhook URL is correct in Meta dashboard
- Verify verify token matches environment variable
- Check server logs for errors
- Test webhook verification endpoint manually

### Messages Not Being Flagged
- Check AI flagging service is running
- Review keyword patterns in `src/lib/whatsapp/ai-flagging.ts`
- Check message text is being extracted correctly
- Verify confidence threshold (default: 30%)

### RLS Policy Errors
- Verify user has `super_admin` role in profiles table
- Check account belongs to the super admin
- Review Supabase logs for RLS violations

### Access Token Expired
- Generate new access token in Meta dashboard
- Update via API: `PATCH /api/whatsapp/connect`

---

## 📞 Support

For issues or questions:
1. Check Supabase logs
2. Check Next.js server logs
3. Review Meta for Developers webhook logs
4. Check this documentation

---

## 🎯 Next Steps

1. ✅ Run Supabase SQL script
2. ✅ Set up WhatsApp Business API
3. ✅ Configure environment variables
4. ✅ Connect first WhatsApp account
5. ✅ Test with sample messages
6. ✅ Review flagged messages in dashboard
7. ✅ Set up daily report generation (optional)

---

## 📝 Notes

- Only **super admins** can access WhatsApp monitoring
- Each super admin can connect multiple WhatsApp accounts
- Messages are stored indefinitely (consider archiving strategy)
- Media files are stored in Supabase storage bucket
- AI flagging uses pattern matching (no external API costs)
- System supports Arabic keywords for regional use

---

**System Status**: ✅ Ready for Production
**Last Updated**: December 2024
