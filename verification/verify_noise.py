from playwright.sync_api import sync_playwright

def verify_noise(page):
    page.goto("http://localhost:3001")

    # Wait for page to load
    page.wait_for_timeout(1000)

    # Take screenshot of the entire background (login page is fine)
    page.screenshot(path="verification/noise_texture.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_noise(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
