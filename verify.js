import { sync_playwright } from "playwright";
import * as path from "path";

async function verifyMeetingPrep() {
  const browser = await sync_playwright().chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Navigating to app...");
    await page.goto("http://localhost:1420/");

    console.log("Navigating to Meetings...");
    await page.getByRole("button", { name: "Meetings" }).click();

    // Wait for the meeting cards to load
    console.log("Waiting for Meeting cards...");
    await page.waitForSelector(".card");

    console.log("Taking screenshot of Meetings list...");
    await page.screenshot({ path: "/app/verification_meetings_list.png" });

    // Click on the first meeting card
    console.log("Clicking first meeting card...");
    const meetingCard = page.locator(".card").first();
    await meetingCard.click();

    // Take screenshot of the meeting prep view
    console.log("Taking screenshot of Meeting Prep view...");
    await page.waitForTimeout(1000); // Small wait for animation/render
    await page.screenshot({ path: "/app/verification_meeting_prep.png" });

    // Open add attendee modal
    console.log("Opening Add Attendee modal...");
    await page.getByRole('button', { name: '+ Add Attendee' }).click();

    // Take screenshot of the modal
    console.log("Taking screenshot of Add Attendee modal...");
    await page.waitForTimeout(500); // Wait for modal animation
    await page.screenshot({ path: "/app/verification_add_attendee.png" });

    console.log("Verification successful!");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await browser.close();
  }
}

verifyMeetingPrep();
