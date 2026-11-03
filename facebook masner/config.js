// Configuration settings for Collection House Messenger Bot
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file if present
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    });
  }
}
loadEnv();

const config = {
  port: process.env.PORT || 3000,

  // Meta Graph API & Webhook Verification
  meta: {
    verifyToken: process.env.VERIFY_TOKEN || 'collection_house_webhook_token_2026',
    pageAccessToken: process.env.PAGE_ACCESS_TOKEN || 'EAATYZB4sdmwcBSyFFmldE2Ynnc73flGMhVNZB1e98K1wMAGFWdnYxtMHmOLXtadxUmUwMKRA7tZCqfSoZBmZAz1Hn6cAgHKcc2Nxd5KU5xdoOCGlQjZBNMuzCsN8ujhnEzXoZCwn5lv5aZBs4ORZAUeVcYWRnZAe0ZAk3LcMMVpP5hPyz3UtzW98Ot25jiU5yuSfKLk1A8kidMZD',
    appSecret: process.env.APP_SECRET || 'cdf02a146b9245f62e203b72d0ff112f',
    pageId: process.env.PAGE_ID || '102242299427916',
    pageName: process.env.PAGE_NAME || 'Collection house BD',
    graphApiUrl: 'https://graph.facebook.com/v20.0/me/messages'
  },

  // WooCommerce Store Integration
  woocommerce: {
    storeUrl: 'https://collectionhouse.com.bd',
    consumerKey: 'ck_f3d553edf4b701f561adae09d87594dca7c15df1',
    consumerSecret: 'cs_d94447783ddfe206227701b44526217d78c714d9'
  },

  // Google Sheets Orders Sync (No Courier Booking)
  googleSheets: {
    webhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbyDb5x8ivcRmwTV73DN1srkcflupCKWP-fxqMNHiZs7dDxgEReGKBTRZwXIw8wz5om7/exec',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1C1c12BSHn-kJ_a32B3qtbzusug-8WtR2RNTrR0KnqZM/edit?usp=sharing'
  },

  // Steadfast Courier Integration (Auto-booking DISABLED by user request)
  courier: {
    autoBook: false,
    baseUrl: 'https://portal.packzy.com/api/v1',
    apiKey: 'qjery2jk8nx4ojhi7sybp77be13swpqt',
    secretKey: 'id92h4uyngboel9r92k5nxsm'
  },

  // AI Service API keys
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  },

  // Store Brand Profile & Learned Templates (Collection house BD)
  store: {
    name: 'Collection house BD',
    tagline: 'আপনার বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম, সেরা দামে সেরা পণ্যের নিশ্চয়তা।',
    website: 'https://collectionhouse.com.bd',
    phone: '+8801727164775',
    whatsapp: 'https://wa.me/8801727164775',
    email: 'support@collectionhouse.com.bd',
    address: '27/28, Khilgaon Railgate Market, Shajahanpur, Dhaka',
    facebookPage: 'https://www.facebook.com/COLLECTIONHOUSEBD.247',
    
    // Delivery & Payment Policies
    delivery: {
      insideDhaka: {
        cost: 80,
        time: '১-২ কার্যদিবস',
        label: 'ঢাকার ভেতরে ৮০ টাকা'
      },
      outsideDhaka: {
        cost: 150,
        time: '২-৪ কার্যদিবস',
        label: 'ঢাকার বাইরে ১৫০ টাকা'
      },
      paymentMethods: 'ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা রয়েছে। পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করতে পারবেন।',
      returnPolicy: 'পণ্য হাতে পেয়ে চেক করে নেওয়ার সুবিধা আছে। প্রোডাক্টে কোনো সমস্যা থাকলে ৭ দিনের মধ্যে এক্সচেঞ্জ বা রিটার্ন করা যাবে।'
    },

    // Learned Brand Offer Templates from Messenger Chat History
    templates: {
      waterBottleOffer: `CP01 - Glass water bottle সাথে ফ্রি প্রোটেক্টিভ কাভার

♥️♥️অফার প্রাইজ ♥️♥️

🔹 ১ লিটার — ১০৫০ টাকা
🔹 ১.৫ লিটার — ১৩৫০ টাকা
🔹 ২ লিটার — ১৫৯০ টাকা
🔹 ৩ পিছ কম্বো — ৩৫৯০ টাকা
(এছাড়াও ছোট ৫০০ মিলি পাওয়া যাবে মাত্র ৫৫০ টাকায়)

(প্রতিটি বোতলের সাথে ফ্রী প্রোটেক্টিভ কাভার বুঝে নিন)

🚚 ডেলিভারি চার্জ: ঢাকা ৮০ টাকা, ঢাকার বাইরে ১৫০ টাকা।
💵 সম্পূর্ণ ক্যাশ অন ডেলিভারিতে চেক করে মূল্য পরিশোধ করতে পারবেন।

🔗 পানির বোতল ক্যাটাগরি লিংক:
https://collectionhouse.com.bd/product-category/crockeries-bazarcrockeries-items/glass-water-bottle-crockeries-bazarcrockeries-items/

অর্ডার করতে চাইলে আপনার নাম, সম্পূর্ণ ঠিকানা ও মোবাইল নম্বর লিখে পাঠান 😊`,

      jarsOffer: `🫙 Airtight Food Storage Glass Jars (ভ্যাকুয়াম লিডসহ কাঁচের বয়াম):

🔹 ১২০০মিলি সিঙ্গেল জার — ৭৯০ টাকা (রেগুলার ৯৫০৳)
🔹 ৩ পিস ১০০০মিলি সেট — ১৯৯০ টাকা
🔹 ৩ পিস সেট (১০০০মিলি, ১২০০মিলি, ২০০০মিলি) — ২৭৯০ টাকা (রেগুলার ৩৪৫০৳)

খাবার থাকে ১০০% আর্দ্রতা ও ময়েশ্চারমুক্ত।
🚚 ডেলিভারি চার্জ: ঢাকা ৮০ টাকা, ঢাকার বাইরে ১৫০ টাকা।
💵 ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।

🔗 কাচের জার ক্যাটাগরি লিংক:
https://collectionhouse.com.bd/product-category/crockeries-bazarcrockeries-items/glass-jars-and-kitchen-accessories-crockeries-bazarcrockeries-items/

অর্ডার করতে নাম, মোবাইল নম্বর ও ঠিকানা দিন!`,

      koraiOffer: `🍳 SUS 316 Honeycomb Korai With Lid:

🔹 ৩৪ সেমি কড়াই ঢাকনাসহ — ৩১৯০ টাকা (রেগুলার ৩৬৫০৳)
🔹 ৩২ সেমি কড়াই ঢাকনাসহ — ২৯৯০ টাকা
🔹 ২৮ সেমি কড়াই ঢাকনাসহ — ২৪৯০ টাকা

১০০% ফুড গ্রেড SUS 316 স্টেইনলেস স্টিল, স্ক্র্যাচ-প্রুফ।
🚚 ডেলিভারি চার্জ: ঢাকা ৮০ টাকা, ঢাকার বাইরে ১৫০ টাকা।

🔗 কিচেন এক্সসরিজ ক্যাটাগরি লিংক:
https://collectionhouse.com.bd/product-category/crockeries-bazarcrockeries-items/kitchenware-and-homeware-crockeries-bazarcrockeries-items/`
    },

    // Curated Popular Products from collectionhouse.com.bd
    products: [
      {
        id: 'glass-bottle-combo',
        name: 'Glass Water Bottle With Protective Cover (1L, 1.5L, 2L)',
        salePrice: 1050,
        imageUrl: 'https://collectionhouse.com.bd/wp-content/uploads/2026/09/1000034761.jpg',
        variants: [
          { size: '500ml', price: 550 },
          { size: '1L (1000ml)', price: 1050 },
          { size: '1.5L (1500ml)', price: 1350 },
          { size: '2L (2000ml)', price: 1590 },
          { size: '3pcs Combo Set', price: 3590 }
        ],
        category: 'Glass Water Bottle',
        description: 'ফুড-গ্রেড বোরোসিলিকেট কাঁচের প্রিমিয়াম পানির বোতল সাথে ফ্রি প্রোটেক্টিভ কাভার।',
        url: 'https://collectionhouse.com.bd/product-category/crockeries-bazarcrockeries-items/glass-water-bottle-crockeries-bazarcrockeries-items/'
      },
      {
        id: 'wavy-glass-mug',
        name: 'Clear Glass Coffee Mug with Bamboo Lid and Straw',
        regularPrice: 750,
        salePrice: 490,
        imageUrl: 'https://collectionhouse.com.bd/wp-content/uploads/2026/05/img_6392.jpeg',
        variants: [
          { size: '1 Pcs Set', price: 490, regular: 750 },
          { size: '2 Pcs Set', price: 950, regular: 1500 }
        ],
        category: 'Coffee & Juice Mug',
        description: 'প্রিমিয়াম স্টাইলিশ গ্লাস কফি ও জুস মগ সাথে ব্যাম্বু লিড (বাঁশের ঢাকনা) ও কাঁচের স্ট্র।',
        url: 'https://collectionhouse.com.bd/product/5pcs-set-clear-square-glass-coffee-mugs-with-lid-and-straw-2-2-2-2/'
      },
      {
        id: 'korai-34cm',
        name: '34CM SUS 316 Honeycomb Korai With Lid',
        regularPrice: 3650,
        salePrice: 3190,
        imageUrl: 'https://collectionhouse.com.bd/wp-content/uploads/2026/05/imgi_453_71JsdgXsDsL._SL1500.webp',
        category: 'Tableware / Cookware',
        description: 'অরিজিনাল SUS 316 ফুড গ্রেড স্টেইনলেস স্টিল হনিকম্ব নন-স্টিক কড়াই। ঢাকনাসহ।',
        url: 'https://collectionhouse.com.bd/product/34cm-sus-316-honeycomb-korai-with-lid/'
      },
      {
        id: 'korai-32cm',
        name: '32CM SUS 316 Honeycomb Korai With Lid',
        regularPrice: 3990,
        salePrice: 2990,
        imageUrl: 'https://collectionhouse.com.bd/wp-content/uploads/2026/05/imgi_453_71JsdgXsDsL._SL1500.webp',
        category: 'Tableware / Cookware',
        description: 'অরিজিনাল SUS 316 স্টেইনলেস স্টিল প্রিমিয়াম হনিকম্ব কড়াই। ঢাকনাসহ।',
        url: 'https://collectionhouse.com.bd/product/32cm-sus-316-honeycomb-korai-with-lid/'
      },
      {
        id: 'jars-3pcs-set',
        name: 'Airtight Food Storage Glass Jars 3PCS Set (1000ml, 1200ml, 2000ml)',
        regularPrice: 3450,
        salePrice: 2790,
        imageUrl: 'https://collectionhouse.com.bd/wp-content/uploads/2025/12/Untitled-design-1.avif',
        category: 'Glass Jars & Kitchen Accessories',
        description: 'ভ্যাকুয়াম গ্লাস লিডসহ ৩ পিসের এয়ারটাইট কাঁচের জার সেট।',
        url: 'https://collectionhouse.com.bd/product/airtight-food-storage-glass-jars-with-vacuum-glass-lids-3pcs-set-1000ml-1200ml-2000ml/'
      },
      {
        id: 'jar-1200ml',
        name: 'Airtight Glass Jar Container with Lid, 1200 ML',
        regularPrice: 950,
        salePrice: 790,
        imageUrl: 'https://collectionhouse.com.bd/wp-content/uploads/2026/05/41Ciw0KziBL.webp',
        category: 'Glass Jars & Kitchen Accessories',
        description: '১২০০ মিলি সিঙ্গেল ভ্যাকুয়াম এয়ারটাইট কাঁচের বয়াম।',
        url: 'https://collectionhouse.com.bd/product/airtight-glass-jar-container-with-lid-1200-ml/'
      },
      {
        id: 'tea-cup-set-12pcs',
        name: 'Fine Bone Tea Cup Set 6+6 Pcs (12 Pcs) - SC18T004',
        regularPrice: 5380,
        salePrice: 4880,
        imageUrl: 'https://collectionhouse.com.bd/wp-content/uploads/2026/08/SC18T004-1.jpg',
        category: 'Tableware / Tea Sets',
        description: 'প্রিমিয়াম ফাইন বোন চায়না ১২ পিস টি কাপ ও সসার সেট।',
        url: 'https://collectionhouse.com.bd/product/fine-bone-tea-cup-set-66-pcs-12-pcs-sc18t004/'
      },
      {
        id: 'oil-sprayer-470ml',
        name: '2 In 1 Glass Olive Oil Sprayer & Pourer 470ml',
        regularPrice: 850,
        salePrice: 650,
        imageUrl: 'https://collectionhouse.com.bd/wp-content/uploads/2026/05/imgi_453_71JsdgXsDsL._SL1500.webp',
        category: 'Kitchen Accessories',
        description: 'তেল স্প্রে এবং ঢালার ২-ইন-১ গ্লাস বোটল। রান্নায় ও সালাদে তেল নিয়ন্ত্রণে দারুণ কার্যকর।',
        url: 'https://collectionhouse.com.bd/product/oil-sprayer-for-cooking-470ml-2-in-1-glass-olive-oil-spray/'
      }
    ]
  }
};

module.exports = config;
