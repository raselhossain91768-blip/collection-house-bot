// Facebook Messenger Graph API helper service
const https = require('https');
const crypto = require('crypto');
const config = require('../config');

const messengerService = {
  // Verify Meta Webhook signature (X-Hub-Signature-256)
  verifySignature(reqBody, signatureHeader) {
    if (!config.meta.appSecret || !signatureHeader) {
      return true; // Skip if app secret is not configured
    }
    try {
      const [algo, signature] = signatureHeader.split('=');
      if (algo !== 'sha256') return false;

      const hmac = crypto.createHmac('sha256', config.meta.appSecret);
      hmac.update(reqBody);
      const expected = hmac.digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch (err) {
      console.error('Signature verification error:', err);
      return false;
    }
  },

  // Send a raw message payload to Meta Graph API
  async sendPayload(payload) {
    if (!config.meta.pageAccessToken) {
      console.log('[Meta API Mock] Page Access Token not set. Payload:', JSON.stringify(payload));
      return { success: true, mocked: true };
    }

    return new Promise((resolve) => {
      try {
        const postData = JSON.stringify(payload);
        const url = new URL(`${config.meta.graphApiUrl}?access_token=${config.meta.pageAccessToken}`);

        const req = https.request({
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 6000
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ success: true, data: parsed });
              } else {
                console.error('Meta Graph API error response:', parsed);
                resolve({ success: false, error: parsed });
              }
            } catch (e) {
              resolve({ success: false, error: body });
            }
          });
        });

        req.on('error', (err) => {
          console.error('Meta API network error:', err);
          resolve({ success: false, error: err.message });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ success: false, error: 'Timeout connecting to Meta Graph API' });
        });

        req.write(postData);
        req.end();
      } catch (err) {
        console.error('sendPayload exception:', err);
        resolve({ success: false, error: err.message });
      }
    });
  },

  // Send typing indicator or mark seen
  async sendAction(recipientId, action = 'typing_on') {
    return this.sendPayload({
      recipient: { id: recipientId },
      sender_action: action
    });
  },

  // Send plain text message
  async sendTextMessage(recipientId, text) {
    return this.sendPayload({
      recipient: { id: recipientId },
      message: { text }
    });
  },

  // Send text message with quick reply chips
  async sendQuickReplies(recipientId, text, quickReplies = []) {
    const formattedReplies = quickReplies.map(title => ({
      content_type: 'text',
      title: title.length > 20 ? title.substring(0, 20) : title,
      payload: title
    }));

    return this.sendPayload({
      recipient: { id: recipientId },
      message: {
        text: text,
        quick_replies: formattedReplies
      }
    });
  }
};

module.exports = messengerService;
