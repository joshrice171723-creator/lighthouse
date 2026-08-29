class ParticipantProgramEnrollment < LighthouseRecord
  belongs_to :participant, class_name: "ParticipantProfile", foreign_key: :participant_id
  belongs_to :organization

  scope :for_organization, ->(organization_id) { where(organization_id: organization_id) }
  scope :for_participant, ->(participant_id) { where(participant_id: participant_id) }
end
