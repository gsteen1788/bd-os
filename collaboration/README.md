# Antigravity Collaboration Hub

This directory serves as the "Shared Brain" for multiple Antigravity instances to collaborate.

## Structure
- **`inbox/`**: The "Builder" instance drops completed work or code contexts here for review.
- **`feedback/`**: The "Reviewer" instance drops their analysis and feedback here.
- **`roles/`**: Contains the "System Prompts" you should paste into new Antigravity instances to give them their specific jobs.
    - `reviewer_prompt.md`: Make an instance a Reviewer.
    - `builder_prompt.md`: Make an instance a Builder (standard, but enhanced awareness).
- **`scripts/`**: Helper scripts.
    - `watch_inbox.ps1`: Run this in the Reviewer's terminal to auto-wait for new work.

## How to Start a Session

1.  **Main Instance (Builder)**: Just work as normal. When you want a review, write a file to `inbox/`.
2.  **Second Instance (Reviewer)**:
    *   Open a new Antigravity chat.
    *   Paste the content of `roles/reviewer_prompt.md`.
    *   (Optional) Run `scripts/watch_inbox.ps1` to have it auto-wake when you submit work.
