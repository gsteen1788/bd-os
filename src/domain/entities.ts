import {
    OpportunityStage, ThinkingPreference, ProtemoiType, RelationshipStage, BuyInPriority,
    TaskStatus, TaskType, EntityType, RoleType, Currency, TaskTag
} from "./enums";

export type UUID = string;

export interface Organization {
    id: UUID;
    name: string;
    industry?: string | null;
    logoUrl?: string | null;
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
    location?: string | null;
    maritalStatus?: string | null;
    children?: string | null;
    hobbiesInterests?: string | null;
    currentFocus?: string | null;
    storiesAnecdotes?: string | null;
    careerHistory?: string | null;
    education?: string | null;
    linkedinUrl?: string | null;
    other?: string | null;
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
    isInternal?: boolean; // New field for separation
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
    currency?: Currency; // Added currency support
    primarySponsor?: string | null;
    obstacle?: string | null;
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
    status: "SCHEDULED" | "COMPLETED"; // Added status
    organizationId?: UUID | null;
    relatedOpportunityId?: UUID | null;
    relatedProtemoiId?: UUID | null; // For linking to specific relationship
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
    linkedEntityType: EntityType; // Deprecated: Use links[0]
    linkedEntityId?: UUID | null; // Deprecated: Use links[0]
    links?: TaskLink[];
    weekReviewId?: UUID | null;
    tag?: TaskTag | null;

    // MIT Specific
    bigImpactDescription?: string | null;
    inControlDescription?: string | null;
    growthOrientedDescription?: string | null;

    durationMinutes?: number | null;

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

export interface TaskLink {
    id: UUID;
    taskId: UUID;
    entityType: EntityType;
    entityId: UUID;
    createdAt: string;
}

// Sub-models for MeetingPrep JSON structures
export interface Risk {
    id: UUID;
    description: string;
    mitigation: string;
}

export interface Question {
    id: UUID;
    text: string;
}

export interface QA {
    id: UUID;
    question: string;
    answer: string;
}

export interface TrackerGoal {
    id: UUID;
    metric: "BD_TASKS" | "BD_HOURS_CLIENT" | "BD_HOURS_INTERNAL" | "BD_HOURS_TOTAL" | "MITS_COMPLETED";
    target: number;
    updatedAt: string;
}

export { ThinkingPreference };
