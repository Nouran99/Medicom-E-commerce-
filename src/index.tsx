import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import { authRoutes } from './routes/auth';
import { productsRoutes } from './routes/products';
import { cartRoutes } from './routes/cart';
import { ordersRoutes } from './routes/orders';
import { adminRoutes } from './routes/admin';
import { prescriptionRoutes } from './routes/prescriptions';
import { paymentRoutes } from './routes/payment';
import { notificationRoutes } from './routes/notifications';
import { pageRoutes } from './routes/pages';
import { importRoutes } from './routes/import';
import { productsEnhancedRoutes } from './routes/products-enhanced';
import productManagementRoutes from './routes/products-management';
import type { Env } from './lib/supabase';

const app = new Hono<{ Bindings: Env }>();

// Restrict cross-origin API access to explicitly configured clients.
const defaultAllowedOrigins = 'http://localhost:3000,http://localhost:5173';
app.use('/api/*', cors({
  origin: (origin, c) => {
    const configuredOrigins = c.env.ALLOWED_ORIGINS || defaultAllowedOrigins;
    const allowedOrigins = configuredOrigins.split(',').map((value: string) => value.trim());
    return allowedOrigins.includes(origin) ? origin : undefined;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));
app.use('/images/*', serveStatic({ root: './public' }));

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/products', productsRoutes);
app.route('/api/products-enhanced', productsEnhancedRoutes);
app.route('/api/cart', cartRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/prescriptions', prescriptionRoutes);
app.route('/api/payment', paymentRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/admin/import', importRoutes); // Scope privileged import routes to their admin API prefix
app.route('', productManagementRoutes); // Mount product management routes at root level

// Page routes
app.route('', pageRoutes);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'medicom-egypt',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
    mode: c.env.DEMO_MODE === 'true' ? 'demo' : 'live',
  });
});

// Main HTML route - E-commerce website
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Medicum Egypt - Your Trusted Medical Store</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          [dir="rtl"] .ltr-only { display: none; }
          [dir="ltr"] .rtl-only { display: none; }
        </style>
    </head>
    <body class="bg-gray-50">
        <aside id="demo-mode-banner" class="hidden bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-3 text-center text-sm" role="status">
          <strong>Portfolio demo:</strong> this experience uses a curated local catalog and browser-only cart. Connect Supabase and set <code>DEMO_MODE=false</code> to use live data.
        </aside>
        <!-- Header -->
        <nav class="bg-white shadow-lg sticky top-0 z-50">
          <div class="container mx-auto px-4">
            <div class="flex justify-between items-center py-4">
              <!-- Logo -->
              <div class="flex items-center">
                <img src="/static/images/logo.svg" alt="Medicum Egypt" class="h-12 w-auto">
                <span class="mr-3 text-2xl font-bold text-blue-900">Medicum Egypt</span>
              </div>
              
              <!-- Navigation Items -->
              <div class="flex items-center space-x-6 space-x-reverse">
                <button id="lang-toggle" onclick="toggleLanguage()" class="text-gray-700 hover:text-blue-900">
                  <i class="fas fa-language text-xl"></i> <span data-translate="nav.language">EN</span>
                </button>
                <button onclick="openCart()" class="relative text-gray-700 hover:text-blue-900">
                  <i class="fas fa-shopping-cart text-xl"></i>
                  <span id="cart-count" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">0</span>
                </button>
                <button onclick="openAuth()" class="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
                  <i class="fas fa-user"></i> <span data-translate="nav.login">تسجيل الدخول</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <!-- Hero Section -->
        <section class="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-20">
          <div class="container mx-auto px-4 text-center">
            <h1 class="text-5xl font-bold mb-6" data-translate="hero.title">متجرك الطبي الموثوق</h1>
            <p class="text-xl mb-8" data-translate="hero.subtitle">احصل على جميع احتياجاتك الطبية بأفضل الأسعار مع توصيل سريع</p>
            
            <!-- Search Bar -->
            <div class="max-w-2xl mx-auto">
              <div class="relative">
                <input type="text" id="search-input" placeholder="ابحث عن المنتجات الطبية..." 
                  class="w-full px-6 py-4 rounded-full text-gray-800 text-lg pr-14">
                <button onclick="searchProducts()" class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-blue-900 text-white px-6 py-2 rounded-full hover:bg-blue-800">
                  <i class="fas fa-search"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Categories Section -->
        <section class="py-12">
          <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center">الفئات الرئيسية</h2>
            <div id="categories-grid" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <!-- Categories will be loaded here -->
            </div>
          </div>
        </section>

        <!-- Featured Products -->
        <section class="py-12 bg-white">
          <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center">المنتجات المميزة</h2>
            <div id="products-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <!-- Products will be loaded here -->
            </div>
          </div>
        </section>

        <!-- Features Section -->
        <section class="py-12">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="text-center">
                <div class="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-truck text-3xl text-blue-900"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">توصيل سريع</h3>
                <p class="text-gray-600">توصيل خلال 24-48 ساعة في القاهرة والجيزة</p>
              </div>
              <div class="text-center">
                <div class="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-shield-alt text-3xl text-green-900"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">منتجات أصلية</h3>
                <p class="text-gray-600">جميع المنتجات أصلية 100% ومعتمدة</p>
              </div>
              <div class="text-center">
                <div class="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-headset text-3xl text-purple-900"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">دعم متواصل</h3>
                <p class="text-gray-600">فريق دعم متاح على مدار الساعة</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-white py-12">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h4 class="text-xl font-bold mb-4">Medicum Egypt</h4>
                <p class="text-gray-400">متجرك الطبي الموثوق لجميع احتياجاتك الصحية</p>
              </div>
              <div>
                <h4 class="text-xl font-bold mb-4">روابط سريعة</h4>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-400 hover:text-white">عن الشركة</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">اتصل بنا</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">سياسة الخصوصية</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">الشروط والأحكام</a></li>
                </ul>
              </div>
              <div>
                <h4 class="text-xl font-bold mb-4">خدمة العملاء</h4>
                <ul class="space-y-2">
                  <li><a href="#" class="text-gray-400 hover:text-white">سياسة الإرجاع</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">طرق الدفع</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">التوصيل والشحن</a></li>
                  <li><a href="#" class="text-gray-400 hover:text-white">الأسئلة الشائعة</a></li>
                </ul>
              </div>
              <div>
                <h4 class="text-xl font-bold mb-4">تابعنا</h4>
                <div class="flex space-x-4 space-x-reverse">
                  <a href="#" class="text-gray-400 hover:text-white text-2xl"><i class="fab fa-facebook"></i></a>
                  <a href="#" class="text-gray-400 hover:text-white text-2xl"><i class="fab fa-instagram"></i></a>
                  <a href="#" class="text-gray-400 hover:text-white text-2xl"><i class="fab fa-twitter"></i></a>
                  <a href="#" class="text-gray-400 hover:text-white text-2xl"><i class="fab fa-whatsapp"></i></a>
                </div>
              </div>
            </div>
            <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 Medicum Egypt. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </footer>

        <!-- Modals and Scripts -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/js/app.js"></script>
        <script>
          // Initialize app
          let currentLanguage = 'ar';
          let cart = [];
          let user = null;

          // Load categories
          async function loadCategories() {
            try {
              const response = await axios.get('/api/products/categories');
              const categories = response.data;
              const grid = document.getElementById('categories-grid');
              
              grid.innerHTML = categories.map(cat => \`
                <div class="text-center cursor-pointer hover:transform hover:scale-105 transition" onclick="filterByCategory('\${cat.id}')">
                  <div class="bg-white rounded-lg p-4 shadow-md mb-2">
                    <i class="fas fa-pills text-3xl text-blue-900"></i>
                  </div>
                  <p class="text-sm font-medium">\${currentLanguage === 'ar' ? cat.name_ar : cat.name_en}</p>
                </div>
              \`).join('');
            } catch (error) {
              console.error('Failed to load categories:', error);
            }
          }

          // Load featured products
          async function loadProducts() {
            try {
              const response = await axios.get('/api/products?limit=10');
              const products = response.data.products;
              const grid = document.getElementById('products-grid');
              
              grid.innerHTML = products.map(product => \`
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
                  <div class="h-48 bg-gray-200 flex items-center justify-center">
                    <i class="fas fa-pills text-6xl text-gray-400"></i>
                  </div>
                  <div class="p-4">
                    <h3 class="font-bold text-sm mb-2">\${currentLanguage === 'ar' ? product.name_ar : product.name_en}</h3>
                    <div class="flex justify-between items-center mb-3">
                      <span class="text-2xl font-bold text-blue-900">\${product.price} جنيه</span>
                      \${product.prescription_required ? '<span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">يتطلب روشتة</span>' : ''}
                    </div>
                    <button onclick="addToCart('\${product.id}')" class="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800 transition">
                      <i class="fas fa-cart-plus"></i> أضف للسلة
                    </button>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('Failed to load products:', error);
            }
          }

          // Toggle language
          function toggleLanguage() {
            currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
            document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = currentLanguage;
            loadCategories();
            loadProducts();
          }

          // Search products
          async function searchProducts() {
            const query = document.getElementById('search-input').value;
            if (query.trim()) {
              window.location.href = \`/search?q=\${encodeURIComponent(query)}\`;
            }
          }

          // Add to cart
          async function addToCart(productId) {
            try {
              const token = localStorage.getItem('auth_token');
              if (!token) {
                openAuth();
                return;
              }
              
              await axios.post('/api/cart/add', 
                { product_id: productId, quantity: 1 },
                { headers: { Authorization: \`Bearer \${token}\` }}
              );
              
              updateCartCount();
              alert('تمت الإضافة إلى السلة بنجاح!');
            } catch (error) {
              console.error('Failed to add to cart:', error);
            }
          }

          // Update cart count
          async function updateCartCount() {
            try {
              const token = localStorage.getItem('auth_token');
              if (token) {
                const response = await axios.get('/api/cart', {
                  headers: { Authorization: \`Bearer \${token}\` }
                });
                const itemCount = response.data.items?.length || 0;
                document.getElementById('cart-count').textContent = itemCount;
              }
            } catch (error) {
              console.error('Failed to update cart count:', error);
            }
          }

          // Open auth modal
          function openAuth() {
            window.location.href = '/login';
          }

          // Open cart
          function openCart() {
            window.location.href = '/cart';
          }

          // Filter by category
          function filterByCategory(categoryId) {
            window.location.href = \`/products?category=\${categoryId}\`;
          }

          // Initialize on load
          document.addEventListener('DOMContentLoaded', () => {
            loadCategories();
            loadProducts();
            updateCartCount();
          });
        </script>
    </body>
    </html>
  `);
});

// Admin Dashboard
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Medicum Egypt - Admin Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div id="admin-app">
          <!-- Admin dashboard will be loaded here -->
          <div class="min-h-screen flex items-center justify-center">
            <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <h1 class="text-2xl font-bold mb-6 text-center">Admin Login</h1>
              <form id="admin-login-form">
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
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/js/admin.js"></script>
    </body>
    </html>
  `);
});

export default app;