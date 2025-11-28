"""
E2E Test: Cover Letter Generator with Auto-Fill and Generate
Test Case: User can paste job URL, auto-fill fields, and generate cover letter
"""
import pytest
from playwright.async_api import async_playwright

BASE_URL = "https://careerpilotconsulting.com"
TEST_EMAIL = "ramjee.chaitanya@gmail.com"
TEST_PASSWORD = "career123"
GOOGLE_JOB_URL = "https://www.google.com/about/careers/applications/jobs/results/109674029161292486-software-engineering-manager-ii-google-distributed-cloud-hosted"

@pytest.mark.asyncio
async def test_cover_letter_autofill_and_generate():
    """Test cover letter generation with auto-fill"""
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
            
            # Navigate to Generator
            await page.goto(f"{BASE_URL}/generator")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(2000)
            
            # Select cover letter mode
            mode_select = page.locator('select[name="mode"]').first
            assert await mode_select.count() > 0, "Mode select not found"
            await mode_select.select_option('cover-letter')
            await page.wait_for_timeout(2000)
            
            # Fill in job URL
            url_input = page.locator('input[type="url"]').first
            assert await url_input.count() > 0, "URL input not found"
            await url_input.fill(GOOGLE_JOB_URL)
            await page.wait_for_timeout(1000)
            
            # Click Auto-fill button
            autofill_button = page.locator('button:has-text("Auto-fill"), button:has-text("auto-fill")').first
            assert await autofill_button.count() > 0, "Auto-fill button not found"
            await autofill_button.click()
            await page.wait_for_timeout(5000)
            
            # Verify fields are populated
            company_input = page.locator('input[name="company"], input[placeholder*="company" i]').first
            role_input = page.locator('input[name="role"], input[placeholder*="role" i]').first
            
            if await company_input.count() > 0:
                company_value = await company_input.input_value()
                assert company_value, "Company field not populated"
                print(f"✅ Company field populated: {company_value}")
            
            if await role_input.count() > 0:
                role_value = await role_input.input_value()
                assert role_value, "Role field not populated"
                print(f"✅ Role field populated: {role_value}")
            
            # Click Generate button
            generate_button = page.locator('button:has-text("Generate"), button[type="submit"]').first
            assert await generate_button.count() > 0, "Generate button not found"
            await generate_button.click()
            
            # Wait for generated output
            await page.wait_for_selector(
                '.result-area, .output, [class*="result"], [class*="generated"], textarea[readonly]',
                timeout=30000
            )
            await page.wait_for_timeout(3000)
            
            # Verify output is visible
            output_area = page.locator('.result-area, .output, [class*="result"]').first
            assert await output_area.count() > 0, "Generated cover letter not found"
            
            print("✅ Test passed: Cover letter generated successfully")
            
        finally:
            await browser.close()

