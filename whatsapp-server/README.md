# WhatsApp Cash Monitor Server

A standalone Node.js server that connects to WhatsApp Web and monitors conversations for cash-related keywords.

## Requirements

- Node.js 18+
- Chrome/Chromium (installed automatically by Puppeteer)

## Setup

1. Install dependencies:
```bash
cd whatsapp-server
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` with your Supabase credentials (same as main app)

4. Start the server:
```bash
npm start
```

## How It Works

1. **QR Login**: When you start the server and visit the admin page, a QR code will appear
2. **Scan with WhatsApp**: Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
3. **Monitoring**: Once connected, all incoming messages are scanned for keywords: `cash`, `نقد`, `كاش`
4. **Alerts**: When a keyword is detected, it's stored in the database and an alert is sent to the admin UI

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/status` | GET | Current connection status |
| `/api/qr` | GET | Get QR code for login |
| `/api/connect` | POST | Initialize WhatsApp connection |
| `/api/disconnect` | POST | Disconnect and logout |
| `/api/messages` | GET | Get flagged messages |
| `/api/messages/:id` | PATCH | Update message review status |

## WebSocket Events

Connect to `ws://localhost:3001` for real-time updates:

- `status` - Connection status changes
- `qr` - New QR code available
- `ready` - WhatsApp connected and ready
- `cash_alert` - Cash keyword detected in message
- `disconnected` - WhatsApp disconnected

## Deployment

For production, deploy this server to:
- **Railway** (recommended)
- **Render**
- **DigitalOcean App Platform**
- **Any VPS with Node.js**

Note: This cannot run on Vercel due to serverless limitations.
