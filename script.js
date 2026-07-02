const Storage = (() => {
  const KEYS = {
    inventory: 'medistock_inventory',
    sales: 'medistock_sales',
    settings: 'medistock_settings'
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.error(`Storage: failed to read "${key}"`, err);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Storage: failed to write "${key}"`, err);
      return false;
    }
  }

  return {
    KEYS,
    getInventory: () => read(KEYS.inventory, []),
    setInventory: (data) => write(KEYS.inventory, data),
    getSales: () => read(KEYS.sales, []),
    setSales: (data) => write(KEYS.sales, data),
    getSettings: () => read(KEYS.settings, {}),
    setSettings: (data) => write(KEYS.settings, data)
  };
})();

/* ---------------------------------------------------------------------- */
/* 2. UTILITIES                                                           */
/* ---------------------------------------------------------------------- */
const Utils = (() => {
  function generateId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function formatCurrency(amount) {
    const n = Number(amount) || 0;
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateTime(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function daysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function isSameDay(isoTimestamp, dateObj) {
    const d = new Date(isoTimestamp);
    return d.toDateString() === dateObj.toDateString();
  }

  function debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(message, type = 'default') {
    const stack = document.getElementById('toastStack');
    const toast = document.createElement('div');
    toast.className = `toast${type !== 'default' ? ' toast-' + type : ''}`;
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity .2s ease';
      setTimeout(() => toast.remove(), 220);
    }, 2600);
  }

  return {
    generateId, formatCurrency, formatDate, formatDateTime,
    daysUntil, todayISO, isSameDay, debounce, escapeHtml, showToast
  };
})();

/* ---------------------------------------------------------------------- */
/* 3. APP STATE & SAMPLE DATA                                             */
/* ---------------------------------------------------------------------- */
const AppState = {
  currentView: 'dashboard',
  currentBill: [],          // [{ medId, name, batch, qty, price, gst }]
  editingMedId: null,       // set when editing an existing medicine
  pendingConfirmAction: null,
  inventoryFilters: { search: '', status: 'all', sort: 'name-asc' }
};

const NEAR_EXPIRY_DAYS = 60; // threshold used across the app

function buildSampleData() {
  const inventory = [
    
    ,{
      id: Utils.generateId('MED'), name: 'Paracetamol 500mg', genericName: 'Paracetamol',
      batch: 'BT-2201', supplier: 'Apex Pharma Distributors', purchasePrice: 12, sellingPrice: 20,
      quantity: 240, minStock: 50, rack: 'R-01', gst: 5,
      mfgDate: '2025-01-10', expDate: '2027-01-10'
    },
    {
      id: Utils.generateId('MED'), name: 'Amoxicillin 250mg', genericName: 'Amoxicillin',
      batch: 'BT-1187', supplier: 'MedLife Wholesale', purchasePrice: 45, sellingPrice: 68,
      quantity: 18, minStock: 30, rack: 'R-04', gst: 12,
      mfgDate: '2024-11-02', expDate: '2026-11-02'
    },
    {
      id: Utils.generateId('MED'), name: 'Cetirizine 10mg', genericName: 'Cetirizine Hydrochloride',
      batch: 'BT-0932', supplier: 'Apex Pharma Distributors', purchasePrice: 8, sellingPrice: 15,
      quantity: 120, minStock: 40, rack: 'R-02', gst: 5,
      mfgDate: '2025-02-15', expDate: '2026-08-20'
    },
     
{
id: Utils.generateId('MED'), name: 'Paracetamol 500mg', genericName: 'Paracetamol',
batch: 'BT-2201', supplier: 'Apex Pharma Distributors', purchasePrice: 12, sellingPrice: 20,
quantity: 240, minStock: 50, rack: 'R-01', gst: 5,
mfgDate: '2025-01-10', expDate: '2027-01-10'
},
{
id: Utils.generateId('MED'), name: 'Amoxicillin 500mg', genericName: 'Amoxicillin',
batch: 'BT-2202', supplier: 'MedPlus Wholesale', purchasePrice: 55, sellingPrice: 80,
quantity: 150, minStock: 30, rack: 'R-02', gst: 12,
mfgDate: '2025-02-15', expDate: '2027-02-15'
},
{
id: Utils.generateId('MED'), name: 'Azithromycin 500mg', genericName: 'Azithromycin',
batch: 'BT-2203', supplier: 'Sun Pharma', purchasePrice: 85, sellingPrice: 120,
quantity: 90, minStock: 25, rack: 'R-03', gst: 12,
mfgDate: '2025-03-01', expDate: '2027-03-01'
},
{
id: Utils.generateId('MED'), name: 'Cetirizine 10mg', genericName: 'Cetirizine',
batch: 'BT-2204', supplier: 'Cipla Ltd', purchasePrice: 18, sellingPrice: 30,
quantity: 180, minStock: 40, rack: 'R-04', gst: 5,
mfgDate: '2025-01-25', expDate: '2027-01-25'
},
{
id: Utils.generateId('MED'), name: 'Pantoprazole 40mg', genericName: 'Pantoprazole',
batch: 'BT-2205', supplier: 'Dr Reddy Labs', purchasePrice: 45, sellingPrice: 70,
quantity: 120, minStock: 30, rack: 'R-05', gst: 12,
mfgDate: '2025-04-01', expDate: '2027-04-01'
},
{
id: Utils.generateId('MED'), name: 'Metformin 500mg', genericName: 'Metformin',
batch: 'BT-2206', supplier: 'Lupin Ltd', purchasePrice: 28, sellingPrice: 45,
quantity: 300, minStock: 60, rack: 'R-06', gst: 5,
mfgDate: '2025-02-10', expDate: '2028-02-10'
},
{
id: Utils.generateId('MED'), name: 'Amlodipine 5mg', genericName: 'Amlodipine',
batch: 'BT-2207', supplier: 'Torrent Pharma', purchasePrice: 35, sellingPrice: 55,
quantity: 130, minStock: 35, rack: 'R-07', gst: 5,
mfgDate: '2025-01-15', expDate: '2028-01-15'
},
{
id: Utils.generateId('MED'), name: 'Losartan 50mg', genericName: 'Losartan',
batch: 'BT-2208', supplier: 'Mankind Pharma', purchasePrice: 40, sellingPrice: 60,
quantity: 145, minStock: 40, rack: 'R-08', gst: 5,
mfgDate: '2025-03-10', expDate: '2028-03-10'
},
{
id: Utils.generateId('MED'), name: 'Atorvastatin 10mg', genericName: 'Atorvastatin',
batch: 'BT-2209', supplier: 'Zydus Healthcare', purchasePrice: 52, sellingPrice: 80,
quantity: 100, minStock: 30, rack: 'R-09', gst: 12,
mfgDate: '2025-04-20', expDate: '2028-04-20'
},
{
id: Utils.generateId('MED'), name: 'Vitamin C 500mg', genericName: 'Ascorbic Acid',
batch: 'BT-2210', supplier: 'Abbott India', purchasePrice: 22, sellingPrice: 35,
quantity: 220, minStock: 50, rack: 'R-10', gst: 5,
mfgDate: '2025-02-05', expDate: '2027-08-05'
},
{
id: Utils.generateId('MED'), name: 'Vitamin D3 60000 IU', genericName: 'Cholecalciferol',
batch: 'BT-2211', supplier: 'Cipla Ltd', purchasePrice: 65, sellingPrice: 95,
quantity: 110, minStock: 20, rack: 'R-11', gst: 12,
mfgDate: '2025-01-20', expDate: '2027-07-20'
},
{
id: Utils.generateId('MED'), name: 'Calcium Tablets', genericName: 'Calcium Carbonate',
batch: 'BT-2212', supplier: 'Sun Pharma', purchasePrice: 75, sellingPrice: 110,
quantity: 140, minStock: 35, rack: 'R-12', gst: 12,
mfgDate: '2025-03-18', expDate: '2028-03-18'
},
{
id: Utils.generateId('MED'), name: 'ORS Powder', genericName: 'Oral Rehydration Salts',
batch: 'BT-2213', supplier: 'Apollo Distribution', purchasePrice: 10, sellingPrice: 18,
quantity: 400, minStock: 80, rack: 'R-13', gst: 5,
mfgDate: '2025-02-12', expDate: '2027-02-12'
},
{
id: Utils.generateId('MED'), name: 'Ibuprofen 400mg', genericName: 'Ibuprofen',
batch: 'BT-2214', supplier: 'Lupin Ltd', purchasePrice: 25, sellingPrice: 40,
quantity: 160, minStock: 40, rack: 'R-14', gst: 5,
mfgDate: '2025-03-08', expDate: '2028-03-08'
},
{
id: Utils.generateId('MED'), name: 'Diclofenac Gel', genericName: 'Diclofenac',
batch: 'BT-2215', supplier: 'Dr Reddy Labs', purchasePrice: 48, sellingPrice: 70,
quantity: 95, minStock: 20, rack: 'R-15', gst: 12,
mfgDate: '2025-04-05', expDate: '2027-10-05'
},
{
id: Utils.generateId('MED'), name: 'Cough Syrup 100ml', genericName: 'Dextromethorphan',
batch: 'BT-2216', supplier: 'Apex Pharma Distributors', purchasePrice: 58, sellingPrice: 85,
quantity: 85, minStock: 20, rack: 'R-16', gst: 12,
mfgDate: '2025-01-18', expDate: '2027-01-18'
},
{
id: Utils.generateId('MED'), name: 'Levocetirizine 5mg', genericName: 'Levocetirizine',
batch: 'BT-2217', supplier: 'MedPlus Wholesale', purchasePrice: 20, sellingPrice: 32,
quantity: 180, minStock: 40, rack: 'R-17', gst: 5,
mfgDate: '2025-02-20', expDate: '2028-02-20'
},
{
id: Utils.generateId('MED'), name: 'Omeprazole 20mg', genericName: 'Omeprazole',
batch: 'BT-2218', supplier: 'Torrent Pharma', purchasePrice: 38, sellingPrice: 58,
quantity: 125, minStock: 30, rack: 'R-18', gst: 5,
mfgDate: '2025-01-05', expDate: '2027-07-05'
},
{
id: Utils.generateId('MED'), name: 'Domperidone 10mg', genericName: 'Domperidone',
batch: 'BT-2219', supplier: 'Abbott India', purchasePrice: 30, sellingPrice: 48,
quantity: 135, minStock: 30, rack: 'R-19', gst: 5,
mfgDate: '2025-03-25', expDate: '2028-03-25'
},
{
id: Utils.generateId('MED'), name: 'Multivitamin Capsules', genericName: 'Multivitamins',
batch: 'BT-2220', supplier: 'Apollo Distribution', purchasePrice: 95, sellingPrice: 140,
quantity: 75, minStock: 20, rack: 'R-20', gst: 12,
mfgDate: '2025-04-10', expDate: '2028-04-10'
},

    {
      id: Utils.generateId('MED'), name: 'Azithromycin 500mg', genericName: 'Azithromycin',
      batch: 'BT-0456', supplier: 'CarePlus Distributors', purchasePrice: 55, sellingPrice: 89,
      quantity: 60, minStock: 25, rack: 'R-05', gst: 12,
      mfgDate: '2024-06-01', expDate: '2025-12-01'
    },
    {
      id: Utils.generateId('MED'), name: 'Insulin Glargine 100IU', genericName: 'Insulin Glargine',
      batch: 'BT-7781', supplier: 'BioGen Pharma', purchasePrice: 320, sellingPrice: 420,
      quantity: 12, minStock: 15, rack: 'R-09 (Cold)', gst: 5,
      mfgDate: '2025-03-01', expDate: '2026-09-01'
    },
    {
      id: Utils.generateId('MED'), name: 'Vitamin D3 60K IU', genericName: 'Cholecalciferol',
      batch: 'BT-3312', supplier: 'MedLife Wholesale', purchasePrice: 18, sellingPrice: 32,
      quantity: 200, minStock: 40, rack: 'R-03', gst: 12,
      mfgDate: '2025-05-01', expDate: '2027-05-01'
    },
    {
      id: Utils.generateId('MED'), name: 'Metformin 500mg', genericName: 'Metformin Hydrochloride',
      batch: 'BT-5567', supplier: 'CarePlus Distributors', purchasePrice: 10, sellingPrice: 18,
      quantity: 8, minStock: 30, rack: 'R-06', gst: 5,
      mfgDate: '2024-09-01', expDate: '2026-03-01'
    },
    {
      id: Utils.generateId('MED'), name: 'Cough Syrup 100ml', genericName: 'Dextromethorphan',
      batch: 'BT-9021', supplier: 'Apex Pharma Distributors', purchasePrice: 28, sellingPrice: 45,
      quantity: 55, minStock: 20, rack: 'R-07', gst: 12,
      mfgDate: '2024-08-01', expDate: '2026-08-01'
    }
  ];

  const sales = [];
  const settings = { storeName: 'MediStock Pharmacy', storeAddress: '12 MG Road, Kurnool, AP', storeGst: '37AAAAA0000A1Z5', invoiceCounter: 0, cloudBackup: null };

  return { inventory, sales, settings };
}

function ensureSampleData() {
  const hasInventory = localStorage.getItem(Storage.KEYS.inventory);
  const hasSales = localStorage.getItem(Storage.KEYS.sales);
  const hasSettings = localStorage.getItem(Storage.KEYS.settings);

  if (!hasInventory || !hasSales || !hasSettings) {
    const sample = buildSampleData();
    if (!hasInventory) Storage.setInventory(sample.inventory);
    if (!hasSales) Storage.setSales(sample.sales);
    if (!hasSettings) Storage.setSettings(sample.settings);
  }
}

/* ---------------------------------------------------------------------- */
/* 4. NAVIGATION                                                          */
/* ---------------------------------------------------------------------- */
const Navigation = (() => {
  const titles = {
    dashboard: ['Dashboard', "Overview of your store's performance"],
    sales: ['Sales', 'Create bills and review daily transactions'],
    inventory: ['Inventory', 'Manage medicines, stock levels and expiry'],
    backup: ['Backup', 'Export, import and safeguard your store data']
  };

  function switchView(view) {
    if (!titles[view]) return;
    AppState.currentView = view;

    document.querySelectorAll('.view').forEach(el => { el.hidden = true; });
    document.getElementById(`view-${view}`).hidden = false;

    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    document.getElementById('pageTitle').textContent = titles[view][0];
    document.getElementById('pageSubtitle').textContent = titles[view][1];

    // Refresh the relevant module whenever its view becomes active
    if (view === 'dashboard') Dashboard.render();
    if (view === 'inventory') Inventory.render();
    if (view === 'sales') Sales.refreshSummary();

    // Close sidebar automatically on mobile after navigating
    document.getElementById('appShell').classList.remove('sidebar-open');
  }

  function init() {
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    document.querySelectorAll('[data-view-link]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.viewLink));
    });

    document.getElementById('sidebarToggle').addEventListener('click', () => {
      const shell = document.getElementById('appShell');
      if (window.innerWidth <= 760) {
        shell.classList.toggle('sidebar-open');
      } else {
        shell.classList.toggle('sidebar-collapsed');
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      Utils.showToast('Logged out. Refresh to sign back in.', 'default');
    });
  }

  return { init, switchView };
})();

/* ---------------------------------------------------------------------- */
/* 5. DASHBOARD MODULE                                                    */
/* ---------------------------------------------------------------------- */
const Dashboard = (() => {
  function getStockStatus(item) {
    const days = Utils.daysUntil(item.expDate);
    if (days < 0) return 'expired';
    if (days <= NEAR_EXPIRY_DAYS) return 'near';
    if (item.quantity <= item.minStock) return 'low';
    return 'ok';
  }

  function render() {
    const inventory = Storage.getInventory();
    const sales = Storage.getSales();
    const today = new Date();

    const todaySales = sales.filter(s => Utils.isSameDay(s.date, today));
    const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);

    document.getElementById('statTodaySales').textContent = Utils.formatCurrency(todayTotal);
    document.getElementById('statTodayBills').textContent = todaySales.length;

    const lowStockItems = inventory.filter(i => i.quantity <= i.minStock);
    const expiryItems = inventory.filter(i => {
      const days = Utils.daysUntil(i.expDate);
      return days <= NEAR_EXPIRY_DAYS;
    });

    document.getElementById('statLowStock').textContent = lowStockItems.length;
    document.getElementById('statExpiry').textContent = expiryItems.length;

    renderRecentSales(sales);
    renderAlerts(inventory);
  }

  function renderRecentSales(sales) {
    const tbody = document.querySelector('#recentSalesTable tbody');
    const empty = document.getElementById('recentSalesEmpty');
    const recent = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

    tbody.innerHTML = '';
    empty.hidden = recent.length > 0;

    recent.forEach(sale => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${Utils.escapeHtml(sale.invoiceNo)}</td>
        <td>${Utils.formatDate(sale.date)}</td>
        <td>${sale.items.length}</td>
        <td><span class="badge badge-neutral">${Utils.escapeHtml(sale.paymentMethod)}</span></td>
        <td>${Utils.formatCurrency(sale.total)}</td>`;
      tbody.appendChild(tr);
    });
  }

  function renderAlerts(inventory) {
    const list = document.getElementById('alertList');
    const empty = document.getElementById('alertEmpty');
    list.innerHTML = '';

    const alerts = inventory
      .map(item => ({ item, status: getStockStatus(item) }))
      .filter(a => a.status !== 'ok')
      .sort((a, b) => {
        const rank = { expired: 0, near: 1, low: 2 };
        return rank[a.status] - rank[b.status];
      })
      .slice(0, 8);

    empty.hidden = alerts.length > 0;

    alerts.forEach(({ item, status }) => {
      const row = document.createElement('div');
      const days = Utils.daysUntil(item.expDate);
      let cls = 'alert-warning', sub = `Only ${item.quantity} left (min ${item.minStock})`, badge = 'Low Stock';

      if (status === 'expired') {
        cls = 'alert-danger';
        sub = `Expired ${Math.abs(days)} day(s) ago`;
        badge = 'Expired';
      } else if (status === 'near') {
        cls = 'alert-warning';
        sub = `Expires in ${days} day(s)`;
        badge = 'Near Expiry';
      }

      row.className = `alert-row ${cls}`;
      row.innerHTML = `
        <div class="alert-info">
          <span class="alert-name">${Utils.escapeHtml(item.name)}</span>
          <span class="alert-sub">${Utils.escapeHtml(sub)}</span>
        </div>
        <span class="badge ${status === 'expired' ? 'badge-danger' : 'badge-warning'}">${badge}</span>`;
      list.appendChild(row);
    });
  }

  return { render, getStockStatus };
})();

/* ---------------------------------------------------------------------- */
/* 6. INVENTORY MODULE                                                    */
/* ---------------------------------------------------------------------- */
const Inventory = (() => {
  function getAll() { return Storage.getInventory(); }

  function save(items) { Storage.setInventory(items); }

  function findById(id) { return getAll().find(i => i.id === id); }

  function upsert(medicine) {
    const items = getAll();
    const idx = items.findIndex(i => i.id === medicine.id);
    if (idx >= 0) {
      items[idx] = medicine;
    } else {
      items.push(medicine);
    }
    save(items);
  }

  function remove(id) {
    save(getAll().filter(i => i.id !== id));
  }

  function applyFilters(items) {
    const { search, status, sort } = AppState.inventoryFilters;
    let result = [...items];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.genericName.toLowerCase().includes(q) ||
        i.batch.toLowerCase().includes(q) ||
        i.supplier.toLowerCase().includes(q) ||
        i.rack.toLowerCase().includes(q)
      );
    }

    if (status !== 'all') {
      result = result.filter(i => Dashboard.getStockStatus(i) === status);
    }

    const [field, dir] = sort.split('-');
    result.sort((a, b) => {
      let cmp = 0;
      if (field === 'name') cmp = a.name.localeCompare(b.name);
      if (field === 'qty') cmp = a.quantity - b.quantity;
      if (field === 'expiry') cmp = new Date(a.expDate) - new Date(b.expDate);
      return dir === 'desc' ? -cmp : cmp;
    });

    return result;
  }

  function statusBadge(status, days) {
    switch (status) {
      case 'expired': return `<span class="badge badge-danger">Expired</span>`;
      case 'near': return `<span class="badge badge-warning">Expires in ${days}d</span>`;
      case 'low': return `<span class="badge badge-warning">Low Stock</span>`;
      default: return `<span class="badge badge-success">In Stock</span>`;
    }
  }

  function render() {
    const all = getAll();
    const filtered = applyFilters(all);
    const tbody = document.getElementById('inventoryBody');
    const empty = document.getElementById('inventoryEmpty');

    tbody.innerHTML = '';
    empty.hidden = filtered.length > 0;

    filtered.forEach(item => {
      const status = Dashboard.getStockStatus(item);
      const days = Utils.daysUntil(item.expDate);
      const tr = document.createElement('tr');
      if (status === 'expired') tr.classList.add('row-danger');
      else if (status === 'near' || status === 'low') tr.classList.add('row-warning');

      tr.innerHTML = `
        <td><strong>${Utils.escapeHtml(item.name)}</strong></td>
        <td>${Utils.escapeHtml(item.genericName)}</td>
        <td>${Utils.escapeHtml(item.batch)}</td>
        <td>${Utils.escapeHtml(item.supplier)}</td>
        <td>${Utils.escapeHtml(item.rack)}</td>
        <td>${Utils.formatCurrency(item.purchasePrice)}</td>
        <td>${Utils.formatCurrency(item.sellingPrice)}</td>
        <td>${item.quantity}</td>
        <td>${item.minStock}</td>
        <td>${Utils.formatDate(item.expDate)}</td>
        <td>${statusBadge(status, days)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-action="edit" data-id="${item.id}" aria-label="Edit ${Utils.escapeHtml(item.name)}">
              <span class="nav-icon" data-icon="edit"></span>
            </button>
            <button class="icon-btn" data-action="delete" data-id="${item.id}" aria-label="Delete ${Utils.escapeHtml(item.name)}">
              <span class="nav-icon" data-icon="trash"></span>
            </button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  function openAddModal() {
    AppState.editingMedId = null;
    document.getElementById('medicineModalTitle').textContent = 'Add Medicine';
    document.getElementById('medicineForm').reset();
    document.getElementById('medId').value = '';
    document.getElementById('medGst').value = 5;
    Modals.open('medicineModalOverlay');
  }

  function openEditModal(id) {
    const item = findById(id);
    if (!item) return;
    AppState.editingMedId = id;
    document.getElementById('medicineModalTitle').textContent = 'Edit Medicine';

    document.getElementById('medId').value = item.id;
    document.getElementById('medName').value = item.name;
    document.getElementById('medGeneric').value = item.genericName;
    document.getElementById('medBatch').value = item.batch;
    document.getElementById('medSupplier').value = item.supplier;
    document.getElementById('medPurchasePrice').value = item.purchasePrice;
    document.getElementById('medSellingPrice').value = item.sellingPrice;
    document.getElementById('medQuantity').value = item.quantity;
    document.getElementById('medMinStock').value = item.minStock;
    document.getElementById('medRack').value = item.rack;
    document.getElementById('medGst').value = item.gst;
    document.getElementById('medMfgDate').value = item.mfgDate;
    document.getElementById('medExpDate').value = item.expDate;

    Modals.open('medicineModalOverlay');
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const mfgDate = document.getElementById('medMfgDate').value;
    const expDate = document.getElementById('medExpDate').value;
    if (new Date(expDate) <= new Date(mfgDate)) {
      Utils.showToast('Expiry date must be after manufacturing date.', 'danger');
      return;
    }

    const medicine = {
      id: document.getElementById('medId').value || Utils.generateId('MED'),
      name: document.getElementById('medName').value.trim(),
      genericName: document.getElementById('medGeneric').value.trim(),
      batch: document.getElementById('medBatch').value.trim(),
      supplier: document.getElementById('medSupplier').value.trim(),
      purchasePrice: parseFloat(document.getElementById('medPurchasePrice').value) || 0,
      sellingPrice: parseFloat(document.getElementById('medSellingPrice').value) || 0,
      quantity: parseInt(document.getElementById('medQuantity').value, 10) || 0,
      minStock: parseInt(document.getElementById('medMinStock').value, 10) || 0,
      rack: document.getElementById('medRack').value.trim(),
      gst: parseFloat(document.getElementById('medGst').value) || 0,
      mfgDate, expDate
    };

    upsert(medicine);
    Modals.close('medicineModalOverlay');
    render();
    Dashboard.render();
    Utils.showToast(AppState.editingMedId ? 'Medicine updated.' : 'Medicine added.', 'success');
  }

  function confirmDelete(id) {
    const item = findById(id);
    if (!item) return;
    Modals.confirm({
      title: 'Delete medicine?',
      message: `"${item.name}" (Batch ${item.batch}) will be permanently removed from inventory.`,
      onConfirm: () => {
        remove(id);
        render();
        Dashboard.render();
        Utils.showToast('Medicine deleted.', 'success');
      }
    });
  }

  function init() {
    document.getElementById('addMedicineBtn').addEventListener('click', openAddModal);
    document.getElementById('closeMedicineModal').addEventListener('click', () => Modals.close('medicineModalOverlay'));
    document.getElementById('cancelMedicineBtn').addEventListener('click', () => Modals.close('medicineModalOverlay'));
    document.getElementById('medicineForm').addEventListener('submit', handleFormSubmit);

    document.getElementById('inventoryBody').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'edit') openEditModal(id);
      if (btn.dataset.action === 'delete') confirmDelete(id);
    });

    document.getElementById('inventorySearch').addEventListener('input', Utils.debounce((e) => {
      AppState.inventoryFilters.search = e.target.value;
      render();
    }, 180));

    document.getElementById('filterStatus').addEventListener('change', (e) => {
      AppState.inventoryFilters.status = e.target.value;
      render();
    });

    document.getElementById('sortField').addEventListener('change', (e) => {
      AppState.inventoryFilters.sort = e.target.value;
      render();
    });
  }

  return { init, render, getAll, findById, upsert, remove };
})();

/* ---------------------------------------------------------------------- */
/* 7. SALES MODULE                                                        */
/* ---------------------------------------------------------------------- */
const Sales = (() => {
  function nextInvoiceNumber() {
    const settings = Storage.getSettings();
    const counter = (settings.invoiceCounter || 0) + 1;
    return { display: `INV-${String(counter).padStart(4, '0')}`, counter };
  }

  function updateInvoicePreviewLabel() {
    const { display } = nextInvoiceNumber();
    document.getElementById('invoicePreviewNo').textContent = display;
  }

  function searchMedicines(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Inventory.getAll()
      .filter(i => i.quantity > 0 && Utils.daysUntil(i.expDate) >= 0)
      .filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.genericName.toLowerCase().includes(q) ||
        i.batch.toLowerCase().includes(q))
      .slice(0, 8);
  }

  function renderAutocomplete(results) {
    const box = document.getElementById('medicineAutocomplete');
    if (results.length === 0) {
      box.innerHTML = `<div class="autocomplete-empty">No matching medicine in stock.</div>`;
    } else {
      box.innerHTML = results.map(item => `
        <div class="autocomplete-item" data-id="${item.id}">
          <div class="ac-name">${Utils.escapeHtml(item.name)}</div>
          <div class="ac-sub">Batch ${Utils.escapeHtml(item.batch)} &middot; ${item.quantity} in stock &middot; ${Utils.formatCurrency(item.sellingPrice)}</div>
        </div>`).join('');
    }
    box.hidden = false;
  }

  function addToBill(medId) {
    const item = Inventory.findById(medId);
    if (!item) return;

    const existing = AppState.currentBill.find(b => b.medId === medId);
    const currentQtyInBill = existing ? existing.qty : 0;

    if (currentQtyInBill + 1 > item.quantity) {
      Utils.showToast(`Only ${item.quantity} unit(s) of "${item.name}" available.`, 'warning');
      return;
    }

    if (existing) {
      existing.qty += 1;
    } else {
      AppState.currentBill.push({
        medId: item.id,
        name: item.name,
        batch: item.batch,
        price: item.sellingPrice,
        gst: item.gst,
        qty: 1,
        maxQty: item.quantity
      });
    }

    document.getElementById('medicineSearch').value = '';
    document.getElementById('medicineAutocomplete').hidden = true;
    renderBillTable();
  }

  function updateQty(medId, qty) {
    const line = AppState.currentBill.find(b => b.medId === medId);
    const item = Inventory.findById(medId);
    if (!line || !item) return;

    let newQty = parseInt(qty, 10);
    if (isNaN(newQty) || newQty < 1) newQty = 1;
    if (newQty > item.quantity) {
      newQty = item.quantity;
      Utils.showToast(`Only ${item.quantity} unit(s) available for "${item.name}".`, 'warning');
    }
    line.qty = newQty;
    renderBillTable();
  }

  function removeFromBill(medId) {
    AppState.currentBill = AppState.currentBill.filter(b => b.medId !== medId);
    renderBillTable();
  }

  function calcTotals() {
    let subtotal = 0, gstAmount = 0;
    AppState.currentBill.forEach(line => {
      const lineBase = line.price * line.qty;
      subtotal += lineBase;
      gstAmount += lineBase * (line.gst / 100);
    });
    const discount = parseFloat(document.getElementById('discountInput').value) || 0;
    const total = Math.max(0, subtotal + gstAmount - discount);
    return { subtotal, gstAmount, discount, total };
  }

  function renderBillTable() {
    const tbody = document.getElementById('billItemsBody');
    const empty = document.getElementById('billEmpty');
    tbody.innerHTML = '';
    empty.hidden = AppState.currentBill.length > 0;

    AppState.currentBill.forEach(line => {
      const lineTotal = line.price * line.qty * (1 + line.gst / 100);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${Utils.escapeHtml(line.name)}</td>
        <td>${Utils.escapeHtml(line.batch)}</td>
        <td><input type="number" class="qty-input" min="1" max="${line.maxQty}" value="${line.qty}" data-id="${line.medId}"></td>
        <td>${Utils.formatCurrency(line.price)}</td>
        <td>${line.gst}%</td>
        <td>${Utils.formatCurrency(lineTotal)}</td>
        <td><button class="icon-btn" data-action="remove-line" data-id="${line.medId}" aria-label="Remove ${Utils.escapeHtml(line.name)}"><span class="nav-icon" data-icon="trash"></span></button></td>`;
      tbody.appendChild(tr);
    });

    refreshSummary();
  }

  function refreshSummary() {
    const { subtotal, gstAmount, discount, total } = calcTotals();
    document.getElementById('sumSubtotal').textContent = Utils.formatCurrency(subtotal);
    document.getElementById('sumGst').textContent = Utils.formatCurrency(gstAmount);
    document.getElementById('sumDiscount').textContent = `- ${Utils.formatCurrency(discount)}`;
    document.getElementById('sumTotal').textContent = Utils.formatCurrency(total);

    const sales = Storage.getSales();
    const todaySales = sales.filter(s => Utils.isSameDay(s.date, new Date()));
    document.getElementById('miniTodaySales').textContent = Utils.formatCurrency(todaySales.reduce((s, x) => s + x.total, 0));
    document.getElementById('miniTodayBills').textContent = todaySales.length;

    updateInvoicePreviewLabel();
  }

  function clearBill() {
    AppState.currentBill = [];
    document.getElementById('discountInput').value = 0;
    document.getElementById('customerName').value = '';
    document.getElementById('paymentMethod').value = 'Cash';
    renderBillTable();
  }

  function buildInvoiceHtml(invoiceNo, isPreview) {
    const settings = Storage.getSettings();
    const { subtotal, gstAmount, discount, total } = calcTotals();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const customerName = document.getElementById('customerName').value.trim() || 'Walk-in customer';
    const dateStr = Utils.formatDateTime(new Date().toISOString());

    const rows = AppState.currentBill.map(line => {
      const lineTotal = line.price * line.qty * (1 + line.gst / 100);
      return `<tr>
        <td>${Utils.escapeHtml(line.name)}</td>
        <td>${Utils.escapeHtml(line.batch)}</td>
        <td>${line.qty}</td>
        <td>${Utils.formatCurrency(line.price)}</td>
        <td>${line.gst}%</td>
        <td>${Utils.formatCurrency(lineTotal)}</td>
      </tr>`;
    }).join('');

    return `
      <div class="invoice-doc">
        <div class="invoice-doc-header">
          <div>
            <div class="invoice-store-name">${Utils.escapeHtml(settings.storeName || 'MediStock Pharmacy')}</div>
            <div class="invoice-store-sub">${Utils.escapeHtml(settings.storeAddress || '')}</div>
            <div class="invoice-store-sub">GSTIN: ${Utils.escapeHtml(settings.storeGst || '—')}</div>
          </div>
          <div class="invoice-meta">
            <div><strong>${Utils.escapeHtml(invoiceNo)}</strong>${isPreview ? ' (preview)' : ''}</div>
            <div>${dateStr}</div>
            <div>Customer: ${Utils.escapeHtml(customerName)}</div>
            <div>Payment: ${Utils.escapeHtml(paymentMethod)}</div>
          </div>
        </div>

        <table class="invoice-table">
          <thead><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Price</th><th>GST</th><th>Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="invoice-totals">
          <div class="summary-row"><span>Subtotal</span><span>${Utils.formatCurrency(subtotal)}</span></div>
          <div class="summary-row"><span>GST</span><span>${Utils.formatCurrency(gstAmount)}</span></div>
          <div class="summary-row"><span>Discount</span><span>- ${Utils.formatCurrency(discount)}</span></div>
          <div class="summary-row summary-total"><span>Total Payable</span><span>${Utils.formatCurrency(total)}</span></div>
        </div>

        <div class="invoice-footer">Thank you for shopping with us. Medicines once sold are non-returnable except as per policy.</div>
      </div>`;
  }

  function openPreview() {
    if (AppState.currentBill.length === 0) {
      Utils.showToast('Add at least one medicine to preview the invoice.', 'warning');
      return;
    }
    const { display } = nextInvoiceNumber();
    document.getElementById('invoicePrintArea').innerHTML = buildInvoiceHtml(display, true);
    Modals.open('invoiceModalOverlay');
  }

  function confirmSale() {
    if (AppState.currentBill.length === 0) return;

    // Re-validate stock right before committing, in case of concurrent edits
    for (const line of AppState.currentBill) {
      const item = Inventory.findById(line.medId);
      if (!item || item.quantity < line.qty) {
        Utils.showToast(`Insufficient stock for "${line.name}". Please review the bill.`, 'danger');
        return;
      }
    }

    const { subtotal, gstAmount, discount, total } = calcTotals();
    const settings = Storage.getSettings();
    const { display, counter } = nextInvoiceNumber();

    const sale = {
      id: Utils.generateId('SALE'),
      invoiceNo: display,
      date: new Date().toISOString(),
      customerName: document.getElementById('customerName').value.trim() || 'Walk-in customer',
      paymentMethod: document.getElementById('paymentMethod').value,
      items: AppState.currentBill.map(l => ({ medId: l.medId, name: l.name, batch: l.batch, qty: l.qty, price: l.price, gst: l.gst })),
      subtotal, gstAmount, discount, total
    };

    // Deduct stock
    const inventory = Inventory.getAll();
    AppState.currentBill.forEach(line => {
      const item = inventory.find(i => i.id === line.medId);
      if (item) item.quantity -= line.qty;
    });
    Storage.setInventory(inventory);

    // Persist sale & advance invoice counter
    const sales = Storage.getSales();
    sales.push(sale);
    Storage.setSales(sales);
    settings.invoiceCounter = counter;
    Storage.setSettings(settings);

    Modals.close('invoiceModalOverlay');
    clearBill();
    Dashboard.render();
    Inventory.render();
    Utils.showToast(`Sale ${display} saved successfully.`, 'success');
  }

  function printInvoice() {
    window.print();
  }

  function init() {
    const searchInput = document.getElementById('medicineSearch');
    searchInput.addEventListener('input', Utils.debounce((e) => {
      renderAutocomplete(searchMedicines(e.target.value));
    }, 150));

    searchInput.addEventListener('focus', (e) => {
      if (e.target.value.trim()) renderAutocomplete(searchMedicines(e.target.value));
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.field') || !e.target.closest('#medicineAutocomplete')) {
        if (!e.target.closest('#medicineSearch') && !e.target.closest('#medicineAutocomplete')) {
          document.getElementById('medicineAutocomplete').hidden = true;
        }
      }
    });

    document.getElementById('medicineAutocomplete').addEventListener('click', (e) => {
      const row = e.target.closest('.autocomplete-item');
      if (row) addToBill(row.dataset.id);
    });

    document.getElementById('billItemsBody').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="remove-line"]');
      if (btn) removeFromBill(btn.dataset.id);
    });

    document.getElementById('billItemsBody').addEventListener('change', (e) => {
      if (e.target.classList.contains('qty-input')) {
        updateQty(e.target.dataset.id, e.target.value);
      }
    });

    document.getElementById('discountInput').addEventListener('input', refreshSummary);
    document.getElementById('clearBillBtn').addEventListener('click', clearBill);
    document.getElementById('previewBillBtn').addEventListener('click', openPreview);
    document.getElementById('backToBillBtn').addEventListener('click', () => Modals.close('invoiceModalOverlay'));
    document.getElementById('closeInvoiceModal').addEventListener('click', () => Modals.close('invoiceModalOverlay'));
    document.getElementById('printInvoiceBtn').addEventListener('click', printInvoice);
    document.getElementById('confirmSaleBtn').addEventListener('click', confirmSale);

    updateInvoicePreviewLabel();
  }

  return { init, renderBillTable, refreshSummary, clearBill };
})();

/* ---------------------------------------------------------------------- */
/* 8. BACKUP & RESTORE MODULE                                             */
/* ---------------------------------------------------------------------- */
const Backup = (() => {
  function buildExportPayload() {
    return {
      meta: {
        app: 'MediStock',
        exportedAt: new Date().toISOString(),
        version: 1
      },
      inventory: Storage.getInventory(),
      sales: Storage.getSales(),
      settings: Storage.getSettings()
    };
  }

  function exportBackup() {
    const payload = buildExportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `medistock-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    Utils.showToast('Backup file downloaded.', 'success');
    return payload;
  }

  function validatePayload(data) {
    if (!data || typeof data !== 'object') return 'File is not valid JSON.';
    if (!Array.isArray(data.inventory)) return 'Missing or invalid "inventory" data.';
    if (!Array.isArray(data.sales)) return 'Missing or invalid "sales" data.';
    if (!data.settings || typeof data.settings !== 'object') return 'Missing or invalid "settings" data.';
    return null;
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      let data;
      try {
        data = JSON.parse(e.target.result);
      } catch (err) {
        Utils.showToast('Could not parse the selected file as JSON.', 'danger');
        return;
      }

      const error = validatePayload(data);
      if (error) {
        Utils.showToast(`Invalid backup file: ${error}`, 'danger');
        return;
      }

      Modals.confirm({
        title: 'Restore this backup?',
        message: `This will overwrite your current inventory (${data.inventory.length} items) and sales history (${data.sales.length} records). This cannot be undone.`,
        onConfirm: () => {
          Storage.setInventory(data.inventory);
          Storage.setSales(data.sales);
          Storage.setSettings(data.settings);
          Utils.showToast('Backup restored successfully.', 'success');
          Dashboard.render();
          Inventory.render();
          Sales.refreshSummary();
        }
      });
    };
    reader.readAsText(file);
  }

  function resetToSampleData() {
    Modals.confirm({
      title: 'Reset all data?',
      message: 'This will erase your current inventory and sales history and reload sample data. This cannot be undone.',
      onConfirm: () => {
        const sample = buildSampleData();
        Storage.setInventory(sample.inventory);
        Storage.setSales(sample.sales);
        Storage.setSettings(sample.settings);
        Dashboard.render();
        Inventory.render();
        Sales.refreshSummary();
        Utils.showToast('Sample data reloaded.', 'success');
      }
    });
  }

  function init() {
    document.getElementById('exportBtn').addEventListener('click', exportBackup);

    const fileInput = document.getElementById('importFileInput');
    const fileLabel = document.getElementById('importFileLabel');
    document.querySelector('.file-drop').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      fileLabel.textContent = file.name;
      importBackup(file);
      fileInput.value = '';
      setTimeout(() => { fileLabel.textContent = 'Click to choose a .json backup file'; }, 2500);
    });

    document.getElementById('resetDataBtn').addEventListener('click', resetToSampleData);
    document.getElementById('cloudBackupBtn').addEventListener('click', () => CloudBackup.backupNow());
  }

  return { init, buildExportPayload, exportBackup };
})();

/* ---- Cloud Backup stub ---------------------------------------------------
   Isolated module so a future Google Drive integration can be dropped in
   without touching any other part of the app. See the on-screen TODO box
   in the Backup view for the integration steps.
---------------------------------------------------------------------------*/
const CloudBackup = (() => {
  // TODO: replace with a real Google OAuth 2.0 access token retrieval,
  // e.g. via Google Identity Services (https://developers.google.com/identity).
  async function authenticate(email) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ token: null, email }), 400); // simulated latency
    });
  }

  // TODO: replace with a real multipart upload to the Drive API
  // (files.create) using the token returned by authenticate().
  async function uploadToDrive(token, payload) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ok: true, fileId: 'SIMULATED-' + Utils.generateId('drive') }), 600);
    });
  }

  async function backupNow() {
    const email = document.getElementById('cloudEmail').value.trim();
    if (!email || !email.includes('@')) {
      Utils.showToast('Enter a valid Google account email first.', 'warning');
      return;
    }

    const btn = document.getElementById('cloudBackupBtn');
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="nav-icon" data-icon="cloud"></span> Preparing backup...`;

    try {
      const payload = Backup.buildExportPayload();
      const auth = await authenticate(email);
      const result = await uploadToDrive(auth.token, payload);

      const settings = Storage.getSettings();
      settings.cloudBackup = { email, lastAttempt: new Date().toISOString(), simulated: true };
      Storage.setSettings(settings);

      Utils.showToast('Backup generated. Google Drive upload requires OAuth setup — see TODO below.', 'warning');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  return { backupNow, authenticate, uploadToDrive };
})();

/* ---------------------------------------------------------------------- */
/* 9. MODAL & CONFIRM-DIALOG HELPERS                                      */
/* ---------------------------------------------------------------------- */
const Modals = (() => {
  function open(id) {
    document.getElementById(id).hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function close(id) {
    document.getElementById(id).hidden = true;
    document.body.style.overflow = '';
  }

  function confirm({ title, message, onConfirm }) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;
    AppState.pendingConfirmAction = onConfirm;
    open('confirmModalOverlay');
  }

  function init() {
    // Click outside modal content closes it
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(overlay.id);
      });
    });

    // Escape key closes any open modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
          if (!overlay.hidden) close(overlay.id);
        });
      }
    });

    document.getElementById('confirmCancelBtn').addEventListener('click', () => {
      AppState.pendingConfirmAction = null;
      close('confirmModalOverlay');
    });

    document.getElementById('confirmOkBtn').addEventListener('click', () => {
      const action = AppState.pendingConfirmAction;
      close('confirmModalOverlay');
      AppState.pendingConfirmAction = null;
      if (typeof action === 'function') action();
    });
  }

  return { open, close, confirm, init };
})();

/* ---------------------------------------------------------------------- */
/* 10. APP INITIALIZATION                                                 */
/* ---------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  ensureSampleData();

  Navigation.init();
  Modals.init();
  Inventory.init();
  Sales.init();
  Backup.init();

  document.getElementById('todayDate').textContent =
    new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  Navigation.switchView('dashboard');
});