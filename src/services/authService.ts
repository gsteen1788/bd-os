import { getClient, Body } from '@tauri-apps/api/http';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/shell';

// Use Azure CLI Client ID which supports http://localhost:8400 redirect and is highly trusted globally
const CLIENT_ID = import.meta.env.VITE_MS_GRAPH_CLIENT_ID && import.meta.env.VITE_MS_GRAPH_CLIENT_ID !== 'your_client_id_here' 
    ? import.meta.env.VITE_MS_GRAPH_CLIENT_ID 
    : '04b07795-8ddb-461a-bbee-02f9e1bf7b46';

const TENANT_ID = import.meta.env.VITE_MS_GRAPH_TENANT_ID && import.meta.env.VITE_MS_GRAPH_TENANT_ID !== 'your_tenant_id_here'
    ? import.meta.env.VITE_MS_GRAPH_TENANT_ID 
    : 'common';

const SCOPES = 'User.Read Calendars.ReadWrite offline_access';
const REDIRECT_URI = 'http://localhost:8400';

const AUTH_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`;
const TOKEN_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

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
        const stored = sessionStorage.getItem('ms_auth_state');
        if (stored) {
            this.state = JSON.parse(stored);
        }
    }

    private saveToStorage() {
        sessionStorage.setItem('ms_auth_state', JSON.stringify(this.state));
    }

    /**
     * Start the PKCE Authorization Code Flow
     */
    async login(): Promise<void> {
        // We use PKCE to securely get a token without a client secret.
        // For simplicity in this demo, we generate a random string for state and verifier.
        // In full production, use crypto APIs to generate high-entropy verifier and challenge.
        const codeVerifier = this.generateRandomString(64);
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        const state = this.generateRandomString(32);

        const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_mode=query&scope=${encodeURIComponent(SCOPES)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

        // 1. Open the user's default browser to the Microsoft login page
        await open(authUrl);

        try {
            // 2. Block and wait for the localhost server to capture the redirect code
            const queryStr: string = await invoke('start_auth_server', { port: 8400 });

            const params = new URLSearchParams(queryStr);
            const code = params.get('code');
            const returnedState = params.get('state');

            if (returnedState !== state) {
                throw new Error("Invalid state parameter. CSRF validation failed.");
            }

            if (!code) throw new Error("No authorization code received.");

            // 3. Exchange the code for the tokens
            await this.exchangeCodeForToken(code, codeVerifier);
        } catch (error) {
            throw error;
        }
    }

    private generateRandomString(length: number): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        const values = new Uint32Array(length);
        crypto.getRandomValues(values);
        for (let i = 0; i < length; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    }

    private async generateCodeChallenge(v: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(v);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return this.base64urlencode(new Uint8Array(hash));
    }

    private base64urlencode(a: Uint8Array): string {
        let str = "";
        const bytes = new Uint8Array(a);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            str += String.fromCharCode(bytes[i]);
        }
        return btoa(str)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }

    private async exchangeCodeForToken(code: string, codeVerifier: string) {
        const client = await getClient();
        const params = {
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            scope: SCOPES,
            code: code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
        };

        const response = await client.request<any>({
            method: 'POST',
            url: TOKEN_ENDPOINT,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: Body.form(params),
        });

        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.data.error_description || response.data.error}`);
        }

        this.handleTokenSuccess(response.data);
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
