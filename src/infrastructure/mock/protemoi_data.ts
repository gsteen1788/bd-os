import { ProtemoiEntry } from "../../domain/entities";

export const mockProtemoi: ProtemoiEntry[] = [
    {
        id: "prot-1",
        contactId: "con-1", // Alice
        organizationId: "org-1",
        protemoiType: "CLIENT_OR_PROSPECT",
        relationshipStage: "SOLID_WORKING_RELATIONSHIP",
        nextStepText: "Discuss 2026 roadmap",
        nextStepDueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        importanceScore: 85,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    } as any,
    // Type assertion used here because mock data might slightly mismatch the strict entity field names 
    // if I used snake_case in the SQL but camelCase in TS interfaces. 
    // Let's verify entities.ts structure.
    // entities.ts uses camelCase.
    {
        id: "prot-2",
        contactId: "con-2", // Bob
        organizationId: "org-2",
        protemoiType: "STRONG_INFLUENCER",
        relationshipStage: "ACQUAINTANCE",
        nextStepText: "Send coffee invite",
        importanceScore: 40,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as any,
    {
        id: "prot-3",
        contactId: "con-3", // Carol
        organizationId: "org-1",
        protemoiType: "CLIENT_OR_PROSPECT",
        relationshipStage: "NEW_CLIENT",
        nextStepText: "Onboarding session",
        importanceScore: 70,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as any
];
