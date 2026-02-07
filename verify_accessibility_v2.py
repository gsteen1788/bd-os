from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app
            page.goto("http://localhost:1420")

            # Wait for content to load
            page.wait_for_timeout(1000)

            # Open the calendar modal
            calendar_btn = page.locator("button[aria-label='Open Outlook Calendar']")
            expect(calendar_btn).to_be_visible()
            calendar_btn.click()

            # Wait for modal content
            page.wait_for_timeout(500)

            # Check if we are connected or not
            # "Not Connected" text is in the CalendarWidget
            if page.get_by_text("Not Connected").is_visible():
                print("State: Not Connected")

                # Check Connect Outlook button
                connect_btn = page.locator("button[aria-label='Connect Outlook']")
                expect(connect_btn).to_be_visible()
                print("Confirmed: Connect Outlook button has correct aria-label")

                # Check Disconnected emoji role
                disconnected_emoji = page.locator("span[role='img'][aria-label='Disconnected']")
                expect(disconnected_emoji).to_be_visible()
                print("Confirmed: Disconnected emoji has correct role and aria-label")

            else:
                print("State: Connected")

                # If connected, we should see the refresh button
                refresh_btn = page.locator("button[aria-label='Refresh events']")
                if refresh_btn.is_visible():
                    print("Confirmed: Refresh events button has correct aria-label")

                # Check Quick Add input
                input_field = page.locator("input[aria-label='New meeting subject']")
                if input_field.is_visible():
                     print("Confirmed: Input field has correct aria-label")

            print("Accessibility verification passed!")
            page.screenshot(path="verification_modal.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification_modal_error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run()
