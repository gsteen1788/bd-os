import type {
    OpportunityStage, ThinkingPreference, ProtemoiType, RelationshipStage, BuyInPriority,
    TaskStatus, TaskType, EntityType, RoleType,
} from "./enums";

export type UUID = string;

export interface Organization {
    id: UUID;
    name: string;
    industry?: string | null;
    notesMd?: string | null;
    createdAt: string;  // ISO
    updatedAt: string;  // ISO
}

export interface Contact {
    id: UUID;
    organizationId?: UUID | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName: string;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    notesMd?: string | null;
    thinkingPreference?: ThinkingPreference | null;
    primaryBuyInPriority?: BuyInPriority | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProtemoiEntry {
    id: UUID;
    contactId: UUID;
    organizationId?: UUID | null;
    protemoiType: ProtemoiType;
    relationshipStage: RelationshipStage;
    nextStepText: string;
    nextStepDueDate?: string | null; // date
    lastTouchDate?: string | null;   // date
    nextTouchDate?: string | null;   // date
    importanceScore?: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface Opportunity {
    id: UUID;
    name: string;
    organizationId?: UUID | null;
    descriptionMd?: string | null;
    stage: OpportunityStage;
    status: "OPEN" | "WON" | "LOST" | "PAUSED";
    nextStepText: string;
    nextStepDueDate?: string | null; // date
    valueEstimate?: number | null;
    probability?: number | null;      // 0-100
    expectedCloseDate?: string | null; // date
    createdAt: string;
    updatedAt: string;
}

export interface Meeting {
    id: UUID;
    title: string;
    startAt?: string | null; // datetime
    endAt?: string | null;   // datetime
    location?: string | null;
    organizationId?: UUID | null;
    relatedOpportunityId?: UUID | null;
    notesMd?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MeetingAttendee {
    id: UUID;
    meetingId: UUID;
    contactId?: UUID | null;
    name: string;
    thinkingPreference?: ThinkingPreference | null;
    buyInPriority?: BuyInPriority | null;
    role?: RoleType | string | null;
    notesMd?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MeetingPrep {
    id: UUID;
    meetingId: UUID;
    templateId: UUID;
    dataJson: string; // validate via template schema
    dataVersion: number;
    createdAt: string;
    updatedAt: string;
}

export interface Task {
    id: UUID;
    title: string;
    descriptionMd?: string | null;
    status: TaskStatus;
    type: TaskType;
    dueDate?: string | null; // date
    linkedEntityType: EntityType;
    linkedEntityId?: UUID | null;
    weekReviewId?: UUID | null;
    createdAt: string;
    updatedAt: string;
}

export interface WeekReview {
    id: UUID;
    weekStartDate: string; // date
    weekEndDate: string;   // date
    reflectionMd?: string | null;
    createdAt: string;
    updatedAt: string;
}
