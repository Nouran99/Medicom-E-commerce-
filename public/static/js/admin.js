// Admin Dashboard JavaScript
let adminToken = localStorage.getItem('admin_token');
let currentView = 'dashboard';

// Check if admin is logged in
if (adminToken) {
  loadAdminDashboard();
} else {
  showLoginForm();
}

function showLoginForm() {
  document.getElementById('admin-app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 class="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <form id="admin-login-form" onsubmit="handleAdminLogin(event)">
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Email</label>
            <input type="email" id="admin-email" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Password</label>
            <input type="password" id="admin-password" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" required>
          </div>
          <button type="submit" class="w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800">
            Login
          </button>
        </form>
      </div>
    </div>
  `;
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  
  try {
    const response = await axios.post('/api/admin/login', { email, password });
    if (response.data.success) {
      adminToken = response.data.token;
      localStorage.setItem('admin_token', adminToken);
      loadAdminDashboard();
    }
  } catch (error) {
    alert('Login failed: ' + (error.response?.data?.error || 'Invalid credentials'));
  }
}

async function loadAdminDashboard() {
  // Load dashboard stats
  try {
    const stats = await axios.get('/api/admin/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    document.getElementById('admin-app').innerHTML = `
      <div class="min-h-screen bg-gray-100">
        <!-- Admin Header -->
        <nav class="bg-blue-900 text-white p-4">
          <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold">Medicum Egypt Admin</h1>
            <div class="flex gap-4">
              <button onclick="setView('dashboard')" class="hover:bg-blue-800 px-4 py-2 rounded">Dashboard</button>
              <button onclick="setView('products')" class="hover:bg-blue-800 px-4 py-2 rounded">Products</button>
              <button onclick="setView('orders')" class="hover:bg-blue-800 px-4 py-2 rounded">Orders</button>
              <button onclick="setView('prescriptions')" class="hover:bg-blue-800 px-4 py-2 rounded">Prescriptions</button>
              <button onclick="setView('import')" class="hover:bg-blue-800 px-4 py-2 rounded">Import Data</button>
              <button onclick="logout()" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Logout</button>
            </div>
          </div>
        </nav>
        
        <!-- Main Content -->
        <div class="container mx-auto p-6">
          <div id="admin-content">
            <!-- Dashboard Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-gray-500 text-sm">Total Orders</h3>
                <p class="text-3xl font-bold text-blue-900">${stats.data.totalOrders || 0}</p>
              </div>
              <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-gray-500 text-sm">Total Products</h3>
                <p class="text-3xl font-bold text-green-600">${stats.data.totalProducts || 0}</p>
              </div>
              <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-gray-500 text-sm">Total Users</h3>
                <p class="text-3xl font-bold text-purple-600">${stats.data.totalUsers || 0}</p>
              </div>
              <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-gray-500 text-sm">Total Revenue</h3>
                <p class="text-3xl font-bold text-red-600">${stats.data.totalRevenue || 0} EGP</p>
              </div>
            </div>
            
            <!-- Dynamic Content Area -->
            <div id="view-content" class="bg-white rounded-lg shadow p-6">
              <h2 class="text-2xl font-bold mb-4">Welcome to Admin Dashboard</h2>
              <p>Select an option from the menu to manage your store.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      showLoginForm();
    }
  }
}

async function setView(view) {
  currentView = view;
  const contentDiv = document.getElementById('view-content');
  
  switch(view) {
    case 'dashboard':
      contentDiv.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">Dashboard Overview</h2>
        <p>Welcome to the Medicum Egypt admin dashboard.</p>
      `;
      break;
      
    case 'products':
      await loadProducts();
      break;
      
    case 'orders':
      await loadOrders();
      break;
      
    case 'prescriptions':
      await loadPrescriptions();
      break;
      
    case 'import':
      showImportForm();
      break;
  }
}

async function loadProducts() {
  try {
    const response = await axios.get('/api/admin/products', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const products = response.data.products || [];
    
    document.getElementById('view-content').innerHTML = `
      <div>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">Products Management</h2>
          <button onclick="showAddProductForm()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            <i class="fas fa-plus"></i> Add Product
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-100">
                <th class="border p-2 text-left">SKU</th>
                <th class="border p-2 text-left">Name (EN)</th>
                <th class="border p-2 text-left">Name (AR)</th>
                <th class="border p-2 text-left">Price</th>
                <th class="border p-2 text-left">Stock</th>
                <th class="border p-2 text-left">Prescription</th>
                <th class="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(product => `
                <tr>
                  <td class="border p-2">${product.sku}</td>
                  <td class="border p-2">${product.name_en}</td>
                  <td class="border p-2">${product.name_ar}</td>
                  <td class="border p-2">${product.price} EGP</td>
                  <td class="border p-2">${product.quantity}</td>
                  <td class="border p-2">${product.prescription_required ? 'Yes' : 'No'}</td>
                  <td class="border p-2">
                    <button class="text-blue-600 hover:underline mr-2">Edit</button>
                    <button class="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}

async function loadOrders() {
  try {
    const response = await axios.get('/api/admin/orders', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const orders = response.data.orders || [];
    
    document.getElementById('view-content').innerHTML = `
      <div>
        <h2 class="text-2xl font-bold mb-4">Orders Management</h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-100">
                <th class="border p-2 text-left">Order #</th>
                <th class="border p-2 text-left">Customer</th>
                <th class="border p-2 text-left">Total</th>
                <th class="border p-2 text-left">Status</th>
                <th class="border p-2 text-left">Payment</th>
                <th class="border p-2 text-left">Date</th>
                <th class="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => `
                <tr>
                  <td class="border p-2">${order.order_number}</td>
                  <td class="border p-2">${order.users?.name || 'N/A'}</td>
                  <td class="border p-2">${order.total} EGP</td>
                  <td class="border p-2">
                    <span class="px-2 py-1 rounded text-xs ${getStatusColor(order.status)}">
                      ${order.status}
                    </span>
                  </td>
                  <td class="border p-2">${order.payment_method}</td>
                  <td class="border p-2">${new Date(order.created_at).toLocaleDateString()}</td>
                  <td class="border p-2">
                    <select onchange="updateOrderStatus('${order.id}', this.value)" class="border rounded px-2 py-1">
                      <option value="">Update Status</option>
                      <option value="confirmed">Confirm</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancel</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
}

async function loadPrescriptions() {
  document.getElementById('view-content').innerHTML = `
    <div>
      <h2 class="text-2xl font-bold mb-4">Prescription Review Queue</h2>
      <p class="text-gray-600">Prescriptions requiring review will appear here.</p>
      <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p class="text-yellow-800">No prescriptions pending review.</p>
      </div>
    </div>
  `;
}

function showImportForm() {
  document.getElementById('view-content').innerHTML = `
    <div>
      <h2 class="text-2xl font-bold mb-4">Import Products</h2>
      <div class="max-w-md">
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">Import Method</label>
          <select id="import-method" class="w-full border rounded px-3 py-2" onchange="toggleImportMethod(this.value)">
            <option value="manual">Manual Entry</option>
            <option value="excel">Excel/CSV Upload</option>
          </select>
        </div>
        
        <div id="manual-import" class="space-y-4">
          <input type="text" placeholder="SKU" class="w-full border rounded px-3 py-2">
          <input type="text" placeholder="Product Name (English)" class="w-full border rounded px-3 py-2">
          <input type="text" placeholder="Product Name (Arabic)" class="w-full border rounded px-3 py-2">
          <input type="number" placeholder="Price (EGP)" class="w-full border rounded px-3 py-2">
          <input type="number" placeholder="Quantity" class="w-full border rounded px-3 py-2">
          <label class="flex items-center">
            <input type="checkbox" class="mr-2"> Prescription Required
          </label>
          <button class="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 w-full">
            Add Product
          </button>
        </div>
        
        <div id="excel-import" class="hidden">
          <input type="file" accept=".xlsx,.xls,.csv" class="w-full border rounded px-3 py-2">
          <button class="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 w-full mt-4">
            Upload and Import
          </button>
          <p class="text-sm text-gray-600 mt-2">
            Download <a href="#" class="text-blue-600 hover:underline">template file</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

function toggleImportMethod(method) {
  document.getElementById('manual-import').style.display = method === 'manual' ? 'block' : 'none';
  document.getElementById('excel-import').style.display = method === 'excel' ? 'block' : 'none';
}

function showAddProductForm() {
  // Product add form implementation
  alert('Product form will open here');
}

async function updateOrderStatus(orderId, status) {
  if (!status) return;
  
  try {
    await axios.put(`/api/admin/orders/${orderId}/status`, 
      { status },
      { headers: { Authorization: `Bearer ${adminToken}` }}
    );
    loadOrders(); // Reload orders
  } catch (error) {
    alert('Failed to update order status');
  }
}

function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function logout() {
  localStorage.removeItem('admin_token');
  adminToken = null;
  showLoginForm();
}