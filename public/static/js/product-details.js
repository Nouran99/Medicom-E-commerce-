/**
 * Product Details Page JavaScript
 * Handles product display, image gallery, and cart operations
 */

// Global variables
let currentProduct = null;
let currentLanguage = localStorage.getItem('language') || 'ar';
let selectedImageIndex = 0;
let cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const productId = getProductIdFromURL();
    if (productId) {
        loadProductDetails(productId);
        loadRelatedProducts(productId);
    } else {
        // If no ID, try product code
        const productCode = getProductCodeFromURL();
        if (productCode) {
            loadProductByCode(productCode);
        } else {
            window.location.href = '/products';
        }
    }
    
    updateCartCount();
    updateLanguageUI();
});

/**
 * Get product ID from URL
 */
function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Get product code from URL
 */
function getProductCodeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
}

/**
 * Load product details
 */
async function loadProductDetails(productId) {
    try {
        const response = await axios.get(`/api/products-enhanced/${productId}`);
        currentProduct = response.data;
        displayProduct(currentProduct);
    } catch (error) {
        console.error('Failed to load product:', error);
        // Try public API
        try {
            const response = await axios.get(`/api/products/${productId}`);
            currentProduct = response.data;
            displayProduct(currentProduct);
        } catch (error2) {
            showError('المنتج غير موجود');
        }
    }
}

/**
 * Load product by code
 */
async function loadProductByCode(productCode) {
    try {
        const response = await axios.get(`/api/products-enhanced/code/${productCode}`);
        currentProduct = response.data;
        displayProduct(currentProduct);
    } catch (error) {
        console.error('Failed to load product by code:', error);
        showError('المنتج غير موجود');
    }
}

/**
 * Display product information
 */
function displayProduct(product) {
    // Update page title
    document.title = `${getName(product)} - Medicum Egypt`;
    
    // Breadcrumb
    document.getElementById('product-name-breadcrumb').textContent = getName(product);
    if (product.category) {
        const categoryLink = document.getElementById('category-link');
        categoryLink.textContent = getCategoryName(product.category);
        categoryLink.href = `/products?category=${product.category}`;
    }
    
    // Badges
    const badgesContainer = document.getElementById('badges-container');
    badgesContainer.innerHTML = '';
    
    if (product.requires_prescription) {
        badgesContainer.innerHTML += `
            <span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                <i class="fas fa-prescription"></i> يتطلب روشتة
            </span>
        `;
        document.getElementById('prescription-notice').classList.remove('hidden');
    }
    
    if (product.is_controlled) {
        badgesContainer.innerHTML += `
            <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                <i class="fas fa-lock"></i> دواء مراقب
            </span>
        `;
    }
    
    if (product.is_featured) {
        badgesContainer.innerHTML += `
            <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                <i class="fas fa-star"></i> منتج مميز
            </span>
        `;
    }
    
    // Product name and code
    document.getElementById('product-name').textContent = getName(product);
    document.getElementById('product-code').textContent = product.product_code || product.id;
    
    // Price
    const price = product.price_per_unit || product.price || 0;
    const discount = product.discount_percentage || 0;
    
    if (discount > 0) {
        const originalPrice = price;
        const discountedPrice = price * (1 - discount / 100);
        
        document.getElementById('product-price').textContent = discountedPrice.toFixed(2);
        document.getElementById('original-price').textContent = originalPrice.toFixed(2);
        document.getElementById('discount-percent').textContent = discount;
        
        document.getElementById('discount-badge').classList.remove('hidden');
        document.getElementById('original-price-container').classList.remove('hidden');
    } else {
        document.getElementById('product-price').textContent = price.toFixed(2);
    }
    
    // Stock status
    const stockQuantity = product.stock_quantity || 0;
    const stockStatus = document.getElementById('stock-status');
    const lowStockWarning = document.getElementById('low-stock-warning');
    
    if (stockQuantity === 0) {
        stockStatus.innerHTML = '<span class="text-red-600">غير متوفر</span>';
        document.getElementById('add-to-cart-btn').disabled = true;
        document.getElementById('add-to-cart-btn').textContent = 'غير متوفر';
    } else if (stockQuantity <= 10) {
        stockStatus.innerHTML = '<span class="text-yellow-600">متوفر - كمية محدودة</span>';
        document.getElementById('stock-count').textContent = stockQuantity;
        lowStockWarning.classList.remove('hidden');
    } else {
        stockStatus.innerHTML = '<span class="text-green-600">متوفر</span>';
    }
    
    // Set max quantity
    const quantityInput = document.getElementById('quantity');
    quantityInput.max = Math.min(product.maximum_quantity || 10, stockQuantity);
    
    // Active ingredient
    if (product.active_ingredient) {
        document.getElementById('active-ingredient').textContent = product.active_ingredient;
        document.getElementById('active-ingredient-section').classList.remove('hidden');
    }
    
    // Images
    displayImages(product);
    
    // Delivery information
    document.getElementById('delivery-days').textContent = 
        `${product.delivery_days_min || 1}-${product.delivery_days_max || 3}`;
    document.getElementById('delivery-fee').textContent = product.delivery_fee || 30;
    
    if (product.free_delivery_threshold) {
        document.getElementById('free-delivery-threshold').textContent = product.free_delivery_threshold;
        document.getElementById('free-delivery-info').classList.remove('hidden');
    }
    
    // Description
    document.getElementById('product-description').textContent = 
        getDescription(product) || 'لا يوجد وصف متاح لهذا المنتج.';
    
    // Dosage form
    if (product.dosage_form) {
        document.getElementById('dosage-form').textContent = product.dosage_form;
        document.getElementById('dosage-form-section').classList.remove('hidden');
    }
    
    // Side effects
    if (product.side_effects) {
        document.getElementById('side-effects').textContent = product.side_effects;
        document.getElementById('side-effects-section').classList.remove('hidden');
    }
    
    // Contraindications
    if (product.contraindications) {
        document.getElementById('contraindications').textContent = product.contraindications;
        document.getElementById('contraindications-section').classList.remove('hidden');
    }
    
    // Storage conditions
    if (product.storage_conditions) {
        document.getElementById('storage-conditions').textContent = product.storage_conditions;
        document.getElementById('storage-section').classList.remove('hidden');
    }
    
    // Specifications
    displaySpecifications(product);
}

/**
 * Display product images
 */
function displayImages(product) {
    const images = product.product_images || [];
    const mainImage = document.getElementById('main-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    
    // Default image if no images
    if (images.length === 0) {
        mainImage.src = '/static/images/placeholder.jpg';
        mainImage.alt = getName(product);
        return;
    }
    
    // Set main image
    mainImage.src = images[0];
    mainImage.alt = getName(product);
    
    // Create thumbnails
    thumbnailContainer.innerHTML = '';
    images.forEach((image, index) => {
        const thumb = document.createElement('img');
        thumb.src = image;
        thumb.alt = `${getName(product)} ${index + 1}`;
        thumb.className = `w-20 h-20 object-cover rounded border-2 border-gray-300 image-thumbnail ${index === 0 ? 'active' : ''}`;
        thumb.onclick = () => selectImage(index);
        thumbnailContainer.appendChild(thumb);
    });
}

/**
 * Select image
 */
function selectImage(index) {
    if (!currentProduct || !currentProduct.product_images) return;
    
    selectedImageIndex = index;
    const images = currentProduct.product_images;
    
    // Update main image
    document.getElementById('main-image').src = images[index];
    
    // Update thumbnail active state
    document.querySelectorAll('.image-thumbnail').forEach((thumb, i) => {
        if (i === index) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

/**
 * Display specifications
 */
function displaySpecifications(product) {
    const table = document.getElementById('specifications-table');
    table.innerHTML = '';
    
    // Standard specifications
    const specs = [
        { label: 'الماركة', value: product.brand },
        { label: 'الشركة المصنعة', value: product.manufacturer },
        { label: 'بلد المنشأ', value: product.country_of_origin },
        { label: 'الوحدة', value: product.unit_item || product.unit },
        { label: 'حجم الوحدة', value: product.unit_size },
        { label: 'الباركود', value: product.barcode },
        { label: 'كود HSN', value: product.hsn_code },
        { label: 'رقم الدفعة', value: product.batch_number },
        { label: 'تاريخ الانتهاء', value: formatDate(product.expiry_date) },
        { label: 'الوزن', value: product.weight_grams ? `${product.weight_grams} جرام` : null },
        { label: 'الأبعاد', value: product.dimensions_cm }
    ];
    
    // Add custom specifications
    if (product.specifications && typeof product.specifications === 'object') {
        Object.entries(product.specifications).forEach(([key, value]) => {
            specs.push({ label: key, value: value });
        });
    }
    
    // Render specifications
    specs.forEach(spec => {
        if (spec.value) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-2 px-4 font-semibold text-gray-700">${spec.label}</td>
                <td class="py-2 px-4 text-gray-600">${spec.value}</td>
            `;
            table.appendChild(row);
        }
    });
}

/**
 * Load related products
 */
async function loadRelatedProducts(productId) {
    try {
        // Get current product category
        if (!currentProduct || !currentProduct.category) return;
        
        const response = await axios.get(`/api/products?category=${currentProduct.category}&limit=5`);
        const products = response.data.products || response.data;
        
        // Filter out current product
        const relatedProducts = products.filter(p => p.id !== productId);
        
        displayRelatedProducts(relatedProducts.slice(0, 5));
    } catch (error) {
        console.error('Failed to load related products:', error);
    }
}

/**
 * Display related products
 */
function displayRelatedProducts(products) {
    const container = document.getElementById('related-products');
    
    if (products.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-full">لا توجد منتجات ذات صلة</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <a href="/product-details.html?id=${product.id}" class="bg-white rounded-lg shadow hover:shadow-lg transition">
            <div class="h-32 bg-gray-100 rounded-t-lg flex items-center justify-center">
                ${product.product_images && product.product_images[0] 
                    ? `<img src="${product.product_images[0]}" alt="${getName(product)}" class="h-full w-full object-cover rounded-t-lg">`
                    : '<i class="fas fa-pills text-4xl text-gray-400"></i>'
                }
            </div>
            <div class="p-3">
                <h3 class="text-sm font-semibold mb-1 truncate">${getName(product)}</h3>
                <p class="text-lg font-bold text-blue-900">${product.price_per_unit || product.price || 0} جنيه</p>
            </div>
        </a>
    `).join('');
}

/**
 * Switch tabs
 */
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active state from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-blue-600', 'text-blue-600', 'font-semibold');
        btn.classList.add('border-transparent');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    // Mark button as active
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('border-blue-600', 'text-blue-600', 'font-semibold');
}

/**
 * Quantity controls
 */
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
    const current = parseInt(input.value);
    
    if (current > 1) {
        input.value = current - 1;
    }
}

/**
 * Add to cart
 */
function addToCart() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value);
    
    // Check if product already in cart
    const existingItemIndex = cartItems.findIndex(item => item.id === currentProduct.id);
    
    if (existingItemIndex > -1) {
        // Update quantity
        cartItems[existingItemIndex].quantity += quantity;
    } else {
        // Add new item
        cartItems.push({
            id: currentProduct.id,
            product_code: currentProduct.product_code,
            name_en: currentProduct.name_en,
            name_ar: currentProduct.name_ar,
            price: currentProduct.price_per_unit || currentProduct.price,
            quantity: quantity,
            image: currentProduct.product_images ? currentProduct.product_images[0] : null,
            requires_prescription: currentProduct.requires_prescription
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // Update cart count
    updateCartCount();
    
    // Show success message
    showSuccess('تمت الإضافة إلى السلة بنجاح!');
    
    // Optionally redirect to cart
    setTimeout(() => {
        if (confirm('هل تريد الذهاب إلى السلة؟')) {
            window.location.href = '/cart';
        }
    }, 500);
}

/**
 * Update cart count
 */
function updateCartCount() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

/**
 * Helper functions
 */
function getName(product) {
    return currentLanguage === 'ar' ? product.name_ar : product.name_en;
}

function getDescription(product) {
    return currentLanguage === 'ar' ? product.description_ar : product.description_en;
}

function getCategoryName(category) {
    const categories = {
        'pain-relief': { ar: 'مسكنات الألم', en: 'Pain Relief' },
        'antibiotics': { ar: 'المضادات الحيوية', en: 'Antibiotics' },
        'vitamins': { ar: 'الفيتامينات', en: 'Vitamins' },
        'diabetes-care': { ar: 'رعاية السكري', en: 'Diabetes Care' },
        'digestive-health': { ar: 'صحة الجهاز الهضمي', en: 'Digestive Health' },
        'allergy-relief': { ar: 'علاج الحساسية', en: 'Allergy Relief' },
        'respiratory': { ar: 'الجهاز التنفسي', en: 'Respiratory' },
        'mental-health': { ar: 'الصحة النفسية', en: 'Mental Health' },
        'first-aid': { ar: 'الإسعافات الأولية', en: 'First Aid' },
        'personal-care': { ar: 'العناية الشخصية', en: 'Personal Care' }
    };
    
    return categories[category] ? categories[category][currentLanguage] : category;
}

function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

/**
 * Language toggle
 */
function toggleLanguage() {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    localStorage.setItem('language', currentLanguage);
    
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
    
    updateLanguageUI();
    
    // Reload product display
    if (currentProduct) {
        displayProduct(currentProduct);
    }
}

function updateLanguageUI() {
    document.getElementById('lang-text').textContent = currentLanguage === 'ar' ? 'EN' : 'عربي';
    document.getElementById('login-text').textContent = currentLanguage === 'ar' ? 'تسجيل الدخول' : 'Login';
}

/**
 * Show success message
 */
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
    alert.innerHTML = `
        <span class="block sm:inline">${message}</span>
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

/**
 * Show error message
 */
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
    alert.innerHTML = `
        <span class="block sm:inline">${message}</span>
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Cart and auth functions (placeholders)
function openCart() {
    window.location.href = '/cart';
}

function openAuth() {
    window.location.href = '/login';
}