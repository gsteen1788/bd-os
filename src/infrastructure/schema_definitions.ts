export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  logo_url TEXT,
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
  location TEXT,
  marital_status TEXT,
  children TEXT,
  hobbies_interests TEXT,
  current_focus TEXT,
  stories_anecdotes TEXT,
  career_history TEXT,
  education TEXT,
  linkedin_url TEXT,
  other TEXT,
  notes_md TEXT,
  thinking_preference TEXT,
  primary_buy_in_priority TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS protemoi_entries (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL UNIQUE,
  organization_id TEXT,
  protemoi_type TEXT NOT NULL,
  relationship_stage TEXT NOT NULL,
  next_step_text TEXT NOT NULL DEFAULT '',
  next_step_due_date TEXT,
  last_touch_date TEXT,
  next_touch_date TEXT,
  importance_score INTEGER,
  is_internal INTEGER DEFAULT 0,
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
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  next_step_text TEXT NOT NULL DEFAULT '',
  next_step_due_date TEXT,
  value_estimate REAL,
  probability INTEGER,
  expected_close_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
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
  role TEXT,
  notes_md TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description_md TEXT,
  status TEXT NOT NULL,
  type TEXT NOT NULL,
  due_date TEXT,
  linked_entity_type TEXT NOT NULL DEFAULT 'NONE',
  linked_entity_id TEXT,
  week_review_id TEXT,
  big_impact_description TEXT,
  in_control_description TEXT,
  growth_oriented_description TEXT,
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
CREATE TABLE IF NOT EXISTS task_links (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
`;
