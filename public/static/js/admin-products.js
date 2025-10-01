/**
 * Admin Products Management JavaScript
 * Handles product CRUD operations and UI interactions
 */

// Global variables
let products = [];
let currentPage = 1;
let totalPages = 1;
let selectedProducts = new Set();
let productToDelete = null;
let filters = {
    search: '',
    category: '',
    status: '',
    prescription: '',
    seller: ''
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadStatistics();
    initializeEventListeners();
});

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Form submission
    document.getElementById('editProductForm').addEventListener('submit', handleFormSubmit);
    
    // Search on enter key
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    // Tab styling
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(b => {
                b.classList.remove('border-blue-500', 'text-blue-600');
                b.classList.add('border-transparent', 'text-gray-500');
            });
            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('border-blue-500', 'text-blue-600');
        });
    });
}

/**
 * Load products from API
 */
async function loadProducts(page = 1) {
    currentPage = page;
    showLoading(true);
    
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20',
            search: filters.search,
            category: filters.category,
            status: filters.status,
            prescription: filters.prescription,
            seller: filters.seller,
            sortBy: 'created_at',
            sortOrder: 'desc'
        });
        
        // Remove empty params
        Array.from(params.entries()).forEach(([key, value]) => {
            if (!value) params.delete(key);
        });
        
        const response = await axios.get(`/api/admin/products/list?${params}`);
        const data = response.data;
        
        products = data.products;
        totalPages = data.pagination.totalPages;
        
        renderProducts();
        renderPagination(data.pagination);
        updateFilters(data.filters);
        
        // Update showing info
        const from = (page - 1) * 20 + 1;
        const to = Math.min(page * 20, data.pagination.total);
        document.getElementById('showingFrom').textContent = from;
        document.getElementById('showingTo').textContent = to;
        document.getElementById('totalItems').textContent = data.pagination.total;
        
    } catch (error) {
        console.error('Failed to load products:', error);
        showAlert('Failed to load products', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Load statistics
 */
async function loadStatistics() {
    try {
        const response = await axios.get('/api/admin/products/stats');
        const stats = response.data;
        
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('activeProducts').textContent = stats.activeProducts;
        document.getElementById('inactiveProducts').textContent = stats.inactiveProducts;
        document.getElementById('lowStock').textContent = stats.lowStockProducts.length;
        
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

/**
 * Render products table
 */
function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    
    if (products.length === 0) {
        document.getElementById('emptyState').classList.remove('hidden');
        tbody.innerHTML = '';
        return;
    }
    
    document.getElementById('emptyState').classList.add('hidden');
    
    tbody.innerHTML = products.map(product => {
        const isLowStock = product.stock_quantity <= (product.stock_alert_level || 10);
        const statusBadge = product.is_active 
            ? '<span class="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Active</span>'
            : '<span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Inactive</span>';
        
        const prescriptionBadge = product.requires_prescription
            ? '<span class="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Required</span>'
            : '<span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Not Required</span>';
        
        const stockClass = isLowStock ? 'text-red-600 font-semibold' : 'text-gray-900';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <input type="checkbox" class="product-checkbox rounded" value="${product.id}" onchange="toggleProductSelection('${product.id}')">
                </td>
                <td class="px-4 py-3">
                    <div>
                        <div class="text-sm font-medium text-gray-900">${product.name_en}</div>
                        <div class="text-sm text-gray-500">${product.name_ar}</div>
                        <div class="text-xs text-gray-400">${product.product_code}</div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-sm text-gray-900">${product.category || 'N/A'}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm font-medium text-gray-900">${product.price_per_unit} ${product.currency || 'EGP'}</div>
                    ${product.discount_percentage > 0 ? `<div class="text-xs text-green-600">-${product.discount_percentage}% off</div>` : ''}
                </td>
                <td class="px-4 py-3">
                    <div class="${stockClass} text-sm">${product.stock_quantity}</div>
                    ${isLowStock ? '<div class="text-xs text-red-500">Low Stock</div>' : ''}
                </td>
                <td class="px-4 py-3">
                    ${statusBadge}
                </td>
                <td class="px-4 py-3">
                    ${prescriptionBadge}
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button onclick="viewProduct('${product.id}')" class="text-blue-600 hover:text-blue-800" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editProduct('${product.id}')" class="text-green-600 hover:text-green-800" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteProduct('${product.id}')" class="text-red-600 hover:text-red-800" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Render pagination
 */
function renderPagination(pagination) {
    const buttonsContainer = document.getElementById('paginationButtons');
    
    if (totalPages <= 1) {
        buttonsContainer.innerHTML = '';
        return;
    }
    
    let buttons = [];
    
    // Previous button
    if (currentPage > 1) {
        buttons.push(`
            <button onclick="loadProducts(${currentPage - 1})" class="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                <i class="fas fa-chevron-left"></i>
            </button>
        `);
    }
    
    // Page numbers
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        const isActive = i === currentPage;
        buttons.push(`
            <button onclick="loadProducts(${i})" 
                    class="px-3 py-1 ${isActive ? 'bg-blue-500 text-white' : 'bg-white'} border rounded hover:bg-${isActive ? 'blue-600' : 'gray-50'}">
                ${i}
            </button>
        `);
    }
    
    // Next button
    if (currentPage < totalPages) {
        buttons.push(`
            <button onclick="loadProducts(${currentPage + 1})" class="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                <i class="fas fa-chevron-right"></i>
            </button>
        `);
    }
    
    buttonsContainer.innerHTML = buttons.join('');
}

/**
 * Update filter dropdowns
 */
function updateFilters(filterData) {
    // Update category filter
    const categoryFilter = document.getElementById('categoryFilter');
    const currentCategory = categoryFilter.value;
    
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    filterData.categories?.forEach(category => {
        categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
    });
    categoryFilter.value = currentCategory;
}

/**
 * Apply filters
 */
function applyFilters() {
    filters.search = document.getElementById('searchInput').value;
    filters.category = document.getElementById('categoryFilter').value;
    filters.status = document.getElementById('statusFilter').value;
    filters.prescription = document.getElementById('prescriptionFilter').value;
    
    loadProducts(1);
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('prescriptionFilter').value = '';
    
    filters = {
        search: '',
        category: '',
        status: '',
        prescription: '',
        seller: ''
    };
    
    loadProducts(1);
}

/**
 * View product details
 */
function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // For now, open edit modal in read-only mode
    editProduct(productId);
}

/**
 * Edit product
 */
async function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        try {
            const response = await axios.get(`/api/admin/products/${productId}`);
            populateEditForm(response.data);
        } catch (error) {
            console.error('Failed to fetch product:', error);
            showAlert('Failed to load product details', 'error');
            return;
        }
    } else {
        populateEditForm(product);
    }
    
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('editProductModal').classList.add('active');
}

/**
 * Populate edit form with product data
 */
function populateEditForm(product) {
    document.getElementById('productId').value = product.id;
    
    // Basic Information
    document.getElementById('edit_product_code').value = product.product_code || '';
    document.getElementById('edit_sku').value = product.sku || '';
    document.getElementById('edit_name_en').value = product.name_en || '';
    document.getElementById('edit_name_ar').value = product.name_ar || '';
    document.getElementById('edit_description_en').value = product.description_en || '';
    document.getElementById('edit_description_ar').value = product.description_ar || '';
    document.getElementById('edit_category').value = product.category || '';
    document.getElementById('edit_subcategory').value = product.subcategory || '';
    document.getElementById('edit_brand').value = product.brand || '';
    document.getElementById('edit_manufacturer').value = product.manufacturer || '';
    document.getElementById('edit_barcode').value = product.barcode || '';
    document.getElementById('edit_country_of_origin').value = product.country_of_origin || '';
    
    // Pricing & Stock
    document.getElementById('edit_price_per_unit').value = product.price_per_unit || '';
    document.getElementById('edit_currency').value = product.currency || 'EGP';
    document.getElementById('edit_unit_item').value = product.unit_item || '';
    document.getElementById('edit_unit_size').value = product.unit_size || '';
    document.getElementById('edit_stock_quantity').value = product.stock_quantity || 0;
    document.getElementById('edit_stock_alert_level').value = product.stock_alert_level || 10;
    document.getElementById('edit_minimum_quantity').value = product.minimum_quantity || 1;
    document.getElementById('edit_maximum_quantity').value = product.maximum_quantity || 10;
    document.getElementById('edit_discount_percentage').value = product.discount_percentage || 0;
    document.getElementById('edit_tax_percentage').value = product.tax_percentage || 14;
    
    // Medical Details
    document.getElementById('edit_active_ingredient').value = product.active_ingredient || '';
    document.getElementById('edit_dosage_form').value = product.dosage_form || '';
    document.getElementById('edit_hsn_code').value = product.hsn_code || '';
    document.getElementById('edit_side_effects').value = product.side_effects || '';
    document.getElementById('edit_contraindications').value = product.contraindications || '';
    document.getElementById('edit_storage_conditions').value = product.storage_conditions || '';
    document.getElementById('edit_expiry_date').value = product.expiry_date ? product.expiry_date.split('T')[0] : '';
    document.getElementById('edit_batch_number').value = product.batch_number || '';
    document.getElementById('edit_requires_prescription').checked = product.requires_prescription || false;
    document.getElementById('edit_is_controlled').checked = product.is_controlled || false;
    
    // Delivery & Shipping
    document.getElementById('edit_seller_code').value = product.seller?.seller_code || '';
    document.getElementById('edit_delivery_method').value = product.delivery_method || 'standard';
    document.getElementById('edit_delivery_days_min').value = product.delivery_days_min || 1;
    document.getElementById('edit_delivery_days_max').value = product.delivery_days_max || 3;
    document.getElementById('edit_delivery_fee').value = product.delivery_fee || 0;
    document.getElementById('edit_free_delivery_threshold').value = product.free_delivery_threshold || 0;
    document.getElementById('edit_return_policy').value = product.return_policy || '';
    document.getElementById('edit_warranty_period').value = product.warranty_period || '';
    document.getElementById('edit_weight_grams').value = product.weight_grams || '';
    document.getElementById('edit_dimensions_cm').value = product.dimensions_cm || '';
    
    // SEO & Images
    document.getElementById('edit_meta_title').value = product.meta_title || '';
    document.getElementById('edit_meta_description').value = product.meta_description || '';
    document.getElementById('edit_tags').value = Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || '');
    document.getElementById('edit_product_images').value = JSON.stringify(product.product_images || []);
    document.getElementById('edit_specifications').value = JSON.stringify(product.specifications || {});
    document.getElementById('edit_is_featured').checked = product.is_featured || false;
    document.getElementById('edit_is_active').checked = product.is_active || false;
}

/**
 * Open add product modal
 */
function openAddProductModal() {
    // Reset form
    document.getElementById('editProductForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Product';
    
    // Auto-generate product code
    document.getElementById('edit_product_code').value = generateProductCode();
    
    // Set defaults
    document.getElementById('edit_currency').value = 'EGP';
    document.getElementById('edit_tax_percentage').value = '14';
    document.getElementById('edit_minimum_quantity').value = '1';
    document.getElementById('edit_maximum_quantity').value = '10';
    document.getElementById('edit_stock_quantity').value = '0';
    document.getElementById('edit_stock_alert_level').value = '10';
    document.getElementById('edit_delivery_method').value = 'standard';
    document.getElementById('edit_delivery_days_min').value = '1';
    document.getElementById('edit_delivery_days_max').value = '3';
    document.getElementById('edit_delivery_fee').value = '30';
    document.getElementById('edit_free_delivery_threshold').value = '200';
    document.getElementById('edit_discount_percentage').value = '0';
    document.getElementById('edit_is_active').checked = true;
    document.getElementById('edit_requires_prescription').checked = false;
    document.getElementById('edit_is_controlled').checked = false;
    document.getElementById('edit_is_featured').checked = false;
    document.getElementById('edit_country_of_origin').value = 'Egypt';
    document.getElementById('edit_product_images').value = '[]';
    document.getElementById('edit_specifications').value = '{}';
    
    // Switch to basic tab
    switchTab('basic');
    
    // Show modal
    document.getElementById('editProductModal').classList.add('active');
    
    // Focus on first required field (product code is auto-generated)
    setTimeout(() => {
        document.getElementById('edit_name_en').focus();
    }, 100);
}

/**
 * Close edit modal
 */
function closeEditModal() {
    document.getElementById('editProductModal').classList.remove('active');
}

/**
 * Switch tabs
 */
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.remove('hidden');
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const isNew = !productId;
    
    // Validate required fields
    const requiredFields = {
        'edit_product_code': 'Product Code',
        'edit_name_en': 'English Name',
        'edit_name_ar': 'Arabic Name',
        'edit_price_per_unit': 'Price',
        'edit_stock_quantity': 'Stock Quantity'
    };
    
    for (const [fieldId, fieldName] of Object.entries(requiredFields)) {
        const value = document.getElementById(fieldId).value;
        if (!value || value.trim() === '') {
            showAlert(`${fieldName} is required`, 'error');
            document.getElementById(fieldId).focus();
            switchToTabContainingField(fieldId);
            return;
        }
    }
    
    // Additional validations
    const price = parseFloat(document.getElementById('edit_price_per_unit').value);
    if (isNaN(price) || price <= 0) {
        showAlert('Price must be a positive number', 'error');
        document.getElementById('edit_price_per_unit').focus();
        switchToTabContainingField('edit_price_per_unit');
        return;
    }
    
    const minQty = parseInt(document.getElementById('edit_minimum_quantity').value) || 1;
    const maxQty = parseInt(document.getElementById('edit_maximum_quantity').value) || 10;
    if (minQty > maxQty) {
        showAlert('Minimum quantity cannot be greater than maximum quantity', 'error');
        document.getElementById('edit_minimum_quantity').focus();
        switchToTabContainingField('edit_minimum_quantity');
        return;
    }
    
    const minDays = parseInt(document.getElementById('edit_delivery_days_min').value) || 1;
    const maxDays = parseInt(document.getElementById('edit_delivery_days_max').value) || 3;
    if (minDays > maxDays) {
        showAlert('Minimum delivery days cannot be greater than maximum', 'error');
        document.getElementById('edit_delivery_days_min').focus();
        switchToTabContainingField('edit_delivery_days_min');
        return;
    }
    
    // Collect form data
    const formData = {
        product_code: document.getElementById('edit_product_code').value,
        sku: document.getElementById('edit_sku').value,
        name_en: document.getElementById('edit_name_en').value,
        name_ar: document.getElementById('edit_name_ar').value,
        description_en: document.getElementById('edit_description_en').value,
        description_ar: document.getElementById('edit_description_ar').value,
        category: document.getElementById('edit_category').value,
        subcategory: document.getElementById('edit_subcategory').value,
        brand: document.getElementById('edit_brand').value,
        manufacturer: document.getElementById('edit_manufacturer').value,
        barcode: document.getElementById('edit_barcode').value,
        country_of_origin: document.getElementById('edit_country_of_origin').value,
        price_per_unit: parseFloat(document.getElementById('edit_price_per_unit').value),
        currency: document.getElementById('edit_currency').value,
        unit_item: document.getElementById('edit_unit_item').value,
        unit_size: document.getElementById('edit_unit_size').value,
        stock_quantity: parseInt(document.getElementById('edit_stock_quantity').value),
        stock_alert_level: parseInt(document.getElementById('edit_stock_alert_level').value) || 10,
        minimum_quantity: parseInt(document.getElementById('edit_minimum_quantity').value) || 1,
        maximum_quantity: parseInt(document.getElementById('edit_maximum_quantity').value) || 10,
        discount_percentage: parseFloat(document.getElementById('edit_discount_percentage').value) || 0,
        tax_percentage: parseFloat(document.getElementById('edit_tax_percentage').value) || 14,
        active_ingredient: document.getElementById('edit_active_ingredient').value,
        dosage_form: document.getElementById('edit_dosage_form').value,
        hsn_code: document.getElementById('edit_hsn_code').value,
        side_effects: document.getElementById('edit_side_effects').value,
        contraindications: document.getElementById('edit_contraindications').value,
        storage_conditions: document.getElementById('edit_storage_conditions').value,
        expiry_date: document.getElementById('edit_expiry_date').value,
        batch_number: document.getElementById('edit_batch_number').value,
        requires_prescription: document.getElementById('edit_requires_prescription').checked,
        is_controlled: document.getElementById('edit_is_controlled').checked,
        seller_code: document.getElementById('edit_seller_code').value,
        delivery_method: document.getElementById('edit_delivery_method').value,
        delivery_days_min: parseInt(document.getElementById('edit_delivery_days_min').value) || 1,
        delivery_days_max: parseInt(document.getElementById('edit_delivery_days_max').value) || 3,
        delivery_fee: parseFloat(document.getElementById('edit_delivery_fee').value) || 0,
        free_delivery_threshold: parseFloat(document.getElementById('edit_free_delivery_threshold').value) || 0,
        return_policy: document.getElementById('edit_return_policy').value,
        warranty_period: document.getElementById('edit_warranty_period').value,
        weight_grams: parseInt(document.getElementById('edit_weight_grams').value) || null,
        dimensions_cm: document.getElementById('edit_dimensions_cm').value,
        meta_title: document.getElementById('edit_meta_title').value,
        meta_description: document.getElementById('edit_meta_description').value,
        tags: document.getElementById('edit_tags').value,
        product_images: document.getElementById('edit_product_images').value,
        specifications: document.getElementById('edit_specifications').value,
        is_featured: document.getElementById('edit_is_featured').checked,
        is_active: document.getElementById('edit_is_active').checked
    };
    
    try {
        let response;
        if (isNew) {
            // Create new product
            showSavingIndicator(true);
            response = await axios.post('/api/admin/products', formData);
        } else {
            // Update existing product
            showSavingIndicator(true);
            response = await axios.put(`/api/admin/products/${productId}`, formData);
        }
        
        if (response.data.success) {
            showAlert(isNew ? 'Product created successfully' : 'Product updated successfully', 'success');
            closeEditModal();
            loadProducts(isNew ? 1 : currentPage); // Go to first page for new products
            loadStatistics();
        }
    } catch (error) {
        console.error('Failed to save product:', error);
        showSavingIndicator(false);
        
        // Handle specific field errors
        if (error.response?.data?.field) {
            const field = error.response.data.field;
            const fieldMap = {
                'product_code': 'edit_product_code',
                'name_en': 'edit_name_en',
                'name_ar': 'edit_name_ar',
                'price_per_unit': 'edit_price_per_unit'
            };
            
            if (fieldMap[field]) {
                document.getElementById(fieldMap[field]).focus();
                switchToTabContainingField(fieldMap[field]);
            }
        }
        
        showAlert('Failed to save product: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
        showSavingIndicator(false);
    }
}

/**
 * Delete product
 */
function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    productToDelete = productId;
    document.getElementById('deleteProductName').textContent = `${product.product_code}: ${product.name_en}`;
    document.getElementById('deleteModal').classList.add('active');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    productToDelete = null;
}

/**
 * Confirm delete
 */
async function confirmDelete() {
    if (!productToDelete) return;
    
    try {
        const response = await axios.delete(`/api/admin/products/${productToDelete}`);
        
        if (response.data.success) {
            showAlert('Product deleted successfully', 'success');
            closeDeleteModal();
            loadProducts(currentPage);
            loadStatistics();
        }
    } catch (error) {
        console.error('Failed to delete product:', error);
        showAlert('Failed to delete product: ' + (error.response?.data?.error || error.message), 'error');
    }
}

/**
 * Toggle product selection
 */
function toggleProductSelection(productId) {
    if (selectedProducts.has(productId)) {
        selectedProducts.delete(productId);
    } else {
        selectedProducts.add(productId);
    }
    
    updateBulkActions();
}

/**
 * Toggle select all
 */
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll').checked;
    const checkboxes = document.querySelectorAll('.product-checkbox');
    
    selectedProducts.clear();
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll;
        if (selectAll) {
            selectedProducts.add(checkbox.value);
        }
    });
    
    updateBulkActions();
}

/**
 * Update bulk actions visibility
 */
function updateBulkActions() {
    const bulkActions = document.getElementById('bulkActions');
    
    if (selectedProducts.size > 0) {
        bulkActions.classList.remove('hidden');
    } else {
        bulkActions.classList.add('hidden');
    }
}

/**
 * Bulk activate products
 */
async function bulkActivate() {
    if (selectedProducts.size === 0) return;
    
    try {
        const response = await axios.post('/api/admin/products/bulk-update', {
            ids: Array.from(selectedProducts),
            updates: { is_active: true }
        });
        
        if (response.data.success) {
            showAlert(`${response.data.updated} products activated`, 'success');
            selectedProducts.clear();
            loadProducts(currentPage);
            loadStatistics();
        }
    } catch (error) {
        console.error('Failed to activate products:', error);
        showAlert('Failed to activate products', 'error');
    }
}

/**
 * Bulk deactivate products
 */
async function bulkDeactivate() {
    if (selectedProducts.size === 0) return;
    
    try {
        const response = await axios.post('/api/admin/products/bulk-update', {
            ids: Array.from(selectedProducts),
            updates: { is_active: false }
        });
        
        if (response.data.success) {
            showAlert(`${response.data.updated} products deactivated`, 'success');
            selectedProducts.clear();
            loadProducts(currentPage);
            loadStatistics();
        }
    } catch (error) {
        console.error('Failed to deactivate products:', error);
        showAlert('Failed to deactivate products', 'error');
    }
}

/**
 * Bulk delete products
 */
async function bulkDelete() {
    if (selectedProducts.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} products? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await axios.post('/api/admin/products/bulk-delete', {
            ids: Array.from(selectedProducts)
        });
        
        if (response.data.success) {
            showAlert(`${response.data.deleted} products deleted`, 'success');
            selectedProducts.clear();
            loadProducts(currentPage);
            loadStatistics();
        }
    } catch (error) {
        console.error('Failed to delete products:', error);
        showAlert('Failed to delete products', 'error');
    }
}

/**
 * Export products to CSV
 */
async function exportProducts() {
    try {
        window.location.href = '/api/admin/products/export';
        showAlert('Export started. File will download shortly.', 'success');
    } catch (error) {
        console.error('Failed to export products:', error);
        showAlert('Failed to export products', 'error');
    }
}

/**
 * Show/hide loading state
 */
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const tbody = document.getElementById('productsTableBody');
    
    if (show) {
        loadingState.classList.remove('hidden');
        tbody.innerHTML = '';
    } else {
        loadingState.classList.add('hidden');
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md animate-pulse`;
    
    if (type === 'error') {
        alert.className += ' bg-red-100 border border-red-400 text-red-700';
    } else if (type === 'success') {
        alert.className += ' bg-green-100 border border-green-400 text-green-700';
    } else {
        alert.className += ' bg-blue-100 border border-blue-400 text-blue-700';
    }
    
    alert.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

/**
 * Logout
 */
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    window.location.href = '/admin';
}

/**
 * Switch to tab containing a specific field
 */
function switchToTabContainingField(fieldId) {
    // Map fields to their tabs
    const fieldToTab = {
        // Basic Information
        'edit_product_code': 'basic',
        'edit_sku': 'basic',
        'edit_name_en': 'basic',
        'edit_name_ar': 'basic',
        'edit_description_en': 'basic',
        'edit_description_ar': 'basic',
        'edit_category': 'basic',
        'edit_subcategory': 'basic',
        'edit_brand': 'basic',
        'edit_manufacturer': 'basic',
        'edit_barcode': 'basic',
        'edit_country_of_origin': 'basic',
        
        // Pricing & Stock
        'edit_price_per_unit': 'pricing',
        'edit_currency': 'pricing',
        'edit_unit_item': 'pricing',
        'edit_unit_size': 'pricing',
        'edit_stock_quantity': 'pricing',
        'edit_stock_alert_level': 'pricing',
        'edit_minimum_quantity': 'pricing',
        'edit_maximum_quantity': 'pricing',
        'edit_discount_percentage': 'pricing',
        'edit_tax_percentage': 'pricing',
        
        // Medical Details
        'edit_active_ingredient': 'medical',
        'edit_dosage_form': 'medical',
        'edit_hsn_code': 'medical',
        'edit_side_effects': 'medical',
        'edit_contraindications': 'medical',
        'edit_storage_conditions': 'medical',
        'edit_expiry_date': 'medical',
        'edit_batch_number': 'medical',
        'edit_requires_prescription': 'medical',
        'edit_is_controlled': 'medical',
        
        // Delivery & Shipping
        'edit_seller_code': 'delivery',
        'edit_delivery_method': 'delivery',
        'edit_delivery_days_min': 'delivery',
        'edit_delivery_days_max': 'delivery',
        'edit_delivery_fee': 'delivery',
        'edit_free_delivery_threshold': 'delivery',
        'edit_return_policy': 'delivery',
        'edit_warranty_period': 'delivery',
        'edit_weight_grams': 'delivery',
        'edit_dimensions_cm': 'delivery',
        
        // SEO & Images
        'edit_meta_title': 'seo',
        'edit_meta_description': 'seo',
        'edit_tags': 'seo',
        'edit_product_images': 'seo',
        'edit_specifications': 'seo',
        'edit_is_featured': 'seo',
        'edit_is_active': 'seo'
    };
    
    const tab = fieldToTab[fieldId];
    if (tab) {
        switchTab(tab);
    }
}

/**
 * Show saving indicator
 */
function showSavingIndicator(show) {
    const submitButton = document.querySelector('#editProductForm button[type="submit"]');
    if (show) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';
    } else {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-save mr-1"></i> Save Changes';
    }
}

/**
 * Generate unique product code
 */
function generateProductCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `PROD-${timestamp}-${random}`;
}

/**
 * Auto-generate product code for new products
 */
function autoGenerateProductCode() {
    const productCodeField = document.getElementById('edit_product_code');
    if (!productCodeField.value) {
        productCodeField.value = generateProductCode();
    }
}

/**
 * Open quick add modal
 */
function openQuickAddModal() {
    // Reset form
    document.getElementById('quickAddForm').reset();
    
    // Generate product code
    document.getElementById('quick_product_code').value = generateProductCode();
    
    // Set defaults
    document.getElementById('quick_stock').value = '0';
    document.getElementById('quick_active').checked = true;
    
    // Show modal
    document.getElementById('quickAddModal').classList.add('active');
    
    // Focus on name field
    setTimeout(() => {
        document.getElementById('quick_name_en').focus();
    }, 100);
}

/**
 * Close quick add modal
 */
function closeQuickAddModal() {
    document.getElementById('quickAddModal').classList.remove('active');
}

/**
 * Handle quick add form submission
 */
async function handleQuickAdd(e) {
    e.preventDefault();
    
    const action = e.submitter.value;
    
    // Collect form data
    const formData = {
        product_code: document.getElementById('quick_product_code').value,
        name_en: document.getElementById('quick_name_en').value,
        name_ar: document.getElementById('quick_name_ar').value,
        description_en: document.getElementById('quick_description').value,
        description_ar: document.getElementById('quick_description').value, // Use same description for both languages in quick add
        category: document.getElementById('quick_category').value,
        brand: document.getElementById('quick_brand').value,
        price_per_unit: parseFloat(document.getElementById('quick_price').value),
        stock_quantity: parseInt(document.getElementById('quick_stock').value),
        active_ingredient: document.getElementById('quick_active_ingredient').value,
        requires_prescription: document.getElementById('quick_prescription').checked,
        is_active: document.getElementById('quick_active').checked,
        is_featured: document.getElementById('quick_featured').checked,
        
        // Set defaults for required fields
        currency: 'EGP',
        unit_item: 'box',
        minimum_quantity: 1,
        maximum_quantity: 10,
        delivery_method: 'standard',
        delivery_days_min: 1,
        delivery_days_max: 3,
        delivery_fee: 30,
        tax_percentage: 14,
        stock_alert_level: 10,
        product_images: [],
        specifications: {},
        tags: []
    };
    
    try {
        // Disable form buttons
        const buttons = document.querySelectorAll('#quickAddForm button[type="submit"]');
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.value === 'save') {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';
            }
        });
        
        const response = await axios.post('/api/admin/products', formData);
        
        if (response.data.success) {
            showAlert('Product added successfully!', 'success');
            
            if (action === 'save-and-new') {
                // Reset form for new product
                document.getElementById('quickAddForm').reset();
                document.getElementById('quick_product_code').value = generateProductCode();
                document.getElementById('quick_stock').value = '0';
                document.getElementById('quick_active').checked = true;
                document.getElementById('quick_name_en').focus();
            } else {
                // Close modal and refresh list
                closeQuickAddModal();
            }
            
            // Refresh products list and statistics
            loadProducts(1); // Go to first page to see new product
            loadStatistics();
        }
        
    } catch (error) {
        console.error('Failed to add product:', error);
        
        // Handle duplicate product code error
        if (error.response?.data?.field === 'product_code') {
            document.getElementById('quick_product_code').focus();
            document.getElementById('quick_product_code').classList.add('border-red-500');
        }
        
        showAlert('Failed to add product: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
        // Re-enable form buttons
        const buttons = document.querySelectorAll('#quickAddForm button[type="submit"]');
        buttons.forEach(btn => {
            btn.disabled = false;
            if (btn.value === 'save') {
                btn.innerHTML = '<i class="fas fa-save mr-1"></i> Save';
            } else if (btn.value === 'save-and-new') {
                btn.innerHTML = '<i class="fas fa-plus mr-1"></i> Save & New';
            }
        });
    }
}