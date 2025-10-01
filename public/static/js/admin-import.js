/**
 * Admin Import Interface JavaScript
 * Handles Excel/CSV file upload, validation, and import
 */

// Global variables
let uploadedFile = null;
let parsedData = [];
let validationResult = null;
let currentStep = 1;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeUploadHandlers();
    loadRecentJobs();
});

/**
 * Initialize file upload handlers
 */
function initializeUploadHandlers() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseButton = document.getElementById('browseButton');
    const removeFileBtn = document.getElementById('removeFile');
    
    // Browse button click
    browseButton.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-active');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-active');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-active');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // Remove file button
    removeFileBtn.addEventListener('click', removeFile);
    
    // Validation buttons
    document.getElementById('backToUpload').addEventListener('click', () => switchToStep(1));
    document.getElementById('proceedToImport').addEventListener('click', () => switchToStep(3));
    
    // Import buttons
    document.getElementById('backToValidation').addEventListener('click', () => switchToStep(2));
    document.getElementById('startImport').addEventListener('click', startImport);
    document.getElementById('newImport').addEventListener('click', resetImport);
    
    // Import confirmation checkbox
    document.getElementById('confirmImport').addEventListener('change', (e) => {
        document.getElementById('startImport').disabled = !e.target.checked;
    });
}

/**
 * Handle file selection
 */
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

/**
 * Handle uploaded file
 */
function handleFile(file) {
    // Validate file type
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
        showAlert('Please upload an Excel (.xlsx, .xls) or CSV file', 'error');
        return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showAlert('File size must be less than 10MB', 'error');
        return;
    }
    
    uploadedFile = file;
    displayFileInfo(file);
    parseFile(file);
}

/**
 * Display file information
 */
function displayFileInfo(file) {
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileInfo').classList.remove('hidden');
    document.getElementById('dropZone').classList.add('hidden');
}

/**
 * Remove uploaded file
 */
function removeFile() {
    uploadedFile = null;
    parsedData = [];
    document.getElementById('fileInfo').classList.add('hidden');
    document.getElementById('dropZone').classList.remove('hidden');
    document.getElementById('fileInput').value = '';
}

/**
 * Parse Excel/CSV file
 */
function parseFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            if (file.name.match(/\.csv$/i)) {
                // Parse CSV
                parsedData = parseCSV(e.target.result);
            } else {
                // Parse Excel
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                parsedData = XLSX.utils.sheet_to_json(firstSheet);
            }
            
            console.log('Parsed data:', parsedData);
            
            if (parsedData.length === 0) {
                showAlert('No data found in file', 'error');
                return;
            }
            
            // Automatically move to validation
            validateData();
            
        } catch (error) {
            console.error('Parse error:', error);
            showAlert('Failed to parse file: ' + error.message, 'error');
        }
    };
    
    if (file.name.match(/\.csv$/i)) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

/**
 * Parse CSV content
 */
function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row = {};
        
        headers.forEach((header, index) => {
            let value = values[index];
            
            // Parse numbers
            if (value && !isNaN(Number(value))) {
                value = Number(value);
            }
            // Parse booleans
            else if (value === 'true' || value === 'TRUE') {
                value = true;
            }
            else if (value === 'false' || value === 'FALSE') {
                value = false;
            }
            
            row[header] = value;
        });
        
        data.push(row);
    }
    
    return data;
}

/**
 * Validate parsed data
 */
async function validateData() {
    switchToStep(2);
    
    // Show progress
    document.getElementById('validationProgress').classList.remove('hidden');
    document.getElementById('validationResults').classList.add('hidden');
    
    try {
        // For client-side validation (since we can't call Supabase directly from browser)
        // We'll do basic validation here and full validation on server
        validationResult = performClientValidation(parsedData);
        
        // Display validation results
        displayValidationResults(validationResult);
        
    } catch (error) {
        console.error('Validation error:', error);
        showAlert('Validation failed: ' + error.message, 'error');
    } finally {
        document.getElementById('validationProgress').classList.add('hidden');
        document.getElementById('validationResults').classList.remove('hidden');
    }
}

/**
 * Perform client-side validation
 */
function performClientValidation(data) {
    const errors = [];
    const validCategories = [
        'pain-relief', 'antibiotics', 'vitamins', 'diabetes-care',
        'digestive-health', 'allergy-relief', 'respiratory',
        'mental-health', 'first-aid', 'personal-care'
    ];
    const validDeliveryMethods = ['standard', 'express', 'special'];
    const productCodes = new Set();
    
    data.forEach((row, index) => {
        const rowNum = index + 2; // Account for header row
        
        // Required fields
        if (!row.product_code) {
            errors.push({
                row: rowNum,
                field: 'product_code',
                message: 'Product code is required'
            });
        } else if (productCodes.has(row.product_code)) {
            errors.push({
                row: rowNum,
                field: 'product_code',
                message: 'Duplicate product code'
            });
        }
        productCodes.add(row.product_code);
        
        if (!row.name_en) {
            errors.push({
                row: rowNum,
                field: 'name_en',
                message: 'English name is required'
            });
        }
        
        if (!row.name_ar) {
            errors.push({
                row: rowNum,
                field: 'name_ar',
                message: 'Arabic name is required'
            });
        }
        
        if (!row.price_per_unit || row.price_per_unit <= 0) {
            errors.push({
                row: rowNum,
                field: 'price_per_unit',
                message: 'Price must be greater than 0'
            });
        }
        
        if (!row.seller_code) {
            errors.push({
                row: rowNum,
                field: 'seller_code',
                message: 'Seller code is required'
            });
        }
        
        // Category validation
        if (row.category && !validCategories.includes(row.category)) {
            errors.push({
                row: rowNum,
                field: 'category',
                message: 'Invalid category'
            });
        }
        
        // Delivery method validation
        if (row.delivery_method && !validDeliveryMethods.includes(row.delivery_method)) {
            errors.push({
                row: rowNum,
                field: 'delivery_method',
                message: 'Invalid delivery method'
            });
        }
    });
    
    return {
        totalRows: data.length,
        validRows: data.length - [...new Set(errors.map(e => e.row))].length,
        errors: errors,
        preview: data.slice(0, 5)
    };
}

/**
 * Display validation results
 */
function displayValidationResults(result) {
    // Update summary cards
    document.getElementById('totalRows').textContent = result.totalRows;
    document.getElementById('validRows').textContent = result.validRows;
    document.getElementById('errorCount').textContent = result.errors.length;
    document.getElementById('importCount').textContent = result.validRows;
    
    // Display errors if any
    if (result.errors.length > 0) {
        const errorTableBody = document.getElementById('errorTableBody');
        errorTableBody.innerHTML = '';
        
        result.errors.forEach(error => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-red-50';
            row.innerHTML = `
                <td class="px-4 py-2">${error.row}</td>
                <td class="px-4 py-2">${error.field}</td>
                <td class="px-4 py-2">${error.message}</td>
            `;
            errorTableBody.appendChild(row);
        });
        
        document.getElementById('errorList').classList.remove('hidden');
    } else {
        document.getElementById('errorList').classList.add('hidden');
    }
    
    // Display preview
    if (result.preview && result.preview.length > 0) {
        displayPreview(result.preview);
    }
    
    // Enable/disable import button based on validation
    if (result.validRows > 0 && result.errors.length === 0) {
        document.getElementById('proceedToImport').disabled = false;
    } else {
        document.getElementById('proceedToImport').disabled = true;
    }
}

/**
 * Display data preview
 */
function displayPreview(data) {
    const headers = Object.keys(data[0]);
    const previewHeaders = document.getElementById('previewHeaders');
    const previewBody = document.getElementById('previewBody');
    
    // Clear existing content
    previewHeaders.innerHTML = '';
    previewBody.innerHTML = '';
    
    // Add headers
    headers.slice(0, 5).forEach(header => {
        const th = document.createElement('th');
        th.className = 'px-4 py-2 text-left text-xs';
        th.textContent = header;
        previewHeaders.appendChild(th);
    });
    
    // Add preview rows
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';
        
        headers.slice(0, 5).forEach(header => {
            const td = document.createElement('td');
            td.className = 'px-4 py-2 text-xs';
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        
        previewBody.appendChild(tr);
    });
}

/**
 * Start import process
 */
async function startImport() {
    if (!parsedData || parsedData.length === 0) {
        showAlert('No data to import', 'error');
        return;
    }
    
    // Hide actions, show progress
    document.getElementById('importActions').classList.add('hidden');
    document.getElementById('importProgress').classList.remove('hidden');
    
    try {
        // Simulate import progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            updateProgress(progress);
            
            if (progress >= 90) {
                clearInterval(progressInterval);
            }
        }, 200);
        
        // In a real implementation, this would call the API
        // For now, we'll simulate the import
        const result = await simulateImport(parsedData);
        
        clearInterval(progressInterval);
        updateProgress(100);
        
        // Display results
        displayImportResults(result);
        
    } catch (error) {
        console.error('Import error:', error);
        showAlert('Import failed: ' + error.message, 'error');
        document.getElementById('importActions').classList.remove('hidden');
        document.getElementById('importProgress').classList.add('hidden');
    }
}

/**
 * Simulate import (replace with actual API call)
 */
async function simulateImport(data) {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
        success: true,
        totalRows: data.length,
        successCount: data.length,
        errorCount: 0,
        errors: [],
        report: `Import Report\n=============\n\nTotal Rows Processed: ${data.length}\nSuccessfully Imported: ${data.length}\nErrors: 0\n\nAll products imported successfully!`
    };
}

/**
 * Display import results
 */
function displayImportResults(result) {
    document.getElementById('importProgress').classList.add('hidden');
    document.getElementById('importResults').classList.remove('hidden');
    
    const alertDiv = document.getElementById('importResultAlert');
    const title = document.getElementById('importResultTitle');
    const message = document.getElementById('importResultMessage');
    
    if (result.success) {
        alertDiv.className = 'mb-6 p-4 rounded-lg bg-green-50 border border-green-200';
        title.className = 'font-semibold mb-2 text-green-700';
        title.textContent = '✅ Import Successful';
        message.textContent = `Successfully imported ${result.successCount} products`;
    } else {
        alertDiv.className = 'mb-6 p-4 rounded-lg bg-red-50 border border-red-200';
        title.className = 'font-semibold mb-2 text-red-700';
        title.textContent = '❌ Import Failed';
        message.textContent = `Import failed with ${result.errorCount} errors`;
    }
    
    // Display report
    document.getElementById('reportContent').textContent = result.report;
    
    // Save to recent jobs
    saveToRecentJobs(result);
    loadRecentJobs();
}

/**
 * Update progress bar
 */
function updateProgress(percent) {
    document.getElementById('progressPercent').textContent = percent + '%';
    document.getElementById('progressBar').style.width = percent + '%';
    
    if (percent < 30) {
        document.getElementById('progressMessage').textContent = 'Validating data...';
    } else if (percent < 60) {
        document.getElementById('progressMessage').textContent = 'Processing products...';
    } else if (percent < 90) {
        document.getElementById('progressMessage').textContent = 'Saving to database...';
    } else {
        document.getElementById('progressMessage').textContent = 'Finalizing import...';
    }
}

/**
 * Switch to step
 */
function switchToStep(step) {
    currentStep = step;
    
    // Update step indicators
    document.querySelectorAll('[id^="step"]').forEach((el, index) => {
        if (index + 1 <= step) {
            el.classList.remove('opacity-50');
            el.querySelector('div').classList.remove('bg-gray-300');
            el.querySelector('div').classList.add('bg-blue-500');
            el.querySelector('span').classList.remove('text-gray-500');
        } else {
            el.classList.add('opacity-50');
            el.querySelector('div').classList.remove('bg-blue-500');
            el.querySelector('div').classList.add('bg-gray-300');
            el.querySelector('span').classList.add('text-gray-500');
        }
    });
    
    // Show/hide sections
    document.getElementById('uploadSection').classList.toggle('hidden', step !== 1);
    document.getElementById('validationSection').classList.toggle('hidden', step !== 2);
    document.getElementById('importSection').classList.toggle('hidden', step !== 3);
}

/**
 * Reset import process
 */
function resetImport() {
    uploadedFile = null;
    parsedData = [];
    validationResult = null;
    
    // Reset UI
    removeFile();
    document.getElementById('importResults').classList.add('hidden');
    document.getElementById('importActions').classList.remove('hidden');
    document.getElementById('confirmImport').checked = false;
    document.getElementById('startImport').disabled = true;
    
    switchToStep(1);
}

/**
 * Save to recent jobs
 */
function saveToRecentJobs(result) {
    const jobs = JSON.parse(localStorage.getItem('importJobs') || '[]');
    
    jobs.unshift({
        date: new Date().toISOString(),
        filename: uploadedFile?.name || 'Unknown',
        status: result.success ? 'Success' : 'Failed',
        imported: result.successCount,
        errors: result.errorCount
    });
    
    // Keep only last 10 jobs
    if (jobs.length > 10) {
        jobs.length = 10;
    }
    
    localStorage.setItem('importJobs', JSON.stringify(jobs));
}

/**
 * Load recent jobs
 */
function loadRecentJobs() {
    const jobs = JSON.parse(localStorage.getItem('importJobs') || '[]');
    const tbody = document.getElementById('jobsTableBody');
    
    if (jobs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                    No import jobs yet
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    jobs.forEach(job => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const date = new Date(job.date);
        const statusClass = job.status === 'Success' ? 'text-green-600' : 'text-red-600';
        const statusIcon = job.status === 'Success' ? '✅' : '❌';
        
        row.innerHTML = `
            <td class="px-4 py-2 text-sm">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
            <td class="px-4 py-2 text-sm">${job.filename}</td>
            <td class="px-4 py-2 text-sm ${statusClass}">${statusIcon} ${job.status}</td>
            <td class="px-4 py-2 text-sm">${job.imported}</td>
            <td class="px-4 py-2 text-sm">${job.errors}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    // Create alert element
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
    
    // Remove after 3 seconds
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}