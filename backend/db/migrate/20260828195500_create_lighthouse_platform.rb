class CreateLighthousePlatform < ActiveRecord::Migration[8.1]
  def change
    create_table :platform_accounts, id: :string do |t|
      t.string :email, null: false
      t.string :display_name, null: false
      t.string :password_digest, null: false
      t.string :status, null: false, default: "active"
      t.timestamps
    end
    add_index :platform_accounts, :email, unique: true

    create_table :organizations, id: :string do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :status, null: false, default: "active"
      t.timestamps
    end
    add_index :organizations, :slug, unique: true

    create_table :organization_locations, id: :string do |t|
      t.string :organization_id, null: false
      t.string :name, null: false
      t.boolean :is_primary, null: false, default: false
      t.string :status, null: false, default: "active"
      t.timestamps
    end
    add_index :organization_locations, %i[organization_id name], unique: true

    create_table :organization_memberships, id: :string do |t|
      t.string :organization_id, null: false
      t.string :email, null: false
      t.string :display_name, null: false
      t.string :role, null: false
      t.string :location_id
      t.string :password_digest
      t.string :status, null: false, default: "active"
      t.timestamps
    end
    add_index :organization_memberships, %i[organization_id email], unique: true

    create_table :participant_profiles, id: :string do |t|
      t.string :organization_id, null: false
      t.string :email, null: false
      t.string :display_name, null: false
      t.string :password_digest
      t.string :location_id
      t.string :sponsor_membership_id
      t.string :status, null: false, default: "active"
      t.string :consent_version
      t.timestamps
    end
    add_index :participant_profiles, %i[organization_id email], unique: true

    create_table :participant_documents, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :document_type, null: false
      t.string :file_name, null: false
      t.string :mime_type, null: false
      t.integer :byte_size, null: false
      t.string :storage_path, null: false
      t.timestamps
    end
    add_index :participant_documents, %i[organization_id participant_id created_at]

    create_table :organization_invites, id: :string do |t|
      t.string :organization_id, null: false
      t.string :email, null: false
      t.string :role, null: false
      t.string :location_id
      t.string :sponsor_membership_id
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :redeemed_at
      t.timestamps
    end
    add_index :organization_invites, :token_digest, unique: true

    create_table :platform_sessions, id: :string do |t|
      t.string :subject_type, null: false
      t.string :subject_id, null: false
      t.string :organization_id, null: false
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.timestamps
    end
    add_index :platform_sessions, :token_digest, unique: true

    create_table :extension_link_codes, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :code_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :claimed_at
      t.timestamps
    end
    add_index :extension_link_codes, :code_digest, unique: true

    create_table :oauth_states, id: :string do |t|
      t.string :provider, null: false
      t.string :state_digest, null: false
      t.string :nonce_digest, null: false
      t.string :redirect_uri, null: false
      t.datetime :expires_at, null: false
      t.datetime :consumed_at
      t.timestamps
    end
    add_index :oauth_states, :state_digest, unique: true

    create_table :organization_events, id: :string do |t|
      t.string :organization_id, null: false
      t.string :actor_type, null: false
      t.string :actor_id
      t.string :event_type, null: false
      t.string :subject_type
      t.string :subject_id
      t.jsonb :metadata, null: false, default: {}
      t.datetime :created_at, null: false
    end
    add_index :organization_events, %i[organization_id event_type created_at]

    create_table :funding_programs, id: :string do |t|
      t.string :organization_id, null: false
      t.string :name, null: false
      t.string :award_number
      t.string :reporting_frequency
      t.date :starts_on
      t.date :ends_on
      t.string :status, null: false, default: "active"
      t.timestamps
    end
    add_index :funding_programs, %i[organization_id name], unique: true

    create_table :participant_employment_profiles, id: false do |t|
      t.string :participant_id, null: false, primary_key: true
      t.string :organization_id, null: false
      t.string :participant_number
      t.string :preferred_name
      t.string :preferred_contact_method
      t.string :preferred_language
      t.text :employment_goal
      t.jsonb :target_industries, null: false, default: []
      t.jsonb :work_preferences, null: false, default: {}
      t.jsonb :skills, null: false, default: []
      t.jsonb :certifications, null: false, default: []
      t.jsonb :barriers, null: false, default: []
      t.jsonb :support_needs, null: false, default: []
      t.string :assigned_membership_id
      t.timestamps
    end
    add_index :participant_employment_profiles, %i[organization_id participant_number], unique: true

    create_table :participant_consents, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :consent_type, null: false
      t.string :status, null: false
      t.string :version
      t.datetime :recorded_at, null: false
      t.datetime :revoked_at
      t.string :recorded_by_membership_id
      t.datetime :created_at, null: false
    end
    add_index :participant_consents, %i[participant_id consent_type version], unique: true

    create_table :participant_program_enrollments, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :funding_program_id
      t.date :enrollment_date, null: false
      t.date :exit_date
      t.string :exit_reason
      t.string :eligibility_status, null: false, default: "pending"
      t.string :status, null: false, default: "active"
      t.timestamps
    end
    add_index :participant_program_enrollments, %i[organization_id funding_program_id status enrollment_date], name: "enrollments_reporting_idx"

    create_table :participant_employment_plans, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :funding_program_id
      t.text :goal, null: false
      t.string :target_job_title
      t.string :target_industry
      t.decimal :target_hourly_wage, precision: 10, scale: 2
      t.decimal :target_hours_per_week, precision: 6, scale: 2
      t.date :target_start_date
      t.jsonb :action_steps, null: false, default: []
      t.date :review_date
      t.string :status, null: false, default: "active"
      t.string :created_by_membership_id
      t.timestamps
    end

    create_table :participant_service_records, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :funding_program_id
      t.string :service_type, null: false
      t.datetime :service_date, null: false
      t.integer :duration_minutes
      t.string :completion_status, null: false, default: "completed"
      t.string :provider_membership_id
      t.string :evidence_document_id
      t.text :outcome_summary
      t.timestamps
    end
    add_index :participant_service_records, %i[organization_id funding_program_id service_date service_type], name: "services_reporting_idx"

    create_table :participant_job_opportunities, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :funding_program_id
      t.string :employer_name, null: false
      t.string :job_title, null: false
      t.string :location_text
      t.string :employment_type
      t.decimal :hourly_wage, precision: 10, scale: 2
      t.decimal :hours_per_week, precision: 6, scale: 2
      t.string :status, null: false, default: "saved"
      t.string :source
      t.datetime :saved_at, null: false
      t.datetime :applied_at
      t.datetime :interview_at
      t.datetime :offer_at
      t.datetime :closed_at
      t.string :closed_reason
      t.timestamps
    end
    add_index :participant_job_opportunities, %i[organization_id participant_id status updated_at], name: "jobs_pipeline_idx"

    create_table :participant_job_activities, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :job_opportunity_id
      t.string :funding_program_id
      t.string :activity_type, null: false
      t.datetime :activity_date, null: false
      t.string :status, null: false, default: "completed"
      t.string :staff_membership_id
      t.boolean :participant_reported, null: false, default: false
      t.string :evidence_document_id
      t.text :notes
      t.datetime :created_at, null: false
    end

    create_table :participant_job_placements, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :funding_program_id
      t.string :job_opportunity_id
      t.string :employer_name, null: false
      t.string :job_title, null: false
      t.date :start_date, null: false
      t.decimal :hourly_wage, precision: 10, scale: 2
      t.decimal :hours_per_week, precision: 6, scale: 2
      t.string :employment_type
      t.string :verification_method
      t.datetime :verified_at
      t.string :verified_by_membership_id
      t.string :status, null: false, default: "active"
      t.date :end_date
      t.string :end_reason
      t.timestamps
    end

    create_table :participant_retention_checkins, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :job_placement_id, null: false
      t.date :checkin_date, null: false
      t.integer :days_since_start
      t.boolean :still_employed, null: false
      t.decimal :hours_per_week, precision: 6, scale: 2
      t.boolean :wage_changed
      t.text :support_provided
      t.boolean :participant_reported, null: false, default: false
      t.date :next_checkin_date
      t.timestamps
    end

    create_table :participant_product_activities, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :funding_program_id
      t.string :activity_type, null: false
      t.string :status, null: false, default: "completed"
      t.datetime :activity_date, null: false
      t.string :related_document_id
      t.string :related_job_opportunity_id
      t.boolean :staff_verified, null: false, default: false
      t.datetime :created_at, null: false
    end

    create_table :ai_usage_expenses, id: :string do |t|
      t.string :organization_id, null: false
      t.string :participant_id
      t.string :funding_program_id
      t.string :provider, null: false
      t.string :model, null: false
      t.string :feature, null: false
      t.datetime :usage_date, null: false
      t.integer :input_tokens, null: false, default: 0
      t.integer :output_tokens, null: false, default: 0
      t.integer :estimated_cost_cents, null: false, default: 0
      t.integer :invoiced_cost_cents
      t.string :invoice_reference
      t.string :allocation_method
      t.string :grant_review_status, null: false, default: "not_reviewed"
      t.datetime :created_at, null: false
    end
    add_index :ai_usage_expenses, %i[organization_id funding_program_id usage_date feature], name: "ai_expenses_reporting_idx"
  end
end
