import {
    OrganizationRepository, ContactRepository, OpportunityRepository,
    MeetingRepository, Repository, ProtemoiRepository, TaskRepository, TrackerGoalRepository, WeekReviewRepository
} from "../application/interfaces";
import {
    Organization, Contact, Opportunity, Meeting, UUID, ProtemoiEntry, Task, TrackerGoal, WeekReview
} from "../domain/entities";
import Database from "./tauri-sql";
import { DB_NAME } from "./db";

abstract class SqliteRepository<T> implements Repository<T> {
    protected abstract tableName: string;

    protected async getDb(): Promise<Database> {
        return await Database.load(DB_NAME);
    }

    async findById(id: UUID): Promise<T | null> {
        const db = await this.getDb();
        const result = await db.select<T[]>(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
        return result[0] || null;
    }

    async delete(id: UUID): Promise<void> {
        const db = await this.getDb();
        await db.execute(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
    }

    /* basic save implementation assumes full object replacement or simple insert */
    abstract save(entity: T): Promise<void>;
}

export class SqliteOrganizationRepository extends SqliteRepository<Organization> implements OrganizationRepository {
    protected tableName = "organizations";

    async save(entity: Organization): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            `INSERT INTO organizations (id, name, industry, logo_url, notes_md, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(id) DO UPDATE SET 
            name=excluded.name, 
            industry=excluded.industry,
            logo_url=excluded.logo_url,
            notes_md=excluded.notes_md,
            updated_at=excluded.updated_at`,
            [entity.id, entity.name, entity.industry, entity.logoUrl, entity.notesMd, entity.createdAt, entity.updatedAt]
        );
    }

    private mapRow(row: any): Organization {
        return {
            id: row.id,
            name: row.name,
            industry: row.industry,
            logoUrl: row.logo_url,
            notesMd: row.notes_md,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async findAll(): Promise<Organization[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM organizations ORDER BY updated_at DESC");
        return rows.map(r => this.mapRow(r));
    }

    async search(query: string): Promise<Organization[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>(
            "SELECT * FROM organizations WHERE name LIKE $1 ORDER BY updated_at DESC",
            [`%${query}%`]
        );
        return rows.map(r => this.mapRow(r));
    }
}

export class SqliteContactRepository extends SqliteRepository<Contact> implements ContactRepository {
    protected tableName = "contacts";

    private mapRow(row: any): Contact {
        return {
            id: row.id,
            organizationId: row.organization_id,
            firstName: row.first_name,
            lastName: row.last_name,
            displayName: row.display_name,
            title: row.title,
            email: row.email,
            phone: row.phone,
            location: row.location,
            maritalStatus: row.marital_status,
            children: row.children,
            hobbiesInterests: row.hobbies_interests,
            currentFocus: row.current_focus,
            storiesAnecdotes: row.stories_anecdotes,
            careerHistory: row.career_history,
            education: row.education,
            linkedinUrl: row.linkedin_url,
            other: row.other,
            notesMd: row.notes_md,
            thinkingPreference: row.thinking_preference,
            primaryBuyInPriority: row.primary_buy_in_priority,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async findAll(): Promise<Contact[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM contacts ORDER BY updated_at DESC");
        return rows.map(r => this.mapRow(r));
    }

    async save(entity: Contact): Promise<void> {
        const db = await this.getDb();
        console.log("Saving contact:", entity);
        try {
            await db.execute(
                `INSERT INTO contacts (
                    id, organization_id, first_name, last_name, display_name, title, email, phone, 
                    location, marital_status, children, hobbies_interests, current_focus, stories_anecdotes, other,
                    career_history, education, linkedin_url,
                    notes_md, thinking_preference, primary_buy_in_priority, created_at, updated_at
                ) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                 ON CONFLICT(id) DO UPDATE SET 
                 display_name=excluded.display_name,
                 title=excluded.title,
                 email=excluded.email,
                 phone=excluded.phone,
                 location=excluded.location,
                 marital_status=excluded.marital_status,
                 children=excluded.children,
                 hobbies_interests=excluded.hobbies_interests,
                 current_focus=excluded.current_focus,
                 stories_anecdotes=excluded.stories_anecdotes,
                 career_history=excluded.career_history,
                 education=excluded.education,
                 linkedin_url=excluded.linkedin_url,
                 other=excluded.other,
                 updated_at=excluded.updated_at`,
                [
                    entity.id, entity.organizationId, entity.firstName, entity.lastName, entity.displayName,
                    entity.title, entity.email, entity.phone,
                    entity.location, entity.maritalStatus, entity.children, entity.hobbiesInterests, entity.currentFocus, entity.storiesAnecdotes, entity.other,
                    entity.careerHistory, entity.education, entity.linkedinUrl,
                    entity.notesMd, entity.thinkingPreference, entity.primaryBuyInPriority, entity.createdAt, entity.updatedAt
                ]
            );
        } catch (e) {
            console.error("Critical Error saving Contact:", e, entity);
            throw e;
        }
    }

    async findByOrganizationId(orgId: UUID): Promise<Contact[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM contacts WHERE organization_id = $1", [orgId]);
        return rows.map(r => this.mapRow(r));
    }

    async search(query: string): Promise<Contact[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>(
            "SELECT * FROM contacts WHERE display_name LIKE $1 OR email LIKE $1",
            [`%${query}%`]
        );
        return rows.map(r => this.mapRow(r));
    }
}

export class SqliteOpportunityRepository extends SqliteRepository<Opportunity> implements OpportunityRepository {
    protected tableName = "opportunities";

    private mapRow(row: any): Opportunity {
        return {
            id: row.id,
            name: row.name,
            organizationId: row.organization_id,
            descriptionMd: row.description_md,
            stage: row.stage,
            status: row.status,
            nextStepText: row.next_step_text,
            valueEstimate: row.value_estimate,
            currency: row.currency,
            probability: row.probability,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async findAll(): Promise<Opportunity[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM opportunities ORDER BY updated_at DESC");
        return rows.map(r => this.mapRow(r));
    }

    async save(entity: Opportunity): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            `INSERT INTO opportunities (id, name, organization_id, description_md, stage, status, next_step_text, value_estimate, probability, currency, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT(id) DO UPDATE SET 
                name=excluded.name, 
                organization_id=excluded.organization_id,
                description_md=excluded.description_md,
                stage=excluded.stage, 
                status=excluded.status, 
                next_step_text=excluded.next_step_text,
                value_estimate=excluded.value_estimate,
                probability=excluded.probability,
                currency=excluded.currency,
                updated_at=excluded.updated_at`,
            [entity.id, entity.name, entity.organizationId, entity.descriptionMd, entity.stage, entity.status, entity.nextStepText, entity.valueEstimate, entity.probability, entity.currency, entity.createdAt, entity.updatedAt]
        );
    }

    async findByOrganizationId(orgId: UUID): Promise<Opportunity[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM opportunities WHERE organization_id = $1", [orgId]);
        return rows.map(r => this.mapRow(r));
    }

    async findAllByStage(stage: string): Promise<Opportunity[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM opportunities WHERE stage = $1", [stage]);
        return rows.map(r => this.mapRow(r));
    }

    async search(query: string): Promise<Opportunity[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>(
            "SELECT * FROM opportunities WHERE name LIKE $1 OR description_md LIKE $1 OR next_step_text LIKE $1 ORDER BY updated_at DESC",
            [`%${query}%`]
        );
        return rows.map(r => this.mapRow(r));
    }
}

export class SqliteMeetingRepository extends SqliteRepository<Meeting> implements MeetingRepository {
    protected tableName = "meetings";

    async save(entity: Meeting): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            `INSERT INTO meetings (id, title, start_at, end_at, location, status, organization_id, related_opportunity_id, related_protemoi_id, notes_md, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT(id) DO UPDATE SET 
            title=excluded.title,
            start_at=excluded.start_at,
            end_at=excluded.end_at,
            location=excluded.location,
            status=excluded.status,
            organization_id=excluded.organization_id,
            related_opportunity_id=excluded.related_opportunity_id,
            related_protemoi_id=excluded.related_protemoi_id,
            notes_md=excluded.notes_md,
            updated_at=excluded.updated_at`,
            [entity.id, entity.title, entity.startAt, entity.endAt, entity.location, entity.status || "SCHEDULED", entity.organizationId, entity.relatedOpportunityId, entity.relatedProtemoiId, entity.notesMd, entity.createdAt, entity.updatedAt]
        );
    }

    async findByOpportunityId(oppId: UUID): Promise<Meeting[]> {
        const db = await this.getDb();
        return db.select<Meeting[]>("SELECT * FROM meetings WHERE related_opportunity_id = $1", [oppId]);
    }

    async findByProtemoiId(protemoiId: UUID): Promise<Meeting[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM meetings WHERE related_protemoi_id = $1", [protemoiId]);
        return rows.map(r => this.mapRow(r));
    }

    private mapRow(row: any): Meeting {
        return {
            id: row.id,
            title: row.title,
            startAt: row.start_at,
            endAt: row.end_at,
            location: row.location,
            status: row.status || "SCHEDULED",
            organizationId: row.organization_id,
            relatedOpportunityId: row.related_opportunity_id,
            relatedProtemoiId: row.related_protemoi_id,
            notesMd: row.notes_md,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async findUpcoming(limit: number): Promise<Meeting[]> {
        const db = await this.getDb();
        // Show all non-completed meetings, ordered by date (oldest first - i.e. catch up on what you missed)
        const rows = await db.select<any[]>(
            `SELECT * FROM meetings WHERE status != 'COMPLETED' ORDER BY start_at ASC LIMIT ${limit}`
        );
        return rows.map(r => this.mapRow(r));
    }

    async findHistory(limit: number): Promise<Meeting[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>(
            `SELECT * FROM meetings WHERE status = 'COMPLETED' ORDER BY start_at DESC LIMIT ${limit}`
        );
        return rows.map(r => this.mapRow(r));
    }

    async search(query: string): Promise<Meeting[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>(
            "SELECT * FROM meetings WHERE title LIKE $1 OR notes_md LIKE $1 OR location LIKE $1 ORDER BY start_at DESC",
            [`%${query}%`]
        );
        return rows.map(r => this.mapRow(r));
    }
}

export class SqliteProtemoiRepository extends SqliteRepository<ProtemoiEntry> implements ProtemoiRepository {
    protected tableName = "protemoi_entries";

    private mapRow(row: any): ProtemoiEntry {
        return {
            id: row.id,
            contactId: row.contact_id,
            organizationId: row.organization_id,
            protemoiType: row.protemoi_type,
            relationshipStage: row.relationship_stage,
            nextStepText: row.next_step_text,
            nextStepDueDate: row.next_step_due_date,
            lastTouchDate: row.last_touch_date,
            nextTouchDate: row.next_touch_date,
            importanceScore: row.importance_score,
            isInternal: row.is_internal === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async save(entity: ProtemoiEntry): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            `INSERT INTO protemoi_entries (id, contact_id, organization_id, protemoi_type, relationship_stage, next_step_text, next_step_due_date, last_touch_date, next_touch_date, importance_score, is_internal, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT(id) DO UPDATE SET 
                contact_id=excluded.contact_id,
                organization_id=excluded.organization_id,
                protemoi_type=excluded.protemoi_type, 
                relationship_stage=excluded.relationship_stage,
                next_step_text=excluded.next_step_text,
                next_step_due_date=excluded.next_step_due_date,
                last_touch_date=excluded.last_touch_date,
                next_touch_date=excluded.next_touch_date,
                importance_score=excluded.importance_score,
                is_internal=excluded.is_internal,
                updated_at=excluded.updated_at`,
            [entity.id, entity.contactId, entity.organizationId, entity.protemoiType, entity.relationshipStage, entity.nextStepText, entity.nextStepDueDate, entity.lastTouchDate, entity.nextTouchDate, entity.importanceScore, entity.isInternal ? 1 : 0, entity.createdAt, entity.updatedAt]
        );
    }

    async findByContactId(contactId: UUID): Promise<ProtemoiEntry | null> {
        const db = await this.getDb();
        const res = await db.select<any[]>("SELECT * FROM protemoi_entries WHERE contact_id = $1", [contactId]);
        return res[0] ? this.mapRow(res[0]) : null;
    }

    async findAll(): Promise<ProtemoiEntry[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM protemoi_entries ORDER BY updated_at DESC");
        return rows.map(r => this.mapRow(r));
    }
}

export class SqliteTaskRepository extends SqliteRepository<Task> implements TaskRepository {
    protected tableName = "tasks";

    private mapRow(row: any): Task {
        return {
            id: row.id,
            title: row.title,
            descriptionMd: row.description_md,
            status: row.status,
            type: row.type,
            dueDate: row.due_date,
            linkedEntityType: row.linked_entity_type,
            linkedEntityId: row.linked_entity_id,
            weekReviewId: row.week_review_id,
            tag: row.tag,
            bigImpactDescription: row.big_impact_description,
            inControlDescription: row.in_control_description,
            growthOrientedDescription: row.growth_oriented_description,
            durationMinutes: row.duration_minutes,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    private async populateLinks(tasks: Task[]): Promise<Task[]> {
        if (tasks.length === 0) return [];
        const db = await this.getDb();
        const taskIds = tasks.map(t => `'${t.id}'`).join(",");

        try {
            const links = await db.select<any[]>(`SELECT * FROM task_links WHERE task_id IN (${taskIds})`);

            const linkMap = new Map<string, any[]>();
            links.forEach(l => {
                if (!linkMap.has(l.task_id)) linkMap.set(l.task_id, []);
                linkMap.get(l.task_id)!.push({
                    id: l.id,
                    taskId: l.task_id,
                    entityType: l.entity_type,
                    entityId: l.entity_id,
                    createdAt: l.created_at
                });
            });

            return tasks.map(t => ({
                ...t,
                links: linkMap.get(t.id) || []
            }));
        } catch (e) {
            console.error("Failed to populate links:", e);
            return tasks;
        }
    }

    async save(entity: Task): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            `INSERT INTO tasks (
                id, title, description_md, status, type, due_date, 
                linked_entity_type, linked_entity_id, week_review_id, tag,
                big_impact_description, in_control_description, growth_oriented_description, duration_minutes,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                description_md=excluded.description_md,
                status=excluded.status,
                type=excluded.type,
                due_date=excluded.due_date,
                linked_entity_type=excluded.linked_entity_type,
                linked_entity_id=excluded.linked_entity_id,
                week_review_id=excluded.week_review_id,
                tag=excluded.tag,
                big_impact_description=excluded.big_impact_description,
                in_control_description=excluded.in_control_description,
                growth_oriented_description=excluded.growth_oriented_description,
                duration_minutes=excluded.duration_minutes,
                updated_at=excluded.updated_at`,
            [
                entity.id, entity.title, entity.descriptionMd, entity.status, entity.type, entity.dueDate,
                entity.linkedEntityType, entity.linkedEntityId, entity.weekReviewId, entity.tag,
                entity.bigImpactDescription, entity.inControlDescription, entity.growthOrientedDescription,
                entity.durationMinutes,
                entity.createdAt, entity.updatedAt
            ]
        );

        // Save Links
        // 1. Delete existing links for this task (simple replacement strategy)
        await db.execute("DELETE FROM task_links WHERE task_id = $1", [entity.id]);

        // 2. Insert new links
        if (entity.links && entity.links.length > 0) {
            for (const link of entity.links) {
                await db.execute(
                    "INSERT INTO task_links (id, task_id, entity_type, entity_id, created_at) VALUES ($1, $2, $3, $4, $5)",
                    [link.id || crypto.randomUUID(), entity.id, link.entityType, link.entityId, new Date().toISOString()]
                );
            }
        }
    }

    async findPending(): Promise<Task[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM tasks WHERE status != 'DONE' AND status != 'CANCELED' ORDER BY due_date ASC");
        const tasks = rows.map(r => this.mapRow(r));
        return this.populateLinks(tasks);
    }

    async findHistory(limit: number): Promise<Task[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>(
            `SELECT * FROM tasks WHERE status = 'DONE' ORDER BY updated_at DESC LIMIT ${limit}`
        );
        const tasks = rows.map(r => this.mapRow(r));
        return this.populateLinks(tasks);
    }

    async findByLinkedEntity(entityType: string, entityId: UUID): Promise<Task[]> {
        const db = await this.getDb();
        // Check both legacy columns AND new table
        const rows = await db.select<any[]>(
            `SELECT DISTINCT t.* FROM tasks t 
             LEFT JOIN task_links tl ON t.id = tl.task_id
             WHERE (t.linked_entity_type = $1 AND t.linked_entity_id = $2)
             OR (tl.entity_type = $1 AND tl.entity_id = $2)
             ORDER BY t.created_at DESC`,
            [entityType, entityId]
        );
        const tasks = rows.map(r => this.mapRow(r));
        return this.populateLinks(tasks);
    }

    async findAllHistory(): Promise<Task[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM tasks WHERE status = 'DONE' ORDER BY updated_at DESC");
        const tasks = rows.map(r => this.mapRow(r));
        return this.populateLinks(tasks);
    }
}

export class SqliteTrackerGoalRepository extends SqliteRepository<TrackerGoal> implements TrackerGoalRepository {
    protected tableName = "tracker_goals";

    private mapRow(row: any): TrackerGoal {
        return {
            id: row.id,
            metric: row.metric,
            target: row.target,
            updatedAt: row.updated_at
        };
    }

    async save(entity: TrackerGoal): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            `INSERT INTO tracker_goals (id, metric, target, updated_at) VALUES ($1, $2, $3, $4)
             ON CONFLICT(metric) DO UPDATE SET target=excluded.target, updated_at=excluded.updated_at`,
            [entity.id, entity.metric, entity.target, entity.updatedAt]
        );
    }

    async findAll(): Promise<TrackerGoal[]> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM tracker_goals");
        return rows.map(r => this.mapRow(r));
    }

    async findByMetric(metric: string): Promise<TrackerGoal | null> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM tracker_goals WHERE metric = $1", [metric]);
        return rows[0] ? this.mapRow(rows[0]) : null;
    }
}

export class SqliteWeekReviewRepository extends SqliteRepository<WeekReview> implements WeekReviewRepository {
    protected tableName = "week_reviews"; // Ensure this table exists? Wait, user didn't ask for week reviews table, but it's referenced. I should check schema.

    private mapRow(row: any): WeekReview {
        return {
            id: row.id,
            weekStartDate: row.week_start_date,
            weekEndDate: row.week_end_date,
            reflectionMd: row.reflection_md,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async save(entity: WeekReview): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            `INSERT INTO week_reviews (id, week_start_date, week_end_date, reflection_md, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT(id) DO UPDATE SET reflection_md=excluded.reflection_md, updated_at=excluded.updated_at`,
            [entity.id, entity.weekStartDate, entity.weekEndDate, entity.reflectionMd, entity.createdAt, entity.updatedAt]
        );
    }

    async findLatest(): Promise<WeekReview | null> {
        const db = await this.getDb();
        const rows = await db.select<any[]>("SELECT * FROM week_reviews ORDER BY week_start_date DESC LIMIT 1");
        return rows[0] ? this.mapRow(rows[0]) : null;
    }
}

// ... imports
import * as mockRepos from "./mock/repositories";

// Helper to detect Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI_IPC__' in window;

console.log(`[Repository Factory] Environment: ${isTauri ? "Tauri (SQL)" : "Browser (Mock)"}`);

export const organizationRepository = isTauri ? new SqliteOrganizationRepository() : mockRepos.organizationRepository;
export const contactRepository = isTauri ? new SqliteContactRepository() : mockRepos.contactRepository;
export const opportunityRepository = isTauri ? new SqliteOpportunityRepository() : mockRepos.opportunityRepository;
export const meetingRepository = isTauri ? new SqliteMeetingRepository() : mockRepos.meetingRepository;
export const protemoiRepository = isTauri ? new SqliteProtemoiRepository() : mockRepos.protemoiRepository;

export const taskRepository = isTauri ? new SqliteTaskRepository() : (mockRepos as any).taskRepository || new SqliteTaskRepository(); // Fallback if mock task repo missing
export const trackerGoalRepository = isTauri ? new SqliteTrackerGoalRepository() : (mockRepos as any).trackerGoalRepository || new SqliteTrackerGoalRepository();
export const weekReviewRepository = isTauri ? new SqliteWeekReviewRepository() : (mockRepos as any).weekReviewRepository || new SqliteWeekReviewRepository();

