import {
    OrganizationRepository, ContactRepository, OpportunityRepository,
    MeetingRepository, Repository, ProtemoiRepository
} from "../application/interfaces";
import {
    Organization, Contact, Opportunity, Meeting, UUID, ProtemoiEntry
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
            `INSERT INTO organizations (id, name, industry, notes_md, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT(id) DO UPDATE SET 
            name=excluded.name, 
            industry=excluded.industry,
            notes_md=excluded.notes_md,
            updated_at=excluded.updated_at`,
            [entity.id, entity.name, entity.industry, entity.notesMd, entity.createdAt, entity.updatedAt]
        );
    }

    async findAll(): Promise<Organization[]> {
        const db = await this.getDb();
        return db.select<Organization[]>("SELECT * FROM organizations ORDER BY updated_at DESC");
    }

    async search(query: string): Promise<Organization[]> {
        const db = await this.getDb();
        return db.select<Organization[]>(
            "SELECT * FROM organizations WHERE name LIKE $1 ORDER BY updated_at DESC",
            [`%${query}%`]
        );
    }
}

export class SqliteContactRepository extends SqliteRepository<Contact> implements ContactRepository {
    protected tableName = "contacts";

    async findAll(): Promise<Contact[]> {
        const db = await this.getDb();
        return db.select<Contact[]>("SELECT * FROM contacts ORDER BY updated_at DESC");
    }

    async save(entity: Contact): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            `INSERT INTO contacts (id, organization_id, first_name, last_name, display_name, title, email, phone, notes_md, thinking_preference, primary_buy_in_priority, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT(id) DO UPDATE SET 
            display_name=excluded.display_name,
            title=excluded.title,
            email=excluded.email,
            updated_at=excluded.updated_at`,
            [entity.id, entity.organizationId, entity.firstName, entity.lastName, entity.displayName, entity.title, entity.email, entity.phone, entity.notesMd, entity.thinkingPreference, entity.primaryBuyInPriority, entity.createdAt, entity.updatedAt]
        );
    }

    async findByOrganizationId(orgId: UUID): Promise<Contact[]> {
        const db = await this.getDb();
        return db.select<Contact[]>("SELECT * FROM contacts WHERE organization_id = $1", [orgId]);
    }

    async search(query: string): Promise<Contact[]> {
        const db = await this.getDb();
        return db.select<Contact[]>(
            "SELECT * FROM contacts WHERE display_name LIKE $1 OR email LIKE $1",
            [`%${query}%`]
        );
    }
}

export class SqliteOpportunityRepository extends SqliteRepository<Opportunity> implements OpportunityRepository {
    protected tableName = "opportunities";

    async findAll(): Promise<Opportunity[]> {
        const db = await this.getDb();
        return db.select<Opportunity[]>("SELECT * FROM opportunities ORDER BY updated_at DESC");
    }

    async save(entity: Opportunity): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            `INSERT INTO opportunities (id, name, organization_id, description_md, stage, status, next_step_text, value_estimate, probability, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT(id) DO UPDATE SET name=excluded.name, stage=excluded.stage, status=excluded.status, updated_at=excluded.updated_at`,
            [entity.id, entity.name, entity.organizationId, entity.descriptionMd, entity.stage, entity.status, entity.nextStepText, entity.valueEstimate, entity.probability, entity.createdAt, entity.updatedAt]
        );
    }

    async findByOrganizationId(orgId: UUID): Promise<Opportunity[]> {
        const db = await this.getDb();
        return db.select<Opportunity[]>("SELECT * FROM opportunities WHERE organization_id = $1", [orgId]);
    }

    async findAllByStage(stage: string): Promise<Opportunity[]> {
        const db = await this.getDb();
        return db.select<Opportunity[]>("SELECT * FROM opportunities WHERE stage = $1", [stage]);
    }
}

export class SqliteMeetingRepository extends SqliteRepository<Meeting> implements MeetingRepository {
    protected tableName = "meetings";

    async save(entity: Meeting): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            `INSERT INTO meetings (id, title, start_at, end_at, location, organization_id, notes_md, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              ON CONFLICT(id) DO UPDATE SET title=excluded.title, updated_at=excluded.updated_at`,
            [entity.id, entity.title, entity.startAt, entity.endAt, entity.location, entity.organizationId, entity.notesMd, entity.createdAt, entity.updatedAt]
        );
    }

    async findByOpportunityId(oppId: UUID): Promise<Meeting[]> {
        const db = await this.getDb();
        return db.select<Meeting[]>("SELECT * FROM meetings WHERE related_opportunity_id = $1", [oppId]);
    }

    async findUpcoming(limit: number): Promise<Meeting[]> {
        const db = await this.getDb();
        // SQLite date comparison string based
        return db.select<Meeting[]>(
            `SELECT * FROM meetings WHERE start_at > date('now') ORDER BY start_at ASC LIMIT ${limit}`
        );
    }
}

export class SqliteProtemoiRepository extends SqliteRepository<ProtemoiEntry> implements ProtemoiRepository {
    protected tableName = "protemoi_entries";

    async save(entity: ProtemoiEntry): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            `INSERT INTO protemoi_entries (id, contact_id, organization_id, protemoi_type, relationship_stage, next_step_text, next_step_due_date, last_touch_date, next_touch_date, importance_score, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT(id) DO UPDATE SET 
                protemoi_type=excluded.protemoi_type, 
                relationship_stage=excluded.relationship_stage,
                next_step_text=excluded.next_step_text,
                next_step_due_date=excluded.next_step_due_date,
                last_touch_date=excluded.last_touch_date,
                next_touch_date=excluded.next_touch_date,
                importance_score=excluded.importance_score,
                updated_at=excluded.updated_at`,
            [entity.id, entity.contactId, entity.organizationId, entity.protemoiType, entity.relationshipStage, entity.nextStepText, entity.nextStepDueDate, entity.lastTouchDate, entity.nextTouchDate, entity.importanceScore, entity.createdAt, entity.updatedAt]
        );
    }

    async findByContactId(contactId: UUID): Promise<ProtemoiEntry | null> {
        const db = await this.getDb();
        const res = await db.select<ProtemoiEntry[]>("SELECT * FROM protemoi_entries WHERE contact_id = $1", [contactId]);
        return res[0] || null;
    }

    async findAll(): Promise<ProtemoiEntry[]> {
        const db = await this.getDb();
        return db.select<ProtemoiEntry[]>("SELECT * FROM protemoi_entries ORDER BY updated_at DESC");
    }
}

export const organizationRepository = new SqliteOrganizationRepository();
export const contactRepository = new SqliteContactRepository();
export const opportunityRepository = new SqliteOpportunityRepository();
export const meetingRepository = new SqliteMeetingRepository();
export const protemoiRepository = new SqliteProtemoiRepository();
