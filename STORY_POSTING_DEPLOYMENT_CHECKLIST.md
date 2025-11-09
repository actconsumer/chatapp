# Story Posting Implementation - Deployment Checklist

## 🚀 Pre-Deployment Checklist

### Backend Configuration

#### Azure Storage Setup
- [ ] Azure Storage Account created
- [ ] Container "media" created with public blob access
- [ ] Container "avatars" created with public blob access
- [ ] Connection string configured in `.env`
  ```env
  AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
  BLOB_CONTAINER_MEDIA=media
  BLOB_CONTAINER_AVATARS=avatars
  ```

#### Cosmos DB Setup
- [ ] Cosmos DB account created
- [ ] Database "projectchat" created
- [ ] Container "stories" created with partition key "/userId"
- [ ] Container "users" exists (for user lookups)
- [ ] Endpoint and key configured in `.env`
  ```env
  COSMOS_DB_ENDPOINT=https://...documents.azure.com:443/
  COSMOS_DB_KEY=...
  COSMOS_DB_DATABASE=projectchat
  ```

#### Environment Variables
- [ ] `PORT=3000`
- [ ] `API_VERSION=v1`
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET=<strong-secret-key>`
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `CORS_ORIGIN=https://app.projectchat.com`

#### Server Configuration
- [ ] Storage routes registered in `server.ts`
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] Compression enabled
- [ ] Error handling middleware active

### Frontend Configuration

#### API Configuration
- [ ] Update `src/services/config.ts` with production API URL
  ```typescript
  PROD: {
    BASE_URL: 'https://api.projectchat.azure-api.net',
    API_VERSION: 'v1',
  }
  ```

#### Dependencies
- [ ] `axios` installed
- [ ] `expo-image-picker` configured
- [ ] `expo-video` installed
- [ ] `@expo/vector-icons` available
- [ ] `react-native-safe-area-context` installed

### Code Verification

#### Backend Files Created/Modified
- [x] `backend/src/application/controllers/StorageController.ts` ✅ Created
- [x] `backend/src/application/routes/storage.routes.ts` ✅ Created
- [x] `backend/src/application/controllers/StoryController.ts` ✅ Enhanced
- [x] `backend/src/application/services/StoryService.ts` ✅ Enhanced
- [x] `backend/src/server.ts` ✅ Updated

#### Frontend Files Modified
- [x] `src/screens/Stories/EnhancedImageEditorScreen.tsx` ✅ Updated
- [x] `src/screens/Stories/EnhancedVideoEditorScreen.tsx` ✅ Updated

#### Compilation Status
- [x] Backend TypeScript compiles without errors ✅
- [x] Frontend TypeScript compiles without errors ✅
- [x] No missing imports ✅
- [x] All services properly exported ✅

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] StorageController unit tests
- [ ] StoryController unit tests
- [ ] StoryService unit tests
- [ ] Blob upload service tests

### Integration Tests
- [ ] Story creation with pre-uploaded URL
- [ ] Story creation with direct file upload
- [ ] Story creation with text only
- [ ] Socket event emission on story creation
- [ ] Story expiration after 24 hours
- [ ] View tracking functionality
- [ ] Privacy controls enforcement

### Frontend Tests
- [ ] Image story creation flow
- [ ] Video story creation flow
- [ ] Text story creation flow
- [ ] Upload progress indication
- [ ] Error handling (network, auth, validation)
- [ ] Real-time feed updates
- [ ] Navigation after publish

### End-to-End Tests
```bash
# Test 1: Image Story
1. Navigate to Stories tab
2. Tap camera icon
3. Select image from gallery
4. Add text overlay
5. Apply filter
6. Tap publish button
7. Verify loading indicator
8. Verify success message
9. Verify story appears in feed
10. Verify real-time update for other users

# Test 2: Video Story
1. Navigate to Stories tab
2. Tap camera icon
3. Select video from gallery
4. Trim video (30 seconds)
5. Add text overlay
6. Tap publish button
7. Verify upload progress
8. Verify success message
9. Verify video plays in feed

# Test 3: Text Story
1. Navigate to Stories tab
2. Tap camera icon
3. Select "Text Story"
4. Choose gradient background
5. Add text with styling
6. Tap publish button
7. Verify story created
8. Verify gradient displays correctly
```

---

## 🔐 Security Verification

### Authentication
- [ ] All API endpoints require JWT token
- [ ] Token expiration handled correctly
- [ ] Refresh token flow works
- [ ] Unauthorized requests return 401

### Authorization
- [ ] Users can only delete their own stories
- [ ] Users can only view stories based on privacy settings
- [ ] Blob uploads include user ID prefix
- [ ] Container access properly restricted

### Input Validation
- [ ] File size limit enforced (100MB)
- [ ] MIME type validation working
- [ ] Container name whitelist enforced
- [ ] Story duration validated
- [ ] Privacy setting validated

### Data Protection
- [ ] HTTPS enforced in production
- [ ] Passwords not logged
- [ ] Sensitive data encrypted at rest
- [ ] Azure Storage uses encryption
- [ ] CORS properly configured

---

## 📊 Performance Verification

### Backend Performance
- [ ] Response times < 200ms for story list
- [ ] Upload endpoints handle concurrent requests
- [ ] Cosmos DB queries use indexes
- [ ] Blob storage SAS tokens cached
- [ ] Compression reduces payload size

### Frontend Performance
- [ ] Images compressed before upload
- [ ] Stories lazy loaded in feed
- [ ] Upload progress shown to user
- [ ] Optimistic UI updates
- [ ] Background uploads don't block UI

### Load Testing
```bash
# Test concurrent story uploads
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  -p story.json \
  https://api.projectchat.azure-api.net/api/v1/stories

# Expected results:
# - 0% error rate
# - < 500ms avg response time
# - All uploads successful
```

---

## 🔄 Real-Time Verification

### WebSocket Events
- [ ] Socket connection established on app start
- [ ] 'story:new' event emitted on story creation
- [ ] Connected clients receive event immediately
- [ ] Feed updates without refresh
- [ ] Event data structure matches expected format

### Event Data Structure
```typescript
{
  id: string,
  userId: string,
  userName: string,
  userAvatar: string,
  mediaUrl: string,
  type: 'image' | 'video',
  createdAt: Date,
  expiresAt: Date
}
```

---

## 📱 Mobile Testing

### iOS Testing
- [ ] Camera permissions work
- [ ] Photo library access works
- [ ] Image picker functions correctly
- [ ] Video trimming works
- [ ] Upload progress displays
- [ ] Stories display in feed
- [ ] Pull-to-refresh works

### Android Testing
- [ ] Camera permissions work
- [ ] Gallery access works
- [ ] Image picker functions correctly
- [ ] Video playback works
- [ ] Upload progress displays
- [ ] Stories display in feed
- [ ] Pull-to-refresh works

---

## 🌐 Cross-Platform Testing

### Web (Expo Web)
- [ ] File picker works
- [ ] Image upload works
- [ ] Video upload works
- [ ] Stories display correctly
- [ ] Real-time updates work

### Desktop (if applicable)
- [ ] File selection works
- [ ] Drag-and-drop upload
- [ ] Stories display
- [ ] Real-time updates

---

## 📈 Monitoring Setup

### Application Insights
- [ ] Azure Application Insights configured
- [ ] Custom metrics for story uploads
- [ ] Error tracking enabled
- [ ] Performance monitoring active

### Alerts
- [ ] High error rate alert (> 5%)
- [ ] Slow response time alert (> 1s)
- [ ] Storage quota alert (> 80%)
- [ ] Database RU consumption alert

### Logging
- [ ] Story creation logged
- [ ] Upload errors logged
- [ ] Authentication failures logged
- [ ] Performance metrics logged

---

## 🚀 Deployment Steps

### Backend Deployment

```bash
# 1. Build backend
cd backend
npm run build

# 2. Deploy to Azure App Service
az webapp up \
  --name projectchat-api \
  --resource-group projectchat-rg \
  --location eastus

# 3. Set environment variables
az webapp config appsettings set \
  --name projectchat-api \
  --resource-group projectchat-rg \
  --settings \
    AZURE_STORAGE_CONNECTION_STRING="..." \
    COSMOS_DB_ENDPOINT="..." \
    COSMOS_DB_KEY="..." \
    JWT_SECRET="..."

# 4. Verify deployment
curl https://api.projectchat.azure-api.net/health
```

### Frontend Deployment

```bash
# 1. Update config for production
# Edit src/services/config.ts

# 2. Build app
npx expo build:android
npx expo build:ios

# 3. Submit to stores
# Follow Expo submission guide
```

---

## ✅ Post-Deployment Verification

### Smoke Tests
- [ ] Health check endpoint responds
- [ ] Can authenticate
- [ ] Can create image story
- [ ] Can create video story
- [ ] Can view stories in feed
- [ ] Real-time updates work
- [ ] Story expires after 24 hours

### User Acceptance Testing
- [ ] 10 test users create stories
- [ ] All stories appear in feed
- [ ] Real-time updates confirmed
- [ ] No errors in logs
- [ ] Performance acceptable

---

## 📞 Rollback Plan

If issues are discovered:

1. **Backend Rollback**
   ```bash
   az webapp deployment slot swap \
     --name projectchat-api \
     --resource-group projectchat-rg \
     --slot staging
   ```

2. **Frontend Rollback**
   - Revert to previous app version
   - Update over-the-air if using Expo Updates

3. **Database Rollback**
   - Cosmos DB point-in-time restore if needed
   - Backup blob storage files

---

## 📚 Documentation Verification

- [x] `STORY_POSTING_IMPLEMENTATION.md` created ✅
- [x] `STORY_POSTING_QUICK_REFERENCE.md` created ✅
- [x] `STORY_POSTING_SUMMARY.md` created ✅
- [x] `STORY_POSTING_DEPLOYMENT_CHECKLIST.md` created ✅
- [ ] API documentation updated
- [ ] Swagger/OpenAPI spec updated
- [ ] README updated with new features

---

## 🎉 Go-Live Approval

### Stakeholder Sign-Off
- [ ] Backend engineer approves
- [ ] Frontend engineer approves
- [ ] QA team approves
- [ ] Product owner approves
- [ ] DevOps team ready

### Final Checks
- [ ] All tests passing
- [ ] No blocking issues
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Documentation complete
- [ ] Team trained

---

## 📅 Deployment Schedule

**Recommended Timeline**:
1. **Day 1-2**: Run all tests
2. **Day 3**: Deploy to staging
3. **Day 4**: Staging verification
4. **Day 5**: Production deployment
5. **Day 6-7**: Monitor and support

**Deployment Window**: Off-peak hours (2 AM - 4 AM)

---

**Status**: Ready for Deployment ✅  
**Last Updated**: November 8, 2025  
**Approval Pending**: Yes
