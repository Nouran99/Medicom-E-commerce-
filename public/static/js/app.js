// Medicum Egypt - Main Application JavaScript

// Language translations
const translations = {
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.products': 'المنتجات',
    'nav.cart': 'السلة',
    'nav.login': 'تسجيل الدخول',
    'nav.language': 'EN',
    
    // Hero Section
    'hero.title': 'متجرك الطبي الموثوق',
    'hero.subtitle': 'احصل على جميع احتياجاتك الطبية بأفضل الأسعار مع توصيل سريع',
    'hero.searchPlaceholder': 'ابحث عن المنتجات الطبية...',
    
    // Categories
    'section.categories': 'الفئات الرئيسية',
    'section.featured': 'المنتجات المميزة',
    
    // Features
    'feature.delivery.title': 'توصيل سريع',
    'feature.delivery.desc': 'توصيل خلال 24-48 ساعة في القاهرة والجيزة',
    'feature.authentic.title': 'منتجات أصلية',
    'feature.authentic.desc': 'جميع المنتجات أصلية 100% ومعتمدة',
    'feature.support.title': 'دعم متواصل',
    'feature.support.desc': 'فريق دعم متاح على مدار الساعة',
    
    // Buttons
    'btn.addToCart': 'أضف للسلة',
    'btn.buyNow': 'اشتر الآن',
    'btn.viewDetails': 'عرض التفاصيل',
    
    // Cart
    'cart.empty': 'السلة فارغة',
    'cart.total': 'المجموع',
    'cart.checkout': 'إتمام الشراء',
    
    // Products
    'product.prescription': 'يتطلب روشتة',
    'product.inStock': 'متوفر',
    'product.outOfStock': 'غير متوفر',
    'product.price': 'جنيه'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.cart': 'Cart',
    'nav.login': 'Login',
    'nav.language': 'عربي',
    
    // Hero Section
    'hero.title': 'Your Trusted Medical Store',
    'hero.subtitle': 'Get all your medical needs at the best prices with fast delivery',
    'hero.searchPlaceholder': 'Search for medical products...',
    
    // Categories
    'section.categories': 'Main Categories',
    'section.featured': 'Featured Products',
    
    // Features
    'feature.delivery.title': 'Fast Delivery',
    'feature.delivery.desc': 'Delivery within 24-48 hours in Cairo and Giza',
    'feature.authentic.title': 'Original Products',
    'feature.authentic.desc': 'All products are 100% original and certified',
    'feature.support.title': 'Continuous Support',
    'feature.support.desc': '24/7 support team available',
    
    // Buttons
    'btn.addToCart': 'Add to Cart',
    'btn.buyNow': 'Buy Now',
    'btn.viewDetails': 'View Details',
    
    // Cart
    'cart.empty': 'Cart is empty',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    
    // Products
    'product.prescription': 'Prescription Required',
    'product.inStock': 'In Stock',
    'product.outOfStock': 'Out of Stock',
    'product.price': 'EGP'
  }
};

// Current language
let currentLanguage = localStorage.getItem('language') || 'ar';
let cart = [];
let user = null;

// Initialize language
function initializeLanguage() {
  document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLanguage;
  updateUILanguage();
}

// Update UI with translations
function updateUILanguage() {
  // Update all elements with data-translate attribute
  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate');
    const translation = translations[currentLanguage][key];
    if (translation) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    }
  });
  
  // Update language button
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.innerHTML = `<i class="fas fa-language text-xl"></i> ${translations[currentLanguage]['nav.language']}`;
  }
  
  // Reload dynamic content
  if (typeof loadCategories === 'function') loadCategories();
  if (typeof loadProducts === 'function') loadProducts();
}

// Toggle language
function toggleLanguage() {
  currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
  localStorage.setItem('language', currentLanguage);
  initializeLanguage();
  
  // Show notification
  const message = currentLanguage === 'ar' ? 'تم التغيير إلى العربية' : 'Changed to English';
  showNotification(message);
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Load categories with proper language
async function loadCategories() {
  try {
    const response = await axios.get('/api/products/categories');
    const categories = response.data;
    const grid = document.getElementById('categories-grid');
    
    if (grid) {
      grid.innerHTML = categories.map(cat => `
        <div class="text-center cursor-pointer hover:transform hover:scale-105 transition" onclick="filterByCategory('${cat.id}')">
          <div class="bg-white rounded-lg p-4 shadow-md mb-2">
            <i class="fas fa-pills text-3xl text-blue-900"></i>
          </div>
          <p class="text-sm font-medium">${currentLanguage === 'ar' ? cat.name_ar : cat.name_en}</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

// Load featured products with proper language
async function loadProducts() {
  try {
    const response = await axios.get(`/api/products?limit=10&lang=${currentLanguage}`);
    const products = response.data.products;
    const grid = document.getElementById('products-grid');
    
    if (grid) {
      grid.innerHTML = products.map(product => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
          <div class="h-48 bg-gray-200 flex items-center justify-center">
            <i class="fas fa-pills text-6xl text-gray-400"></i>
          </div>
          <div class="p-4">
            <h3 class="font-bold text-sm mb-2">${currentLanguage === 'ar' ? product.name_ar : product.name_en}</h3>
            <div class="flex justify-between items-center mb-3">
              <span class="text-2xl font-bold text-blue-900">
                ${product.price} ${translations[currentLanguage]['product.price']}
              </span>
              ${product.prescription_required ? 
                `<span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                  ${translations[currentLanguage]['product.prescription']}
                </span>` : ''}
            </div>
            <button onclick="addToCart('${product.id}')" class="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800 transition">
              <i class="fas fa-cart-plus"></i> ${translations[currentLanguage]['btn.addToCart']}
            </button>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load products:', error);
    // Show placeholder if no products
    if (document.getElementById('products-grid')) {
      document.getElementById('products-grid').innerHTML = `
        <div class="col-span-full text-center py-8 text-gray-500">
          <i class="fas fa-box-open text-6xl mb-4"></i>
          <p>${currentLanguage === 'ar' ? 'لا توجد منتجات' : 'No products available'}</p>
        </div>
      `;
    }
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
      { headers: { Authorization: `Bearer ${token}` }}
    );
    
    updateCartCount();
    showNotification(
      currentLanguage === 'ar' ? 'تمت الإضافة إلى السلة بنجاح!' : 'Added to cart successfully!'
    );
  } catch (error) {
    console.error('Failed to add to cart:', error);
    showNotification(
      currentLanguage === 'ar' ? 'فشل إضافة المنتج' : 'Failed to add product',
      'error'
    );
  }
}

// Update cart count
async function updateCartCount() {
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const response = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const itemCount = response.data.items?.length || 0;
      const cartBadge = document.getElementById('cart-count');
      if (cartBadge) {
        cartBadge.textContent = itemCount;
      }
    }
  } catch (error) {
    console.error('Failed to update cart count:', error);
  }
}

// Search products
async function searchProducts() {
  const query = document.getElementById('search-input').value;
  if (query.trim()) {
    window.location.href = `/search?q=${encodeURIComponent(query)}&lang=${currentLanguage}`;
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
  window.location.href = `/products?category=${categoryId}&lang=${currentLanguage}`;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initializeLanguage();
  loadCategories();
  loadProducts();
  updateCartCount();
  
  // Add enter key support for search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchProducts();
      }
    });
  }
});