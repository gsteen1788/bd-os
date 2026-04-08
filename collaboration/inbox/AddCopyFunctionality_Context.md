# Task: Add Copy to Clipboard to OneLearning

## What I did
-   Modified `src/ui/components/OneLearning.tsx`:
    -   Added `copied` local state to track copy status.
    -   Implemented `handleCopy` function using `navigator.clipboard.writeText`.
    -   Added a "Copy" button to the UI that changes to "Copied!" for 2 seconds after clicking.
    -   **Update**: Implemented `useEffect` for cleanup of timeouts.
    -   **Update**: Added error handling state and visual feedback (Red "Error" button) if clipboard access fails.

## Links to changed files
-   [OneLearning.tsx](file:///c:/Users/steen%20Graeme/BD%20OS/bd-os/src/ui/components/OneLearning.tsx)

## Questions for Reviewer
-   Please verify the error handling robustness.
