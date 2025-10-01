// Enhanced Product Detail Page JavaScript

function loadProductDetail(productCode) {
  const lang = localStorage.getItem('language') || 'ar';
  
  // Fetch product details
  axios.get(`/api/products-enhanced/${productCode}`)
    .then(response => {
      const { product, relatedProducts, sellerReviews } = response.data;
      renderProductDetail(product, lang);
      renderRelatedProducts(relatedProducts, lang);
      renderSellerInfo(product.seller, sellerReviews, lang);
    })
    .catch(error => {
      console.error('Failed to load product:', error);
    });
}

function renderProductDetail(product, lang) {
  const container = document.getElementById('product-detail');
  if (!container) return;
  
  const isArabic = lang === 'ar';
  const name = isArabic ? product.name_ar : product.name_en;
  const instructions = isArabic ? product.usage_instructions_ar : product.usage_instructions_en;
  const warnings = isArabic ? product.warnings_ar : product.warnings_en;
  
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Product Images Gallery -->
      <div>
        <div class="bg-white rounded-lg shadow p-4">
          <!-- Main Image -->
          <div class="mb-4">
            <img id="main-image" src="${product.product_images[0]?.url || '/static/images/placeholder.jpg'}" 
                 alt="${product.product_images[0]?.alt_text || name}" 
                 class="w-full h-96 object-contain">
          </div>
          
          <!-- Thumbnail Gallery -->
          <div class="grid grid-cols-5 gap-2">
            ${product.product_images.map((img, index) => `
              <img src="${img.url}" 
                   alt="${img.alt_text}" 
                   onclick="changeMainImage('${img.url}')"
                   class="h-20 object-contain border-2 ${index === 0 ? 'border-blue-500' : 'border-gray-200'} cursor-pointer hover:border-blue-500">
            `).join('')}
          </div>
        </div>
        
        <!-- Stock Alert -->
        ${product.quantity_available <= product.stock_alert_level ? `
          <div class="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p class="text-yellow-800">
              <i class="fas fa-exclamation-triangle"></i>
              ${isArabic ? 'كمية محدودة متبقية!' : 'Limited quantity remaining!'}
            </p>
          </div>
        ` : ''}
      </div>
      
      <!-- Product Information -->
      <div>
        <h1 class="text-3xl font-bold mb-2">${name}</h1>
        
        <!-- Product Code & Seller -->
        <div class="flex items-center gap-4 mb-4 text-gray-600">
          <span><i class="fas fa-barcode"></i> ${product.product_code}</span>
          <a href="/seller/${product.seller.seller_code}" class="text-blue-600 hover:underline">
            <i class="fas fa-store"></i> ${isArabic ? product.seller.name_ar : product.seller.name_en}
            ${product.seller.verified ? '<i class="fas fa-check-circle text-green-500"></i>' : ''}
          </a>
        </div>
        
        <!-- Price Section -->
        <div class="bg-gray-50 p-4 rounded mb-4">
          <div class="text-3xl font-bold text-blue-900">
            ${product.price_per_unit} ${isArabic ? 'جنيه' : 'EGP'}
            <span class="text-sm text-gray-600">/ ${product.unit_item}</span>
          </div>
          ${product.promotion_text ? `
            <span class="inline-block mt-2 bg-red-100 text-red-600 px-3 py-1 rounded">
              ${product.promotion_text}
            </span>
          ` : ''}
        </div>
        
        <!-- Key Information Pills -->
        <div class="flex flex-wrap gap-2 mb-4">
          ${product.prescription_required ? `
            <span class="bg-red-100 text-red-700 px-3 py-1 rounded">
              <i class="fas fa-prescription"></i> ${isArabic ? 'يتطلب وصفة طبية' : 'Prescription Required'}
            </span>
          ` : ''}
          
          ${product.in_stock ? `
            <span class="bg-green-100 text-green-700 px-3 py-1 rounded">
              <i class="fas fa-check"></i> ${isArabic ? 'متوفر' : 'In Stock'} (${product.quantity_available})
            </span>
          ` : `
            <span class="bg-red-100 text-red-700 px-3 py-1 rounded">
              <i class="fas fa-times"></i> ${isArabic ? 'غير متوفر' : 'Out of Stock'}
            </span>
          `}
        </div>
        
        <!-- Active Ingredient -->
        ${product.active_ingredient ? `
          <div class="mb-4">
            <h3 class="font-bold mb-2">${isArabic ? 'المادة الفعالة' : 'Active Ingredient'}</h3>
            <p class="text-gray-700">${product.active_ingredient}</p>
          </div>
        ` : ''}
        
        <!-- Delivery Information -->
        <div class="border-t pt-4 mb-4">
          <h3 class="font-bold mb-2">
            <i class="fas fa-truck"></i> ${isArabic ? 'معلومات التوصيل' : 'Delivery Information'}
          </h3>
          <ul class="space-y-2 text-gray-700">
            <li>
              <i class="fas fa-calendar"></i> 
              ${isArabic ? 'التوصيل خلال' : 'Delivery in'} ${product.delivery_days_min}-${product.delivery_days_max} 
              ${isArabic ? 'أيام' : 'days'}
            </li>
            <li>
              <i class="fas fa-box"></i> 
              ${isArabic ? 'الحد الأدنى للطلب' : 'Minimum Order'}: ${product.minimum_quantity} ${product.unit_item}
            </li>
            <li>
              <i class="fas fa-shipping-fast"></i> 
              ${product.delivery_method.includes('courier') ? (isArabic ? 'توصيل للمنزل' : 'Home Delivery') : ''}
              ${product.delivery_method.includes('pickup') ? (isArabic ? 'استلام من المتجر' : 'Store Pickup') : ''}
            </li>
            ${product.free_delivery_threshold ? `
              <li class="text-green-600">
                <i class="fas fa-gift"></i> 
                ${isArabic ? 'توصيل مجاني للطلبات أكثر من' : 'Free delivery on orders above'} 
                ${product.free_delivery_threshold} ${isArabic ? 'جنيه' : 'EGP'}
              </li>
            ` : ''}
          </ul>
        </div>
        
        <!-- Add to Cart Section -->
        <div class="flex items-center gap-4 mb-6">
          <div class="flex items-center border rounded">
            <button onclick="decreaseQuantity()" class="px-3 py-2 hover:bg-gray-100">
              <i class="fas fa-minus"></i>
            </button>
            <input type="number" id="quantity" value="${product.minimum_quantity}" 
                   min="${product.minimum_quantity}" 
                   max="${product.maximum_quantity || 999}"
                   class="w-20 text-center border-x py-2">
            <button onclick="increaseQuantity()" class="px-3 py-2 hover:bg-gray-100">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          
          <button onclick="addToCart('${product.id}')" 
                  class="flex-1 bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 font-bold"
                  ${!product.in_stock ? 'disabled' : ''}>
            <i class="fas fa-cart-plus"></i> 
            ${isArabic ? 'أضف إلى السلة' : 'Add to Cart'}
          </button>
        </div>
        
        <!-- Product Tabs -->
        <div class="border-t pt-4">
          <div class="flex gap-4 border-b mb-4">
            <button onclick="showTab('specs')" class="tab-btn active pb-2 px-4">
              ${isArabic ? 'المواصفات' : 'Specifications'}
            </button>
            <button onclick="showTab('usage')" class="tab-btn pb-2 px-4">
              ${isArabic ? 'طريقة الاستخدام' : 'Usage Instructions'}
            </button>
            <button onclick="showTab('side-effects')" class="tab-btn pb-2 px-4">
              ${isArabic ? 'الآثار الجانبية' : 'Side Effects'}
            </button>
            <button onclick="showTab('questions')" class="tab-btn pb-2 px-4">
              ${isArabic ? 'الأسئلة' : 'Questions'} (${product.questions?.length || 0})
            </button>
          </div>
          
          <!-- Tab Content -->
          <div id="tab-content">
            <!-- Specifications Tab -->
            <div id="specs-tab" class="tab-content">
              <table class="w-full">
                ${Object.entries(product.product_specs || {}).map(([key, value]) => `
                  <tr class="border-b">
                    <td class="py-2 font-semibold">${key}</td>
                    <td class="py-2">${value}</td>
                  </tr>
                `).join('')}
                ${product.manufacturer ? `
                  <tr class="border-b">
                    <td class="py-2 font-semibold">${isArabic ? 'الشركة المصنعة' : 'Manufacturer'}</td>
                    <td class="py-2">${product.manufacturer}</td>
                  </tr>
                ` : ''}
                ${product.country_of_origin ? `
                  <tr class="border-b">
                    <td class="py-2 font-semibold">${isArabic ? 'بلد المنشأ' : 'Country of Origin'}</td>
                    <td class="py-2">${product.country_of_origin}</td>
                  </tr>
                ` : ''}
              </table>
            </div>
            
            <!-- Usage Tab -->
            <div id="usage-tab" class="tab-content hidden">
              <p>${instructions || (isArabic ? 'لا توجد تعليمات متاحة' : 'No instructions available')}</p>
              ${warnings ? `
                <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <h4 class="font-bold mb-2">${isArabic ? 'تحذيرات' : 'Warnings'}</h4>
                  <p>${warnings}</p>
                </div>
              ` : ''}
            </div>
            
            <!-- Side Effects Tab -->
            <div id="side-effects-tab" class="tab-content hidden">
              <p>${product.side_effects || (isArabic ? 'لا توجد آثار جانبية مسجلة' : 'No side effects recorded')}</p>
            </div>
            
            <!-- Questions Tab -->
            <div id="questions-tab" class="tab-content hidden">
              ${renderQuestions(product.questions, isArabic)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderQuestions(questions, isArabic) {
  if (!questions || questions.length === 0) {
    return `
      <p class="text-gray-500">
        ${isArabic ? 'لا توجد أسئلة بعد' : 'No questions yet'}
      </p>
    `;
  }
  
  return questions.map(q => `
    <div class="border-b pb-4 mb-4">
      <p class="font-semibold mb-2">
        <i class="fas fa-question-circle"></i> ${q.question}
      </p>
      ${q.answer ? `
        <p class="text-gray-700 ml-6">
          <i class="fas fa-comment-dots text-green-600"></i> ${q.answer}
        </p>
        <p class="text-sm text-gray-500 ml-6 mt-1">
          ${isArabic ? 'تم الرد بواسطة' : 'Answered by'} ${q.seller?.name_ar || q.seller?.name_en}
        </p>
      ` : `
        <p class="text-gray-500 ml-6">
          ${isArabic ? 'في انتظار الرد' : 'Awaiting answer'}
        </p>
      `}
    </div>
  `).join('');
}

function changeMainImage(url) {
  document.getElementById('main-image').src = url;
}

function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active', 'text-blue-900', 'border-b-2', 'border-blue-900');
  });
  
  // Show selected tab
  document.getElementById(`${tabName}-tab`).classList.remove('hidden');
  
  // Add active class to clicked button
  event.target.classList.add('active', 'text-blue-900', 'border-b-2', 'border-blue-900');
}

function increaseQuantity() {
  const input = document.getElementById('quantity');
  const max = parseInt(input.max);
  const current = parseInt(input.value);
  if (current < max) {
    input.value = current + 1;
  }
}

function decreaseQuantity() {
  const input = document.getElementById('quantity');
  const min = parseInt(input.min);
  const current = parseInt(input.value);
  if (current > min) {
    input.value = current - 1;
  }
}