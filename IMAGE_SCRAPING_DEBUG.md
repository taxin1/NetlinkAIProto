# Image Scraping Debugging Guide

## How to Check if Real Images Are Loading

### Step 1: Open Developer Console
Press `F12` in your browser to open Developer Tools, then click on the **Console** tab.

### Step 2: Paste an Event URL
Go to `/dashboard/events` and paste an event URL (e.g., from Eventbrite or Meetup), then click "AI Extract".

### Step 3: Check Console Logs

You should see detailed logs like this:

```
=== META TAG EXTRACTION ===
Preview Image URL: https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F...
Preview Title: Tech Summit 2025
Preview Description: Join us for an amazing conference...

=== FINAL EVENT DATA ===
{
  "title": "Tech Summit 2025",
  "description": "Join us for...",
  "imageUrl": "https://img.evbuc.com/...",
  "startTime": "2025-03-15T09:00",
  ...
}
Image URL in response: https://img.evbuc.com/...

=== FRONTEND: AI EXTRACTED DATA ===
Full data: {title: "Tech Summit 2025", imageUrl: "https://img.evbuc.com/...", ...}
Image URL: https://img.evbuc.com/...
```

### Step 4: Verify Image Display

Look at the preview card:
- ✅ **Working**: You see the actual event poster/banner image
- ❌ **Not Working**: You see gradient background with icon placeholder

## Common Issues & Solutions

### Issue 1: "Preview Image URL: NOT FOUND"
**Problem**: The webpage doesn't have Open Graph meta tags.

**Possible Reasons**:
- JavaScript-only content (image loads after page render)
- Login/authentication required
- Non-standard meta tags
- Image in different format

**Solution**: These pages won't have image previews. The gradient placeholder will show instead.

### Issue 2: Image Shows Then Disappears
**Problem**: Image URL is found but fails to load.

**Check Console for**:
```
GET https://example.com/image.jpg 403 (Forbidden)
```
or
```
GET https://example.com/image.jpg 404 (Not Found)
```

**Possible Reasons**:
- Image URL requires authentication
- CORS blocking
- Image was deleted/moved
- Hotlinking protection

**Solution**: The component will automatically show fallback placeholder.

### Issue 3: Shows Random/Wrong Image
**Problem**: Image URL is extracted but it's not the main event image.

**Check Console**:
```
Preview Image URL: https://example.com/logo.png
```

**Reason**: The site's `og:image` meta tag points to their logo instead of event image.

**Solution**: This is a limitation of the website's meta tags. We extract what they provide.

## Testing URLs

### Platforms Known to Work:
- ✅ **Eventbrite**: Excellent og:image tags
- ✅ **Meetup**: Good og:image tags
- ✅ **Facebook Events**: Has og:image
- ⚠️ **Zoom**: No event images (just join links)
- ⚠️ **Google Meet**: No event images (just join links)

### Test with Real Events:
Try pasting a real Eventbrite event URL like:
```
https://www.eventbrite.com/e/[any-actual-event]
```

## Manual Verification

### Check if Image Exists on Page:
1. Visit the event URL in a new tab
2. Right-click → "View Page Source"
3. Search for: `og:image`
4. Look for: `<meta property="og:image" content="https://..."`
5. Copy the image URL and try opening it directly

If the URL opens an image → Our scraper should extract it
If it doesn't exist → No image will show (expected)

## Expected Behavior

### With Image:
```
┌──────────────────────────┐
│  📸 [REAL EVENT IMAGE]   │
│  (Dark overlay)          │
│  [Platform Badge]        │
└──────────────────────────┘
```

### Without Image:
```
┌──────────────────────────┐
│  🎨 Gradient Background  │
│  📸 Image Icon           │
│  "Event Preview"         │
└──────────────────────────┘
```

## Debug Checklist

- [ ] Open browser console (F12)
- [ ] Paste a known good URL (Eventbrite event)
- [ ] Click "AI Extract"
- [ ] Check for "=== META TAG EXTRACTION ===" logs
- [ ] Verify "Preview Image URL:" is not "NOT FOUND"
- [ ] Check "=== FINAL EVENT DATA ===" has imageUrl
- [ ] Check "=== FRONTEND ===" receives imageUrl
- [ ] Look at preview card - is image visible?
- [ ] Check Network tab for image load (filter: Img)

## How the System Works

```
1. User pastes URL
   ↓
2. Fetch webpage HTML
   ↓
3. Extract <meta property="og:image" content="...">
   ↓
4. Also try: twitter:image, itemprop="image"
   ↓
5. Handle relative URLs (add https://, domain)
   ↓
6. Send imageUrl in API response
   ↓
7. Frontend receives imageUrl
   ↓
8. Display image (or fallback if error)
```

## What Gets Logged

### Backend (Terminal/Server Console):
```
HTML length: 245678
=== META TAG EXTRACTION ===
Preview Image URL: https://...
=== FINAL EVENT DATA ===
{"imageUrl": "https://..."}
```

### Frontend (Browser Console):
```
=== FRONTEND: AI EXTRACTED DATA ===
Image URL: https://...
```

## Still Not Working?

If you followed all steps and images still don't show:

1. **Share the URL** you're testing with
2. **Share console logs** (copy/paste from browser)
3. **Check if the URL has og:image** in page source

Most likely: The website doesn't provide image meta tags, which is normal for some sites!

