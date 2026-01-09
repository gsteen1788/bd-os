import { Organization, Contact, Opportunity, Meeting, UUID, ProtemoiEntry, Task, WeekReview } from "../domain/entities";

export interface Repository<T> {
    findById(id: UUID): Promise<T | null>;
    save(entity: T): Promise<void>;
    delete(id: UUID): Promise<void>;
}

export interface OrganizationRepository extends Repository<Organization> {
    findAll(): Promise<Organization[]>;
    search(query: string): Promise<Organization[]>;
}

export interface ContactRepository extends Repository<Contact> {
    findAll(): Promise<Contact[]>;
    findByOrganizationId(orgId: UUID): Promise<Contact[]>;
    search(query: string): Promise<Contact[]>;
}

export interface OpportunityRepository extends Repository<Opportunity> {
    findAll(): Promise<Opportunity[]>;
    findByOrganizationId(orgId: UUID): Promise<Opportunity[]>;
    findAllByStage(stage: string): Promise<Opportunity[]>;
}

export interface MeetingRepository extends Repository<Meeting> {
    findByOpportunityId(oppId: UUID): Promise<Meeting[]>;
    findUpcoming(limit: number): Promise<Meeting[]>;
}

export interface ProtemoiRepository {
    findByContactId(contactId: UUID): Promise<ProtemoiEntry | null>;
    save(entry: ProtemoiEntry): Promise<void>;
    findAll(): Promise<ProtemoiEntry[]>;
}

export interface TaskRepository extends Repository<Task> {
    findPending(): Promise<Task[]>;
    findByLinkedEntity(entityType: string, entityId: UUID): Promise<Task[]>;
}

export interface WeekReviewRepository extends Repository<WeekReview> {
    findLatest(): Promise<WeekReview | null>;
}
