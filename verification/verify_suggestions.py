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

    # 4. Type text (Use newlines to ensure multiple nodes)
    textarea = page.get_by_role("textbox")
    textarea.fill("Planificación.\nDesarrollo.\nLanzamiento.")

    # 5. Select text
    textarea.click()
    page.keyboard.press("Control+A")

    # 6. Click "Automático"
    page.wait_for_timeout(500)
    page.get_by_text("Automático").click()

    # 7. Verify Suggestions Panel Opens
    expect(page.get_by_text("AI Suggestions")).to_be_visible()

    # 8. Verify Diagram Generated
    page.wait_for_timeout(3000)
    expect(page.locator(".font-caveat").filter(has_text="Planificación")).to_be_visible()

    # 9. Switch Style: Click "Cycle"
    page.get_by_text("Cycle").click()

    # 10. Wait for regeneration
    page.wait_for_timeout(3000)

    # 11. Verify diagram still exists and check for "Desarrollo"
    expect(page.locator(".font-caveat").filter(has_text="Desarrollo")).to_be_visible()

    # Take screenshot
    page.screenshot(path="verification/napkin_suggestions_final.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
