import { Hono } from 'hono';
import type { Env } from '../lib/supabase';

export const pageRoutes = new Hono<{ Bindings: Env }>();

// Login Page
pageRoutes.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تسجيل الدخول - Medicum Egypt</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center px-4">
          <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold text-blue-900 mb-2">Medicum Egypt</h1>
              <p class="text-gray-600">تسجيل الدخول أو إنشاء حساب جديد</p>
            </div>
            
            <form id="otp-form">
              <div class="mb-4">
                <label class="block text-gray-700 mb-2">رقم الهاتف</label>
                <input type="tel" id="phone" placeholder="01xxxxxxxxx" dir="ltr"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
              </div>
              
              <div class="mb-6">
                <label class="block text-gray-700 mb-2">طريقة التحقق</label>
                <select id="otp-method" class="w-full px-3 py-2 border rounded-lg">
                  <option value="sms">رسالة نصية SMS</option>
                  <option value="whatsapp">واتساب</option>
                </select>
              </div>
              
              <button type="submit" class="w-full bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition">
                إرسال رمز التحقق
              </button>
            </form>
            
            <div id="verify-form" class="hidden">
              <div class="mb-4">
                <label class="block text-gray-700 mb-2">رمز التحقق</label>
                <input type="text" id="otp-code" maxlength="6" dir="ltr"
                  class="w-full px-3 py-2 border rounded-lg text-center text-2xl tracking-widest">
              </div>
              
              <button onclick="verifyOTP()" class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
                تأكيد الدخول
              </button>
              
              <button onclick="resendOTP()" class="w-full mt-2 text-blue-600 hover:underline">
                إعادة إرسال الرمز
              </button>
            </div>
            
            <div class="mt-6 text-center">
              <a href="/" class="text-gray-600 hover:text-blue-900">
                <i class="fas fa-arrow-right ml-2"></i>
                العودة للصفحة الرئيسية
              </a>
            </div>
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          document.getElementById('otp-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('phone').value;
            const method = document.getElementById('otp-method').value;
            
            try {
              const response = await axios.post('/api/auth/request-otp', {
                identifier: phone,
                type: method === 'whatsapp' ? 'sms' : 'sms'
              });
              
              if (response.data.success) {
                document.getElementById('otp-form').classList.add('hidden');
                document.getElementById('verify-form').classList.remove('hidden');
                alert('تم إرسال رمز التحقق');
              }
            } catch (error) {
              alert('فشل إرسال رمز التحقق');
            }
          });
          
          async function verifyOTP() {
            const phone = document.getElementById('phone').value;
            const otp = document.getElementById('otp-code').value;
            
            try {
              const response = await axios.post('/api/auth/verify-otp', {
                identifier: phone,
                otp: otp
              });
              
              if (response.data.success) {
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                window.location.href = '/';
              }
            } catch (error) {
              alert('رمز التحقق غير صحيح');
            }
          }
          
          function resendOTP() {
            document.getElementById('otp-form').classList.remove('hidden');
            document.getElementById('verify-form').classList.add('hidden');
          }
        </script>
    </body>
    </html>
  `);
});

// Cart Page
pageRoutes.get('/cart', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>سلة التسوق - Medicum Egypt</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <nav class="bg-white shadow-lg sticky top-0 z-50">
          <div class="container mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
              <a href="/" class="flex items-center">
                <span class="text-2xl font-bold text-blue-900">Medicum Egypt</span>
              </a>
              <a href="/" class="text-gray-600 hover:text-blue-900">
                <i class="fas fa-home ml-2"></i> الرئيسية
              </a>
            </div>
          </div>
        </nav>
        
        <div class="container mx-auto px-4 py-8">
          <h1 class="text-3xl font-bold mb-8">سلة التسوق</h1>
          
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Cart Items -->
            <div class="lg:col-span-2">
              <div id="cart-items" class="bg-white rounded-lg shadow p-6">
                <!-- Cart items will be loaded here -->
                <div class="text-center py-8 text-gray-500">
                  <i class="fas fa-shopping-cart text-6xl mb-4"></i>
                  <p>سلة التسوق فارغة</p>
                  <a href="/" class="inline-block mt-4 bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800">
                    تسوق الآن
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Order Summary -->
            <div>
              <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-bold mb-4">ملخص الطلب</h2>
                <div class="space-y-2 mb-4">
                  <div class="flex justify-between">
                    <span>المجموع الفرعي</span>
                    <span id="subtotal">0 جنيه</span>
                  </div>
                  <div class="flex justify-between">
                    <span>رسوم التوصيل</span>
                    <span id="delivery">30 جنيه</span>
                  </div>
                  <div class="flex justify-between">
                    <span>الخصم</span>
                    <span id="discount">0 جنيه</span>
                  </div>
                </div>
                
                <div class="border-t pt-4 mb-4">
                  <div class="flex justify-between font-bold text-lg">
                    <span>المجموع الكلي</span>
                    <span id="total">0 جنيه</span>
                  </div>
                </div>
                
                <div class="mb-4">
                  <input type="text" id="coupon-code" placeholder="كود الخصم" 
                    class="w-full px-3 py-2 border rounded mb-2">
                  <button onclick="applyCoupon()" class="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300">
                    تطبيق الكود
                  </button>
                </div>
                
                <button onclick="proceedToCheckout()" 
                  class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold">
                  إتمام الشراء
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          const token = localStorage.getItem('auth_token');
          
          async function loadCart() {
            if (!token) {
              window.location.href = '/login';
              return;
            }
            
            try {
              const response = await axios.get('/api/cart', {
                headers: { Authorization: \`Bearer \${token}\` }
              });
              
              const cart = response.data;
              if (cart.items && cart.items.length > 0) {
                // Display cart items
                document.getElementById('subtotal').textContent = cart.subtotal + ' جنيه';
                document.getElementById('discount').textContent = cart.discount + ' جنيه';
                document.getElementById('total').textContent = cart.total + ' جنيه';
              }
            } catch (error) {
              console.error('Failed to load cart:', error);
            }
          }
          
          async function applyCoupon() {
            const code = document.getElementById('coupon-code').value;
            if (!code) return;
            
            try {
              const response = await axios.post('/api/cart/coupon', 
                { code },
                { headers: { Authorization: \`Bearer \${token}\` }}
              );
              
              if (response.data.success) {
                alert('تم تطبيق كود الخصم بنجاح');
                loadCart();
              }
            } catch (error) {
              alert(error.response?.data?.error || 'فشل تطبيق كود الخصم');
            }
          }
          
          function proceedToCheckout() {
            window.location.href = '/checkout';
          }
          
          loadCart();
        </script>
    </body>
    </html>
  `);
});

// Checkout Page
pageRoutes.get('/checkout', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إتمام الطلب - Medicum Egypt</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <nav class="bg-white shadow-lg sticky top-0 z-50">
          <div class="container mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
              <a href="/" class="flex items-center">
                <span class="text-2xl font-bold text-blue-900">Medicum Egypt</span>
              </a>
            </div>
          </div>
        </nav>
        
        <div class="container mx-auto px-4 py-8">
          <h1 class="text-3xl font-bold mb-8">إتمام الطلب</h1>
          
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Checkout Form -->
            <div class="lg:col-span-2">
              <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h2 class="text-xl font-bold mb-4">طريقة التوصيل</h2>
                <div class="space-y-3">
                  <label class="flex items-center">
                    <input type="radio" name="delivery" value="courier" checked class="ml-2">
                    <span>التوصيل للمنزل (30 جنيه)</span>
                  </label>
                  <label class="flex items-center">
                    <input type="radio" name="delivery" value="pickup" class="ml-2">
                    <span>الاستلام من الفرع (مجاني)</span>
                  </label>
                </div>
              </div>
              
              <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h2 class="text-xl font-bold mb-4">عنوان التوصيل</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="الاسم الكامل" class="px-3 py-2 border rounded">
                  <input type="tel" placeholder="رقم الهاتف" class="px-3 py-2 border rounded">
                  <input type="text" placeholder="الشارع" class="px-3 py-2 border rounded">
                  <input type="text" placeholder="رقم المبنى" class="px-3 py-2 border rounded">
                  <input type="text" placeholder="الدور" class="px-3 py-2 border rounded">
                  <input type="text" placeholder="الشقة" class="px-3 py-2 border rounded">
                  <select class="px-3 py-2 border rounded">
                    <option>القاهرة</option>
                    <option>الجيزة</option>
                  </select>
                  <select class="px-3 py-2 border rounded">
                    <option>مدينة نصر</option>
                    <option>المعادي</option>
                    <option>الدقي</option>
                    <option>6 أكتوبر</option>
                  </select>
                </div>
              </div>
              
              <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-bold mb-4">طريقة الدفع</h2>
                <div class="space-y-3">
                  <label class="flex items-center">
                    <input type="radio" name="payment" value="cod" checked class="ml-2">
                    <span>الدفع عند الاستلام</span>
                  </label>
                  <label class="flex items-center">
                    <input type="radio" name="payment" value="fawry" class="ml-2">
                    <span>فوري</span>
                  </label>
                  <label class="flex items-center">
                    <input type="radio" name="payment" value="card" class="ml-2">
                    <span>بطاقة ائتمان</span>
                  </label>
                  <label class="flex items-center">
                    <input type="radio" name="payment" value="wallet" class="ml-2">
                    <span>محفظة إلكترونية</span>
                  </label>
                </div>
              </div>
            </div>
            
            <!-- Order Summary -->
            <div>
              <div class="bg-white rounded-lg shadow p-6 sticky top-24">
                <h2 class="text-xl font-bold mb-4">ملخص الطلب</h2>
                <div id="order-summary">
                  <!-- Order items will be displayed here -->
                </div>
                <div class="border-t pt-4 mt-4">
                  <div class="flex justify-between font-bold text-lg">
                    <span>المجموع</span>
                    <span id="order-total">0 جنيه</span>
                  </div>
                </div>
                <button onclick="placeOrder()" class="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold">
                  تأكيد الطلب
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          async function placeOrder() {
            const token = localStorage.getItem('auth_token');
            if (!token) {
              window.location.href = '/login';
              return;
            }
            
            alert('سيتم تأكيد طلبك قريباً');
            window.location.href = '/';
          }
        </script>
    </body>
    </html>
  `);
});