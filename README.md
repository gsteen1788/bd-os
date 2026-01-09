# BD OS (Alpha)

This is the frontend build of BD OS.

## Setup

1.  **Install Node.js** (if not already installed).
2.  **Install Dependencies**:
    ```bash
    npm install
    # or if that fails due to network/lockfile issues:
    npm install --no-optional
    ```
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Features (Frontend Mock)

-   **Dashboard**: View upcoming meetings and chances (mock data).
-   **Relationships**: View a list of contacts (mock data).
-   **Navigation**: Switch between core tabs.
-   **Design System**: Custom CSS variables for a premium "Space Blue" theme.

## Native Build (Future)

To build the native desktop application:
1.  Install Rust (rustup).
2.  Run `npm run tauri dev`.
