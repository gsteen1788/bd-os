import { authService } from './authService';
import { getClient, Body } from '@tauri-apps/api/http';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

export interface GraphEvent {
    id: string;
    subject: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location?: { displayName: string };
    webLink: string;
    isAllDay: boolean;
    bodyPreview?: string;
    organizer?: { emailAddress: { name: string; address: string } };
}

class GraphService {
    /**
     * Generic fetch wrapper with auth handling using Tauri HTTP Client
     */
    private async fetchGraph(endpoint: string, options: any = {}) {
        const token = await authService.getAccessToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const client = await getClient();
        const url = `${GRAPH_BASE_URL}${endpoint}`;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const response = await client.request<any>({
            method: options.method || 'GET',
            url,
            headers,
            body: options.body ? Body.json(JSON.parse(options.body)) : undefined
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token might be invalid despite check, could try refresh or logout
                authService.logout();
            }
            throw new Error(`Graph API specific error: ${response.status} - ${JSON.stringify(response.data)}`);
        }

        return response.data;
    }

    /**
     * Get User Profile
     */
    async getUserDetails() {
        return this.fetchGraph('/me');
    }

    /**
     * Get Upcoming Calendar Events
     */
    async getCalendarEvents(daysToCheck: number = 7): Promise<GraphEvent[]> {
        const startDateTime = new Date().toISOString();
        const endDateTime = new Date(Date.now() + daysToCheck * 24 * 60 * 60 * 1000).toISOString();

        // Select specific fields to keep payload small
        const select = 'id,subject,start,end,location,webLink,isAllDay,bodyPreview,organizer';
        const query = new URLSearchParams({
            startDateTime,
            endDateTime,
            '$select': select,
            '$orderby': 'start/dateTime',
            '$top': '50'
        });

        const data = await this.fetchGraph(`/me/calendarView?${query.toString()}`);
        return data.value;
    }

    /**
     * Create a new Calendar Event
     */
    async createEvent(subject: string, start: Date, end: Date, description?: string) {
        const event = {
            subject,
            body: {
                contentType: 'HTML',
                content: description || ''
            },
            start: {
                dateTime: start.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: end.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };

        return this.fetchGraph('/me/events', {
            method: 'POST',
            body: JSON.stringify(event)
        });
    }
}

export const graphService = new GraphService();
