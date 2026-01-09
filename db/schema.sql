-- BD OS local database schema (SQLite)
-- Conventions:
--  - IDs are UUID strings (TEXT)
--  - Dates/times stored as ISO-8601 strings
--  - Booleans stored as INTEGER 0/1
--  - Rich text stored as Markdown (TEXT) in alpha

PRAGMA foreign_keys = ON;

-- Core tables
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  notes_md TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  notes_md TEXT,
  thinking_preference TEXT,          -- enum ThinkingPreference
  primary_buy_in_priority TEXT,      -- enum BuyInPriority
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS protemoi_entries (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL UNIQUE,
  organization_id TEXT,
  protemoi_type TEXT NOT NULL,        -- enum ProtemoiType
  relationship_stage TEXT NOT NULL,   -- enum RelationshipStage
  next_step_text TEXT NOT NULL DEFAULT '',
  next_step_due_date TEXT,
  last_touch_date TEXT,
  next_touch_date TEXT,
  importance_score INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  organization_id TEXT,
  description_md TEXT,
  stage TEXT NOT NULL,                -- enum OpportunityStage
  status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN/WON/LOST/PAUSED
  next_step_text TEXT NOT NULL DEFAULT '',
  next_step_due_date TEXT,
  value_estimate REAL,
  probability INTEGER,                -- 0-100
  expected_close_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS opportunity_contacts (
  opportunity_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  role TEXT, -- free text (e.g., sponsor, decision maker)
  PRIMARY KEY (opportunity_id, contact_id),
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_at TEXT,
  end_at TEXT,
  location TEXT,
  organization_id TEXT,
  related_opportunity_id TEXT,
  notes_md TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (related_opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meeting_attendees (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  contact_id TEXT,
  name TEXT NOT NULL,
  thinking_preference TEXT,
  buy_in_priority TEXT,
  role TEXT, -- decision maker / influencer etc for detailed prep
  notes_md TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                -- MEETING_PREP_STANDARD / MEETING_PREP_DETAILED / CUSTOM
  schema_json TEXT NOT NULL,         -- JSON Schema
  ui_schema_json TEXT,               -- UI schema (optional)
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meeting_preps (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  data_json TEXT NOT NULL,           -- validated against template schema
  data_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description_md TEXT,
  status TEXT NOT NULL,              -- enum TaskStatus
  type TEXT NOT NULL,                -- enum TaskType
  due_date TEXT,
  linked_entity_type TEXT NOT NULL DEFAULT 'NONE', -- enum EntityType
  linked_entity_id TEXT,
  week_review_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS week_reviews (
  id TEXT PRIMARY KEY,
  week_start_date TEXT NOT NULL,
  week_end_date TEXT NOT NULL,
  reflection_md TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS week_review_mits (
  week_review_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  PRIMARY KEY (week_review_id, task_id),
  FOREIGN KEY (week_review_id) REFERENCES week_reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Tags (optional but handy)
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS entity_tags (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id, tag_id),
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Audit log (local only)
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_contact_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_display ON contacts(display_name);
CREATE INDEX IF NOT EXISTS idx_protemoi_stage ON protemoi_entries(relationship_stage);
CREATE INDEX IF NOT EXISTS idx_oppty_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_oppty_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_task_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_meeting_start ON meetings(start_at);

-- Full-text search (FTS5)
-- Note: Requires SQLite built with FTS5 (common in desktop builds).
CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
  entity_type,
  entity_id,
  title,
  body,
  tokenize = 'porter'
);

-- Triggers to keep FTS in sync (minimal set for alpha)
CREATE TRIGGER IF NOT EXISTS trg_fts_opportunities_ai AFTER INSERT ON opportunities BEGIN
  INSERT INTO search_fts(entity_type, entity_id, title, body)
  VALUES ('OPPORTUNITY', new.id, new.name, COALESCE(new.description_md,'') || ' ' || COALESCE(new.next_step_text,''));
END;

CREATE TRIGGER IF NOT EXISTS trg_fts_opportunities_au AFTER UPDATE ON opportunities BEGIN
  INSERT INTO search_fts(search_fts, entity_type, entity_id, title, body)
  VALUES('delete', 'OPPORTUNITY', old.id, old.name, COALESCE(old.description_md,'') || ' ' || COALESCE(old.next_step_text,''));
  INSERT INTO search_fts(entity_type, entity_id, title, body)
  VALUES ('OPPORTUNITY', new.id, new.name, COALESCE(new.description_md,'') || ' ' || COALESCE(new.next_step_text,''));
END;

CREATE TRIGGER IF NOT EXISTS trg_fts_opportunities_ad AFTER DELETE ON opportunities BEGIN
  INSERT INTO search_fts(search_fts, entity_type, entity_id, title, body)
  VALUES('delete', 'OPPORTUNITY', old.id, old.name, COALESCE(old.description_md,'') || ' ' || COALESCE(old.next_step_text,''));
END;

CREATE TRIGGER IF NOT EXISTS trg_fts_contacts_ai AFTER INSERT ON contacts BEGIN
  INSERT INTO search_fts(entity_type, entity_id, title, body)
  VALUES ('CONTACT', new.id, new.display_name, COALESCE(new.title,'') || ' ' || COALESCE(new.email,'') || ' ' || COALESCE(new.notes_md,''));
END;

CREATE TRIGGER IF NOT EXISTS trg_fts_contacts_au AFTER UPDATE ON contacts BEGIN
  INSERT INTO search_fts(search_fts, entity_type, entity_id, title, body)
  VALUES('delete', 'CONTACT', old.id, old.display_name, COALESCE(old.title,'') || ' ' || COALESCE(old.email,'') || ' ' || COALESCE(old.notes_md,''));
  INSERT INTO search_fts(entity_type, entity_id, title, body)
  VALUES ('CONTACT', new.id, new.display_name, COALESCE(new.title,'') || ' ' || COALESCE(new.email,'') || ' ' || COALESCE(new.notes_md,''));
END;

CREATE TRIGGER IF NOT EXISTS trg_fts_contacts_ad AFTER DELETE ON contacts BEGIN
  INSERT INTO search_fts(search_fts, entity_type, entity_id, title, body)
  VALUES('delete', 'CONTACT', old.id, old.display_name, COALESCE(old.title,'') || ' ' || COALESCE(old.email,'') || ' ' || COALESCE(old.notes_md,''));
END;
