from playwright.sync_api import Page, expect, sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:1420/")
            page.wait_for_timeout(1000)

            print("Clicking Meetings button...")
            page.get_by_role("button", name="Meetings").click()

            print("Waiting for Meeting cards...")
            page.wait_for_selector(".card")

            print("Taking screenshot of Meetings list...")
            page.screenshot(path="/app/verification_meetings_list.png")

            # Click on the first meeting card
            print("Clicking first meeting card...")
            meeting_card = page.locator(".card").first
            meeting_card.click()

            # Take screenshot of the meeting prep view
            print("Taking screenshot of Meeting Prep view...")
            page.wait_for_timeout(1000) # Small wait for animation/render
            page.screenshot(path="/app/verification_meeting_prep.png")

            print("Opening Add Attendee modal...")
            page.get_by_role("button", name="+ Add Attendee").click()

            print("Taking screenshot of Add Attendee modal...")
            page.wait_for_timeout(500) # Wait for modal animation
            page.screenshot(path="/app/verification_add_attendee.png")

            print("Verification successful!")

        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
