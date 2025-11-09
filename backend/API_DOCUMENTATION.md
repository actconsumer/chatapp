# Project Chat API Documentation

## Base URL

```
Production:  https://project-chat.azurewebsites.net/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "displayName": "John Doe"
}
```

**Validation Rules:**
- `email`: Valid email format, unique
- `username`: 3-30 characters, alphanumeric, unique
- `password`: Minimum 8 characters
- `displayName`: 1-50 characters

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe",
      "isEmailVerified": false,
      "isOnline": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors, email/username already exists
- `500 Internal Server Error`: Server error

---

### Login User

Authenticate user and receive JWT tokens.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatar": "https://projectchatstorage.blob.core.windows.net/avatars/...",
      "isEmailVerified": true,
      "isOnline": true,
      "lastSeen": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Validation errors

---

### Logout User

Logout user and invalidate refresh token.

**Endpoint:** `POST /auth/logout`

**Authentication:** Required

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Refresh Access Token

Get new access token using refresh token.

**Endpoint:** `POST /auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired refresh token

---

### Verify Email

Verify email address with OTP code.

**Endpoint:** `POST /auth/verify-email`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

**Validation:**
- `otpCode`: Exactly 6 digits

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired OTP, too many attempts

---

### Resend Verification Email

Request new verification OTP.

**Endpoint:** `POST /auth/resend-verification`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

**Rate Limit:** 3 requests per hour

---

### Forgot Password

Request password reset OTP.

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

**Note:** Always returns success even if email doesn't exist (security measure)

**Rate Limit:** 3 requests per hour

---

### Reset Password

Reset password using OTP code.

**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456",
  "newPassword": "NewSecurePass123!"
}
```

**Validation:**
- `newPassword`: Minimum 8 characters

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Note:** All existing refresh tokens are invalidated after password reset

---

### Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /auth/me`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatar": "https://...",
      "bio": "Software Developer",
      "isEmailVerified": true,
      "isOnline": true,
      "lastSeen": "2024-01-01T00:00:00.000Z",
      "privacySettings": {
        "showOnlineStatus": true,
        "showLastSeen": true,
        "showProfilePhoto": "everyone"
      }
    }
  }
}
```

---

## User Endpoints (Coming Soon)

### Get User Profile

**Endpoint:** `GET /users/:userId`

### Update Profile

**Endpoint:** `PUT /users/:userId`

### Upload Avatar

**Endpoint:** `POST /users/:userId/avatar`

### Search Users

**Endpoint:** `GET /users/search?q=john`

---

## Chat Endpoints (Coming Soon)

### Get Chats

**Endpoint:** `GET /chats`

### Get Chat by ID

**Endpoint:** `GET /chats/:chatId`

### Create Direct Chat

**Endpoint:** `POST /chats/direct`

### Create Group Chat

**Endpoint:** `POST /chats/group`

### Delete Chat

**Endpoint:** `DELETE /chats/:chatId`

---

## Message Endpoints (Coming Soon)

### Get Messages

**Endpoint:** `GET /messages?chatId=xxx&limit=50&before=timestamp`

### Send Message

**Endpoint:** `POST /messages`

### Edit Message

**Endpoint:** `PUT /messages/:messageId`

### Delete Message

**Endpoint:** `DELETE /messages/:messageId`

### React to Message

**Endpoint:** `POST /messages/:messageId/reactions`

---

## Media Upload Endpoints (Coming Soon)

### Upload Image

**Endpoint:** `POST /media/upload/image`

**Content-Type:** `multipart/form-data`

### Upload Video

**Endpoint:** `POST /media/upload/video`

### Upload File

**Endpoint:** `POST /media/upload/file`

---

## Story Endpoints (Coming Soon)

### Get Active Stories

**Endpoint:** `GET /stories/active`

### Create Story

**Endpoint:** `POST /stories`

### View Story

**Endpoint:** `POST /stories/:storyId/view`

### Delete Story

**Endpoint:** `DELETE /stories/:storyId`

---

## WebSocket Events (SignalR)

### Connect

```javascript
const socket = io('https://project-chat.azurewebsites.net', {
  auth: {
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

### Events

#### Send Message
```javascript
socket.emit('send_message', {
  chatId: 'chat-id',
  text: 'Hello!',
  type: 'text'
});
```

#### Receive Message
```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

#### Typing Indicator
```javascript
// Start typing
socket.emit('typing_start', { chatId: 'chat-id' });

// Stop typing
socket.emit('typing_stop', { chatId: 'chat-id' });

// Listen for typing
socket.on('user_typing', ({ chatId, userId }) => {
  console.log(`User ${userId} is typing in chat ${chatId}`);
});
```

#### Online Status
```javascript
// User comes online
socket.on('user_online', ({ userId }) => {
  console.log(`User ${userId} is online`);
});

// User goes offline
socket.on('user_offline', ({ userId, lastSeen }) => {
  console.log(`User ${userId} went offline at ${lastSeen}`);
});
```

---

## Rate Limits

| Endpoint Type | Rate Limit |
|--------------|------------|
| General API | 100 requests per 15 minutes |
| Authentication | 5 requests per 15 minutes |
| OTP/Verification | 3 requests per hour |
| File Upload | 10 requests per minute |

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Postman Collection

Import the Postman collection for easy testing:

[Download Postman Collection](./postman-collection.json)

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_BASE_URL = 'https://project-chat.azurewebsites.net/api/v1';

// Register
const register = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
  return response.data;
};

// Login
const login = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    password
  });
  
  // Store tokens
  localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
  localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
  
  return response.data;
};

// Authenticated request
const getProfile = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.get(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
```

---

## Support

For API support, contact:
- Email: api-support@project-chat.com
- Documentation: https://docs.project-chat.com
- Status Page: https://status.project-chat.com
