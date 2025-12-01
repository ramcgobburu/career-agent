# Narakeet Slides to Video - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
pip install playwright python-pptx
playwright install chromium
```

### 2. Make Sure Your App is Running

Start your Next.js app:
```bash
cd web
npm run dev
```

The app should be running at `http://localhost:3000`

### 3. Run the Script

```bash
python3 create_narakeet_presentation.py
```

The script will:
- ✅ Read `DEMO_VIDEO_SCRIPT.md`
- ✅ Navigate your app automatically
- ✅ Take screenshots at key points
- ✅ Create PowerPoint with screenshots
- ✅ Add speaker notes (narration) to each slide

### 4. Upload to Narakeet

1. Go to https://www.narakeet.com
2. Sign up (free account available)
3. Click "Slides to Video"
4. Upload the generated `CareerPilot_Demo_Narakeet.pptx`
5. Narakeet will automatically:
   - Use screenshots as slide images
   - Use speaker notes for AI narration
   - Generate the video

## What Gets Created

```
narakeet_assets/
├── CareerPilot_Demo_Narakeet.pptx  ← Upload this to Narakeet
├── Narakeet_Notes.txt              ← Reference file
└── screenshots/
    ├── slide_01_landing.png
    ├── slide_02_signup.png
    ├── slide_03_dashboard.png
    └── ...
```

## Narakeet Features

- ✅ **AI Voice Narration**: Uses your speaker notes automatically
- ✅ **Multiple Voices**: Choose from different AI voices
- ✅ **Automatic Timing**: Syncs narration with slides
- ✅ **Export Options**: MP4, WebM, etc.
- ✅ **Free Tier**: Limited free videos per month

## Troubleshooting

### Screenshots not capturing correctly?
- Make sure your app is running at `http://localhost:3000`
- Check browser console for errors
- Try running with `headless=False` to see what's happening

### PowerPoint not opening?
- Make sure `python-pptx` is installed: `pip install python-pptx`
- Check file permissions

### Narakeet not reading notes?
- Make sure speaker notes are added (they should be automatically)
- Open PowerPoint and check Notes pane (View → Notes)

## Customization

Edit `create_narakeet_presentation.py` to:
- Change screenshot dimensions
- Adjust slide layout
- Modify narration text
- Add more slides

## Alternative: Manual Screenshots

If automation doesn't work, you can:
1. Manually take screenshots
2. Name them: `slide_01_landing.png`, `slide_02_signup.png`, etc.
3. Place them in `narakeet_assets/screenshots/`
4. Run only the PowerPoint creation part (modify script)



