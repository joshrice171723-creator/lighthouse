class CreateParticipantApplicationAccounts < ActiveRecord::Migration[7.0]
  def change
    create_table :participant_application_accounts, id: :string do |t|
      t.string :participant_id, null: false
      t.string :organization_id, null: false
      t.string :site_key, null: false
      t.string :status, null: false
      t.timestamps
    end
    add_index :participant_application_accounts, %i[organization_id participant_id site_key], unique: true, name: "index_application_accounts_on_tenant_participant_site"
  end
end
