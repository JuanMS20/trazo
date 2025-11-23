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

    # 4. Type SHORT text to trigger Creative Mode
    textarea = page.get_by_role("textbox")
    textarea.fill("Guerra Mundial")

    # 5. Select text
    textarea.click()
    page.keyboard.press("Control+A")

    # 6. Click "Automático" (Bolt)
    page.wait_for_timeout(500)
    page.get_by_text("Automático").click()

    # 7. Wait for generation (It simulates "Activando Modo Creativo...")
    # We should see the loader with "Modo Creativo" or "Diseñando Infografía"
    # Wait for completion
    page.wait_for_timeout(4000)

    # 8. Verify Rich Content
    # Should contain "Naciones Unidas" (from the expanded mock data)
    expect(page.locator(".font-caveat").filter(has_text="Naciones Unidas")).to_be_visible()

    # Should contain description "Organización internacional"
    expect(page.get_by_text("Organización internacional")).to_be_visible()

    # 9. Verify Layout (Infographic variant)
    # Check if the central node is yellow/gold (circle)
    # We can check for class/style or visual inspection via screenshot.

    page.screenshot(path="verification/napkin_infographic_final.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
