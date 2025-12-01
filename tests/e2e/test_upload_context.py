"""
E2E Test: Upload Career Context
Test Case: User can upload career context file and it appears in the list
"""
import pytest
from playwright.async_api import async_playwright
from pathlib import Path

SAMPLE_CONTEXT_FILE = Path(__file__).parent.parent.parent / "sample_career_context.md"
BASE_URL = "https://careerpilotconsulting.com"
TEST_EMAIL = "ramjee.chaitanya@gmail.com"
TEST_PASSWORD = "career123"

@pytest.mark.asyncio
async def test_upload_career_context():
    """Test uploading career context file"""
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
            
            # Navigate to dashboard
            await page.goto(f"{BASE_URL}/dashboard")
            await page.wait_for_load_state('networkidle')
            
            # Scroll to upload section
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.6)")
            await page.wait_for_timeout(1000)
            
            # Upload file
            file_input = page.locator('input[type="file"]').first
            assert await file_input.count() > 0, "File input not found"
            
            await file_input.set_input_files(str(SAMPLE_CONTEXT_FILE))
            await page.wait_for_timeout(1000)
            
            # Click Save context
            save_button = page.locator('button:has-text("Save context")').first
            assert await save_button.count() > 0, "Save context button not found"
            await save_button.click()
            
            # Wait for success message
            await page.wait_for_selector('text=uploaded successfully, .success', timeout=15000)
            
            # Verify context appears in list
            await page.wait_for_timeout(2000)
            contexts = page.locator('[class*="context"], [class*="upload"]')
            assert await contexts.count() > 0, "Context not found in list"
            
            print("✅ Test passed: Career context uploaded successfully")
            
        finally:
            await browser.close()



