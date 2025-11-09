# Story Posting - Quick Reference

## 🚀 Quick Start

### For Developers

**Backend Setup**:
```bash
cd backend
npm install
# Configure .env with Azure credentials
npm run dev
```

**Frontend Setup**:
```bash
npm install
npx expo start
```

## 📝 API Endpoints

### Create Story
```
POST /api/v1/stories
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "mediaUrl": "https://storage.azure.com/...",
  "mediaType": "image|video|text",
  "caption": "Optional caption",
  "backgroundColor": "#667eea",
  "duration": 10,
  "privacy": "friends"
}
```

### Upload Media
```
POST /api/v1/storage/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
file: <binary>
containerName: "stories"
```

### List Stories
```
GET /api/v1/stories
Authorization: Bearer <token>
```

### View Story
```
POST /api/v1/stories/:storyId/view
Authorization: Bearer <token>
```

## 💻 Frontend Usage

### Upload and Create Story

```typescript
import { blobStorageService } from '../../services/blobStorage.service';
import { storyService } from '../../services/story.service';

// 1. Upload media
const mediaUrl = await blobStorageService.uploadStoryMedia(
  fileUri, 
  'story.jpg'
);

// 2. Create story
const story = await storyService.create({
  mediaUrl,
  mediaType: 'image',
  caption: 'My story',
  duration: 10,
  privacy: 'friends'
});
```

### Listen for Real-Time Updates

```typescript
import { socketService } from '../../services/socket.service';

socketService.on('story:new', (data) => {
  console.log('New story:', data);
  // Update UI
});
```

## 🔐 Security Checklist

- ✅ JWT authentication required
- ✅ User ownership validation
- ✅ File size limits (100MB)
- ✅ MIME type validation
- ✅ Container access control
- ✅ Rate limiting enabled
- ✅ HTTPS only in production

## 🎨 Story Types Supported

1. **Image Stories**
   - Filters and effects
   - Text overlays
   - Stickers and emojis

2. **Video Stories**
   - Up to 60 seconds
   - Trimming support
   - Text overlays

3. **Text Stories**
   - Gradient backgrounds
   - Custom fonts and colors
   - Multiple text layers

## 📊 Database Schema

**Collection**: `stories`

```json
{
  "id": "uuid",
  "userId": "user-id",
  "username": "john_doe",
  "displayName": "John Doe",
  "mediaUrl": "https://...",
  "mediaType": "image|video",
  "caption": "My story",
  "duration": 10,
  "viewers": [],
  "viewCount": 0,
  "privacy": "friends",
  "isActive": true,
  "createdAt": "2025-11-08T...",
  "expiresAt": "2025-11-09T..." // 24 hours
}
```

## 🔄 WebSocket Events

**Client → Server**: None (HTTP only for creation)

**Server → Client**:
```typescript
// New story created
event: 'story:new'
data: {
  id: string,
  userId: string,
  userName: string,
  mediaUrl: string,
  type: 'image'|'video',
  createdAt: Date,
  expiresAt: Date
}

// Story viewed
event: 'story:viewed'
data: {
  storyId: string,
  viewerId: string,
  viewerName: string
}
```

## 🐛 Common Issues & Solutions

**Upload fails**:
- Check Azure Storage connection string
- Verify container exists
- Check file size < 100MB

**Story not visible**:
- Verify privacy settings
- Check expiration time
- Confirm user friendship status

**Real-time not working**:
- Check socket connection
- Verify event listeners
- Check network connectivity

## 📁 File Structure

```
backend/
├── src/
│   ├── application/
│   │   ├── controllers/
│   │   │   ├── StoryController.ts ✨ Enhanced
│   │   │   └── StorageController.ts ✨ New
│   │   ├── routes/
│   │   │   ├── story.routes.ts
│   │   │   └── storage.routes.ts ✨ New
│   │   └── services/
│   │       └── StoryService.ts ✨ Enhanced
│   ├── infrastructure/
│   │   └── storage/
│   │       └── blob.config.ts ✨ Enhanced
│   └── server.ts ✨ Updated

src/
├── screens/
│   └── Stories/
│       ├── EnhancedImageEditorScreen.tsx ✨ Updated
│       ├── EnhancedVideoEditorScreen.tsx ✨ Updated
│       └── StoryListScreen.tsx
└── services/
    ├── blobStorage.service.ts
    └── story.service.ts
```

## 🎯 Testing Commands

```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test

# E2E test story creation
# 1. Start backend: npm run dev
# 2. Start frontend: npx expo start
# 3. Create story via app
# 4. Check: Story appears in feed
# 5. Check: Real-time update for other users
```

## 📈 Performance Tips

1. **Compress images** before upload (reduce bandwidth)
2. **Use CDN** for media delivery (faster loading)
3. **Cache stories** locally (offline support)
4. **Lazy load** story lists (better UX)
5. **Background uploads** (don't block UI)

## 🚀 Deployment

**Azure App Service**:
```bash
cd backend
az webapp up --name projectchat-api --resource-group projectchat-rg
```

**Environment Variables**:
- `AZURE_STORAGE_CONNECTION_STRING`
- `COSMOS_DB_ENDPOINT`
- `COSMOS_DB_KEY`
- `JWT_SECRET`
- `CORS_ORIGIN`

## 📚 Related Documentation

- Full Implementation: `STORY_POSTING_IMPLEMENTATION.md`
- API Docs: `backend/API_DOCUMENTATION.md`
- Azure Setup: `backend/AZURE_DEPLOYMENT.md`
- Story Features: `STORY_CREATION_ARCHITECTURE.md`

---

**Status**: ✅ Production Ready  
**Last Updated**: November 8, 2025
