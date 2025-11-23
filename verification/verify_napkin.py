from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Go to the app (Using port 3000 as per log)
    page.goto("http://localhost:3000")

    # 2. Login
    page.get_by_role("button", name="Continuar con Google").click()

    # 3. Wait for Dashboard and navigate to New Workspace
    expect(page.get_by_text("Nuevo Trazo")).to_be_visible()
    page.get_by_text("Nuevo Trazo").click()

    # 4. Workspace loaded
    expect(page.get_by_text("Brainstorming Sesión")).to_be_visible()

    # 5. Interact with text to show context menu
    paragraph = page.get_by_text("Una vez que entendemos el problema")
    paragraph.click()

    # 6. Select "Diagrama de Flujo" from the context menu
    # The menu appears when text is clicked
    menu_option = page.get_by_text("Diagrama de Flujo")
    expect(menu_option).to_be_visible()
    menu_option.click()

    # 7. Verify Diagram Generation
    page.wait_for_timeout(2000)

    # Take screenshot
    page.screenshot(path="verification/napkin_test.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
