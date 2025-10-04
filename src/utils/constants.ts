// Authentication constants
export const AUTH_CONSTANTS = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
  JWT_EXPIRY_DAYS: 7,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
} as const;

// Pagination constants
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
} as const;

// Product constants
export const PRODUCT_CONSTANTS = {
  MAX_SEARCH_RESULTS: 50,
  FEATURED_PRODUCTS_LIMIT: 10,
  CATEGORIES_LIMIT: 20,
  MIN_SEARCH_LENGTH: 2,
} as const;

// Order constants
export const ORDER_CONSTANTS = {
  STATUSES: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  },
  PAYMENT_METHODS: {
    COD: 'cod',
    CARD: 'card',
    FAWRY: 'fawry',
    WALLET: 'wallet',
  },
  DELIVERY_METHODS: {
    COURIER: 'courier',
    PICKUP: 'pickup',
  },
} as const;

// Cart constants
export const CART_CONSTANTS = {
  MAX_QUANTITY_PER_ITEM: 10,
  MAX_ITEMS_IN_CART: 50,
  SESSION_EXPIRY_HOURS: 24,
} as const;

// File upload constants
export const UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  PRESCRIPTION_MAX_SIZE_MB: 5,
} as const;

// API response constants
export const API_RESPONSES = {
  SUCCESS: {
    CREATED: { success: true, message: 'Resource created successfully' },
    UPDATED: { success: true, message: 'Resource updated successfully' },
    DELETED: { success: true, message: 'Resource deleted successfully' },
    RETRIEVED: { success: true, message: 'Resource retrieved successfully' },
  },
  ERRORS: {
    UNAUTHORIZED: { success: false, message: 'Unauthorized access' },
    FORBIDDEN: { success: false, message: 'Access forbidden' },
    NOT_FOUND: { success: false, message: 'Resource not found' },
    VALIDATION_ERROR: { success: false, message: 'Validation error' },
    INTERNAL_ERROR: { success: false, message: 'Internal server error' },
    RATE_LIMITED: { success: false, message: 'Rate limit exceeded' },
  },
} as const;

// Notification constants
export const NOTIFICATION_CONSTANTS = {
  TYPES: {
    SMS: 'sms',
    EMAIL: 'email',
    WHATSAPP: 'whatsapp',
    PUSH: 'push',
  },
  TEMPLATES: {
    OTP_SMS: 'Your Medicum Egypt verification code is: {otp}. Valid for {minutes} minutes.',
    ORDER_CONFIRMED: 'Your order #{orderNumber} has been confirmed. Track it at {trackingUrl}',
    ORDER_SHIPPED: 'Your order #{orderNumber} has been shipped. Expected delivery: {deliveryDate}',
    PRESCRIPTION_APPROVED: 'Your prescription has been approved. You can now complete your order.',
    PRESCRIPTION_REJECTED: 'Your prescription requires review. Please contact support.',
  },
} as const;

// Database table names
export const TABLES = {
  USERS: 'users',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  CART_ITEMS: 'cart_items',
  PRESCRIPTIONS: 'prescriptions',
  OTPS: 'otps',
  PROVIDERS: 'providers',
  PICKUP_LOCATIONS: 'pickup_locations',
  INVENTORY: 'inventory',
  COUPONS: 'coupons',
  NOTIFICATIONS: 'notifications',
} as const;

// Language constants
export const LANGUAGES = {
  ARABIC: 'ar',
  ENGLISH: 'en',
  DEFAULT: 'ar',
} as const;

// Cache constants
export const CACHE_CONSTANTS = {
  TTL_SECONDS: {
    PRODUCTS: 300, // 5 minutes
    CATEGORIES: 600, // 10 minutes
    USER_PROFILE: 180, // 3 minutes
    CART: 60, // 1 minute
  },
  KEYS: {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    USER_CART: 'user_cart',
    USER_PROFILE: 'user_profile',
  },
} as const;
