# Story Creation - Quick Reference Guide

## 🚀 Quick Start

### Navigate to Story Creation
```typescript
navigation.navigate('CreateStory');
// or
navigation.navigate('MediaPicker');
```

---

## 📸 Screen Reference

### 1️⃣ MediaPickerScreen (Entry Point)
**File:** `src/screens/Stories/MediaPickerScreen.tsx` (450 lines)

**What it does:**
- Shows gradient preview
- Lets users pick: Gallery Image, Video, Camera, or create Text Story
- Routes to appropriate editor

**Navigation:**
```typescript
// To ImageEditor (for photos)
navigation.navigate('ImageEditor', {
  mediaUri: 'file://...',
  mediaType: 'image'
});

// To VideoEditor
navigation.navigate('VideoEditor', {
  mediaUri: 'file://...',
  mediaType: 'video'
});

// Text story
navigation.navigate('ImageEditor', {
  mediaUri: null,
  mediaType: 'text',
  gradient: selectedGradient
});
```

---

### 2️⃣ VideoEditorScreen
**File:** `src/screens/Stories/VideoEditorScreen.tsx` (490 lines)

**Features:**
- ✂️ Trim video to max 10 seconds
- 📝 Add text overlays
- 🎨 Choose text colors
- ▶️ Live preview with play/pause

**Controls:**
- Start time slider
- End time slider
- Text overlay modal
- Post button

---

### 3️⃣ ImageEditorScreen
**File:** `src/screens/Stories/ImageEditorScreen.tsx` (495 lines)

**Features:**
- 📷 Image mode: Photo + text + filters
- 📝 Text mode: Gradient + text
- 🎨 10 gradient backgrounds
- 🖌️ 5 image filters
- 📏 Text sizing (18, 24, 32, 40)
- 🎭 Text weight (Normal, Bold)

**Tools:**
- Text panel (add/edit text)
- Gradient panel (choose background)
- Filter panel (apply effects)

---

## 🧩 Shared Components

### ColorPicker
```typescript
import ColorPicker from '../components/ColorPicker';

<ColorPicker
  colors={['#FFFFFF', '#000000', '#FF6B9D']}
  selectedColor={textColor}
  onColorSelect={setTextColor}
  label="Text Color" // optional
/>
```

### GradientSelector
```typescript
import GradientSelector from '../components/GradientSelector';

<GradientSelector
  gradients={GRADIENT_BACKGROUNDS}
  selectedGradient={gradient}
  onGradientSelect={setGradient}
  cardView={true} // false for circles
  label="Choose Background" // optional
/>
```

### TextSizePicker
```typescript
import TextSizePicker from '../components/TextSizePicker';

<TextSizePicker
  sizes={[18, 24, 32, 40]}
  selectedSize={textSize}
  onSizeSelect={setTextSize}
  label="Size" // optional
/>
```

### FilterSelector
```typescript
import FilterSelector from '../components/FilterSelector';

<FilterSelector
  filters={FILTERS}
  selectedFilter={filter}
  onFilterSelect={setFilter}
  label="Apply Filter" // optional
/>
```

---

## 🎨 Gradient Backgrounds

Pre-configured gradients available:

```typescript
const GRADIENT_BACKGROUNDS = [
  { name: 'Violet Dream', colors: ['#667eea', '#764ba2'], icon: 'water' },
  { name: 'Ocean Blue', colors: ['#2193b0', '#6dd5ed'], icon: 'waves' },
  { name: 'Sunset', colors: ['#f12711', '#f5af19'], icon: 'white-balance-sunny' },
  { name: 'Forest', colors: ['#134e5e', '#71b280'], icon: 'tree' },
  { name: 'Purple Love', colors: ['#cc2b5e', '#753a88'], icon: 'heart' },
  { name: 'Night Sky', colors: ['#0f2027', '#203a43', '#2c5364'], icon: 'moon-waning-crescent' },
  { name: 'Peach', colors: ['#ed4264', '#ffedbc'], icon: 'flower' },
  { name: 'Mint', colors: ['#56ab2f', '#a8e063'], icon: 'leaf' },
  { name: 'Fire', colors: ['#f85032', '#e73827'], icon: 'fire' },
  { name: 'Ice', colors: ['#00d2ff', '#3a7bd5'], icon: 'snowflake' },
];
```

---

## 🎨 Text Colors

```typescript
const TEXT_COLORS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#FF6B9D', // Pink
  '#FFD93D', // Yellow
  '#6BCB77', // Green
  '#4ECDC4', // Teal
  '#667eea', // Purple
  '#f12711', // Red
  '#cc2b5e', // Magenta
  '#56ab2f', // Lime
];
```

---

## 🖼️ Image Filters

```typescript
const FILTERS = [
  { name: 'None', value: null, icon: 'ban' },
  { name: 'Vintage', value: 'sepia', icon: 'camera-retro' },
  { name: 'Cool', value: 'cool', icon: 'snowflake' },
  { name: 'Warm', value: 'warm', icon: 'fire' },
  { name: 'B&W', value: 'grayscale', icon: 'adjust' },
];
```

---

## 🔄 Complete User Flow

```
User clicks "+ Create Story"
        ↓
MediaPickerScreen loads
        ↓
User selects option:
        ↓
    ┌───────┴──────────┬──────────────┐
    ↓                  ↓              ↓
Gallery/Camera    Video Gallery   Text Story
    ↓                  ↓              ↓
ImageEditor      VideoEditor    ImageEditor
    ↓                  ↓              ↓
Add text/filter   Trim + text    Gradient + text
    ↓                  ↓              ↓
    └──────────────────┴──────────────┘
                   ↓
              Post Story
                   ↓
          Back to StoryList
```

---

## 🛠️ Troubleshooting

### Issue: Navigation not working
**Solution:** Ensure all screens are registered in `navigation/index.tsx`:
```typescript
<Stack.Screen name="MediaPicker" component={MediaPickerScreen} />
<Stack.Screen name="VideoEditor" component={VideoEditorScreen} />
<Stack.Screen name="ImageEditor" component={ImageEditorScreen} />
```

### Issue: Permissions error
**Solution:** Screens automatically request permissions. Ensure:
- Camera permission in app.json
- Photo library permission in app.json

### Issue: Video won't play
**Solution:** Ensure `expo-video` is installed:
```bash
npx expo install expo-video
```

---

## 📦 Dependencies Required

```json
{
  "expo-linear-gradient": "latest",
  "expo-image-picker": "latest",
  "expo-video": "latest",
  "@react-native-assets/slider": "latest",
  "@expo/vector-icons": "latest",
  "react-native-safe-area-context": "latest"
}
```

---

## 🎯 Key Features Summary

### MediaPickerScreen
✅ Beautiful gradient previews
✅ 4 media source options
✅ Smooth animations
✅ Responsive design

### VideoEditorScreen
✅ 10-second auto-trim
✅ Live duration display
✅ Text overlays
✅ Play/pause controls
✅ Warning for long clips

### ImageEditorScreen
✅ Dual mode (image/text)
✅ Multiple text overlays
✅ 8 gradient backgrounds
✅ 5 image filters
✅ Animated bottom panel
✅ Text size & weight controls

---

## 💡 Pro Tips

1. **Text Overlays:** Tap overlay's close button to remove
2. **Video Trimming:** Drag sliders to select clip portion
3. **Gradients:** Swipe horizontally to see all options
4. **Filters:** Work only in image mode, not text mode
5. **Publishing:** Wait for animation before navigating away

---

## 📏 Code Limits

Each screen is under 500 lines:
- ✅ MediaPickerScreen: ~450 lines
- ✅ VideoEditorScreen: ~490 lines
- ✅ ImageEditorScreen: ~495 lines

This makes debugging and maintenance much easier!

---

## 🎨 Customization

### Change gradient colors:
Edit `GRADIENT_BACKGROUNDS` array in any screen

### Change text colors:
Edit `TEXT_COLORS` array in editor screens

### Add more filters:
Add to `FILTERS` array in `ImageEditorScreen`

### Adjust video limit:
Change hardcoded `10` in `VideoEditorScreen` trim logic

---

## 🚀 Performance Notes

- Animations use `useNativeDriver: true`
- Video player loops efficiently
- Images are cached automatically
- Text overlays render on-demand
- Panels slide with spring animation

---

## ✅ Checklist for Implementation

- [x] MediaPickerScreen created
- [x] VideoEditorScreen created
- [x] ImageEditorScreen created
- [x] Navigation configured
- [x] Shared components extracted
- [x] TypeScript types defined
- [x] Animations implemented
- [x] Theme support added
- [x] Error handling included
- [x] Documentation complete

**Status: Production Ready! 🎉**
