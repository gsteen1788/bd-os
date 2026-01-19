import { Organization, Contact, Opportunity, Meeting, UUID } from "../../domain/entities";

export function generateUUID(): UUID {
    return crypto.randomUUID();
}

export const mockOrganizations: Organization[] = [
    {
        id: "org-1",
        name: "Acme Corp",
        industry: "Technology",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "org-2",
        name: "Globex Corporation",
        industry: "Manufacturing",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

export const mockContacts: Contact[] = [
    {
        id: "con-1",
        organizationId: "org-1",
        displayName: "Alice Smith",
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@acme.com",
        title: "CTO",
        thinkingPreference: "ANALYTICAL",
        primaryBuyInPriority: "ROI",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "con-2",
        organizationId: "org-2",
        displayName: "Bob Jones",
        firstName: "Bob",
        lastName: "Jones",
        email: "bob@globex.com",
        title: "VP Sales",
        thinkingPreference: "RELATIONAL",
        primaryBuyInPriority: "CONNECTIVITY",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "con-3",
        organizationId: "org-1",
        displayName: "Carol Danvers",
        firstName: "Carol",
        lastName: "Danvers",
        email: "carol@acme.com",
        title: "Security Lead",
        thinkingPreference: "EXPERIMENTAL",
        primaryBuyInPriority: "SAFETY",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

export const mockOpportunities: Opportunity[] = [
    {
        id: "opp-1",
        name: "Acme Cloud Migration",
        organizationId: "org-1",
        stage: "CREATE_CURIOSITY",
        status: "OPEN",
        nextStepText: "Schedule technical deep dive",
        valueEstimate: 500000,
        probability: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "opp-2",
        name: "Globex ERP Upgrade",
        organizationId: "org-2",
        stage: "LISTEN_AND_LEARN",
        status: "OPEN",
        nextStepText: "Initial discovery meeting",
        valueEstimate: 1200000,
        probability: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "opp-3",
        name: "Acme Security Audit",
        organizationId: "org-1",
        stage: "GAIN_APPROVAL",
        status: "OPEN",
        nextStepText: "Send contract by Friday",
        valueEstimate: 150000,
        probability: 80,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

export const mockMeetings: Meeting[] = [
    {
        id: "meet-1",
        title: "Intro with Alice",
        organizationId: "org-1",
        startAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endAt: new Date(Date.now() + 90000000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "SCHEDULED"
    }
]
