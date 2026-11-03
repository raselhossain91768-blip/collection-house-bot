// AI Engine for Collection House Messenger Bot (Trained on Real Brand Chat History)
const https = require('https');
const config = require('../config');
const dbService = require('./dbService');

// Normalize Bengali numbers to English digits
function normalizeDigits(text) {
  if (!text) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return text.replace(/[০-৯]/g, (d) => bnDigits.indexOf(d));
}

// Extract phone number from text (e.g. 017XXXXXXXX, +88018XXXXXXXX)
function extractPhoneNumber(text) {
  const normalized = normalizeDigits(text);
  const regex = /(?:\+?88)?01[3-9]\d{8}\b/;
  const match = normalized.match(regex);
  return match ? match[0].replace('+88', '') : null;
}

// Extract address clues
function extractAddress(text) {
  const normalized = text.toLowerCase();
  const addressKeywords = [
    'ঢাকা', 'dhaka', 'চট্টগ্রাম', 'chittagong', 'sylhet', 'সিলেট', 'rajshahi', 'রাজশাহী',
    'khulna', 'খুলনা', 'barisal', 'বরিশাল', 'rangpur', 'রংপুর', 'mymensingh', 'ময়মনসিংহ',
    'কুমিল্লা', 'comilla', 'নোয়াখালী', 'noakhali', 'বগুড়া', 'bogra', 'গাজীপুর', 'gazipur',
    'রোড', 'road', 'বাড়ি', 'house', 'বাসা', 'flat', 'ফ্ল্যাট', 'থানা', 'thana', 'জেলা', 'district',
    'বাজার', 'bazar', 'পোস্ট', 'post', 'গ্রাম', 'gram', 'village', 'উপজেলা', 'upazila', 'খিলগাঁও',
    'মিরপুর', 'ধানমন্ডি', 'উত্তরা', 'mohammadpur', 'dohs', 'chatkhil'
  ];

  for (const kw of addressKeywords) {
    if (normalized.includes(kw)) {
      return true;
    }
  }
  return false;
}

// Helper: Identify which product the user might be talking about
function identifyProduct(text) {
  const lower = text.toLowerCase();
  
  // Water bottle queries
  if (lower.includes('বোতল') || lower.includes('bottle') || lower.includes('পানি') || lower.includes('water') || lower.includes('cp01') || lower.includes('cp02') || lower.includes('লিটার') || lower.includes('liter')) {
    const bottleItem = config.store.products.find(p => p.id === 'glass-bottle-combo');
    let selectedSize = '1L (1000ml)';
    let selectedPrice = 1050;

    if (lower.includes('500') || lower.includes('৫০০')) {
      selectedSize = '500ml';
      selectedPrice = 550;
    } else if (lower.includes('1.5') || lower.includes('১.৫') || lower.includes('১৫০০')) {
      selectedSize = '1.5 Liter';
      selectedPrice = 1350;
    } else if (lower.includes('2') || lower.includes('২') || lower.includes('২০০০')) {
      selectedSize = '2 Liter';
      selectedPrice = 1590;
    } else if (lower.includes('কম্বো') || lower.includes('combo') || lower.includes('৩পিস') || lower.includes('3pcs')) {
      selectedSize = '3pcs Combo Set';
      selectedPrice = 3590;
    }

    return {
      ...bottleItem,
      name: `Glass Water Bottle (${selectedSize})`,
      salePrice: selectedPrice,
      selectedSize: selectedSize
    };
  }

  // Korai queries
  if (lower.includes('কড়াই') || lower.includes('korai') || lower.includes('honeycomb') || lower.includes('হনিকম্ব') || lower.includes('sus 316')) {
    if (lower.includes('34') || lower.includes('৩৪')) {
      return config.store.products.find(p => p.id === 'korai-34cm');
    } else if (lower.includes('28') || lower.includes('২৮')) {
      return { id: 'korai-28cm', name: '28CM SUS 316 Honeycomb Korai With Lid', salePrice: 2490 };
    }
    return config.store.products.find(p => p.id === 'korai-32cm') || config.store.products[1];
  }

  // Jars queries
  if (lower.includes('জার') || lower.includes('jar') || lower.includes('airtight') || lower.includes('এয়ারটাইট') || lower.includes('ভ্যাকুয়াম')) {
    return config.store.products.find(p => p.id === 'jars-3pcs-set');
  }

  // Oil sprayer
  if (lower.includes('অয়েল') || lower.includes('oil') || lower.includes('স্প্রে') || lower.includes('sprayer') || lower.includes('তেল')) {
    return config.store.products.find(p => p.id === 'oil-sprayer-470ml');
  }

  return null;
}

// Extract name from message
function extractName(text) {
  const match = text.match(/(?:name|নাম|কাস্টমার)\s*[:：\-]\s*([^\n,;|]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

// Extract explicit address if labeled
function extractExplicitAddress(text) {
  const match = text.match(/(?:address|ঠিকানা|লোকেশন|location)\s*[:：\-]\s*([^\n;]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

// Smart Response Engine trained on Collection House chat transcripts
function generateRuleBasedResponse(message, history = [], senderId = '') {
  const text = message.trim();
  const lower = text.toLowerCase();
  const phone = extractPhoneNumber(text);
  const hasAddress = extractAddress(text);
  const explicitAddress = extractExplicitAddress(text);
  const explicitName = extractName(text);
  const product = identifyProduct(text);

  // 1. ORDER DETECTION: Customer sent phone number + address
  if (phone && (hasAddress || explicitAddress || text.length > 20)) {
    let matchedProduct = product;
    if (!matchedProduct && history && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        const histProd = identifyProduct(history[i].text || '');
        if (histProd) {
          matchedProduct = histProd;
          break;
        }
      }
    }
    if (!matchedProduct) {
      matchedProduct = { name: 'Glass Water Bottle (1L)', salePrice: 1050 };
    }

    const finalAddress = explicitAddress || text;
    const finalName = explicitName || 'সম্মানিত গ্রাহক';

    const checkText = (finalAddress + ' ' + text).toLowerCase();
    const isDhaka = checkText.includes('ঢাকা') || checkText.includes('dhaka') || checkText.includes('dhk') ||
      checkText.includes('মিরপুর') || checkText.includes('mirpur') ||
      checkText.includes('ধানমন্ডি') || checkText.includes('dhanmondi') ||
      checkText.includes('উত্তরা') || checkText.includes('uttara') ||
      checkText.includes('গুলশান') || checkText.includes('gulshan') ||
      checkText.includes('বনানী') || checkText.includes('banani') ||
      checkText.includes('মতিঝিল') || checkText.includes('motijheel') ||
      checkText.includes('খিলগাঁও') || checkText.includes('khilgaon') ||
      checkText.includes('মোহাম্মদপুর') || checkText.includes('dohs');

    const area = isDhaka ? 'Inside Dhaka' : 'Outside Dhaka';
    const deliveryCharge = isDhaka ? config.store.delivery.insideDhaka.cost : config.store.delivery.outsideDhaka.cost;
    const total = matchedProduct.salePrice + deliveryCharge;

    // Save order into database
    const savedOrder = dbService.createOrder({
      customerName: finalName,
      phone: phone,
      address: finalAddress,
      area: area,
      productName: matchedProduct.name,
      quantity: 1,
      productPrice: matchedProduct.salePrice,
      deliveryCharge: deliveryCharge,
      senderId: senderId,
      notes: `কাস্টমার মেসেজ: "${text}"`
    });

    // Push order to Google Sheets
    if (config.googleSheets && config.googleSheets.webhookUrl) {
      try {
        const sheetData = JSON.stringify({
          orderId: savedOrder.id,
          customerName: finalName,
          phone: phone,
          address: finalAddress,
          product: matchedProduct.name,
          price: matchedProduct.salePrice,
          deliveryCharge: deliveryCharge,
          total: total,
          status: 'Pending Confirmation'
        });
        const parsedUrl = new URL(config.googleSheets.webhookUrl);
        const req = https.request({
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(sheetData)
          }
        });
        req.on('error', () => {});
        req.write(sheetData);
        req.end();
      } catch (e) {}
    }

    // Exact order reply style matching Collection House's learned transcripts
    const reply = `🎉 ধন্যবাদ ${finalName !== 'সম্মানিত গ্রাহক' ? finalName : ''}! আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।\n\n` +
      `📦 **অর্ডার কনফার্মেশন বিবরণ:**\n` +
      `• Name: ${finalName}\n` +
      `• Address: ${finalAddress}\n` +
      `• Number: ${phone}\n` +
      `• Product: ${matchedProduct.name} (৳${matchedProduct.salePrice})\n` +
      `• Delivery Charge: ৳${deliveryCharge} (${isDhaka ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'})\n` +
      `• Total Bill: ৳${total} (ক্যাশ অন ডেলিভারি)\n\n` +
      `🚚 আমাদের টিম দ্রুত পার্সেলটি বুকিং করে পাঠিয়ে দেবে। ডেলিভারির সময় পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করতে পারবেন।\n` +
      `যেকোনো প্রয়োজনে কল করুন: ${config.store.phone}`;

    return {
      reply,
      isOrderDetected: true,
      order: savedOrder,
      quickReplies: ['📦 আরও পণ্য দেখুন', '📞 হটলাইন নম্বর', '🌐 ওয়েবসাইটে যান']
    };
  }

  // 2. GREETINGS (Hi / Hello / Salam / Assalamu Alaikum)
  if (/^(hi|hello|hey|সালাম|আসসালামু|assalamu|salam|kemon|কেমন|get started)/i.test(lower)) {
    return {
      reply: `আসসালামু আলাইকুম! **Collection house BD**-তে আপনাকে স্বাগতম 🌸\n` +
        `আমাদের কাছে পাচ্ছেন অরিজিনাল কাঁচের পানির বোতল (ফ্রি প্রোটেক্টিভ কাভারসহ), SUS 316 হনিকম্ব কড়াই এবং এয়ারটাইট গ্লাস জার।\n\n` +
        `আমি আপনাকে কীভাবে সাহায্য করতে পারি?`,
      quickReplies: ['💧 পানির বোতলের দাম কত?', '🍳 হনিকম্ব কড়াই কালেকশন', '🫙 এয়ারটাইট জার সেট', '💰 ডেলিভারি চার্জ কত?']
    };
  }

  // 3. WATER BOTTLE INQUIRIES (The #1 Inquiry on the Page)
  if (lower.includes('বোতল') || lower.includes('bottle') || lower.includes('পানি') || lower.includes('water') || lower.includes('cp01') || lower.includes('cp02')) {
    return {
      reply: config.store.templates.waterBottleOffer,
      quickReplies: ['🛒 ১ লিটার অর্ডার করব', '🛒 ২ লিটার অর্ডার করব', '🛒 ৩ পিস কম্বো অর্ডার', '💰 ডেলিভারি চার্জ কত?']
    };
  }

  // 4. GENERAL PRICE INQUIRIES (Price? / Dam koto / Koto)
  if (lower.includes('price') || lower.includes('দাম') || lower.includes('dam') || lower.includes('koto') || lower.includes('কত') || lower.includes('rate') || lower.includes('টাকা') || lower.includes('tk')) {
    if (product) {
      return {
        reply: `✨ **${product.name}**\n` +
          `• অফার মূল্য: মাত্র **৳${product.salePrice}**\n` +
          `• ডেলিভারি চার্জ: ঢাকা ৮০ টাকা, ঢাকার বাইরে ১৫০ টাকা।\n\n` +
          `অর্ডার করতে চাইলে আপনার **নাম, সম্পূর্ণ ঠিকানা ও মোবাইল নম্বর** লিখে পাঠান 😊`,
        quickReplies: ['🛒 এটি অর্ডার করতে চাই', '💰 ডেলিভারি চার্জ কত?', '🌐 অন্যান্য সাইজ দেখুন']
      };
    } else {
      return {
        reply: config.store.templates.waterBottleOffer,
        quickReplies: ['💧 ১ লিটার বোতল', '💧 ২ লিটার বোতল', '🍳 হনিকম্ব কড়াই', '🫙 জার সেট']
      };
    }
  }

  // 5. HONEYCOMB KORAI INQUIRIES
  if (lower.includes('korai') || lower.includes('কড়াই') || lower.includes('honeycomb') || lower.includes('হনিকম্ব') || lower.includes('sus 316')) {
    return {
      reply: config.store.templates.koraiOffer + `\n\nডেলিভারি চার্জ: ঢাকা ৮০ টাকা, ঢাকার বাইরে ১৫০ টাকা।\nঅর্ডার করতে নাম, মোবাইল নম্বর ও ঠিকানা দিন!`,
      quickReplies: ['৩৪ সেমি অর্ডার করব', '৩২ সেমি অর্ডার করব', '২৮ সেমি অর্ডার করব', '💰 ডেলিভারি চার্জ কত?']
    };
  }

  // 6. AIRTIGHT JARS
  if (lower.includes('jar') || lower.includes('জার') || lower.includes('airtight') || lower.includes('বয়ম')) {
    return {
      reply: config.store.templates.jarsOffer,
      quickReplies: ['৩ পিস জার সেট অর্ডার করব', '💰 ডেলিভারি চার্জ কত?', '💧 বোতল কালেকশন']
    };
  }

  // 7. DELIVERY CHARGE & TIMELINE
  if (lower.includes('delivery') || lower.includes('ডেলিভারি') || lower.includes('চার্জ') || lower.includes('charge') || lower.includes('সময়')) {
    return {
      reply: `🚚 **ডেলিভারি চার্জ ও সময়:**\n\n` +
        `• **ঢাকার ভেতরে:** মাত্র ৮০ টাকা (১-২ কার্যদিবস)\n` +
        `• **ঢাকার বাইরে:** ১৫০ টাকা (২-৪ কার্যদিবস)\n\n` +
        `✅ সারা বাংলাদেশে সম্পূর্ণ ক্যাশ অন ডেলিভারিতে পণ্য চেক করে টাকা পরিশোধের সুবিধা রয়েছে।\n\n` +
        `অর্ডার করতে আপনার নাম, ঠিকানা ও ফোন নম্বর পাঠান!`,
      quickReplies: ['🛒 অর্ডার করতে চাই', '💧 বোতল অফার দেখুন', '📞 হটলাইন নম্বর']
    };
  }

  // 8. HOW TO ORDER
  if (lower.includes('order') || lower.includes('অর্ডার') || lower.includes('নিতে চাই') || lower.includes('kinbo') || lower.includes('কিনব')) {
    return {
      reply: `🛒 **অর্ডার করার নিয়ম খুব সহজ!**\n\n` +
        `অনুগ্রহ করে নিচের তথ্যগুলো লিখে পাঠান:\n` +
        `১. প্রোডাক্টের নাম ও সাইজ (যেমন: ১ লিটার বোতল বা ৩৪ সেমি কড়াই)\n` +
        `২. আপনার নাম\n` +
        `৩. মোবাইল নম্বর\n` +
        `৪. সম্পূর্ণ ঠিকানা (জেলা ও থানা সহ)\n\n` +
        `আমরা কোনো অগ্রিম টাকা ছাড়াই ক্যাশ অন ডেলিভারিতে পার্সেল পাঠিয়ে দেব।`,
      quickReplies: ['💧 ১ লিটার বোতল', '💧 ২ লিটার বোতল', '🍳 ৩৪ সেমি কড়াই', '📞 ফোনে কথা বলতে চাই']
    };
  }

  // 9. WEBSITE & CATALOG LINKS
  if (lower.includes('website') || lower.includes('ওয়েবসাইট') || lower.includes('link') || lower.includes('ক্যাটালগ') || lower.includes('লিংক')) {
    return {
      reply: `আমাদের ওয়েবসাইট থেকে সরাসরি ভিজিট করে পণ্য দেখতে পারেন:\n\n` +
        `💧 পানির বোতল 🔗\nhttps://collectionhouse.com.bd/product-category/crockeries-bazarcrockeries-items/glass-water-bottle-crockeries-bazarcrockeries-items/\n\n` +
        `🫙 কাচের জার 🔗\nhttps://collectionhouse.com.bd/product-category/crockeries-bazarcrockeries-items/glass-jars-and-kitchen-accessories-crockeries-bazarcrockeries-items/\n\n` +
        `🍳 কিচেন সামগ্রী 🔗\nhttps://collectionhouse.com.bd/product-category/crockeries-bazarcrockeries-items/kitchenware-and-homeware-crockeries-bazarcrockeries-items/\n\n` +
        `🌐 সকল পণ্য: https://collectionhouse.com.bd`,
      quickReplies: ['💧 বোতলের দাম কত?', '🚚 ডেলিভারি চার্জ', '🛒 অর্ডার করব']
    };
  }

  // 10. DEFAULT FALLBACK
  return {
    reply: `ধন্যবাদ আপনার মেসেজের জন্য! 😊\n` +
      `**Collection house BD**-তে আপনার পছন্দের কাঁচের বোতল, হনিকম্ব কড়াই ও হোমওয়্যার সামগ্রী পেয়ে যাচ্ছেন অফার মূল্যে।\n\n` +
      `আপনি কোন পণ্যটি সম্পর্কে জানতে বা অর্ডার করতে চান?`,
    quickReplies: ['💧 পানির বোতল অফার', '🍳 হনিকম্ব কড়াই', '🫙 এয়ারটাইট জার সেট', '💰 ডেলিভারি চার্জ']
  };
}

const aiService = {
  async processMessage(userMessage, senderId = '', history = []) {
    return generateRuleBasedResponse(userMessage, history, senderId);
  }
};

module.exports = aiService;
