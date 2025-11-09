# Quick Reference Guide

## 🎯 What Was Changed

### 1️⃣ Message Input (src/components/MessageInput.tsx)

**Better Visibility:**
```
Before: Semi-transparent input → Hard to see on light wallpapers
After:  White background + colored borders → Always visible
```

**Voice Recording:**
```
Before: Separate modal screen
After:  Inline red bar with controls

[Normal Input]  →  Tap mic  →  [Red Recording Bar]  →  Auto-plays  →  Send/Delete
```

### 2️⃣ Custom Wallpaper Screen (NEW!)

**Path:** Chat → ⋮ → Wallpaper & Emoji → Custom Theme

**What You Can Customize:**
- ✅ Background (solid color / gradient / photo)
- ✅ Message bubbles (sender/receiver colors)
- ✅ Text colors (sender/receiver)
- ✅ Bubble borders (colors + widths)
- ✅ Date separator (text + background)
- ✅ Header (background + text + icons)
- ✅ Input bar (background + text + border + placeholder)
- ✅ Buttons (send + attach + emoji)
- ✅ Quick reaction emoji

**Color Picker:**
- 25 preset colors per component
- Custom hex input (#RRGGBB)
- Live preview with selection indicator

### 3️⃣ Recording UI Components

**States:**
```
IDLE:      [Attach] [Input field...] [Mic]
           ↓ Tap mic

RECORDING: [🎤] Recording... 0:15 [Pause] [Delete]
           ↓ Tap mic again

RECORDED:  [🎤] Recorded 0:15 [Play/Pause] [Delete] [Send]
           ↓ Auto-plays after stopping
```

**Actions:**
- Start: Tap mic icon
- Stop: Tap mic icon again (while recording)
- Pause: Tap pause button (while recording)
- Resume: Tap play button (while paused)
- Delete: Tap trash icon (any time)
- Send: Tap send icon (after recording)
- Play: Tap play/pause button (after recording)

## 🎨 Message Input Styling Details

**Enhanced Input Container:**
```css
backgroundColor: wallpaperColor with 15% opacity
borderWidth: 2px
borderColor: wallpaperColor with 40% opacity
shadowOpacity: 0.1
shadowRadius: 3
elevation: 2
```

**Text Input Field:**
```css
backgroundColor: rgba(255, 255, 255, 0.9)  // White with 90% opacity
borderRadius: 18px
paddingHorizontal: 12px
paddingVertical: 8px
color: theme.text
```

**Recording Container:**
```css
backgroundColor: #FF3B30  // Red
borderWidth: 2px
borderColor: #FF6B6B     // Light red
borderRadius: 24px
paddingHorizontal: 16px
paddingVertical: 10px
```

## 📱 User Flow Examples

### Sending a Voice Message
1. Open chat
2. Tap **mic icon** (bottom right)
3. See red bar with **pulsing mic** and **timer**
4. Speak your message
5. Tap **mic icon again** to stop
6. Recording **auto-plays** for review
7. Tap **send icon** to send OR **trash icon** to delete

### Customizing Chat Theme
1. Open chat
2. Tap **⋮** (top right)
3. Select **"Wallpaper & Emoji"**
4. Scroll down to **"Custom Theme"** tile
5. Tap **"Custom Theme"**
6. Choose **Background Type** (Solid/Gradient/Image)
7. Tap any section to **expand color picker**
8. Select from **25 preset colors** or enter **custom hex**
9. Adjust **border widths** with +/- buttons
10. Tap **"Save"** (top right)

### Typing a Message
1. Open chat
2. Tap input field
3. Type message
4. **White background** ensures text is visible
5. **Colored borders** match theme
6. Tap **send** (gradient button)

## 🔍 Finding Components

**Message Input:**
- Location: Bottom of every chat screen
- File: `src/components/MessageInput.tsx`
- Features: Text input, emoji picker, voice recording, attachments

**Custom Wallpaper Screen:**
- Navigation: Chat → ⋮ → Wallpaper & Emoji → Custom Theme
- File: `src/screens/Chat/CustomWallpaperScreen.tsx`
- Features: Color pickers, border controls, background options

**Wallpaper Selection:**
- Navigation: Chat → ⋮ → Wallpaper & Emoji
- File: `src/screens/Chat/ChatWallpaperScreen.tsx`
- Features: Preset wallpapers, quick emoji, custom theme link

## 💡 Tips

**For Better Visibility:**
- Use light text on dark bubbles
- Use dark text on light bubbles
- Test your custom theme by sending messages

**For Voice Recording:**
- Grant microphone permission when prompted
- Keep phone close for clear audio
- Review recording before sending

**For Custom Themes:**
- Start with a preset and modify
- Save frequently while experimenting
- Use borders for bubble definition

## 🎨 Color Presets Available

Each color picker includes these 25 colors:
```
Row 1: #FF6B6B #FF8E53 #FFA726 #FFD700 #66BB6A
Row 2: #4CAF50 #26C6DA #42A5F5 #5C6BC0 #7E57C2
Row 3: #AB47BC #EC407A #EF5350 #8D6E63 #78909C
Row 4: #FFFFFF #F5F5F5 #E0E0E0 #BDBDBD #9E9E9E
Row 5: #757575 #616161 #424242 #212121 #000000
```

Plus custom hex input for unlimited colors!

## ✨ Key Improvements Summary

| Feature | Before | After |
|---------|--------|-------|
| Input Visibility | Semi-transparent, hard to see | White background, always visible |
| Voice Recording | Separate modal | Inline with controls |
| Customization | 10 preset wallpapers | Unlimited custom themes |
| Recording Controls | Manual playback | Auto-play + controls |
| Border Styling | Fixed | Adjustable 0-5px |
| Icon Colors | Fixed theme colors | Fully customizable |

🎉 **All improvements are live and ready to use!**
