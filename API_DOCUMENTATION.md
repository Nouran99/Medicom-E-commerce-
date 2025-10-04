# Medicum Egypt API Documentation

## Base URL
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this structure:
```json
{
  "success": boolean,
  "message": string,
  "data": object | array (optional),
  "errors": array (optional)
}
```

## Authentication Endpoints

### Request OTP
**POST** `/api/auth/request-otp`

Request an OTP for authentication via SMS or email.

**Request Body:**
```json
{
  "identifier": "string", // Phone number or email
  "type": "sms" | "email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### Verify OTP
**POST** `/api/auth/verify-otp`

Verify the OTP and receive authentication token.

**Request Body:**
```json
{
  "identifier": "string", // Phone number or email
  "otp": "string" // 6-digit OTP
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string",
    "role": "customer" | "admin"
  }
}
```

### Get Current User
**GET** `/api/auth/me`

Get current authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string",
    "role": "customer" | "admin",
    "language": "ar" | "en"
  }
}
```

### Update Profile
**PUT** `/api/auth/profile`

Update user profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "string",
  "language": "ar" | "en",
  "notification_preferences": {
    "sms": boolean,
    "email": boolean,
    "whatsapp": boolean
  }
}
```

## Product Endpoints

### Get Products
**GET** `/api/products`

Get products with optional filtering and pagination.

**Query Parameters:**
- `category` (string): Filter by category ID
- `search` (string): Search in product names and descriptions
- `prescription` (boolean): Filter by prescription requirement
- `min_price` (number): Minimum price filter
- `max_price` (number): Maximum price filter
- `limit` (number): Number of products to return (default: 20, max: 100)
- `offset` (number): Number of products to skip (default: 0)
- `lang` (string): Language for localized content (ar|en, default: ar)

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "name_ar": "string",
      "name_en": "string",
      "description_ar": "string",
      "description_en": "string",
      "price": number,
      "prescription_required": boolean,
      "in_stock": boolean,
      "category": {
        "name_ar": "string",
        "name_en": "string"
      }
    }
  ],
  "total": number,
  "limit": number,
  "offset": number
}
```

### Get Product by ID
**GET** `/api/products/:id`

Get detailed information about a specific product.

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "name_ar": "string",
    "name_en": "string",
    "description_ar": "string",
    "description_en": "string",
    "price": number,
    "prescription_required": boolean,
    "in_stock": boolean,
    "category": {
      "name_ar": "string",
      "name_en": "string"
    },
    "provider": {
      "name_ar": "string",
      "name_en": "string"
    }
  }
}
```

### Get Categories
**GET** `/api/products/categories`

Get all product categories.

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "uuid",
      "name_ar": "string",
      "name_en": "string",
      "description_ar": "string",
      "description_en": "string"
    }
  ]
}
```

## Cart Endpoints

### Get Cart
**GET** `/api/cart`

Get current user's cart items.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "product_id": "uuid",
      "quantity": number,
      "product": {
        "name_ar": "string",
        "name_en": "string",
        "price": number
      }
    }
  ],
  "total": number
}
```

### Add to Cart
**POST** `/api/cart/add`

Add item to cart.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "product_id": "uuid",
  "quantity": number
}
```

### Update Cart Item
**PUT** `/api/cart/item/:productId`

Update quantity of item in cart.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "quantity": number
}
```

### Clear Cart
**DELETE** `/api/cart/clear`

Remove all items from cart.

**Headers:** `Authorization: Bearer <token>`

## Order Endpoints

### Create Order
**POST** `/api/orders/create`

Create a new order from cart items.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "delivery_method": "courier" | "pickup",
  "pickup_location_id": "uuid", // Required if delivery_method is "pickup"
  "delivery_address": {
    "street": "string",
    "city": "string",
    "governorate": "string",
    "postal_code": "string",
    "phone": "string"
  }, // Required if delivery_method is "courier"
  "payment_method": "cod" | "card" | "fawry" | "wallet",
  "notes": "string"
}
```

### Get Orders
**GET** `/api/orders`

Get user's order history.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "uuid",
      "status": "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled",
      "total": number,
      "created_at": "datetime",
      "items": [
        {
          "product_name": "string",
          "quantity": number,
          "price": number
        }
      ]
    }
  ]
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| AUTHENTICATION_ERROR | 401 | Authentication required |
| AUTHORIZATION_ERROR | 403 | Insufficient permissions |
| NOT_FOUND_ERROR | 404 | Resource not found |
| CONFLICT_ERROR | 409 | Resource conflict |
| RATE_LIMIT_ERROR | 429 | Rate limit exceeded |
| INTERNAL_ERROR | 500 | Internal server error |

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- Authentication endpoints: 5 requests per minute per IP
- General API endpoints: 100 requests per minute per user
- Admin endpoints: 200 requests per minute per admin user

## Pagination

List endpoints support pagination using `limit` and `offset` parameters:
- Default limit: 20 items
- Maximum limit: 100 items
- Use `offset` to skip items for pagination

Example: `/api/products?limit=20&offset=40` returns items 41-60.
