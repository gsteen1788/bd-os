import {
    OrganizationRepository, ContactRepository, OpportunityRepository, MeetingRepository,
    ProtemoiRepository, Repository, TaskRepository, TrackerGoalRepository, WeekReviewRepository
} from "../../application/interfaces";
import { Organization, Contact, Opportunity, Meeting, UUID, ProtemoiEntry, Task, TrackerGoal, WeekReview } from "../../domain/entities";
import { mockOrganizations, mockContacts, mockOpportunities, mockMeetings } from "./data";

class MockRepository<T extends { id: UUID }> implements Repository<T> {
    constructor(protected items: T[]) { }

    async findById(id: UUID): Promise<T | null> {
        return this.items.find(i => i.id === id) || null;
    }
    async save(entity: T): Promise<void> {
        const index = this.items.findIndex(i => i.id === entity.id);
        if (index >= 0) {
            this.items[index] = entity;
        } else {
            this.items.push(entity);
        }
    }
    async delete(id: UUID): Promise<void> {
        const index = this.items.findIndex(i => i.id === id);
        if (index >= 0) {
            this.items.splice(index, 1);
        }
    }
    async findAll(): Promise<T[]> {
        return [...this.items];
    }
}

export class MockOrganizationRepository extends MockRepository<Organization> implements OrganizationRepository {
    async findAll(): Promise<Organization[]> {
        return [...this.items];
    }
    async findAllSummaries(): Promise<Organization[]> {
        return this.items.map(o => ({
            ...o,
            notesMd: undefined
        }));
    }
    async search(query: string): Promise<Organization[]> {
        return this.items.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));
    }
}

export class MockContactRepository extends MockRepository<Contact> implements ContactRepository {
    async findByOrganizationId(orgId: UUID): Promise<Contact[]> {
        return this.items.filter(c => c.organizationId === orgId);
    }
    async findAllSummaries(): Promise<Contact[]> {
        return this.items.map(c => ({
            ...c,
            careerHistory: undefined,
            notesMd: undefined,
            storiesAnecdotes: undefined,
            hobbiesInterests: undefined,
            education: undefined,
            other: undefined,
            currentFocus: undefined
        }));
    }
    async search(query: string): Promise<Contact[]> {
        return this.items.filter(c => c.displayName.toLowerCase().includes(query.toLowerCase()));
    }
}

export class MockOpportunityRepository extends MockRepository<Opportunity> implements OpportunityRepository {
    async findAllSummaries(): Promise<Opportunity[]> {
        return this.items.map(o => ({
            ...o,
            descriptionMd: undefined,
            obstacle: undefined,
            primarySponsor: undefined
        }));
    }
    async findByOrganizationId(orgId: UUID): Promise<Opportunity[]> {
        return this.items.filter(o => o.organizationId === orgId);
    }
    async findAllByStage(stage: string): Promise<Opportunity[]> {
        return this.items.filter(o => o.stage === stage);
    }
    async search(query: string): Promise<Opportunity[]> {
        return this.items.filter(o =>
            o.name.toLowerCase().includes(query.toLowerCase()) ||
            (o.descriptionMd && o.descriptionMd.toLowerCase().includes(query.toLowerCase()))
        );
    }
}

export class MockMeetingRepository extends MockRepository<Meeting> implements MeetingRepository {
    async findByOpportunityId(oppId: UUID): Promise<Meeting[]> {
        return this.items.filter(m => m.relatedOpportunityId === oppId);
    }
    async findByProtemoiId(protemoiId: UUID): Promise<Meeting[]> {
        return this.items.filter(m => m.relatedProtemoiId === protemoiId);
    }
    async findUpcoming(limit: number): Promise<Meeting[]> {
        return this.items
            .filter(m => m.status !== "COMPLETED")
            .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime())
            .slice(0, limit);
    }
    async findHistory(limit: number): Promise<Meeting[]> {
        return this.items
            .filter(m => m.status === "COMPLETED")
            .sort((a, b) => new Date(b.startAt!).getTime() - new Date(a.startAt!).getTime())
            .slice(0, limit);
    }
    async search(query: string): Promise<Meeting[]> {
        return this.items.filter(m =>
            m.title.toLowerCase().includes(query.toLowerCase()) ||
            (m.notesMd && m.notesMd.toLowerCase().includes(query.toLowerCase())) ||
            (m.location && m.location.toLowerCase().includes(query.toLowerCase()))
        );
    }
}

// Mock Protemoi Repo
import { mockProtemoi } from "./protemoi_data";

export class MockProtemoiRepository implements ProtemoiRepository {
    private items = mockProtemoi;

    async findById(id: UUID): Promise<ProtemoiEntry | null> {
        return this.items.find(p => p.id === id) || null;
    }

    async findByContactId(contactId: UUID): Promise<ProtemoiEntry | null> {
        return this.items.find(p => p.contactId === contactId) || null;
    }
    async save(entry: ProtemoiEntry): Promise<void> {
        const index = this.items.findIndex(p => p.id === entry.id);
        if (index >= 0) this.items[index] = entry;
        else this.items.push(entry);
    }
    async findAll(): Promise<ProtemoiEntry[]> {
        return [...this.items];
    }
    async findAllSummaries(): Promise<ProtemoiEntry[]> {
        return this.items.map(p => ({
            ...p,
            nextStepText: undefined as any,
            importanceScore: undefined,
            lastTouchDate: undefined,
            nextTouchDate: undefined,
            nextStepDueDate: undefined
        }));
    }
    async delete(id: UUID): Promise<void> {
        const index = this.items.findIndex(p => p.id === id);
        if (index >= 0) this.items.splice(index, 1);
    }
}

export class MockTaskRepository extends MockRepository<Task> implements TaskRepository {
    async findPending(): Promise<Task[]> {
        return this.items.filter(t => t.status !== 'DONE' && t.status !== 'CANCELED');
    }
    async findPendingSummaries(): Promise<Task[]> {
        const tasks = await this.findPending();
        return tasks.map(t => ({ ...t, descriptionMd: undefined }));
    }
    async findHistory(limit: number): Promise<Task[]> {
        return this.items
            .filter(t => t.status === 'DONE')
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, limit);
    }
    async findHistorySummaries(limit: number): Promise<Task[]> {
        const tasks = await this.findHistory(limit);
        return tasks.map(t => ({ ...t, descriptionMd: undefined }));
    }
    async findByLinkedEntity(type: string, id: string): Promise<Task[]> {
        return this.items.filter(t =>
            (t.linkedEntityType === type && t.linkedEntityId === id) ||
            (t.links && t.links.some(l => l.entityType === type && l.entityId === id))
        );
    }
    async findHistoryInRange(fromDate: string, toDate: string): Promise<Task[]> {
        return this.items
            .filter(t => t.status === 'DONE' && t.updatedAt >= fromDate && t.updatedAt <= toDate)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    async findHistorySummariesInRange(fromDate: string, toDate: string): Promise<Task[]> {
        const tasks = await this.findHistoryInRange(fromDate, toDate);
        return tasks.map(t => ({
            ...t,
            descriptionMd: undefined,
            bigImpactDescription: undefined,
            inControlDescription: undefined,
            growthOrientedDescription: undefined
        }));
    }
}

export class MockTrackerGoalRepository extends MockRepository<TrackerGoal> implements TrackerGoalRepository {
    async findByMetric(_metric: string): Promise<TrackerGoal | null> { return null; }
    async findAll(): Promise<TrackerGoal[]> { return []; }
}

export class MockWeekReviewRepository extends MockRepository<WeekReview> implements WeekReviewRepository {
    async findLatest(): Promise<WeekReview | null> { return null; }
}

// Instantiate singletons
export const organizationRepository = new MockOrganizationRepository(mockOrganizations);
export const contactRepository = new MockContactRepository(mockContacts);
export const opportunityRepository = new MockOpportunityRepository(mockOpportunities);
export const meetingRepository = new MockMeetingRepository(mockMeetings);
export const protemoiRepository = new MockProtemoiRepository();
export const taskRepository = new MockTaskRepository([]);
export const trackerGoalRepository = new MockTrackerGoalRepository([]);
export const weekReviewRepository = new MockWeekReviewRepository([]);
