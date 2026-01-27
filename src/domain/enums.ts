export const OpportunityStage = [
    "LISTEN_AND_LEARN",
    "CREATE_CURIOSITY",
    "BUILD_EVERYTHING_TOGETHER",
    "GAIN_APPROVAL",
    "RETAIN_AND_EXPAND",
] as const;
export type OpportunityStage = (typeof OpportunityStage)[number];

export const ThinkingPreference = ["ANALYTICAL", "PRACTICAL", "RELATIONAL", "EXPERIMENTAL"] as const;
export type ThinkingPreference = (typeof ThinkingPreference)[number];

export const Currency = ["USD", "GBP", "ZAR"] as const;
export type Currency = (typeof Currency)[number];

export const ProtemoiType = [
    // External
    "CLIENT_OR_PROSPECT",
    "STRONG_INFLUENCER",
    "STRATEGIC_PARTNER",
    "INTERESTING_PERSON",
    // Internal
    "SPONSOR_ADVOCATE",
    "CO_SELL_ACCOUNT_ACCESS",
    "PRACTICE_TOPIC_LEADER",
    "CONNECTOR",
    "MENTOR_COACH"
] as const;
export type ProtemoiType = (typeof ProtemoiType)[number];

export const RelationshipStage = [
    "TARGET",
    "ACQUAINTANCE",
    "CURIOUS_SKEPTIC",
    "NEW_CLIENT",       // External specific
    "NEW_COLLABORATOR", // Internal specific
    "SOLID_WORKING_RELATIONSHIP",
    "TRUSTED_ADVISEE",
    "RAVING_FAN",
] as const;
export type RelationshipStage = (typeof RelationshipStage)[number];

export const BuyInPriority = ["ROI", "SAFETY", "CONNECTIVITY", "STRATEGIC_FIT"] as const;
export type BuyInPriority = (typeof BuyInPriority)[number];

export const RoleType = ["DECISION_MAKER", "INFLUENCER"] as const;
export type RoleType = (typeof RoleType)[number];

export const TaskStatus = ["TODO", "IN_PROGRESS", "DONE", "CANCELED"] as const;
export type TaskStatus = (typeof TaskStatus)[number];

export const TaskType = ["NEXT_STEP", "MIT", "ADMIN"] as const;
export type TaskType = (typeof TaskType)[number];

export const EntityType = ["OPPORTUNITY", "RELATIONSHIP", "MEETING", "CONTACT", "ORGANIZATION", "NONE"] as const;
export type EntityType = (typeof EntityType)[number];

export const TaskTag = ["BD_TASK", "BD_INTERNAL_MEETING", "BD_EXTERNAL_MEETING", "PROJECT", "OFFICE", "OTHER"] as const;
export type TaskTag = (typeof TaskTag)[number];
