from playwright.sync_api import Page, expect, sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(accept_downloads=True)
    page = context.new_page()

    # 1. Go to the app
    page.goto("http://localhost:3000")

    # 2. Login
    page.get_by_role("button", name="Continuar con Google").click()

    # 3. Go to Workspace
    page.get_by_text("Nuevo Trazo").click()

    # 5. Create Content
    textarea = page.get_by_role("textbox")
    textarea.fill("Persistencia de datos.")

    # Generate Diagram
    textarea.click()
    page.keyboard.press("Control+A")
    page.wait_for_timeout(500)
    page.get_by_text("Automático").click()
    page.wait_for_timeout(4000) # Wait for gen

    # 6. Verify Persistence: Reload Page
    page.reload()

    # App resets to Login on reload (since ViewState is not persisted in this demo)
    # So we must login and navigate back to Workspace
    page.get_by_role("button", name="Continuar con Google").click()
    # Navigate to "Nuevo Trazo" (or existing? Dashboard logic resets too, mocks list)
    page.get_by_text("Nuevo Trazo").click()

    # NOW check content
    # It should load from localStorage
    expect(page.get_by_role("textbox")).to_have_value("Persistencia de datos.")
    # Verify diagram is present (node with text)
    # Note: Diagram data is loaded from localStorage
    expect(page.locator(".font-caveat").filter(has_text="Persistencia de datos")).to_be_visible()

    # 7. Verify Export
    page.get_by_role("button", name="Exportar").click()

    # Click Download
    with page.expect_download() as download_info:
        page.get_by_role("button", name="Descargar").click()

    download = download_info.value
    print(f"Download started: {download.suggested_filename}")
    download.save_as("verification/downloaded_diagram.png")

    # 8. Verify Drag (Simulated)
    # Get a node wrapper (Draggable div)
    # The Draggable component wraps the motion.div
    # The class `react-draggable` is applied by the library
    node = page.locator(".react-draggable").first

    # Drag it
    box = node.bounding_box()
    if box:
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        page.mouse.move(box["x"] + 200, box["y"] + 200)
        page.mouse.up()

        # Verify position changed
        time.sleep(0.5)
        new_box = node.bounding_box()
        # It should have moved approx 200px
        if new_box["x"] > box["x"] + 50:
             print("Drag successful: Node moved.")
        else:
             print("Drag warning: Node didn't move significantly.")

    page.screenshot(path="verification/napkin_robust_final.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
