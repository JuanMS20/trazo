from playwright.sync_api import sync_playwright

def verify_trazo(page):
    # 1. Go to app
    page.goto("http://localhost:3000")

    # Handle Login if present (click "Continuar con Google" which likely just mocks login or navigates)
    # Based on the screenshot, there is a button "Continuar con Google".
    if page.is_visible("text=Continuar con Google"):
        page.click("text=Continuar con Google")
        # Assuming this navigates to Dashboard or Workspace?
        # Let's wait.
        page.wait_for_timeout(1000)

    # If we are on Dashboard (check for grid view or similar), navigate to Workspace
    # Assuming Dashboard has a "New" or document list.
    # If the app navigates to Loading then Dashboard/Workspace.

    # Let's try to find a way to get to Workspace.
    # If on Dashboard, click on a document or "New".
    if page.is_visible("text=Untitled Document"):
         pass # Already in workspace? No, header says Untitled Document.
    elif page.is_visible(".material-symbols-outlined:has-text('add')"): # Example "New" button?
         page.click(".material-symbols-outlined:has-text('add')")

    # Just in case, let's force the view if possible via UI interaction logic we don't know fully.
    # But usually "Continuar con Google" -> Dashboard.
    # Dashboard -> Click a card -> Workspace.

    # Let's see if we can just wait for .ProseMirror.
    # If it fails again, I'll take a screenshot after login click.

    # If we are in Dashboard, we might need to click something to go to Workspace.
    # Let's assume the login button goes to Dashboard.
    # I'll add a screenshot step right after login to debug.

    page.wait_for_timeout(2000)
    page.screenshot(path="verification/post_login.png")

    # If we see "Mis Trazos" or similar, click on one.
    # If we see a "plus" button, click it.
    if page.is_visible("button:has(.material-symbols-outlined:text-is('add'))"):
         page.click("button:has(.material-symbols-outlined:text-is('add'))")
    elif page.is_visible("button:has-text('Nuevo')"):
         page.click("button:has-text('Nuevo')")

    # 2. Check if editor is loaded
    page.wait_for_selector(".ProseMirror", timeout=10000)

    # 3. Type some text
    editor = page.locator(".ProseMirror")
    editor.click()
    editor.fill("Este es un texto de prueba para verificar el editor Tiptap y los diagramas.")

    # 4. Select text
    editor.select_text()

    # 5. Wait for floating menu or visual feedback
    page.wait_for_timeout(1000)

    # 6. Take screenshot of editor with selection
    page.screenshot(path="verification/step1_editor.png")

    # 7. Check if Suggestions Panel button exists
    page.locator("button[title='AI Suggestions']").click()
    page.wait_for_timeout(500)
    page.screenshot(path="verification/step2_suggestions.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_trazo(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_2.png")
        finally:
            browser.close()
