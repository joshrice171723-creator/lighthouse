class ParticipantProductActivity < LighthouseRecord
  belongs_to :participant, class_name: "ParticipantProfile", foreign_key: :participant_id
  belongs_to :organization
  belongs_to :job_opportunity, class_name: "ParticipantJobOpportunity", foreign_key: :related_job_opportunity_id, optional: true

  scope :for_organization, ->(organization_id) { where(organization_id: organization_id) }
  scope :for_participant, ->(participant_id) { where(participant_id: participant_id) }
end
