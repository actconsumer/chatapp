# 🚀 Quick Start Guide - Project Chat Backend

## 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
cd backend
npm install
```

### Step 2: Configure Environment (2 min)

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your values (or use defaults for local development):

```env
# For local development, you can use these simplified settings:
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-in-production

# Optional: Configure Azure services later
# COSMOS_ENDPOINT=https://your-cosmosdb.documents.azure.com:443/
# COSMOS_KEY=your-key
```

### Step 3: Start Development Server (1 min)

```bash
npm run dev
```

You should see:

```
╔════════════════════════════════════════════════════════════╗
║   🎯 PROJECT CHAT BACKEND - Production Ready              ║
║   📍 Server:        http://localhost:3000                 ║
║   🌐 API Version:   v1                                    ║
╚════════════════════════════════════════════════════════════╝
```

### Step 4: Test API (1 min)

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "v1"
}
```

---

## Test Authentication

### Register a User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!",
    "displayName": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Save the `accessToken` from the response.

### Get Current User

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Production Deployment to Azure

### Prerequisites

- Azure account
- Azure CLI installed

### Quick Deploy (10 minutes)

```bash
# 1. Login to Azure
az login

# 2. Create resource group
az group create --name project-chat-rg --location eastus

# 3. Create Cosmos DB (takes ~5 min)
az cosmosdb create \
  --name project-chat-cosmosdb \
  --resource-group project-chat-rg

# 4. Create Storage Account
az storage account create \
  --name projectchatstorage \
  --resource-group project-chat-rg

# 5. Create Redis Cache
az redis create \
  --name project-chat-redis \
  --resource-group project-chat-rg \
  --sku Basic

# 6. Create App Service
az webapp up \
  --name project-chat-api \
  --resource-group project-chat-rg \
  --runtime "NODE|18-lts"

# 7. Configure environment variables
az webapp config appsettings set \
  --name project-chat-api \
  --resource-group project-chat-rg \
  --settings NODE_ENV=production \
             JWT_SECRET="your-secret-key"
```

Your API is now live at: `https://project-chat-api.azurewebsites.net`

---

## Project Structure

```
backend/
├── src/
│   ├── domain/              # Business entities & rules
│   │   ├── entities/        # User, Message, Chat, Story, OTP
│   │   └── repositories/    # Repository interfaces
│   │
│   ├── application/         # Application logic
│   │   ├── services/        # AuthService, ChatService
│   │   ├── controllers/     # HTTP handlers
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   └── routes/          # API routes
│   │
│   ├── infrastructure/      # External services
│   │   ├── database/        # Cosmos DB
│   │   ├── storage/         # Blob Storage
│   │   ├── cache/           # Redis
│   │   └── repositories/    # Repository implementations
│   │
│   ├── utils/               # Utilities
│   │   ├── logger.ts        # Logging
│   │   ├── jwt.ts           # JWT handling
│   │   ├── encryption.ts    # Encryption
│   │   └── email.ts         # Email service
│   │
│   └── server.ts            # Express app
│
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── .env.example             # Environment template
├── README.md                # Full documentation
├── API_DOCUMENTATION.md     # API reference
└── AZURE_DEPLOYMENT.md      # Azure deployment guide
```

---

## Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

---

## API Endpoints Summary

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh-token` - Refresh token
- `POST /api/v1/auth/verify-email` - Verify email
- `POST /api/v1/auth/forgot-password` - Forgot password
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user

### Coming Soon
- User management
- Chat operations
- Message handling
- Media upload
- Stories
- Real-time WebSocket events

---

## Environment Variables

### Required for Development

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret
```

### Required for Production

```env
NODE_ENV=production
COSMOS_ENDPOINT=https://your-cosmosdb.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DATABASE_NAME=ProjectChatDB
AZURE_STORAGE_CONNECTION_STRING=your-storage-connection
REDIS_HOST=your-redis.redis.cache.windows.net
REDIS_PASSWORD=your-redis-password
JWT_SECRET=your-super-secure-jwt-secret
EMAIL_FROM=noreply@your-domain.com
```

---

## Common Issues

### Issue: Dependencies not installing

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors

**Solution:**
```bash
npm run build
```
Check `tsconfig.json` settings.

### Issue: Port already in use

**Solution:**
Change `PORT` in `.env` file or:
```bash
PORT=3001 npm run dev
```

### Issue: Azure connection fails

**Solution:**
1. Check Azure credentials in `.env`
2. Verify Azure services are running
3. Check firewall rules
4. Review Azure service logs

---

## Next Steps

1. ✅ **You're Running!** - Backend is operational
2. 📱 **Connect Frontend** - Update React Native service files
3. 🔐 **Test Auth Flow** - Register, login, verify email
4. 💬 **Add Chat Features** - Implement messaging endpoints
5. 🚀 **Deploy to Azure** - Go production with Azure
6. 📊 **Monitor** - Setup Application Insights
7. 🔄 **CI/CD** - Automate with GitHub Actions

---

## Support & Resources

- 📖 **Full Documentation**: See `README.md`
- 🔌 **API Reference**: See `API_DOCUMENTATION.md`
- ☁️ **Azure Guide**: See `AZURE_DEPLOYMENT.md`
- 📝 **Summary**: See `IMPLEMENTATION_SUMMARY.md`

---

## Quick Commands Reference

```bash
# Start development
npm run dev

# Build production
npm run build && npm start

# Deploy to Azure
az webapp up --name your-app --resource-group your-rg

# View logs
npm run dev | tail -f

# Test endpoint
curl http://localhost:3000/health

# Check Azure status
az webapp show --name your-app --resource-group your-rg
```

---

## 🎉 You're Ready!

Your production-grade backend is configured and ready to handle:
- ✅ User authentication
- ✅ Email verification
- ✅ Password management
- ✅ Secure JWT tokens
- ✅ Rate limiting
- ✅ Azure integration
- ✅ Scalable architecture

**Happy Coding! 🚀**
