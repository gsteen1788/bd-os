
import asyncio
from playwright.async_api import async_playwright, expect

async def verify_date_formatting():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            # Navigate to the dashboard
            await page.goto("http://localhost:1420/")

            # Wait for content to load (MIT Card or Admin Task Bar)
            # We are looking for formatted dates, e.g. "Mar 15" instead of full date strings

            # Allow some time for data to load if it's fetching
            await page.wait_for_timeout(3000)

            # Check for MIT Card date presence (pending view)
            # Use a locator that finds any text matching typical short date format (Month Day)
            # This is a bit loose but visually we will check the screenshot

            # Take a screenshot of the Dashboard
            await page.screenshot(path="verification_dashboard.png", full_page=True)
            print("Dashboard screenshot captured.")

            # Navigate to Meeting Prep (History or Upcoming)
            # Click on 'Meetings' tab
            await page.get_by_role("button", name="Meetings").click()
            await page.wait_for_timeout(2000)

            # Take a screenshot of the Meeting List
            await page.screenshot(path="verification_meetings.png", full_page=True)
            print("Meetings screenshot captured.")

        except Exception as e:
            print(f"Error during verification: {e}")
            await page.screenshot(path="verification_error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_date_formatting())
