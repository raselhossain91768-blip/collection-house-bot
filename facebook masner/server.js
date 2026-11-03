// Main Webhook Server & REST API for Collection House Messenger Bot
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const config = require('./config');
const dbService = require('./services/dbService');
const aiService = require('./services/aiService');
const messengerService = require('./services/messengerService');

const publicDir = path.join(__dirname, 'public');

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper: Parse JSON Body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve({ raw: body, json: body ? JSON.parse(body) : {} });
      } catch (e) {
        resolve({ raw: body, json: {} });
      }
    });
  });
}

// Helper: Send JSON Response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Helper: Serve Static Files
function serveStatic(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Server Error');
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    }
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // ==========================================
  // 1. META MESSENGER WEBHOOK ENDPOINTS
  // ==========================================

  // Meta Webhook Verification (GET /webhook)
  if (method === 'GET' && pathname === '/webhook') {
    const mode = parsedUrl.query['hub.mode'];
    const token = parsedUrl.query['hub.verify_token'];
    const challenge = parsedUrl.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === config.meta.verifyToken) {
        console.log('✅ Meta Webhook verified successfully!');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(challenge);
      } else {
        console.warn('❌ Meta Webhook verification failed. Token mismatch.');
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad Request');
    }
    return;
  }

  // Meta Webhook Message Receiver (POST /webhook)
  if (method === 'POST' && pathname === '/webhook') {
    const { raw, json } = await parseBody(req);

    // Verify signature if configured
    const signature = req.headers['x-hub-signature-256'];
    if (!messengerService.verifySignature(raw, signature)) {
      console.warn('⚠️ Webhook signature mismatch.');
    }

    if (json.object === 'page') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('EVENT_RECEIVED');

      // Process entries asynchronously
      (json.entry || []).forEach(entry => {
        const webhookEvent = (entry.messaging || [])[0];
        if (!webhookEvent) return;

        const senderPsid = webhookEvent.sender ? webhookEvent.sender.id : null;
        if (!senderPsid) return;

        // Skip echo messages sent by the page itself
        if (webhookEvent.message && webhookEvent.message.is_echo) {
          return;
        }

        let userText = '';
        if (webhookEvent.message && webhookEvent.message.text) {
          userText = webhookEvent.message.text;
        } else if (webhookEvent.message && webhookEvent.message.quick_reply) {
          userText = webhookEvent.message.quick_reply.payload;
        } else if (webhookEvent.postback && webhookEvent.postback.payload) {
          userText = webhookEvent.postback.payload;
        }

        if (userText) {
          (async () => {
            try {
              // Send typing indicator
              await messengerService.sendAction(senderPsid, 'mark_seen');
              await messengerService.sendAction(senderPsid, 'typing_on');

              // Save incoming user message
              dbService.saveMessage(senderPsid, 'user', userText);
              const history = dbService.getConversation(senderPsid);

              // Generate AI / Bot response
              const response = await aiService.processMessage(userText, senderPsid, history);

              // Stop typing and send reply
              await messengerService.sendAction(senderPsid, 'typing_off');
              if (response.quickReplies && response.quickReplies.length > 0) {
                await messengerService.sendQuickReplies(senderPsid, response.reply, response.quickReplies);
              } else {
                await messengerService.sendTextMessage(senderPsid, response.reply);
              }

              // Save bot reply to history
              dbService.saveMessage(senderPsid, 'bot', response.reply);
            } catch (err) {
              console.error('Error handling webhook message:', err);
            }
          })();
        }
      });
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
  }

  // ==========================================
  // 2. DASHBOARD & SIMULATOR REST APIs
  // ==========================================

  // Live Chat Simulator (POST /api/chat)
  if (method === 'POST' && pathname === '/api/chat') {
    const { json } = await parseBody(req);
    const message = json.message || '';
    const senderId = json.senderId || 'simulator_user_1';

    dbService.saveMessage(senderId, 'user', message);
    const history = dbService.getConversation(senderId);

    const result = await aiService.processMessage(message, senderId, history);
    dbService.saveMessage(senderId, 'bot', result.reply);

    const stats = dbService.getStats();
    sendJson(res, 200, {
      reply: result.reply,
      quickReplies: result.quickReplies || [],
      isOrderDetected: !!result.isOrderDetected,
      order: result.order || null,
      stats: stats
    });
    return;
  }

  // Get All Orders (GET /api/orders)
  if (method === 'GET' && pathname === '/api/orders') {
    const orders = dbService.getAllOrders();
    sendJson(res, 200, { success: true, count: orders.length, orders });
    return;
  }

  // Create Order Manually (POST /api/orders)
  if (method === 'POST' && pathname === '/api/orders') {
    const { json } = await parseBody(req);
    const order = dbService.createOrder(json);
    sendJson(res, 201, { success: true, order });
    return;
  }

  // Update Order Status (POST /api/orders/update or PATCH /api/orders/:id)
  if ((method === 'POST' && pathname === '/api/orders/update') || method === 'PATCH') {
    const { json } = await parseBody(req);
    const orderId = json.id || pathname.split('/').pop();
    const status = json.status;

    const updated = dbService.updateOrderStatus(orderId, status);
    if (updated) {
      sendJson(res, 200, { success: true, order: updated });
    } else {
      sendJson(res, 404, { success: false, error: 'Order not found' });
    }
    return;
  }

  // Delete Order (POST /api/orders/delete)
  if (method === 'POST' && pathname === '/api/orders/delete') {
    const { json } = await parseBody(req);
    const deleted = dbService.deleteOrder(json.id);
    if (deleted) {
      sendJson(res, 200, { success: true, deleted });
    } else {
      sendJson(res, 404, { success: false, error: 'Order not found' });
    }
    return;
  }

  // Export Orders CSV (GET /api/orders/export/csv)
  if (method === 'GET' && pathname === '/api/orders/export/csv') {
    const csvContent = dbService.exportOrdersCSV();
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="collection_house_orders.csv"'
    });
    res.end(csvContent);
    return;
  }

  // Get Store Stats (GET /api/stats)
  if (method === 'GET' && pathname === '/api/stats') {
    const stats = dbService.getStats();
    sendJson(res, 200, { success: true, stats, store: config.store });
    return;
  }

  // Get Products (GET /api/products)
  if (method === 'GET' && pathname === '/api/products') {
    sendJson(res, 200, { success: true, products: config.store.products });
    return;
  }

  // Get Settings (GET /api/settings)
  if (method === 'GET' && pathname === '/api/settings') {
    const settings = dbService.getSettings();
    sendJson(res, 200, {
      success: true,
      settings,
      metaConfig: {
        verifyToken: config.meta.verifyToken,
        hasPageToken: !!config.meta.pageAccessToken
      }
    });
    return;
  }

  // Update Settings (POST /api/settings)
  if (method === 'POST' && pathname === '/api/settings') {
    const { json } = await parseBody(req);
    const updated = dbService.updateSettings(json);
    sendJson(res, 200, { success: true, settings: updated });
    return;
  }

  // ==========================================
  // 3. STATIC WEB ASSETS (Dashboard UI)
  // ==========================================
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(publicDir, safePath);

  serveStatic(res, filePath);
});

server.listen(config.port, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Collection House AI Messenger Server is Running!`);
  console.log(`🌐 Web Dashboard & Simulator: http://localhost:${config.port}`);
  console.log(`🔗 Meta Webhook Endpoint:     http://localhost:${config.port}/webhook`);
  console.log(`🔑 Webhook Verify Token:      ${config.meta.verifyToken}`);
  console.log(`======================================================\n`);
});
