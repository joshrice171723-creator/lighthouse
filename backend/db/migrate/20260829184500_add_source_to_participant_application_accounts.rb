class AddSourceToParticipantApplicationAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :participant_application_accounts, :source, :string, null: false, default: "page_observed"
  end
end
