class ParticipantRetentionCheckin < LighthouseRecord
  belongs_to :participant, class_name: "ParticipantProfile", foreign_key: :participant_id
  belongs_to :organization
  belongs_to :job_placement, class_name: "ParticipantJobPlacement", foreign_key: :job_placement_id

  scope :for_organization, ->(organization_id) { where(organization_id: organization_id) }
  scope :for_participant, ->(participant_id) { where(participant_id: participant_id) }
end
