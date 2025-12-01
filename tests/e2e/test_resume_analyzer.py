"""
E2E Test: Resume Builder - Analyze Resume
Test Case: User can paste resume, click analyze, and see analysis output
"""
import pytest
from playwright.async_api import async_playwright
from pathlib import Path

SAMPLE_RESUME_FILE = Path(__file__).parent.parent.parent / "sample_resume.txt"
BASE_URL = "https://careerpilotconsulting.com"
TEST_EMAIL = "ramjee.chaitanya@gmail.com"
TEST_PASSWORD = "career123"

@pytest.mark.asyncio
async def test_resume_analyzer():
    """Test resume analysis functionality"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        try:
            # Login
            await page.goto(BASE_URL)
            await page.fill('input[type="email"]', TEST_EMAIL)
            await page.fill('input[type="password"]', TEST_PASSWORD)
            await page.click('button:has-text("Sign in")')
            await page.wait_for_url('**/dashboard', timeout=10000)
            
            # Navigate to Resume Builder
            await page.goto(f"{BASE_URL}/resume-builder")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(2000)
            
            # Read resume content
            with open(SAMPLE_RESUME_FILE, 'r', encoding='utf-8') as f:
                resume_text = f.read()
            
            # Paste resume
            resume_input = page.locator('textarea, input[type="text"]').first
            assert await resume_input.count() > 0, "Resume input not found"
            await resume_input.fill(resume_text)
            await page.wait_for_timeout(1000)
            
            # Click Analyze button
            analyze_button = page.locator('button:has-text("Analyze"), button:has-text("analyze")').first
            assert await analyze_button.count() > 0, "Analyze button not found"
            await analyze_button.click()
            
            # Wait for analysis output
            await page.wait_for_selector(
                '.result-area, .output, [class*="result"], [class*="analysis"]',
                timeout=20000
            )
            await page.wait_for_timeout(2000)
            
            # Verify output is visible
            output_area = page.locator('.result-area, .output, [class*="result"]').first
            assert await output_area.count() > 0, "Analysis output not found"
            
            print("✅ Test passed: Resume analysis completed successfully")
            
        finally:
            await browser.close()



