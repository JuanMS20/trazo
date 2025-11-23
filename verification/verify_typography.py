from playwright.sync_api import sync_playwright

def verify_typography(page):
    # Use new port
    page.goto("http://localhost:3001")

    # Handle Login if present
    if page.is_visible("text=Continuar con Google"):
        page.click("text=Continuar con Google")
        page.wait_for_timeout(1000)

    # We are on Dashboard now. Need to click "Nuevo Trazo"
    if page.is_visible("text=Nuevo Trazo"):
         page.click("text=Nuevo Trazo")

    # Wait for editor
    page.wait_for_selector(".ProseMirror", timeout=20000)

    editor = page.locator(".ProseMirror")
    editor.click()

    # Clear existing content
    editor.press("Control+a")
    editor.press("Backspace")

    # Type markdown header
    editor.type("# H1 Header Typography Test")
    editor.press("Enter")
    editor.type("This is a standard paragraph with **bold text**.")

    # Wait a bit for render
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="verification/typography_test.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_typography(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/typography_error_2.png")
        finally:
            browser.close()
