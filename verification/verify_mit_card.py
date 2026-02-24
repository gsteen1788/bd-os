from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to dashboard...")
            page.goto("http://localhost:1420/")

            # Wait for dashboard to load
            page.wait_for_selector("h2", state="visible") # "Most Important Tasks" h2

            print("Dashboard loaded. Waiting for MIT cards...")
            # Wait for at least one MitCard to appear
            # The card has class 'card' or specific content
            page.wait_for_selector(".card", state="visible")

            # Find the first card
            card = page.locator(".card").first

            print("Found card. Hovering over 'Complete' button to show icon...")
            # The complete button has aria-label starting with "Mark"
            # It might take a moment for data to load if it's async mock data
            page.wait_for_timeout(2000)

            # Take screenshot of the full dashboard to see context
            page.screenshot(path="verification/dashboard_full.png")

            # Take screenshot of the card
            print("Taking screenshot of pending card...")
            card.screenshot(path="verification/mit_card_pending.png")

            # Now switch to History view
            print("Switching to History view...")
            # Select by label logic might be tricky if no label, use css
            page.locator("select.input").select_option("HISTORY")

            # Wait for history cards
            page.wait_for_timeout(2000) # Wait for re-render

            # Find history card
            history_cards = page.locator(".card")
            if history_cards.count() > 0:
                history_card = history_cards.first

                # Check date formatting
                print("Taking screenshot of history card...")
                history_card.screenshot(path="verification/mit_card_history.png")

                # Focus on B indicator
                print("Focusing B indicator...")
                # B indicator has text "B" and role "img"
                b_indicator = history_card.get_by_role("img", name="Big Impact").first
                if b_indicator.is_visible():
                    b_indicator.focus()
                    page.wait_for_timeout(500)
                    page.screenshot(path="verification/mit_card_focus.png")
                else:
                    print("B indicator not found or not visible")
            else:
                print("No history cards found")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run()
