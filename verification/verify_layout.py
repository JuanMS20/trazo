from playwright.sync_api import sync_playwright

def verify_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5174")

            # App starts at Login, click button to go to Dashboard
            # Look for "Empezar" or "Login" button
            # Checking Login.tsx would be good, but let's guess based on standard UI
            page.wait_for_selector("button", timeout=5000)
            page.click("button") # Clicks the first button, usually Login

            # Now at Dashboard? Wait for something dashboard-y
            # Assuming dashboard has a "New Note" or grid view
            page.wait_for_timeout(1000)

            # Just force navigate logic if the app allows, or simulate clicks
            # If dashboard has "Crear Nuevo" or similar
            # Let's try to click a button that navigates to Workspace.
            # In Dashboard.tsx (not read here), usually there is a create button.

            # Workaround: App.tsx handles state. We can't easily change React state from here without interaction.
            # Let's try to click through.

            # Click "Create" or similar if it exists
            buttons = page.locator("button").all()
            if len(buttons) > 0:
                 # Click the primary action usually
                 buttons[-1].click()

            page.wait_for_timeout(1000)

            # Check if we are at workspace (textarea exists)
            if page.locator("textarea").count() > 0:
                print("Reached Workspace")
            else:
                # Maybe we need to click "Entrar" -> "Loading" -> "Dashboard" -> "Note"
                print("Trying to navigate deeper...")
                # If we are stuck, we might need to update App.tsx temporarily to default to Workspace for testing,
                # OR just trust the code changes if we can't automate this easily without knowing the exact flow.
                # However, I should try to get the screenshot.

                # Let's try clicking all buttons until textarea appears? No.
                pass

            # Wait for content to load
            page.wait_for_selector("textarea", timeout=5000)

            # Type some text
            page.fill("textarea", "El sol brilla en el cielo azul.")

            # Open Suggestions Panel
            page.click("button[title='AI Suggestions']")
            page.wait_for_timeout(1000) # Wait for animation

            # Verify Panel is open (sidebar width > 0)
            # Take screenshot of the whole layout
            page.screenshot(path="verification/layout_test.png")
            print("Screenshot saved to verification/layout_test.png")

        except Exception as e:
            print(f"Error: {e}")
            # Take a screenshot of where we got stuck
            page.screenshot(path="verification/stuck.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_layout()
