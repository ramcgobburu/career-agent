# PWA Setup Guide

This guide explains how to set up the Progressive Web App (PWA) features for CareerPilot.

## What's Included

✅ **Manifest.json** - App metadata and configuration  
✅ **Service Worker** - Offline functionality and caching  
✅ **Install Prompt** - Native app-like installation  
✅ **Mobile Optimizations** - Touch-friendly UI and responsive design  

## Icon Generation

The app requires two icon sizes:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

### Option 1: Use the Icon Generator

1. Open `/public/icon-generator.html` in your browser
2. Click "Download 192x192" and "Download 512x512"
3. Save the files to `/public/` directory

### Option 2: Create Custom Icons

Create your own icons using any image editor:
- Size: 192x192 and 512x512 pixels
- Format: PNG
- Background: Should work well on both light and dark backgrounds
- Save as: `icon-192.png` and `icon-512.png` in `/public/` directory

### Option 3: Use Online Tools

Use tools like:
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## Testing PWA Features

### Local Testing

1. Build the app:
   ```bash
   npm run build
   npm start
   ```

2. Open Chrome DevTools → Application tab
3. Check:
   - Manifest is loaded correctly
   - Service Worker is registered
   - Icons are displayed

### Mobile Testing

1. Deploy to HTTPS (required for PWA)
2. Open on mobile device
3. Look for "Add to Home Screen" prompt
4. Install and test offline functionality

## Service Worker

The service worker (`/public/sw.js`) provides:
- **Offline caching** - Caches static assets
- **Network-first strategy** - Tries network, falls back to cache
- **Auto-update** - Updates cache when new version is available

### Customization

Edit `/public/sw.js` to:
- Add more URLs to cache
- Change caching strategy
- Add background sync
- Add push notifications

## Install Prompt

The install prompt appears automatically when:
- User visits the site on a mobile device
- Browser supports PWA installation
- User hasn't dismissed it in this session

### Customization

Edit `/components/InstallPrompt.js` to:
- Change prompt timing
- Customize appearance
- Add analytics tracking

## Mobile Optimizations

The app includes:
- ✅ Touch-friendly buttons (min 44px height)
- ✅ Responsive layouts for all screen sizes
- ✅ Viewport meta tags
- ✅ iOS-specific optimizations
- ✅ Prevent text zoom on input focus

## Deployment Checklist

Before deploying:
- [ ] Generate and add icon files
- [ ] Test on mobile devices
- [ ] Verify HTTPS is enabled
- [ ] Test offline functionality
- [ ] Check manifest.json is accessible
- [ ] Verify service worker registration

## Troubleshooting

### Icons not showing
- Check file paths in `manifest.json`
- Verify files exist in `/public/` directory
- Clear browser cache

### Service Worker not registering
- Check browser console for errors
- Verify HTTPS is enabled (required for service workers)
- Check service worker file path

### Install prompt not showing
- Verify manifest.json is valid
- Check browser support (Chrome, Edge, Safari iOS 11.3+)
- Ensure site is served over HTTPS
- Check if already installed

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari iOS 11.3+
- ✅ Firefox (limited)
- ⚠️ Safari Desktop (no install, but works)

## Next Steps

1. Generate icons using one of the methods above
2. Test locally with `npm run build && npm start`
3. Deploy to production with HTTPS
4. Test on real mobile devices
5. Monitor service worker updates

