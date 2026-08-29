class ParticipantApplicationAccount < LighthouseRecord
  STATUSES = %w[created failed].freeze

  validates :participant_id, :organization_id, :site_key, :status, presence: true
  validates :status, inclusion: { in: STATUSES }
end
