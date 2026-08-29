class AddApplicationReviewStartedAtToParticipantJobOpportunities < ActiveRecord::Migration[7.1]
  def change
    add_column :participant_job_opportunities, :application_review_started_at, :datetime
  end
end
