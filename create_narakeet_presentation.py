#!/usr/bin/env python3
"""
Create PowerPoint presentation with screenshots and notes for Narakeet
This script will:
1. Take screenshots of the app at key points
2. Create a PowerPoint presentation
3. Add speaker notes with narration
4. Ready to upload to Narakeet
"""

import asyncio
import re
from pathlib import Path
from playwright.async_api import async_playwright
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
import time

class NarakeetPresentationCreator:
    def __init__(self, script_file, base_url="http://localhost:3000", output_dir="narakeet_assets"):
        self.script_file = Path(script_file)
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.screenshots_dir = self.output_dir / "screenshots"
        self.screenshots_dir.mkdir(exist_ok=True)
        self.screenshot_count = 0
        self.slides_data = []
        
    def parse_script(self):
        """Parse markdown script to extract sections with narration"""
        with open(self.script_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract sections
        sections = re.split(r'### \d+\.\s+([^\n]+)', content)
        
        slides = []
        for i in range(1, len(sections), 2):
            if i + 1 < len(sections):
                section_title = sections[i].strip()
                section_content = sections[i + 1]
                
                # Extract narration
                narration_match = re.search(r'\*\*Narration\*\*:\s*\n> (.+?)(?=\n\n|\*\*|$)', section_content, re.DOTALL)
                narration = ""
                if narration_match:
                    narration = narration_match.group(1).strip()
                    narration = re.sub(r'\n> ', ' ', narration)
                    narration = re.sub(r'\n', ' ', narration)
                
                # Extract visual description
                visual_match = re.search(r'\*\*Visual\*\*:\s*\n((?:- .+\n?)+)', section_content)
                visual_description = ""
                if visual_match:
                    visual_description = visual_match.group(1).strip()
                
                # Extract actions to determine what to screenshot
                actions_match = re.search(r'\*\*Actions\*\*:\s*\n((?:- .+\n?)+)', section_content)
                actions = []
                if actions_match:
                    actions = [line.strip('- ').strip() for line in actions_match.group(1).strip().split('\n') if line.strip()]
                
                if narration or section_title:
                    slides.append({
                        'title': section_title,
                        'narration': narration,
                        'visual': visual_description,
                        'actions': actions,
                        'section_number': len(slides) + 1
                    })
        
        return slides
    
    async def take_screenshot(self, page, slide_data, filename):
        """Take a screenshot of the current page state"""
        screenshot_path = self.screenshots_dir / filename
        await page.screenshot(path=str(screenshot_path), full_page=True)
        print(f"📸 Screenshot saved: {screenshot_path}")
        return screenshot_path
    
    async def navigate_and_screenshot(self, page, slide_data):
        """Navigate to the appropriate page and take screenshot"""
        title_lower = slide_data['title'].lower()
        actions = slide_data.get('actions', [])
        
        # Determine what page/action to show
        if 'landing' in title_lower or 'introduction' in title_lower:
            await page.goto(self.base_url)
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(1000)
            filename = f"slide_{slide_data['section_number']:02d}_landing.png"
            return await self.take_screenshot(page, slide_data, filename)
        
        elif 'sign up' in title_lower or 'sign up' in str(actions).lower():
            await page.goto(self.base_url)
            await page.wait_for_load_state('networkidle')
            # Click sign up tab if exists
            try:
                await page.click('text=Create account', timeout=2000)
                await page.wait_for_timeout(500)
            except:
                pass
            filename = f"slide_{slide_data['section_number']:02d}_signup.png"
            return await self.take_screenshot(page, slide_data, filename)
        
        elif 'dashboard' in title_lower:
            await page.goto(f"{self.base_url}/dashboard")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(1000)
            filename = f"slide_{slide_data['section_number']:02d}_dashboard.png"
            return await self.take_screenshot(page, slide_data, filename)
        
        elif 'upload' in title_lower or 'context' in title_lower:
            await page.goto(f"{self.base_url}/dashboard")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(1000)
            # Scroll to upload section
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
            await page.wait_for_timeout(500)
            filename = f"slide_{slide_data['section_number']:02d}_upload.png"
            return await self.take_screenshot(page, slide_data, filename)
        
        elif 'generator' in title_lower or 'cover letter' in title_lower:
            await page.goto(f"{self.base_url}/generator")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(1000)
            # Select cover letter mode if needed
            try:
                await page.select_option('select[name="mode"]', 'cover-letter', timeout=2000)
                await page.wait_for_timeout(500)
            except:
                pass
            filename = f"slide_{slide_data['section_number']:02d}_generator.png"
            return await self.take_screenshot(page, slide_data, filename)
        
        elif 'auto-fill' in title_lower or 'url' in title_lower:
            await page.goto(f"{self.base_url}/generator")
            await page.wait_for_load_state('networkidle')
            try:
                await page.select_option('select[name="mode"]', 'cover-letter', timeout=2000)
                await page.wait_for_timeout(500)
                # Fill in a sample URL
                url_input = page.locator('input[type="url"]').first
                if await url_input.count() > 0:
                    await url_input.fill('https://example.com/job-posting')
                    await page.wait_for_timeout(500)
            except:
                pass
            filename = f"slide_{slide_data['section_number']:02d}_autofill.png"
            return await self.take_screenshot(page, slide_data, filename)
        
        elif 'star story' in title_lower:
            await page.goto(f"{self.base_url}/generator")
            await page.wait_for_load_state('networkidle')
            try:
                await page.select_option('select[name="mode"]', 'star-story', timeout=2000)
                await page.wait_for_timeout(500)
            except:
                pass
            filename = f"slide_{slide_data['section_number']:02d}_star_story.png"
            return await self.take_screenshot(page, slide_data, filename)
        
        elif 'help' in title_lower or 'faq' in title_lower:
            await page.goto(f"{self.base_url}/dashboard")
            await page.wait_for_load_state('networkidle')
            # Try to open help sidebar
            try:
                await page.click('text=Help', timeout=2000)
                await page.wait_for_timeout(1000)
            except:
                pass
            filename = f"slide_{slide_data['section_number']:02d}_help.png"
            return await self.take_screenshot(page, slide_data, filename)
        
        else:
            # Default: stay on current page or go to dashboard
            if '/dashboard' not in page.url:
                await page.goto(f"{self.base_url}/dashboard")
                await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(1000)
            filename = f"slide_{slide_data['section_number']:02d}_default.png"
            return await self.take_screenshot(page, slide_data, filename)
    
    async def capture_all_screenshots(self):
        """Navigate app and capture all screenshots"""
        slides = self.parse_script()
        print(f"📝 Found {len(slides)} slides to create")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)  # Set to True for headless
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080}
            )
            page = await context.new_page()
            
            try:
                print(f"🌐 Starting screenshot capture...")
                print(f"🌐 Make sure your app is running at {self.base_url}\n")
                
                for i, slide_data in enumerate(slides, 1):
                    print(f"\n[{i}/{len(slides)}] {slide_data['title']}")
                    screenshot_path = await self.navigate_and_screenshot(page, slide_data)
                    slide_data['screenshot_path'] = screenshot_path
                    self.slides_data.append(slide_data)
                    await page.wait_for_timeout(1000)  # Pause between screenshots
                
                print(f"\n✅ All screenshots captured!")
                
            except Exception as e:
                print(f"❌ Error during screenshot capture: {e}")
                import traceback
                traceback.print_exc()
            finally:
                await browser.close()
    
    def create_powerpoint(self):
        """Create PowerPoint presentation with screenshots and notes"""
        prs = Presentation()
        prs.slide_width = Inches(10)
        prs.slide_height = Inches(7.5)
        
        print(f"\n📊 Creating PowerPoint presentation...")
        
        for slide_data in self.slides_data:
            # Create slide
            slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank layout
            
            # Add title
            if slide_data.get('title'):
                title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.2), Inches(9), Inches(0.8))
                title_frame = title_box.text_frame
                title_frame.text = slide_data['title']
                title_para = title_frame.paragraphs[0]
                title_para.font.size = Pt(32)
                title_para.font.bold = True
                title_para.alignment = PP_ALIGN.LEFT
            
            # Add screenshot
            screenshot_path = slide_data.get('screenshot_path')
            if screenshot_path and Path(screenshot_path).exists():
                try:
                    # Calculate dimensions to fit slide (leave space for title)
                    img_left = Inches(0.5)
                    img_top = Inches(1.2)
                    img_width = Inches(9)
                    img_height = Inches(5.5)
                    
                    slide.shapes.add_picture(str(screenshot_path), img_left, img_top, img_width, img_height)
                except Exception as e:
                    print(f"⚠️  Could not add image {screenshot_path}: {e}")
            
            # Add speaker notes (narration)
            if slide_data.get('narration'):
                notes_slide = slide.notes_slide
                notes_text_frame = notes_slide.notes_text_frame
                notes_text_frame.text = slide_data['narration']
        
        # Save presentation
        output_path = self.output_dir / "CareerPilot_Demo_Narakeet.pptx"
        prs.save(str(output_path))
        print(f"✅ PowerPoint saved: {output_path}")
        
        return output_path
    
    def create_notes_file(self):
        """Create a separate text file with all notes for reference"""
        notes_path = self.output_dir / "Narakeet_Notes.txt"
        
        with open(notes_path, 'w', encoding='utf-8') as f:
            f.write("CareerPilot Consulting - Demo Video Notes\n")
            f.write("=" * 60 + "\n\n")
            f.write("Speaker Notes for Narakeet Slides to Video\n\n")
            
            for i, slide_data in enumerate(self.slides_data, 1):
                f.write(f"\nSlide {i}: {slide_data['title']}\n")
                f.write("-" * 60 + "\n")
                if slide_data.get('narration'):
                    f.write(f"Notes: {slide_data['narration']}\n")
                if slide_data.get('visual'):
                    f.write(f"Visual: {slide_data['visual']}\n")
                f.write("\n")
        
        print(f"✅ Notes file saved: {notes_path}")
        return notes_path

def main():
    script_file = Path(__file__).parent / "DEMO_VIDEO_SCRIPT.md"
    
    if not script_file.exists():
        print(f"❌ Error: {script_file} not found")
        return
    
    print("🎬 Narakeet Presentation Creator")
    print("=" * 60)
    print("\nThis script will:")
    print("1. Read DEMO_VIDEO_SCRIPT.md")
    print("2. Navigate your app and take screenshots")
    print("3. Create PowerPoint with screenshots and speaker notes")
    print("4. Ready to upload to Narakeet Slides to Video\n")
    print("⚠️  Make sure your app is running at http://localhost:3000")
    print("⚠️  Install dependencies: pip install playwright python-pptx")
    print("⚠️  Then: playwright install\n")
    
    response = input("Ready to start? (y/n): ")
    if response.lower() != 'y':
        print("Cancelled.")
        return
    
    creator = NarakeetPresentationCreator(script_file)
    
    # Step 1: Capture screenshots
    print("\n" + "=" * 60)
    print("STEP 1: Capturing Screenshots")
    print("=" * 60)
    asyncio.run(creator.capture_all_screenshots())
    
    # Step 2: Create PowerPoint
    print("\n" + "=" * 60)
    print("STEP 2: Creating PowerPoint")
    print("=" * 60)
    ppt_path = creator.create_powerpoint()
    
    # Step 3: Create notes file
    notes_path = creator.create_notes_file()
    
    print("\n" + "=" * 60)
    print("✅ COMPLETE!")
    print("=" * 60)
    print(f"\n📁 Files created in: {creator.output_dir}/")
    print(f"   - PowerPoint: {ppt_path.name}")
    print(f"   - Notes: {notes_path.name}")
    print(f"   - Screenshots: {creator.screenshots_dir.name}/")
    print(f"\n📤 Next Steps:")
    print(f"   1. Go to https://www.narakeet.com")
    print(f"   2. Choose 'Slides to Video' option")
    print(f"   3. Upload: {ppt_path.name}")
    print(f"   4. Narakeet will use the speaker notes for narration")
    print(f"   5. Generate your video!")

if __name__ == "__main__":
    main()

