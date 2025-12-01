# E2E Test Cases for CareerPilot Consulting

These test cases are designed for DevOps pipeline integration and cover the main user workflows.

## Prerequisites

```bash
pip install pytest playwright pytest-asyncio
playwright install chromium
```

## Test Cases

### 1. `test_upload_context.py`
**Test**: Upload Career Context
- Logs in
- Navigates to dashboard
- Uploads sample career context file
- Clicks "Save context" button
- Verifies success message
- Verifies context appears in list

### 2. `test_resume_analyzer.py`
**Test**: Resume Builder - Analyze Resume
- Logs in
- Navigates to Resume Builder
- Pastes sample resume content
- Clicks "Analyze" button
- Waits for analysis output
- Verifies output is displayed

### 3. `test_cover_letter_autofill.py`
**Test**: Cover Letter Generator with Auto-Fill and Generate
- Logs in
- Navigates to Generator
- Selects "Cover Letter" mode
- Pastes Google job posting URL
- Clicks "Auto-fill" button
- Verifies company and role fields are populated
- Clicks "Generate" button
- Waits for generated cover letter
- Verifies output is displayed

## Running Tests

### Run all tests:
```bash
pytest tests/e2e/ -v
```

### Run specific test:
```bash
pytest tests/e2e/test_upload_context.py -v
```

### Run with headless browser:
Tests are configured to run headless by default. To run with visible browser:
```python
browser = await p.chromium.launch(headless=False)
```

## Test Data

- Sample context file: `sample_career_context.md`
- Sample resume: `sample_resume.txt`
- Test credentials: Configured in each test file

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: |
    pip install pytest playwright pytest-asyncio
    playwright install chromium

- name: Run E2E tests
  run: pytest tests/e2e/ -v
```

## Notes

- Tests use production URL: `https://careerpilotconsulting.com`
- Tests require valid credentials (configured in test files)
- Tests include proper waits and timeouts for async operations
- All tests verify page navigation and element visibility



