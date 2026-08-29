class AddApplicationStartedAtToParticipantJobOpportunities < ActiveRecord::Migration[7.1]
  def change
    add_column :participant_job_opportunities, :application_started_at, :datetime
  end
end
