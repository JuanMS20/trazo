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
    textarea.fill("El ciclo de la idea genera dinero.")

    # 5. Select text
    textarea.click()
    page.keyboard.press("Control+A")

    # 6. Click "Automático"
    page.wait_for_timeout(500)
    page.get_by_text("Automático").click()

    # 7. Wait for generation
    page.wait_for_timeout(4000)

    # 8. Verify Icon (Lightbulb)
    # Ensure it's not in the textarea (textarea doesn't have icon text)
    expect(page.get_by_text("lightbulb")).to_be_visible()

    # 9. Verify Diagram Text
    # We want the text in the diagram, NOT the textarea.
    # The diagram nodes are in divs with absolute position.
    # We can filter by the font class we added: 'font-caveat'
    diagram_text = page.locator(".font-caveat").filter(has_text="El ciclo de la idea")
    expect(diagram_text).to_be_visible()

    # Take screenshot
    page.screenshot(path="verification/napkin_style_final.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
