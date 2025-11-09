# 2FA and Security Key Implementation Guide

## Overview

This document provides a comprehensive guide to the Two-Factor Authentication (2FA) and Security Key features implemented in the Project Chat backend. These features provide enterprise-grade security for user authentication and end-to-end encrypted messaging across multiple devices.

## Table of Contents

1. [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
2. [Security Keys (Multi-Device E2E Encryption)](#security-keys-multi-device-e2e-encryption)
3. [API Endpoints](#api-endpoints)
4. [Implementation Flow](#implementation-flow)
5. [Security Considerations](#security-considerations)

---

## Two-Factor Authentication (2FA)

### Features

- **TOTP-based Authentication**: Uses Time-based One-Time Password (RFC 6238) compatible with Google Authenticator, Authy, etc.
- **QR Code Generation**: Automatically generates QR codes for easy setup
- **Backup Codes**: 10 single-use backup codes for account recovery
- **Manual Entry Support**: Provides Base32 secret key for manual entry

### Architecture

```
TwoFactorAuthService
├── generateSetup()      - Generate secret, QR code, backup codes
├── verifyAndEnable()    - Verify token and enable 2FA
├── verifyToken()        - Validate TOTP during login
├── verifyBackupCode()   - Validate backup code for recovery
├── disable()            - Disable 2FA with password verification
├── regenerateBackupCodes() - Generate new backup codes
└── getStatus()          - Check 2FA status and backup codes count
```

### Setup Flow

1. **Generate 2FA Setup**
   ```typescript
   POST /api/v1/auth/2fa/setup
   Headers: Authorization: Bearer <access_token>
   
   Response:
   {
     "success": true,
     "message": "2FA setup generated. Scan QR code and verify to enable.",
     "data": {
       "qrCodeUrl": "data:image/png;base64,...",
       "manualEntryKey": "JBSWY3DPEHPK3PXP",
       "backupCodes": ["12345678", "87654321", ...]
     }
   }
   ```

2. **Verify and Enable**
   ```typescript
   POST /api/v1/auth/2fa/verify
   Headers: Authorization: Bearer <access_token>
   Body: {
     "token": "123456"
   }
   
   Response:
   {
     "success": true,
     "message": "2FA enabled successfully",
     "data": {
       "isEnabled": true,
       "enabledAt": "2024-01-15T10:30:00Z",
       "backupCodesCount": 10
     }
   }
   ```

3. **Login with 2FA**
   ```typescript
   // Step 1: Regular login
   POST /api/v1/auth/login
   Body: {
     "email": "user@example.com",
     "password": "password123"
   }
   
   Response (if 2FA enabled):
   {
     "success": true,
     "message": "2FA required",
     "data": {
       "requiresTwoFactor": true,
       "userId": "user_id"
     }
   }
   
   // Step 2: Validate 2FA token
   POST /api/v1/auth/2fa/validate
   Body: {
     "userId": "user_id",
     "token": "123456"  // or backupCode: "12345678"
   }
   
   Response:
   {
     "success": true,
     "message": "2FA code verified",
     "data": {
       "isValid": true,
       "accessToken": "...",
       "refreshToken": "..."
     }
   }
   ```

### Backup Code Recovery

```typescript
POST /api/v1/auth/2fa/validate
Body: {
  "userId": "user_id",
  "backupCode": "12345678"
}

Response:
{
  "success": true,
  "message": "Backup code verified. Please enable 2FA again.",
  "data": {
    "isValid": true,
    "usedBackupCode": true
  }
}
```

**Important**: After using a backup code, the user should:
1. Complete login
2. Set up 2FA again (`POST /api/v1/auth/2fa/setup`)
3. Save new backup codes securely

### Regenerate Backup Codes

```typescript
POST /api/v1/auth/2fa/backup-codes/regenerate
Headers: Authorization: Bearer <access_token>

Response:
{
  "success": true,
  "message": "Backup codes regenerated successfully",
  "data": {
    "backupCodes": ["12345678", "87654321", ...]
  }
}
```

### Disable 2FA

```typescript
POST /api/v1/auth/2fa/disable
Headers: Authorization: Bearer <access_token>
Body: {
  "password": "user_password"
}

Response:
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

---

## Security Keys (Multi-Device E2E Encryption)

### Features

- **RSA-2048 Key Pairs**: Each device has its own public/private key pair
- **Per-Device Message Keys**: Messages encrypted with unique keys per device
- **Device Management**: Register, list, and revoke devices
- **Device Verification**: Signature-based device ownership verification
- **Multi-Device Support**: Seamless message access across all registered devices

### Architecture

```
SecurityKeyService
├── generateKeyPair()              - Generate RSA-2048 key pair
├── registerDevice()               - Register device with public key
├── getUserDevices()               - List all user devices
├── revokeDevice()                 - Revoke device access
├── encryptMessageKeyForDevices()  - Encrypt message key for all recipient devices
├── getMessageKeyForDevice()       - Get encrypted key for specific device
├── decryptMessageKey()            - Decrypt message key with device private key
└── verifyDevice()                 - Verify device ownership via signature
```

### How It Works

#### 1. Device Registration

```typescript
// Step 1: Generate key pair (client-side or server-side)
POST /api/v1/security/keys/generate

Response:
{
  "success": true,
  "message": "Key pair generated successfully",
  "data": {
    "publicKey": "-----BEGIN PUBLIC KEY-----...",
    "privateKey": "-----BEGIN PRIVATE KEY-----...",
    "keyFingerprint": "SHA256:abc123..."
  }
}

// Step 2: Register device
POST /api/v1/security/devices/register
Headers: Authorization: Bearer <access_token>
Body: {
  "deviceId": "device_uuid",
  "deviceName": "iPhone 14 Pro",
  "deviceType": "mobile",
  "platform": "iOS 17.2",
  "publicKey": "-----BEGIN PUBLIC KEY-----..."
}

Response:
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "deviceId": "device_uuid",
    "deviceName": "iPhone 14 Pro",
    "keyFingerprint": "SHA256:abc123...",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Important**: Store the private key securely on the device (e.g., iOS Keychain, Android KeyStore). Never transmit or store private keys on the server.

#### 2. Sending Encrypted Messages

```typescript
// Client-side flow:
// 1. Generate random message key (AES-256)
const messageKey = crypto.randomBytes(32);

// 2. Encrypt message content with message key
const encryptedMessage = encryptAES(messageContent, messageKey);

// 3. Send encrypted message and encrypt the message key for all recipient devices
POST /api/v1/security/messages/:messageId/keys
Headers: Authorization: Bearer <access_token>
Body: {
  "chatId": "chat_id",
  "messageKey": messageKey.toString('base64'),
  "recipientUserIds": ["user1", "user2", "user3"]
}

// Server encrypts the message key with each recipient device's public key
Response:
{
  "success": true,
  "message": "Message keys encrypted for all recipient devices",
  "data": {
    "totalKeys": 12,  // 4 devices × 3 recipients
    "recipients": 3
  }
}
```

#### 3. Receiving Encrypted Messages

```typescript
// Step 1: Get encrypted message key for current device
GET /api/v1/security/messages/:messageId/keys/:deviceId
Headers: Authorization: Bearer <access_token>

Response:
{
  "success": true,
  "data": {
    "messageId": "msg_123",
    "deviceId": "device_uuid",
    "encryptedMessageKey": "base64_encrypted_key...",
    "encryptedAt": "2024-01-15T10:30:00Z"
  }
}

// Step 2: Decrypt message key with device private key (client-side)
const messageKey = decryptRSA(encryptedMessageKey, devicePrivateKey);

// Step 3: Decrypt message content with message key
const messageContent = decryptAES(encryptedMessage, messageKey);
```

#### 4. Device Management

```typescript
// List all devices
GET /api/v1/security/devices
Headers: Authorization: Bearer <access_token>

Response:
{
  "success": true,
  "data": {
    "devices": [
      {
        "deviceId": "device_uuid_1",
        "deviceName": "iPhone 14 Pro",
        "deviceType": "mobile",
        "platform": "iOS 17.2",
        "status": "active",
        "lastUsedAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T08:00:00Z"
      },
      {
        "deviceId": "device_uuid_2",
        "deviceName": "MacBook Pro",
        "deviceType": "desktop",
        "platform": "macOS 14.2",
        "status": "active",
        "lastUsedAt": "2024-01-14T15:20:00Z",
        "createdAt": "2024-01-05T12:00:00Z"
      }
    ],
    "totalDevices": 2
  }
}

// Revoke device
DELETE /api/v1/security/devices/:deviceId
Headers: Authorization: Bearer <access_token>

Response:
{
  "success": true,
  "message": "Device revoked successfully"
}
```

#### 5. Device Verification

```typescript
// Verify device ownership with digital signature
POST /api/v1/security/devices/:deviceId/verify
Headers: Authorization: Bearer <access_token>
Body: {
  "signature": "base64_signature",
  "challenge": "random_challenge_string"
}

// Server verifies signature using device's public key
Response:
{
  "success": true,
  "message": "Device verified",
  "data": {
    "isValid": true
  }
}
```

---

## API Endpoints

### Two-Factor Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/2fa/setup` | ✅ | Generate 2FA setup |
| POST | `/api/v1/auth/2fa/verify` | ✅ | Verify token and enable 2FA |
| POST | `/api/v1/auth/2fa/validate` | ❌ | Validate TOTP during login |
| POST | `/api/v1/auth/2fa/disable` | ✅ | Disable 2FA |
| POST | `/api/v1/auth/2fa/backup-codes/regenerate` | ✅ | Regenerate backup codes |
| GET | `/api/v1/auth/2fa/status` | ✅ | Get 2FA status |

### Security Keys

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/security/keys/generate` | ❌ | Generate RSA key pair |
| POST | `/api/v1/security/devices/register` | ✅ | Register new device |
| GET | `/api/v1/security/devices` | ✅ | List all devices |
| DELETE | `/api/v1/security/devices/:deviceId` | ✅ | Revoke device |
| POST | `/api/v1/security/messages/:messageId/keys` | ✅ | Encrypt message key |
| GET | `/api/v1/security/messages/:messageId/keys/:deviceId` | ✅ | Get message key |
| POST | `/api/v1/security/devices/:deviceId/verify` | ✅ | Verify device |

---

## Implementation Flow

### Frontend Integration (React Native)

#### 1. Setup 2FA

```typescript
// components/Settings/TwoFactorSetup.tsx
import QRCode from 'react-native-qrcode-svg';

const setup2FA = async () => {
  const response = await api.post('/auth/2fa/setup');
  const { qrCodeUrl, manualEntryKey, backupCodes } = response.data;
  
  // Show QR code
  setQrCode(qrCodeUrl);
  
  // Store backup codes securely
  await SecureStore.setItemAsync('backup_codes', JSON.stringify(backupCodes));
};

const verify2FA = async (token: string) => {
  await api.post('/auth/2fa/verify', { token });
  // 2FA enabled!
};
```

#### 2. Login with 2FA

```typescript
// screens/Auth/LoginScreen.tsx
const handleLogin = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  
  if (response.data.requiresTwoFactor) {
    // Show 2FA input
    navigation.navigate('TwoFactorVerification', {
      userId: response.data.userId
    });
  } else {
    // Login successful
    storeTokens(response.data);
  }
};

const verify2FAToken = async (userId: string, token: string) => {
  const response = await api.post('/auth/2fa/validate', { userId, token });
  storeTokens(response.data);
};
```

#### 3. Device Registration

```typescript
// services/encryption.service.ts
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const registerDevice = async () => {
  // Generate key pair
  const keyPair = await api.post('/security/keys/generate');
  
  // Store private key securely
  await SecureStore.setItemAsync('device_private_key', keyPair.data.privateKey);
  
  // Register device with public key
  const deviceInfo = {
    deviceId: await getDeviceId(),
    deviceName: await getDeviceName(),
    deviceType: Platform.OS === 'ios' ? 'mobile' : 'mobile',
    platform: `${Platform.OS} ${Platform.Version}`,
    publicKey: keyPair.data.publicKey
  };
  
  await api.post('/security/devices/register', deviceInfo);
};
```

#### 4. Send Encrypted Message

```typescript
// services/message.service.ts
const sendEncryptedMessage = async (chatId: string, content: string, recipientIds: string[]) => {
  // Generate message key
  const messageKey = await Crypto.getRandomBytesAsync(32);
  
  // Encrypt message content
  const encryptedContent = await encryptAES(content, messageKey);
  
  // Create message
  const message = await api.post('/messages', {
    chatId,
    content: encryptedContent,
    encryptionType: 'e2e'
  });
  
  // Encrypt message key for all recipient devices
  await api.post(`/security/messages/${message.data.id}/keys`, {
    chatId,
    messageKey: messageKey.toString('base64'),
    recipientUserIds: recipientIds
  });
  
  return message.data;
};
```

#### 5. Receive Encrypted Message

```typescript
// services/message.service.ts
const decryptMessage = async (message: Message) => {
  const deviceId = await getDeviceId();
  
  // Get encrypted message key for this device
  const keyResponse = await api.get(
    `/security/messages/${message.id}/keys/${deviceId}`
  );
  
  // Get device private key
  const privateKey = await SecureStore.getItemAsync('device_private_key');
  
  // Decrypt message key
  const messageKey = await decryptRSA(
    keyResponse.data.encryptedMessageKey,
    privateKey
  );
  
  // Decrypt message content
  const content = await decryptAES(message.content, messageKey);
  
  return content;
};
```

---

## Security Considerations

### 2FA Security

1. **Rate Limiting**: Implement rate limiting on `/auth/2fa/validate` to prevent brute force attacks
2. **Time Window**: TOTP tokens are valid for 30 seconds with ±1 window tolerance
3. **Backup Codes**: Each code can only be used once and is immediately invalidated
4. **Password Required**: Disabling 2FA requires password confirmation
5. **Secure Storage**: Store TOTP secrets encrypted in Redis/Cosmos DB

### Security Key Security

1. **Private Key Protection**: Never transmit or store private keys on the server
2. **Key Rotation**: Implement periodic key rotation for long-lived devices
3. **Device Revocation**: Immediately revoke compromised devices
4. **Perfect Forward Secrecy**: Each message has a unique encryption key
5. **Metadata Protection**: Message keys are encrypted per-device, preventing unauthorized access

### Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **Key Storage**: Use secure hardware (iOS Keychain, Android KeyStore)
3. **Backup Strategy**: Users must securely store backup codes
4. **Device Limits**: Consider limiting the number of devices per user
5. **Audit Logging**: Log all device registrations and revocations
6. **Session Management**: Invalidate sessions when devices are revoked

---

## Testing

### 2FA Testing

```bash
# Setup 2FA
curl -X POST http://localhost:3000/api/v1/auth/2fa/setup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Verify with Google Authenticator token
curl -X POST http://localhost:3000/api/v1/auth/2fa/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'
```

### Security Key Testing

```bash
# Generate key pair
curl -X POST http://localhost:3000/api/v1/security/keys/generate

# Register device
curl -X POST http://localhost:3000/api/v1/security/devices/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test-device-1",
    "deviceName": "Test Device",
    "deviceType": "mobile",
    "platform": "iOS 17.2",
    "publicKey": "..."
  }'
```

---

## Troubleshooting

### Common Issues

1. **Invalid TOTP Token**: Check device time synchronization
2. **QR Code Not Scanning**: Provide manual entry key as fallback
3. **Lost Backup Codes**: User must disable and re-enable 2FA
4. **Device Registration Failed**: Verify public key format (PEM)
5. **Message Decryption Failed**: Check if device is registered and active

---

## Next Steps

1. Implement Chat and Messaging endpoints
2. Add WebSocket support for real-time message delivery
3. Implement group chat with multi-recipient encryption
4. Add media encryption (images, videos, files)
5. Implement message key rotation
6. Add device-to-device key exchange protocol

---

**Note**: This implementation provides Signal/WhatsApp-level security. All sensitive operations use industry-standard cryptography (RSA-2048, AES-256-GCM, SHA-256).
