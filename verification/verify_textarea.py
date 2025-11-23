from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Go to the app
    page.goto("http://localhost:3000")

    # 2. Login
    page.get_by_role("button", name="Continuar con Google").click()

    # 3. Go to Workspace
    page.get_by_text("Nuevo Trazo").click()

    # 4. Type text
    textarea = page.get_by_role("textbox")
    textarea.fill("Primero abrimos el programa.")

    # 5. Select text
    textarea.click()
    page.keyboard.press("Control+A")

    # 6. Check for menu
    expect(page.get_by_text("Generar...")).to_be_visible()

    # 7. Click "Automático"
    page.wait_for_timeout(500)
    page.get_by_text("Automático").click()

    # 8. Verify Result (Diagram generated)
    # We check for the text appearing in the canvas (which is SVG text)
    # The screenshot showed it generated.
    # We wait for the processing to finish (loader gone)
    # The loader container has z-index 30
    # We can wait for "Analizando semántica..." to disappear

    # Wait a bit for the process
    page.wait_for_timeout(4000)

    # Verify static text "Brainstorming Sesión" is NOT present
    expect(page.get_by_text("Brainstorming Sesión")).not_to_be_visible()

    # Take success screenshot
    page.screenshot(path="verification/napkin_textarea_success_final.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
