from playwright.sync_api import sync_playwright

def verify_editor_interactions(page):
    page.goto("http://localhost:3001")

    # Handle Login if present
    if page.is_visible("text=Continuar con Google"):
        page.click("text=Continuar con Google")
        page.wait_for_timeout(1000)

    # Navigate to Workspace
    if page.is_visible("text=Nuevo Trazo"):
         page.click("text=Nuevo Trazo")

    # Wait for editor
    page.wait_for_selector(".ProseMirror", timeout=20000)

    editor = page.locator(".ProseMirror")
    editor.click()

    # Clear existing content
    editor.press("Control+a")
    editor.press("Backspace")

    # Type some text
    editor.type("This is a test text to generate a diagram.")

    # Select text using mouse drag
    # Get bounding box of editor
    box = editor.bounding_box()
    if box:
        # Start from top left with some padding
        page.mouse.move(box['x'] + 10, box['y'] + 10)
        page.mouse.down()
        # Move to end of text (rough estimate)
        page.mouse.move(box['x'] + 300, box['y'] + 10)
        page.mouse.up()

    # Wait for the diagram generation button (lightning bolt)
    # The bubble menu logic uses !selection.empty check.

    # Check if button appears
    try:
        page.wait_for_selector("button[title='Generar Visual']", timeout=5000)
        page.click("button[title='Generar Visual']")
    except:
        print("Failed to click generate button")
        page.screenshot(path="verification/failed_selection.png")
        return

    # Wait for diagram to generate
    # Since I don't have a real API key, this might fail or show error.
    # However, the AiAgent mock fallback should kick in if configured,
    # OR the error handling should show an alert.
    # The code has `alert("Error al generar el diagrama. Intenta de nuevo.");`

    # Let's check if we get an alert or if it hangs.
    # Playwright handles dialogs automatically by dismissing them unless handled.
    page.on("dialog", lambda dialog: dialog.accept())

    # Wait for either diagram or check for failure
    try:
        page.wait_for_selector(".diagram-node-view", timeout=20000)
    except:
        print("Diagram did not appear")
        page.screenshot(path="verification/no_diagram.png")
        return

    # Wait a bit for nodes to render
    page.wait_for_timeout(2000)

    # Screenshot initial state
    page.screenshot(path="verification/step1_diagram_generated.png")

    # Test Quick Style Menu
    # Locate a node text
    diagram_text = page.locator(".diagram-node-view span.font-caveat").first
    diagram_text.click()

    page.wait_for_timeout(500)
    page.screenshot(path="verification/step2_color_menu.png")

    # Test Manual Editing (Double Click)
    diagram_text.dblclick()
    page.wait_for_timeout(500)
    page.screenshot(path="verification/step3_editing_textarea.png")

    # Edit text
    page.keyboard.type(" Edited")
    page.keyboard.press("Enter")
    page.wait_for_timeout(500)
    page.screenshot(path="verification/step4_edited_text.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_editor_interactions(page)
        except Exception as e:
            print(f"Error: {e}")
            # page.screenshot(path="verification/interaction_error.png")
        finally:
            browser.close()
