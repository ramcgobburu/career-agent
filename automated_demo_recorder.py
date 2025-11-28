#!/usr/bin/env python3
"""
Automated Demo Recorder
Reads markdown script and automatically navigates the app, taking screenshots
Requires: playwright (pip install playwright)
"""

import asyncio
import re
from pathlib import Path
from playwright.async_api import async_playwright
import json

class DemoRecorder:
    def __init__(self, script_file, base_url="http://localhost:3000"):
        self.script_file = Path(script_file)
        self.base_url = base_url
        self.screenshots_dir = Path("demo_screenshots")
        self.screenshots_dir.mkdir(exist_ok=True)
        self.screenshot_count = 0
        
    def parse_script(self):
        """Parse markdown script to extract actions"""
        with open(self.script_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        actions = []
        sections = re.split(r'### \d+\.\s+([^\n]+)', content)
        
        for i in range(1, len(sections), 2):
            if i + 1 < len(sections):
                section_title = sections[i].strip()
                section_content = sections[i + 1]
                
                # Extract actions
                actions_match = re.search(r'\*\*Actions\*\*:\s*\n((?:- .+\n?)+)', section_content)
                if actions_match:
                    action_lines = actions_match.group(1).strip().split('\n')
                    for line in action_lines:
                        action = line.strip('- ').strip()
                        if action:
                            actions.append({
                                'section': section_title,
                                'action': action,
                                'narration': self._extract_narration(section_content)
                            })
        
        return actions
    
    def _extract_narration(self, content):
        """Extract narration text from section"""
        match = re.search(r'\*\*Narration\*\*:\s*\n> (.+?)(?=\n\n|\*\*|$)', content, re.DOTALL)
        if match:
            narration = match.group(1).strip()
            return re.sub(r'\n> ', ' ', narration)
        return ""
    
    async def execute_action(self, page, action_text):
        """Execute a single action based on text description"""
        action_lower = action_text.lower()
        
        # Navigation actions
        if 'navigate to' in action_lower or 'go to' in action_lower:
            if 'generator' in action_lower:
                await page.click('text=Generator')
                await page.wait_for_load_state('networkidle')
            elif 'dashboard' in action_lower:
                await page.goto(f"{self.base_url}/dashboard")
                await page.wait_for_load_state('networkidle')
            elif 'help' in action_lower or 'faq' in action_lower:
                await page.click('text=Help')
                await page.wait_for_timeout(500)
        
        # Click actions
        elif 'click' in action_lower:
            if 'sign up' in action_lower or 'create account' in action_lower:
                await page.click('text=Create account')
            elif 'generate' in action_lower:
                await page.click('button:has-text("Generate")')
            elif 'auto-fill' in action_lower:
                await page.click('button:has-text("Auto-fill")')
            elif 'help' in action_lower:
                await page.click('text=Help')
        
        # Form actions
        elif 'select' in action_lower or 'choose' in action_lower:
            if 'mode' in action_lower and 'cover letter' in action_lower:
                await page.select_option('select[name="mode"]', 'cover-letter')
            elif 'file' in action_lower:
                # File upload would need actual file path
                pass
        
        # Type actions
        elif 'type' in action_lower or 'enter' in action_lower or 'paste' in action_lower:
            if 'url' in action_lower:
                # Would need actual URL
                await page.fill('input[type="url"]', 'https://example.com/job-posting')
            elif 'email' in action_lower:
                await page.fill('input[type="email"]', 'demo@example.com')
            elif 'password' in action_lower:
                await page.fill('input[type="password"]', 'password123')
        
        # Wait for content
        elif 'wait' in action_lower or 'show' in action_lower:
            await page.wait_for_timeout(2000)  # Wait 2 seconds
        
        # Take screenshot
        self.screenshot_count += 1
        screenshot_path = self.screenshots_dir / f"screenshot_{self.screenshot_count:03d}.png"
        await page.screenshot(path=str(screenshot_path), full_page=True)
        print(f"📸 Screenshot saved: {screenshot_path}")
        
        return screenshot_path
    
    async def record_demo(self):
        """Main recording function"""
        actions = self.parse_script()
        print(f"📝 Found {len(actions)} actions to execute")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)  # Set to True for headless
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080}
            )
            page = await context.new_page()
            
            try:
                # Navigate to app
                print(f"🌐 Navigating to {self.base_url}")
                await page.goto(self.base_url)
                await page.wait_for_load_state('networkidle')
                
                # Execute each action
                for i, action_data in enumerate(actions, 1):
                    print(f"\n[{i}/{len(actions)}] {action_data['section']}")
                    print(f"   Action: {action_data['action']}")
                    
                    await self.execute_action(page, action_data['action'])
                    await page.wait_for_timeout(1000)  # Pause between actions
                
                print(f"\n✅ Recording complete! {self.screenshot_count} screenshots saved to {self.screenshots_dir}")
                print(f"\nNext steps:")
                print(f"1. Review screenshots in {self.screenshots_dir}")
                print(f"2. Use video editing software to combine screenshots into video")
                print(f"3. Add narration using the extracted narration text")
                
            except Exception as e:
                print(f"❌ Error during recording: {e}")
            finally:
                await browser.close()

def main():
    script_file = Path(__file__).parent / "DEMO_VIDEO_SCRIPT.md"
    
    if not script_file.exists():
        print(f"❌ Error: {script_file} not found")
        print("Please ensure DEMO_VIDEO_SCRIPT.md exists in the project root")
        return
    
    recorder = DemoRecorder(script_file)
    
    print("🎬 Automated Demo Recorder")
    print("=" * 50)
    print("\nThis script will:")
    print("1. Read DEMO_VIDEO_SCRIPT.md")
    print("2. Navigate your app automatically")
    print("3. Take screenshots at key moments")
    print("\n⚠️  Make sure your app is running at http://localhost:3000")
    print("⚠️  Install playwright: pip install playwright && playwright install")
    
    response = input("\nReady to start? (y/n): ")
    if response.lower() == 'y':
        asyncio.run(recorder.record_demo())
    else:
        print("Cancelled.")

if __name__ == "__main__":
    main()

