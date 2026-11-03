// Database service for managing orders, conversations, and settings
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'database.json');

// Ensure data folder and file exists
function initDB() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbFile)) {
    const initialData = {
      orders: [
        {
          id: 'ORD-1001',
          customerName: 'তানভীর আহমেদ',
          phone: '01711223344',
          address: 'বাড়ি নং ১২, রোড ৫, ধানমন্ডি, ঢাকা',
          area: 'Inside Dhaka',
          productName: '34CM SUS 316 Honeycomb Korai With Lid',
          quantity: 1,
          productPrice: 3190,
          deliveryCharge: 80,
          totalPrice: 3270,
          status: 'Confirmed',
          source: 'Messenger',
          notes: 'ক্যাশ অন ডেলিভারি। দ্রুত পাঠানোর অনুরোধ করেছেন।',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          id: 'ORD-1002',
          customerName: 'সুলতানা রাজিয়া',
          phone: '01899887766',
          address: 'জিইসি মোড়, নাসিরাবাদ, চট্টগ্রাম',
          area: 'Outside Dhaka',
          productName: 'Airtight Food Storage Glass Jars 3PCS Set (1000ml, 1200ml, 2000ml)',
          quantity: 1,
          productPrice: 2790,
          deliveryCharge: 150,
          totalPrice: 2940,
          status: 'Pending',
          source: 'Messenger',
          notes: 'কাঁচের আইটেম ভালোমতো বাবল র‍্যাপ করে পাঠাতে হবে।',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ],
      conversations: {},
      settings: {
        botActive: true,
        autoOrderExtraction: true,
        insideDhakaCharge: 80,
        outsideDhakaCharge: 150,
        adminNotifyPhone: '01727164775'
      }
    };
    fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

initDB();

function readData() {
  try {
    initDB();
    const raw = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database:', err);
    return { orders: [], conversations: {}, settings: {} };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

const dbService = {
  // Orders
  getAllOrders() {
    const data = readData();
    return data.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getOrderById(id) {
    const data = readData();
    return data.orders.find(o => o.id === id);
  },

  createOrder(orderInput) {
    const data = readData();
    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    
    let deliveryCharge = orderInput.deliveryCharge !== undefined && orderInput.deliveryCharge !== null
      ? Number(orderInput.deliveryCharge)
      : (orderInput.area === 'Inside Dhaka' || (orderInput.address && (orderInput.address.toLowerCase().includes('dhaka') || orderInput.address.includes('ঢাকা')))
        ? (data.settings.insideDhakaCharge || 80)
        : (data.settings.outsideDhakaCharge || 150));

    const productPrice = Number(orderInput.productPrice) || 0;
    const quantity = Number(orderInput.quantity) || 1;
    const totalPrice = (productPrice * quantity) + deliveryCharge;

    const newOrder = {
      id: orderId,
      customerName: orderInput.customerName || 'গ্রাহক',
      phone: orderInput.phone || '',
      address: orderInput.address || '',
      area: orderInput.area || (orderInput.address && (orderInput.address.includes('ঢাকা') || orderInput.address.toLowerCase().includes('dhaka')) ? 'Inside Dhaka' : 'Outside Dhaka'),
      productName: orderInput.productName || 'Collection House Product',
      quantity: quantity,
      productPrice: productPrice,
      deliveryCharge: deliveryCharge,
      totalPrice: totalPrice,
      status: 'Pending',
      source: orderInput.source || 'Messenger',
      senderId: orderInput.senderId || '',
      notes: orderInput.notes || 'স্বয়ংক্রিয়ভাবে মেসেঞ্জার থেকে সংগৃহীত অর্ডার।',
      createdAt: new Date().toISOString()
    };

    data.orders.unshift(newOrder);
    writeData(data);
    return newOrder;
  },

  updateOrderStatus(id, status) {
    const data = readData();
    const index = data.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      data.orders[index].status = status;
      data.orders[index].updatedAt = new Date().toISOString();
      writeData(data);
      return data.orders[index];
    }
    return null;
  },

  deleteOrder(id) {
    const data = readData();
    const index = data.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      const deleted = data.orders.splice(index, 1);
      writeData(data);
      return deleted[0];
    }
    return null;
  },

  // Stats
  getStats() {
    const data = readData();
    const orders = data.orders || [];
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const confirmedOrders = orders.filter(o => o.status === 'Confirmed' || o.status === 'Shipped' || o.status === 'Delivered').length;
    const totalRevenue = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      totalRevenue
    };
  },

  // Export to CSV
  exportOrdersCSV() {
    const orders = this.getAllOrders();
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Area', 'Product', 'Qty', 'Product Price (BDT)', 'Delivery Charge (BDT)', 'Total (BDT)', 'Status', 'Source'];
    
    const rows = orders.map(o => [
      o.id,
      new Date(o.createdAt).toLocaleString('bn-BD'),
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${o.phone || ''}"`,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      o.area,
      `"${(o.productName || '').replace(/"/g, '""')}"`,
      o.quantity,
      o.productPrice,
      o.deliveryCharge,
      o.totalPrice,
      o.status,
      o.source
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  // Conversations history
  saveMessage(senderId, senderType, text) {
    const data = readData();
    if (!data.conversations[senderId]) {
      data.conversations[senderId] = [];
    }
    data.conversations[senderId].push({
      senderType, // 'user' or 'bot'
      text,
      timestamp: new Date().toISOString()
    });
    // Keep last 30 messages per user
    if (data.conversations[senderId].length > 30) {
      data.conversations[senderId].shift();
    }
    writeData(data);
  },

  getConversation(senderId) {
    const data = readData();
    return data.conversations[senderId] || [];
  },

  // Settings
  getSettings() {
    const data = readData();
    return data.settings || {};
  },

  updateSettings(newSettings) {
    const data = readData();
    data.settings = { ...data.settings, ...newSettings };
    writeData(data);
    return data.settings;
  }
};

module.exports = dbService;
