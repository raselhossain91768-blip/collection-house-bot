// Collection House AI Messenger Bot Frontend Script
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // App State
  let currentTab = 'simulator';
  let ordersList = [];
  let productsList = [];
  let chatSessionId = 'sim_user_' + Math.floor(Math.random() * 10000);

  // DOM Elements
  const tabButtons = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageHeading = document.getElementById('page-heading');
  const pageSubheading = document.getElementById('page-subheading');

  const chatBody = document.getElementById('chat-body');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const typingIndicator = document.getElementById('typing-indicator');
  const quickRepliesBar = document.getElementById('quick-replies-bar');
  const orderAlertBanner = document.getElementById('order-alert-banner');
  const bannerOrderDesc = document.getElementById('banner-order-desc');
  const btnClearChat = document.getElementById('btn-clear-chat');
  const btnBannerGotoOrders = document.getElementById('btn-banner-goto-orders');

  const ordersTbody = document.getElementById('orders-tbody');
  const searchOrdersInput = document.getElementById('search-orders');
  const filterStatusSelect = document.getElementById('filter-status');
  const btnExportCsv = document.getElementById('btn-export-csv');

  const statTotalOrders = document.getElementById('stat-total-orders');
  const statPendingOrders = document.getElementById('stat-pending-orders');
  const statConfirmedOrders = document.getElementById('stat-confirmed-orders');
  const statTotalRevenue = document.getElementById('stat-total-revenue');
  const sidebarOrderCount = document.getElementById('sidebar-order-count');
  const simOrderCount = document.getElementById('sim-order-count');
  const simRevenueCount = document.getElementById('sim-revenue-count');

  const productsGrid = document.getElementById('products-grid');
  const settingsForm = document.getElementById('settings-form');
  const displayWebhookUrl = document.getElementById('display-webhook-url');

  // Modal Elements
  const orderModal = document.getElementById('order-modal');
  const btnQuickOrder = document.getElementById('btn-quick-order');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const manualOrderForm = document.getElementById('manual-order-form');

  // Update Dynamic Webhook URL on Meta Guide
  if (displayWebhookUrl) {
    const origin = window.location.origin;
    displayWebhookUrl.innerText = `${origin}/webhook`;
  }

  // ==========================================
  // TAB SWITCHING
  // ==========================================
  const tabTitles = {
    'simulator': {
      title: 'লাইভ মেসেঞ্জার টেস্ট ও সিমুলেটর',
      subtitle: 'ফেসবুক পেজে কানেক্ট করার আগে কাস্টমার চ্যাট ও অটো-অর্ডার পরীক্ষা করুন'
    },
    'orders': {
      title: 'অর্ডার ম্যানেজমেন্ট ড্যাশবোর্ড',
      subtitle: 'মেসেঞ্জার বট এবং ওয়েবসাইট থেকে সংগৃহীত কাস্টমার অর্ডার তালিকা'
    },
    'products': {
      title: 'প্রোডাক্ট ক্যাটালগ ও নলেজ বেস',
      subtitle: 'Collection House এর প্রোডাক্ট তালিকা যা এআই বট চিনে থাকে'
    },
    'meta-setup': {
      title: 'মেটা ফেসবুক সেটআপ ও কনফিগারেশন',
      subtitle: 'ফেসবুক পেজের সাথে মেসেঞ্জার বট কানেক্ট করার সহজ গাইড ও সেটিংস'
    }
  };

  function switchTab(tabId) {
    currentTab = tabId;
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${tabId}`);
    });

    if (tabTitles[tabId]) {
      pageHeading.innerText = tabTitles[tabId].title;
      pageSubheading.innerText = tabTitles[tabId].subtitle;
    }

    if (tabId === 'orders') {
      loadOrders();
    } else if (tabId === 'products') {
      loadProducts();
    } else if (tabId === 'meta-setup') {
      loadSettings();
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  btnBannerGotoOrders.addEventListener('click', () => {
    switchTab('orders');
  });

  // ==========================================
  // CHAT SIMULATOR
  // ==========================================
  function appendMessage(text, sender = 'bot') {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}`;

    const content = document.createElement('div');
    content.className = 'msg-content';
    
    // Format bold text and linebreaks
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    
    content.innerHTML = formatted;

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.innerText = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });

    bubble.appendChild(content);
    bubble.appendChild(time);
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function updateQuickReplies(replies = []) {
    quickRepliesBar.innerHTML = '';
    replies.forEach(reply => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.innerText = reply;
      btn.setAttribute('data-msg', reply);
      btn.addEventListener('click', () => {
        handleUserSend(reply);
      });
      quickRepliesBar.appendChild(btn);
    });
  }

  async function handleUserSend(text) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    chatInput.value = '';

    // Append user message
    appendMessage(cleanText, 'user');

    // Show typing
    typingIndicator.style.display = 'flex';
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          senderId: chatSessionId
        })
      });

      const data = await response.json();
      
      // Delay for realistic typing feel (350ms)
      setTimeout(() => {
        typingIndicator.style.display = 'none';
        appendMessage(data.reply, 'bot');
        
        if (data.quickReplies && data.quickReplies.length > 0) {
          updateQuickReplies(data.quickReplies);
        }

        // If an order was captured
        if (data.isOrderDetected && data.order) {
          bannerOrderDesc.innerText = `#${data.order.id} – ${data.order.productName} (৳${data.order.totalPrice})`;
          orderAlertBanner.style.display = 'flex';
          loadOrders(); // Refresh orders in background
        }
      }, 350);

    } catch (err) {
      typingIndicator.style.display = 'none';
      appendMessage('দুঃখিত, সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। দয়া করে আবার চেষ্টা করুন।', 'bot');
    }
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUserSend(chatInput.value);
  });

  // Scenario Buttons
  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      handleUserSend(text);
    });
  });

  // Clear Chat
  btnClearChat.addEventListener('click', () => {
    chatBody.innerHTML = `
      <div class="message-bubble bot">
        <div class="msg-content">
          আসসালামু আলাইকুম! <strong>Collection House</strong>-এ আপনাকে স্বাগতম। 🌸<br>
          আমরা সরবরাহ করছি প্রিমিয়াম কোয়ালিটি SUS 316 হনিকম্ব কড়াই, এয়ারটাইট গ্লাস জার ও কিচেন আইটেম।<br><br>
          আমি আপনাকে কীভাবে সাহায্য করতে পারি?
        </div>
        <div class="msg-time">এখনই</div>
      </div>
    `;
    orderAlertBanner.style.display = 'none';
    chatSessionId = 'sim_user_' + Math.floor(Math.random() * 10000);
    updateQuickReplies(['🍳 হনিকম্ব কড়াই কালেকশন', '🫙 এয়ারটাইট গ্লাস জার', '💰 ডেলিভারি চার্জ কত?', '🛒 অর্ডার করার নিয়ম']);
  });

  // Setup initial quick replies
  document.querySelectorAll('.quick-replies-bar .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      handleUserSend(chip.getAttribute('data-msg'));
    });
  });

  // ==========================================
  // ORDERS MANAGEMENT
  // ==========================================
  async function loadOrders() {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/stats')
      ]);

      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();

      ordersList = ordersData.orders || [];
      renderOrdersTable(ordersList);

      // Update Stats
      if (statsData.stats) {
        const s = statsData.stats;
        statTotalOrders.innerText = s.totalOrders;
        statPendingOrders.innerText = s.pendingOrders;
        statConfirmedOrders.innerText = s.confirmedOrders;
        statTotalRevenue.innerText = `৳${s.totalRevenue.toLocaleString('bn-BD')}`;
        
        sidebarOrderCount.innerText = s.totalOrders;
        simOrderCount.innerText = s.totalOrders;
        simRevenueCount.innerText = `৳${s.totalRevenue.toLocaleString('bn-BD')}`;
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  }

  function renderOrdersTable(orders) {
    if (!orders || orders.length === 0) {
      ordersTbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
            কোনো অর্ডার পাওয়া যায়নি। মেসেঞ্জার সিমুলেটরে টেস্ট মেসেজ পাঠিয়ে অর্ডার তৈরি করুন!
          </td>
        </tr>
      `;
      return;
    }

    ordersTbody.innerHTML = orders.map(order => {
      const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
      const waLink = `https://wa.me/88${cleanPhone}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${order.customerName}, Collection House থেকে আপনার অর্ডার #${order.id} (${order.productName}) কনফার্মেশনের জন্য যোগাযোগ করছি।`)}`;
      
      const dateStr = new Date(order.createdAt).toLocaleDateString('bn-BD', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <tr>
          <td><span class="order-id-badge">#${order.id}</span></td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</td>
          <td>
            <span class="cust-name">${order.customerName}</span>
            <span class="cust-address">${order.address}</span>
            <small style="color: var(--primary); font-weight: 600;">${order.area === 'Inside Dhaka' ? '📍 ঢাকার ভেতরে' : '🚚 ঢাকার বাইরে'}</small>
          </td>
          <td>
            <div class="phone-action">
              <span style="font-family: monospace; font-weight: 600;">${order.phone}</span>
              ${order.phone ? `
                <a href="${waLink}" target="_blank" class="btn-whatsapp-mini" title="WhatsApp এ মেসেজ দিন">
                  <i data-lucide="message-circle"></i> WA
                </a>
              ` : ''}
            </div>
          </td>
          <td>
            <strong>${order.productName}</strong><br>
            <small style="color: var(--text-muted);">পরিমাণ: ${order.quantity} | মূল্য: ৳${order.productPrice}</small>
          </td>
          <td>
            <strong style="color: var(--success); font-family: 'Outfit'; font-size: 1.05rem;">৳${order.totalPrice}</strong><br>
            <small style="color: var(--text-dim);">(ডেলিভারি ৳${order.deliveryCharge})</small>
          </td>
          <td>
            <select class="status-select status-badge ${order.status}" data-id="${order.id}">
              <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <button class="icon-btn btn-delete-order" data-id="${order.id}" title="অর্ডার ডিলিট করুন" style="color: var(--danger);">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) {
      lucide.createIcons();
    }

    // Attach status change listeners
    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const orderId = select.getAttribute('data-id');
        const newStatus = select.value;
        try {
          await fetch('/api/orders/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: orderId, status: newStatus })
          });
          loadOrders();
        } catch (err) {
          alert('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
        }
      });
    });

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-order').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.getAttribute('data-id');
        if (confirm(`আপনি কি অর্ডার #${orderId} ডিলিট করতে চান?`)) {
          try {
            await fetch('/api/orders/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: orderId })
            });
            loadOrders();
          } catch (err) {
            alert('ডিলিট ব্যর্থ হয়েছে');
          }
        }
      });
    });
  }

  // Search and Filter
  function filterOrders() {
    const query = searchOrdersInput.value.toLowerCase().trim();
    const status = filterStatusSelect.value;

    const filtered = ordersList.filter(o => {
      const matchQuery = !query ||
        o.id.toLowerCase().includes(query) ||
        (o.customerName && o.customerName.toLowerCase().includes(query)) ||
        (o.phone && o.phone.includes(query)) ||
        (o.productName && o.productName.toLowerCase().includes(query));
      
      const matchStatus = status === 'ALL' || o.status === status;
      return matchQuery && matchStatus;
    });

    renderOrdersTable(filtered);
  }

  searchOrdersInput.addEventListener('input', filterOrders);
  filterStatusSelect.addEventListener('change', filterOrders);

  // Export CSV
  btnExportCsv.addEventListener('click', () => {
    window.location.href = '/api/orders/export/csv';
  });

  // ==========================================
  // PRODUCT CATALOG
  // ==========================================
  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      productsList = data.products || [];

      productsGrid.innerHTML = productsList.map(prod => `
        <div class="product-card">
          <span class="product-category">${prod.category}</span>
          <h3>${prod.name}</h3>
          <div class="product-prices">
            <span class="sale-price">৳${prod.salePrice}</span>
            <span class="regular-price">৳${prod.regularPrice}</span>
          </div>
          <p class="product-desc">${prod.description}</p>
          <div class="product-card-footer">
            <button class="btn btn-outline btn-block btn-test-prod" data-name="${prod.name}">
              <i data-lucide="message-square"></i>
              <span>সিমুলেটরে টেস্ট করুন</span>
            </button>
          </div>
        </div>
      `).join('');

      if (window.lucide) {
        lucide.createIcons();
      }

      document.querySelectorAll('.btn-test-prod').forEach(btn => {
        btn.addEventListener('click', () => {
          const prodName = btn.getAttribute('data-name');
          switchTab('simulator');
          handleUserSend(`${prodName} er dam koto ar delivery policy ki?`);
        });
      });
    } catch (err) {
      console.error('Error loading products:', err);
    }
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        document.getElementById('set-inside-dhaka').value = data.settings.insideDhakaCharge || 80;
        document.getElementById('set-outside-dhaka').value = data.settings.outsideDhakaCharge || 150;
        document.getElementById('set-admin-phone').value = data.settings.adminNotifyPhone || '01727164775';
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updated = {
      insideDhakaCharge: Number(document.getElementById('set-inside-dhaka').value) || 80,
      outsideDhakaCharge: Number(document.getElementById('set-outside-dhaka').value) || 150,
      adminNotifyPhone: document.getElementById('set-admin-phone').value.trim()
    };

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      alert('✅ সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err) {
      alert('❌ সেটিংস সংরক্ষণ ব্যর্থ হয়েছে');
    }
  });

  // ==========================================
  // MANUAL ORDER MODAL
  // ==========================================
  btnQuickOrder.addEventListener('click', () => {
    orderModal.style.display = 'flex';
  });

  function closeModal() {
    orderModal.style.display = 'none';
    manualOrderForm.reset();
  }

  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);

  manualOrderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const select = document.getElementById('modal-prod-select');
    const selectedOption = select.options[select.selectedIndex];
    const price = Number(selectedOption.getAttribute('data-price')) || 0;

    const newOrder = {
      customerName: document.getElementById('modal-cust-name').value.trim(),
      phone: document.getElementById('modal-cust-phone').value.trim(),
      address: document.getElementById('modal-cust-address').value.trim(),
      productName: select.value,
      productPrice: price,
      quantity: Number(document.getElementById('modal-prod-qty').value) || 1,
      area: document.getElementById('modal-area-select').value,
      source: 'Manual Entry'
    };

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      closeModal();
      switchTab('orders');
      loadOrders();
    } catch (err) {
      alert('অর্ডার যোগ করতে সমস্যা হয়েছে');
    }
  });

  // Initial Load
  loadOrders();
});
