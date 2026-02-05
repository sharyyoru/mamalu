require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const QRCode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Configuration
const PORT = process.env.WA_SERVER_PORT || 3001;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://mamalu.vercel.app').split(',');

// Keywords to monitor (case insensitive)
const MONITORED_KEYWORDS = ['cash', 'نقد', 'كاش'];

// Supabase client
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('✓ Supabase connected');
} else {
  console.warn('⚠ Supabase not configured - messages will not be stored');
}

// CORS
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json());

// State
let whatsappClient = null;
let connectionState = {
  status: 'disconnected', // disconnected, qr_pending, authenticated, ready
  qrCode: null,
  qrDataUrl: null,
  phoneNumber: null,
  displayName: null,
  lastError: null,
  connectedAt: null
};

// WebSocket clients
const wsClients = new Set();

// Broadcast to all WebSocket clients
function broadcast(type, data) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Check if message contains monitored keywords
function containsKeyword(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return MONITORED_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// Store flagged message in Supabase
async function storeFlaggedMessage(message, chatInfo) {
  if (!supabase) {
    console.log('Flagged message (not stored - no Supabase):', message.body);
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('whatsapp_cash_mentions')
      .insert({
        message_id: message.id._serialized,
        from_number: message.from,
        to_number: message.to,
        contact_name: chatInfo?.name || message.from,
        message_text: message.body,
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        chat_id: message.from,
        is_group: message.from.includes('@g.us'),
        review_status: 'pending',
        matched_keywords: MONITORED_KEYWORDS.filter(kw => 
          message.body.toLowerCase().includes(kw.toLowerCase())
        )
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing flagged message:', error);
      return null;
    }

    console.log('✓ Flagged message stored:', data.id);
    return data;
  } catch (err) {
    console.error('Error storing flagged message:', err);
    return null;
  }
}

// Initialize WhatsApp client
function initializeWhatsApp() {
  if (whatsappClient) {
    console.log('WhatsApp client already exists, destroying...');
    whatsappClient.destroy();
  }

  console.log('Initializing WhatsApp client...');
  connectionState = {
    status: 'initializing',
    qrCode: null,
    qrDataUrl: null,
    phoneNumber: null,
    displayName: null,
    lastError: null,
    connectedAt: null
  };
  broadcast('status', connectionState);

  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: './whatsapp-session'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  // QR Code event
  whatsappClient.on('qr', async (qr) => {
    console.log('QR Code received');
    try {
      const qrDataUrl = await QRCode.toDataURL(qr, { width: 256, margin: 2 });
      connectionState = {
        ...connectionState,
        status: 'qr_pending',
        qrCode: qr,
        qrDataUrl: qrDataUrl,
        lastError: null
      };
      broadcast('qr', { qrDataUrl });
      broadcast('status', connectionState);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  });

  // Authenticated event
  whatsappClient.on('authenticated', () => {
    console.log('✓ WhatsApp authenticated');
    connectionState = {
      ...connectionState,
      status: 'authenticated',
      qrCode: null,
      qrDataUrl: null,
      lastError: null
    };
    broadcast('status', connectionState);
  });

  // Ready event
  whatsappClient.on('ready', async () => {
    console.log('✓ WhatsApp client ready');
    
    try {
      const info = whatsappClient.info;
      connectionState = {
        ...connectionState,
        status: 'ready',
        phoneNumber: info?.wid?.user || 'Unknown',
        displayName: info?.pushname || 'WhatsApp User',
        connectedAt: new Date().toISOString(),
        lastError: null
      };
      console.log(`Connected as: ${connectionState.displayName} (${connectionState.phoneNumber})`);
    } catch (err) {
      connectionState.status = 'ready';
      connectionState.connectedAt = new Date().toISOString();
    }
    
    broadcast('status', connectionState);
    broadcast('ready', { message: 'WhatsApp is ready for monitoring' });
  });

  // Message event - monitor for keywords
  whatsappClient.on('message', async (message) => {
    try {
      // Skip status messages
      if (message.isStatus) return;

      const messageText = message.body || '';
      
      if (containsKeyword(messageText)) {
        console.log('🚨 CASH KEYWORD DETECTED:', messageText.substring(0, 100));
        
        // Get chat info
        let chatInfo = null;
        try {
          const chat = await message.getChat();
          chatInfo = { name: chat.name || chat.id.user };
        } catch (e) {
          chatInfo = { name: message.from };
        }

        // Store in database
        const storedMessage = await storeFlaggedMessage(message, chatInfo);

        // Broadcast alert to connected clients
        broadcast('cash_alert', {
          id: storedMessage?.id || message.id._serialized,
          from: message.from,
          contactName: chatInfo?.name,
          text: messageText,
          timestamp: new Date(message.timestamp * 1000).toISOString(),
          isGroup: message.from.includes('@g.us')
        });
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  // Disconnected event
  whatsappClient.on('disconnected', (reason) => {
    console.log('WhatsApp disconnected:', reason);
    connectionState = {
      status: 'disconnected',
      qrCode: null,
      qrDataUrl: null,
      phoneNumber: null,
      displayName: null,
      lastError: reason,
      connectedAt: null
    };
    broadcast('status', connectionState);
    broadcast('disconnected', { reason });
  });

  // Auth failure
  whatsappClient.on('auth_failure', (msg) => {
    console.error('WhatsApp auth failure:', msg);
    connectionState = {
      ...connectionState,
      status: 'disconnected',
      lastError: 'Authentication failed: ' + msg
    };
    broadcast('status', connectionState);
    broadcast('error', { message: 'Authentication failed' });
  });

  // Initialize
  whatsappClient.initialize().catch(err => {
    console.error('WhatsApp initialization error:', err);
    connectionState = {
      ...connectionState,
      status: 'disconnected',
      lastError: err.message
    };
    broadcast('status', connectionState);
    broadcast('error', { message: err.message });
  });
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get current status
app.get('/api/status', (req, res) => {
  res.json(connectionState);
});

// Get QR code
app.get('/api/qr', (req, res) => {
  if (connectionState.qrDataUrl) {
    res.json({ qrDataUrl: connectionState.qrDataUrl });
  } else if (connectionState.status === 'ready') {
    res.json({ status: 'already_connected' });
  } else {
    res.json({ status: connectionState.status, message: 'QR not available yet' });
  }
});

// Initialize/connect WhatsApp
app.post('/api/connect', (req, res) => {
  if (connectionState.status === 'ready') {
    return res.json({ success: true, message: 'Already connected', status: connectionState });
  }
  
  initializeWhatsApp();
  res.json({ success: true, message: 'Initialization started' });
});

// Disconnect WhatsApp
app.post('/api/disconnect', async (req, res) => {
  try {
    if (whatsappClient) {
      await whatsappClient.logout();
      await whatsappClient.destroy();
      whatsappClient = null;
    }
    
    connectionState = {
      status: 'disconnected',
      qrCode: null,
      qrDataUrl: null,
      phoneNumber: null,
      displayName: null,
      lastError: null,
      connectedAt: null
    };
    
    broadcast('status', connectionState);
    res.json({ success: true, message: 'Disconnected' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get flagged messages from database
app.get('/api/messages', async (req, res) => {
  if (!supabase) {
    return res.json({ messages: [], error: 'Database not configured' });
  }

  try {
    const { status, limit = 50 } = req.query;
    
    let query = supabase
      .from('whatsapp_cash_mentions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('review_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ messages: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update message review status
app.patch('/api/messages/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const { id } = req.params;
    const { review_status, notes } = req.body;

    const { data, error } = await supabase
      .from('whatsapp_cash_mentions')
      .update({ 
        review_status, 
        notes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  wsClients.add(ws);

  // Send current status immediately
  ws.send(JSON.stringify({ 
    type: 'status', 
    data: connectionState,
    timestamp: new Date().toISOString()
  }));

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    wsClients.delete(ws);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║       WhatsApp Cash Monitor Server                     ║
╠════════════════════════════════════════════════════════╣
║  HTTP API:    http://localhost:${PORT}                    ║
║  WebSocket:   ws://localhost:${PORT}                      ║
║  Status:      http://localhost:${PORT}/api/status         ║
╠════════════════════════════════════════════════════════╣
║  Monitoring keywords: ${MONITORED_KEYWORDS.join(', ')}
╚════════════════════════════════════════════════════════╝
  `);
});
