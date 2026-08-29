# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_08_29_170000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "ai_usage_expenses", id: :string, force: :cascade do |t|
    t.string "allocation_method"
    t.datetime "created_at", null: false
    t.integer "estimated_cost_cents", default: 0, null: false
    t.string "feature", null: false
    t.string "funding_program_id"
    t.string "grant_review_status", default: "not_reviewed", null: false
    t.integer "input_tokens", default: 0, null: false
    t.string "invoice_reference"
    t.integer "invoiced_cost_cents"
    t.string "model", null: false
    t.string "organization_id", null: false
    t.integer "output_tokens", default: 0, null: false
    t.string "participant_id"
    t.string "provider", null: false
    t.datetime "usage_date", null: false
    t.index ["organization_id", "funding_program_id", "usage_date", "feature"], name: "ai_expenses_reporting_idx"
  end

  create_table "extension_link_codes", id: :string, force: :cascade do |t|
    t.datetime "claimed_at"
    t.string "code_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["code_digest"], name: "index_extension_link_codes_on_code_digest", unique: true
  end

  create_table "funding_programs", id: :string, force: :cascade do |t|
    t.string "award_number"
    t.datetime "created_at", null: false
    t.date "ends_on"
    t.string "name", null: false
    t.string "organization_id", null: false
    t.string "reporting_frequency"
    t.date "starts_on"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "name"], name: "index_funding_programs_on_organization_id_and_name", unique: true
  end

  create_table "interview_prep_contexts", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "employment_plan_id"
    t.string "job_opportunity_id"
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.string "status", default: "active", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "visibility", default: "private", null: false
    t.index ["organization_id", "participant_id", "updated_at"], name: "interview_contexts_scope_idx"
  end

  create_table "interview_prep_results", id: :string, force: :cascade do |t|
    t.integer "confidence"
    t.string "context_id", null: false
    t.datetime "created_at", null: false
    t.string "improvement_area"
    t.string "item_key", null: false
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.text "response_text"
    t.string "result_type", null: false
    t.integer "score", default: 0, null: false
    t.string "session_id", null: false
    t.index ["organization_id", "participant_id", "result_type", "created_at"], name: "interview_results_scope_idx"
  end

  create_table "interview_prep_sessions", id: :string, force: :cascade do |t|
    t.datetime "completed_at"
    t.string "context_id", null: false
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.jsonb "score", default: {}, null: false
    t.string "session_type", null: false
    t.datetime "started_at", null: false
    t.string "status", default: "started", null: false
    t.index ["organization_id", "started_at"], name: "interview_sessions_reporting_idx"
  end

  create_table "oauth_states", id: :string, force: :cascade do |t|
    t.datetime "consumed_at"
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "nonce_digest", null: false
    t.string "provider", null: false
    t.string "redirect_uri", null: false
    t.string "state_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["state_digest"], name: "index_oauth_states_on_state_digest", unique: true
  end

  create_table "organization_events", id: :string, force: :cascade do |t|
    t.string "actor_id"
    t.string "actor_type", null: false
    t.datetime "created_at", null: false
    t.string "event_type", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "organization_id", null: false
    t.string "subject_id"
    t.string "subject_type"
    t.index ["organization_id", "event_type", "created_at"], name: "idx_on_organization_id_event_type_created_at_e7e7094e11"
  end

  create_table "organization_invites", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "expires_at", null: false
    t.string "location_id"
    t.string "organization_id", null: false
    t.datetime "redeemed_at"
    t.string "role", null: false
    t.string "sponsor_membership_id"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["token_digest"], name: "index_organization_invites_on_token_digest", unique: true
  end

  create_table "organization_locations", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "is_primary", default: false, null: false
    t.string "name", null: false
    t.string "organization_id", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "name"], name: "index_organization_locations_on_organization_id_and_name", unique: true
  end

  create_table "organization_memberships", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "display_name", null: false
    t.string "email", null: false
    t.string "location_id"
    t.string "organization_id", null: false
    t.string "password_digest"
    t.string "role", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "email"], name: "index_organization_memberships_on_organization_id_and_email", unique: true
  end

  create_table "organizations", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_organizations_on_slug", unique: true
  end

  create_table "participant_consents", id: :string, force: :cascade do |t|
    t.string "consent_type", null: false
    t.datetime "created_at", null: false
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.datetime "recorded_at", null: false
    t.string "recorded_by_membership_id"
    t.datetime "revoked_at"
    t.string "status", null: false
    t.string "version"
    t.index ["participant_id", "consent_type", "version"], name: "idx_on_participant_id_consent_type_version_57173c0de2", unique: true
  end

  create_table "participant_documents", id: :string, force: :cascade do |t|
    t.integer "byte_size", null: false
    t.datetime "created_at", null: false
    t.string "document_type", null: false
    t.string "file_name", null: false
    t.string "mime_type", null: false
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.string "storage_path", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "participant_id", "created_at"], name: "idx_on_organization_id_participant_id_created_at_26de2c56bc"
  end

  create_table "participant_employment_plans", id: :string, force: :cascade do |t|
    t.jsonb "action_steps", default: [], null: false
    t.datetime "created_at", null: false
    t.string "created_by_membership_id"
    t.string "funding_program_id"
    t.text "goal", null: false
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.date "review_date"
    t.string "status", default: "active", null: false
    t.decimal "target_hourly_wage", precision: 10, scale: 2
    t.decimal "target_hours_per_week", precision: 6, scale: 2
    t.string "target_industry"
    t.string "target_job_title"
    t.date "target_start_date"
    t.datetime "updated_at", null: false
  end

  create_table "participant_employment_profiles", primary_key: "participant_id", id: :string, force: :cascade do |t|
    t.string "assigned_membership_id"
    t.jsonb "barriers", default: [], null: false
    t.jsonb "certifications", default: [], null: false
    t.datetime "created_at", null: false
    t.text "employment_goal"
    t.string "organization_id", null: false
    t.string "participant_number"
    t.string "preferred_contact_method"
    t.string "preferred_language"
    t.string "preferred_name"
    t.jsonb "skills", default: [], null: false
    t.jsonb "support_needs", default: [], null: false
    t.jsonb "target_industries", default: [], null: false
    t.datetime "updated_at", null: false
    t.jsonb "work_preferences", default: {}, null: false
    t.index ["organization_id", "participant_number"], name: "idx_on_organization_id_participant_number_66d7e494a4", unique: true
  end

  create_table "participant_job_activities", id: :string, force: :cascade do |t|
    t.datetime "activity_date", null: false
    t.string "activity_type", null: false
    t.datetime "created_at", null: false
    t.string "evidence_document_id"
    t.string "funding_program_id"
    t.string "job_opportunity_id"
    t.text "notes"
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.boolean "participant_reported", default: false, null: false
    t.string "staff_membership_id"
    t.string "status", default: "completed", null: false
  end

  create_table "participant_job_opportunities", id: :string, force: :cascade do |t|
    t.datetime "application_review_started_at"
    t.datetime "application_started_at"
    t.datetime "applied_at"
    t.datetime "closed_at"
    t.string "closed_reason"
    t.datetime "created_at", null: false
    t.string "employer_name", null: false
    t.string "employment_type"
    t.string "funding_program_id"
    t.decimal "hourly_wage", precision: 10, scale: 2
    t.decimal "hours_per_week", precision: 6, scale: 2
    t.datetime "interview_at"
    t.string "job_title", null: false
    t.string "location_text"
    t.datetime "offer_at"
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.datetime "saved_at", null: false
    t.string "source"
    t.string "status", default: "saved", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "participant_id", "status", "updated_at"], name: "jobs_pipeline_idx"
  end

  create_table "participant_job_placements", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "employer_name", null: false
    t.string "employment_type"
    t.date "end_date"
    t.string "end_reason"
    t.string "funding_program_id"
    t.decimal "hourly_wage", precision: 10, scale: 2
    t.decimal "hours_per_week", precision: 6, scale: 2
    t.string "job_opportunity_id"
    t.string "job_title", null: false
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.date "start_date", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.string "verification_method"
    t.datetime "verified_at"
    t.string "verified_by_membership_id"
  end

  create_table "participant_product_activities", id: :string, force: :cascade do |t|
    t.datetime "activity_date", null: false
    t.string "activity_type", null: false
    t.datetime "created_at", null: false
    t.string "funding_program_id"
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.string "related_document_id"
    t.string "related_job_opportunity_id"
    t.boolean "staff_verified", default: false, null: false
    t.string "status", default: "completed", null: false
  end

  create_table "participant_profiles", id: :string, force: :cascade do |t|
    t.string "consent_version"
    t.datetime "created_at", null: false
    t.string "display_name", null: false
    t.string "email", null: false
    t.string "location_id"
    t.string "organization_id", null: false
    t.string "password_digest"
    t.string "sponsor_membership_id"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "email"], name: "index_participant_profiles_on_organization_id_and_email", unique: true
  end

  create_table "participant_program_enrollments", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "eligibility_status", default: "pending", null: false
    t.date "enrollment_date", null: false
    t.date "exit_date"
    t.string "exit_reason"
    t.string "funding_program_id"
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "funding_program_id", "status", "enrollment_date"], name: "enrollments_reporting_idx"
  end

  create_table "participant_retention_checkins", id: :string, force: :cascade do |t|
    t.date "checkin_date", null: false
    t.datetime "created_at", null: false
    t.integer "days_since_start"
    t.decimal "hours_per_week", precision: 6, scale: 2
    t.string "job_placement_id", null: false
    t.date "next_checkin_date"
    t.string "organization_id", null: false
    t.string "participant_id", null: false
    t.boolean "participant_reported", default: false, null: false
    t.boolean "still_employed", null: false
    t.text "support_provided"
    t.datetime "updated_at", null: false
    t.boolean "wage_changed"
  end

  create_table "participant_service_records", id: :string, force: :cascade do |t|
    t.string "completion_status", default: "completed", null: false
    t.datetime "created_at", null: false
    t.integer "duration_minutes"
    t.string "evidence_document_id"
    t.string "funding_program_id"
    t.string "organization_id", null: false
    t.text "outcome_summary"
    t.string "participant_id", null: false
    t.string "provider_membership_id"
    t.datetime "service_date", null: false
    t.string "service_type", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "funding_program_id", "service_date", "service_type"], name: "services_reporting_idx"
  end

  create_table "platform_accounts", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "display_name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_platform_accounts_on_email", unique: true
  end

  create_table "platform_sessions", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "organization_id", null: false
    t.datetime "revoked_at"
    t.string "subject_id", null: false
    t.string "subject_type", null: false
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["token_digest"], name: "index_platform_sessions_on_token_digest", unique: true
  end
end
