class CreateInterviewPreparation < ActiveRecord::Migration[8.1]
  def change
    create_table :interview_prep_contexts, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :employment_plan_id
      t.string :job_opportunity_id
      t.string :title, null: false
      t.string :visibility, null: false, default: "private"
      t.string :status, null: false, default: "active"
      t.timestamps
    end
    add_index :interview_prep_contexts, %i[organization_id participant_id updated_at], name: "interview_contexts_scope_idx"

    create_table :interview_prep_sessions, id: :string do |t|
      t.string :context_id, null: false
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :session_type, null: false
      t.string :status, null: false, default: "started"
      t.jsonb :score, null: false, default: {}
      t.datetime :started_at, null: false
      t.datetime :completed_at
    end
    add_index :interview_prep_sessions, %i[organization_id started_at], name: "interview_sessions_reporting_idx"

    create_table :interview_prep_results, id: :string do |t|
      t.string :session_id, null: false
      t.string :context_id, null: false
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :result_type, null: false
      t.string :item_key, null: false
      t.integer :score, null: false, default: 0
      t.integer :confidence
      t.string :improvement_area
      t.text :response_text
      t.datetime :created_at, null: false
    end
    add_index :interview_prep_results, %i[organization_id participant_id result_type created_at], name: "interview_results_scope_idx"
  end
end
