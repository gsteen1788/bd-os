import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Start at root
        print("Navigating to root...")
        await page.goto("http://localhost:5173")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="verification_step_0.png")

        # Click on "Meetings" tab
        print("Clicking Meetings tab...")
        await page.get_by_role("button", name="Meetings").click()
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification_step_1.png")

        # Create a new meeting if none exist
        print("Checking for New Meeting button...")
        if await page.get_by_text("New Meeting").is_visible():
            print("Creating new meeting...")
            await page.get_by_text("New Meeting").click()
            await page.wait_for_timeout(500)

            # Use specific selectors if possible, or fallback to filling first input
            # Assuming the modal is open
            await page.screenshot(path="verification_step_2_modal.png")

            inputs = page.locator("input")
            count = await inputs.count()
            print(f"Found {count} inputs")
            if count > 0:
                await inputs.first.fill("Accessibility Test Meeting")

            await page.get_by_role("button", name="Create").click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path="verification_step_3_created.png")

        # Select the meeting to enter prep mode
        print("Selecting meeting...")
        # Use a more generic selector or wait
        try:
            await page.get_by_text("Accessibility Test Meeting", exact=False).first.click()
        except:
             # Maybe it's not exact text?
             print("Could not click meeting by text. Dumping page content.")
             # print(await page.content())

        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification_step_4_prep.png")

        # Add a Risk to verify the delete button
        print("Adding Risk...")
        await page.get_by_text("+ Add Risk").click()
        await page.wait_for_timeout(500)

        # Fill risk form
        risk_input = page.locator("input[placeholder*='Risk']").first
        if await risk_input.is_visible():
            await risk_input.fill("Test Risk")
        else:
            # Fallback
            await page.locator("input").first.fill("Test Risk")

        await page.locator("textarea").first.fill("Mitigation plan") # Mitigation
        await page.get_by_role("button", name="Add Risk").click()
        await page.wait_for_timeout(500)

        # Add a Question to verify its delete button
        print("Adding Question...")
        await page.get_by_role("button", name="+", exact=True).first.click()
        await page.wait_for_timeout(500)
        await page.locator("textarea").first.fill("Test Question")
        await page.get_by_role("button", name="Add").click()
        await page.wait_for_timeout(500)

        # Take screenshot of the prep screen showing opacity-40 elements
        print("Taking final screenshot...")
        await page.screenshot(path="verification_meeting_prep.png", full_page=True)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
