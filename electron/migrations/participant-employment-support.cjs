// These tables intentionally cover employment support, grant reporting, and product cost.
// Clinical records, diagnoses, treatment notes, and raw AI prompts do not belong here.
const migrations = [
  {
    version: '20260828_participant_employment_support',
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS funding_programs (
          id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, name TEXT NOT NULL,
          award_number TEXT, reporting_frequency TEXT, starts_on TEXT, ends_on TEXT,
          status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          UNIQUE(organization_id, name), FOREIGN KEY(organization_id) REFERENCES organizations(id)
        );
        CREATE TABLE IF NOT EXISTS participant_employment_profiles (
          participant_id TEXT PRIMARY KEY, organization_id TEXT NOT NULL,
          participant_number TEXT, preferred_name TEXT, preferred_contact_method TEXT,
          preferred_language TEXT, employment_goal TEXT, target_industries_json TEXT NOT NULL DEFAULT '[]',
          work_preferences_json TEXT NOT NULL DEFAULT '{}', skills_json TEXT NOT NULL DEFAULT '[]',
          certifications_json TEXT NOT NULL DEFAULT '[]', barriers_json TEXT NOT NULL DEFAULT '[]',
          support_needs_json TEXT NOT NULL DEFAULT '[]', assigned_membership_id TEXT,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          UNIQUE(organization_id, participant_number),
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(assigned_membership_id) REFERENCES organization_memberships(id)
        );
        CREATE TABLE IF NOT EXISTS participant_consents (
          id TEXT PRIMARY KEY, participant_id TEXT NOT NULL, organization_id TEXT NOT NULL,
          consent_type TEXT NOT NULL, status TEXT NOT NULL, version TEXT, recorded_at TEXT NOT NULL,
          revoked_at TEXT, recorded_by_membership_id TEXT, created_at TEXT NOT NULL,
          UNIQUE(participant_id, consent_type, version),
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(recorded_by_membership_id) REFERENCES organization_memberships(id)
        );
        CREATE TABLE IF NOT EXISTS participant_program_enrollments (
          id TEXT PRIMARY KEY, participant_id TEXT NOT NULL, organization_id TEXT NOT NULL,
          funding_program_id TEXT, enrollment_date TEXT NOT NULL, exit_date TEXT, exit_reason TEXT,
          eligibility_status TEXT NOT NULL DEFAULT 'pending', status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(funding_program_id) REFERENCES funding_programs(id)
        );
        CREATE TABLE IF NOT EXISTS participant_employment_plans (
          id TEXT PRIMARY KEY, participant_id TEXT NOT NULL, organization_id TEXT NOT NULL,
          funding_program_id TEXT, goal TEXT NOT NULL, target_job_title TEXT, target_industry TEXT,
          target_hourly_wage REAL, target_hours_per_week REAL, target_start_date TEXT,
          action_steps_json TEXT NOT NULL DEFAULT '[]', review_date TEXT, status TEXT NOT NULL DEFAULT 'active',
          created_by_membership_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(funding_program_id) REFERENCES funding_programs(id),
          FOREIGN KEY(created_by_membership_id) REFERENCES organization_memberships(id)
        );
        CREATE TABLE IF NOT EXISTS participant_service_records (
          id TEXT PRIMARY KEY, participant_id TEXT NOT NULL, organization_id TEXT NOT NULL,
          funding_program_id TEXT, service_type TEXT NOT NULL, service_date TEXT NOT NULL,
          duration_minutes INTEGER, completion_status TEXT NOT NULL DEFAULT 'completed',
          provider_membership_id TEXT, evidence_document_id TEXT, outcome_summary TEXT,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(funding_program_id) REFERENCES funding_programs(id),
          FOREIGN KEY(provider_membership_id) REFERENCES organization_memberships(id),
          FOREIGN KEY(evidence_document_id) REFERENCES participant_documents(id)
        );
        CREATE TABLE IF NOT EXISTS participant_job_opportunities (
          id TEXT PRIMARY KEY, participant_id TEXT NOT NULL, organization_id TEXT NOT NULL,
          funding_program_id TEXT, employer_name TEXT NOT NULL, job_title TEXT NOT NULL,
          location_text TEXT, employment_type TEXT, hourly_wage REAL, hours_per_week REAL,
          status TEXT NOT NULL DEFAULT 'saved', source TEXT, saved_at TEXT NOT NULL,
          applied_at TEXT, interview_at TEXT, offer_at TEXT, closed_at TEXT, closed_reason TEXT,
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(funding_program_id) REFERENCES funding_programs(id)
        );
        CREATE TABLE IF NOT EXISTS participant_job_activities (
          id TEXT PRIMARY KEY, participant_id TEXT NOT NULL, organization_id TEXT NOT NULL,
          job_opportunity_id TEXT, funding_program_id TEXT, activity_type TEXT NOT NULL,
          activity_date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'completed',
          staff_membership_id TEXT, participant_reported INTEGER NOT NULL DEFAULT 0,
          evidence_document_id TEXT, notes TEXT, created_at TEXT NOT NULL,
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(job_opportunity_id) REFERENCES participant_job_opportunities(id),
          FOREIGN KEY(funding_program_id) REFERENCES funding_programs(id),
          FOREIGN KEY(staff_membership_id) REFERENCES organization_memberships(id),
          FOREIGN KEY(evidence_document_id) REFERENCES participant_documents(id)
        );
        CREATE TABLE IF NOT EXISTS participant_job_placements (
          id TEXT PRIMARY KEY, participant_id TEXT NOT NULL, organization_id TEXT NOT NULL,
          funding_program_id TEXT, job_opportunity_id TEXT, employer_name TEXT NOT NULL,
          job_title TEXT NOT NULL, start_date TEXT NOT NULL, hourly_wage REAL,
          hours_per_week REAL, employment_type TEXT, verification_method TEXT,
          verified_at TEXT, verified_by_membership_id TEXT, status TEXT NOT NULL DEFAULT 'active',
          end_date TEXT, end_reason TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(funding_program_id) REFERENCES funding_programs(id),
          FOREIGN KEY(job_opportunity_id) REFERENCES participant_job_opportunities(id),
          FOREIGN KEY(verified_by_membership_id) REFERENCES organization_memberships(id)
        );
        CREATE TABLE IF NOT EXISTS participant_retention_checkins (
          id TEXT PRIMARY KEY, participant_id TEXT NOT NULL, organization_id TEXT NOT NULL,
          job_placement_id TEXT NOT NULL, checkin_date TEXT NOT NULL, days_since_start INTEGER,
          still_employed INTEGER NOT NULL, hours_per_week REAL, wage_changed INTEGER,
          support_provided TEXT, participant_reported INTEGER NOT NULL DEFAULT 0,
          next_checkin_date TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(job_placement_id) REFERENCES participant_job_placements(id)
        );
        CREATE TABLE IF NOT EXISTS participant_product_activities (
          id TEXT PRIMARY KEY, participant_id TEXT NOT NULL, organization_id TEXT NOT NULL,
          funding_program_id TEXT, activity_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'completed',
          activity_date TEXT NOT NULL, related_document_id TEXT, related_job_opportunity_id TEXT,
          staff_verified INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(funding_program_id) REFERENCES funding_programs(id),
          FOREIGN KEY(related_document_id) REFERENCES participant_documents(id),
          FOREIGN KEY(related_job_opportunity_id) REFERENCES participant_job_opportunities(id)
        );
        CREATE TABLE IF NOT EXISTS ai_usage_expenses (
          id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, participant_id TEXT,
          funding_program_id TEXT, provider TEXT NOT NULL, model TEXT NOT NULL, feature TEXT NOT NULL,
          usage_date TEXT NOT NULL, input_tokens INTEGER NOT NULL DEFAULT 0,
          output_tokens INTEGER NOT NULL DEFAULT 0, estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
          invoiced_cost_cents INTEGER, invoice_reference TEXT, allocation_method TEXT,
          grant_review_status TEXT NOT NULL DEFAULT 'not_reviewed', created_at TEXT NOT NULL,
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(funding_program_id) REFERENCES funding_programs(id)
        );
        CREATE INDEX IF NOT EXISTS employment_profiles_org_idx ON participant_employment_profiles(organization_id);
        CREATE INDEX IF NOT EXISTS consents_participant_idx ON participant_consents(organization_id, participant_id, consent_type);
        CREATE INDEX IF NOT EXISTS enrollments_reporting_idx ON participant_program_enrollments(organization_id, funding_program_id, status, enrollment_date);
        CREATE INDEX IF NOT EXISTS services_reporting_idx ON participant_service_records(organization_id, funding_program_id, service_date, service_type);
        CREATE INDEX IF NOT EXISTS jobs_pipeline_idx ON participant_job_opportunities(organization_id, participant_id, status, updated_at);
        CREATE INDEX IF NOT EXISTS job_activities_reporting_idx ON participant_job_activities(organization_id, participant_id, activity_date, activity_type);
        CREATE INDEX IF NOT EXISTS placements_reporting_idx ON participant_job_placements(organization_id, funding_program_id, start_date, status);
        CREATE INDEX IF NOT EXISTS retention_reporting_idx ON participant_retention_checkins(organization_id, job_placement_id, checkin_date);
        CREATE INDEX IF NOT EXISTS product_activities_reporting_idx ON participant_product_activities(organization_id, participant_id, activity_date, activity_type);
        CREATE INDEX IF NOT EXISTS ai_expenses_reporting_idx ON ai_usage_expenses(organization_id, funding_program_id, usage_date, feature);
      `);
    },
  },
  {
    version: '20260828_interview_preparation',
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS interview_prep_contexts (
          id TEXT PRIMARY KEY, participant_id TEXT NOT NULL, organization_id TEXT NOT NULL,
          employment_plan_id TEXT, job_opportunity_id TEXT, title TEXT NOT NULL,
          visibility TEXT NOT NULL DEFAULT 'private', status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id),
          FOREIGN KEY(employment_plan_id) REFERENCES participant_employment_plans(id),
          FOREIGN KEY(job_opportunity_id) REFERENCES participant_job_opportunities(id)
        );
        CREATE TABLE IF NOT EXISTS interview_prep_sessions (
          id TEXT PRIMARY KEY, context_id TEXT NOT NULL, participant_id TEXT NOT NULL,
          organization_id TEXT NOT NULL, session_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'started',
          score_json TEXT NOT NULL DEFAULT '{}', started_at TEXT NOT NULL, completed_at TEXT,
          FOREIGN KEY(context_id) REFERENCES interview_prep_contexts(id),
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id)
        );
        CREATE TABLE IF NOT EXISTS interview_prep_results (
          id TEXT PRIMARY KEY, session_id TEXT NOT NULL, context_id TEXT NOT NULL,
          participant_id TEXT NOT NULL, organization_id TEXT NOT NULL, result_type TEXT NOT NULL,
          item_key TEXT NOT NULL, score INTEGER NOT NULL DEFAULT 0, confidence INTEGER,
          improvement_area TEXT, response_text TEXT, created_at TEXT NOT NULL,
          FOREIGN KEY(session_id) REFERENCES interview_prep_sessions(id),
          FOREIGN KEY(context_id) REFERENCES interview_prep_contexts(id),
          FOREIGN KEY(participant_id) REFERENCES participant_profiles(id),
          FOREIGN KEY(organization_id) REFERENCES organizations(id)
        );
        CREATE INDEX IF NOT EXISTS interview_contexts_scope_idx ON interview_prep_contexts(organization_id, participant_id, updated_at);
        CREATE INDEX IF NOT EXISTS interview_sessions_reporting_idx ON interview_prep_sessions(organization_id, started_at, status);
        CREATE INDEX IF NOT EXISTS interview_results_scope_idx ON interview_prep_results(organization_id, participant_id, result_type, created_at);
      `);
    },
  },
];

function runMigrations(db, appliedAt) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
  const applied = db.prepare('SELECT version FROM platform_schema_migrations WHERE version = ?');
  const record = db.prepare('INSERT INTO platform_schema_migrations (version, applied_at) VALUES (?, ?)');
  const migrate = db.transaction((migration) => {
    migration.up(db);
    record.run(migration.version, appliedAt());
  });
  for (const migration of migrations) {
    if (!applied.get(migration.version)) migrate(migration);
  }
}

module.exports = { migrations, runMigrations };
