import { getClient, Body } from '@tauri-apps/api/http';

// Azure CLI Client ID (Publicly known and widely whitelisted)
const CLIENT_ID = '14d82eec-204b-4c2f-b7e8-296a70dab67e'; // Microsoft Graph PowerShell
const TENANT_ID = 'common'; // Supports multi-tenant and personal accounts
const SCOPES = 'User.Read Calendars.ReadWrite offline_access';

const TOKEN_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
const DEVICE_CODE_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/devicecode`;

interface DeviceCodeResponse {
    user_code: string;
    device_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
    message: string;
}

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    user: any | null;
}

class AuthService {
    private state: AuthState = {
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        user: null,
    };

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        const stored = localStorage.getItem('ms_auth_state');
        if (stored) {
            this.state = JSON.parse(stored);
        }
    }

    private saveToStorage() {
        localStorage.setItem('ms_auth_state', JSON.stringify(this.state));
    }

    /**
     * Step 1: Initiate the Device Code Flow
     * Returns the code and URL for the user to visit.
     */
    async initiateDeviceFlow(): Promise<DeviceCodeResponse> {
        const client = await getClient();
        const params = {
            client_id: CLIENT_ID,
            scope: SCOPES,
        };

        const response = await client.request<DeviceCodeResponse>({
            method: 'POST',
            url: DEVICE_CODE_ENDPOINT,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: Body.form(params),
        });

        if (!response.ok) {
            throw new Error(`Failed to initiate device flow: ${response.status}`);
        }

        return response.data;
    }

    /**
     * Step 2: Poll for the token while the user authenticates
     */
    async pollForToken(deviceCode: string, intervalSeconds: number = 5): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const client = await getClient();
                    const params = {
                        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                        client_id: CLIENT_ID,
                        device_code: deviceCode,
                    };

                    const response = await client.request<any>({
                        method: 'POST',
                        url: TOKEN_ENDPOINT,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: Body.form(params),
                    });

                    const data = response.data;

                    if (response.ok) {
                        clearInterval(interval);
                        this.handleTokenSuccess(data);
                        resolve(true);
                    } else if (data.error === 'authorization_pending') {
                        // User hasn't signed in yet, keep polling
                    } else {
                        clearInterval(interval);
                        reject(new Error(`Token polling failed: ${data.error_description || data.error}`));
                    }
                } catch (error) {
                    clearInterval(interval);
                    reject(error);
                }
            }, intervalSeconds * 1000);
        });
    }

    /**
     * Handle successful token response
     */
    private handleTokenSuccess(data: TokenResponse) {
        const now = Date.now();
        this.state = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: now + data.expires_in * 1000,
            user: null, // User details will be fetched separately
        };
        this.saveToStorage();
    }

    /**
     * Refresh the access token manually
     */
    async refreshAccessToken(): Promise<string | null> {
        if (!this.state.refreshToken) return null;

        try {
            const client = await getClient();
            const params = {
                grant_type: 'refresh_token',
                client_id: CLIENT_ID,
                refresh_token: this.state.refreshToken,
                scope: SCOPES,
            };

            const response = await client.request<any>({
                method: 'POST',
                url: TOKEN_ENDPOINT,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: Body.form(params),
            });

            if (!response.ok) {
                // If refresh fails, clear state
                this.logout();
                return null;
            }

            const data = response.data;
            this.handleTokenSuccess(data);
            return data.access_token;
        } catch (error) {
            console.error('Failed to refresh token', error);
            return null;
        }
    }

    /**
     * Get valid access token (refreshing if necessary)
     */
    async getAccessToken(): Promise<string | null> {
        if (!this.state.accessToken) return null;

        if (Date.now() >= (this.state.expiresAt || 0) - 60000) { // Buffer of 1 minute
            return this.refreshAccessToken();
        }

        return this.state.accessToken;
    }

    /**
     * Check if user is currently authenticated
     */
    isAuthenticated(): boolean {
        return !!this.state.accessToken; // Simple check, validity checked on use
    }

    logout() {
        this.state = {
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            user: null,
        };
        this.saveToStorage();
    }
}

export const authService = new AuthService();
