class ParticipantApplicationAccount < LighthouseRecord
  STATUSES = %w[created failed].freeze
  SOURCES = %w[applypilot_create page_observed].freeze

  validates :participant_id, :organization_id, :site_key, :status, :source, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :source, inclusion: { in: SOURCES }
end
